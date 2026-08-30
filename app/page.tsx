'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/home/Navbar'
import HeroSection from '@/components/home/HeroSection'
import CanvasPreview from '@/components/home/CanvasPreview'
import HowItWorks from '@/components/home/HowItWorks'
import Features from '@/components/home/Features'
import StatsMarquee from '@/components/home/StatsMarquee'
import Newsletter from '@/components/home/Newsletter'

export default function Home() {
  const [ownedPixels, setOwnedPixels] = useState<any[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.ok) setIsLoggedIn(true)
        } catch (err) {
          console.error('Auth check failed:', err)
        }
      }
    }
    checkAuth()

    fetch('/api/pixels')
      .then(res => res.json())
      .then(data => {
        if (data.pixels) setOwnedPixels(data.pixels)
      })
      .catch(err => console.error('Failed to load pixels:', err))
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar isLoggedIn={isLoggedIn} />

      <section className="relative pt-28 pb-16 md:pt-32 md:pb-20">
        <div className="ks-section">
          <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-10 lg:gap-16 items-end">
            <HeroSection />
            <CanvasPreview ownedPixels={ownedPixels} />
          </div>
        </div>
      </section>

      <StatsMarquee />

      <main className="ks-section py-20 md:py-28">
        <HowItWorks />
        <Features />
        <Newsletter />
      </main>

      <footer className="border-t border-[var(--ks-rule)] py-14 bg-[var(--ks-lacquer-deep)]">
        <div className="ks-section">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <p className="ks-wordmark mb-4">PixelPlace</p>
              <p className="text-[var(--ks-muted)] text-sm leading-[1.7] max-w-md">
                A public pixel canvas for brand display. Rent space, add your logo and link, and the listing goes live after payment — from 1 hour to 1 year.
              </p>
            </div>
            <div>
              <p className="ks-mono text-[var(--ks-faint)] mb-4">Product</p>
              <ul className="space-y-2 text-sm text-[var(--ks-muted)]">
                <li><a href="/canvas" className="hover:text-[var(--ks-kinpaku)] transition-colors">Live canvas</a></li>
                <li><a href="/dashboard" className="hover:text-[var(--ks-kinpaku)] transition-colors">Dashboard</a></li>
                <li><a href="/login" className="hover:text-[var(--ks-kinpaku)] transition-colors">Login</a></li>
                <li><a href="/signup" className="hover:text-[var(--ks-kinpaku)] transition-colors">Sign up</a></li>
              </ul>
            </div>
            <div>
              <p className="ks-mono text-[var(--ks-faint)] mb-4">Contact</p>
              <a href="mailto:arshtandon121@gmail.com" className="text-sm text-[var(--ks-champagne)] hover:text-[var(--ks-kinpaku)]">
                arshtandon121@gmail.com
              </a>
              <p className="mt-6">
                <a
                  href="https://www.linkedin.com/company/pixelplace-in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ks-mono text-[var(--ks-muted)] hover:text-[var(--ks-kinpaku)]"
                >
                  LinkedIn
                </a>
              </p>
            </div>
          </div>
          <div className="pt-6 border-t border-[var(--ks-rule)] flex flex-col md:flex-row justify-between gap-3">
            <p className="ks-mono text-[var(--ks-faint)]">© {new Date().getFullYear()} PixelPlace</p>
            <p className="ks-mono text-[var(--ks-faint)]">Brand display on a public canvas</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
