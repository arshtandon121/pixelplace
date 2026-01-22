import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { checkPixelsAvailable } from '@/lib/pixels'
import { createRazorpayOrder } from '@/lib/razorpay'
import { PIXEL_PRICE_PER_MONTH } from '@/lib/constants'
import { getDb } from '@/lib/db'
import { storeImage, base64ToBuffer } from '@/lib/imageStorage'

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

    const { pixels, imageUrl, linkUrl, tenure = 1 } = await request.json()

    if (!pixels || !Array.isArray(pixels) || pixels.length === 0) {
      return NextResponse.json(
        { error: 'Invalid pixels data' },
        { status: 400 }
      )
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Please upload an image first' },
        { status: 400 }
      )
    }

    const available = await checkPixelsAvailable(pixels)
    if (!available) {
      return NextResponse.json(
        { error: 'Some selected pixels are already purchased' },
        { status: 400 }
      )
    }

    // PIXEL_PRICE_PER_MONTH is in INR (or base currency)
    // Tenure is in months
    const totalAmount = pixels.length * PIXEL_PRICE_PER_MONTH * tenure

    // Amount is already in INR based on our constant, but Razorpay expects paise (multiply by 100)
    // However, the previous code multiplied by 83 suggesting PIXEL_PRICE was in USD.
    // Now PIXEL_PRICE_PER_MONTH is in INR (e.g. 10).
    const amountInPaise = totalAmount * 100

    // Store image in GridFS if it's base64 (large)
    let imageFileId: string | undefined = undefined
    let finalImageUrl: string | undefined = undefined

    if (imageUrl) {
      // Check if it's a base64 data URL (large)
      if (imageUrl.startsWith('data:image')) {
        try {
          const { buffer } = base64ToBuffer(imageUrl)
          // Store in GridFS if larger than 100KB
          if (buffer.length > 100 * 1024) {
            imageFileId = await storeImage(
              buffer,
              `pixel_image_${decoded.userId}_${Date.now()}.png`
            )
            console.log('Stored large image in GridFS:', imageFileId)
          } else {
            // Small images can stay as base64
            finalImageUrl = imageUrl
          }
        } catch (error) {
          console.error('Error processing image:', error)
          // Fallback to storing as base64
          finalImageUrl = imageUrl
        }
      } else {
        // External URL, use as is
        finalImageUrl = imageUrl
      }
    }

    // Store order data temporarily in database
    const db = await getDb()
    const tempOrderId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await db.collection('pending_orders').insertOne({
      tempOrderId,
      userId: decoded.userId,
      pixels,
      tenure, // Store tenure
      imageFileId, // GridFS file ID if stored there
      imageUrl: finalImageUrl, // Base64 or external URL if small/external
      linkUrl: linkUrl || undefined,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // Expires in 30 minutes
    })

    // Create Razorpay order without imageUrl (to avoid 20KB limit)
    // Pass totalAmount in INR, as createRazorpayOrder handles the conversion to paise
    const order = await createRazorpayOrder(
      totalAmount,
      pixels.length,
      decoded.userId,
      pixels,
      undefined, // Don't pass imageUrl here
      linkUrl
    )

    // Link the temp order with Razorpay order
    await db.collection('pending_orders').updateOne(
      { tempOrderId },
      { $set: { razorpayOrderId: order.orderId } }
    )

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    if (!keyId) {
      return NextResponse.json(
        { error: 'Razorpay key ID is not configured. Please set NEXT_PUBLIC_RAZORPAY_KEY_ID in your environment variables.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      keyId,
      tempOrderId, // Return tempOrderId so client can use it
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

