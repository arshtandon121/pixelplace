import { NextRequest, NextResponse } from 'next/server'
import { getImage } from '@/lib/imageStorage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params

    if (!fileId) {
      return new NextResponse('File ID is required', { status: 400 })
    }

    const imageBuffer = await getImage(fileId)

    if (!imageBuffer) {
      return new NextResponse('Image not found', { status: 404 })
    }

    // Detect content type from buffer magic bytes
    let contentType = 'image/png' // default
    if (imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8) {
      contentType = 'image/jpeg'
    } else if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 && imageBuffer[2] === 0x4E && imageBuffer[3] === 0x47) {
      contentType = 'image/png'
    } else if (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49 && imageBuffer[2] === 0x46) {
      contentType = 'image/gif'
    } else if (imageBuffer[0] === 0x52 && imageBuffer[1] === 0x49 && imageBuffer[2] === 0x46 && imageBuffer[8] === 0x57 && imageBuffer[9] === 0x45 && imageBuffer[10] === 0x42 && imageBuffer[11] === 0x50) {
      contentType = 'image/webp'
    }

    // Return the image buffer directly with proper content type
    // Convert Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(imageBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error getting image:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

