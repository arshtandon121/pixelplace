import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/db'

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

        const { pixels } = await request.json()

        if (!pixels || !Array.isArray(pixels) || pixels.length === 0) {
            return NextResponse.json(
                { error: 'No pixels specified' },
                { status: 400 }
            )
        }

        const db = await getDb()

        // Verify ownership and delete in one go using deleteMany with filter
        // Only delete pixels that belong to this user and match the coordinates
        const result = await db.collection('pixels').deleteMany({
            userId: decoded.userId,
            $or: pixels.map((p: { x: number; y: number }) => ({ x: p.x, y: p.y }))
        })

        if (result.deletedCount === 0) {
            // This might happen if they don't own the pixels or they don't exist
            // But strictly speaking, it's not an error if they wanted to delete something that's already gone.
            // However, let's return success to keeping UI in sync.
        }

        return NextResponse.json({
            success: true,
            message: `Successfully removed ${result.deletedCount} pixels`,
            deletedCount: result.deletedCount
        })
    } catch (error) {
        console.error('Delete pixels error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
