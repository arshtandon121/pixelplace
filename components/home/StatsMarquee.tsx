'use client'

export default function StatsMarquee() {
    return (
        <div className="border-y border-[var(--ks-rule)]">
            <div className="ks-section py-4 flex flex-wrap items-center justify-between gap-3">
                {[
                    ['Canvas', '50 × 50'],
                    ['Shortest', '1 hour'],
                    ['Longest', '1 year'],
                    ['Goes live', 'After payment'],
                ].map(([label, value]) => (
                    <div key={label} className="flex items-baseline gap-3">
                        <span className="ks-mono text-[var(--ks-faint)]">{label}</span>
                        <span className="text-[var(--ks-champagne)] text-sm">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
