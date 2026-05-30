'use client'

import { useState } from 'react'
import type { Plan } from '@viralytics/core'
import { Button } from '@/components/ui/button'

const PAID_PLANS: { plan: Exclude<Plan, 'free'>; label: string; price: string }[] = [
  { plan: 'starter', label: 'Starter', price: '$29/mo' },
  { plan: 'pro', label: 'Pro', price: '$49/mo' },
  { plan: 'agency', label: 'Agency', price: '$99/mo' },
]

export function BillingActions({ currentPlan }: { currentPlan: Plan }) {
  const [loading, setLoading] = useState<string | null>(null)

  async function checkout(plan: string) {
    setLoading(plan)
    const res = await fetch('/api/billing/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const body = await res.json()
    if (body.url) window.location.href = body.url
    else setLoading(null)
  }

  async function portal() {
    setLoading('portal')
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const body = await res.json()
    if (body.url) window.location.href = body.url
    else setLoading(null)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {PAID_PLANS.map(({ plan, label, price }) => (
          <Button
            key={plan}
            variant={currentPlan === plan ? 'secondary' : 'primary'}
            disabled={loading !== null || currentPlan === plan}
            onClick={() => checkout(plan)}
          >
            {currentPlan === plan ? `${label} ✓` : `${label} ${price}`}
          </Button>
        ))}
      </div>
      {currentPlan !== 'free' && (
        <Button variant="ghost" size="sm" disabled={loading !== null} onClick={portal}>
          Manage billing &amp; invoices
        </Button>
      )}
    </div>
  )
}
