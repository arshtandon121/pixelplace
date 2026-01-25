'use client'

import { motion } from 'framer-motion'

const stats = [
    { label: 'Pixels Claimed', value: 'xx' },
    { label: 'Global Brands', value: '**' },
    { label: 'Canvas Value', value: '$**' },
    { label: 'Active Investors', value: '**' },
    { label: 'Pixel Appreciation', value: '+**%' },
]

export default function StatsMarquee() {
    // Duplicate stats for infinite scroll effect
    const dualStats = [...stats, ...stats]

    return (
        <div className="relative w-full py-6 bg-[#BF953F]/5 border-y border-[#BF953F]/10 overflow-hidden mb-20">
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black to-transparent z-10" />

            <motion.div
                className="flex whitespace-nowrap gap-12 md:gap-24"
                animate={{ x: [0, -1000] }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            >
                {dualStats.map((stat, index) => (
                    <div key={index} className="flex items-center gap-4">
                        <span className="text-[10px] md:text-xs font-bold text-[#BF953F] uppercase tracking-[0.2em] whitespace-nowrap">
                            {stat.label}
                        </span>
                        <span className="text-xl md:text-2xl font-serif font-bold text-[#FCF6BA] whitespace-nowrap">
                            {stat.value}
                        </span>
                        {/* Elegant Separator */}
                        <div className="w-1.5 h-1.5 rounded-full bg-[#BF953F]/40 ml-8 md:ml-12" />
                    </div>
                ))}
            </motion.div>
        </div>
    )
}
