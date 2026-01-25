import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { PIXEL_PRICE_PER_MONTH } from '@/lib/constants'

// Simple Auth Middleware
const checkAdminAuth = (request: NextRequest) => {
    const authHeader = request.headers.get('admin-password')
    // In production, use a more secure method (session/cookie)
    // For this MV, we use the env variable
    return authHeader === process.env.ADMIN_PASSWORD
}

export async function GET(request: NextRequest) {
    if (!checkAdminAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const db = await getDb()
        const purchases = await db.collection('purchases')
            .aggregate([
                {
                    $lookup: {
                        from: 'users',
                        let: { userIdObj: { $toObjectId: '$userId' } }, // Convert string userId to ObjectId if stored as string, or match directly
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$userIdObj'] } } }
                        ],
                        as: 'userDetails'
                    }
                },
                {
                    $unwind: {
                        path: '$userDetails',
                        preserveNullAndEmptyArrays: true
                    }
                },
                { $sort: { purchasedAt: -1 } }
            ])
            .toArray()

        return NextResponse.json({ orders: purchases })
    } catch (error) {
        console.error('Admin Fetch Error:', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    if (!checkAdminAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { orderId, status, rejectionReason, refundStatus } = await request.json()

        if (!orderId) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
        }

        const db = await getDb()
        const purchase = await db.collection('purchases').findOne({ orderId })

        if (!purchase) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        if (status === 'completed' && purchase.status !== 'completed') {
            // Approve: Assign Pixels
            const { coordinates: pixels, userId, imageUrl, imageFileId, linkUrl, tenure } = purchase

            if (pixels && Array.isArray(pixels) && pixels.length > 0) {
                // Calculate expiration
                const expiresAt = new Date()
                expiresAt.setMonth(expiresAt.getMonth() + (tenure || 1))

                const bulkOps = pixels.map((p: any) => ({
                    updateOne: {
                        filter: { x: p.x, y: p.y },
                        update: {
                            $set: {
                                userId,
                                imageUrl,
                                imageFileId,
                                linkUrl,
                                purchasedAt: new Date(),
                                expiresAt,
                                price: PIXEL_PRICE_PER_MONTH * (tenure || 1),
                                status: 'active'
                            }
                        },
                        upsert: true
                    }
                }))

                await db.collection('pixels').bulkWrite(bulkOps)
            }
        }

        // Update Purchase Status
        const updateDoc: any = { updatedAt: new Date() }
        if (status) updateDoc.status = status
        if (status === 'rejected' && rejectionReason) updateDoc.rejectionReason = rejectionReason
        if (refundStatus) updateDoc.refundStatus = refundStatus

        if (status === 'rejected') {
            const { coordinates: pixels } = purchase
            if (pixels && Array.isArray(pixels) && pixels.length > 0) {
                // Delete the pending pixels to free them up
                const bulkOps = pixels.map((p: any) => ({
                    deleteOne: {
                        filter: { x: p.x, y: p.y, userId: purchase.userId } // Ensure we only delete if it matches
                    }
                }))
                await db.collection('pixels').bulkWrite(bulkOps)
            }
        }

        await db.collection('purchases').updateOne(
            { orderId },
            { $set: updateDoc }
        )

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Admin Update Error:', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
}
