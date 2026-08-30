'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Volume2, VolumeX } from 'lucide-react'
import PixelLogo from '@/components/PixelLogo'
import { useAudio } from '@/hooks/useAudio'

export default function Navbar({ isLoggedIn }: { isLoggedIn: boolean }) {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const { enabled: audioEnabled, toggleAudio } = useAudio()

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 24)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-[background,border-color] duration-500 ${isScrolled ? 'bg-[var(--ks-lacquer)]/92 backdrop-blur-md border-b border-[var(--ks-rule)]' : 'bg-transparent'}`}>
            <div className="ks-section py-3 flex justify-between items-center">
                <div className="max-h-9 max-w-[148px] overflow-hidden flex items-center">
                    <PixelLogo size="sm" className="!gap-0 [&_div]:!w-[148px] [&_div]:!h-9" />
                </div>

                <div className="hidden md:flex items-center gap-7">
                    <button
                        onClick={toggleAudio}
                        className="p-2 text-[var(--ks-muted)] hover:text-[var(--ks-kinpaku)] transition-colors"
                        title={audioEnabled ? 'Disable sounds' : 'Enable sounds'}
                    >
                        {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <Link href="/#live-canvas" className="ks-mono text-[var(--ks-muted)] hover:text-[var(--ks-champagne)]">
                        Live canvas
                    </Link>
                    <Link href="/canvas" className="btn-luxury !py-2.5 !px-5 text-sm">
                        Place a listing
                    </Link>
                    {isLoggedIn ? (
                        <Link href="/dashboard" className="ks-mono text-[var(--ks-muted)] hover:text-[var(--ks-champagne)]">
                            Dashboard
                        </Link>
                    ) : (
                        <Link href="/login" className="ks-mono text-[var(--ks-muted)] hover:text-[var(--ks-champagne)]">
                            Login
                        </Link>
                    )}
                </div>

                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 text-[var(--ks-champagne)]"
                >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-[var(--ks-lacquer)] border-t border-[var(--ks-rule)] overflow-hidden"
                    >
                        <div className="ks-section py-6 flex flex-col gap-4">
                            <Link href="/#live-canvas" className="ks-mono text-[var(--ks-champagne)]" onClick={() => setIsMobileMenuOpen(false)}>Live canvas</Link>
                            <Link href="/canvas" className="ks-mono text-[var(--ks-champagne)]" onClick={() => setIsMobileMenuOpen(false)}>Place a listing</Link>
                            {isLoggedIn ? (
                                <Link href="/dashboard" className="ks-mono text-[var(--ks-champagne)]" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                            ) : (
                                <Link href="/login" className="ks-mono text-[var(--ks-champagne)]" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}
