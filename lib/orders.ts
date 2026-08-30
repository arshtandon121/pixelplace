import { getDb } from '@/lib/db'
import { PIXEL_PRICE_PER_MONTH } from '@/lib/constants'
import { getUserById } from '@/lib/auth'
import { sendCustomerReceiptEmail, sendPaymentReceivedEmail } from '@/lib/email'

export type PurchaseStatus = 'pending' | 'completed' | 'expired' | 'rejected'

function metadataValue(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key]
  if (value === undefined || value === null) return undefined
  return String(value)
}

export async function findPurchase(params: {
  orderId?: string | null
  polarCheckoutId?: string | null
  polarOrderId?: string | null
  metadata?: Record<string, unknown>
}) {
  const db = await getDb()
  const clauses: Record<string, string>[] = []

  const metaOrderId = metadataValue(params.metadata, 'orderId')
  if (params.orderId) clauses.push({ orderId: params.orderId })
  if (metaOrderId) clauses.push({ orderId: metaOrderId })
  if (params.polarCheckoutId) clauses.push({ polarCheckoutId: params.polarCheckoutId })
  if (params.polarOrderId) clauses.push({ polarOrderId: params.polarOrderId })

  if (clauses.length === 0) return null

  return db.collection('purchases').findOne({ $or: clauses })
}

export async function fulfillPaidOrder(params: {
  orderId?: string | null
  polarCheckoutId?: string | null
  polarOrderId?: string | null
  metadata?: Record<string, unknown>
  paidAmountCents?: number
}): Promise<{ ok: boolean; already?: boolean; reason?: string }> {
  const purchase = await findPurchase(params)
  if (!purchase) {
    return { ok: false, reason: 'not_found' }
  }

  if (purchase.status === 'completed') {
    return { ok: true, already: true }
  }

  const db = await getDb()
  const pixels = purchase.coordinates
  const tenure = purchase.tenure || 1
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + tenure)

  if (Array.isArray(pixels) && pixels.length > 0) {
    const bulkOps = pixels.map((p: { x: number; y: number }) => ({
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
            price: PIXEL_PRICE_PER_MONTH * tenure,
            status: 'active',
          },
        },
        upsert: true,
      },
    }))
    await db.collection('pixels').bulkWrite(bulkOps)
  }

  await db.collection('purchases').updateOne(
    { _id: purchase._id },
    {
      $set: {
        status: 'completed',
        paidAt: new Date(),
        polarOrderId: params.polarOrderId || purchase.polarOrderId,
        polarCheckoutId: params.polarCheckoutId || purchase.polarCheckoutId,
        updatedAt: new Date(),
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
      pixelCount: purchase.pixelCount || pixels?.length || 0,
      tenure,
      amount: purchase.amount || 0,
    }
    void Promise.all([
      sendPaymentReceivedEmail(details),
      sendCustomerReceiptEmail(details),
    ]).catch((error) => console.error('Payment email failed:', error))
  } catch (error) {
    console.error('Payment email failed:', error)
  }

  return { ok: true }
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
