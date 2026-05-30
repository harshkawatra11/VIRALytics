'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    setSent(true)
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Reset your password</h1>
      {sent ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          If that email exists, a reset link is on its way.
        </p>
      ) : (
        <>
          <p className="mb-5 text-sm text-[var(--color-text-muted)]">
            Enter your email and we&apos;ll send a reset link.
          </p>
          <form onSubmit={onSubmit} className="space-y-3">
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        </>
      )}
      <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
        <Link href="/login" className="text-[var(--color-brand)] hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  )
}
