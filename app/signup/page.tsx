'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AuthShell from '@/components/auth/AuthShell'

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

    if (!validateEmail(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

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
        toast.success('Account created')
        router.push('/dashboard')
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
    <AuthShell title="Create an account" subtitle="Then pick pixels and put your logo on the public canvas.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="ks-label">Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="ks-input"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="ks-label">Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="ks-input"
            placeholder="you@email.com"
          />
        </div>
        <div>
          <label className="ks-label">Password</label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="ks-input"
            placeholder="••••••••"
          />
          <ul className="mt-2 flex flex-wrap gap-3 text-[11px] text-[var(--ks-faint)]">
            <li className={formData.password.length >= 8 ? 'text-[var(--ks-patina-text)]' : ''}>8+ characters</li>
            <li className={/[a-zA-Z]/.test(formData.password) ? 'text-[var(--ks-patina-text)]' : ''}>1 letter</li>
            <li className={/[0-9]/.test(formData.password) ? 'text-[var(--ks-patina-text)]' : ''}>1 number</li>
          </ul>
        </div>
        <div>
          <label className="ks-label">Confirm password</label>
          <input
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="ks-input"
            placeholder="••••••••"
          />
        </div>
        <button type="submit" disabled={loading} className="w-full btn-luxury disabled:opacity-50 mt-2">
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-xs text-[var(--ks-muted)] leading-[1.6]">
        By creating an account you agree to the{' '}
        <Link href="/terms" className="text-[var(--ks-kinpaku)] hover:text-[var(--ks-champagne)]">
          listing rules
        </Link>
        .
      </p>
      <p className="mt-8 text-sm text-[var(--ks-muted)]">
        Already have an account?{' '}
        <Link href="/login" className="text-[var(--ks-kinpaku)] hover:text-[var(--ks-champagne)]">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
