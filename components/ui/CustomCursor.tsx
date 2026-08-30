'use client'

import { useEffect, useRef } from 'react'

const HOVER = 'a,button,input,textarea,select,label,[role="button"],[data-cursor]'

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot = dotRef.current
    if (!dot) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (reduced || coarse) {
      document.body.classList.remove('md:cursor-none')
      return
    }

    let hovering = false

    const onMove = (e: MouseEvent) => {
      const nextHover = !!(e.target as HTMLElement | null)?.closest(HOVER)
      if (nextHover !== hovering) {
        hovering = nextHover
        dot.style.background = hovering ? 'transparent' : 'var(--ks-kinpaku)'
        dot.style.width = hovering ? '14px' : '10px'
        dot.style.height = hovering ? '14px' : '10px'
      }
      dot.style.opacity = '1'
      dot.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0) translate(-50%,-50%)`
    }

    const onLeave = () => {
      dot.style.opacity = '0'
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div
      ref={dotRef}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[9999] hidden md:block"
      style={{
        width: 10,
        height: 10,
        opacity: 0,
        background: 'var(--ks-kinpaku)',
        border: '1px solid var(--ks-kinpaku)',
        borderRadius: 1,
        willChange: 'transform',
        contain: 'layout style',
      }}
    />
  )
}
