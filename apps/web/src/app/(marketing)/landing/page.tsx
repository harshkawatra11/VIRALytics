import Link from 'next/link'

const COMPARE = [
  ['Data source', 'Public scraping + limited API', 'Official APIs + optional OAuth'],
  ['Completion rate', '✗ Not available', '✓ OAuth accounts'],
  ['Avg watch time', '✗ Not available', '✓ OAuth accounts'],
  ['Viral score', '✓', '✓'],
  ['Track any public account', '✓ URL only', '✓ URL only'],
  ['Collections / groups', '✓', '✓'],
  ['Price', '$250 / month', '$29–$99 / month'],
]

const FEATURES = [
  {
    icon: '🔗',
    title: 'Paste a URL — instant tracking',
    body: 'Add any YouTube, Instagram, or TikTok account in seconds. No creator login. No OAuth required to get started.',
  },
  {
    icon: '⚡',
    title: 'Viral performance score',
    body: 'Every video gets a multiplier: 15.7× more than usual. See what\'s working before the algorithm decides.',
  },
  {
    icon: '🔒',
    title: 'Private metrics on owned accounts',
    body: 'Connect accounts you manage via OAuth to unlock watch time and completion rate — data no scraper can provide.',
  },
  {
    icon: '📁',
    title: 'Collections (like Shortimize)',
    body: 'Group accounts into Collections — "Flo", "Deal Brand", "Viral Labs". Each collection gets its own overview tab.',
  },
]

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="mb-3 inline-block rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-text-muted)]">
          The Shortimize alternative with private metrics
        </div>
        <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-[var(--color-text)] sm:text-5xl">
          Track any creator.<br />
          <span className="text-[var(--color-brand)]">See what actually goes viral.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-[var(--color-text-muted)]">
          VIRALytics gives agencies and brand managers a single dashboard for YouTube, Instagram,
          and TikTok — instant public tracking from any URL, plus private analytics on accounts
          you own.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="rounded-lg bg-[var(--color-brand)] px-5 py-2.5 font-medium text-white hover:bg-[#6d2fd6]"
          >
            Start free — no card required
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-[var(--color-border-strong)] px-5 py-2.5 font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
          >
            See pricing
          </Link>
        </div>
        <p className="mt-3 text-xs text-[var(--color-text-subtle)]">
          Free plan includes 3 accounts. No credit card for the first 14 days of any paid plan.
        </p>
      </section>

      {/* Features */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-10 text-center text-2xl font-semibold">Everything you need. Nothing you don&apos;t.</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-[var(--radius-card)] border border-[var(--color-border)] p-5">
                <div className="text-2xl">{f.icon}</div>
                <h3 className="mt-2 font-semibold text-[var(--color-text)]">{f.title}</h3>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="mb-8 text-center text-2xl font-semibold">
            VIRALytics vs Shortimize
          </h2>
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-subtle)]">Feature</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-text-subtle)]">Shortimize</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-brand)]">VIRALytics</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([feature, them, us]) => (
                  <tr key={feature} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{feature}</td>
                    <td className="px-4 py-3 text-center text-xs text-[var(--color-text-muted)]">{them}</td>
                    <td className="px-4 py-3 text-center text-xs font-medium text-[var(--color-text)]">{us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
            Paying $250/mo for Shortimize?{' '}
            <Link href="/signup" className="text-[var(--color-brand)] hover:underline">
              Switch today and save $150–200/month.
            </Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-brand)] py-16 text-center text-white">
        <h2 className="text-2xl font-bold">Ready to see what goes viral?</h2>
        <p className="mt-2 text-white/80">Track your first account in 30 seconds. No card required.</p>
        <Link
          href="/signup"
          className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-[var(--color-brand)] hover:bg-white/90"
        >
          Get started free
        </Link>
      </section>
    </main>
  )
}
