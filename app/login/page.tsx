'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
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
    <div className="min-h-screen pixel-bg flex items-center justify-center p-4">
      <div className="pixel-card rounded-2xl shadow-2xl p-8 w-full max-w-md pixel-glow">
        <div className="flex justify-center mb-6">
          <PixelLogo size="md" />
        </div>
        <h1 className="text-3xl font-bold pixel-text text-center mb-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">Welcome Back</h1>
        <p className="text-center text-cyan-300 mb-8 font-medium">Login to your account</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold pixel-text text-cyan-400 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 pixel-card border border-cyan-500/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-cyan-100 bg-transparent placeholder:text-cyan-500/50"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold pixel-text text-cyan-400 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 pixel-card border border-cyan-500/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-cyan-100 bg-transparent placeholder:text-cyan-500/50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full pixel-button text-white py-3 rounded-xl font-bold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-cyan-300 font-medium">
          Don't have an account?{' '}
          <Link href="/signup" className="text-cyan-400 hover:text-cyan-200 font-bold pixel-text underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}

