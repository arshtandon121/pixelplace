'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import PixelGrid from '@/components/PixelGrid'
import PixelLogo from '@/components/PixelLogo'
import { GRID_SIZE, BLOCK_WIDTH, BLOCK_HEIGHT, BLOCKS_PER_ROW, BLOCKS_PER_COL } from '@/lib/constants'
import { DEFAULT_PACKAGE_ID, MEMBERSHIP_PACKAGES, membershipPriceInr, type MembershipPackageId } from '@/lib/membership'
import { ShoppingCart, Sparkles, Zap, Upload, X, Link as LinkIcon, CreditCard, ShieldCheck } from 'lucide-react'
import ImageCropper, { prepareImageForCrop } from '@/components/ImageCropper'
import CheckoutOverlay from '@/components/CheckoutOverlay'

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

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [linkUrl, setLinkUrl] = useState<string>('')
  const [packageId, setPackageId] = useState<MembershipPackageId>(DEFAULT_PACKAGE_ID)
  const [showCropper, setShowCropper] = useState(false)
  const [tempImage, setTempImage] = useState<string | null>(null)
  const [fitImage, setFitImage] = useState(false)
  const [preparingImage, setPreparingImage] = useState(false)

  // Calculate available blocks
  const availableBlocks = useMemo(() => {
    const blocks: Array<{ blockX: number; blockY: number; pixels: { x: number; y: number }[] }> = []

    for (let blockY = 0; blockY < BLOCKS_PER_COL; blockY++) {
      for (let blockX = 0; blockX < BLOCKS_PER_ROW; blockX++) {
        const startX = blockX * BLOCK_WIDTH
        const startY = blockY * BLOCK_HEIGHT
        const blockPixels: { x: number; y: number }[] = []
        let isAvailable = true

        for (let dy = 0; dy < BLOCK_HEIGHT; dy++) {
          for (let dx = 0; dx < BLOCK_WIDTH; dx++) {
            const pixelX = startX + dx
            const pixelY = startY + dy

            if (pixelX >= GRID_SIZE || pixelY >= GRID_SIZE) {
              isAvailable = false
              break
            }

            const isOwned = ownedPixels.some(p => p.x === pixelX && p.y === pixelY)
            if (isOwned) {
              isAvailable = false
              break
            }

            blockPixels.push({ x: pixelX, y: pixelY })
          }
          if (!isAvailable) break
        }

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

    if (blockX >= 0 && blockX < BLOCKS_PER_ROW && blockY >= 0 && blockY < BLOCKS_PER_COL) {
      return { blockX, blockY }
    }
    return null
  }

  // Find the available block that contains the clicked pixel
  const findAvailableBlockForPixel = (x: number, y: number): { x: number; y: number }[] | null => {
    const blockInfo = getBlockForPixel(x, y)
    if (!blockInfo) return null

    const availableBlock = availableBlocks.find(
      block => block.blockX === blockInfo.blockX && block.blockY === blockInfo.blockY
    )

    return availableBlock ? availableBlock.pixels : null
  }

  const handlePixelClick = (x: number, y: number) => {
    const isOwned = ownedPixels.some(p => p.x === x && p.y === y)
    if (isOwned) {
      toast.error('This block is already listed')
      return
    }

    const availableBlock = findAvailableBlockForPixel(x, y)

    if (!availableBlock || availableBlock.length === 0) {
      toast.error('This block is not fully open. Pick a fully available block.')
      return
    }

    const allSelected = availableBlock.every(p =>
      selectedPixels.some(sp => sp.x === p.x && sp.y === p.y)
    )

    if (allSelected) {
      setSelectedPixels(selectedPixels.filter(p =>
        !availableBlock.some(ab => ab.x === p.x && ab.y === p.y)
      ))
      toast.success(`Deselected block (${availableBlock.length} pixels)`)
    } else {
      const newSelection = selectedPixels.filter(p =>
        !availableBlock.some(ab => ab.x === p.x && ab.y === p.y)
      )
      setSelectedPixels([...newSelection, ...availableBlock])
      toast.success(`Selected block: ${availableBlock.length} pixels`)
    }
  }

  const listingSize = useMemo(() => {
    if (selectedPixels.length === 0) return { aspect: 2, outputWidth: 480, outputHeight: 240 }
    const xs = selectedPixels.map((p) => p.x)
    const ys = selectedPixels.map((p) => p.y)
    const cols = Math.max(...xs) - Math.min(...xs) + 1
    const rows = Math.max(...ys) - Math.min(...ys) + 1
    return {
      aspect: cols / rows,
      outputWidth: Math.min(800, Math.max(120, cols * 24)),
      outputHeight: Math.min(800, Math.max(60, rows * 24)),
    }
  }, [selectedPixels])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image should be under 8MB')
      return
    }

    setPreparingImage(true)
    try {
      const workingImage = await prepareImageForCrop(file)
      setTempImage(workingImage)
      setShowCropper(true)
    } catch {
      toast.error('Failed to read image')
    } finally {
      setPreparingImage(false)
    }
  }

  const startCheckout = async () => {
    if (!uploadedImage) {
      toast.error('Please upload your logo image')
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
          packageId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to start checkout')
        setCheckoutLoading(false)
        return
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }

      toast.error('Checkout URL missing')
      setCheckoutLoading(false)
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Something went wrong')
      setCheckoutLoading(false)
    }
  }

  const selectedPackage = MEMBERSHIP_PACKAGES.find((p) => p.id === packageId) || MEMBERSHIP_PACKAGES[3]
  const totalPrice = membershipPriceInr(selectedPixels.length, packageId)
  const totalPriceINR = totalPrice.toFixed(2)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-[#BF953F]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-[#BF953F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-serif">Loading canvas...</div>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-black text-white p-3 sm:p-4 pb-16 sm:pb-20 relative overflow-x-hidden">
        {/* Background Ambience */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#BF953F]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#BF953F]/5 rounded-full blur-[120px]" />

          {/* 3D Grid Background */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `
              linear-gradient(to right, #BF953F 1px, transparent 1px),
              linear-gradient(to bottom, #BF953F 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'center center'
          }} />

          {/* Floating Particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-[#BF953F] rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.5, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 md:mb-8 bg-gold-glass p-3 md:p-4 rounded-xl sticky top-2 md:top-4 z-40 shadow-2xl">
          <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto min-w-0">
            <PixelLogo size="sm" />
            <div className="hidden md:block h-8 w-px bg-[#BF953F]/30" />
            <h1 className="hidden md:block text-lg lg:text-xl font-bold font-serif text-[#FCF6BA]">
              Live pixel canvas
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-black/40 rounded-lg border border-[#BF953F]/20">
              <div className={`w-2 h-2 rounded-full ${availableBlocks.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs md:text-sm font-light text-[#E5E5E5]">
                {availableBlocks.length > 0 ? 'Available' : 'Sold Out'}
              </span>
            </div>

            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-[#BF953F]/10 hover:bg-[#BF953F]/20 text-[#FCF6BA] rounded-lg border border-[#BF953F]/30 transition-all font-medium text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Your listings</span>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8 relative z-10">

          {/* Left Panel: Controls */}
          <div className="lg:w-80 flex-shrink-0 space-y-4 md:space-y-6 order-2 lg:order-1">
            {/* Status Card */}
            <div className="glass-panel p-4 md:p-6 border-gold relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#BF953F]/5 to-transparent pointer-events-none" />
              <h2 className="text-[#FCF6BA] font-bold mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
                <Sparkles className="w-4 h-4 text-[#BF953F]" />
                Selection Status
              </h2>

              {selectedPixels.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  <div className="flex justify-between items-center text-xs md:text-sm p-2.5 md:p-3 bg-black/40 rounded-lg border border-[#BF953F]/10">
                    <span className="text-slate-400">Selected Blocks</span>
                    <span className="text-white font-mono font-bold">{selectedPixels.length}</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] md:text-xs text-[#BF953F] uppercase tracking-widest font-bold">Membership</label>
                    <p className="text-[9px] md:text-[10px] text-slate-500">1 hour to 1 year. All terms are one-time. Renew the same listing from the dashboard before it ends.</p>
                    <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                      {MEMBERSHIP_PACKAGES.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setPackageId(opt.id)}
                          className={`px-1.5 md:px-2 py-1.5 md:py-2 text-[10px] md:text-xs font-bold rounded-lg border transition-all text-left ${packageId === opt.id
                            ? 'bg-[#BF953F] text-black border-[#BF953F]'
                            : 'bg-black/40 text-slate-400 border-white/10 hover:border-[#BF953F]/50 hover:text-white'
                            }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>{opt.label}</span>
                            {opt.recommended && (
                              <span className={`text-[7px] uppercase tracking-wide ${packageId === opt.id ? 'text-black/60' : 'text-[#BF953F]'}`}>Best</span>
                            )}
                          </div>
                          <div className={`text-[8px] font-medium mt-0.5 ${packageId === opt.id ? 'text-black/70' : 'text-slate-500'}`}>{opt.blurb}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 md:pt-4 border-t border-[#BF953F]/20">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-slate-400 text-xs md:text-sm">Listing total</span>
                      <div className="text-right">
                        <div className="text-xl md:text-2xl font-bold text-[#FCF6BA] font-serif">
                          ₹{membershipPriceInr(selectedPixels.length, packageId).toLocaleString()}
                        </div>
                        <div className="text-[9px] md:text-[10px] text-[#BF953F]">{selectedPackage.label}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedPixels([])}
                      className="w-full mt-2 md:mt-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-500 hover:text-red-400 font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <X className="w-3 h-3" /> Clear Selection
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 md:py-8 text-slate-500">
                  <p className="text-xs md:text-sm">Select an open block to place your logo and link.</p>
                </div>
              )}
            </div>

            {/* Configure Estate Panel - Inline */}
            {selectedPixels.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-panel p-4 md:p-6 border-[#BF953F]/30 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#BF953F]/5 to-transparent pointer-events-none" />
                <h2 className="text-[#FCF6BA] font-bold mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
                  <Upload className="w-4 h-4 text-[#BF953F]" />
                  Listing details
                </h2>

                <div className="space-y-3 md:space-y-4 relative z-10">
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-[#BF953F] uppercase mb-2">Logo image</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => document.getElementById('image-upload')?.click()}
                        disabled={preparingImage}
                        className="flex-1 py-2.5 md:py-3 border border-dashed border-[#BF953F]/40 rounded-lg text-slate-400 hover:text-[#FCF6BA] hover:bg-[#BF953F]/10 transition-colors flex items-center justify-center gap-2 text-xs md:text-sm disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        {preparingImage ? 'Opening…' : uploadedImage ? 'Change' : 'Select'}
                      </button>
                      {uploadedImage && (
                        <button
                          onClick={() => setUploadedImage(null)}
                          className="px-3 py-2.5 md:py-3 border border-red-500/40 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5 text-xs md:text-sm"
                        >
                          <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      )}
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                    {uploadedImage && (
                      <div className="mt-3 overflow-hidden rounded-lg border border-[#BF953F]/25 bg-black/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={uploadedImage} alt="Cropped logo preview" className="w-full h-20 object-contain" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-[#BF953F] uppercase mb-2">Destination Link</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-500" />
                      <input
                        type="url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://your-brand.com"
                        className="w-full bg-black/50 border border-slate-700 rounded-lg py-2 pl-9 md:pl-10 pr-4 text-xs md:text-sm text-white placeholder-slate-600 focus:border-[#BF953F] focus:ring-1 focus:ring-[#BF953F] outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPaymentModal(true)}
                    disabled={!uploadedImage}
                    className="w-full btn-luxury flex items-center justify-center gap-2 text-sm md:text-base py-2.5 md:py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Proceed to Payment
                  </button>
                </div>
              </motion.div>
            )}

            {/* Guidelines */}
            <div className="glass-panel p-4 md:p-6 border-white/5">
              <h3 className="text-slate-300 font-bold mb-3 md:mb-4 text-xs md:text-sm uppercase tracking-wide">How to list</h3>
              <ul className="space-y-2 md:space-y-3 text-[10px] md:text-xs text-slate-400 leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-[#BF953F] font-bold">01.</span>
                  <span>Select vacant (white) blocks on the grid.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#BF953F] font-bold">02.</span>
                  <span>Choose a listing from 1 hour to 1 year.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#BF953F] font-bold">03.</span>
                  <span>Upload your logo and link.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#BF953F] font-bold">04.</span>
                  <span>Pay securely. Listings must follow the <a href="/terms" className="text-[#BF953F] hover:text-[#FCF6BA]">listing rules</a>.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Center: Canvas */}
          <div className="flex-1 min-w-0 relative order-1 lg:order-2">
            {/* Floating 3D Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-20 h-20 opacity-10 pointer-events-none">
              <motion.div
                animate={{
                  rotateX: [0, 360],
                  rotateY: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="w-full h-full border-2 border-[#BF953F] rounded-lg"
                style={{ transformStyle: "preserve-3d" }}
              />
            </div>
            <div className="absolute -bottom-10 -left-10 w-16 h-16 opacity-10 pointer-events-none">
              <motion.div
                animate={{
                  rotateX: [360, 0],
                  rotateZ: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="w-full h-full border-2 border-[#FCF6BA] rounded-lg"
                style={{ transformStyle: "preserve-3d" }}
              />
            </div>

            <div className="glass-panel p-1.5 md:p-2 border-[#BF953F]/20 shadow-[0_0_50px_-10px_rgba(191,149,63,0.1)] relative overflow-hidden">
              <PixelGrid
                ownedPixels={ownedPixels}
                selectedPixels={selectedPixels}
                onPixelClick={handlePixelClick}
                onPixelHover={() => { }}
                previewImage={uploadedImage || tempImage}
                availableBlocks={availableBlocks}
                fitImages={fitImage}
                disableLinks={true}
              />
            </div>

            <div className="flex justify-between items-center gap-2 mt-3 md:mt-4">
              <label className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-[#FCF6BA] cursor-pointer hover:opacity-80 transition-opacity p-1.5 md:p-2 bg-black/40 rounded-lg border border-[#BF953F]/20">
                <input
                  type="checkbox"
                  checked={fitImage}
                  onChange={(e) => setFitImage(e.target.checked)}
                  className="rounded border-[#BF953F]/40 bg-black text-[#BF953F] focus:ring-[#BF953F]"
                />
                <span>Fit Preview to Scale</span>
              </label>

              <div className="text-[10px] md:text-xs text-slate-500 flex items-center gap-1.5">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-[#BF953F] rounded-full"
                />
                <span>Live Preview</span>
              </div>
            </div>
          </div>
        </div>



        {/* Cropper Modal */}
        {showCropper && tempImage && (
          <ImageCropper
            imageSrc={tempImage}
            aspect={listingSize.aspect}
            outputWidth={listingSize.outputWidth}
            outputHeight={listingSize.outputHeight}
            onCropComplete={(croppedImage) => {
              setUploadedImage(croppedImage)
              setTempImage(null)
              setShowCropper(false)
            }}
            onCancel={() => {
              setTempImage(null)
              setShowCropper(false)
            }}
          />
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
            <div className="bg-slate-900 border border-[#BF953F]/40 rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-5 md:p-8 shadow-[0_0_50px_-10px_rgba(191,149,63,0.2)] relative max-h-[92dvh] overflow-y-auto">
              {!checkoutLoading && (
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="absolute top-3 right-3 md:top-4 md:right-4 text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              )}

              <div className="text-center mb-5 md:mb-6">
                <h3 className="text-xl md:text-2xl font-serif font-bold text-[#FCF6BA] mb-2">Checkout</h3>
                <p className="text-slate-400 text-xs md:text-sm">
                  Pay securely. Your listing goes live as soon as payment succeeds. By paying you agree to the{' '}
                  <a href="/terms" className="text-[#BF953F] hover:text-[#FCF6BA]">listing rules</a>.
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Pixels</span>
                    <span className="text-white font-mono">{selectedPixels.length}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                  <span>Membership</span>
                  <span className="text-white">{selectedPackage.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    One-time payment for this term. Renew from the dashboard to keep the same pixels and logo.
                  </p>
                </div>

                <div className="bg-[#BF953F]/10 p-4 rounded-xl border border-[#BF953F]/20 flex justify-between items-center text-sm">
                  <span className="text-slate-300">Total Due</span>
                  <span className="text-xl font-bold text-[#FCF6BA] font-serif">₹{totalPriceINR}</span>
                </div>

                <div className="bg-emerald-500/10 p-3 rounded-lg flex gap-3 items-start border border-emerald-500/20">
                  <div className="p-1 bg-emerald-500/20 rounded">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-300">Automatic approval</h4>
                    <p className="text-xs text-emerald-400/70 mt-1">
                      After payment succeeds, your listing goes live. No admin wait.
                    </p>
                  </div>
                </div>

                <button
                  disabled={checkoutLoading}
                  onClick={startCheckout}
                  className="w-full btn-luxury flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard className="w-4 h-4" />
                  {checkoutLoading ? 'Sending to checkout…' : 'Pay securely'}
                </button>
              </div>
            </div>
          </div>
        )}

        {checkoutLoading && (
          <CheckoutOverlay
            title="Sending your listing to checkout"
            detail="Keep this tab open. You will be taken to Dodo Payments in a moment."
          />
        )}
      </div>
    </>
  )
}
