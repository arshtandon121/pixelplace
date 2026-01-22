import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getPixelsByUser } from '@/lib/pixels'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
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

    const pixels = await getPixelsByUser(decoded.userId)
    const queryTime = Date.now() - startTime
    console.log(`✅ Fetched ${pixels.length} user pixels in ${queryTime}ms`)
    
    return NextResponse.json(
      { pixels },
      {
        headers: {
          'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
        },
      }
    )
  } catch (error) {
    console.error('Error fetching user pixels:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

