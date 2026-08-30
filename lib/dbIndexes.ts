import { getDb } from './db'

/**
 * Create database indexes for better query performance
 * Call this once on app startup or in a migration script
 */
export async function createIndexes() {
  try {
    const db = await getDb()
    
    // Index on (x, y) for fast pixel lookups
    await db.collection('pixels').createIndex({ x: 1, y: 1 }, { unique: true })
    
    // Index on userId for user pixel queries
    await db.collection('pixels').createIndex({ userId: 1 })
    
    // Index on imageUrl for faster filtering
    await db.collection('pixels').createIndex({ imageUrl: 1 }, { sparse: true })
    
    // Index on pending_orders for faster lookups
    await db.collection('pending_orders').createIndex({ tempOrderId: 1 }, { unique: true })
    await db.collection('pending_orders').createIndex({ razorpayOrderId: 1 })
    await db.collection('pending_orders').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    
    // Index on purchases
    await db.collection('purchases').createIndex({ userId: 1 })
    await db.collection('purchases').createIndex({ orderId: 1 })
    await db.collection('purchases').createIndex({ polarCheckoutId: 1 }, { sparse: true })
    await db.collection('purchases').createIndex({ polarSubscriptionId: 1 }, { sparse: true })
    await db.collection('purchases').createIndex({ status: 1, purchasedAt: 1 })
    
    console.log('✅ Database indexes created successfully')
  } catch (error) {
    // Indexes might already exist, that's okay
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('Indexes already exist')
    } else {
      console.error('Error creating indexes:', error)
    }
  }
}

