// Migration script to fix pixel status for approved orders
const { MongoClient } = require('mongodb')

async function fixPixelStatus() {
    const uri = process.env.MONGODB_URI
    if (!uri) {
        console.error('❌ MONGODB_URI not found in .env.local')
        process.exit(1)
    }

    const client = new MongoClient(uri)

    try {
        await client.connect()
        console.log('✅ Connected to MongoDB')

        const db = client.db()

        // Get all completed purchases
        const completedPurchases = await db.collection('purchases')
            .find({ status: 'completed' })
            .toArray()

        console.log(`📦 Found ${completedPurchases.length} completed purchases`)

        let updatedPixelsCount = 0

        // For each completed purchase, update its pixels to active
        for (const purchase of completedPurchases) {
            if (purchase.coordinates && Array.isArray(purchase.coordinates)) {
                const result = await db.collection('pixels').updateMany(
                    {
                        $or: purchase.coordinates.map(p => ({ x: p.x, y: p.y })),
                        userId: purchase.userId
                    },
                    {
                        $set: { status: 'active' }
                    }
                )
                updatedPixelsCount += result.modifiedCount
                console.log(`  ➜ Updated ${result.modifiedCount} pixels for order ${purchase.orderId}`)
            }
        }

        console.log(`\n✅ Migration complete! Updated ${updatedPixelsCount} pixels to 'active' status`)

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await client.close()
        console.log('👋 Disconnected from MongoDB')
    }
}

fixPixelStatus()
