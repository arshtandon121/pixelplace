'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/home/Navbar'
import VideoHero from '@/components/home/VideoHero'
import HeroSection from '@/components/home/HeroSection'
import CanvasPreview from '@/components/home/CanvasPreview'
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
        console.log('🏠 Home page: Received pixel data:', data)
        console.log('🏠 Pixel count:', data.pixels?.length || 0)
        if (data.pixels && data.pixels.length > 0) {
          console.log('🏠 First pixel:', data.pixels[0])
        }
        if (data.pixels) {
          setOwnedPixels(data.pixels)
        }
      })
      .catch(err => console.error('Failed to load pixels:', err))
  }, [])

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      <Navbar isLoggedIn={isLoggedIn} />

      <VideoHero />

      {/* Content Overlay */}
      <div className="relative" style={{ marginTop: '-100vh' }}>
        <div className="h-screen" /> {/* Spacer for first screen */}

        <main className="container mx-auto px-4 py-8 md:py-16 relative">
          <HeroSection />

          {/* Reveal Gap - Transparent */}
          <div className="h-[10vh] w-full pointer-events-none" />

          {/* Canvas Preview with Stats */}
          <div className="relative mb-20 md:mb-32">
            <StatsMarquee />

            {/* Background Video */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover -z-10"
            >
              <source src="/pixelplacevideo.mp4" type="video/mp4" />
            </video>

            {/* Darker overlay for better content visibility */}
            <div className="absolute inset-0 bg-black/60 -z-10" />

            {/* Vintage Vignette Effect */}
            <div
              className="absolute inset-0 -z-10"
              style={{
                background: `
                  radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.8) 100%),
                  linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.6) 100%),
                  linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.6) 100%)
                `
              }}
            />

            {/* Canvas Preview */}
            <div className="relative z-10">
              <CanvasPreview ownedPixels={ownedPixels} />
            </div>
          </div>

          {/* Features - No Video Background */}
          <Features />

          <Newsletter />
        </main>
      </div>

      {/* Footer - Enhanced Professional Footer */}
      <footer className="relative border-t border-[#BF953F]/20 py-12 mt-20 bg-black">
        <div className="absolute inset-0 bg-gradient-to-t from-[#BF953F]/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <h3 className="text-[#FCF6BA] font-serif font-bold text-xl mb-4">PixelPlace</h3>
              <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                The world's most exclusive digital real estate platform. Own a piece of internet history on our premium pixel canvas.
              </p>
              <div className="flex gap-4">
                <a
                  href="https://www.linkedin.com/company/pixelplace-in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-[#BF953F]/10 border border-[#BF953F]/30 flex items-center justify-center hover:bg-[#BF953F]/20 transition-all group"
                >
                  <svg className="w-5 h-5 text-[#FCF6BA] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-[#BF953F] font-bold text-sm uppercase tracking-widest mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="/canvas" className="text-slate-400 hover:text-[#FCF6BA] text-sm transition-colors">Canvas</a></li>
                <li><a href="/dashboard" className="text-slate-400 hover:text-[#FCF6BA] text-sm transition-colors">Dashboard</a></li>
                <li><a href="/login" className="text-slate-400 hover:text-[#FCF6BA] text-sm transition-colors">Login</a></li>
                <li><a href="/signup" className="text-slate-400 hover:text-[#FCF6BA] text-sm transition-colors">Sign Up</a></li>
              </ul>
            </div>

            {/* Legal & Trust */}
            <div>
              <h4 className="text-[#BF953F] font-bold text-sm uppercase tracking-widest mb-4">Trust & Legal</h4>
              <ul className="space-y-2">
                <li className="text-slate-400 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Secure Payments
                </li>
                <li className="text-slate-400 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified Platform
                </li>
                <li className="text-slate-400 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  24/7 Support
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-[#BF953F]/10">
                <p className="text-xs text-slate-500 mb-1">Need Help?</p>
                <a
                  href="mailto:arshtandon121@gmail.com"
                  className="text-sm text-[#FCF6BA] hover:text-[#BF953F] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  arshtandon121@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-[#BF953F]/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-500 text-sm font-light">
                &copy; {new Date().getFullYear()} PixelPlace. <span className="text-[#BF953F]">Designed for the Extraordinary.</span>
              </p>
              <div className="flex gap-6 text-xs text-slate-500">
                <a href="#" className="hover:text-[#FCF6BA] transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-[#FCF6BA] transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-[#FCF6BA] transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
