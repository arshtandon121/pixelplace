'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Move, ExternalLink, TrendingUp, ShieldCheck, User } from 'lucide-react'
import { useAudio } from '@/hooks/useAudio'
import { useState, useMemo, memo, useCallback } from 'react'
import { GRID_SIZE, BLOCK_WIDTH, BLOCK_HEIGHT, BLOCKS_PER_ROW, BLOCKS_PER_COL, PIXEL_PRICE_PER_MONTH } from '@/lib/constants'

interface Pixel {
  x: number
  y: number
  userId?: string
  username?: string
  imageUrl?: string
  imageFileId?: string // GridFS file ID
  linkUrl?: string
  price?: number
}

interface AvailableBlock {
  blockX: number
  blockY: number
  pixels: { x: number; y: number }[]
}

interface PixelGridProps {
  ownedPixels: Pixel[]
  selectedPixels: { x: number; y: number }[]
  onPixelClick: (x: number, y: number) => void
  onPixelHover: (x: number, y: number) => void
  previewImage?: string | null
  availableBlocks?: AvailableBlock[]
  fitImages?: boolean
  showTooltip?: boolean
  disableLinks?: boolean
}

export default function PixelGrid({
  ownedPixels,
  selectedPixels,
  onPixelClick,
  onPixelHover,
  previewImage,
  availableBlocks = [],
  fitImages = false,
  showTooltip = true,
  disableLinks = false,
}: PixelGridProps) {
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number } | null>(null)
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    pixel: Pixel | null;
    visible: boolean;
  }>({ x: 0, y: 0, pixel: null, visible: false })

  // Optimize: Create lookup maps for faster access
  const ownedPixelsMap = useMemo(() => {
    const map = new Map<string, Pixel>()
    ownedPixels.forEach(p => {
      map.set(`${p.x},${p.y}`, p)
    })
    return map
  }, [ownedPixels])

  const selectedPixelsSet = useMemo(() => {
    return new Set(selectedPixels.map(p => `${p.x},${p.y}`))
  }, [selectedPixels])

  const isOwned = (x: number, y: number) => {
    return ownedPixelsMap.has(`${x},${y}`)
  }

  const isSelected = (x: number, y: number) => {
    return selectedPixelsSet.has(`${x},${y}`)
  }

  // Check if pixel is in an available block
  const isInAvailableBlock = (x: number, y: number) => {
    if (availableBlocks.length === 0) return false
    const blockX = Math.floor(x / BLOCK_WIDTH)
    const blockY = Math.floor(y / BLOCK_HEIGHT)
    return availableBlocks.some(block => block.blockX === blockX && block.blockY === blockY)
  }

  const getPixelColor = (x: number, y: number) => {
    if (isSelected(x, y)) return 'bg-primary-500'
    if (isOwned(x, y)) {
      const pixel = ownedPixelsMap.get(`${x},${y}`)
      // If we have an image (URL or FileId), transparent to show overlay. Otherwise gray.
      return (pixel?.imageUrl || pixel?.imageFileId) ? 'bg-transparent' : 'bg-gray-400'
    }
    // Highlight available blocks with subtle green tint
    if (isInAvailableBlock(x, y)) {
      return 'bg-green-50 border border-green-200'
    }
    return 'bg-white border border-gray-200'
  }

  const getPixelImage = (x: number, y: number) => {
    // Don't show preview on individual pixels - we'll use overlay instead
    const pixel = ownedPixelsMap.get(`${x},${y}`)
    return pixel?.imageUrl
  }

  // Group owned pixels by imageUrl to create combined overlays
  const getOwnedImageOverlays = useMemo(() => {
    if (ownedPixels.length === 0) {
      return []
    }

    // Fast filter - only pixels with valid image URLs or file IDs
    const pixelsWithImages: Pixel[] = []
    for (let i = 0; i < ownedPixels.length; i++) {
      const p = ownedPixels[i]
      // Include pixels with imageUrl (small base64) or imageFileId (GridFS)
      if ((p.imageUrl && p.imageUrl.length > 0) || (p.imageFileId && p.imageFileId.length > 0)) {
        pixelsWithImages.push(p)
      }
    }

    console.log('🎨 PixelGrid: Processing', ownedPixels.length, 'owned pixels')
    console.log('🎨 PixelGrid: Found', pixelsWithImages.length, 'pixels with images')

    if (pixelsWithImages.length === 0) {
      return []
    }

    // Group pixels by imageUrl/imageFileId and userId using Map for O(1) lookups
    const imageGroups = new Map<string, { pixels: Pixel[], userId: string, imageUrl?: string, imageFileId?: string, linkUrl?: string }>()

    for (let i = 0; i < pixelsWithImages.length; i++) {
      const pixel = pixelsWithImages[i]
      // Use imageFileId if available (GridFS), otherwise imageUrl (base64)
      const imageKey = pixel.imageFileId || pixel.imageUrl || ''
      if (!imageKey) continue // Skip if no image

      const key = `${pixel.userId}_${imageKey}`
      let group = imageGroups.get(key)
      if (!group) {
        group = {
          pixels: [],
          userId: pixel.userId || '',
          imageUrl: pixel.imageUrl,
          imageFileId: pixel.imageFileId,
          linkUrl: pixel.linkUrl,
        }
        imageGroups.set(key, group)
      }
      group.pixels.push(pixel)
    }

    // For each group, find contiguous blocks and create overlays
    const overlays: Array<{
      left: number
      top: number
      width: number
      height: number
      imageUrl?: string
      imageFileId?: string
      linkUrl?: string
    }> = []

    imageGroups.forEach((group, key) => {
      // Group pixels into contiguous blocks
      const pixelSet = new Set(group.pixels.map(p => `${p.x},${p.y}`))
      const visited = new Set<string>()

      const findBlock = (startX: number, startY: number): Pixel[] => {
        const block: Pixel[] = []
        const queue: Pixel[] = [group.pixels.find(p => p.x === startX && p.y === startY)!]
        visited.add(`${startX},${startY}`)

        while (queue.length > 0) {
          const current = queue.shift()!
          block.push(current)

          const neighbors = [
            { x: current.x + 1, y: current.y },
            { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 },
            { x: current.x, y: current.y - 1 },
          ]

          for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.x},${neighbor.y}`
            if (pixelSet.has(neighborKey) && !visited.has(neighborKey)) {
              visited.add(neighborKey)
              const neighborPixel = group.pixels.find(p => p.x === neighbor.x && p.y === neighbor.y)
              if (neighborPixel) queue.push(neighborPixel)
            }
          }
        }

        return block
      }

      // Find all blocks for this image
      group.pixels.forEach(pixel => {
        const pixelKey = `${pixel.x},${pixel.y}`
        if (!visited.has(pixelKey)) {
          const block = findBlock(pixel.x, pixel.y)
          if (block.length > 0) {
            const xs = block.map(p => p.x)
            const ys = block.map(p => p.y)
            const minX = Math.min(...xs)
            const maxX = Math.max(...xs)
            const minY = Math.min(...ys)
            const maxY = Math.max(...ys)

            overlays.push({
              left: minX * 12 + 8,
              top: minY * 12 + 8,
              width: (maxX - minX + 1) * 12,
              height: (maxY - minY + 1) * 12,
              imageUrl: group.imageUrl,
              imageFileId: group.imageFileId,
              linkUrl: group.linkUrl,
            })
          }
        }
      })
    })

    console.log('🎨 PixelGrid: Created', overlays.length, 'image overlays')
    if (overlays.length > 0) {
      console.log('🎨 First overlay (full):', JSON.stringify(overlays[0], null, 2))
    }

    return overlays
  }, [ownedPixels])

  // Group selected pixels into contiguous blocks - optimized version
  const getContiguousBlocks = useMemo((): { x: number; y: number }[][] => {
    if (selectedPixels.length === 0) return []

    const pixelSet = new Set(selectedPixels.map(p => `${p.x},${p.y}`))
    const visited = new Set<string>()
    const blocks: { x: number; y: number }[][] = []

    // Optimized BFS
    const findBlock = (startX: number, startY: number): { x: number; y: number }[] => {
      const block: { x: number; y: number }[] = []
      const queue: { x: number; y: number }[] = [{ x: startX, y: startY }]
      visited.add(`${startX},${startY}`)

      while (queue.length > 0) {
        const current = queue.shift()!
        block.push(current)

        // Check neighbors
        const neighbors = [
          { x: current.x + 1, y: current.y },
          { x: current.x - 1, y: current.y },
          { x: current.x, y: current.y + 1 },
          { x: current.x, y: current.y - 1 },
        ]

        for (let i = 0; i < neighbors.length; i++) {
          const neighbor = neighbors[i]
          const key = `${neighbor.x},${neighbor.y}`
          if (pixelSet.has(key) && !visited.has(key)) {
            visited.add(key)
            queue.push(neighbor)
          }
        }
      }

      return block
    }

    // Find all blocks
    for (let i = 0; i < selectedPixels.length; i++) {
      const pixel = selectedPixels[i]
      const key = `${pixel.x},${pixel.y}`
      if (!visited.has(key)) {
        const block = findBlock(pixel.x, pixel.y)
        if (block.length > 0) {
          blocks.push(block)
        }
      }
    }

    return blocks
  }, [selectedPixels])

  // Calculate overlay position and size for each block - memoized
  const previewOverlays = useMemo(() => {
    if (!previewImage || selectedPixels.length === 0) return []

    const blocks = getContiguousBlocks // This is already a memoized value

    return blocks.map((block) => {
      // Find bounding box efficiently
      let minX = block[0].x, maxX = block[0].x
      let minY = block[0].y, maxY = block[0].y

      for (let i = 1; i < block.length; i++) {
        const p = block[i]
        if (p.x < minX) minX = p.x
        if (p.x > maxX) maxX = p.x
        if (p.y < minY) minY = p.y
        if (p.y > maxY) maxY = p.y
      }

      // Calculate position and size (each pixel is 12px)
      return {
        left: minX * 12 + 8, // 8px padding from container
        top: minY * 12 + 8,
        width: (maxX - minX + 1) * 12,
        height: (maxY - minY + 1) * 12,
      }
    })
  }, [previewImage, getContiguousBlocks])

  const { playSound } = useAudio()

  return (
    <div className="inline-block border border-white/10 rounded-lg p-2 bg-slate-900/50 backdrop-blur-sm relative" style={{ position: 'relative' }}>
      <div
        className="grid gap-0 select-none relative z-0"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          width: `${GRID_SIZE * 12}px`,
          position: 'relative',
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
          const x = index % GRID_SIZE
          const y = Math.floor(index / GRID_SIZE)
          const owned = isOwned(x, y)
          const selected = isSelected(x, y)
          const pixel = owned ? ownedPixelsMap.get(`${x},${y}`) : null
          const pixelColor = selected ? 'bg-primary-500' : (owned ? ((pixel?.imageUrl || pixel?.imageFileId) ? 'bg-transparent' : 'bg-gray-400') : 'bg-white border border-gray-200')

          return (
            <div
              key={`${x}-${y}`}
              className={`${pixelColor} cursor-pointer relative overflow-hidden`}
              style={{
                width: '12px',
                height: '12px',
              }}
              onClick={(e) => {
                if (!owned) {
                  onPixelClick(x, y)
                  playSound('click')
                }
              }}
              onMouseEnter={(e) => {
                setHoveredPixel({ x, y })
                onPixelHover(x, y)
                playSound('hover')

                // Premium Tooltip Logic
                if (showTooltip) {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const containerRect = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect()

                  setTooltipData({
                    x: rect.left - (containerRect?.left || 0) + 6,
                    y: rect.top - (containerRect?.top || 0) - 10,
                    pixel: pixel || ({ x, y } as Pixel),
                    visible: true
                  })
                }
              }}
              onMouseLeave={() => {
                setHoveredPixel(null)
                setTooltipData(prev => ({ ...prev, visible: false }))
              }}
            />
          )
        })}
      </div>

      {/* Premium Tooltip */}
      <AnimatePresence>
        {tooltipData.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute z-[100] w-64 bg-slate-900/90 backdrop-blur-2xl border border-[#BF953F]/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto"
            style={{
              left: tooltipData.x,
              bottom: `calc(100% - ${tooltipData.y}px + 20px)`,
              transform: 'translateX(-50%)'
            }}
          >
            {/* Estate Image Header */}
            <div className="h-32 w-full bg-black/40 relative overflow-hidden group/img">
              {tooltipData.pixel?.imageUrl || tooltipData.pixel?.imageFileId ? (
                <img
                  src={tooltipData.pixel?.imageFileId ? `/api/images/${tooltipData.pixel.imageFileId}` : tooltipData.pixel?.imageUrl}
                  className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700"
                  alt="Estate Preview"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-black">
                  <ShieldCheck className="w-12 h-12 text-[#BF953F]/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2">
                <div className="px-2 py-0.5 rounded-full bg-[#BF953F] text-[10px] font-bold text-black uppercase tracking-wider">
                  {isOwned(tooltipData.pixel?.x || 0, tooltipData.pixel?.y || 0) ? 'Established' : 'Prime Sector'}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-[#FCF6BA] font-serif font-bold text-lg mb-0.5">
                    {tooltipData.pixel?.username || 'Digital Estate'}
                  </h4>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                    Section {tooltipData.pixel?.x}, {tooltipData.pixel?.y}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[#BF953F] font-bold text-sm">₹{(tooltipData.pixel?.price || PIXEL_PRICE_PER_MONTH).toLocaleString()}</span>
                  <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
                    <TrendingUp className="w-2.5 h-2.5" />
                    +12%
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                  <span className="block text-[8px] text-slate-500 uppercase tracking-wider mb-1">Rarity</span>
                  <span className="text-[10px] text-slate-200 font-bold">Exalted</span>
                </div>
                <div className="bg-black/40 p-2 rounded-xl border border-white/5 text-right">
                  <span className="block text-[8px] text-slate-500 uppercase tracking-wider mb-1">Status</span>
                  <span className="text-[10px] text-slate-200 font-bold">Verified</span>
                </div>
              </div>

              {/* Action Button */}
              {tooltipData.pixel?.linkUrl ? (
                <button
                  onClick={() => window.open(tooltipData.pixel?.linkUrl, '_blank')}
                  className="w-full py-2.5 bg-[#BF953F] hover:bg-[#FCF6BA] text-black text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
                >
                  Discover Portfolio
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={() => onPixelClick(tooltipData.pixel?.x || 0, tooltipData.pixel?.y || 0)}
                  className="w-full py-2.5 bg-white/5 hover:bg-[#BF953F]/20 text-[#FCF6BA] border border-[#BF953F]/30 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Acquire Estate
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Image Overlays - One for each contiguous block */}
      {previewImage && previewOverlays.map((overlay, index) => (
        <div
          key={`preview-${index}`}
          className="absolute z-20 pointer-events-none border-2 border-yellow-400 border-dashed"
          style={{
            left: `${overlay.left}px`,
            top: `${overlay.top}px`,
            width: `${overlay.width}px`,
            height: `${overlay.height}px`,
          }}
        >
          <img
            src={previewImage}
            alt={`Preview block ${index + 1}`}
            className={`w-full h-full opacity-90 ${fitImages ? 'object-fill' : 'object-cover'}`}
            style={{ imageRendering: 'auto' }}
          />
        </div>
      ))}

      {/* Owned Image Overlays - Combined images for owned pixel blocks */}
      {getOwnedImageOverlays.map((overlay, index) => {
        // Skip if no image source at all
        if (!overlay.imageUrl && !overlay.imageFileId) return null

        return (
          <div
            key={`owned-${overlay.imageFileId || overlay.imageUrl || index}-${index}`}
            className="absolute z-10 pointer-events-auto cursor-pointer hover:opacity-90 transition-opacity"
            style={{
              left: `${overlay.left}px`,
              top: `${overlay.top}px`,
              width: `${overlay.width}px`,
              height: `${overlay.height}px`,
              backgroundColor: 'transparent',
            }}
            onClick={() => {
              if (!disableLinks && overlay.linkUrl) {
                window.open(overlay.linkUrl, '_blank')
              }
            }}
            title={!disableLinks && overlay.linkUrl ? 'Click to visit link' : 'Owned pixel'}
          >
            <img
              src={overlay.imageFileId ? `/api/images/${overlay.imageFileId}` : (overlay.imageUrl || '')}
              alt={`Logo overlay ${index + 1}`}
              className="w-full h-full object-cover"
              style={{
                imageRendering: 'auto',
                display: 'block',
              }}
              loading="lazy"
              onError={(e) => {
                console.error('Failed to load image:', overlay.imageFileId || overlay.imageUrl)
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
