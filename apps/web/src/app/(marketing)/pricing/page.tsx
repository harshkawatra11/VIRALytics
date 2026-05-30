import Link from 'next/link'
import { PLAN_CONFIG } from '@viralytics/core'

const PLANS = [
  {
    name: 'Starter',
    price: 29,
    accounts: PLAN_CONFIG.starter.accountLimit,
    syncHz: '12 hours',
    history: '90 days',
    features: [
      'YouTube + Instagram + TikTok',
      'Viral performance score',
      'Collections (unlimited)',
      'CSV export',
    ],
  },
  {
    name: 'Pro',
    price: 49,
    popular: true,
    accounts: PLAN_CONFIG.pro.accountLimit,
    syncHz: '6 hours',
    history: 'Unlimited',
    features: [
      'Everything in Starter',
      'OAuth deep analytics (watch time + completion rate)',
      'Hashtag filtering',
      'Virality & duration charts',
      'Smart Filters',
    ],
  },
  {
    name: 'Agency',
    price: 99,
    accounts: PLAN_CONFIG.agency.accountLimit,
    syncHz: '2 hours',
    history: 'Unlimited',
    features: [
      'Everything in Pro',
      'Priority sync queue',
      'API access',
      '3 team members',
      'Dedicated support',
    ],
  },
]

export const metadata = { title: 'Pricing — VIRALytics' }

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold">Simple, transparent pricing</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-[var(--radius-card)] border p-6 ${
              plan.popular
                ? 'border-[var(--color-brand)] shadow-lg'
                : 'border-[var(--color-border)] bg-[var(--color-surface)]'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-brand)] px-3 py-0.5 text-xs font-semibold text-white">
                Most popular
              </div>
            )}
            <div className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-subtle)]">
              {plan.name}
            </div>
            <div className="mt-2 text-4xl font-bold">
              ${plan.price}
              <span className="text-base font-normal text-[var(--color-text-muted)]">/mo</span>
            </div>
            <div className="mt-1 text-sm text-[var(--color-text-muted)]">
              Up to {plan.accounts} accounts · sync every {plan.syncHz}
            </div>
            <ul className="mt-5 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 text-[var(--color-accent)]">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className={`mt-6 block rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-colors ${
                plan.popular
                  ? 'bg-[var(--color-brand)] text-white hover:bg-[#6d2fd6]'
                  : 'border border-[var(--color-border-strong)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]'
              }`}
            >
              Start free trial
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="font-semibold">Free plan — always free</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          3 tracked accounts, YouTube + Instagram + TikTok, sync every 24 hours, 30 days history.
          No credit card ever required.{' '}
          <Link href="/signup" className="text-[var(--color-brand)] hover:underline">
            Sign up →
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
        Questions? Paying $250/month for Shortimize?{' '}
        <a href="mailto:hello@viralytics.io" className="text-[var(--color-brand)] hover:underline">
          Email us
        </a>{' '}
        and we&apos;ll help you migrate.
      </p>
    </main>
  )
}
