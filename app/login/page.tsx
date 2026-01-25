'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import PixelLogo from '@/components/PixelLogo'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email
    if (!validateEmail(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('token', data.token)
        toast.success('Logged in successfully!')
        router.push('/canvas')
      } else {
        toast.error(data.error || 'Invalid credentials')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      >
        <source src="/login_video.mp4" type="video/mp4" />
      </video>

      {/* Vintage Vignette Effect */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.8) 100%),
            linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.6) 100%),
            linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.6) 100%)
          `
        }}
      />

      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#BF953F]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#BF953F]/10 rounded-full blur-[120px]" />

        {/* Floating 3D Cubes */}
        <motion.div
          className="absolute top-20 left-10 w-12 h-12 border-2 border-[#BF953F]/20 rounded-lg"
          animate={{
            rotateX: [0, 360],
            rotateY: [0, 360],
            y: [0, -20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ transformStyle: "preserve-3d" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-16 h-16 border-2 border-[#FCF6BA]/20 rounded-lg"
          animate={{
            rotateX: [360, 0],
            rotateZ: [0, 360],
            y: [0, 20, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{ transformStyle: "preserve-3d" }}
        />

        {/* Floating Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#BF953F] rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-slate-900/30 backdrop-blur-2xl border border-[#BF953F]/30 rounded-2xl shadow-[0_0_50px_-10px_rgba(191,149,63,0.15)] p-8 w-full max-w-md relative z-10"
      >
        <div className="flex justify-center mb-8">
          <PixelLogo size="lg" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-[#FCF6BA] mb-2">Welcome Back</h1>
          <p className="text-[#BF953F]/80 text-sm">Access your digital estate portfolio</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-[#BF953F] uppercase tracking-widest mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-black/40 border border-[#BF953F]/30 rounded-lg focus:ring-1 focus:ring-[#BF953F] focus:border-[#BF953F] text-white placeholder-slate-600 outline-none transition-all"
              placeholder="investor@pixelplace.in"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#BF953F] uppercase tracking-widest mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-black/40 border border-[#BF953F]/30 rounded-lg focus:ring-1 focus:ring-[#BF953F] focus:border-[#BF953F] text-white placeholder-slate-600 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-luxury flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : 'Access Dashboard'}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-500 text-sm">
          New to PixelPlace?{' '}
          <Link href="/signup" className="text-[#FCF6BA] hover:text-[#BF953F] font-bold transition-colors">
            Begin Your Legacy
          </Link>
        </p>
      </motion.div>
    </div >
  )
}
