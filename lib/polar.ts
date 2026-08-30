import { Polar } from '@polar-sh/sdk'

export function getPolarServer(): 'sandbox' | 'production' {
  return process.env.POLAR_SERVER === 'sandbox' ? 'sandbox' : 'production'
}

export function getPolarAccessToken(): string {
  const server = getPolarServer()
  const token =
    server === 'sandbox'
      ? process.env.SANDBOX_POLAR_TOKEN || process.env.POLAR_ACCESS_TOKEN
      : process.env.POLAR_ACCESS_TOKEN

  if (!token) {
    throw new Error('Polar access token is not configured')
  }
  return token
}

export function getPolar(): Polar {
  return new Polar({
    accessToken: getPolarAccessToken(),
    server: getPolarServer(),
  })
}

export function getPolarProductId(packageId?: string): string {
  const server = getPolarServer()
  const isSandbox = server === 'sandbox'
  const monthly =
    isSandbox
      ? process.env.POLAR_SANDBOX_MONTHLY_PRODUCT_ID || process.env.POLAR_MONTHLY_PRODUCT_ID
      : process.env.POLAR_MONTHLY_PRODUCT_ID
  const yearly =
    isSandbox
      ? process.env.POLAR_SANDBOX_YEARLY_PRODUCT_ID || process.env.POLAR_YEARLY_PRODUCT_ID
      : process.env.POLAR_YEARLY_PRODUCT_ID
  const oneTime =
    isSandbox
      ? process.env.POLAR_SANDBOX_PRODUCT_ID || process.env.POLAR_PRODUCT_ID
      : process.env.POLAR_PRODUCT_ID

  if (packageId === 'month' && monthly) return monthly
  if (packageId === 'year' && yearly) return yearly
  if (!oneTime) {
    throw new Error('Polar product ID is not configured')
  }
  return oneTime
}

export function getPolarWebhookSecret(): string {
  const server = getPolarServer()
  const secret =
    server === 'sandbox'
      ? process.env.POLAR_SANDBOX_WEBHOOK_SECRET || process.env.POLAR_WEBHOOK_SECRET
      : process.env.POLAR_WEBHOOK_SECRET

  if (!secret) {
    throw new Error('Polar webhook secret is not configured')
  }
  return secret
}

export function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (configured && !configured.includes('localhost')) return configured
  if (process.env.VERCEL) return 'https://www.pixelplace.in'
  return configured || 'http://localhost:3000'
}

export function toPolarAmount(majorUnits: number): number {
  return Math.round(Number(majorUnits) * 100)
}

/** Polar requires the org default currency (USD) in prices. INR is also sent so Indian buyers can pay in rupees. */
export function polarCheckoutPrices(productId: string, inrMajor: number) {
  const inrPaise = toPolarAmount(inrMajor)
  const usdCents = Math.max(50, Math.round((Number(inrMajor) / 83) * 100))
  return {
    [productId]: [
      { amountType: 'fixed' as const, priceAmount: usdCents, priceCurrency: 'usd' as const },
      { amountType: 'fixed' as const, priceAmount: inrPaise, priceCurrency: 'inr' as const },
    ],
  }
}
