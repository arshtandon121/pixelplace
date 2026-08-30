import { getDb } from '@/lib/db'
import { getUserById } from '@/lib/auth'
import { sendCustomerReceiptEmail, sendPaymentReceivedEmail } from '@/lib/email'
import {
  addMembershipDuration,
  getMembershipPackage,
  type MembershipPackageId,
} from '@/lib/membership'

export type PurchaseStatus = 'pending' | 'completed' | 'expired' | 'rejected'

function metadataValue(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key]
  if (value === undefined || value === null || value === '') return undefined
  return String(value)
}

export async function findPurchase(params: {
  orderId?: string | null
  polarCheckoutId?: string | null
  polarOrderId?: string | null
  polarSubscriptionId?: string | null
  metadata?: Record<string, unknown>
}) {
  const db = await getDb()
  const clauses: Record<string, string>[] = []

  const metaOrderId = metadataValue(params.metadata, 'orderId')
  if (params.orderId) clauses.push({ orderId: params.orderId })
  if (metaOrderId) clauses.push({ orderId: metaOrderId })
  if (params.polarCheckoutId) clauses.push({ polarCheckoutId: params.polarCheckoutId })
  if (params.polarOrderId) clauses.push({ polarOrderId: params.polarOrderId })
  if (params.polarSubscriptionId) clauses.push({ polarSubscriptionId: params.polarSubscriptionId })

  if (clauses.length === 0) return null

  return db.collection('purchases').findOne({ $or: clauses })
}

function unitPrice(purchase: any): number {
  const count = Number(purchase.pixelCount || purchase.coordinates?.length || 0)
  const amount = Number(purchase.amount || 0)
  if (count > 0 && amount > 0) return amount / count
  return amount
}

function resolveExpiry(purchase: any, packageId: MembershipPackageId, from: Date = new Date()): Date {
  const stored = purchase.expiresAt ? new Date(purchase.expiresAt) : null
  if (stored && !Number.isNaN(stored.getTime()) && stored > from) return stored
  return addMembershipDuration(from, packageId)
}

async function activatePixels(purchase: any, expiresAt: Date) {
  const db = await getDb()
  const pixels = purchase.coordinates
  if (!Array.isArray(pixels) || pixels.length === 0) return

  const price = unitPrice(purchase)
  await db.collection('pixels').bulkWrite(
    pixels.map((p: { x: number; y: number }) => ({
      updateOne: {
        filter: { x: p.x, y: p.y },
        update: {
          $set: {
            userId: purchase.userId,
            imageUrl: purchase.imageUrl,
            imageFileId: purchase.imageFileId,
            linkUrl: purchase.linkUrl,
            purchasedAt: purchase.purchasedAt || new Date(),
            expiresAt,
            price,
            status: 'active',
            packageId: purchase.packageId,
          },
        },
        upsert: true,
      },
    }))
  )
}

export async function extendMembership(purchase: any, polarSubscriptionId?: string | null) {
  const db = await getDb()
  const packageId = (purchase.packageId || 'month') as MembershipPackageId
  const now = new Date()
  const currentExpiry = purchase.expiresAt ? new Date(purchase.expiresAt) : now
  const from = currentExpiry > now ? currentExpiry : now
  const expiresAt = addMembershipDuration(from, packageId)

  await activatePixels(purchase, expiresAt)
  await db.collection('purchases').updateOne(
    { _id: purchase._id },
    {
      $set: {
        status: 'completed',
        expiresAt,
        lastRenewedAt: now,
        polarSubscriptionId: polarSubscriptionId || purchase.polarSubscriptionId,
        updatedAt: now,
      },
    }
  )

  try {
    const user = await getUserById(purchase.userId)
    const pkg = getMembershipPackage(packageId)
    void Promise.all([
      sendPaymentReceivedEmail({
        orderId: purchase.orderId,
        polarOrderId: purchase.polarOrderId,
        customerName: user?.name,
        customerEmail: user?.email,
        pixelCount: purchase.pixelCount || 0,
        packageLabel: pkg.label,
        amount: purchase.amount || 0,
        kind: 'renewal',
      }),
      sendCustomerReceiptEmail({
        orderId: purchase.orderId,
        polarOrderId: purchase.polarOrderId,
        customerName: user?.name,
        customerEmail: user?.email,
        pixelCount: purchase.pixelCount || 0,
        packageLabel: pkg.label,
        amount: purchase.amount || 0,
        kind: 'renewal',
      }),
    ]).catch((error) => console.error('Renewal email failed:', error))
  } catch (error) {
    console.error('Renewal email failed:', error)
  }

  return { ok: true, extended: true }
}

