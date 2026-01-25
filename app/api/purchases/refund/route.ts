import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1]
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const decoded = verifyToken(token)
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const { orderId, refundDetails } = await request.json()

        if (!orderId || !refundDetails) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const db = await getDb()

        // Update the purchase with refund details
        const result = await db.collection('purchases').updateOne(
            { orderId, userId: decoded.userId },
            {
                $set: {
                    refundDetails: JSON.stringify(refundDetails),
                    refundRequestedAt: new Date(),
                    refundStatus: 'requested'
                }
            }
        )

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Refund request error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
