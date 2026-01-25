'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'

export default function CustomCursor() {
    const [isPointer, setIsPointer] = useState(false)
    const [isVisible, setIsVisible] = useState(false)

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    // Smooth springs for the cursor movement
    const springConfig = { damping: 25, stiffness: 250 }
    const cursorX = useSpring(mouseX, springConfig)
    const cursorY = useSpring(mouseY, springConfig)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX)
            mouseY.set(e.clientY)
            if (!isVisible) setIsVisible(true)

            // Check if hovering over interactive elements
            const target = e.target as HTMLElement
            const isSelectable =
                window.getComputedStyle(target).cursor === 'pointer' ||
                target.tagName.toLowerCase() === 'button' ||
                target.tagName.toLowerCase() === 'a' ||
                target.closest('button') ||
                target.closest('a') ||
                target.hasAttribute('data-cursor')

            setIsPointer(!!isSelectable)
        }

        const handleMouseLeave = () => setIsVisible(false)
        const handleMouseEnter = () => setIsVisible(true)

        window.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseleave', handleMouseLeave)
        document.addEventListener('mouseenter', handleMouseEnter)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseleave', handleMouseLeave)
            document.removeEventListener('mouseenter', handleMouseEnter)
        }
    }, [mouseX, mouseY, isVisible])

    if (!isVisible) return null

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] mix-blend-difference hidden md:block">
            {/* Outer Ring */}
            <motion.div
                className="absolute top-0 left-0 w-8 h-8 rounded-full border border-[#BF953F] opacity-50"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: '-50%',
                    translateY: '-50%',
                    scale: isPointer ? 2.5 : 1,
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 300, mass: 0.5 }}
            />

            {/* Dynamic Glow */}
            <motion.div
                className="absolute top-0 left-0 w-8 h-8 rounded-full bg-[#BF953F]/10 blur-sm"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: '-50%',
                    translateY: '-50%',
                    scale: isPointer ? 3 : 0.5,
                    opacity: isPointer ? 0.6 : 0,
                }}
            />

            {/* Center Dot */}
            <motion.div
                className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full bg-[#FCF6BA]"
                style={{
                    x: mouseX,
                    y: mouseY,
                    translateX: '-50%',
                    translateY: '-50%',
                    scale: isPointer ? 0 : 1,
                }}
            />
        </div>
    )
}
