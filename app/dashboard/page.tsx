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
  amount?: number
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
      toast.success('Acquisition request submitted successfully.')
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

  const handleRemovePixel = async (pixel: Pixel) => {
    if (!confirm('Are you sure you want to release this estate? It will become available for others.')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/pixels/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ x: pixel.x, y: pixel.y })
      })

      if (res.ok) {
        toast.success('Estate released successfully')
        loadUserPixels()
      } else {
        toast.error('Failed to release estate')
      }
    } catch (error) {
      toast.error('Error releasing estate')
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
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <PixelLogo size="sm" />
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
              {pixels.map((pixel, i) => (
                <div key={i} className="bg-gold-glass p-6 rounded-xl group hover:border-[#BF953F]/50 transition-all duration-500">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#BF953F]/20 flex items-center justify-center border border-[#BF953F]/30 text-[#FCF6BA] font-mono font-bold">
                        #{i + 1}
                      </div>
                      <div>
                        <div className="text-xs text-[#BF953F] uppercase font-bold">Coordinates</div>
                        <div className="text-white font-mono">({pixel.x}, {pixel.y})</div>
                      </div>
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Active
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm py-2 border-b border-[#BF953F]/10">
                      <span className="text-slate-400">Acquired</span>
                      <span className="text-white">
                        {pixel.purchasedAt ? new Date(pixel.purchasedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-[#BF953F]/10">
                      <span className="text-slate-400">Expires</span>
                      <span className="text-[#FCF6BA]">
                        {pixel.expiresAt ? new Date(pixel.expiresAt).toLocaleDateString() : 'Lifetime'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemovePixel(pixel)}
                    className="w-full py-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-medium transition-colors uppercase tracking-widest opacity-60 hover:opacity-100"
                  >
                    Release Asset
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Transaction History */}
        <section className="pb-20">
          <h2 className="text-2xl font-serif font-bold text-[#FCF6BA] mb-6 flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-[#BF953F]" />
            Transaction Ledger
          </h2>

          <div className="glass-panel overflow-hidden border-gold">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#BF953F]/10 text-[#BF953F] uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Assets</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#BF953F]/10">
                  {purchases.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">No transaction records found.</td></tr>
                  ) : (
                    purchases.map((p) => (
                      <tr key={p._id} className="hover:bg-[#BF953F]/5 transition-colors">
                        <td className="p-4 text-sm text-slate-300">
                          {new Date(p.purchasedAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-xs font-mono text-[#FCF6BA]">
                          {p.orderId}
                        </td>
                        <td className="p-4 text-sm text-white">
                          {p.pixelCount} Block{p.pixelCount > 1 ? 's' : ''}
                        </td>
                        <td className="p-4 text-sm font-bold text-[#FCF6BA]">
                          ₹{p.amount ?? '-'}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border w-fit
                                                  ${p.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                p.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                              {p.status || 'Pending'}
                            </span>
                            {p.status === 'rejected' && (
                              <div className="text-[10px] text-red-500 max-w-[150px]">{p.rejectionReason}</div>
                            )}
                            {p.status === 'rejected' && !p.refundStatus && (
                              <button onClick={() => setRefundOrderId(p.orderId)} className="text-[10px] text-[#BF953F] underline hover:text-[#FCF6BA] text-left">
                                Request Refund
                              </button>
                            )}
                            {p.refundStatus === 'requested' && (
                              <div className="text-[10px] text-yellow-500">Refund Requested</div>
                            )}
                            {p.refundStatus === 'processed' && (
                              <div className="text-[10px] text-emerald-500">Refund Processed</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      {/* Refund Modal */}
      {refundOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-[#BF953F]/30 rounded-xl p-6 w-full max-w-sm shadow-2xl animate-fade-in relative">
            <h3 className="text-xl font-bold text-[#FCF6BA] mb-2 font-serif">Request Refund</h3>
            <p className="text-sm text-slate-400 mb-4">
              Please provide your UPI ID or Binance Pay ID.
            </p>

            <input
              className="w-full bg-black/40 border border-[#BF953F]/30 rounded-lg p-3 text-white text-sm mb-4 focus:ring-1 focus:ring-[#BF953F] outline-none"
              placeholder="e.g. user@upl or Binance ID"
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
                className="px-4 py-2 text-slate-400 hover:text-white font-medium text-sm"
                disabled={submittingRefund}
              >
                Cancel
              </button>
              <button
                onClick={submitRefundRequest}
                disabled={submittingRefund || !refundDetails.trim()}
                className="btn-luxury py-2 px-4 text-sm"
              >
                {submittingRefund ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-[#BF953F]">Loading Details...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
