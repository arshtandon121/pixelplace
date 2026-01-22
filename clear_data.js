
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

async function clearData() {
    const uri = process.env.MONGODB_URI
    if (!uri) {
        console.error('Missing MONGODB_URI')
        process.exit(1)
    }

    const client = new MongoClient(uri)

    try {
        await client.connect()
        console.log('Connected to MongoDB')
        const db = client.db('pixelplace')

        console.log('Clearing collections...')

        // Purchases
        try {
            await db.collection('purchases').drop()
            console.log('✅ Dropped available purchases')
        } catch (e) {
            if (e.code === 26) console.log('ℹ️ Purchases collection already empty')
            else console.error('Error dropping purchases:', e)
        }

        // Pixels
        try {
            await db.collection('pixels').drop()
            console.log('✅ Dropped available pixels')
        } catch (e) {
            if (e.code === 26) console.log('ℹ️ Pixels collection already empty')
            else console.error('Error dropping pixels:', e)
        }

        // GridFS Files
        try {
            await db.collection('fs.files').drop()
            console.log('✅ Dropped fs.files')
        } catch (e) {
            if (e.code === 26) console.log('ℹ️ fs.files already empty')
            else console.error('Error dropping fs.files:', e)
        }

        // GridFS Chunks
        try {
            await db.collection('fs.chunks').drop()
            console.log('✅ Dropped fs.chunks')
        } catch (e) {
            if (e.code === 26) console.log('ℹ️ fs.chunks already empty')
            else console.error('Error dropping fs.chunks:', e)
        }

        console.log('\n🎉 Database reset complete! (Users preserved)')

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await client.close()
    }
}

clearData()
