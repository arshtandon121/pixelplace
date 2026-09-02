'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { LogOut, ExternalLink } from 'lucide-react'
import PixelLogo from '@/components/PixelLogo'
import CheckoutOverlay from '@/components/CheckoutOverlay'
import { DEFAULT_PACKAGE_ID, formatExpiry, type MembershipPackageId } from '@/lib/membership'

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
  packageId?: MembershipPackageId
  packageLabel?: string
  autoRenew?: boolean
}

type ListingGroup = {
  imageUrl?: string
  imageFileId?: string
  linkUrl?: string
  pixels: Pixel[]
  count: number
  expiresAt?: Date
  purchasedAt?: Date
  status?: 'pending' | 'completed' | 'rejected'
  orderId?: string
  refundDetails?: any
  packageId?: MembershipPackageId
  packageLabel?: string
  autoRenew?: boolean
  rejectionReason?: string
}

function pickPurchaseForPixel(purchases: Purchase[], pixel: Pixel): Purchase | undefined {
  const matching = purchases.filter((p) =>
    p.coordinates?.some((coord) => coord.x === pixel.x && coord.y === pixel.y)
  )
  if (matching.length === 0) return undefined
  const rank = (status?: string) => (status === 'completed' ? 3 : status === 'pending' ? 1 : 0)
  return [...matching].sort((a, b) => {
    const byStatus = rank(b.status) - rank(a.status)
    if (byStatus !== 0) return byStatus
    return new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
  })[0]
}

function buildListingGroups(pixels: Pixel[], purchases: Purchase[]): ListingGroup[] {
  const groupMap = new Map<string, ListingGroup>()

  pixels.forEach((pixel) => {
    const key = `${pixel.imageFileId || pixel.imageUrl || 'no-image'}_${pixel.linkUrl || 'no-link'}`
    if (!groupMap.has(key)) {
      const purchase = pickPurchaseForPixel(purchases, pixel)
      groupMap.set(key, {
        imageUrl: pixel.imageUrl,
        imageFileId: pixel.imageFileId,
        linkUrl: pixel.linkUrl,
        pixels: [],
        count: 0,
        expiresAt: pixel.expiresAt,
        purchasedAt: pixel.purchasedAt,
        status: purchase?.status,
        orderId: purchase?.orderId,
        refundDetails: purchase?.refundDetails,
        packageId: purchase?.packageId,
        packageLabel: purchase?.packageLabel,
        autoRenew: purchase?.autoRenew,
        rejectionReason: purchase?.rejectionReason,
      })
    }
    const group = groupMap.get(key)!
    group.pixels.push(pixel)
    group.count++
  })

  purchases.forEach((purchase) => {
    if (purchase.status !== 'rejected') return
    const key = `${purchase.imageFileId || purchase.imageUrl || 'no-image'}_${purchase.linkUrl || 'no-link'}_${purchase.orderId}`
    if (groupMap.has(key)) return
    groupMap.set(key, {
      imageUrl: purchase.imageUrl ?? undefined,
      imageFileId: purchase.imageFileId ?? undefined,
      linkUrl: purchase.linkUrl ?? undefined,
      pixels: [],
      count: purchase.pixelCount || 0,
      expiresAt: purchase.purchasedAt,
      purchasedAt: purchase.purchasedAt,
      status: 'rejected',
      orderId: purchase.orderId,
      refundDetails: purchase.refundDetails,
      rejectionReason: purchase.rejectionReason,
    })
  })

  return Array.from(groupMap.values())
}

