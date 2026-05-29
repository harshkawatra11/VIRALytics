import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VIRALytics — social analytics for agencies',
  description:
    'Track any creator account by URL, see viral performance instantly, and unlock private watch-time + completion-rate metrics on accounts you own.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
