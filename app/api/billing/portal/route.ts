import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getAppUrl, getPolar } from '@/lib/polar'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const polar = getPolar()
    const session = await polar.customerSessions.create({
      externalCustomerId: decoded.userId,
      returnUrl: `${getAppUrl()}/dashboard`,
    })

    return NextResponse.json({ url: session.customerPortalUrl })
  } catch (error: any) {
    console.error('Customer portal error:', error)
    return NextResponse.json(
      { error: 'Unable to open billing portal. Subscribe first, then try again.' },
      { status: 400 }
    )
  }
}
