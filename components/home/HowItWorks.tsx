'use client'

const steps = [
    {
        title: 'Pick open pixels',
        body: 'Choose an available block on the public canvas.',
    },
    {
        title: 'Add logo and link',
        body: 'Upload your mark and the site visitors should open.',
    },
    {
        title: 'Pay and go live',
        body: 'Payment turns the listing on. No manual wait.',
    },
]

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="mb-24 md:mb-32">
            <h2 className="ks-headline mb-12 max-w-xl">Three steps. Then it is on the canvas.</h2>
            <div className="grid md:grid-cols-3">
                {steps.map((step, index) => (
                    <div
                        key={step.title}
                        className={`py-8 md:py-0 md:pr-10 ${index < steps.length - 1 ? 'md:border-r border-[var(--ks-rule)] md:pl-0' : ''} ${index > 0 ? 'md:pl-10 border-t md:border-t-0 border-[var(--ks-rule)]' : ''}`}
                    >
                        <h3 className="text-[var(--ks-champagne)] text-lg font-medium mb-3">{step.title}</h3>
                        <p className="text-[var(--ks-muted)] text-[15px] leading-[1.7] max-w-[36ch]">{step.body}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}
