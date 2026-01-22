'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import PixelGrid from '@/components/PixelGrid'
import PixelLogo from '@/components/PixelLogo'
import { PIXEL_PRICE_PER_MONTH, TENURE_OPTIONS, GRID_SIZE, BLOCK_WIDTH, BLOCK_HEIGHT, BLOCKS_PER_ROW, BLOCKS_PER_COL } from '@/lib/constants'
import { ShoppingCart, LogOut, Sparkles, Zap, Upload, X, Link as LinkIcon, Crop } from 'lucide-react'
import ImageCropper from '@/components/ImageCropper'

declare global {
  interface Window {
    Razorpay: any
  }
}

interface Pixel {
  x: number
  y: number
  userId?: string
  imageUrl?: string
  linkUrl?: string
}

export default function CanvasPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [ownedPixels, setOwnedPixels] = useState<Pixel[]>([])
  const [selectedPixels, setSelectedPixels] = useState<{ x: number; y: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [linkUrl, setLinkUrl] = useState<string>('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [tenure, setTenure] = useState(1)
  const [showCropper, setShowCropper] = useState(false)
  const [tempImage, setTempImage] = useState<string | null>(null)

  // Calculate available blocks (blocks that are completely empty)
  const availableBlocks = useMemo(() => {
    const blocks: Array<{ blockX: number; blockY: number; pixels: { x: number; y: number }[] }> = []

    // Divide canvas into blocks
    for (let blockY = 0; blockY < BLOCKS_PER_COL; blockY++) {
      for (let blockX = 0; blockX < BLOCKS_PER_ROW; blockX++) {
        const startX = blockX * BLOCK_WIDTH
        const startY = blockY * BLOCK_HEIGHT
        const blockPixels: { x: number; y: number }[] = []
        let isAvailable = true

        // Check all pixels in this block
        for (let dy = 0; dy < BLOCK_HEIGHT; dy++) {
          for (let dx = 0; dx < BLOCK_WIDTH; dx++) {
            const pixelX = startX + dx
            const pixelY = startY + dy

            // Check bounds
            if (pixelX >= GRID_SIZE || pixelY >= GRID_SIZE) {
              isAvailable = false
              break
            }

            // Check if pixel is owned
            const isOwned = ownedPixels.some(p => p.x === pixelX && p.y === pixelY)
            if (isOwned) {
              isAvailable = false
              break
            }

            blockPixels.push({ x: pixelX, y: pixelY })
          }
          if (!isAvailable) break
        }

        // Only add block if it's completely available
        if (isAvailable && blockPixels.length === BLOCK_WIDTH * BLOCK_HEIGHT) {
          blocks.push({
            blockX,
            blockY,
            pixels: blockPixels,
          })
        }
      }
    }

    return blocks
  }, [ownedPixels])

  useEffect(() => {
    checkAuth()
    loadPixels()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        localStorage.removeItem('token')
        router.push('/login')
      }
    } catch (error) {
      localStorage.removeItem('token')
      router.push('/login')
    }
  }

  const loadPixels = async () => {
    try {
      const res = await fetch('/api/pixels')
      const data = await res.json()
      setOwnedPixels(data.pixels || [])
    } catch (error) {
      toast.error('Failed to load pixels')
    } finally {
      setLoading(false)
    }
  }

  // Find which block a pixel belongs to
  const getBlockForPixel = (x: number, y: number): { blockX: number; blockY: number } | null => {
    const blockX = Math.floor(x / BLOCK_WIDTH)
    const blockY = Math.floor(y / BLOCK_HEIGHT)

    // Check if block is valid
    if (blockX >= 0 && blockX < BLOCKS_PER_ROW && blockY >= 0 && blockY < BLOCKS_PER_COL) {
      return { blockX, blockY }
    }
    return null
  }

  // Find the available block that contains the clicked pixel
  const findAvailableBlockForPixel = (x: number, y: number): { x: number; y: number }[] | null => {
    const blockInfo = getBlockForPixel(x, y)
    if (!blockInfo) return null

    // Find the available block that matches
    const availableBlock = availableBlocks.find(
      block => block.blockX === blockInfo.blockX && block.blockY === blockInfo.blockY
    )

    return availableBlock ? availableBlock.pixels : null
  }

  const handlePixelClick = (x: number, y: number) => {
    // Check if pixel is already owned
    const isOwned = ownedPixels.some(p => p.x === x && p.y === y)
    if (isOwned) {
      toast.error('This pixel is already owned')
      return
    }

    // Find the available block that contains this pixel
    const availableBlock = findAvailableBlockForPixel(x, y)

    if (!availableBlock || availableBlock.length === 0) {
      toast.error('This block is not completely available. Please select a fully available block.')
      return
    }

    // Check if this entire block is already selected
    const allSelected = availableBlock.every(p =>
      selectedPixels.some(sp => sp.x === p.x && sp.y === p.y)
    )

    if (allSelected) {
      // Deselect the entire block
      setSelectedPixels(selectedPixels.filter(p =>
        !availableBlock.some(ab => ab.x === p.x && ab.y === p.y)
      ))
      toast.success(`Deselected block (${availableBlock.length} pixels)`)
    } else {
      // Select the entire block (remove any overlapping selections first)
      const newSelection = selectedPixels.filter(p =>
        !availableBlock.some(ab => ab.x === p.x && ab.y === p.y)
      )
      setSelectedPixels([...newSelection, ...availableBlock])
      toast.success(`Selected block: ${availableBlock.length} pixels (${BLOCK_WIDTH}×${BLOCK_HEIGHT})`)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('Image size should be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setTempImage(reader.result as string)
      setShowCropper(true)
    }
    reader.onerror = () => {
      toast.error('Failed to read image')
    }
    reader.readAsDataURL(file)

    // Reset input
    e.target.value = ''
  }

  const handlePixelHover = (x: number, y: number) => {
    // Could show tooltip or highlight
  }

  const handleCheckout = async () => {
    if (selectedPixels.length === 0) {
      toast.error('Please select at least one pixel')
      return
    }

    // Show upload modal if image not uploaded
    if (!uploadedImage) {
      setShowUploadModal(true)
      return
    }

    setCheckoutLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pixels: selectedPixels,
          imageUrl: uploadedImage,
          linkUrl: linkUrl || undefined,
          tenure,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to create payment order')
        setCheckoutLoading(false)
        return
      }

      if (!data.keyId) {
        toast.error('Razorpay key ID is missing. Please check your configuration.')
        setCheckoutLoading(false)
        return
      }

      if (!window.Razorpay) {
        toast.error('Razorpay SDK not loaded. Please refresh the page.')
        setCheckoutLoading(false)
        return
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'PixelPlace.in',
        description: `Purchase ${selectedPixels.length} pixel${selectedPixels.length > 1 ? 's' : ''} for ${tenure} month${tenure > 1 ? 's' : ''}`,
        order_id: data.orderId,
        handler: async function (response: any) {
          // Verify payment on server
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              pixels: selectedPixels,
              imageUrl: uploadedImage, // Still pass it as fallback
              linkUrl: linkUrl || undefined,
              tempOrderId: data.tempOrderId, // Pass tempOrderId to retrieve from DB
            }),
          })

          const verifyData = await verifyRes.json()
          if (verifyRes.ok) {
            toast.success('Payment successful! Your logo is now visible on the canvas.')
            setSelectedPixels([])
            setUploadedImage(null)
            setLinkUrl('')
            setTenure(1)
            loadPixels()
            router.push('/dashboard?success=true')
          } else {
            toast.error(verifyData.error || 'Payment verification failed')
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#0ea5e9',
        },
        modal: {
          ondismiss: function () {
            setCheckoutLoading(false)
          },
        },
      }

      const razorpay = new window.Razorpay(options)

      razorpay.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error)
        toast.error(`Payment failed: ${response.error.description || 'Unknown error'}`)
        setCheckoutLoading(false)
      })

      razorpay.open()
      setCheckoutLoading(false)
    } catch (error) {
      toast.error('Something went wrong')
      setCheckoutLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  const totalPrice = selectedPixels.length * PIXEL_PRICE_PER_MONTH * tenure
  const totalPriceINR = totalPrice.toFixed(2)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-700">Loading Canvas...</div>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => console.log('Razorpay loaded')}
      />
      <div className="min-h-screen pixel-bg">
        <nav className="pixel-card backdrop-blur-md shadow-lg border-b border-cyan-500/30 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <PixelLogo size="sm" />
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-cyan-300 hover:text-cyan-100 font-medium transition pixel-text">
                Dashboard
              </Link>
              <span className="text-cyan-200 font-medium">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-cyan-300 hover:text-cyan-100 transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8">
          {showCropper && tempImage && selectedPixels.length > 0 && (
            <ImageCropper
              imageSrc={tempImage}
              aspect={
                (() => {
                  // Calculate aspect ratio based on bounding box of selected pixels
                  const xs = selectedPixels.map(p => p.x)
                  const ys = selectedPixels.map(p => p.y)
                  const minX = Math.min(...xs)
                  const maxX = Math.max(...xs)
                  const minY = Math.min(...ys)
                  const maxY = Math.max(...ys)

                  const width = (maxX - minX + 1) * BLOCK_WIDTH
                  const height = (maxY - minY + 1) * BLOCK_HEIGHT
                  return width / height
                })()
              }
              onCropComplete={(croppedImage) => {
                setUploadedImage(croppedImage)
                setShowCropper(false)
                setTempImage(null)
                toast.success('Image cropped and uploaded!')
              }}
              onCancel={() => {
                setShowCropper(false)
                setTempImage(null)
              }}
            />
          )}

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl font-bold pixel-text mb-3 bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
              Pixel Canvas
            </h1>
            <p className="text-lg text-cyan-300 font-medium">
              Click any pixel in an available block to select the entire {BLOCK_WIDTH}×{BLOCK_HEIGHT} block. Upload your logo, select tenure, then pay. Each pixel costs ₹{PIXEL_PRICE_PER_MONTH}/month.
            </p>
            <p className="text-sm text-cyan-400 mt-2 pixel-text font-bold">
              Available blocks: {availableBlocks.length} of {BLOCKS_PER_ROW * BLOCKS_PER_COL} total blocks
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 flex justify-center pixel-card rounded-2xl p-8 pixel-glow bg-black/20"
            >
              <div className="inline-block shadow-2xl">
                <PixelGrid
                  ownedPixels={ownedPixels}
                  selectedPixels={selectedPixels}
                  onPixelClick={handlePixelClick}
                  onPixelHover={handlePixelHover}
                  previewImage={uploadedImage}
                  availableBlocks={availableBlocks}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:w-96 pixel-card rounded-2xl shadow-2xl p-6 h-fit sticky top-24"
            >
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h2 className="text-2xl font-bold pixel-text text-cyan-400">Your Selection</h2>
              </div>

              {selectedPixels.length === 0 ? (
                <div className="text-center py-8">
                  <Zap className="w-12 h-12 text-cyan-500/50 mx-auto mb-3" />
                  <p className="text-cyan-300 font-bold">No pixels selected</p>
                  <p className="text-sm text-cyan-400/80 mt-2 font-medium">Click on any pixel to auto-select available space</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 p-4 pixel-card rounded-xl border border-cyan-500/40">
                    <p className="text-cyan-300 mb-2 flex items-center gap-2 font-medium">
                      <span>Selected:</span>
                      <span className="font-bold text-cyan-400 pixel-text">{selectedPixels.length} pixel{selectedPixels.length > 1 ? 's' : ''}</span>
                    </p>

                    {/* Tenure Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-bold pixel-text text-cyan-400 mb-2">
                        Select Tenure
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {TENURE_OPTIONS.map((option) => (
                          <button
                            key={option.months}
                            onClick={() => setTenure(option.months)}
                            className={`px-3 py-2 rounded-lg text-sm font-bold transition ${tenure === option.months
                              ? 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(0,217,255,0.5)]'
                              : 'bg-transparent text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/10'
                              }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 mt-4 pt-4 border-t border-cyan-500/30">
                      <div className="flex justify-between text-sm text-cyan-300">
                        <span>Price per pixel:</span>
                        <span>₹{PIXEL_PRICE_PER_MONTH}/mo</span>
                      </div>
                      <div className="flex justify-between text-sm text-cyan-300">
                        <span>Duration:</span>
                        <span>{tenure} month{tenure > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex justify-between items-baseline mt-2">
                        <span className="text-lg font-bold text-cyan-300">Total:</span>
                        <div className="text-right">
                          <span className="text-3xl font-bold pixel-text bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                            ₹{(totalPriceINR)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  <div className="mb-6 p-4 pixel-card rounded-xl border border-cyan-500/30">
                    <label className="block text-sm font-bold pixel-text text-cyan-400 mb-2">
                      Upload Your Logo/Image
                    </label>
                    {uploadedImage ? (
                      <div className="relative mb-3">
                        <img
                          src={uploadedImage}
                          alt="Uploaded logo"
                          className="w-full h-32 object-contain rounded-lg border border-cyan-500/50 pixel-glow"
                        />
                        <button
                          onClick={() => {
                            setUploadedImage(null)
                            setLinkUrl('')
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition pixel-glow"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-cyan-500/50 rounded-lg cursor-pointer hover:border-cyan-400 hover:bg-cyan-500/10 transition pixel-card">
                        <Upload className="w-8 h-8 text-cyan-400 mb-2" />
                        <span className="text-sm text-cyan-300">Click to upload image</span>
                        <span className="text-xs text-cyan-400/70 mt-1">PNG, JPG up to 2MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}

                    {uploadedImage && (
                      <div className="mt-3">
                        <label className="block text-sm font-bold pixel-text text-cyan-400 mb-2">
                          <LinkIcon className="w-4 h-4 inline mr-1" />
                          Link URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          placeholder="https://yourwebsite.com"
                          className="w-full px-3 py-2 pixel-card border border-cyan-500/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-sm text-cyan-100 bg-transparent placeholder:text-cyan-500/50"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mb-6 max-h-48 overflow-y-auto custom-scrollbar">
                    <p className="text-xs text-cyan-400/80 mb-2 font-bold">Selected pixels:</p>
                    <div className="space-y-1">
                      {selectedPixels.slice(0, 10).map((pixel, index) => (
                        <div key={index} className="text-xs font-mono text-cyan-300">
                          ({pixel.x}, {pixel.y})
                        </div>
                      ))}
                      {selectedPixels.length > 10 && (
                        <p className="text-xs text-cyan-400/80 font-medium">... and {selectedPixels.length - 10} more</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading || !uploadedImage}
                    className="w-full pixel-button text-white py-4 rounded-xl font-bold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {checkoutLoading ? 'Processing...' : uploadedImage ? 'Proceed to Payment' : 'Upload Image First'}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedPixels([])
                      setUploadedImage(null)
                      setLinkUrl('')
                    }}
                    className="w-full mt-3 text-cyan-300 py-2 rounded-lg hover:bg-cyan-500/20 transition font-medium border border-cyan-500/30"
                  >
                    Clear Selection
                  </button>
                </>
              )}

              <div className="mt-6 pt-6 border-t border-cyan-500/40">
                <p className="text-sm text-cyan-400 flex items-start gap-2 font-medium">
                  <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>Tip: Click any pixel to auto-select the largest available space!</span>
                </p>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </>
  )
}

