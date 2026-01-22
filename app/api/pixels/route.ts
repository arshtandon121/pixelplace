import { NextRequest, NextResponse } from 'next/server'
import { getAllPixels } from '@/lib/pixels'

export async function GET() {
  try {
    const startTime = Date.now()
    // Cache headers for better performance
    const pixels = await getAllPixels()
    const queryTime = Date.now() - startTime

    console.log(`✅ Fetched ${pixels.length} pixels in ${queryTime}ms`)

    return NextResponse.json(
      {
        pixels,
        count: pixels.length,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching pixels:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

