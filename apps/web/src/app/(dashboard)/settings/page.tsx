import { PLAN_CONFIG, type Plan } from '@viralytics/core'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/logout-button'
import { BillingActions } from '@/components/billing-actions'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const manager = user
    ? await supabase
        .from('managers')
        .select('full_name, email, plan, account_limit')
        .eq('id', user.id)
        .single()
        .then((r) => r.data)
    : null

  const plan = (manager?.plan ?? 'free') as Plan

  return (
    <div className="px-8 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Settings &amp; Billing</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{manager?.email}</p>
        </div>
        <LogoutButton />
      </header>

      <section className="max-w-md rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="text-sm font-semibold">Current plan</h2>
        <p className="mt-1 text-2xl font-semibold capitalize">{plan}</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Up to {manager?.account_limit ?? PLAN_CONFIG[plan].accountLimit} tracked accounts.
        </p>
        <div className="mt-4">
          <BillingActions currentPlan={plan} />
        </div>
      </section>
    </div>
  )
}
