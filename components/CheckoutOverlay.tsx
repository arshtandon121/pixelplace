'use client'

export default function CheckoutOverlay({
  title,
  detail,
}: {
  title: string
  detail?: string
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--ks-lacquer)]/92">
      <div className="text-center px-6">
        <div
          className="mx-auto mb-5 h-10 w-10 rounded-full border-2 border-[var(--ks-rule)] border-t-[var(--ks-kinpaku)] animate-spin"
          aria-hidden
        />
        <p className="text-[var(--ks-champagne)] text-lg mb-2">{title}</p>
        {detail && <p className="text-sm text-[var(--ks-muted)] max-w-[36ch] mx-auto leading-[1.6]">{detail}</p>}
      </div>
    </div>
  )
}
