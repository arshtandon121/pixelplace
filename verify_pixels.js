
const { MongoClient } = require('mongodb')
const fs = require('fs')
const path = require('path')

// Robust .env.local parser
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
    envConfig.split('\n').forEach(line => {
        const trimmedLine = line.trim()
        if (!trimmedLine || trimmedLine.startsWith('#')) return

        const separatorIndex = trimmedLine.indexOf('=')
        if (separatorIndex > 0) {
            const key = trimmedLine.substring(0, separatorIndex).trim()
            let value = trimmedLine.substring(separatorIndex + 1).trim()

            // Remove surrounding quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length - 1)
            }

            process.env[key] = value
        }
    })
}

async function verifyPixels() {
    const uri = process.env.MONGODB_URI
    if (!uri) {
        console.error('Missing MONGODB_URI')
        process.exit(1)
    }

    // console.log('Connecting to:', uri.substring(0, 20) + '...') 

    const client = new MongoClient(uri)

    try {
        await client.connect()
        console.log('Connected to MongoDB')
        const db = client.db('pixelplace')

        // 1. Check Last 5 Purchases
        const purchases = await db.collection('purchases').find({}).sort({ purchasedAt: -1 }).limit(5).toArray()
        console.log('\n--- Last 5 Purchases ---')
        purchases.forEach(p => {
            console.log(`Order: ${p.orderId} | Status: ${p.status} | Pixels: ${p.pixelCount}`)
            console.log(`  > ImageUrl: ${p.imageUrl ? 'Present (Base64)' : 'N/A'}`)
            console.log(`  > ImageFileId: ${p.imageFileId}`)
        })

        // 2. Check Pixels that *should* have images
        // We check for any pixel that has either imageUrl or imageFileId
        const pixelsWithImages = await db.collection('pixels').find({
            $or: [
                { imageUrl: { $exists: true, $ne: null } },
                { imageFileId: { $exists: true, $ne: null } }
            ]
        }).limit(5).toArray()

        console.log(`\n--- Pixels with Images (Found: ${pixelsWithImages.length}) ---`)
        if (pixelsWithImages.length === 0) {
            console.log('WARNING: No pixels with images found in DB!')
        } else {
            pixelsWithImages.forEach(p => {
                console.log(`Pixel (${p.x}, ${p.y}) | User: ${p.userId}`)
                console.log(`  > ImageUrl: ${p.imageUrl ? 'Present' : 'N/A'}`)
                console.log(`  > ImageFileId: ${p.imageFileId}`)
            })
        }

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await client.close()
    }
}

verifyPixels()
