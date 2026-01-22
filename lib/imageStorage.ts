import { getDb } from './db'
import { GridFSBucket } from 'mongodb'

let gridFSBucket: GridFSBucket | null = null

async function getGridFSBucket(): Promise<GridFSBucket> {
  if (!gridFSBucket) {
    const db = await getDb()
    gridFSBucket = new GridFSBucket(db, { bucketName: 'images' })
  }
  return gridFSBucket
}

/**
 * Store an image in MongoDB GridFS
 * @param imageBuffer - Buffer containing image data
 * @param filename - Original filename
 * @param contentType - MIME type (e.g., 'image/png', 'image/jpeg')
 * @returns The file ID (ObjectId as string)
 */
export async function storeImage(
  imageBuffer: Buffer,
  filename: string,
  contentType: string = 'image/png'
): Promise<string> {
  const bucket = await getGridFSBucket()
  
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType,
    })
    
    uploadStream.on('finish', () => {
      resolve(uploadStream.id.toString())
    })
    
    uploadStream.on('error', (error) => {
      reject(error)
    })
    
    uploadStream.end(imageBuffer)
  })
}

/**
 * Retrieve an image from MongoDB GridFS
 * @param fileId - The file ID (ObjectId as string)
 * @returns Buffer containing image data, or null if not found
 */
export async function getImage(fileId: string): Promise<Buffer | null> {
  const bucket = await getGridFSBucket()
  const { ObjectId } = await import('mongodb')
  
  try {
    const chunks: Buffer[] = []
    const downloadStream = bucket.openDownloadStream(new ObjectId(fileId))
    
    return new Promise((resolve, reject) => {
      downloadStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })
      
      downloadStream.on('end', () => {
        resolve(Buffer.concat(chunks))
      })
      
      downloadStream.on('error', (error) => {
        if (error.message.includes('FileNotFound')) {
          resolve(null)
        } else {
          reject(error)
        }
      })
    })
  } catch (error) {
    console.error('Error getting image:', error)
    return null
  }
}

/**
 * Delete an image from MongoDB GridFS
 * @param fileId - The file ID (ObjectId as string)
 */
export async function deleteImage(fileId: string): Promise<void> {
  const bucket = await getGridFSBucket()
  const { ObjectId } = await import('mongodb')
  
  try {
    await bucket.delete(new ObjectId(fileId))
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
}

/**
 * Convert base64 image to buffer
 */
export function base64ToBuffer(base64: string): { buffer: Buffer; contentType: string } {
  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
  
  if (matches) {
    const contentType = matches[1]
    const base64Data = matches[2]
    const buffer = Buffer.from(base64Data, 'base64')
    return { buffer, contentType }
  } else {
    // Assume it's already base64 without prefix
    const buffer = Buffer.from(base64, 'base64')
    return { buffer, contentType: 'image/png' }
  }
}

/**
 * Convert buffer to base64 data URL
 */
export function bufferToBase64(buffer: Buffer, contentType: string = 'image/png'): string {
  return `data:${contentType};base64,${buffer.toString('base64')}`
}

