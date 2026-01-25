'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function VideoHero() {
    const [showScrollIndicator, setShowScrollIndicator] = useState(true)

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollIndicator(window.scrollY < 100)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <section className="sticky top-0 h-screen w-full overflow-hidden -z-10">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
            >
                <source src="/intro.mp4" type="video/mp4" />
            </video>

            <div className="absolute inset-0 bg-black/30" />

            <AnimatePresence>
                {showScrollIndicator && (
                    <motion.div
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.5 } }}
                    >
                        <div className="flex flex-col items-center gap-2 text-white/80">
                            <span className="text-sm font-light tracking-widest">SCROLL</span>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}
