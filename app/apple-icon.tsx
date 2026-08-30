import { ImageResponse } from 'next/og'
import { BRAND_GOLD, BRAND_LACQUER, PIXEL_P } from '@/lib/brand-mark'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  const cell = 22
  const gap = 4
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BRAND_LACQUER,
          border: '4px solid ' + BRAND_GOLD,
          borderRadius: 28,
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
                    borderRadius: 3,
                    background: on ? BRAND_GOLD : 'rgba(232, 184, 74, 0.16)',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
