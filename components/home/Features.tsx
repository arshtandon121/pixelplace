'use client'

import { motion } from 'framer-motion'
import { DollarSign, Users, Layers, Zap } from 'lucide-react'

const features = [
    {
        icon: DollarSign,
        title: 'Revenue Potential',
        description: 'Your pixel space appreciates in value as the platform grows. Early adopters benefit most.'
    },
    {
        icon: Users,
        title: 'Elite Community',
        description: 'Join a curated network of premium brands and forward-thinking entrepreneurs.'
    },
    {
        icon: Layers,
        title: 'Exclusive Ownership',
        description: 'Total control over your designated space. Update your creative, link to your empire.'
    },
    {
        icon: Zap,
        title: 'Instant Visibility',
        description: 'Your brand displayed on a high-traffic digital landmark, seen by thousands daily.'
    }
]

export default function Features() {
    return (
        <div className="grid md:grid-cols-2 gap-8 mb-32">
            {features.map((feature, index) => (
                <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="glass-panel p-8 hover:border-[#BF953F]/30 transition-all duration-500 group"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-[#BF953F]/10 border border-[#BF953F]/20 group-hover:bg-[#BF953F]/20 transition-colors">
                            <feature.icon className="w-6 h-6 text-[#FCF6BA]" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[#FCF6BA] mb-2 font-serif">{feature.title}</h3>
                            <p className="text-slate-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
