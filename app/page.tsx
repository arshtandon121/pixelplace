'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, DollarSign, Users, Layers, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import PixelGrid from '@/components/PixelGrid'
import PixelLogo from '@/components/PixelLogo'

export default function Home() {
  const [ownedPixels, setOwnedPixels] = useState<any[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check auth status
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) setIsLoggedIn(true)
          else localStorage.removeItem('token')
        })
        .catch(() => localStorage.removeItem('token'))
    }

    // Load pixels to show logos on home page
    const startTime = Date.now()
    fetch('/api/pixels')
      .then(res => res.json())
      .then(data => {
        const loadTime = Date.now() - startTime
        const pixels = data.pixels || []
        console.log(`✅ Loaded ${pixels.length} pixels in ${loadTime}ms`)
        if (pixels.length > 0) {
          setOwnedPixels(pixels)
        }
      })
      .catch(err => console.error('Failed to load pixels:', err))
  }, [])

  return (
    <div className="min-h-screen pb-20">
      {/* Navbar */}
      <nav className="container mx-auto px-4 py-8 flex justify-between items-center z-50 relative animate-fade-in">
        <div className="flex items-center gap-2">
          <PixelLogo size="sm" />
        </div>

        <div className="flex gap-4 items-center">
          {isLoggedIn ? (
            <Link href="/dashboard" className="glass-button bg-primary-600/20 text-white font-bold hover:bg-primary-500/30 border-primary-500/30">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-5 py-2 text-slate-300 hover:text-white font-medium transition-colors">
                Login
              </Link>
              <Link href="/signup" className="glass-button bg-primary-600/20 text-white font-bold hover:bg-primary-500/30 border-primary-500/30">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="container mx-auto px-4 mt-8 md:mt-16">
        {/* Luxury Hero Section */}
        <div className="text-center mb-24 relative animate-slide-up">
          {/* Golden Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#BF953F]/10 rounded-full blur-[120px] -z-10 opacity-60" />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8 inline-block relative group"
          >
            {/* <PixelLogo size="lg" showText={false} /> */}
            <div className="absolute inset-0 bg-[#BF953F] blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
          </motion.div>

          <h1 className="text-5xl md:text-8xl font-bold mb-8 tracking-tight font-serif">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">The Most</span> <br />
            <span className="text-gold-gradient drop-shadow-2xl">Exclusive Digital Estate</span>
          </h1>

          <p className="text-xl text-[#E5E5E5] mb-12 max-w-3xl mx-auto leading-relaxed font-light tracking-wide">
            Secure your legacy on the internet's most prestigious canvas. <br className="hidden md:block" />
            Adding your logo here isn't just marketing—<span className="text-[#FCF6BA] font-normal">it's a statement of luxury.</span>
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link
              href="/canvas"
              className="btn-luxury text-lg inline-flex items-center justify-center gap-2 group"
            >
              Claim Your Space
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-[#FCF6BA]" />
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 text-lg glass-button text-slate-300 hover:text-[#FCF6BA] border-white/5 hover:border-[#BF953F]/30 inline-flex items-center justify-center transition-all duration-300"
            >
              Discover The Value
            </Link>
          </div>
        </div>

        {/* Canvas Preview - Gold Frame */}
        <div className="mb-32 flex justify-center perspective-1000 overflow-x-auto p-4">
          <div className="glass-panel p-1 relative group shadow-2xl min-w-[650px] border border-[#BF953F]/30">
            {/* Gold Border Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#BF953F] rounded-2xl opacity-30 blur-md group-hover:opacity-60 transition-opacity duration-700" />

            <div className="bg-slate-950/90 rounded-xl p-8 relative z-10">
              <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                  <h2 className="text-2xl font-bold text-[#FCF6BA]">Live Estate Preview</h2>
                  <p className="text-[#BF953F] text-sm tracking-widest uppercase">Limited Availability: {50 * 50 - ownedPixels.length} Blocks Remaining</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#FCF6BA] bg-[#BF953F]/10 px-3 py-1.5 rounded border border-[#BF953F]/30">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#BF953F] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FCF6BA]"></span>
                  </span>
                  LIVE STATUS
                </div>
              </div>

              <div className="flex justify-center relative z-10">
                <PixelGrid
                  ownedPixels={ownedPixels}
                  selectedPixels={[]}
                  onPixelClick={() => { }}
                  onPixelHover={() => { }}
                  previewImage={null}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Features - Luxury Cards */}
        <div id="features" className="grid md:grid-cols-3 gap-8 mb-24 cursor-default">
          {[
            {
              icon: <Zap className="w-6 h-6 text-[#FCF6BA]" />,
              title: "Prestigious Visibility",
              desc: "Your brand, immortalized on a curated digital monument. Stand out amongst the elite."
            },
            {
              icon: <DollarSign className="w-6 h-6 text-[#FCF6BA]" />,
              title: "Premium Investment",
              desc: `Secure prime digital real estate starting at ${process.env.NEXT_PUBLIC_PIXEL_PRICE_PER_MONTH}/month. A small price for permanent legacy.`
            },
            {
              icon: <Users className="w-6 h-6 text-[#FCF6BA]" />,
              title: "Exclusive Ownership",
              desc: "Total control over your designated space. Update your creative, link to your empire."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-gold-glass p-8 rounded-xl group hover:bg-[#BF953F]/20 transition-all duration-500"
            >
              <div className={`w-14 h-14 bg-gradient-to-br from-[#BF953F] to-[#8C6D31] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#BF953F]/20 group-hover:scale-110 transition-transform duration-500`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-white font-serif">{feature.title}</h3>
              <p className="text-[#E5E5E5] font-light leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#BF953F]/20 py-12 mt-20 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-[#BF953F]/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <p className="text-slate-500 mb-4 font-light">
            &copy; {new Date().getFullYear()} PixelPlace. <span className="text-[#BF953F]">Designed for the Extraordinary.</span>
          </p>
        </div>
      </footer>
    </div >
  )
}
