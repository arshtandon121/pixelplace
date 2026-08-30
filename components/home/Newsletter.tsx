'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Newsletter() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        await new Promise(resolve => setTimeout(resolve, 800))
        toast.success('You are on the PixelPlace updates list.')
        setEmail('')
        setLoading(false)
    }

    return (
        <section className="border-t border-[var(--ks-rule)] py-16 md:py-24">
            <div className="max-w-xl">
                <h2 className="ks-headline mb-4">Canvas notes</h2>
                <p className="text-[var(--ks-muted)] text-[15px] leading-[1.7] mb-8 max-w-[48ch]">
                    Occasional mail when listing windows open. No investment tips.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        className="flex-1 px-4 py-3.5 bg-[var(--ks-lacquer-deep)] border border-[var(--ks-rule)] rounded-[4px] text-[var(--ks-champagne)] placeholder:text-[var(--ks-faint)] outline-none focus:border-[var(--ks-rule-strong)]"
                    />
                    <button type="submit" disabled={loading} className="btn-luxury disabled:opacity-50">
                        {loading ? 'Sending…' : 'Subscribe'}
                    </button>
                </form>
            </div>
        </section>
    )
}
