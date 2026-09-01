import { PIXEL_PRICE_PER_MONTH } from '@/lib/constants'

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
  { id: 'day', label: '1 Day', blurb: 'Short campaign', autoRenew: false },
  { id: 'week', label: '1 Week', blurb: 'Weekly drop', autoRenew: false },
  { id: 'month', label: '1 Month', blurb: 'Renew from dashboard', autoRenew: false, recommended: true },
  { id: 'year', label: '1 Year', blurb: '2 months free · renew from dashboard', autoRenew: false },
]

export const DEFAULT_PACKAGE_ID: MembershipPackageId = 'month'
export const POLAR_MIN_INR = 60

export function getMembershipPackage(id?: string | null): MembershipPackage {
  return MEMBERSHIP_PACKAGES.find((p) => p.id === id) || MEMBERSHIP_PACKAGES.find((p) => p.id === DEFAULT_PACKAGE_ID)!
}

export function membershipPriceInr(pixelCount: number, packageId: MembershipPackageId): number {
  const monthly = PIXEL_PRICE_PER_MONTH * pixelCount
  const raw = {
    hour: monthly / (30 * 24),
    day: monthly / 30,
    week: monthly * (7 / 30),
    month: monthly,
    year: monthly * 10,
  }[packageId]
  return Math.max(POLAR_MIN_INR, Math.round(raw * 100) / 100)
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
