import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '')

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const decoded = verifyToken(token)
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const { pixels, linkUrl } = await request.json()

        if (!pixels || !Array.isArray(pixels) || pixels.length === 0) {
            return NextResponse.json({ error: 'No assets specified' }, { status: 400 })
        }

        const db = await getDb()

        // Verify ownership and update link for all pixels in this group
        const result = await db.collection('pixels').updateMany(
            {
                userId: decoded.userId,
                $or: pixels.map((p: { x: number; y: number }) => ({ x: p.x, y: p.y }))
            },
            {
                $set: { linkUrl: linkUrl || undefined }
            }
        )

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'No owned assets found to update' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            message: `Updated link for ${result.modifiedCount} pixels`
        })

    } catch (error) {
        console.error('Update link error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
