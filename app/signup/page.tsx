'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
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
        toast.success('Account created successfully!')
        router.push('/login')
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
    <div className="min-h-screen pixel-bg flex items-center justify-center p-4">
      <div className="pixel-card rounded-2xl shadow-2xl p-8 w-full max-w-md pixel-glow">
        <div className="flex justify-center mb-6">
          <PixelLogo size="md" />
        </div>
        <h1 className="text-3xl font-bold pixel-text text-center mb-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">Create Account</h1>
        <p className="text-center text-cyan-300 mb-8 font-medium">Join PixelPlace.in today</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold pixel-text text-cyan-400 mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 pixel-card border border-cyan-500/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-cyan-100 bg-transparent placeholder:text-cyan-500/50"
              placeholder="John Doe"
            />
          </div>

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
            <div className="mt-2 text-xs text-cyan-400/70">
              <p>Password must contain:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li className={formData.password.length >= 8 ? 'text-green-400' : ''}>
                  At least 8 characters
                </li>
                <li className={/[a-zA-Z]/.test(formData.password) ? 'text-green-400' : ''}>
                  At least one letter
                </li>
                <li className={/[0-9]/.test(formData.password) ? 'text-green-400' : ''}>
                  At least one number
                </li>
              </ul>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold pixel-text text-cyan-400 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 pixel-card border border-cyan-500/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-cyan-100 bg-transparent placeholder:text-cyan-500/50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full pixel-button text-white py-3 rounded-xl font-bold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-cyan-300 font-medium">
          Already have an account?{' '}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-200 font-bold pixel-text underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

