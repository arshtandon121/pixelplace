'use client'

import PixelGrid from '@/components/PixelGrid'

interface CanvasPreviewProps {
    ownedPixels: any[]
}

export default function CanvasPreview({ ownedPixels }: CanvasPreviewProps) {
    return (
        <div className="mb-20 md:mb-32 flex justify-center perspective-1000">
            <div className="glass-panel p-1 relative group shadow-2xl w-full max-w-[650px] border border-[#BF953F]/30">
                {/* Gold Border Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#BF953F] rounded-2xl opacity-30 blur-md group-hover:opacity-60 transition-opacity duration-700" />

                <div className="bg-slate-950/90 rounded-xl p-4 md:p-8 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 relative z-10 gap-3">
                        <div>
                            <h2 className="text-lg md:text-2xl font-bold text-[#FCF6BA] font-serif">Live Estate Preview</h2>
                            <p className="text-[#BF953F] text-xs md:text-sm tracking-widest uppercase">Limited: {50 * 50 - ownedPixels.length} Blocks</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-[#FCF6BA] bg-[#BF953F]/10 px-3 py-1.5 rounded border border-[#BF953F]/30">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#BF953F] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FCF6BA]"></span>
                            </span>
                            LIVE
                        </div>
                    </div>

                    <div className="flex justify-center relative z-10 overflow-x-auto">
                        <PixelGrid
                            ownedPixels={ownedPixels}
                            selectedPixels={[]}
                            onPixelClick={() => { }}
                            onPixelHover={() => { }}
                            previewImage={null}
                            showTooltip={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
