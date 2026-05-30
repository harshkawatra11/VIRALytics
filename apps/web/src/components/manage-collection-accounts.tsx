'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PLATFORM_LABELS } from '@/components/platform-icon'

interface AccountOption {
  id: string
  handle: string
  display_name: string | null
  platform: 'youtube' | 'instagram' | 'tiktok'
}

export function ManageCollectionAccounts({
  collectionId,
  memberIds,
  allAccounts,
}: {
  collectionId: string
  memberIds: string[]
  allAccounts: AccountOption[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set(memberIds))
  const [saving, setSaving] = useState(false)

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function save() {
    setSaving(true)
    const member = new Set(memberIds)
    const toAdd = [...selected].filter((id) => !member.has(id))
    const toRemove = [...member].filter((id) => !selected.has(id))

    if (toAdd.length) {
      await fetch(`/api/collections/${collectionId}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountIds: toAdd }),
      })
    }
    await Promise.all(
      toRemove.map((id) =>
        fetch(`/api/collections/${collectionId}/accounts/${id}`, { method: 'DELETE' })
      )
    )
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Manage accounts
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Accounts in this collection</h2>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X size={18} className="text-[var(--color-text-muted)]" />
              </button>
            </div>

            <div className="max-h-72 space-y-1 overflow-y-auto">
              {allAccounts.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">
                  No accounts yet — add some from All Accounts first.
                </p>
              ) : (
                allAccounts.map((a) => (
                  <label
                    key={a.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--color-surface-muted)]"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => toggle(a.id)}
                    />
                    <span className="text-sm">{a.display_name ?? a.handle}</span>
                    <span className="ml-auto text-[10px] text-[var(--color-text-subtle)]">
                      {PLATFORM_LABELS[a.platform]}
                    </span>
                  </label>
                ))
              )}
            </div>

            <Button className="mt-4 w-full" disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
