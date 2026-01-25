'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Newsletter() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))

        toast.success('You have been added to the Estate Registry!')
        setEmail('')
        setLoading(false)
    }

    return (
        <section className="relative py-24 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#BF953F]/5 rounded-full blur-[120px] -z-10" />

            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="glass-panel max-w-4xl mx-auto p-8 md:p-16 text-center relative overflow-hidden group"
                >
                    {/* Subtle Inner Glow */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#BF953F]/50 to-transparent" />

                    <div className="relative z-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#BF953F]/10 border border-[#BF953F]/20 mb-8 group-hover:scale-110 transition-transform duration-500">
                            <Mail className="w-8 h-8 text-[#FCF6BA]" />
                        </div>

                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#FCF6BA] mb-6">
                            The Weekly <span className="text-gold-gradient">Estate Report</span>
                        </h2>

                        <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
                            Join the inner circle of digital estate holders. Receive exclusive insights on canvas valuation, emerging trends, and early access to new sectors.
                        </p>

                        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                            <div className="flex-1 relative">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Your professional email"
                                    className="w-full px-6 py-4 bg-black/40 border border-[#BF953F]/20 rounded-xl focus:border-[#BF953F] outline-none text-white placeholder-slate-600 transition-all font-light"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-luxury px-8 py-4 flex items-center justify-center gap-2 group disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Join Registry
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="mt-8 text-slate-500 text-sm italic">
                            Reserved for those who value digital prominence. No spam, only prestige.
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
