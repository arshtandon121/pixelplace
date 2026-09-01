import DodoPayments from 'dodopayments'

export function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (configured && !configured.includes('localhost')) return configured
  if (process.env.VERCEL) return 'https://www.pixelplace.in'
  return configured || 'http://localhost:3000'
}

export function getDodoApiKey(): string {
  const key = process.env.DODO_API_KEY || process.env.DODO_PAYMENTS_API_KEY
  if (!key) {
    throw new Error('Dodo API key is not configured')
  }
  return key
}

export function getDodoEnvironment(): 'live_mode' | 'test_mode' {
  const explicit = process.env.DODO_ENVIRONMENT
  if (explicit === 'test_mode' || explicit === 'test') return 'test_mode'
  if (explicit === 'live_mode' || explicit === 'live') return 'live_mode'
  return process.env.VERCEL ? 'live_mode' : 'test_mode'
}

export function getDodoProductId(): string {
  const id = process.env.DODO_PRODUCT_ID
  if (!id) {
    throw new Error('DODO_PRODUCT_ID is not configured')
  }
  return id
}

export function getDodoWebhookSecret(): string | null {
  return process.env.DODO_WEBHOOK_SECRET || process.env.DODO_WEBHOOK_KEY || process.env.DODO_PAYMENTS_WEBHOOK_KEY || null
}

export function getDodo(): DodoPayments {
  return new DodoPayments({
    bearerToken: getDodoApiKey(),
    environment: getDodoEnvironment(),
    webhookKey: getDodoWebhookSecret(),
  })
}

export function toDodoAmount(majorUnits: number): number {
  return Math.round(Number(majorUnits) * 100)
}
