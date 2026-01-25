'use client'

import { useCallback, useEffect, useState, useRef } from 'react'

// Keep a singleton AudioContext to avoid device limit errors
let globalAudioCtx: AudioContext | null = null

const getAudioCtx = () => {
    if (typeof window === 'undefined') return null
    if (!globalAudioCtx) {
        globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return globalAudioCtx
}

export const useAudio = () => {
    const [enabled, setEnabled] = useState(true)

    useEffect(() => {
        const saved = localStorage.getItem('audio_enabled')
        if (saved !== null) {
            setEnabled(saved === 'true')
        }
    }, [])

    const toggleAudio = useCallback(() => {
        setEnabled(prev => {
            const next = !prev
            localStorage.setItem('audio_enabled', String(next))
            return next
        })
    }, [])

    const playSound = useCallback(async (type: 'click' | 'shimmer' | 'hover') => {
        if (!enabled) return

        const audioCtx = getAudioCtx()
        if (!audioCtx) return

        // Browsers require a user gesture to resume the AudioContext
        if (audioCtx.state === 'suspended') {
            try {
                await audioCtx.resume()
            } catch (error) {
                console.warn('AudioContext failed to resume:', error)
                return
            }
        }

        const oscillator = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioCtx.destination)

        if (type === 'click') {
            oscillator.type = 'sine'
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime)
            oscillator.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.1)
            gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1)
            oscillator.start()
            oscillator.stop(audioCtx.currentTime + 0.1)
        } else if (type === 'hover') {
            oscillator.type = 'sine'
            oscillator.frequency.setValueAtTime(400, audioCtx.currentTime)
            oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.05)
            gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.05)
            oscillator.start()
            oscillator.stop(audioCtx.currentTime + 0.05)
        } else if (type === 'shimmer') {
            oscillator.type = 'triangle'
            oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime)
            oscillator.frequency.exponentialRampToValueAtTime(1500, audioCtx.currentTime + 0.2)
            gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2)
            oscillator.start()
            oscillator.stop(audioCtx.currentTime + 0.2)
        }
    }, [enabled])

    return { enabled, toggleAudio, playSound }
}
