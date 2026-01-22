// Client-safe constants (no server-side imports)
// 50x50 grid = 2500 pixels
export const GRID_SIZE = 50

// Pricing configuration
// Base price per pixel per month (in currency minimal unit, e.g. INR)
// The actual value comes from env var, defaulting to 10 if missing
export const PIXEL_PRICE_PER_MONTH = process.env.NEXT_PUBLIC_PIXEL_PRICE_PER_MONTH ? parseInt(process.env.NEXT_PUBLIC_PIXEL_PRICE_PER_MONTH) : 10

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

