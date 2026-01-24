'use client'

import { useState, useMemo, memo, useCallback } from 'react'
import { GRID_SIZE, BLOCK_WIDTH, BLOCK_HEIGHT, BLOCKS_PER_ROW, BLOCKS_PER_COL } from '@/lib/constants'

interface Pixel {
  x: number
  y: number
  userId?: string
  imageUrl?: string
  imageFileId?: string // GridFS file ID
  linkUrl?: string
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
}

export default function PixelGrid({
  ownedPixels,
  selectedPixels,
  onPixelClick,
  onPixelHover,
  previewImage,
  availableBlocks = [],
  fitImages = false,
}: PixelGridProps) {
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number } | null>(null)

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
      if (p.imageUrl || p.imageFileId) {
        pixelsWithImages.push(p)
      }
    }

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
      imageUrl: string
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

            // Use imageFileId if available (GridFS), otherwise imageUrl (base64)
            const imageSource = group.imageFileId
              ? `/api/images/${group.imageFileId}`
              : (group.imageUrl || '')

            if (imageSource) {
              overlays.push({
                left: minX * 12 + 8,
                top: minY * 12 + 8,
                width: (maxX - minX + 1) * 12,
                height: (maxY - minY + 1) * 12,
                imageUrl: imageSource,
                linkUrl: group.linkUrl,
              })
            }
          }
        }
      })
    })

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
          const pixelColor = selected ? 'bg-primary-500' : (owned ? (pixel?.imageUrl ? 'bg-transparent' : 'bg-gray-400') : 'bg-white border border-gray-200')

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
                }
              }}
              onMouseEnter={() => {
                setHoveredPixel({ x, y })
                onPixelHover(x, y)
              }}
              onMouseLeave={() => setHoveredPixel(null)}
              title={owned ? 'Owned' : `(${x}, ${y}) - Click to select ${BLOCK_WIDTH}x${BLOCK_HEIGHT} block`}
            />
          )
        })}
      </div>

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
        if (!overlay.imageUrl || overlay.imageUrl.trim() === '') return null

        return (
          <div
            key={`owned-${overlay.imageUrl}-${index}`}
            className="absolute z-10 pointer-events-auto cursor-pointer hover:opacity-90 transition-opacity"
            style={{
              left: `${overlay.left}px`,
              top: `${overlay.top}px`,
              width: `${overlay.width}px`,
              height: `${overlay.height}px`,
              backgroundColor: 'transparent',
            }}
            onClick={() => {
              if (overlay.linkUrl) {
                window.open(overlay.linkUrl, '_blank')
              }
            }}
            title={overlay.linkUrl ? 'Click to visit link' : 'Owned pixel'}
          >
            <img
              src={overlay.imageUrl}
              alt={`Logo overlay ${index + 1}`}
              className="w-full h-full object-cover"
              style={{
                imageRendering: 'auto',
                display: 'block',
              }}
              loading="lazy"
              onError={(e) => {
                console.error('Failed to load image:', overlay.imageUrl)
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
