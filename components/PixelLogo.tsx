'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

interface PixelLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export default function PixelLogo({ size = 'md', showText = true, className = '' }: PixelLogoProps) {
  const sizes = {
    // Header Logo (Large)
    sm: { width: 350, height: 120 },
    md: { width: 500, height: 160 },
    // Login/Signup Logo (Small to fit box)
    lg: { width: 220, height: 80 },
  }

  const { width, height } = sizes[size]

  return (
    <Link href="/" className={`flex items-center gap-4 ${className} cursor-pointer hover:opacity-80 transition-opacity`}>
      {/* Logo Image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <Image
          src="/pixelplacelogo.png"
          alt="PixelPlace.in Logo"
          fill
          className="object-contain drop-shadow-[0_0_15px_rgba(191,149,63,0.3)]"
          priority
          unoptimized
        />
      </motion.div>
    </Link>
  )
}

