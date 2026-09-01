'use client'

import { useState } from 'react'
import Cropper from 'react-easy-crop'
import { Check, X, ZoomIn, ZoomOut } from 'lucide-react'

interface ImageCropperProps {
  imageSrc: string
  aspect: number
  outputWidth?: number
  outputHeight?: number
  onCropComplete: (croppedImage: string) => void
  onCancel: () => void
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })
}

export async function prepareImageForCrop(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(objectUrl)
    const maxEdge = 1400
    const scale = Math.min(1, maxEdge / Math.max(image.width, image.height))
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not prepare image')
    ctx.fillStyle = '#0d0c0a'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(image, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', 0.9)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function cropToDataUrl(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  outputWidth: number,
  outputHeight: number
): Promise<string> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  canvas.width = Math.max(1, Math.round(outputWidth))
  canvas.height = Math.max(1, Math.round(outputHeight))
  ctx.fillStyle = '#0d0c0a'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  )
  return canvas.toDataURL('image/jpeg', 0.88)
}

export default function ImageCropper({
  imageSrc,
  aspect,
  outputWidth = 480,
  outputHeight = 240,
  onCropComplete,
  onCancel,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!croppedAreaPixels || saving) return
    setSaving(true)
    try {
      const croppedImage = await cropToDataUrl(imageSrc, croppedAreaPixels, outputWidth, outputHeight)
      onCropComplete(croppedImage)
    } catch (e) {
      console.error(e)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--ks-lacquer)]/85 p-4">
      <div className="ks-plinth w-full max-w-lg overflow-hidden bg-[var(--ks-raised)]">
        <div className="px-5 py-4 border-b border-[var(--ks-rule)] flex justify-between items-center">
          <div>
            <h3 className="text-[var(--ks-champagne)] text-lg">Fit your logo</h3>
            <p className="text-xs text-[var(--ks-muted)] mt-1">Drag and zoom so it fills the pixels you picked.</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-[var(--ks-muted)] hover:text-[var(--ks-champagne)]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative w-full h-[min(52vh,360px)] bg-[var(--ks-lacquer-deep)]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
            onZoomChange={setZoom}
            objectFit="contain"
            showGrid
            cropShape="rect"
            style={{
              containerStyle: { background: 'var(--ks-lacquer-deep)' },
              cropAreaStyle: {
                border: '1px solid var(--ks-kinpaku)',
                boxShadow: '0 0 0 9999em oklch(7% 0.006 95 / 0.72)',
              },
            }}
          />
        </div>

        <div className="p-5">
          <div className="flex items-center gap-3 mb-5">
            <ZoomOut className="w-4 h-4 text-[var(--ks-faint)]" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[var(--ks-kinpaku)]"
              aria-label="Zoom"
            />
            <ZoomIn className="w-4 h-4 text-[var(--ks-faint)]" />
          </div>
          <div className="flex gap-2">
            <button onClick={onCancel} className="glass-button flex-1" disabled={saving}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !croppedAreaPixels} className="btn-luxury flex-1 !py-2.5 disabled:opacity-50">
              {saving ? 'Saving…' : (
                <span className="inline-flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Use this crop
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
