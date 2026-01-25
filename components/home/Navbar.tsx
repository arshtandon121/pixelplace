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
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-in-out ${isScrolled ? 'bg-black/80 backdrop-blur-md border-b border-[#BF953F]/20' : 'bg-transparent'}`}>
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <PixelLogo size="sm" />
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <button
                        onClick={toggleAudio}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-[#BF953F]/10 hover:border-[#BF953F]/30 transition-all group"
                        title={audioEnabled ? "Disable Sounds" : "Enable Sounds"}
                    >
                        {audioEnabled ? (
                            <Volume2 className="w-5 h-5 text-[#FCF6BA]" />
                        ) : (
                            <VolumeX className="w-5 h-5 text-slate-500" />
                        )}
                    </button>

                    <Link href="/canvas" className="text-sm font-medium text-slate-200 hover:text-[#FCF6BA] transition-colors uppercase tracking-widest">
                        Canvas
                    </Link>

                    {isLoggedIn ? (
                        <Link href="/dashboard" className="px-6 py-2 text-sm bg-white/10 backdrop-blur-sm text-white font-bold hover:bg-white/20 border border-white/20 rounded-lg transition-all">
                            Dashboard
                        </Link>
                    ) : (
                        <div className="flex items-center gap-6">
                            <Link href="/login" className="text-sm text-white/90 hover:text-white font-medium transition-colors">
                                Login
                            </Link>
                            <Link href="/signup" className="px-6 py-2 text-sm bg-white/10 backdrop-blur-sm text-white font-bold hover:bg-white/20 border border-white/20 rounded-lg transition-all">
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 text-white bg-black/20 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-black/95 backdrop-blur-lg border-t border-[#BF953F]/10 overflow-hidden"
                    >
                        <div className="container mx-auto px-4 py-8 flex flex-col gap-6 items-center">
                            <button
                                onClick={toggleAudio}
                                className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 w-full justify-center"
                            >
                                {audioEnabled ? (
                                    <>
                                        <Volume2 className="w-5 h-5 text-[#FCF6BA]" />
                                        <span className="text-sm text-white">Sounds Enabled</span>
                                    </>
                                ) : (
                                    <>
                                        <VolumeX className="w-5 h-5 text-slate-500" />
                                        <span className="text-sm text-slate-400">Sounds Disabled</span>
                                    </>
                                )}
                            </button>

                            <Link
                                href="/canvas"
                                className="text-lg text-slate-200 hover:text-[#FCF6BA] transition-colors uppercase tracking-widest"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Canvas
                            </Link>

                            {isLoggedIn ? (
                                <Link
                                    href="/dashboard"
                                    className="w-full text-center py-4 bg-white/10 text-white font-bold rounded-xl border border-white/20"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <div className="flex flex-col w-full gap-4">
                                    <Link
                                        href="/login"
                                        className="w-full text-center py-4 text-white font-medium"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/signup"
                                        className="w-full text-center py-4 bg-white/10 text-white font-bold rounded-xl border border-white/20"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}
