import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getUserById } from '@/lib/auth'
import { checkPixelsAvailable } from '@/lib/pixels'
import { getDb } from '@/lib/db'
import { storeImage, base64ToBuffer } from '@/lib/imageStorage'
import { getAppUrl, getDodo, getDodoProductId, toDodoAmount } from '@/lib/dodo'
import {
  addMembershipDuration,
  getMembershipPackage,
  membershipPriceInr,
  type MembershipPackageId,
} from '@/lib/membership'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await getUserById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const body = await request.json()
    const { imageUrl, linkUrl, renewOrderId, packageId: rawPackageId } = body
    const pkg = getMembershipPackage(rawPackageId)
    const packageId = pkg.id as MembershipPackageId

    const db = await getDb()
    let pixels = body.pixels
    let imageFileId: string | undefined
    let finalImageUrl: string | undefined
    let existingPurchase: any = null

    if (renewOrderId) {
      existingPurchase = await db.collection('purchases').findOne({
        orderId: renewOrderId,
        userId: decoded.userId,
        status: 'completed',
      })
      if (!existingPurchase) {
        return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
      }
      pixels = existingPurchase.coordinates
      imageFileId = existingPurchase.imageFileId
      finalImageUrl = existingPurchase.imageUrl
    } else {
      if (!pixels || !Array.isArray(pixels) || pixels.length === 0) {
        return NextResponse.json({ error: 'Invalid pixels data' }, { status: 400 })
      }
      if (!imageUrl) {
        return NextResponse.json({ error: 'Image is required before payment' }, { status: 400 })
      }

      const available = await checkPixelsAvailable(pixels)
      if (!available) {
        return NextResponse.json({ error: 'Some selected pixels are already purchased' }, { status: 400 })
      }

      if (imageUrl.startsWith('data:image')) {
        try {
          const { buffer } = base64ToBuffer(imageUrl)
          imageFileId = await storeImage(buffer, `pixel_image_${decoded.userId}_${Date.now()}.png`)
        } catch (error) {
          console.error('Image storage error:', error)
          return NextResponse.json({ error: 'Failed to process image' }, { status: 500 })
        }
      } else {
        finalImageUrl = imageUrl
      }
    }

    const totalAmount = membershipPriceInr(pixels.length, packageId)
    const unitPrice = totalAmount / pixels.length
    const orderId = `dodo_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    const now = new Date()
    const baseExpiry = renewOrderId && existingPurchase?.expiresAt && new Date(existingPurchase.expiresAt) > now
      ? new Date(existingPurchase.expiresAt)
      : now
    const expiresAt = addMembershipDuration(baseExpiry, packageId)

    await db.collection('purchases').insertOne({
      userId: decoded.userId,
      orderId,
      pixelCount: pixels.length,
      coordinates: pixels,
      purchasedAt: now,
      packageId,
      packageLabel: pkg.label,
      autoRenew: false,
      tenure: packageId,
      amount: totalAmount,
      currency: 'INR',
      imageUrl: finalImageUrl ?? existingPurchase?.imageUrl,
      imageFileId,
      linkUrl: linkUrl || existingPurchase?.linkUrl,
      provider: 'dodo',
      status: 'pending',
      renewsOrderId: renewOrderId || undefined,
    })

    if (!renewOrderId) {
      const bulkOps = pixels.map((p: { x: number; y: number }) => ({
        updateOne: {
          filter: { x: p.x, y: p.y },
          update: {
            $set: {
              userId: decoded.userId,
              imageUrl: finalImageUrl,
              imageFileId,
              linkUrl: linkUrl || undefined,
              purchasedAt: now,
              expiresAt,
              price: unitPrice,
              status: 'pending',
              packageId,
            },
          },
          upsert: true,
        },
      }))
      await db.collection('pixels').bulkWrite(bulkOps)
    }

    const appUrl = getAppUrl()
    const dodo = getDodo()

    try {
      const session = await dodo.checkoutSessions.create({
        product_cart: [
          {
            product_id: getDodoProductId(),
            quantity: 1,
            amount: toDodoAmount(totalAmount),
          },
        ],
        customer: {
          email: user.email,
          name: user.name,
        },
        billing_currency: 'INR',
        return_url: `${appUrl}/dashboard`,
        cancel_url: `${appUrl}/canvas`,
        customization: { theme: 'dark' },
        feature_flags: { redirect_immediately: true },
        metadata: {
          order_id: orderId,
          user_id: decoded.userId,
          pixel_count: String(pixels.length),
          package_id: packageId,
          ...(renewOrderId ? { renew_order_id: String(renewOrderId) } : {}),
        },
      })

      await db.collection('purchases').updateOne(
        { orderId },
        { $set: { dodoSessionId: session.session_id, dodoCheckoutUrl: session.checkout_url } }
      )

      if (!session.checkout_url) {
        throw new Error('Dodo checkout URL missing')
      }

      return NextResponse.json({
        success: true,
        orderId,
        checkoutUrl: session.checkout_url,
        checkoutId: session.session_id,
      })
    } catch (error: any) {
      console.error('Dodo checkout create failed:', error)

      if (!renewOrderId) {
        await db.collection('pixels').bulkWrite(
          pixels.map((p: { x: number; y: number }) => ({
            deleteOne: { filter: { x: p.x, y: p.y, userId: decoded.userId, status: 'pending' } },
          }))
        )
      }
      await db.collection('purchases').updateOne(
        { orderId },
        { $set: { status: 'expired', updatedAt: new Date(), dodoError: error?.message || 'checkout_failed' } }
      )

      return NextResponse.json(
        { error: 'Unable to start checkout. Please try again.' },
        { status: 502 }
      )
    }
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
