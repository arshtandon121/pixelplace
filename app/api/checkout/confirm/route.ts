import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getPolar } from '@/lib/polar'
import { expireUnpaidOrder, fulfillPaidOrder } from '@/lib/orders'

export const dynamic = 'force-dynamic'

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

    const { checkoutId } = await request.json()
    if (!checkoutId || typeof checkoutId !== 'string') {
      return NextResponse.json({ error: 'checkoutId is required' }, { status: 400 })
    }

    const polar = getPolar()
    const checkout = await polar.checkouts.get({ id: checkoutId })

    const metadata = checkout.metadata as Record<string, unknown>
    if (metadata?.userId && String(metadata.userId) !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (checkout.status === 'succeeded') {
      const result = await fulfillPaidOrder({
        polarCheckoutId: checkout.id,
        metadata,
      })
      return NextResponse.json({ success: result.ok, status: 'completed', already: result.already === true })
    }

    if (checkout.status === 'expired' || checkout.status === 'failed') {
      await expireUnpaidOrder({ polarCheckoutId: checkout.id, metadata })
      return NextResponse.json({ success: false, status: checkout.status })
    }

    return NextResponse.json({ success: false, status: checkout.status })
  } catch (error) {
    console.error('Checkout confirm error:', error)
    return NextResponse.json({ error: 'Unable to confirm checkout' }, { status: 500 })
  }
}
