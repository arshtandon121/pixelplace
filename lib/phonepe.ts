import crypto from 'crypto'

export const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID!
export const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY!
export const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1'
export const PHONEPE_HOST_URL = process.env.PHONEPE_HOST_URL!

export function calculateChecksum(payload: string, endpoint: string, saltKey: string, saltIndex: string) {
    const stringToSign = payload + endpoint + saltKey
    const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex')
    return `${sha256}###${saltIndex}`
}

export function encodePayload(payload: any): string {
    return Buffer.from(JSON.stringify(payload)).toString('base64')
}
