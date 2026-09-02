'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import PixelGrid from '@/components/PixelGrid'
import { GRID_SIZE } from '@/lib/constants'

interface CanvasPreviewProps {
    ownedPixels: any[]
}

export default function CanvasPreview({ ownedPixels }: CanvasPreviewProps) {
    const router = useRouter()
    const reduceMotion = useReducedMotion()
    const livePixels = ownedPixels.length
    const available = GRID_SIZE * GRID_SIZE - livePixels

    return (
        <div id="live-canvas" className="w-full">
            <div className="flex items-end justify-between gap-3 mb-3 flex-wrap">
                <p className="ks-mono text-[var(--ks-muted)] leading-relaxed">
                    {GRID_SIZE} × {GRID_SIZE}
                    <span className="mx-2 sm:mx-3 text-[var(--ks-rule-strong)]">/</span>
                    {livePixels} live
                    <span className="mx-2 sm:mx-3 text-[var(--ks-rule-strong)]">/</span>
                    {available.toLocaleString()} open
                </p>
                <div className="flex items-center gap-3 shrink-0">
                    <span className="ks-mono inline-flex items-center gap-2 text-[var(--ks-patina-text)]">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--ks-patina)] opacity-60" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--ks-patina)]" />
                        </span>
                        Live
                    </span>
                    <Link href="/canvas" className="ks-mono text-[var(--ks-kinpaku)] hover:text-[var(--ks-champagne)] transition-colors">
                        Open full canvas →
                    </Link>
                </div>
            </div>

            <motion.div
                initial={reduceMotion ? false : { opacity: 0, clipPath: 'inset(6% 6% 6% 6%)' }}
                animate={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                className="ks-plinth p-2 sm:p-3"
            >
                <div className="bg-[var(--ks-lacquer)] overflow-hidden">
                    <PixelGrid
                        ownedPixels={ownedPixels}
                        selectedPixels={[]}
                        onPixelClick={() => router.push('/canvas')}
                        onPixelHover={() => { }}
                        previewImage={null}
                        showTooltip={false}
                    />
                </div>
            </motion.div>
        </div>
    )
}
