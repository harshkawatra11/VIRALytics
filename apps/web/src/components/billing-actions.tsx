'use client'

import { useState } from 'react'
import type { Plan } from '@viralytics/core'
import { Button } from '@/components/ui/button'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

const PAID_PLANS: { plan: Exclude<Plan, 'free'>; label: string; price: string }[] = [
  { plan: 'starter', label: 'Starter', price: '₹2,499/mo' },
  { plan: 'pro', label: 'Pro', price: '₹4,099/mo' },
  { plan: 'agency', label: 'Agency', price: '₹8,299/mo' },
]

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function BillingActions({ currentPlan }: { currentPlan: Plan }) {
  const [loading, setLoading] = useState<string | null>(null)

  async function checkout(plan: string) {
    setLoading(plan)
    const loaded = await loadRazorpayScript()
    if (!loaded) { setLoading(null); return }

    const res = await fetch('/api/billing/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const body = await res.json()
    if (!body.subscriptionId) { setLoading(null); return }

    const rzp = new window.Razorpay({
      key: body.keyId,
      subscription_id: body.subscriptionId,
      name: 'VIRALytics',
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`,
      prefill: { email: body.email },
      notes: { manager_id: body.managerId, plan: body.plan },
      theme: { color: '#7c3aed' },
      handler: () => {
        window.location.href = '/settings?checkout=success'
      },
    })
    rzp.open()
    setLoading(null)
  }

  async function cancelSubscription() {
    setLoading('cancel')
    await fetch('/api/billing/portal', { method: 'POST' })
    window.location.reload()
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
        <Button variant="ghost" size="sm" disabled={loading !== null} onClick={cancelSubscription}>
          Cancel subscription
        </Button>
      )}
    </div>
  )
}
