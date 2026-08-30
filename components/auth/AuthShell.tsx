'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import PixelLogo from '@/components/PixelLogo'
import PixelGrid from '@/components/PixelGrid'

const SAMPLE_MARKS = [
  { x: 4, y: 6, w: 10, h: 5, fill: 'oklch(84% 0.19 80.46)', label: 'A' },
  { x: 18, y: 14, w: 10, h: 5, fill: 'oklch(70% 0.12 188)', label: 'B' },
  { x: 32, y: 8, w: 10, h: 5, fill: 'oklch(91% 0 0 / 0.45)', label: 'C' },
]

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  const reduceMotion = useReducedMotion()
  const [ownedPixels, setOwnedPixels] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/pixels')
      .then((res) => res.json())
      .then((data) => {
        if (data.pixels) setOwnedPixels(data.pixels)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-[100svh] grid lg:grid-cols-2 bg-[var(--ks-lacquer)]">
      <aside className="relative hidden lg:flex flex-col justify-between p-10 xl:p-14 border-r border-[var(--ks-rule)] overflow-hidden">
        <div className="relative z-10">
          <PixelLogo size="lg" />
        </div>

        <div className="relative z-10 my-10">
          <p className="ks-mono text-[var(--ks-patina-text)] mb-4 inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ks-patina)]" />
            Live canvas
          </p>
          <h2 className="ks-headline mb-4 max-w-[16ch]">A public grid for real brands.</h2>
          <p className="text-[var(--ks-muted)] text-[15px] leading-[1.7] max-w-[38ch] mb-8">
            Logo plus link. Listing goes live after payment. One hour to one year.
          </p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, clipPath: 'inset(8% 8% 8% 8%)' }}
            animate={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="ks-plinth p-2 w-full max-w-[460px]"
          >
            <div className="relative overflow-hidden bg-[var(--ks-lacquer)] h-[320px]">
              <div className="origin-top-left scale-[0.52]">
                <PixelGrid
                  ownedPixels={ownedPixels}
                  selectedPixels={[]}
                  onPixelClick={() => {}}
                  onPixelHover={() => {}}
                  previewImage={null}
                  showTooltip={false}
                />
              </div>
              {ownedPixels.length === 0 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 600" aria-hidden>
                  {SAMPLE_MARKS.map((mark, i) => (
                    <motion.g
                      key={mark.label}
                      initial={reduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 + i * 0.18, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <rect
                        x={mark.x * 12}
                        y={mark.y * 12}
                        width={mark.w * 12}
                        height={mark.h * 12}
                        fill={mark.fill}
                      />
                      <text
                        x={mark.x * 12 + mark.w * 6}
                        y={mark.y * 12 + mark.h * 7}
                        textAnchor="middle"
                        fill="oklch(14% 0.018 95)"
                        fontSize="22"
                        fontFamily="Alumni Sans, sans-serif"
                      >
                        {mark.label}
                      </text>
                    </motion.g>
                  ))}
                </svg>
              )}
            </div>
          </motion.div>
        </div>

        <p className="ks-mono text-[var(--ks-faint)] relative z-10">50 × 50 · brand display</p>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="lg:hidden mb-8">
            <PixelLogo size="md" />
          </div>
          <h1 className="ks-headline mb-2">{title}</h1>
          <p className="text-[var(--ks-muted)] text-sm mb-8">{subtitle}</p>
          {children}
        </motion.div>
      </main>
    </div>
  )
}
