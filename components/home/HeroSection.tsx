'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function HeroSection() {
    return (
        <div className="mb-10 md:mb-12 max-w-3xl">
            <h1 className="ks-display mb-6">
                Your mark,
                <br />
                on the grid.
            </h1>
            <p className="text-[var(--ks-muted)] text-base md:text-lg leading-[1.7] max-w-[42ch] mb-8">
                Rent a block on the public 50×50 canvas. Upload a logo and a link.
                After payment, the listing is live — from one hour to one year.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/canvas" className="btn-luxury gap-2">
                    Place your brand
                    <ArrowRight className="w-4 h-5" />
                </Link>
                <Link href="#how-it-works" className="glass-button inline-flex items-center justify-center">
                    How it works
                </Link>
            </div>
        </div>
    )
}
