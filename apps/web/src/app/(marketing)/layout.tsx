import Link from 'next/link'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand)] text-sm font-bold text-white">
            V
          </div>
          <span className="font-semibold">VIRALytics</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/pricing" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            Pricing
          </Link>
          <Link href="/login" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-[var(--color-brand)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#6d2fd6]"
          >
            Get started
          </Link>
        </nav>
      </header>
      {children}
      <footer className="border-t border-[var(--color-border)] px-6 py-6 text-center text-xs text-[var(--color-text-subtle)]">
        <div className="flex justify-center gap-4 mb-2">
          <Link href="/legal/terms" className="hover:underline">Terms</Link>
          <Link href="/legal/privacy" className="hover:underline">Privacy</Link>
          <Link href="/legal/dmca" className="hover:underline">DMCA</Link>
        </div>
        © {new Date().getFullYear()} VIRALytics. All data from official platform APIs or public sources.
      </footer>
    </div>
  )
}
