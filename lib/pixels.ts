import { getDb } from './db'
import { PIXEL_PRICE_PER_MONTH } from './constants'

export interface Pixel {
  _id?: string
  x: number
  y: number
  userId?: string
  imageUrl?: string
  imageFileId?: string // GridFS file ID for large images
  linkUrl?: string
  purchasedAt?: Date
  expiresAt?: Date
  price?: number
}

export async function getPixel(x: number, y: number): Promise<Pixel | null> {
  const db = await getDb()
  const now = new Date()
  return await db.collection<Pixel>('pixels')
    .findOne({
      x,
      y,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: now } }
      ]
    }, { projection: { x: 1, y: 1, userId: 1, imageUrl: 1, linkUrl: 1, expiresAt: 1 } })
}

export async function getPixelsByUser(userId: string): Promise<Pixel[]> {
  const { expireStalePendingPurchases } = await import('./orders')
  await expireStalePendingPurchases()

  const db = await getDb()
  const now = new Date()
  // Don't fetch imageUrl - it contains large base64 strings that slow down queries
  // Only fetch essential fields for dashboard display
  const pixels = await db.collection('pixels')
    .find({
      userId,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: now } }
      ]
    })
    .project({
      x: 1,
      y: 1,
      userId: 1,
      linkUrl: 1,
      imageFileId: 1, // GridFS file ID if available
      purchasedAt: 1,
      expiresAt: 1,
      price: 1,
      status: 1,
      packageId: 1,
      // DO NOT fetch imageUrl - it's too large and causes slow queries
    })
    .toArray()

  return pixels as Pixel[]
}

export async function getAllPixels(): Promise<Pixel[]> {
  const { expireStalePendingPurchases } = await import('./orders')
  await expireStalePendingPurchases()

  const db = await getDb()
  const now = new Date()

  const pixels = await db.collection<Pixel>('pixels')
    .aggregate([
      {
        $match: {
          $and: [
            {
              $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: now } }
              ]
            },
            {
              // Exclude pending pixels, but allow missing status (legacy) or active
              status: { $ne: 'pending' }
            },
            {
              $or: [
                { imageUrl: { $exists: true, $ne: null, $nin: [''] } },
                { imageFileId: { $exists: true, $ne: null, $nin: [''] } }
              ]
            }
          ]
        }
      },
      {
        $project: {
          x: 1,
          y: 1,
          userId: 1,
          linkUrl: 1,
          imageFileId: 1,
          // Only include imageUrl if it's small (less than 50KB base64 = ~37KB actual)
          // For larger images, they should be in GridFS
          imageUrl: {
            $cond: {
              if: { $lt: [{ $strLenCP: { $ifNull: ['$imageUrl', ''] } }, 50000] },
              then: '$imageUrl',
              else: null
            }
          }
        }
      }
    ])
    .toArray()

  return pixels as Pixel[]
}

export async function purchasePixel(
  x: number,
  y: number,
  userId: string,
  imageUrl?: string,
  linkUrl?: string,
  price?: number,
  expiresAt?: Date
): Promise<Pixel> {
  const db = await getDb()
  const pixel: Pixel = {
    x,
    y,
    userId,
    imageUrl: imageUrl || undefined,
    linkUrl: linkUrl || undefined,
    purchasedAt: new Date(),
    expiresAt,
    price: price || PIXEL_PRICE_PER_MONTH,
  }

  await db.collection('pixels').updateOne(
    { x, y },
    { $set: pixel },
    { upsert: true }
  )

  return pixel
}

export async function checkPixelsAvailable(pixels: { x: number; y: number }[]): Promise<boolean> {
  const db = await getDb()
  const now = new Date()
  // Use countDocuments for better performance - we only need to know if any exist
  const count = await db
    .collection<Pixel>('pixels')
    .countDocuments({
      $and: [
        { $or: pixels.map(p => ({ x: p.x, y: p.y })) },
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: now } }
          ]
        }
      ]
    }, { limit: 1 }) // Stop after finding first match

  return count === 0
}

