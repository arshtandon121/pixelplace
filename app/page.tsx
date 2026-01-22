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
        {/* Hero Section */}
        <div className="text-center mb-20 relative animate-slide-up">
          {/* Decorative Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/20 rounded-full blur-[100px] -z-10 opacity-50" />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8 inline-block"
          >
            {/* <PixelLogo size="lg" showText={false} /> */}
          </motion.div>

          {/* Floating 3D Elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
            <motion.div
              animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 left-[10%] w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-sm border border-white/10 rounded-xl"
            />
            <motion.div
              animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-40 right-[15%] w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/10 rounded-xl"
            />
            <motion.div
              animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-20 left-[20%] w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-white/10 rounded-xl"
            />
          </div>

          <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-slate-400">Own Your</span> <br />
            <span className="heading-gradient">Digital Space</span>
          </h1>

          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Claims your spot on the eternal canvas. Promote your brand, immortalize your art,
            or just become part of internet history.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/canvas"
              className="btn-primary px-8 py-4 text-lg inline-flex items-center justify-center gap-2 group"
            >
              View Canvas
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 text-lg glass-button text-slate-300 hover:text-white inline-flex items-center justify-center"
            >
              How it works
            </Link>
          </div>
        </div>

        {/* Canvas Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-32 flex justify-center perspective-1000"
        >
          <motion.div
            whileHover={{ rotateX: 5, rotateY: 5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="glass-panel p-8 relative group shadow-2xl transform-style-3d"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/10 to-secondary-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="flex justify-between items-center mb-6 relative z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">Live Canvas Preview</h2>
                <p className="text-slate-400 text-sm">Join {ownedPixels.length} pixels already claimed</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                LIVE
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
          </motion.div>
        </motion.div>

        {/* Features */}
        <div id="features" className="grid md:grid-cols-3 gap-8 mb-24">
          {[
            {
              icon: <Zap className="w-6 h-6 text-yellow-400" />,
              color: "yellow",
              title: "Interactive Canvas",
              desc: "Select any available pixel on our 50x50 grid. Real-time updates and instant ownership."
            },
            {
              icon: <DollarSign className="w-6 h-6 text-emerald-400" />,
              color: "emerald",
              title: "Affordable Pricing",
              desc: `Just ${process.env.NEXT_PUBLIC_PIXEL_PRICE_PER_MONTH} per pixel/month. Rent for 1, 3, 6, or 12 months. Secure payments powered by Razorpay. Own a piece of the web for less than a coffee.`
            },
            {
              icon: <Users className="w-6 h-6 text-primary-400" />,
              color: "primary",
              title: "Your Brand Forever",
              desc: "Upload your logo, add a link, and drive traffic. Your pixels are yours forever to modify or keep."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-8 group"
            >
              <div className={`w-12 h-12 bg-${feature.color}-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-${feature.color}-500/20`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-600 mb-4">
            &copy; {new Date().getFullYear()} PixelPlace. Why fit in when you can stand out?
          </p>
        </div>
      </footer>
    </div>
  )
}
