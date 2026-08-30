'use client'

import Link from 'next/link'

const MARK = [
  [1, 1, 1, 1, 0],
  [1, 0, 0, 1, 0],
  [1, 1, 1, 1, 0],
  [1, 0, 0, 0, 0],
  [1, 0, 0, 0, 0],
]

const SIZES = {
  sm: { mark: 40, type: '1.35rem' },
  md: { mark: 48, type: '1.55rem' },
  lg: { mark: 64, type: '1.95rem' },
}

interface PixelLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
  noLink?: boolean
}

export default function PixelLogo({
  size = 'md',
  showText = true,
  className = '',
  noLink = false,
}: PixelLogoProps) {
  const { mark, type } = SIZES[size]
  const cell = 3.2
  const gap = 0.55

  const markSvg = (
    <span
      className="relative grid shrink-0 place-items-center rounded-[5px]"
      style={{
        width: mark,
        height: mark,
        background: 'var(--ks-lacquer-deep)',
        border: '1px solid var(--ks-kinpaku)',
        boxShadow: '0 0 0 1px oklch(84% 0.19 80.46 / 0.16), 0 8px 24px oklch(84% 0.19 80.46 / 0.12)',
      }}
    >
      <svg width={mark - 8} height={mark - 8} viewBox="0 0 22 22" aria-hidden>
        {MARK.flatMap((row, y) =>
          row.map((on, x) => (
            <rect
              key={`${x}-${y}`}
              x={x * (cell + gap) + 0.9}
              y={y * (cell + gap) + 0.9}
              width={cell}
              height={cell}
              rx="0.35"
              fill={on ? 'var(--ks-kinpaku)' : 'oklch(84% 0.19 80.46 / 0.16)'}
            />
          ))
        )}
      </svg>
    </span>
  )

  const content = (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {markSvg}
      {showText && (
        <span className="ks-wordmark leading-none" style={{ fontSize: type }}>
          PixelPlace
        </span>
      )}
    </span>
  )

  if (noLink) return content

  return (
    <Link href="/" className="inline-flex items-center hover:opacity-80 transition-opacity">
      {content}
    </Link>
  )
}
