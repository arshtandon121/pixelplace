'use client'

const features = [
    {
        title: 'Public brand display',
        description: 'Your logo and link sit on a live page anyone can open. Advertising space on our canvas — not an investment product.',
    },
    {
        title: 'One hour to one year',
        description: 'Every term is a one-time payment. Before it ends, open the dashboard and tap Renew to keep the same pixels and logo.',
    },
    {
        title: 'Your link, your creative',
        description: 'Change the destination URL from the dashboard while the listing is live.',
    },
    {
        title: 'Live after payment',
        description: 'Successful payment turns the listing on. You get a receipt and manage it from the dashboard.',
    },
]

export default function Features() {
    return (
        <section id="features" className="mb-24 md:mb-32">
            <h2 className="ks-headline mb-12">What you actually get</h2>
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
                {features.map((feature) => (
                    <div key={feature.title} className="border-t border-[var(--ks-rule)] pt-6">
                        <h3 className="text-[var(--ks-champagne)] text-lg mb-3">{feature.title}</h3>
                        <p className="text-[var(--ks-muted)] text-[15px] leading-[1.7] max-w-[48ch]">
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    )
}
