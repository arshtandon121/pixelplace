import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getUserById } from '@/lib/auth'
import { checkPixelsAvailable } from '@/lib/pixels'
import { PIXEL_PRICE_PER_MONTH } from '@/lib/constants'
import { getDb } from '@/lib/db'
import { storeImage, base64ToBuffer } from '@/lib/imageStorage'
import { getAppUrl, getPolar, getPolarProductId, polarCheckoutPrices } from '@/lib/polar'

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

    const { pixels, imageUrl, linkUrl, tenure = 1 } = await request.json()

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

    const unitPrice = PIXEL_PRICE_PER_MONTH * tenure
    const totalAmount = unitPrice * pixels.length

    let imageFileId: string | undefined
    let finalImageUrl: string | undefined

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

    const db = await getDb()
    const orderId = `polar_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + (tenure || 1))

    await db.collection('purchases').insertOne({
      userId: decoded.userId,
      orderId,
      pixelCount: pixels.length,
      coordinates: pixels,
      purchasedAt: new Date(),
      tenure,
      amount: totalAmount,
      currency: 'INR',
      imageUrl: finalImageUrl,
      imageFileId,
      linkUrl: linkUrl || undefined,
      provider: 'polar',
      status: 'pending',
    })

    const bulkOps = pixels.map((p: { x: number; y: number }) => ({
      updateOne: {
        filter: { x: p.x, y: p.y },
        update: {
          $set: {
            userId: decoded.userId,
            imageUrl: finalImageUrl,
            imageFileId,
            linkUrl: linkUrl || undefined,
            purchasedAt: new Date(),
            expiresAt,
            price: unitPrice,
            status: 'pending',
          },
        },
        upsert: true,
      },
    }))

    await db.collection('pixels').bulkWrite(bulkOps)

    const productId = getPolarProductId()
    const polar = getPolar()
    const appUrl = getAppUrl()
    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    const customerIp = forwardedFor || request.headers.get('x-real-ip') || undefined

    try {
      const checkout = await polar.checkouts.create({
        products: [productId],
        prices: polarCheckoutPrices(productId, totalAmount),
        successUrl: `${appUrl}/dashboard?checkout_id={CHECKOUT_ID}`,
        returnUrl: `${appUrl}/canvas`,
        customerEmail: user.email,
        customerName: user.name,
        externalCustomerId: decoded.userId,
        customerIpAddress: customerIp,
        metadata: {
          orderId,
          userId: decoded.userId,
          pixelCount: pixels.length,
          tenure,
        },
      })

      await db.collection('purchases').updateOne(
        { orderId },
        { $set: { polarCheckoutId: checkout.id, polarCheckoutUrl: checkout.url } }
      )

      const checkoutUrl = checkout.url.includes('?')
        ? `${checkout.url}&theme=dark`
        : `${checkout.url}?theme=dark`

      return NextResponse.json({ success: true, orderId, checkoutUrl, checkoutId: checkout.id })
    } catch (error: any) {
      console.error('Polar checkout create failed:', error)

      await db.collection('pixels').bulkWrite(
        pixels.map((p: { x: number; y: number }) => ({
          deleteOne: { filter: { x: p.x, y: p.y, userId: decoded.userId, status: 'pending' } },
        }))
      )
      await db.collection('purchases').updateOne(
        { orderId },
        { $set: { status: 'expired', updatedAt: new Date(), polarError: error?.message || 'checkout_failed' } }
      )

      return NextResponse.json(
        { error: 'Unable to start Polar checkout. Please try again.' },
        { status: 502 }
      )
    }
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
