import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getDodo } from '@/lib/dodo'
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

    const body = await request.json()
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : body.checkoutId
    const paymentId = typeof body.paymentId === 'string' ? body.paymentId : undefined

    if (!sessionId && !paymentId) {
      return NextResponse.json({ error: 'sessionId or paymentId is required' }, { status: 400 })
    }

    const dodo = getDodo()
    let resolvedPaymentId = paymentId
    let paymentStatus: string | null | undefined

    if (sessionId) {
      const session = await dodo.checkoutSessions.retrieve(sessionId)
      resolvedPaymentId = session.payment_id || resolvedPaymentId
      paymentStatus = session.payment_status
    }

    if (resolvedPaymentId) {
      const payment = await dodo.payments.retrieve(resolvedPaymentId)
      const metadata = (payment.metadata || {}) as Record<string, unknown>
      if (metadata.user_id && String(metadata.user_id) !== decoded.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      if (payment.status === 'succeeded') {
        const result = await fulfillPaidOrder({
          dodoPaymentId: payment.payment_id,
          dodoSessionId: payment.checkout_session_id || sessionId,
          dodoSubscriptionId: payment.subscription_id,
          dodoCustomerId: payment.customer?.customer_id,
          metadata,
        })
        return NextResponse.json({ success: result.ok, status: 'completed', already: result.already === true })
      }

      if (payment.status === 'failed' || payment.status === 'cancelled') {
        await expireUnpaidOrder({
          dodoPaymentId: payment.payment_id,
          dodoSessionId: payment.checkout_session_id || sessionId,
          metadata,
        })
        return NextResponse.json({ success: false, status: payment.status })
      }

      return NextResponse.json({ success: false, status: payment.status || paymentStatus || 'processing' })
    }

    if (paymentStatus === 'succeeded') {
      const result = await fulfillPaidOrder({ dodoSessionId: sessionId })
      return NextResponse.json({ success: result.ok, status: result.ok ? 'completed' : 'processing' })
    }

    if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
      await expireUnpaidOrder({ dodoSessionId: sessionId })
      return NextResponse.json({ success: false, status: paymentStatus })
    }

    return NextResponse.json({ success: false, status: paymentStatus || 'processing' })
  } catch (error) {
    console.error('Checkout confirm error:', error)
    return NextResponse.json({ error: 'Unable to confirm checkout' }, { status: 500 })
  }
}
