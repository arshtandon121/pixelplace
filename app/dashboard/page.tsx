'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { LogOut, CheckCircle, CreditCard, Image as ImageIcon, Box, Layers, Calendar, ChevronRight, ShieldCheck, ExternalLink, Edit, Link as LinkIcon2, Clock, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import PixelLogo from '@/components/PixelLogo'
import { PIXEL_PRICE_PER_MONTH } from '@/lib/constants'

interface Pixel {
  _id?: string
  x: number
  y: number
  userId?: string
  imageUrl?: string
  imageFileId?: string
  linkUrl?: string
  purchasedAt?: Date
  price?: number
  expiresAt?: Date
  status?: 'pending' | 'active' | 'rejected'
}

interface Purchase {
  _id?: string
  userId: string
  orderId: string
  paymentId: string
  pixelCount: number
  coordinates: { x: number; y: number }[]
  purchasedAt: Date
  imageUrl?: string | null
  imageFileId?: string | null
  linkUrl?: string | null
  status?: 'pending' | 'completed' | 'rejected'
  rejectionReason?: string
  refundStatus?: 'requested' | 'processed'
  refundDetails?: string
  refundRequestedAt?: Date
  amount?: number
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [pixels, setPixels] = useState<Pixel[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [releasingGroup, setReleasingGroup] = useState<{ pixels: Pixel[], count: number } | null>(null)
  const [refundingPurchase, setRefundingPurchase] = useState<{ orderId: string, pixels: Pixel[] } | null>(null)
  const [refundDetails, setRefundDetails] = useState({ accountNumber: '', ifsc: '', upi: '', notes: '', screenshot: null as File | null })
  const [editingLink, setEditingLink] = useState<{ pixels: Pixel[], currentLink: string } | null>(null)
  const [newLink, setNewLink] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const checkoutId = searchParams?.get('checkout_id')

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        if (checkoutId) {
          try {
            const confirmRes = await fetch('/api/checkout/confirm', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ checkoutId }),
            })
            const confirmData = await confirmRes.json()
            if (confirmRes.ok && confirmData.status === 'completed') {
              toast.success('Payment confirmed. Your estate is live.')
            } else if (confirmRes.ok && confirmData.status && confirmData.status !== 'completed') {
              toast('Payment is still processing. This page will update shortly.')
            }
          } catch (error) {
            console.error('Checkout confirm error:', error)
          }
        } else if (searchParams?.get('success') === 'true') {
          toast.success('Acquisition completed successfully.')
        }

        const [pixelsRes, purchasesRes] = await Promise.all([
          fetch('/api/pixels/user', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/purchases', { headers: { Authorization: `Bearer ${token}` } })
        ])

        const pixelsData = await pixelsRes.json()
        const purchasesData = await purchasesRes.json()

        if (pixelsData.pixels) setPixels(pixelsData.pixels)
        if (purchasesData.purchases) setPurchases(purchasesData.purchases)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load estate or purchases')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
    fetchData()
  }, [searchParams])

  // Map purchase status to pixels based on coordinates
  const getPixelPurchaseStatus = (pixel: Pixel): 'pending' | 'completed' | 'rejected' | undefined => {
    const purchase = purchases.find(p =>
      p.coordinates?.some((coord: any) => coord.x === pixel.x && coord.y === pixel.y)
    )
    return purchase?.status
  }

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

  const loadUserPixels = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/pixels/user', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPixels(data.pixels || [])
      } else {
        toast.error('Failed to load your estate')
      }
    } catch (error) {
      console.error('Dashboard load error:', error)
      toast.error('Failed to load estate')
    } finally {
      setLoading(false)
    }
  }

  const loadPurchases = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/purchases', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPurchases(data.purchases || [])
      }
    } catch (error) {
      console.error('Error loading purchases:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  const handleRemovePixels = async (pixelsToRemove: { x: number, y: number }[]) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/pixels/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pixels: pixelsToRemove })
      })

      if (res.ok) {
        toast.success(`Estate released successfully`)
        loadUserPixels()
        setReleasingGroup(null)
      } else {
        toast.error('Failed to release estate')
      }
    } catch (error) {
      toast.error('Failed to delete pixels')
    }
  }

  const handleRefundRequest = async () => {
    if (!refundingPurchase) return

    if (!refundDetails.accountNumber && !refundDetails.upi) {
      toast.error('Please provide either Account Number or UPI ID')
      return
    }

    try {
      const token = localStorage.getItem('token')
      let screenshotFileId = null

      // Upload screenshot if provided
      if (refundDetails.screenshot) {
        const formData = new FormData()
        formData.append('image', refundDetails.screenshot)

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        })

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          screenshotFileId = uploadData.fileId
        }
      }

      const res = await fetch('/api/purchases/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: refundingPurchase.orderId,
          refundDetails: {
            ...refundDetails,
            screenshot: undefined, // Remove file object
            screenshotFileId // Add fileId instead
          }
        })
      })

      if (res.ok) {
        toast.success('Refund request submitted successfully')
        setRefundingPurchase(null)
        setRefundDetails({ accountNumber: '', ifsc: '', upi: '', notes: '', screenshot: null })
        // Refresh purchases
        const purchasesRes = await fetch('/api/purchases', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await purchasesRes.json()
        if (data.purchases) setPurchases(data.purchases)
      } else {
        toast.error('Failed to submit refund request')
      }
    } catch (error) {
      toast.error('Error submitting refund request')
    }
  }

  const handleUpdateLink = async () => {
    if (!editingLink) return
    setIsUpdating(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/pixels/update-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pixels: editingLink.pixels.map(p => ({ x: p.x, y: p.y })),
          linkUrl: newLink
        })
      })

      if (res.ok) {
        toast.success('Link updated successfully')
        loadUserPixels()
        setEditingLink(null)
      } else {
        toast.error('Failed to update link')
      }
    } catch (error) {
      toast.error('Error updating link')
    } finally {
      setIsUpdating(false)
    }
  }

  const totalSpent = pixels.reduce((sum, pixel) => sum + (pixel.price || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-[#BF953F]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#BF953F] mr-3"></div>
        Accesing Vault...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#BF953F]/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#BF953F]/5 rounded-full blur-[150px]" />
      </div>

      <header className="flex justify-between items-center mb-12 container mx-auto relative z-10 glass-panel p-6 border-gold">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:opacity-80 transition-opacity flex items-center">
            <PixelLogo size="sm" noLink />
          </Link>
          <div className="h-8 w-px bg-[#BF953F]/30" />
          <h1 className="text-xl font-serif font-bold text-[#FCF6BA]">Investor Dashboard</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-[#BF953F] uppercase tracking-wider font-bold">Welcome Back</div>
            <div className="font-bold text-white">{user?.name}</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 border border-red-500/20 transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="container mx-auto relative z-10 space-y-12">

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 animate-slide-up">
          <div className="bg-gold-glass p-6 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-[#BF953F]/20 rounded-lg text-[#FCF6BA]">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-[#BF953F] uppercase font-bold">Total Assets</div>
                <div className="text-2xl font-bold text-white font-serif">{pixels.length}</div>
              </div>
            </div>
          </div>

          <div className="bg-gold-glass p-6 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-[#BF953F]/20 rounded-lg text-[#FCF6BA]">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-[#BF953F] uppercase font-bold">Portfolio Value</div>
                <div className="text-2xl font-bold text-white font-serif">₹{totalSpent.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="bg-gold-glass p-6 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-emerald-500 uppercase font-bold">Transactions</div>
                <div className="text-2xl font-bold text-white font-serif">{purchases.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Estate Section */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-serif font-bold text-[#FCF6BA] flex items-center gap-3">
                <Box className="w-6 h-6 text-[#BF953F]" />
                Active Estate Portfolio
              </h2>
              <p className="text-slate-400 text-sm mt-1">Manage your owned digital assets</p>
            </div>

            <Link href="/canvas" className="btn-luxury text-sm py-2 px-6 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Acquire New
            </Link>
          </div>

          {pixels.length === 0 ? (
            <div className="glass-panel p-12 text-center border-dashed border-[#BF953F]/30 bg-[#BF953F]/5">
              <Box className="w-16 h-16 text-[#BF953F]/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Active Assets</h3>
              <p className="text-slate-400 max-w-md mx-auto mb-8">
                You currently do not own any digital estate on PixelPlace. Begin your legacy today.
              </p>
              <Link href="/canvas" className="btn-luxury inline-flex items-center gap-2">
                View Availability
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => {
                const groups: Array<{
                  imageUrl?: string
                  imageFileId?: string
                  linkUrl?: string
                  pixels: Pixel[]
                  count: number
                  expiresAt?: Date
                  status?: 'pending' | 'completed' | 'rejected'
                  orderId?: string
                  refundDetails?: any
                }> = []

                const groupMap = new Map<string, typeof groups[0]>()

                // First, add all pixels
                pixels.forEach(pixel => {
                  const key = `${pixel.imageFileId || pixel.imageUrl || 'no-image'}_${pixel.linkUrl || 'no-link'}`

                  if (!groupMap.has(key)) {
                    // Get purchase status and orderId for this pixel  
                    const purchase = purchases.find(p =>
                      p.coordinates?.some((coord: any) => coord.x === pixel.x && coord.y === pixel.y)
                    )

                    groupMap.set(key, {
                      imageUrl: pixel.imageUrl,
                      imageFileId: pixel.imageFileId,
                      linkUrl: pixel.linkUrl,
                      pixels: [],
                      count: 0,
                      expiresAt: pixel.expiresAt,
                      status: purchase?.status,
                      orderId: purchase?.orderId,
                      refundDetails: purchase?.refundDetails
                    })
                  }

                  const group = groupMap.get(key)!
                  group.pixels.push(pixel)
                  group.count++
                })

                // Then, add rejected purchases that don't have pixels
                purchases.forEach(purchase => {
                  if (purchase.status === 'rejected') {
                    const key = `${purchase.imageFileId || purchase.imageUrl || 'no-image'}_${purchase.linkUrl || 'no-link'}_${purchase.orderId}`

                    if (!groupMap.has(key)) {
                      groupMap.set(key, {
                        imageUrl: purchase.imageUrl ?? undefined,
                        imageFileId: purchase.imageFileId ?? undefined,
                        linkUrl: purchase.linkUrl ?? undefined,
                        pixels: [],
                        count: purchase.pixelCount || 0,
                        expiresAt: purchase.purchasedAt, // Use purchase date
                        status: 'rejected',
                        orderId: purchase.orderId,
                        refundDetails: purchase.refundDetails
                      })
                    }
                  }
                })

                return Array.from(groupMap.values())
              })().map((group, i) => (
                <div key={i} className="bg-gold-glass rounded-xl group hover:border-[#BF953F]/50 transition-all duration-500 overflow-hidden flex flex-col">
                  {/* Image Header */}
                  <div className="h-48 w-full relative bg-black/40 border-b border-[#BF953F]/10 group-hover:bg-black/20 transition-colors">
                    {group.imageFileId || group.imageUrl ? (
                      <Image
                        src={group.imageFileId ? `/api/images/${group.imageFileId}` : group.imageUrl!}
                        alt={`Estate Group ${i + 1}`}
                        fill
                        className="object-contain p-6 group-hover:scale-105 transition-transform duration-700"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[#BF953F]/20">
                        <ImageIcon className="w-12 h-12 mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Awaiting Content</span>
                      </div>
                    )}

                    {group.status === 'pending' ? (
                      <div className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-lg text-[10px] font-bold border border-yellow-500/30 backdrop-blur-sm flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Confirming payment
                      </div>
                    ) : group.status === 'rejected' ? (
                      <div className="absolute top-4 right-4 bg-red-500/20 text-red-400 px-3 py-1 rounded-lg text-[10px] font-bold border border-red-500/30 backdrop-blur-sm flex items-center gap-1">
                        <LogOut className="w-3 h-3" /> Rejected
                      </div>
                    ) : (
                      <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-[10px] font-bold border border-emerald-500/30 backdrop-blur-sm flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Live
                      </div>
                    )}

                    <div className="absolute bottom-4 left-4 bg-black/60 text-[#FCF6BA] px-4 py-1.5 rounded-xl text-xs font-serif font-bold border border-[#BF953F]/30 backdrop-blur-md">
                      #{i + 1}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col font-serif">
                    <div className="mb-6">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold text-[#FCF6BA] mb-1">Premier Digital Estate</h3>
                        {group.status === 'completed' && (
                          <button
                            onClick={() => {
                              setEditingLink({ pixels: group.pixels, currentLink: group.linkUrl || '' })
                              setNewLink(group.linkUrl || '')
                            }}
                            className="p-2 bg-[#BF953F]/10 text-[#BF953F] hover:bg-[#BF953F]/20 rounded-lg border border-[#BF953F]/20 transition-all group/edit"
                            title="Update Link"
                          >
                            <Edit className="w-3.5 h-3.5 group-hover/edit:scale-110 transition-transform" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${group.status === 'pending' ? 'bg-yellow-500' :
                          group.status === 'rejected' ? 'bg-red-500' :
                            'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                          }`} />
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-sans font-bold">
                          {group.status === 'rejected' ? 'Rejected Asset' : 'Historical Asset'} • {group.count} Units
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-[#BF953F]/10">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest">Acquired:</div>
                        <div className="text-sm text-white font-serif">{group.pixels.length > 0 ? new Date(group.pixels[0].purchasedAt || Date.now()).toLocaleDateString() : 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest">Expires:</div>
                        <div className="text-sm text-white font-serif">{group.expiresAt ? new Date(group.expiresAt).toLocaleDateString() : group.status === 'rejected' ? 'Rejected' : 'Never'}</div>
                      </div>
                    </div>

                    <div className="mt-auto space-y-3">
                      {group.linkUrl && group.status === 'completed' && (
                        <button
                          onClick={() => window.open(group.linkUrl, '_blank')}
                          className="w-full py-3.5 bg-gradient-to-r from-[#BF953F] to-[#FCF6BA] text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(191,149,63,0.3)] shadow-lg"
                        >
                          Discover Domain
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}

                      {group.status === 'rejected' && !group.refundDetails && (
                        <button
                          onClick={() => setRefundingPurchase({ orderId: group.orderId!, pixels: group.pixels })}
                          className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                        >
                          Request Refund
                          <ArrowLeft className="w-4 h-4 rotate-180" />
                        </button>
                      )}

                      {group.status === 'rejected' && group.refundDetails && (
                        <div className="w-full py-3.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl text-xs font-bold text-center">
                          Refund Request Submitted
                        </div>
                      )}

                      {group.status === 'completed' && (
                        <button
                          onClick={() => setReleasingGroup({ pixels: group.pixels, count: group.count })}
                          className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-red-500/20"
                        >
                          Release Portfolio
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </section>

        {/* Transaction History - ... rest of section */}

      </main>

      {/* Refund Modal - ... rest of modal      </section>

      {/* Link Update Modal */}
      {
        editingLink && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-slate-900 border border-[#BF953F]/30 rounded-2xl p-8 w-full max-w-md shadow-[0_0_50px_rgba(191,149,63,0.1)] relative"
            >
              <h3 className="text-2xl font-serif font-bold text-[#FCF6BA] mb-2 tracking-tight">Update Estate Domain</h3>
              <p className="text-slate-400 text-sm mb-8">
                Modify the destination URL for your digital real estate. Changes reflect instantly on the public canvas.
              </p>

              <div className="space-y-6">
                <div className="relative">
                  <LinkIcon2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BF953F]" />
                  <input
                    type="url"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="https://your-brand.com"
                    className="w-full bg-black/50 border border-[#BF953F]/20 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:border-[#BF953F] focus:ring-1 focus:ring-[#BF953F] outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleUpdateLink}
                    disabled={isUpdating}
                    className="w-full py-4 bg-gradient-to-r from-[#BF953F] to-[#FCF6BA] text-black rounded-xl font-bold transition-all shadow-lg shadow-[#BF953F]/10 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                  >
                    {isUpdating ? (
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    {isUpdating ? 'Safeguarding...' : 'Update Domain'}
                  </button>
                  <button
                    onClick={() => setEditingLink(null)}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold transition-all uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )
      }

      {/* Release Confirmation Modal */}
      {
        releasingGroup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 w-full max-w-md shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />

              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <LogOut className="w-10 h-10 text-red-500" />
              </div>

              <h3 className="text-2xl font-serif font-bold text-white mb-3 tracking-tight">Release Digital Estate?</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Proceeding will return <span className="text-white font-bold">{releasingGroup.count} pixels</span> to the public domain. This action is irreversible and your lease will be permanently terminated.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleRemovePixels(releasingGroup.pixels)}
                  className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/20 uppercase tracking-widest text-xs"
                >
                  Confirm Release
                </button>
                <button
                  onClick={() => setReleasingGroup(null)}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold transition-all uppercase tracking-widest text-xs"
                >
                  Retain Ownership
                </button>
              </div>
            </motion.div>
          </div>
        )
      }

      {/* Refund Request Modal */}
      {
        refundingPurchase && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-slate-900 border border-blue-500/30 rounded-2xl p-8 w-full max-w-md shadow-[0_0_50px_rgba(59,130,246,0.2)] relative"
            >
              <h3 className="text-2xl font-serif font-bold text-blue-400 mb-2 tracking-tight">Request Refund</h3>
              <p className="text-slate-400 text-sm mb-6">
                Please provide your refund details. Our team will process your request within 5-7 business days.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Bank Account Number</label>
                  <input
                    type="text"
                    value={refundDetails.accountNumber}
                    onChange={(e) => setRefundDetails({ ...refundDetails, accountNumber: e.target.value })}
                    placeholder="Enter account number"
                    className="w-full bg-black/50 border border-slate-700 rounded-lg py-3 px-4 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">IFSC Code</label>
                  <input
                    type="text"
                    value={refundDetails.ifsc}
                    onChange={(e) => setRefundDetails({ ...refundDetails, ifsc: e.target.value })}
                    placeholder="Enter IFSC code"
                    className="w-full bg-black/50 border border-slate-700 rounded-lg py-3 px-4 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-slate-900 px-2 text-slate-500">OR</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">UPI ID</label>
                  <input
                    type="text"
                    value={refundDetails.upi}
                    onChange={(e) => setRefundDetails({ ...refundDetails, upi: e.target.value })}
                    placeholder="username@upi"
                    className="w-full bg-black/50 border border-slate-700 rounded-lg py-3 px-4 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Payment Screenshot (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setRefundDetails({ ...refundDetails, screenshot: file })
                      }
                    }}
                    className="w-full bg-black/50 border border-slate-700 rounded-lg py-3 px-4 text-sm text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30"
                  />
                  {refundDetails.screenshot && (
                    <p className="text-xs text-blue-400 mt-2">Selected: {refundDetails.screenshot.name}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Additional Notes (Optional)</label>
                  <textarea
                    value={refundDetails.notes}
                    onChange={(e) => setRefundDetails({ ...refundDetails, notes: e.target.value })}
                    placeholder="Any additional information..."
                    rows={3}
                    className="w-full bg-black/50 border border-slate-700 rounded-lg py-3 px-4 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button
                    onClick={handleRefundRequest}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest text-xs hover:shadow-blue-500/40"
                  >
                    Submit Refund Request
                  </button>
                  <button
                    onClick={() => {
                      setRefundingPurchase(null)
                      setRefundDetails({ accountNumber: '', ifsc: '', upi: '', notes: '', screenshot: null })
                    }}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold transition-all uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )
      }
    </div >
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-[#BF953F]">Loading Details...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
