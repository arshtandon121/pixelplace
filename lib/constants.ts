function envNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export const GRID_SIZE = 50

// Next.js only inlines NEXT_PUBLIC_ vars with a static process.env.NEXT_PUBLIC_* read.
export const PIXEL_PRICE_PER_MONTH = envNumber(process.env.NEXT_PUBLIC_PIXEL_PRICE_PER_MONTH, 10)
export const MIN_CHECKOUT_INR = envNumber(process.env.NEXT_PUBLIC_MIN_CHECKOUT_INR, 60)

export const BLOCK_WIDTH = 10 // Block selection width
export const BLOCK_HEIGHT = 5 // Block selection height

export const TENURE_OPTIONS = [
    { months: 1, label: '1 Month' },
    { months: 3, label: '3 Months' },
    { months: 6, label: '6 Months' },
    { months: 12, label: '1 Year' },
]

// Calculate how many blocks fit in the grid
export const BLOCKS_PER_ROW = Math.floor(GRID_SIZE / BLOCK_WIDTH) // 5 blocks
export const BLOCKS_PER_COL = Math.floor(GRID_SIZE / BLOCK_HEIGHT) // 10 blocks
export const TOTAL_BLOCKS = BLOCKS_PER_ROW * BLOCKS_PER_COL // 50 blocks