function websiteLabel(url?: string) {
  if (!url) return 'No website yet'
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function rupees(amount?: number) {
  if (amount == null || Number.isNaN(amount)) return '—'
  return `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function isExpired(expiresAt?: Date) {
  if (!expiresAt) return false
  const date = new Date(expiresAt)
  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now()
}

function statusCopy(group: ListingGroup) {
  if (group.status === 'pending') {
    return { label: 'Unpaid', hint: 'These pixels are held for you. Finish payment to go live, or release them so someone else can take them.' }
  }
  if (group.status === 'rejected') {
    return { label: 'Not approved', hint: group.rejectionReason || 'This listing was not approved. You can request a refund.' }
  }
  if (isExpired(group.expiresAt)) {
    return { label: 'Ended', hint: 'This listing is no longer on the canvas.' }
  }
  return { label: 'Live', hint: 'Your logo and link are on the public canvas.' }
}

function orderStatusLabel(status?: string) {
  if (status === 'completed') return 'Paid'
  if (status === 'pending') return 'Unpaid'
  if (status === 'expired') return 'Cancelled'
  if (status === 'rejected') return 'Not approved'
  return status || '—'
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--ks-lacquer)] text-[var(--ks-text)]">
      {children}
    </div>
  )
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [pixels, setPixels] = useState<Pixel[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [releasingGroup, setReleasingGroup] = useState<{ pixels: Pixel[]; count: number } | null>(null)
  const [refundingPurchase, setRefundingPurchase] = useState<{ orderId: string; pixels: Pixel[] } | null>(null)
  const [refundDetails, setRefundDetails] = useState({ accountNumber: '', ifsc: '', upi: '', notes: '', screenshot: null as File | null })
  const [editingLink, setEditingLink] = useState<{ pixels: Pixel[]; currentLink: string } | null>(null)
  const [newLink, setNewLink] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [renewingOrderId, setRenewingOrderId] = useState<string | null>(null)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)

  const listings = useMemo(() => buildListingGroups(pixels, purchases), [pixels, purchases])
  const orders = useMemo(
    () => [...purchases].sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()),
    [purchases]
  )

  const liveCount = listings.filter((g) => g.status !== 'rejected' && g.status !== 'pending' && !isExpired(g.expiresAt)).length
  const pendingCount = listings.filter((g) => g.status === 'pending').length
  const expiringSoon = listings.find((g) => {
    if (g.status === 'rejected' || g.status === 'pending' || !g.expiresAt) return false
    const ms = new Date(g.expiresAt).getTime() - Date.now()
    return ms > 0 && ms < 7 * 24 * 60 * 60 * 1000
  })

  const refreshListings = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    const [pixelsRes, purchasesRes] = await Promise.all([
      fetch('/api/pixels/user', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/purchases', { headers: { Authorization: `Bearer ${token}` } }),
    ])
    const pixelsData = await pixelsRes.json()
    const purchasesData = await purchasesRes.json()
    if (pixelsData.pixels) setPixels(pixelsData.pixels)
    if (purchasesData.purchases) setPurchases(purchasesData.purchases)
  }

  const startResumePayment = async (orderId: string) => {
    setRenewingOrderId(orderId)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resumeOrderId: orderId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Unable to reopen checkout')
        setRenewingOrderId(null)
        return
      }
      if (data.fulfilled) {
        toast.success('Payment already went through. Your listing is live.')
        setRenewingOrderId(null)
        await refreshListings()
        return
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
      toast.error('Checkout URL missing')
      setRenewingOrderId(null)
    } catch (error) {
      toast.error('Unable to reopen checkout')
      setRenewingOrderId(null)
    }
  }

  const cancelPendingOrder = async (orderId: string) => {
    setCancellingOrderId(orderId)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/checkout/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Unable to release these pixels')
        return
      }
      toast.success('Pixels released. You can place them again from the canvas.')
      await refreshListings()
    } catch (error) {
      toast.error('Unable to release these pixels')
    } finally {
      setCancellingOrderId(null)
    }
  }

  const startRenewal = async (orderId: string, packageId?: MembershipPackageId) => {
    setRenewingOrderId(orderId)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          renewOrderId: orderId,
          packageId: packageId || DEFAULT_PACKAGE_ID,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Unable to start renewal')
        setRenewingOrderId(null)
        return
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
      toast.error('Checkout URL missing')
      setRenewingOrderId(null)
    } catch (error) {
      toast.error('Unable to start renewal')
      setRenewingOrderId(null)
    }
  }

  useEffect(() => {
    const checkoutId = searchParams?.get('checkout_id') || searchParams?.get('session_id')
    const paymentId = searchParams?.get('payment_id')
    const paymentStatus = searchParams?.get('status')

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        if (checkoutId || paymentId) {
          try {
            const confirmRes = await fetch('/api/checkout/confirm', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                sessionId: checkoutId,
                checkoutId,
                paymentId,
              }),
            })
            const confirmData = await confirmRes.json()
            if (confirmRes.ok && confirmData.status === 'completed') {
              toast.success('Payment confirmed. Your listing is live.')
            } else if (confirmRes.ok && confirmData.status && confirmData.status !== 'completed') {
              toast('Payment is still processing. This page will update shortly.')
            }
          } catch (error) {
            console.error('Checkout confirm error:', error)
          }
        } else if (paymentStatus === 'succeeded' || searchParams?.get('success') === 'true') {
          toast.success('Payment completed. Your listing is live.')
        }

        const [pixelsRes, purchasesRes] = await Promise.all([
          fetch('/api/pixels/user', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/purchases', { headers: { Authorization: `Bearer ${token}` } }),
        ])

        const pixelsData = await pixelsRes.json()
        const purchasesData = await purchasesRes.json()

        if (pixelsData.pixels) setPixels(pixelsData.pixels)
        if (purchasesData.purchases) setPurchases(purchasesData.purchases)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load listings')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
    fetchData()
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
        toast.error('Failed to load your listings')
      }
    } catch (error) {
      console.error('Dashboard load error:', error)
      toast.error('Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  const handleRemovePixels = async (pixelsToRemove: { x: number; y: number }[]) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/pixels/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pixels: pixelsToRemove }),
      })

      if (res.ok) {
        toast.success('Listing ended')
        loadUserPixels()
        setReleasingGroup(null)
      } else {
        toast.error('Failed to end listing')
      }
    } catch (error) {
      toast.error('Failed to end listing')
    }
  }

  const handleRefundRequest = async () => {
    if (!refundingPurchase) return

    if (!refundDetails.accountNumber && !refundDetails.upi) {
      toast.error('Add a bank account or a UPI ID')
      return
    }

    try {
      const token = localStorage.getItem('token')
      let screenshotFileId = null

      if (refundDetails.screenshot) {
        const formData = new FormData()
        formData.append('image', refundDetails.screenshot)

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: refundingPurchase.orderId,
          refundDetails: {
            ...refundDetails,
            screenshot: undefined,
            screenshotFileId,
          },
        }),
      })

      if (res.ok) {
        toast.success('Refund request submitted')
        setRefundingPurchase(null)
        setRefundDetails({ accountNumber: '', ifsc: '', upi: '', notes: '', screenshot: null })
        const purchasesRes = await fetch('/api/purchases', {
          headers: { Authorization: `Bearer ${token}` },
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pixels: editingLink.pixels.map((p) => ({ x: p.x, y: p.y })),
          linkUrl: newLink,
        }),
      })

      if (res.ok) {
        toast.success('Link updated')
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

  if (loading) {
    return (
      <DashboardShell>
        <div className="min-h-screen flex items-center justify-center">
          <p className="ks-mono text-[var(--ks-kinpaku)]">Loading your listings</p>
        </div>
      </DashboardShell>
    )
  }

  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <DashboardShell>
      <header className="border-b border-[var(--ks-rule)]">
        <div className="ks-section py-3 sm:py-4 flex justify-between items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <PixelLogo size="sm" />
            <span className="hidden sm:block h-6 w-px bg-[var(--ks-rule)]" />
            <h1 className="hidden sm:block text-sm text-[var(--ks-muted)]">Your listings</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            <Link href="/canvas" className="hidden sm:inline ks-mono text-[var(--ks-muted)] hover:text-[var(--ks-champagne)]">
              Canvas
            </Link>
            <Link href="/canvas" className="btn-luxury !py-2 !px-3 sm:!px-4 text-xs sm:text-sm whitespace-nowrap">
              Place a listing
            </Link>
            <button
              onClick={handleLogout}
              className="ks-mono text-[var(--ks-muted)] hover:text-[var(--ks-champagne)] flex items-center gap-2 min-h-10"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="ks-section py-10 md:py-14 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="ks-mono text-[var(--ks-patina-text)] mb-3">Signed in</p>
            <h2 className="ks-headline mb-3">Hi {firstName}.</h2>
            <p className="text-[var(--ks-muted)] text-[15px] leading-[1.7] max-w-[42ch]">
              This is where you see your logo on the canvas, change the website it opens, and renew before it comes down.
            </p>
          </div>
          <div className="flex gap-8">
            <div>
              <p className="ks-mono text-[var(--ks-faint)] mb-1">Live now</p>
              <p className="text-2xl text-[var(--ks-champagne)]">{liveCount}</p>
            </div>
            <div>
              <p className="ks-mono text-[var(--ks-faint)] mb-1">Pixels</p>
              <p className="text-2xl text-[var(--ks-champagne)]">{pixels.length}</p>
            </div>
          </div>
        </div>

        {(pendingCount > 0 || expiringSoon) && (
          <div className="ks-plinth p-5 md:p-6">
            {pendingCount > 0 && (
              <p className="text-[15px] text-[var(--ks-champagne)]">
                {pendingCount === 1 ? 'One listing is unpaid.' : `${pendingCount} listings are unpaid.`}{' '}
                Finish payment to put it on the canvas, or release the pixels.
              </p>
            )}
            {expiringSoon && (
              <p className="text-[15px] text-[var(--ks-champagne)] mt-1">
                A listing ends {formatExpiry(expiringSoon.expiresAt)}. Renew to keep your logo up.
              </p>
            )}
          </div>
        )}

        <section>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl text-[var(--ks-champagne)]">Listings</h3>
              <p className="text-sm text-[var(--ks-muted)] mt-1">Live listings can be renewed. Unpaid holds can be paid or released.</p>
            </div>
          </div>

          {listings.length === 0 ? (
            <div className="ks-plinth p-8 md:p-12">
              <h4 className="text-xl text-[var(--ks-champagne)] mb-2">No listing yet</h4>
              <p className="text-[var(--ks-muted)] text-[15px] leading-[1.7] max-w-[46ch] mb-8">
                Pick open pixels, add your logo and website, then pay. The listing goes live on the public canvas after payment.
              </p>
              <ol className="grid sm:grid-cols-3 gap-6 mb-10 text-sm text-[var(--ks-muted)]">
                <li>
                  <p className="ks-mono text-[var(--ks-kinpaku)] mb-2">01</p>
                  Pick open pixels on the canvas
                </li>
                <li>
                  <p className="ks-mono text-[var(--ks-kinpaku)] mb-2">02</p>
                  Upload your logo and a website
                </li>
                <li>
                  <p className="ks-mono text-[var(--ks-kinpaku)] mb-2">03</p>
                  Pay — it goes live
                </li>
              </ol>
              <Link href="/canvas" className="btn-luxury">
                Place a listing
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((group, i) => {
                const status = statusCopy(group)
                const imageSrc = group.imageFileId ? `/api/images/${group.imageFileId}` : group.imageUrl
                return (
                  <article key={group.orderId || `${group.linkUrl}-${i}`} className="ks-plinth overflow-hidden">
                    <div className="grid md:grid-cols-[200px_minmax(0,1fr)]">
                      <div className="relative h-44 md:h-auto min-h-[160px] bg-[var(--ks-graphite)] flex items-center justify-center">
                        {imageSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageSrc} alt="Listing logo" className="max-h-36 max-w-[80%] object-contain" />
                        ) : (
                          <p className="ks-mono text-[var(--ks-faint)]">No logo</p>
                        )}
                      </div>
                      <div className="p-5 md:p-6 flex flex-col gap-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="ks-mono text-[var(--ks-patina-text)] mb-2">{status.label}</p>
                            <p className="text-[var(--ks-muted)] text-sm leading-[1.6] max-w-[50ch]">{status.hint}</p>
                          </div>
                          {group.linkUrl && group.status === 'completed' && (
                            <button
                              onClick={() => window.open(group.linkUrl, '_blank')}
                              className="ks-mono text-[var(--ks-kinpaku)] hover:text-[var(--ks-champagne)] inline-flex items-center gap-1.5"
                            >
                              {websiteLabel(group.linkUrl)}
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <dt className="ks-mono text-[var(--ks-faint)] mb-1">Pixels</dt>
                            <dd className="text-[var(--ks-champagne)]">{group.count}</dd>
                          </div>
                          <div>
                            <dt className="ks-mono text-[var(--ks-faint)] mb-1">Plan</dt>
                            <dd className="text-[var(--ks-champagne)]">
                              {group.packageLabel || '—'}
                            </dd>
                          </div>
                          <div>
                            <dt className="ks-mono text-[var(--ks-faint)] mb-1">{group.status === 'pending' ? 'Hold' : 'Ends'}</dt>
                            <dd className="text-[var(--ks-champagne)]">
                              {group.status === 'pending' ? 'Not live yet' : formatExpiry(group.expiresAt)}
                            </dd>
                          </div>
                          <div>
                            <dt className="ks-mono text-[var(--ks-faint)] mb-1">Website</dt>
                            <dd className="text-[var(--ks-champagne)] truncate">{websiteLabel(group.linkUrl)}</dd>
                          </div>
                        </dl>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {group.status === 'pending' && group.orderId && (
                            <>
                              <button
                                onClick={() => startResumePayment(group.orderId!)}
                                disabled={renewingOrderId === group.orderId}
                                className="btn-luxury !py-2 !px-4 text-sm"
                              >
                                {renewingOrderId === group.orderId ? 'Sending to checkout…' : 'Finish payment'}
                              </button>
                              <button
                                onClick={() => cancelPendingOrder(group.orderId!)}
                                disabled={cancellingOrderId === group.orderId}
                                className="glass-button !py-2 !px-4 text-sm"
                              >
                                {cancellingOrderId === group.orderId ? 'Releasing…' : 'Release pixels'}
                              </button>
                            </>
                          )}
                          {group.status === 'completed' && (
                            <button
                              onClick={() => {
                                setEditingLink({ pixels: group.pixels, currentLink: group.linkUrl || '' })
                                setNewLink(group.linkUrl || '')
                              }}
                              className="glass-button !py-2 !px-4 text-sm"
                            >
                              Change website
                            </button>
                          )}
                          {group.status === 'completed' && group.orderId && (
                            <button
                              onClick={() => startRenewal(group.orderId!, group.packageId)}
                              disabled={renewingOrderId === group.orderId}
                              className="glass-button !py-2 !px-4 text-sm"
                            >
                              {renewingOrderId === group.orderId ? 'Sending to checkout…' : 'Renew'}
                            </button>
                          )}
                          {group.status === 'completed' && (
                            <button
                              onClick={() => setReleasingGroup({ pixels: group.pixels, count: group.count })}
                              className="glass-button !py-2 !px-4 text-sm !text-red-400 hover:!text-red-300"
                            >
                              End listing
                            </button>
                          )}
                          {group.status === 'rejected' && !group.refundDetails && (
                            <button
                              onClick={() => setRefundingPurchase({ orderId: group.orderId!, pixels: group.pixels })}
                              className="glass-button !py-2 !px-4 text-sm"
                            >
                              Request refund
                            </button>
                          )}
                          {group.status === 'rejected' && group.refundDetails && (
                            <p className="ks-mono text-[var(--ks-patina-text)] py-2">Refund requested</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <h3 className="text-xl text-[var(--ks-champagne)] mb-2">Payments</h3>
          <p className="text-sm text-[var(--ks-muted)] mb-6">What you paid for listings on this account.</p>

          {orders.length === 0 ? (
            <p className="text-sm text-[var(--ks-muted)]">No payments yet.</p>
          ) : (
            <div className="border-t border-[var(--ks-rule)]">
              {orders.map((order) => (
                <div
                  key={order.orderId || order._id}
                  className="grid grid-cols-2 md:grid-cols-4 gap-2 py-4 border-b border-[var(--ks-rule)] text-sm"
                >
                  <div>
                    <p className="ks-mono text-[var(--ks-faint)] mb-1">Date</p>
                    <p>{new Date(order.purchasedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="ks-mono text-[var(--ks-faint)] mb-1">Plan</p>
                    <p>{order.packageLabel || `${order.pixelCount} pixels`}</p>
                  </div>
                  <div>
                    <p className="ks-mono text-[var(--ks-faint)] mb-1">Amount</p>
                    <p>{rupees(order.amount)}</p>
                  </div>
                  <div>
                    <p className="ks-mono text-[var(--ks-faint)] mb-1">Status</p>
                    <p>{orderStatusLabel(order.status)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {editingLink && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--ks-lacquer)]/80 p-4">
          <div className="ks-plinth w-full max-w-md p-6 md:p-8 bg-[var(--ks-raised)]">
            <h3 className="text-xl text-[var(--ks-champagne)] mb-2">Change website</h3>
            <p className="text-sm text-[var(--ks-muted)] mb-6">
              This is the page people open when they click your pixels. It updates on the canvas right away.
            </p>
            <label className="ks-label">Website</label>
            <input
              type="url"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="https://your-brand.com"
              className="ks-input mb-6"
            />
            <div className="flex flex-col gap-2">
              <button onClick={handleUpdateLink} disabled={isUpdating} className="btn-luxury disabled:opacity-50">
                {isUpdating ? 'Saving…' : 'Save link'}
              </button>
              <button onClick={() => setEditingLink(null)} className="glass-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {releasingGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--ks-lacquer)]/80 p-4">
          <div className="ks-plinth w-full max-w-md p-6 md:p-8 bg-[var(--ks-raised)]">
            <h3 className="text-xl text-[var(--ks-champagne)] mb-2">End this listing?</h3>
            <p className="text-sm text-[var(--ks-muted)] leading-[1.7] mb-8">
              Your logo comes off the canvas and these {releasingGroup.count} pixels become open again. This cannot be undone.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleRemovePixels(releasingGroup.pixels)}
                className="w-full py-3 bg-red-600 text-white rounded-[2px] text-sm"
              >
                End listing
              </button>
              <button onClick={() => setReleasingGroup(null)} className="glass-button">
                Keep listing
              </button>
            </div>
          </div>
        </div>
      )}

      {refundingPurchase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--ks-lacquer)]/80 p-4 overflow-y-auto">
          <div className="ks-plinth w-full max-w-md p-6 md:p-8 bg-[var(--ks-raised)] my-8">
            <h3 className="text-xl text-[var(--ks-champagne)] mb-2">Request a refund</h3>
            <p className="text-sm text-[var(--ks-muted)] mb-6">
              Add a bank account or UPI ID. We typically process this in 5–7 business days.
            </p>
            <div className="space-y-4">
              <div>
                <label className="ks-label">Bank account number</label>
                <input
                  type="text"
                  value={refundDetails.accountNumber}
                  onChange={(e) => setRefundDetails({ ...refundDetails, accountNumber: e.target.value })}
                  className="ks-input"
                  placeholder="Account number"
                />
              </div>
              <div>
                <label className="ks-label">IFSC</label>
                <input
                  type="text"
                  value={refundDetails.ifsc}
                  onChange={(e) => setRefundDetails({ ...refundDetails, ifsc: e.target.value })}
                  className="ks-input"
                  placeholder="IFSC"
                />
              </div>
              <p className="ks-mono text-[var(--ks-faint)] text-center">or</p>
              <div>
                <label className="ks-label">UPI ID</label>
                <input
                  type="text"
                  value={refundDetails.upi}
                  onChange={(e) => setRefundDetails({ ...refundDetails, upi: e.target.value })}
                  className="ks-input"
                  placeholder="name@upi"
                />
              </div>
              <div>
                <label className="ks-label">Payment screenshot (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setRefundDetails({ ...refundDetails, screenshot: file })
                  }}
                  className="ks-input"
                />
              </div>
              <div>
                <label className="ks-label">Notes (optional)</label>
                <textarea
                  value={refundDetails.notes}
                  onChange={(e) => setRefundDetails({ ...refundDetails, notes: e.target.value })}
                  rows={3}
                  className="ks-input resize-none"
                />
              </div>
              <button onClick={handleRefundRequest} className="btn-luxury w-full">
                Submit refund request
              </button>
              <button
                onClick={() => {
                  setRefundingPurchase(null)
                  setRefundDetails({ accountNumber: '', ifsc: '', upi: '', notes: '', screenshot: null })
                }}
                className="glass-button w-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {renewingOrderId && (
        <CheckoutOverlay
          title="Sending you to checkout"
          detail="Keep this tab open. You will be taken to Dodo Payments in a moment."
        />
      )}
    </DashboardShell>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--ks-lacquer)] flex items-center justify-center">
          <p className="ks-mono text-[var(--ks-kinpaku)]">Loading your listings</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
