import { ImageResponse } from 'next/og'
import { BRAND_CHAMPAGNE, BRAND_GOLD, BRAND_LACQUER, PIXEL_P } from '@/lib/brand-mark'

export const runtime = 'edge'
export const alt = 'PixelPlace — put your brand on the live pixel canvas'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  const cell = 28
  const gap = 6
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: BRAND_LACQUER,
          gap: 36,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 220,
            height: 220,
            border: '3px solid ' + BRAND_GOLD,
            borderRadius: 22,
            background: '#080706',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap }}>
            {PIXEL_P.map((row, y) => (
              <div key={y} style={{ display: 'flex', gap }}>
                {row.map((on, x) => (
                  <div
                    key={x}
                    style={{
                      width: cell,
                      height: cell,
                      borderRadius: 4,
                      background: on ? BRAND_GOLD : 'rgba(232, 184, 74, 0.16)',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 56,
            letterSpacing: '0.22em',
            color: BRAND_CHAMPAGNE,
            textTransform: 'uppercase',
          }}
        >
          PixelPlace
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            letterSpacing: '0.16em',
            color: BRAND_GOLD,
            textTransform: 'uppercase',
          }}
        >
          Your mark, on the grid
        </div>
      </div>
    ),
    { ...size }
  )
}
