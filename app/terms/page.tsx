import type { Metadata } from 'next'
import Link from 'next/link'
import PixelLogo from '@/components/PixelLogo'

export const metadata: Metadata = {
  title: 'Listing rules — PixelPlace',
  description:
    'Rules for what may be listed on the PixelPlace public pixel canvas: brand logos and website links, time-limited advertising, and prohibited content.',
  alternates: { canonical: 'https://www.pixelplace.in/terms' },
}

const allowed = [
  'A logo or brand mark for a real business, product, or creator',
  'One destination URL that the logo opens (your own site or a legitimate campaign page)',
]

const forbidden = [
  'Illegal goods or services, fraud, malware, phishing, or deceptive links',
  'Adult, sexual, or pornographic images or destinations',
  'Hate, harassment, extremist content, or anything that exploits minors',
  'Weapons, drugs, tobacco, or other restricted categories',
  'Gambling, betting, or lottery products',
  'Investment, trading, appreciation, land/estate, or get-rich claims',
  'NFTs, crypto tokens, or anything framed as a digital collectible for sale',
  'Impersonating another brand',
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--ks-lacquer)]">
      <header className="border-b border-[var(--ks-rule)]">
        <div className="ks-section py-4 flex justify-between items-center">
          <PixelLogo size="sm" />
          <Link href="/" className="ks-mono text-[var(--ks-muted)] hover:text-[var(--ks-champagne)]">
            Home
          </Link>
        </div>
      </header>

      <main className="ks-section py-14 md:py-20 max-w-[720px]">
        <p className="ks-mono text-[var(--ks-patina-text)] mb-4">Terms</p>
        <h1 className="ks-headline mb-4">Listing rules</h1>
        <p className="text-[var(--ks-muted)] text-[15px] leading-[1.7] mb-3">
          These rules apply to every listing on pixelplace.in. By creating an account or paying for a listing, you agree to them.
        </p>
        <p className="ks-mono text-[var(--ks-faint)] mb-12">Last updated: 31 August 2026</p>

        <section className="mb-12">
          <h2 className="text-lg text-[var(--ks-champagne)] mb-3">What PixelPlace is</h2>
          <p className="text-[var(--ks-muted)] text-[15px] leading-[1.7]">
            PixelPlace is a hosted advertising page. You rent a block on a public 50×50 pixel canvas, upload a logo, add one website URL, and pay. After payment, the listing is shown on the canvas for a fixed term (1 hour to 1 year). When the term ends, that space opens again.
          </p>
          <p className="text-[var(--ks-muted)] text-[15px] leading-[1.7] mt-4">
            You do not buy pixels as property, shares, NFTs, or anything that can appreciate. There is no resale market and no gameplay. You pay PixelPlace for advertising display on our site. You are not buying from other sellers on a marketplace.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-lg text-[var(--ks-champagne)] mb-3">What may be listed</h2>
          <ul className="space-y-2 text-[15px] text-[var(--ks-muted)] leading-[1.7]">
            {allowed.map((item) => (
              <li key={item} className="pl-4 border-l border-[var(--ks-rule-strong)]">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-lg text-[var(--ks-champagne)] mb-3">What is not allowed</h2>
          <ul className="space-y-2 text-[15px] text-[var(--ks-muted)] leading-[1.7]">
            {forbidden.map((item) => (
              <li key={item} className="pl-4 border-l border-[var(--ks-rule)]">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-lg text-[var(--ks-champagne)] mb-3">How this is enforced</h2>
          <p className="text-[var(--ks-muted)] text-[15px] leading-[1.7]">
            An account is required. A listing only goes on the canvas after successful payment. PixelPlace can reject or remove a listing that breaks these rules, at any time, including after it is live. If we reject a listing, you can request a refund from the dashboard.
          </p>
          <p className="text-[var(--ks-muted)] text-[15px] leading-[1.7] mt-4">
            You can end a listing from the dashboard, which takes the logo off the canvas. Listings expire on a set date. To keep the same pixels and logo up, pay again from the dashboard before the term ends. Renewal is another advertising term, not an investment.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-lg text-[var(--ks-champagne)] mb-3">Payments and refunds</h2>
          <p className="text-[var(--ks-muted)] text-[15px] leading-[1.7]">
            Checkout is processed by Dodo Payments. Prices are shown in Indian rupees before you pay. Listings last for the term you buy; you can renew from the dashboard.
          </p>
          <p className="text-[var(--ks-muted)] text-[15px] leading-[1.7] mt-4">
            Refunds are for rejected or removed listings that break these rules, or as we agree in writing. Ending a listing yourself before the term expires does not create a right to a refund for unused time.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-lg text-[var(--ks-champagne)] mb-3">Your content</h2>
          <p className="text-[var(--ks-muted)] text-[15px] leading-[1.7]">
            You confirm that you have the right to use the logo and URL you upload. You give PixelPlace a limited licence to display that logo and link on the public canvas and in account emails for the duration of the listing.
          </p>
        </section>

        <section>
          <h2 className="text-lg text-[var(--ks-champagne)] mb-3">Contact</h2>
          <p className="text-[var(--ks-muted)] text-[15px] leading-[1.7]">
            Questions about these rules:{' '}
            <a href="mailto:arshtandon121@gmail.com" className="text-[var(--ks-kinpaku)] hover:text-[var(--ks-champagne)]">
              arshtandon121@gmail.com
            </a>
          </p>
        </section>
      </main>
    </div>
  )
}
