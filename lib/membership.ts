import { BLOCK_HEIGHT, BLOCK_WIDTH, MIN_CHECKOUT_INR, PIXEL_PRICE_PER_MONTH } from '@/lib/constants'

export type MembershipPackageId = 'hour' | 'day' | 'week' | 'month' | 'year'

export type MembershipPackage = {
  id: MembershipPackageId
  label: string
  blurb: string
  autoRenew: boolean
  recommended?: boolean
}

export const MEMBERSHIP_PACKAGES: MembershipPackage[] = [
  { id: 'hour', label: '1 Hour', blurb: 'Minimum listing', autoRenew: false },
  { id: 'day', label: '1 Day', blurb: '24 hours', autoRenew: false },
  { id: 'week', label: '1 Week', blurb: '7 days', autoRenew: false },
  { id: 'month', label: '1 Month', blurb: '30 days · renew from dashboard', autoRenew: false, recommended: true },
  { id: 'year', label: '1 Year', blurb: '10 months billed · renew from dashboard', autoRenew: false },
]

export const DEFAULT_PACKAGE_ID: MembershipPackageId = 'month'

const HOURS_IN_PACKAGE: Record<MembershipPackageId, number> = {
  hour: 1,
  day: 24,
  week: 24 * 7,
  month: 24 * 30,
  year: 24 * 30 * 10,
}

const BLOCK_PIXELS = BLOCK_WIDTH * BLOCK_HEIGHT

export function getMembershipPackage(id?: string | null): MembershipPackage {
  return MEMBERSHIP_PACKAGES.find((p) => p.id === id) || MEMBERSHIP_PACKAGES.find((p) => p.id === DEFAULT_PACKAGE_ID)!
}

export function hourlyRateInr(pixelCount: number): number {
  const count = Math.max(0, pixelCount)
  const fromMonthly = (PIXEL_PRICE_PER_MONTH * count) / (30 * 24)
  const minForSelection = MIN_CHECKOUT_INR * (count / BLOCK_PIXELS)
  return Math.max(minForSelection, fromMonthly)
}

export function membershipPriceInr(pixelCount: number, packageId: MembershipPackageId): number {
  const hours = HOURS_IN_PACKAGE[packageId]
  return Math.round(hourlyRateInr(pixelCount) * hours * 100) / 100
}

export function addMembershipDuration(from: Date, packageId: MembershipPackageId): Date {
  const expiresAt = new Date(from)
  switch (packageId) {
    case 'hour':
      expiresAt.setHours(expiresAt.getHours() + 1)
      break
    case 'day':
      expiresAt.setDate(expiresAt.getDate() + 1)
      break
    case 'week':
      expiresAt.setDate(expiresAt.getDate() + 7)
      break
    case 'month':
      expiresAt.setMonth(expiresAt.getMonth() + 1)
      break
    case 'year':
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      break
  }
  return expiresAt
}

export function formatExpiry(expiresAt?: Date | string | null): string {
  if (!expiresAt) return 'Never'
  const date = new Date(expiresAt)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  const diffMs = date.getTime() - Date.now()
  if (diffMs <= 0) return 'Expired'
  if (diffMs < 36 * 60 * 60 * 1000) {
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
