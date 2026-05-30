import Link from 'next/link'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-[var(--color-brand)] hover:underline">
        ← VIRALytics
      </Link>
      <article className="prose-legal mt-6">{children}</article>
      <nav className="mt-10 flex gap-4 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-text-muted)]">
        <Link href="/legal/terms" className="hover:underline">
          Terms
        </Link>
        <Link href="/legal/privacy" className="hover:underline">
          Privacy
        </Link>
        <Link href="/legal/dmca" className="hover:underline">
          DMCA &amp; Takedowns
        </Link>
      </nav>
    </div>
  )
}
