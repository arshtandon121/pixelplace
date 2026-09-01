import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { getAppUrl, getDodo } from '@/lib/dodo'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const db = await getDb()
    const purchase = await db.collection('purchases').findOne(
      { userId: decoded.userId, dodoCustomerId: { $exists: true, $ne: null } },
      { sort: { purchasedAt: -1 } }
    )

    if (!purchase?.dodoCustomerId) {
      return NextResponse.json(
        { error: 'No Dodo customer on this account yet. Complete a listing payment first.' },
        { status: 400 }
      )
    }

    const session = await getDodo().customers.customerPortal.create(purchase.dodoCustomerId, {
      return_url: `${getAppUrl()}/dashboard`,
    })

    return NextResponse.json({ url: session.link })
  } catch (error: any) {
    console.error('Customer portal error:', error)
    return NextResponse.json(
      { error: 'Unable to open billing portal.' },
      { status: 400 }
    )
  }
}
