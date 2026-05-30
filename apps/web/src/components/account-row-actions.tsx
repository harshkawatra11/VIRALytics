'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AccountRowActions({ accountId }: { accountId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState<'refresh' | 'delete' | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function refresh() {
    setBusy('refresh')
    setMsg(null)
    const res = await fetch(`/api/accounts/${accountId}/refresh`, { method: 'POST' })
    const body = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) setMsg(body.error ?? 'Failed')
    else setMsg('Queued')
  }

  async function remove() {
    if (!confirm('Delete this account and all its tracked data?')) return
    setBusy('delete')
    const res = await fetch(`/api/accounts/${accountId}`, { method: 'DELETE' })
    setBusy(null)
    if (res.ok) router.refresh()
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {msg && <span className="mr-1 text-[11px] text-[var(--color-text-subtle)]">{msg}</span>}
      <button
        onClick={refresh}
        disabled={busy !== null}
        title="Refresh now"
        className="rounded p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
      >
        <RefreshCw size={14} className={cn(busy === 'refresh' && 'animate-spin')} />
      </button>
      <button
        onClick={remove}
        disabled={busy !== null}
        title="Delete"
        className="rounded p-1.5 text-[var(--color-text-muted)] hover:bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] hover:text-[var(--color-danger)]"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
