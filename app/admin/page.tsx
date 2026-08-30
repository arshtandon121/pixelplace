'use client'

import { useState, useEffect } from 'react'
import { Check, X, Eye, Loader2, ArrowLeft, Users, TrendingUp, DollarSign, Activity, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [password, setPassword] = useState('')
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [viewImage, setViewImage] = useState<string | null>(null)
    const [rejectOrderId, setRejectOrderId] = useState<string | null>(null)
    const [rejectionReason, setRejectionReason] = useState('')
    const [analytics, setAnalytics] = useState<any>(null)
    const [showAnalytics, setShowAnalytics] = useState(true)

    useEffect(() => {
        // Check if we have a saved password session
        const saved = sessionStorage.getItem('admin_pass')
        if (saved) {
            setPassword(saved)
            setIsAuthenticated(true)
            fetchOrders(saved)
            fetchAnalytics(saved)
        } else {
            setLoading(false)
        }
    }, [])

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if (password) {
            setIsAuthenticated(true)
            sessionStorage.setItem('admin_pass', password)
            fetchOrders(password)
            fetchAnalytics(password)
        }
    }

    const fetchOrders = async (pwd: string) => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/orders', {
                headers: { 'admin-password': pwd }
            })
            const data = await res.json()
            if (res.ok) {
                setOrders(data.orders || [])
            } else {
                toast.error(data.error || 'Unauthorized')
                setIsAuthenticated(false)
            }
        } catch (error) {
            console.error('Fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchAnalytics = async (pwd: string) => {
        try {
            const res = await fetch('/api/admin/analytics', {
                headers: { 'admin-password': pwd }
            })
            const data = await res.json()
            if (res.ok) {
                setAnalytics(data.analytics)
            }
        } catch (error) {
            console.error('Analytics fetch error:', error)
        }
    }

    const updateStatus = async (orderId: string, status?: 'completed' | 'rejected', reason?: string, refundStatus?: string) => {
        try {
            const body: any = { orderId }
            if (status) body.status = status
            if (reason) body.rejectionReason = reason
            if (refundStatus) body.refundStatus = refundStatus

            const res = await fetch('/api/admin/orders', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'admin-password': password
                },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                toast.success('Updated successfully')
                setRejectOrderId(null)
                setRejectionReason('')
                fetchOrders(password) // Refresh
            } else {
                toast.error('Failed to update status')
            }
        } catch (error) {
            toast.error('Error updating order')
        }
    }

    const handleRejectClick = (orderId: string) => {
        setRejectOrderId(orderId)
    }

    const confirmReject = () => {
        if (!rejectOrderId) return
        if (!rejectionReason.trim()) {
            toast.error('Please enter a reason')
            return
        }
        updateStatus(rejectOrderId, 'rejected', rejectionReason)
    }

    const getImageUrl = (fileId: string | null, url: string | null) => {
        if (fileId) return `/api/images/${fileId}`
        if (url) return url
        return null
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="pixel-card p-8 rounded-2xl w-full max-w-md bg-slate-900 border border-cyan-500/30">
                    <h1 className="text-2xl font-bold text-white mb-6 text-center">Admin Access</h1>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter Admin Password"
                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white mb-4 focus:ring-2 focus:ring-cyan-500 outline-none"
                        autoFocus
                    />
                    <button type="submit" className="w-full pixel-button py-3 font-bold text-white rounded-lg">
                        Login
                    </button>
                </form>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <header className="flex justify-between items-center mb-8 container mx-auto">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-slate-800 rounded-full transition">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-2xl font-bold">PixelPlace Admin</h1>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        className="px-4 py-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition border border-cyan-500/30 text-sm font-medium"
                    >
                        {showAnalytics ? 'Hide' : 'Show'} Analytics
                    </button>
                    <button
                        onClick={() => {
                            fetchOrders(password)
                            fetchAnalytics(password)
                        }}
                        className="px-4 py-2 hover:bg-slate-800 rounded-lg transition text-sm font-medium"
                    >
                        Refresh
                    </button>
                </div>
            </header>

            <main className="container mx-auto space-y-8">
                {/* Analytics Dashboard */}
                {showAnalytics && analytics && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-cyan-400" />
                            Analytics Dashboard
                        </h2>

                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Total Signups */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-cyan-500/30 transition">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                                        <Users className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <span className="text-xs text-slate-500 font-medium">Total</span>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">{analytics.signups.total}</div>
                                <div className="text-sm text-slate-400">Total Signups</div>
                                <div className="text-xs text-emerald-400 mt-2">+{analytics.signups.recent} last 30 days</div>
                            </div>

                            {/* Total Revenue */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-emerald-500/30 transition">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                        <DollarSign className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <span className="text-xs text-slate-500 font-medium">Revenue</span>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">₹{analytics.payments.totalRevenue.toFixed(2)}</div>
                                <div className="text-sm text-slate-400">Total Revenue</div>
                                <div className="text-xs text-slate-500 mt-2">{analytics.payments.totalTransactions} transactions</div>
                            </div>

                            {/* Active Users */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-purple-500/30 transition">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                        <Activity className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <span className="text-xs text-slate-500 font-medium">Active</span>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">{analytics.users.activeUsers}</div>
                                <div className="text-sm text-slate-400">Active Users</div>
                                <div className="text-xs text-slate-500 mt-2">{analytics.users.totalPixelsSold} pixels sold</div>
                            </div>

                            {/* Avg Order Value */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-yellow-500/30 transition">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-yellow-400" />
                                    </div>
                                    <span className="text-xs text-slate-500 font-medium">Average</span>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">₹{analytics.payments.avgOrderValue.toFixed(2)}</div>
                                <div className="text-sm text-slate-400">Avg Order Value</div>
                            </div>
                        </div>

                        {/* Payment Breakdown & Top Users */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Payment Status Breakdown */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                                    Payment Status Breakdown
                                </h3>
                                <div className="space-y-3">
                                    {analytics.payments.breakdown.map((item: any) => (
                                        <div key={item._id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase
                                                    ${item._id === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        item._id === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                                            'bg-yellow-500/20 text-yellow-400'}`}>
                                                    {item._id || 'pending'}
                                                </span>
                                                <span className="text-sm text-slate-400">{item.count} orders</span>
                                            </div>
                                            <span className="text-sm font-bold text-white">₹{item.revenue.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top Users */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-cyan-400" />
                                    Top Users by Spending
                                </h3>
                                <div className="space-y-2">
                                    {analytics.users.topUsers.slice(0, 5).map((user: any, idx: number) => (
                                        <div key={user._id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 font-bold text-sm">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">{user.userDetails?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-slate-500">{user.totalPixels} pixels • {user.totalPurchases} orders</div>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-emerald-400">₹{user.totalSpent.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent Signups */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-cyan-400" />
                                Recent Signups
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {analytics.signups.recentUsers.map((user: any) => (
                                    <div key={user._id} className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition">
                                        <div className="font-bold text-white text-sm mb-1">{user.name}</div>
                                        <div className="text-xs text-slate-400 mb-2">{user.email}</div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Orders Section */}
                <div>
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-cyan-400" />
                        Order Management
                    </h2>
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                        </div>
                    ) : (
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-800 border-b border-slate-700 text-slate-400 text-sm">
                                            <th className="p-4">Date</th>
                                            <th className="p-4">User</th>
                                            <th className="p-4">Details</th>
                                            <th className="p-4">Payment</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {orders.map((order) => (
                                            <tr key={order._id} className="hover:bg-slate-800/50 transition">
                                                <td className="p-4 text-sm text-slate-300">
                                                    {new Date(order.purchasedAt || order.createdAt).toLocaleDateString()}
                                                    <div className="text-xs text-slate-500">
                                                        {new Date(order.purchasedAt || order.createdAt).toLocaleTimeString()}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm">
                                                    {order.userDetails ? (
                                                        <div>
                                                            <div className="font-bold text-white">{order.userDetails.name}</div>
                                                            <div className="text-slate-400 text-xs">{order.userDetails.email}</div>
                                                            <div className="text-cyan-500/50 text-[10px] mt-1 font-mono">{order.userId.substring(0, 8)}...</div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-cyan-400 font-mono text-xs">{order.userId.substring(0, 8)}...</div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm">{order.pixelCount} Pixels</div>
                                                    <div className="text-xs text-slate-500">{order.packageLabel || order.tenure || 'Membership'}</div>
                                                    <div className="text-xs font-bold text-emerald-400">₹{order.amount}</div>
                                                </td>
                                                <td className="p-4">
                                                    {order.provider === 'polar' ? (
                                                        <div className="text-xs text-slate-300">
                                                            <div className="font-bold text-cyan-400">Polar</div>
                                                            <div className="text-slate-500 font-mono break-all">{order.polarOrderId || order.polarCheckoutId || order.orderId}</div>
                                                        </div>
                                                    ) : order.screenshotFileId ? (
                                                        <button
                                                            onClick={() => setViewImage(`/api/images/${order.screenshotFileId}`)}
                                                            className="flex items-center gap-1 text-xs text-cyan-400 border border-cyan-500/30 px-2 py-1 rounded hover:bg-cyan-900/20"
                                                        >
                                                            <Eye className="w-3 h-3" /> View Proof
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-slate-500">No Proof</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase
                                                    ${order.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                                            order.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                                                'bg-yellow-500/20 text-yellow-400'}`}>
                                                        {order.status || 'manual'}
                                                    </span>
                                                    {order.status === 'rejected' && order.rejectionReason && (
                                                        <div className="text-xs text-red-400 mt-1 max-w-[150px] truncate" title={order.rejectionReason}>
                                                            {order.rejectionReason}
                                                        </div>
                                                    )}

                                                    {/* Refund Status */}
                                                    {order.refundStatus === 'requested' && (
                                                        <div className="mt-2 text-xs bg-yellow-500/10 p-2 rounded border border-yellow-500/30">
                                                            <div className="font-bold text-yellow-400 mb-1">Refund Requested</div>
                                                            <div className="text-slate-300 break-all mb-2">{order.refundDetails}</div>
                                                            <button
                                                                onClick={() => updateStatus(order.orderId, undefined, undefined, 'processed')}
                                                                className="w-full py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/30 font-bold transition"
                                                            >
                                                                Mark Processed
                                                            </button>
                                                        </div>
                                                    )}
                                                    {order.refundStatus === 'processed' && (
                                                        <div className="mt-2 text-xs bg-emerald-500/10 p-2 rounded border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1">
                                                            <Check className="w-3 h-3" /> Refund Processed
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {order.provider === 'polar' ? (
                                                        <span className="text-xs text-emerald-400/80">Auto on payment</span>
                                                    ) : order.status === 'pending' ? (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => updateStatus(order.orderId, 'completed')}
                                                                className="p-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded border border-emerald-500/30"
                                                                title="Approve"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectClick(order.orderId)}
                                                                className="p-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded border border-red-500/30"
                                                                title="Reject"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : null}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Image Modal */}
            {viewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setViewImage(null)}>
                    <img src={viewImage} className="max-w-full max-h-[90vh] object-contain rounded-lg" />
                    <button className="absolute top-4 right-4 text-white p-2">
                        <X className="w-8 h-8" />
                    </button>
                </div>
            )}

            {/* Rejection Modal */}
            {rejectOrderId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Reject Order</h3>
                        <p className="text-sm text-slate-400 mb-4">Please provide a reason for rejecting this order:</p>

                        <textarea
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm mb-4 focus:ring-2 focus:ring-red-500 outline-none"
                            rows={3}
                            placeholder="e.g. Invalid payment proof, Incorrect amount..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setRejectOrderId(null)
                                    setRejectionReason('')
                                }}
                                className="px-4 py-2 text-slate-400 hover:text-white font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmReject}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition"
                            >
                                Reject Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
