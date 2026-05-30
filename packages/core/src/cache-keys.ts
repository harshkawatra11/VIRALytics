/** Redis cache key builders — shared by the web (reads) and worker (invalidation). */
export const cacheKeys = {
  accountOverview: (accountId: string) => `overview:${accountId}`,
  accountPosts: (accountId: string) => `posts:${accountId}`,
  managerAccounts: (managerId: string) => `accounts:${managerId}`,
  managerCollections: (managerId: string) => `collections:${managerId}`,
  collectionPosts: (collectionId: string) => `collection:${collectionId}:posts`,
} as const

/** Default TTLs in seconds. */
export const cacheTtl = {
  overview: 3600,
  posts: 1800,
  accounts: 1800,
  collections: 3600,
  collectionPosts: 900,
} as const
