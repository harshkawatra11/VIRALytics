import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCollectionContext } from '@/lib/queries/collection'
import { CollectionTabs } from '@/components/collection-tabs'

export default async function CollectionLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const ctx = await getCollectionContext(supabase, id)

  return (
    <div className="px-8 py-6">
      <div className="mb-1 text-xs text-[var(--color-text-subtle)]">
        <Link href="/dashboard" className="hover:underline">
          Collections
        </Link>{' '}
        / {ctx.name}
      </div>
      <div className="mb-4 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ctx.color }} />
        <h1 className="text-xl font-semibold">{ctx.name}</h1>
      </div>
      <CollectionTabs collectionId={id} counts={ctx.counts} />
      <div className="pt-5">{children}</div>
    </div>
  )
}
