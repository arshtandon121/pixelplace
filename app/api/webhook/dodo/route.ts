import { NextRequest, NextResponse } from 'next/server'
import { getDodo, getDodoWebhookSecret } from '@/lib/dodo'
import { expireUnpaidOrder, fulfillPaidOrder, revokeMembership } from '@/lib/orders'

export const dynamic = 'force-dynamic'

function headerMap(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })
  return headers
}

export async function POST(request: NextRequest) {
  const secret = getDodoWebhookSecret()
  if (!secret) {
    console.error('Dodo webhook secret is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const body = await request.text()

  try {
    const event = getDodo().webhooks.unwrap(body, { headers: headerMap(request), key: secret })

    switch (event.type) {
      case 'payment.succeeded': {
        const payment = event.data
        const result = await fulfillPaidOrder({
          dodoPaymentId: payment.payment_id,
          dodoSessionId: payment.checkout_session_id,
          dodoSubscriptionId: payment.subscription_id,
          dodoCustomerId: payment.customer?.customer_id,
          billingReason: payment.subscription_id && payment.retry_attempt > 0 ? 'subscription_cycle' : undefined,
          metadata: payment.metadata,
        })
        if (!result.ok && result.reason === 'not_found') {
          console.error('Paid Dodo payment had no matching purchase', payment.payment_id, payment.metadata)
        }
        break
      }
      case 'payment.failed':
      case 'payment.cancelled': {
        await expireUnpaidOrder({
          dodoPaymentId: event.data.payment_id,
          dodoSessionId: event.data.checkout_session_id,
          metadata: event.data.metadata,
        })
        break
      }
      case 'subscription.renewed': {
        await fulfillPaidOrder({
          dodoSubscriptionId: event.data.subscription_id,
          metadata: event.data.metadata,
          billingReason: 'subscription_cycle',
        })
        break
      }
      case 'subscription.cancelled':
      case 'subscription.expired': {
        if (event.data.subscription_id) {
          await revokeMembership(event.data.subscription_id)
        }
        break
      }
      default:
        break
    }

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error('Dodo webhook error:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }
}
