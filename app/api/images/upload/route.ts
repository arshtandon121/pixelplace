import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { storeImage, base64ToBuffer } from '@/lib/imageStorage'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { imageData, filename } = await request.json()

    if (!imageData) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      )
    }

    // Convert base64 to buffer
    const { buffer, contentType } = base64ToBuffer(imageData)
    
    // Validate image size (max 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    // Store image in GridFS
    const fileId = await storeImage(
      buffer,
      filename || `image_${Date.now()}.png`,
      contentType
    )

    return NextResponse.json({
      success: true,
      fileId,
      message: 'Image uploaded successfully',
    })
  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

