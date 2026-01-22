import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
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

    const db = await getDb()
    
    // Fetch purchases for the user
    const purchases = await db.collection('purchases')
      .find({ userId: decoded.userId })
      .sort({ purchasedAt: -1 }) // Most recent first
      .toArray()

    // For each purchase, get the image from the first pixel
    const purchasesWithImages = await Promise.all(
      purchases.map(async (purchase) => {
        if (purchase.coordinates && purchase.coordinates.length > 0) {
          const firstCoord = purchase.coordinates[0]
          const pixel = await db.collection('pixels').findOne({
            x: firstCoord.x,
            y: firstCoord.y,
            userId: decoded.userId,
          })
          
          return {
            ...purchase,
            imageUrl: pixel?.imageUrl || null,
            imageFileId: pixel?.imageFileId || null,
            linkUrl: pixel?.linkUrl || null,
            coordinates: purchase.coordinates,
          }
        }
        return {
          ...purchase,
          imageUrl: null,
          imageFileId: null,
          linkUrl: null,
        }
      })
    )

    return NextResponse.json({ purchases: purchasesWithImages })
  } catch (error) {
    console.error('Error fetching purchases:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

