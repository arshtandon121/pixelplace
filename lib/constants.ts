// Client-safe constants (no server-side imports)
// 50x50 grid = 2500 pixels
function envNumber(name: string, fallback: number): number {
  const parsed = Number(process.env[name])
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export const GRID_SIZE = 50

// Base price per pixel per month, in INR. Checkout uses this via membershipPriceInr().
export const PIXEL_PRICE_PER_MONTH = envNumber('NEXT_PUBLIC_PIXEL_PRICE_PER_MONTH', 10)

// Dodo Pay What You Want products reject amounts below this. Short terms (hour/day)
// often calculate under it, so checkout is raised to this floor.
export const MIN_CHECKOUT_INR = envNumber('NEXT_PUBLIC_MIN_CHECKOUT_INR', 60)

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

