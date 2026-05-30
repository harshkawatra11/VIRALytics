/**
 * Hand-authored Supabase `Database` type mirroring supabase/migrations.
 * Keep in sync with the SQL (or regenerate via `supabase gen types typescript`).
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Platform = 'youtube' | 'instagram' | 'tiktok'
type Plan = 'free' | 'starter' | 'pro' | 'agency'
type AccountStatus = 'pending' | 'active' | 'error' | 'private' | 'not_found' | 'paused'
type PostType = 'video' | 'image' | 'carousel' | 'reel' | 'short'
type SyncJobType = 'initial' | 'scheduled' | 'backfill' | 'manual'
type SyncJobStatus = 'queued' | 'running' | 'completed' | 'failed'

// --- managers ---------------------------------------------------------------
type ManagerRow = {
  id: string
  full_name: string
  email: string
  plan: Plan
  account_limit: number
  sync_interval_seconds: number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
}
type ManagerInsert = {
  id: string
  full_name: string
  email: string
  plan?: Plan
  account_limit?: number
  sync_interval_seconds?: number
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  created_at?: string
}

// --- tracked_accounts -------------------------------------------------------
type TrackedAccountRow = {
  id: string
  manager_id: string
  platform: Platform
  connection_type: 'public' | 'oauth'
  handle: string
  display_name: string | null
  avatar_url: string | null
  follower_count: number | null
  following_count: number | null
  total_posts: number | null
  avg_views: number
  platform_id: string | null
  status: AccountStatus
  last_synced_at: string | null
  created_at: string
}
type TrackedAccountInsert = {
  id?: string
  manager_id: string
  platform: Platform
  connection_type?: 'public' | 'oauth'
  handle: string
  display_name?: string | null
  avatar_url?: string | null
  follower_count?: number | null
  following_count?: number | null
  total_posts?: number | null
  avg_views?: number
  platform_id?: string | null
  status?: AccountStatus
  last_synced_at?: string | null
  created_at?: string
}

// --- platform_tokens --------------------------------------------------------
type PlatformTokenRow = {
  id: string
  account_id: string
  platform: Platform
  encrypted_access_token: string
  encrypted_refresh_token: string | null
  platform_account_id: string | null
  token_expires_at: string | null
  scopes: string[]
  refresh_failure_count: number
  last_refreshed_at: string | null
  updated_at: string
}
type PlatformTokenInsert = {
  id?: string
  account_id: string
  platform: Platform
  encrypted_access_token: string
  encrypted_refresh_token?: string | null
  platform_account_id?: string | null
  token_expires_at?: string | null
  scopes?: string[]
  refresh_failure_count?: number
  last_refreshed_at?: string | null
  updated_at?: string
}

// --- posts ------------------------------------------------------------------
type PostRow = {
  id: string
  account_id: string
  platform: Platform
  platform_post_id: string
  post_type: PostType | null
  caption: string | null
  hashtags: string[]
  thumbnail_url: string | null
  duration_seconds: number | null
  permalink: string | null
  posted_at: string | null
  viral_score: number
  current_views: number
  current_likes: number
  current_comments: number
  current_shares: number
  current_saves: number | null
  current_engagement_rate: number
  first_seen_at: string
}
type PostInsert = {
  id?: string
  account_id: string
  platform: Platform
  platform_post_id: string
  post_type?: PostType | null
  caption?: string | null
  hashtags?: string[]
  thumbnail_url?: string | null
  duration_seconds?: number | null
  permalink?: string | null
  posted_at?: string | null
  viral_score?: number
  current_views?: number
  current_likes?: number
  current_comments?: number
  current_shares?: number
  current_saves?: number | null
  current_engagement_rate?: number
  first_seen_at?: string
}

// --- post_metrics -----------------------------------------------------------
type PostMetricRow = {
  id: string
  post_id: string
  recorded_at: string
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  impressions: number | null
  reach: number | null
  engagement_rate: number | null
  avg_watch_time_seconds: number | null
  completion_rate: number | null
  click_through_rate: number | null
}
type PostMetricInsert = {
  id?: string
  post_id: string
  recorded_at?: string
  views?: number | null
  likes?: number | null
  comments?: number | null
  shares?: number | null
  saves?: number | null
  impressions?: number | null
  reach?: number | null
  engagement_rate?: number | null
  avg_watch_time_seconds?: number | null
  completion_rate?: number | null
  click_through_rate?: number | null
}

// --- account_snapshots ------------------------------------------------------
type AccountSnapshotRow = {
  id: string
  account_id: string
  recorded_at: string
  follower_count: number | null
  total_views: number | null
}
type AccountSnapshotInsert = {
  id?: string
  account_id: string
  recorded_at?: string
  follower_count?: number | null
  total_views?: number | null
}

// --- collections ------------------------------------------------------------
type CollectionRow = {
  id: string
  manager_id: string
  name: string
  color: string
  created_at: string
}
type CollectionInsert = {
  id?: string
  manager_id: string
  name: string
  color?: string
  created_at?: string
}

// --- collection_accounts ----------------------------------------------------
type CollectionAccountRow = {
  collection_id: string
  account_id: string
  assigned_at: string
}
type CollectionAccountInsert = {
  collection_id: string
  account_id: string
  assigned_at?: string
}

// --- sync_jobs --------------------------------------------------------------
type SyncJobRow = {
  id: string
  account_id: string
  platform: Platform
  job_type: SyncJobType
  status: SyncJobStatus
  posts_found: number
  posts_new: number
  error_message: string | null
  duration_ms: number | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}
type SyncJobInsert = {
  id?: string
  account_id: string
  platform: Platform
  job_type: SyncJobType
  status?: SyncJobStatus
  posts_found?: number
  posts_new?: number
  error_message?: string | null
  duration_ms?: number | null
  started_at?: string | null
  completed_at?: string | null
  created_at?: string
}

interface Table<Row, Insert> {
  Row: Row
  Insert: Insert
  Update: Partial<Insert>
  Relationships: []
}

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: '12'
  }
  public: {
    Tables: {
      managers: Table<ManagerRow, ManagerInsert>
      tracked_accounts: Table<TrackedAccountRow, TrackedAccountInsert>
      platform_tokens: Table<PlatformTokenRow, PlatformTokenInsert>
      posts: Table<PostRow, PostInsert>
      post_metrics: Table<PostMetricRow, PostMetricInsert>
      account_snapshots: Table<AccountSnapshotRow, AccountSnapshotInsert>
      collections: Table<CollectionRow, CollectionInsert>
      collection_accounts: Table<CollectionAccountRow, CollectionAccountInsert>
      sync_jobs: Table<SyncJobRow, SyncJobInsert>
    }
    Functions: {
      refresh_account_aggregates: { Args: { p_account_id: string }; Returns: undefined }
      owns_account: { Args: { p_account_id: string }; Returns: boolean }
      due_accounts: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          manager_id: string
          platform: 'youtube' | 'instagram' | 'tiktok'
          handle: string
          platform_id: string | null
        }[]
      }
      manager_overview: { Args: { p_collection?: string | null }; Returns: Json }
    }
    Views: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
