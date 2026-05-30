'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { PLATFORMS, type Platform } from '@viralytics/core'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PLATFORM_LABELS } from '@/components/platform-icon'

export function AddAccountDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [platform, setPlatform] = useState<Platform | ''>('')
  const [attested, setAttested] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function reset() {
    setInput('')
    setPlatform('')
    setAttested(false)
    setError(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!attested) {
      setError('Please confirm you are authorized to track this account.')
      return
    }
    setLoading(true)
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, platform: platform || undefined, attestation: attested }),
    })
    const body = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(body.error ?? 'Could not add account')
      return
    }
    setOpen(false)
    reset()
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Track account</Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Track an account</h2>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X size={18} className="text-[var(--color-text-muted)]" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
                  Profile URL or @handle
                </label>
                <Input
                  required
                  placeholder="https://instagram.com/cristiano or @cristiano"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
                  Platform (only needed for bare @handles)
                </label>
                <div className="flex gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(platform === p ? '' : p)}
                      className={`rounded-md border px-3 py-1.5 text-xs ${
                        platform === p
                          ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]'
                          : 'border-[var(--color-border-strong)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      {PLATFORM_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2 rounded-md bg-[var(--color-surface-muted)] p-3 text-xs text-[var(--color-text-muted)]">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={attested}
                  onChange={(e) => setAttested(e.target.checked)}
                />
                <span>
                  I confirm I own this account, or it is a public account I am authorized to monitor.
                  I will not use VIRALytics to access non-public data or surveil individuals.
                </span>
              </label>

              {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading || !attested}>
                {loading ? 'Adding…' : 'Start tracking'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
