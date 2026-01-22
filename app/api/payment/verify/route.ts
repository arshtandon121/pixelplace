import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { verifyPaymentSignature, getRazorpay } from '@/lib/razorpay'
import { getDb } from '@/lib/db'
import { getImage, bufferToBase64 } from '@/lib/imageStorage'
import { PIXEL_PRICE_PER_MONTH } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { orderId, paymentId, signature, pixels, imageUrl, linkUrl, tempOrderId } = await request.json()

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: 'Missing payment details' },
        { status: 400 }
      )
    }

    // Verify payment signature
    const isValid = verifyPaymentSignature(orderId, paymentId, signature)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // Get imageUrl and linkUrl from temporary storage or request
    let finalImageUrl = imageUrl
    let finalLinkUrl = linkUrl

    // Try to get from temporary storage first
    let tenure = 1 // Default to 1 month if not found

    if (tempOrderId) {
      const db = await getDb()
      const pendingOrder = await db.collection('pending_orders').findOne({
        $or: [
          { tempOrderId },
          { razorpayOrderId: orderId }
        ]
      })

      if (pendingOrder) {
        tenure = pendingOrder.tenure || 1
        // If image was stored in GridFS, retrieve it
        if (pendingOrder.imageFileId) {
          const imageBuffer = await getImage(pendingOrder.imageFileId)
          if (imageBuffer) {
            finalImageUrl = bufferToBase64(imageBuffer)
          }
        } else {
          finalImageUrl = finalImageUrl || pendingOrder.imageUrl
        }
        finalLinkUrl = finalLinkUrl || pendingOrder.linkUrl

        // Clean up temporary order
        await db.collection('pending_orders').deleteOne({ _id: pendingOrder._id })
      }
    }

    // Fallback: try to get from Razorpay order notes (for linkUrl only, imageUrl won't be there)
    if (!finalLinkUrl) {
      const razorpay = getRazorpay()
      try {
        const order = await razorpay.orders.fetch(orderId)
        if (order.notes?.linkUrl) {
          finalLinkUrl = order.notes.linkUrl
        }
      } catch (e) {
        console.error('Error fetching order:', e)
      }
    }

    if (!finalImageUrl) {
      return NextResponse.json(
        { error: 'Image data not found. Please try again.' },
        { status: 400 }
      )
    }

    // Store image in GridFS if it's large base64, otherwise store directly
    let imageFileId: string | undefined = undefined
    let storedImageUrl: string | undefined = finalImageUrl

    if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
      try {
        const { storeImage, base64ToBuffer } = await import('@/lib/imageStorage')
        const { buffer } = base64ToBuffer(finalImageUrl)

        // Store in GridFS if larger than 50KB
        if (buffer.length > 50 * 1024) {
          imageFileId = await storeImage(
            buffer,
            `pixel_${decoded.userId}_${Date.now()}.png`
          )
          storedImageUrl = undefined // Don't store base64 if we have GridFS ID
          console.log('Stored large image in GridFS:', imageFileId)
        }
      } catch (error) {
        console.error('Error storing image in GridFS:', error)
        // Fallback to storing as base64
      }
    }

    // Calculate expiry date
    // 1 month = 30 days approximation
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (tenure * 30))

    // Process pixel purchase with image and link - batch update for better performance
    const db = await getDb()
    const bulkOps = pixels.map((coord: { x: number; y: number }) => ({
      updateOne: {
        filter: { x: coord.x, y: coord.y },
        update: {
          $set: {
            x: coord.x,
            y: coord.y,
            userId: decoded.userId,
            imageUrl: storedImageUrl,
            imageFileId: imageFileId,
            linkUrl: finalLinkUrl,
            purchasedAt: new Date(),
            expiresAt: expiresAt,
            price: PIXEL_PRICE_PER_MONTH, // Record the monthly rate
            tenure: tenure
          },
        },
        upsert: true,
      },
    }))

    await db.collection('pixels').bulkWrite(bulkOps)

    // Store purchase record
    await db.collection('purchases').insertOne({
      userId: decoded.userId,
      orderId,
      paymentId,
      pixelCount: pixels.length,
      coordinates: pixels,
      purchasedAt: new Date(),
      expiresAt: expiresAt,
      tenure: tenure
    })

    return NextResponse.json({ success: true, message: 'Payment verified and pixels purchased' })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

