import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// Simple Auth Middleware
const checkAdminAuth = (request: NextRequest) => {
    const authHeader = request.headers.get('admin-password')
    return authHeader === process.env.ADMIN_PASSWORD
}

export async function GET(request: NextRequest) {
    if (!checkAdminAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const db = await getDb()

        // Get total signups
        const totalSignups = await db.collection('users').countDocuments()

        // Get recent signups (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const recentSignups = await db.collection('users').countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        })

        // Get all users with details (for recent signups list)
        const recentUsers = await db.collection('users')
            .find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray()

        // Get payment statistics
        const paymentStats = await db.collection('purchases').aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$amount' },
                    totalTransactions: { $sum: 1 },
                    avgOrderValue: { $avg: '$amount' }
                }
            }
        ]).toArray()

        // Get payment breakdown by status
        const paymentBreakdown = await db.collection('purchases').aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    revenue: { $sum: '$amount' }
                }
            }
        ]).toArray()

        // Get active users (users with active pixels)
        const activeUsers = await db.collection('pixels').aggregate([
            {
                $match: {
                    userId: { $exists: true, $ne: null },
                    status: 'active'
                }
            },
            {
                $group: {
                    _id: '$userId'
                }
            },
            {
                $count: 'total'
            }
        ]).toArray()

        // Get total pixels sold
        const totalPixelsSold = await db.collection('pixels').countDocuments({
            userId: { $exists: true, $ne: null }
        })

        // Get revenue over time (last 12 months)
        const twelveMonthsAgo = new Date()
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

        const revenueOverTime = await db.collection('purchases').aggregate([
            {
                $match: {
                    purchasedAt: { $gte: twelveMonthsAgo },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$purchasedAt' },
                        month: { $month: '$purchasedAt' }
                    },
                    revenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]).toArray()

        // Get user growth over time (last 12 months)
        const userGrowth = await db.collection('users').aggregate([
            {
                $match: {
                    createdAt: { $gte: twelveMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]).toArray()

        // Get top users by spending
        const topUsers = await db.collection('purchases').aggregate([
            {
                $match: {
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: '$userId',
                    totalSpent: { $sum: '$amount' },
                    totalPurchases: { $sum: 1 },
                    totalPixels: { $sum: '$pixelCount' }
                }
            },
            {
                $sort: { totalSpent: -1 }
            },
            {
                $limit: 10
            },
            {
                $lookup: {
                    from: 'users',
                    let: { userIdObj: { $toObjectId: '$_id' } },
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
            }
        ]).toArray()

        return NextResponse.json({
            analytics: {
                signups: {
                    total: totalSignups,
                    recent: recentSignups,
                    recentUsers: recentUsers
                },
                payments: {
                    totalRevenue: paymentStats[0]?.totalRevenue || 0,
                    totalTransactions: paymentStats[0]?.totalTransactions || 0,
                    avgOrderValue: paymentStats[0]?.avgOrderValue || 0,
                    breakdown: paymentBreakdown
                },
                users: {
                    activeUsers: activeUsers[0]?.total || 0,
                    totalPixelsSold: totalPixelsSold,
                    topUsers: topUsers
                },
                trends: {
                    revenueOverTime: revenueOverTime,
                    userGrowth: userGrowth
                }
            }
        })
    } catch (error) {
        console.error('Analytics Fetch Error:', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
}
