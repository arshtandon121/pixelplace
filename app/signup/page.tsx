'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import PixelLogo from '@/components/PixelLogo'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string): { valid: boolean; error?: string } => {
    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long' }
    }
    if (!/[a-zA-Z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one letter' }
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one number' }
    }
    return { valid: true }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email
    if (!validateEmail(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.error || 'Invalid password')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('token', data.token)
        toast.success('Account created successfully!')
        router.push('/canvas')
      } else {
        toast.error(data.error || 'Failed to create account')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#BF953F]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#BF953F]/10 rounded-full blur-[120px]" />

        {/* Floating 3D Cubes */}
        <motion.div
          className="absolute top-32 right-16 w-14 h-14 border-2 border-[#BF953F]/20 rounded-lg"
          animate={{
            rotateX: [0, 360],
            rotateZ: [0, 360],
            y: [0, -25, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          style={{ transformStyle: "preserve-3d" }}
        />
        <motion.div
          className="absolute bottom-32 left-16 w-10 h-10 border-2 border-[#FCF6BA]/20 rounded-lg"
          animate={{
            rotateY: [360, 0],
            rotateZ: [0, 360],
            y: [0, 15, 0],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
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
        className="bg-slate-900/50 backdrop-blur-xl border border-[#BF953F]/30 rounded-2xl shadow-[0_0_50px_-10px_rgba(191,149,63,0.15)] p-8 w-full max-w-md relative z-10"
      >
        <div className="flex justify-center mb-8">
          <PixelLogo size="lg" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-[#FCF6BA] mb-2">Join the Elite</h1>
          <p className="text-[#BF953F]/80 text-sm">Create your digital estate account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#BF953F] uppercase tracking-widest mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-black/40 border border-[#BF953F]/30 rounded-lg focus:ring-1 focus:ring-[#BF953F] focus:border-[#BF953F] text-white placeholder-slate-600 outline-none transition-all"
              placeholder="Alexander The Great"
            />
          </div>

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
            <div className="mt-2 text-[10px] text-slate-500">
              <ul className="flex flex-wrap gap-2">
                <li className={formData.password.length >= 8 ? 'text-emerald-400' : ''}>
                  • 8+ chars
                </li>
                <li className={/[a-zA-Z]/.test(formData.password) ? 'text-emerald-400' : ''}>
                  • 1 letter
                </li>
                <li className={/[0-9]/.test(formData.password) ? 'text-emerald-400' : ''}>
                  • 1 number
                </li>
              </ul>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#BF953F] uppercase tracking-widest mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 bg-black/40 border border-[#BF953F]/30 rounded-lg focus:ring-1 focus:ring-[#BF953F] focus:border-[#BF953F] text-white placeholder-slate-600 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-luxury flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-500 text-sm">
          Already a member?{' '}
          <Link href="/login" className="text-[#FCF6BA] hover:text-[#BF953F] font-bold transition-colors">
            Access Portal
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

