import { Resend } from 'resend'

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
  tenure: number
  amount: number
  currency?: string
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

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; background:#0b0b0b; color:#f5f5f5; padding:24px;">
      <h1 style="color:#FCF6BA; margin:0 0 12px;">New PixelPlace payment</h1>
      <p style="color:#d4d4d4;">A payment was received and the estate was approved automatically.</p>
      <table style="width:100%; border-collapse:collapse; margin-top:16px;">
        <tr><td style="padding:8px 0; color:#a3a3a3;">Order</td><td>${details.orderId}</td></tr>
        ${details.polarOrderId ? `<tr><td style="padding:8px 0; color:#a3a3a3;">Polar order</td><td>${details.polarOrderId}</td></tr>` : ''}
        <tr><td style="padding:8px 0; color:#a3a3a3;">Customer</td><td>${details.customerName || 'Unknown'} (${details.customerEmail || 'n/a'})</td></tr>
        <tr><td style="padding:8px 0; color:#a3a3a3;">Pixels</td><td>${details.pixelCount}</td></tr>
        <tr><td style="padding:8px 0; color:#a3a3a3;">Tenure</td><td>${details.tenure} month(s)</td></tr>
        <tr><td style="padding:8px 0; color:#a3a3a3;">Amount</td><td><strong style="color:#FCF6BA;">${money(details.amount)}</strong></td></tr>
      </table>
    </div>
  `

  await resend.emails.send({
    from: fromAddress(),
    to: notifyEmail,
    subject: `Payment received — ${money(details.amount)} · ${details.pixelCount} pixels`,
    html,
  })
}

export async function sendCustomerReceiptEmail(details: PaymentEmailDetails): Promise<void> {
  const resend = getResend()
  if (!resend || !details.customerEmail) return

  await resend.emails.send({
    from: fromAddress(),
    to: details.customerEmail,
    subject: 'Your PixelPlace estate is live',
    html: `
      <div style="font-family: Inter, Arial, sans-serif; background:#0b0b0b; color:#f5f5f5; padding:24px;">
        <h1 style="color:#FCF6BA; margin:0 0 12px;">Payment confirmed</h1>
        <p>Hi ${details.customerName || 'there'}, your digital estate is now live on PixelPlace.</p>
        <p><strong>${details.pixelCount}</strong> pixels for <strong>${details.tenure}</strong> month(s) — ${money(details.amount)}</p>
      </div>
    `,
  })
}
