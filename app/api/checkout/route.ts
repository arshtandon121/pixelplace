import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { checkPixelsAvailable } from '@/lib/pixels'
import { PIXEL_PRICE_PER_MONTH } from '@/lib/constants'
import { getDb } from '@/lib/db'
import { storeImage, base64ToBuffer } from '@/lib/imageStorage'

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

        const { pixels, imageUrl, linkUrl, tenure = 1, screenshot } = await request.json()

        if (!pixels || !Array.isArray(pixels) || pixels.length === 0) {
            return NextResponse.json({ error: 'Invalid pixels data' }, { status: 400 })
        }

        const available = await checkPixelsAvailable(pixels)
        if (!available) {
            return NextResponse.json({ error: 'Some selected pixels are already purchased' }, { status: 400 })
        }

        if (!screenshot) {
            return NextResponse.json({ error: 'Payment screenshot is required' }, { status: 400 })
        }

        // Calculate Amount
        const unitPrice = PIXEL_PRICE_PER_MONTH * tenure
        const totalAmount = unitPrice * pixels.length

        // Store Logo Image
        let imageFileId: string | undefined = undefined
        let finalImageUrl: string | undefined = undefined

        if (imageUrl) {
            if (imageUrl.startsWith('data:image')) {
                try {
                    const { buffer } = base64ToBuffer(imageUrl)
                    // Always store in GridFS to avoid bloating the pixels collection with base64 strings
                    imageFileId = await storeImage(buffer, `pixel_image_${decoded.userId}_${Date.now()}.png`)
                } catch (error) {
                    console.error('Image storage error:', error)
                    // Fallback (though ideally we should fail)
                    finalImageUrl = imageUrl
                }
            } else {
                finalImageUrl = imageUrl
            }
        }

        // Store Screenshot Image
        let screenshotFileId: string | undefined = undefined
        if (screenshot && screenshot.startsWith('data:image')) {
            try {
                const { buffer } = base64ToBuffer(screenshot)
                screenshotFileId = await storeImage(buffer, `payment_proof_${decoded.userId}_${Date.now()}.png`)
            } catch (error) {
                console.error('Error storing screenshot:', error)
                return NextResponse.json({ error: 'Failed to process screenshot' }, { status: 500 })
            }
        }

        const db = await getDb()
        const orderId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // Create Purchase Record with 'pending' status
        await db.collection('purchases').insertOne({
            userId: decoded.userId,
            orderId,
            paymentId: 'manual_verification',
            pixelCount: pixels.length,
            coordinates: pixels,
            purchasedAt: new Date(),
            tenure,
            amount: totalAmount,
            currency: 'INR', // or whatever currency used manually
            imageUrl: finalImageUrl,
            imageFileId,
            linkUrl: linkUrl || undefined,
            provider: 'manual',
            status: 'pending', // NEW FIELD
            screenshotFileId, // NEW FIELD
        })

        // Do NOT assign pixels yet. Wait for Admin approval.
        // However, we might want to "reserve" them temporarily or just risk race conditions.
        // For manual flow, usually it's better to verify first. 
        // If strict reservation is needed, we'd add them to 'pixels' with status 'reserved'.
        // For simplicity given the request, we just save the purchase request.

        return NextResponse.json({ success: true, orderId })

    } catch (error: any) {
        console.error('Manual Checkout error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
