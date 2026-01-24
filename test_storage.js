
const { MongoClient } = require('mongodb')
const { GridFSBucket } = require('mongodb')
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
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length - 1)
            }
            process.env[key] = value
        }
    })
}

async function testStorage() {
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

        const bucket = new GridFSBucket(db, { bucketName: 'images' })

        // Create a small test buffer
        const buffer = Buffer.from('TEST IMAGE DATA', 'utf8')
        const filename = `test_file_${Date.now()}.txt`

        console.log('Attempting to store file...')

        const fileId = await new Promise((resolve, reject) => {
            const uploadStream = bucket.openUploadStream(filename, {
                contentType: 'text/plain',
            })
            uploadStream.on('finish', () => resolve(uploadStream.id.toString()))
            uploadStream.on('error', reject)
            uploadStream.end(buffer)
        })

        console.log(`✅ File stored successfully! ID: ${fileId}`)

        // Verify it exists
        const file = await db.collection('images.files').findOne({ filename })
        console.log(`File found in DB:`, file)

    } catch (error) {
        console.error('❌ Storage Error:', error)
    } finally {
        await client.close()
    }
}

testStorage()
