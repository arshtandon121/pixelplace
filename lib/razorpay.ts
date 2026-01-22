import Razorpay from 'razorpay'
import crypto from 'crypto'

let razorpayInstance: Razorpay | null = null

function getRazorpayInstance(): Razorpay {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay keys are not set')
    }
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }
  return razorpayInstance
}

// Lazy initialization - only create instance when needed
export function getRazorpay(): Razorpay {
  return getRazorpayInstance()
}

export async function createRazorpayOrder(
  amount: number, // in INR
  pixelCount: number,
  userId: string,
  pixelCoordinates: { x: number; y: number }[],
  imageUrl?: string,
  linkUrl?: string
) {
  const razorpay = getRazorpayInstance()
  
  // Don't store imageUrl in notes (it can exceed 20KB limit for base64 images)
  // Store only essential data - imageUrl will be passed during payment verification
  const notes: Record<string, string> = {
    userId,
    pixelCount: pixelCount.toString(),
    coordinates: JSON.stringify(pixelCoordinates),
  }
  
  // Only add linkUrl if it's small (URLs are usually small)
  if (linkUrl && linkUrl.length < 1000) {
    notes.linkUrl = linkUrl
  }
  
  const order = await razorpay.orders.create({
    amount: amount * 100, // Convert to paise
    currency: 'INR',
    receipt: `pixel_${Date.now()}`,
    notes,
  })

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
  }
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay key secret is not set')
  }
  const text = `${orderId}|${paymentId}`
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(text)
    .digest('hex')

  return generatedSignature === signature
}

