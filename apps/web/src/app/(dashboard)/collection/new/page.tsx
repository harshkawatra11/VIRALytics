'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const COLORS = ['#7C3AED', '#2F6DF6', '#00B37E', '#E5484D', '#D98B00', '#E1306C']

export default function NewCollectionPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    })
    const body = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(body.error ?? 'Could not create collection')
      return
    }
    router.push(`/collection/${body.collection.id}`)
    router.refresh()
  }

  return (
    <div className="px-8 py-6">
      <h1 className="mb-4 text-xl font-semibold">New collection</h1>
      <form onSubmit={submit} className="max-w-sm space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">Name</label>
          <Input
            required
            placeholder="e.g. Flo, Deal Brand, Viral Labs"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">Color</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-7 w-7 rounded-full ring-offset-2"
                style={{
                  backgroundColor: c,
                  outline: color === c ? `2px solid ${c}` : 'none',
                  outlineOffset: 2,
                }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create collection'}
        </Button>
      </form>
    </div>
  )
}
