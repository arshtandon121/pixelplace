'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { LogOut, CheckCircle, CreditCard, Image as ImageIcon, Box, Layers, Calendar, ChevronRight } from 'lucide-react'
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
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [pixels, setPixels] = useState<Pixel[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (searchParams?.get('success') === 'true') {
      toast.success('Payment successful! Your pixels are now yours.')
    }
    checkAuth()
    loadUserPixels()
    loadPurchases()
  }, [searchParams])

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
      const startTime = Date.now()
      const token = localStorage.getItem('token')
      const res = await fetch('/api/pixels/user', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPixels(data.pixels || [])
      } else {
        toast.error('Failed to load your pixels')
      }
    } catch (error) {
      console.error('Dashboard load error:', error)
      toast.error('Failed to load your pixels')
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
      console.error('Failed to load purchases:', error)
    }
  }

  const [refundOrderId, setRefundOrderId] = useState<string | null>(null)
  const [refundDetails, setRefundDetails] = useState('')
  const [submittingRefund, setSubmittingRefund] = useState(false)

  const submitRefundRequest = async () => {
    if (!refundOrderId || !refundDetails.trim()) {
      toast.error('Please enter payment details')
      return
    }
    setSubmittingRefund(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/user/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderId: refundOrderId, refundDetails })
      })
      if (res.ok) {
        toast.success('Refund requested successfully')
        setRefundOrderId(null)
        setRefundDetails('')
        loadPurchases()
      } else {
        toast.error('Failed to request refund')
      }
    } catch (e) {
      toast.error('Error submitting request')
    } finally {
      setSubmittingRefund(false)
    }
  }

  const getImageSrc = (purchase: Purchase): string | null => {
    if (purchase.imageFileId) {
      return `/api/images/${purchase.imageFileId}`
    }
    if (purchase.imageUrl) {
      return purchase.imageUrl
    }
    return null
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500 mr-3"></div>
        Loading...
      </div>
    )
  }

  const totalSpent = pixels.reduce((sum, pixel) => sum + (pixel.price || 0), 0)

  return (
    <div className="min-h-screen pb-20">
      {/* Navbar */}
      <nav className="glass-panel sticky top-4 mx-4 mt-4 z-50 mb-8 border-white/5">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <PixelLogo size="sm" />
          <div className="flex items-center gap-6">
            <Link href="/canvas" className="text-secondary-200 hover:text-white transition font-medium">
              Canvas
            </Link>
            <div className="flex items-center gap-4 pl-6 border-l border-white/10">
              <span className="text-slate-400 text-sm hidden sm:inline">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-primary-300 hover:text-white transition text-sm font-medium p-2 hover:bg-white/5 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <h1 className="text-4xl font-bold mb-3 heading-gradient inline-block">Dashboard</h1>
          <p className="text-slate-400 text-lg">Manage your digital collection and transaction history</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 animate-slide-up">
          <div className="glass-card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-primary-500/10 rounded-lg text-primary-400">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm text-slate-400">Total Pixels</div>
                <div className="text-2xl font-bold text-white">{pixels.length}</div>
              </div>
            </div>
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 w-1/2"></div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-secondary-500/10 rounded-lg text-secondary-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm text-slate-400">Total Invested</div>
                <div className="text-2xl font-bold text-white">₹{totalSpent.toFixed(2)}</div>
              </div>
            </div>
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-secondary-500 w-3/4"></div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm text-slate-400">Transactions</div>
                <div className="text-2xl font-bold text-white">{purchases.length}</div>
              </div>
            </div>
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-2/3"></div>
            </div>
          </div>
        </div>

        {/* Tabs */}


        {/* Content Area */}
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-cyan-400" />
            Transaction History
          </h2>
          {purchases.length === 0 ? (
            <div className="glass-panel p-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-secondary-500/20 to-primary-500/20 flex items-center justify-center border border-white/10">
                <CreditCard className="w-10 h-10 text-secondary-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">No History</h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">You haven't made any transactions yet.</p>
              <Link
                href="/canvas"
                className="btn-primary"
              >
                Buy Pixels
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {purchases.map((purchase) => {
                const imageSrc = getImageSrc(purchase)
                const totalPrice = purchase.pixelCount * PIXEL_PRICE_PER_MONTH
                return (
                  <div key={purchase._id} className="glass-card group flex flex-col h-full">
                    {/* Image Preview */}
                    <div className="relative w-full aspect-video bg-black/40 border-b border-white/5 p-4 flex items-center justify-center overflow-hidden">
                      {imageSrc ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={imageSrc}
                            alt="Transaction Item"
                            fill
                            className="object-contain transition-transform duration-500 group-hover:scale-110"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <ImageIcon className="w-12 h-12 text-slate-700" />
                      )}
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs text-white font-mono border border-white/10">
                        {purchase.pixelCount} px
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Total</div>
                          <div className="text-xl font-bold text-white">₹{totalPrice.toFixed(2)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Date</div>
                          <div className="text-sm text-slate-300 flex items-center gap-1 justify-end">
                            <Calendar className="w-3 h-3" />
                            {new Date(purchase.purchasedAt).toLocaleDateString()}
                          </div>

                          {purchase.status === 'rejected' && purchase.rejectionReason && (
                            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded p-3 text-xs text-red-300">
                              <strong>Rejected:</strong> {purchase.rejectionReason}
                            </div>
                          )}
                          <div className="mt-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                ${purchase.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                purchase.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                  'bg-yellow-500/20 text-yellow-400'}`}>
                              {purchase.status || 'manual'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {purchase.status === 'rejected' && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          {purchase.refundStatus === 'processed' ? (
                            <div className="text-emerald-400 text-xs font-bold flex items-center gap-2 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                              <CheckCircle className="w-4 h-4" />
                              <div>
                                <div>Refund Processed</div>
                                <div className="font-normal opacity-80 text-[10px]">Credited in 1-2 business days</div>
                              </div>
                            </div>
                          ) : purchase.refundStatus === 'requested' ? (
                            <div className="text-yellow-400 text-xs font-bold flex items-center gap-2 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                              <div className="animate-pulse w-2 h-2 rounded-full bg-yellow-400" />
                              Refund Requested
                            </div>
                          ) : (
                            <button
                              onClick={() => setRefundOrderId(purchase.orderId)}
                              className="w-full text-xs bg-red-500/10 text-red-400 border border-red-500/30 py-2 rounded hover:bg-red-500/20 transition font-bold"
                            >
                              Request Refund
                            </button>
                          )}
                        </div>
                      )}

                      {purchase.status === 'rejected' && purchase.rejectionReason && (
                        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded p-3 text-xs text-red-300 mt-2">
                          <strong>Rejected:</strong> {purchase.rejectionReason}
                        </div>
                      )}

                      <div className="space-y-3 mb-4 flex-1">
                        <div className="text-xs font-mono text-slate-500 bg-slate-950/50 p-2 rounded border border-white/5 truncate">
                          ID: {purchase.orderId}
                        </div>

                        {/* Coordinates Preview */}
                        <div className="flex flex-wrap gap-1">
                          {purchase.coordinates.slice(0, 3).map((coord, i) => (
                            <span key={i} className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-white/5">
                              {coord.x},{coord.y}
                            </span>
                          ))}
                          {purchase.coordinates.length > 3 && (
                            <span className="text-[10px] font-mono text-slate-500 px-1 py-0.5">
                              +{purchase.coordinates.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      {purchase.linkUrl && (
                        <a
                          href={purchase.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary w-full text-center text-sm py-2 mt-auto"
                        >
                          Visit Link
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Refund Modal */}
      {
        refundOrderId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl animate-fade-in relative">
              <h3 className="text-xl font-bold text-white mb-2">Request Refund</h3>
              <p className="text-sm text-slate-400 mb-4">
                Please provide your UPI ID or Binance Pay ID where you would like to receive the refund.
              </p>

              <input
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm mb-4 focus:ring-2 focus:ring-cyan-500 outline-none"
                placeholder="e.g. user@upl or Binance ID 123456"
                value={refundDetails}
                onChange={(e) => setRefundDetails(e.target.value)}
                autoFocus
              />

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setRefundOrderId(null)
                    setRefundDetails('')
                  }}
                  className="px-4 py-2 text-slate-400 hover:text-white font-medium"
                  disabled={submittingRefund}
                >
                  Cancel
                </button>
                <button
                  onClick={submitRefundRequest}
                  disabled={submittingRefund || !refundDetails.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-bold transition hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingRefund ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