export async function fulfillPaidOrder(params: {
  orderId?: string | null
  polarCheckoutId?: string | null
  polarOrderId?: string | null
  polarSubscriptionId?: string | null
  billingReason?: string | null
  metadata?: Record<string, unknown>
}): Promise<{ ok: boolean; already?: boolean; reason?: string; extended?: boolean }> {
  const purchase = await findPurchase(params)
  if (!purchase) {
    return { ok: false, reason: 'not_found' }
  }

  const isCycle = params.billingReason === 'subscription_cycle'
  if (purchase.status === 'completed' && isCycle) {
    return extendMembership(purchase, params.polarSubscriptionId)
  }

  if (purchase.status === 'completed') {
    return { ok: true, already: true }
  }

  const packageId = (purchase.packageId || metadataValue(params.metadata, 'packageId') || 'month') as MembershipPackageId
  const pkg = getMembershipPackage(packageId)
  const now = new Date()
  const db = await getDb()

  const original = purchase.renewsOrderId
    ? await db.collection('purchases').findOne({
        orderId: purchase.renewsOrderId,
        userId: purchase.userId,
      })
    : null

  const base = original && original.expiresAt && new Date(original.expiresAt) > now
    ? new Date(original.expiresAt)
    : now
  const expiresAt = resolveExpiry(purchase, packageId, base)

  await activatePixels({ ...purchase, packageId, coordinates: original?.coordinates || purchase.coordinates }, expiresAt)

  if (original) {
    await db.collection('purchases').updateOne(
      { _id: original._id },
      {
        $set: {
          expiresAt,
          lastRenewedAt: now,
          packageId,
          packageLabel: pkg.label,
          autoRenew: pkg.autoRenew,
          polarSubscriptionId: params.polarSubscriptionId || original.polarSubscriptionId,
          updatedAt: now,
        },
      }
    )
  }

  await db.collection('purchases').updateOne(
    { _id: purchase._id },
    {
      $set: {
        status: 'completed',
        paidAt: now,
        expiresAt,
        packageId,
        packageLabel: pkg.label,
        autoRenew: pkg.autoRenew,
        kind: original ? 'renewal' : 'purchase',
        polarOrderId: params.polarOrderId || purchase.polarOrderId,
        polarCheckoutId: params.polarCheckoutId || purchase.polarCheckoutId,
        polarSubscriptionId: params.polarSubscriptionId || purchase.polarSubscriptionId,
        updatedAt: now,
      },
    }
  )

  try {
    const user = await getUserById(purchase.userId)
    const details = {
      orderId: purchase.orderId,
      polarOrderId: params.polarOrderId || purchase.polarOrderId,
      customerName: user?.name,
      customerEmail: user?.email,
      pixelCount: purchase.pixelCount || purchase.coordinates?.length || 0,
      packageLabel: pkg.label,
      amount: purchase.amount || 0,
      kind: (original ? 'renewal' : 'purchase') as 'renewal' | 'purchase',
    }
    void Promise.all([
      sendPaymentReceivedEmail(details),
      sendCustomerReceiptEmail(details),
    ]).catch((error) => console.error('Payment email failed:', error))
  } catch (error) {
    console.error('Payment email failed:', error)
  }

  return { ok: true, extended: Boolean(original) }
}

export async function expireUnpaidOrder(params: {
  orderId?: string | null
  polarCheckoutId?: string | null
  metadata?: Record<string, unknown>
}): Promise<{ ok: boolean; reason?: string }> {
  const purchase = await findPurchase(params)
  if (!purchase) return { ok: false, reason: 'not_found' }
  if (purchase.status === 'completed') return { ok: true }
  if (purchase.status === 'expired') return { ok: true }

  const db = await getDb()
  const pixels = purchase.coordinates
  if (Array.isArray(pixels) && pixels.length > 0) {
    await db.collection('pixels').bulkWrite(
      pixels.map((p: { x: number; y: number }) => ({
        deleteOne: {
          filter: { x: p.x, y: p.y, userId: purchase.userId, status: 'pending' },
        },
      }))
    )
  }

  await db.collection('purchases').updateOne(
    { _id: purchase._id },
    { $set: { status: 'expired', updatedAt: new Date() } }
  )

  return { ok: true }
}

const STALE_PENDING_MS = 24 * 60 * 60 * 1000

export async function expireStalePendingPurchases() {
  const db = await getDb()
  const cutoff = new Date(Date.now() - STALE_PENDING_MS)
  const stale = await db
    .collection('purchases')
    .find({ status: 'pending', purchasedAt: { $lt: cutoff } })
    .toArray()

  for (const purchase of stale) {
    await expireUnpaidOrder({ orderId: purchase.orderId })
  }
}

export async function revokeMembership(polarSubscriptionId: string) {
  const purchase = await findPurchase({ polarSubscriptionId })
  if (!purchase) return { ok: false, reason: 'not_found' }

  const db = await getDb()
  const now = new Date()
  const pixels = purchase.coordinates
  if (Array.isArray(pixels) && pixels.length > 0) {
    await db.collection('pixels').bulkWrite(
      pixels.map((p: { x: number; y: number }) => ({
        updateOne: {
          filter: { x: p.x, y: p.y, userId: purchase.userId },
          update: { $set: { expiresAt: now } },
        },
      }))
    )
  }
  await db.collection('purchases').updateOne(
    { _id: purchase._id },
    { $set: { autoRenew: false, subscriptionStatus: 'revoked', updatedAt: now } }
  )
  return { ok: true }
}
