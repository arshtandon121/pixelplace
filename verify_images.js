
const { MongoClient, ObjectId } = require('mongodb')
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

async function verifyImages() {
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

        // 1. List 'fs.files' count
        const fsCount = await db.collection('fs.files').countDocuments()
        console.log(`fs.files count: ${fsCount}`)

        // 2. List 'images.files' count (Custom bucket)
        const imagesCount = await db.collection('images.files').countDocuments()
        console.log(`images.files count: ${imagesCount}`)

        // 3. Check for specific ID from previous logs
        // Example ID: 69725f8f81f43d335527d457
        // NOTE: This ID looks fake/generated? 6972... is it valid ObjectId?
        // 24 hex chars. 
        // Let's find ANY file in images.files
        const files = await db.collection('images.files').find({}).limit(5).toArray()
        console.log('\n--- First 5 Files in images.files ---')
        files.forEach(f => {
            console.log(`ID: ${f._id} | Filename: ${f.filename} | Length: ${f.length}`)
        })

        // 4. Check pixels for imageFileId
        const pixel = await db.collection('pixels').findOne({ imageFileId: { $exists: true } })
        if (pixel) {
            console.log(`\nFound Pixel with ImageFileId: ${pixel.imageFileId}`)
            // Check if this ID exists in images.files
            const file = await db.collection('images.files').findOne({ _id: new ObjectId(pixel.imageFileId) })
            console.log(`Does file exist in images.files? ${!!file}`)

            // Check fs.files too just in case
            const fileFs = await db.collection('fs.files').findOne({ _id: new ObjectId(pixel.imageFileId) })
            console.log(`Does file exist in fs.files? ${!!fileFs}`)
        } else {
            console.log('\nNo pixels with imageFileId found.')
        }

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await client.close()
    }
}

verifyImages()
