import { NextRequest, NextResponse } from 'next/server'
import { createIndexes } from '@/lib/dbIndexes'

export async function POST(request: NextRequest) {
  try {
    await createIndexes()
    return NextResponse.json({ success: true, message: 'Indexes created successfully' })
  } catch (error) {
    console.error('Error creating indexes:', error)
    return NextResponse.json(
      { error: 'Failed to create indexes' },
      { status: 500 }
    )
  }
}

