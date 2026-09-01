import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { expireUnpaidOrder } from '@/lib/orders'

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

    const { orderId } = await request.json()
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const { getDb } = await import('@/lib/db')
    const db = await getDb()
    const purchase = await db.collection('purchases').findOne({
      orderId,
      userId: decoded.userId,
      status: 'pending',
    })
    if (!purchase) {
      return NextResponse.json({ error: 'No unpaid listing found' }, { status: 404 })
    }

    const result = await expireUnpaidOrder({ orderId })
    if (!result.ok) {
      return NextResponse.json({ error: 'Unable to release this listing' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
