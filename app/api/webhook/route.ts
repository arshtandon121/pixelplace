import { NextRequest, NextResponse } from 'next/server'
import { purchasePixel } from '@/lib/pixels'
import { getDb } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id, payment_id, signature, notes } = body

    if (!order_id || !payment_id || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify payment signature
    const { verifyPaymentSignature } = await import('@/lib/razorpay')
    const isValid = verifyPaymentSignature(order_id, payment_id, signature)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Process pixel purchase
    const coordinates = JSON.parse(notes.coordinates)
    const userId = notes.userId
    const imageUrl = notes.imageUrl || undefined
    const linkUrl = notes.linkUrl || undefined

    // Purchase all pixels with image and link
    for (const coord of coordinates) {
      await purchasePixel(coord.x, coord.y, userId, imageUrl, linkUrl)
    }

    // Store purchase record
    const db = await getDb()
    await db.collection('purchases').insertOne({
      userId,
      orderId: order_id,
      paymentId: payment_id,
      pixelCount: parseInt(notes.pixelCount),
      coordinates,
      purchasedAt: new Date(),
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

