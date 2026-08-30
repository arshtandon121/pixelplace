import type { Metadata } from 'next'
import { Alumni_Sans, Albert_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/react'
import CustomCursor from '@/components/ui/CustomCursor'

const display = Alumni_Sans({
  subsets: ['latin'],
  weight: ['100', '300', '400'],
  variable: '--font-display',
})

const sans = Albert_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'PixelPlace — Put your brand on the live pixel canvas',
  description: 'Rent space on a public 50×50 pixel canvas. Upload your logo and link. Listings go live after payment, from 1 hour to 1 year.',
  icons: {
    icon: '/pixelplaceicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} ${mono.variable} font-sans md:cursor-none`}>
        <CustomCursor />
        {children}
        <Toaster position="top-right" />
        <Analytics />
      </body>
    </html>
  )
}

