'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function HeroSection() {
    return (
        <div className="text-center mb-12 md:mb-24 relative animate-slide-up">
            {/* Golden Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-[#BF953F]/10 rounded-full blur-[80px] md:blur-[120px] -z-10 opacity-60" />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="mb-8 inline-block relative group"
            >
                <div className="absolute inset-0 bg-[#BF953F] blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
            </motion.div>

            <h1 className="text-5xl md:text-8xl font-bold mb-8 tracking-tight font-serif drop-shadow-2xl">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 drop-shadow-2xl">The Most</span> <br />
                <span className="text-gold-gradient drop-shadow-2xl">Exclusive Digital Estate</span>
            </h1>

            <p className="text-xl text-white mb-12 max-w-3xl mx-auto leading-relaxed font-light tracking-wide drop-shadow-lg bg-black/30 backdrop-blur-sm p-4 rounded-2xl">
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
    )
}
