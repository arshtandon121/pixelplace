import { NextRequest, NextResponse } from 'next/server'
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks'
import { expireUnpaidOrder, fulfillPaidOrder, revokeMembership } from '@/lib/orders'
import { getPolarWebhookSecret } from '@/lib/polar'

export const dynamic = 'force-dynamic'

function headerMap(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })
  return headers
}

export async function POST(request: NextRequest) {
  let secret: string
  try {
    secret = getPolarWebhookSecret()
  } catch {
    console.error('Polar webhook secret is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const body = await request.text()

  try {
    const event = validateEvent(body, headerMap(request), secret)

    switch (event.type) {
      case 'order.paid': {
        const order = event.data
        const result = await fulfillPaidOrder({
          polarOrderId: order.id,
          polarCheckoutId: order.checkoutId,
          polarSubscriptionId: order.subscriptionId,
          billingReason: order.billingReason,
          metadata: order.metadata,
        })
        if (!result.ok && result.reason === 'not_found') {
          console.error('Paid Polar order had no matching purchase', order.id, order.checkoutId, order.metadata)
        }
        break
      }
      case 'checkout.updated': {
        if (event.data.status === 'succeeded') {
          await fulfillPaidOrder({
            polarCheckoutId: event.data.id,
            metadata: event.data.metadata,
          })
        }
        if (event.data.status === 'expired') {
          await expireUnpaidOrder({
            polarCheckoutId: event.data.id,
            metadata: event.data.metadata,
          })
        }
        break
      }
      case 'checkout.expired': {
        await expireUnpaidOrder({
          polarCheckoutId: event.data.id,
          metadata: event.data.metadata,
        })
        break
      }
      case 'subscription.revoked': {
        await revokeMembership(event.data.id)
        break
      }
      default:
        break
    }

    return new NextResponse(null, { status: 202 })
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }
    console.error('Polar webhook error:', error)
    return new NextResponse(null, { status: 202 })
  }
}
