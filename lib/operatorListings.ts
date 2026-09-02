import crypto from 'crypto'
import { getDb } from '@/lib/db'
import { createUser, getUserByEmail } from '@/lib/auth'
import { addMembershipDuration, membershipPriceInr } from '@/lib/membership'
import { BLOCK_HEIGHT, BLOCK_WIDTH } from '@/lib/constants'

const OPERATOR_EMAIL = 'listings@pixelplace.in'
const SITE_URL = 'https://www.pixelplace.in'

type HouseListing = {
  id: string
  name: string
  imageUrl: string
  blockX: number
  blockY: number
}

const HOUSE_LISTINGS: HouseListing[] = [
  { id: 'aurora-tech', name: 'Aurora Tech', imageUrl: '/listings/aurora-tech.png', blockX: 1, blockY: 1 },
  { id: 'veridian-gardens', name: 'Veridian Gardens', imageUrl: '/listings/veridian-gardens.png', blockX: 3, blockY: 4 },
  { id: 'velocity-sports', name: 'Velocity Sports', imageUrl: '/listings/velocity-sports.png', blockX: 0, blockY: 7 },
]

function blockPixels(blockX: number, blockY: number) {
  const pixels: { x: number; y: number }[] = []
  for (let dy = 0; dy < BLOCK_HEIGHT; dy++) {
    for (let dx = 0; dx < BLOCK_WIDTH; dx++) {
      pixels.push({ x: blockX * BLOCK_WIDTH + dx, y: blockY * BLOCK_HEIGHT + dy })
    }
  }
  return pixels
}

async function getOperatorUserId(): Promise<string> {
  const existing = await getUserByEmail(OPERATOR_EMAIL)
  if (existing?._id) return existing._id
  const user = await createUser(OPERATOR_EMAIL, crypto.randomBytes(24).toString('hex'), 'PixelPlace')
  return user._id!
}

export async function ensureHouseListings() {
  const db = await getDb()
  const userId = await getOperatorUserId()
  const now = new Date()
  const expiresAt = addMembershipDuration(now, 'year')
  const amount = membershipPriceInr(BLOCK_WIDTH * BLOCK_HEIGHT, 'year')
  const unitPrice = amount / (BLOCK_WIDTH * BLOCK_HEIGHT)

  for (const listing of HOUSE_LISTINGS) {
    const already = await db.collection('pixels').findOne({ houseListingId: listing.id })
    if (already) continue

    const pixels = blockPixels(listing.blockX, listing.blockY)
    const taken = await db.collection('pixels').findOne({
      $or: pixels.map((p) => ({ x: p.x, y: p.y })),
      $and: [
        { $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }] },
        { status: { $ne: 'pending' } },
      ],
    })
    if (taken) continue

    await db.collection('pixels').bulkWrite(
      pixels.map((p) => ({
        updateOne: {
          filter: { x: p.x, y: p.y },
          update: {
            $set: {
              x: p.x,
              y: p.y,
              userId,
              imageUrl: listing.imageUrl,
              linkUrl: SITE_URL,
              purchasedAt: now,
              expiresAt,
              price: unitPrice,
              status: 'active',
              packageId: 'year',
              username: listing.name,
              houseListingId: listing.id,
            },
          },
          upsert: true,
        },
      }))
    )

    await db.collection('purchases').insertOne({
      userId,
      orderId: `house_${listing.id}`,
      pixelCount: pixels.length,
      coordinates: pixels,
      purchasedAt: now,
      packageId: 'year',
      packageLabel: '1 Year',
      autoRenew: false,
      amount,
      currency: 'INR',
      imageUrl: listing.imageUrl,
      linkUrl: SITE_URL,
      status: 'completed',
      provider: 'house',
      houseListingId: listing.id,
    })
  }
}
