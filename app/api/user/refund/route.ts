import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '')
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const decoded = verifyToken(token)
        if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

        const { orderId, refundDetails } = await request.json()
        if (!orderId || !refundDetails) {
            return NextResponse.json({ error: 'Missing details' }, { status: 400 })
        }

        const db = await getDb()
        const purchase = await db.collection('purchases').findOne({
            orderId,
            userId: decoded.userId,
            status: 'rejected'
        })

        if (!purchase) {
            return NextResponse.json({ error: 'Order not found or not eligible for refund' }, { status: 404 })
        }

        await db.collection('purchases').updateOne(
            { orderId },
            {
                $set: {
                    refundStatus: 'requested',
                    refundDetails,
                    refundRequestedAt: new Date()
                }
            }
        )

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Refund Request Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
