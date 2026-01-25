'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/home/Navbar'
import VideoHero from '@/components/home/VideoHero'
import HeroSection from '@/components/home/HeroSection'
import CanvasPreview from '@/components/home/CanvasPreview'
import Features from '@/components/home/Features'

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
        if (data.pixels) {
          setOwnedPixels(data.pixels.flatMap((p: any) =>
            p.coordinates.map((coord: string) => {
              const [x, y] = coord.split(',').map(Number)
              return { x, y, imageUrl: p.imageUrl, link: p.link }
            })
          ))
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

          {/* Video Background Section - Canvas Preview Only */}
          <div className="relative mb-20 md:mb-32">
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

            {/* Canvas Preview */}
            <div className="relative z-10">
              <CanvasPreview ownedPixels={ownedPixels} />
            </div>
          </div>

          {/* Features - No Video Background */}
          <Features />
        </main>
      </div>

      {/* Footer - No Video Background */}
      <footer className="relative border-t border-[#BF953F]/20 py-12 mt-20 bg-black">
        <div className="absolute inset-0 bg-gradient-to-t from-[#BF953F]/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <p className="text-slate-500 mb-4 font-light">
            &copy; {new Date().getFullYear()} PixelPlace. <span className="text-[#BF953F]">Designed for the Extraordinary.</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
