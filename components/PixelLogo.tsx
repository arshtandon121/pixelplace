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
    sm: { width: 150, height: 75, text: 'text-xl' },
    md: { width: 220, height: 110, text: 'text-3xl' },
    lg: { width: 340, height: 170, text: 'text-5xl' },
  }

  const { width, height, text } = sizes[size]

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
          src="/logo1.png"
          alt="PixelPlace.in Logo"
          width={width}
          height={height}
          className="object-contain drop-shadow-[0_0_20px_rgba(0,217,255,0.6)]"
          priority
          unoptimized
        />
      </motion.div>

      {/* Text - only if showText is true */}
      {showText && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`font-bold ${text} bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600 bg-clip-text text-transparent`}
          style={{
            textShadow: '0 0 20px rgba(0, 217, 255, 0.8), 0 0 40px rgba(59, 130, 246, 0.6)',
          }}
        >

        </motion.div>
      )}
    </Link>
  )
}

