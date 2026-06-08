import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar, type SidebarCollection } from '@/components/sidebar'
import { SyncOnOpen } from '@/components/sync-on-open'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS scopes all of these to the current manager automatically.
  // Each builder is mapped with .then() so Promise.all infers a clean tuple
  // (Supabase's PromiseLike builders otherwise collapse the inferred types).
  const [manager, collections, trackedPosts] = await Promise.all([
    supabase
      .from('managers')
      .select('full_name')
      .eq('id', user.id)
      .single()
      .then((r) => r.data),
    supabase
      .from('collections')
      .select('id, name, color')
      .order('name')
      .then((r) => r.data),
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .then((r) => r.count),
  ])

  return (
    <div className="flex min-h-screen">
      <SyncOnOpen />
      <Sidebar
        collections={(collections ?? []) as SidebarCollection[]}
        trackedPosts={trackedPosts ?? 0}
        managerName={manager?.full_name ?? user.email ?? 'Account'}
      />
      <main className="flex-1 overflow-x-hidden bg-[var(--color-canvas)]">{children}</main>
    </div>
  )
}
