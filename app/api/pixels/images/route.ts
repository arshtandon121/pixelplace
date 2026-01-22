import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getImage, bufferToBase64 } from '@/lib/imageStorage'

/**
 * Get images for specific pixels
 * This endpoint is called separately to lazy-load images
 */
export async function POST(request: NextRequest) {
  try {
    const { pixelIds } = await request.json() // Array of {x, y} coordinates
    
    if (!pixelIds || !Array.isArray(pixelIds)) {
      return NextResponse.json(
        { error: 'Invalid pixel IDs' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const pixels = await db.collection('pixels')
      .find({
        $or: pixelIds.map((p: { x: number; y: number }) => ({ x: p.x, y: p.y }))
      })
      .project({ x: 1, y: 1, imageUrl: 1, imageFileId: 1 })
      .toArray()

    // Process images - convert GridFS fileIds to base64 if needed
    const imageMap: Record<string, string> = {}
    
    for (const pixel of pixels) {
      const key = `${pixel.x},${pixel.y}`
      if (pixel.imageFileId) {
        // Fetch from GridFS
        const imageBuffer = await getImage(pixel.imageFileId)
        if (imageBuffer) {
          imageMap[key] = bufferToBase64(imageBuffer)
        }
      } else if (pixel.imageUrl) {
        // Use existing base64 URL
        imageMap[key] = pixel.imageUrl
      }
    }

    return NextResponse.json({ images: imageMap })
  } catch (error) {
    console.error('Error fetching pixel images:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

