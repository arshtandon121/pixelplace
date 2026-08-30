import { Resend } from 'resend'
import { getAppUrl } from '@/lib/polar'

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || 'PixelPlace <onboarding@resend.dev>'
}

export type PaymentEmailDetails = {
  orderId: string
  polarOrderId?: string
  customerName?: string
  customerEmail?: string
  pixelCount: number
  packageLabel?: string
  tenure?: number
  amount: number
  currency?: string
  kind?: 'purchase' | 'renewal'
}

function money(amount: number): string {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export async function sendPaymentReceivedEmail(details: PaymentEmailDetails): Promise<void> {
  const notifyEmail = process.env.ADMIN_NOTIFY_EMAIL
  const resend = getResend()

  if (!notifyEmail) {
    console.warn('ADMIN_NOTIFY_EMAIL is not set; skipping payment notification')
    return
  }

  if (!resend) {
    console.warn('RESEND_API_KEY is not set; skipping payment notification')
    return
  }

  const isRenewal = details.kind === 'renewal'
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; background:#0b0b0b; color:#f5f5f5; padding:24px;">
      <h1 style="color:#FCF6BA; margin:0 0 12px;">${isRenewal ? 'PixelPlace membership renewed' : 'New PixelPlace payment'}</h1>
      <p style="color:#d4d4d4;">A payment was received and the estate was approved automatically.</p>
      <table style="width:100%; border-collapse:collapse; margin-top:16px;">
        <tr><td style="padding:8px 0; color:#a3a3a3;">Order</td><td>${details.orderId}</td></tr>
        ${details.polarOrderId ? `<tr><td style="padding:8px 0; color:#a3a3a3;">Polar order</td><td>${details.polarOrderId}</td></tr>` : ''}
        <tr><td style="padding:8px 0; color:#a3a3a3;">Customer</td><td>${details.customerName || 'Unknown'} (${details.customerEmail || 'n/a'})</td></tr>
        <tr><td style="padding:8px 0; color:#a3a3a3;">Pixels</td><td>${details.pixelCount}</td></tr>
        <tr><td style="padding:8px 0; color:#a3a3a3;">Plan</td><td>${details.packageLabel || 'Membership'}</td></tr>
        <tr><td style="padding:8px 0; color:#a3a3a3;">Amount</td><td><strong style="color:#FCF6BA;">${money(details.amount)}</strong></td></tr>
      </table>
    </div>
  `

  await resend.emails.send({
    from: fromAddress(),
    to: notifyEmail,
    subject: `${details.kind === 'renewal' ? 'Renewal' : 'Payment received'} — ${money(details.amount)} · ${details.pixelCount} pixels`,
    html,
  })
}

export async function sendCustomerReceiptEmail(details: PaymentEmailDetails): Promise<void> {
  const resend = getResend()
  if (!resend || !details.customerEmail) return

  const site = getAppUrl()
  const name = details.customerName || 'there'
  const replyTo = process.env.ADMIN_NOTIFY_EMAIL || undefined

  await resend.emails.send({
    from: fromAddress(),
    to: details.customerEmail,
    ...(replyTo ? { replyTo } : {}),
    subject: details.kind === 'renewal'
      ? 'Your PixelPlace membership was renewed'
      : 'Thank you — your PixelPlace payment succeeded',
    html: `
      <div style="font-family: Inter, Arial, sans-serif; background:#0b0b0b; color:#f5f5f5; padding:32px;">
        <h1 style="color:#FCF6BA; margin:0 0 16px;">${details.kind === 'renewal' ? 'Membership renewed' : 'Thank you for your payment'}</h1>
        <p style="color:#d4d4d4; line-height:1.6;">Hi ${name}, ${details.kind === 'renewal' ? 'your membership was renewed and your estate stays live.' : 'your payment succeeded and your digital estate is now live on PixelPlace.'}</p>
        <table style="width:100%; border-collapse:collapse; margin:20px 0;">
          <tr><td style="padding:8px 0; color:#a3a3a3;">Pixels</td><td>${details.pixelCount}</td></tr>
          <tr><td style="padding:8px 0; color:#a3a3a3;">Plan</td><td>${details.packageLabel || 'Membership'}</td></tr>
          <tr><td style="padding:8px 0; color:#a3a3a3;">Amount</td><td><strong style="color:#FCF6BA;">${money(details.amount)}</strong></td></tr>
        </table>
        <p style="margin:24px 0;">
          <a href="${site}/dashboard" style="display:inline-block; background:#BF953F; color:#000; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:700;">View your estate</a>
        </p>
        <p style="color:#737373; font-size:13px;">You can also open the live canvas at <a href="${site}/canvas" style="color:#FCF6BA;">pixelplace.in/canvas</a>.</p>
      </div>
    `,
  })
}
