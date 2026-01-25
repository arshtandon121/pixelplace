'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PixelLogo from '@/components/PixelLogo'

interface NavbarProps {
    isLoggedIn: boolean
}

export default function Navbar({ isLoggedIn }: NavbarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-in-out ${scrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/10' : 'bg-transparent'}`}>
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <PixelLogo size="sm" />
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex gap-3 items-center">
                    {isLoggedIn ? (
                        <Link href="/dashboard" className="px-4 py-2 text-sm bg-white/10 backdrop-blur-sm text-white font-bold hover:bg-white/20 border border-white/20 rounded-lg transition-all">
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" className="px-4 py-2 text-sm text-white/90 hover:text-white font-medium transition-colors">
                                Login
                            </Link>
                            <Link href="/signup" className="px-4 py-2 text-sm bg-white/10 backdrop-blur-sm text-white font-bold hover:bg-white/20 border border-white/20 rounded-lg transition-all">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 text-white bg-black/20 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-all mr-2"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {mobileMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-black/90 backdrop-blur-lg border-t border-white/10">
                    <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
                        {isLoggedIn ? (
                            <Link href="/dashboard" className="px-4 py-2 text-sm bg-white/10 text-white font-bold hover:bg-white/20 border border-white/20 rounded-lg transition-all text-center">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="px-4 py-2 text-sm text-white/90 hover:text-white font-medium transition-colors text-center">
                                    Login
                                </Link>
                                <Link href="/signup" className="px-4 py-2 text-sm bg-white/10 text-white font-bold hover:bg-white/20 border border-white/20 rounded-lg transition-all text-center">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    )
}
