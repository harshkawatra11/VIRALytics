-- ============================================================================
-- 0014 — account_overview(p_account_id uuid)
-- Per-account analytics dashboard, same shape as manager_overview() so the
-- frontend can reuse the same Zod schema and dashboard components.
-- Security: verifies the account belongs to the calling manager (auth.uid()).
-- ============================================================================

create or replace function public.account_overview(p_account_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  -- Verify ownership: if the account doesn't belong to this manager, return empty.
  if not exists (
    select 1 from public.tracked_accounts
     where id = p_account_id and manager_id = auth.uid()
  ) then
    return '{}'::jsonb;
  end if;

  with scoped as (
    select p.*
      from public.posts p
     where p.account_id = p_account_id
  ),
  acct as (
    select * from public.tracked_accounts where id = p_account_id
  )
  select jsonb_build_object(
    'totals', (
      select jsonb_build_object(
        'videos', count(*),
        'views', coalesce(sum(current_views), 0),
        'likes', coalesce(sum(current_likes), 0),
        'comments', coalesce(sum(current_comments), 0),
        'shares', coalesce(sum(current_shares), 0),
        'saves', coalesce(sum(current_saves), 0),
        'engagement', coalesce(sum(current_likes + current_comments + current_shares), 0),
        'avg_engagement_rate', coalesce(round(avg(current_engagement_rate), 2), 0),
        'accounts', 1,
        'followers', (select coalesce(follower_count, 0) from acct)
      ) from scoped
    ),
    'viral_split', (
      select jsonb_build_object(
        'hot', count(*) filter (where viral_score >= 2),
        'normal', count(*) filter (where viral_score >= 0.5 and viral_score < 2),
        'cold', count(*) filter (where viral_score < 0.5)
      ) from scoped
    ),
    'virality', (
      select coalesce(jsonb_agg(jsonb_build_object('bucket', bucket, 'count', c) order by ord), '[]')
      from (
        select b.bucket, b.ord, count(s.*) as c
        from (values
          ('<0.5', 1), ('0.5–1x', 2), ('1–2x', 3), ('2–5x', 4), ('5–10x', 5), ('10x+', 6)
        ) as b(bucket, ord)
        left join scoped s on b.bucket = case
          when s.viral_score < 0.5 then '<0.5'
          when s.viral_score < 1 then '0.5–1x'
          when s.viral_score < 2 then '1–2x'
          when s.viral_score < 5 then '2–5x'
          when s.viral_score < 10 then '5–10x'
          else '10x+'
        end
        group by b.bucket, b.ord
      ) q
    ),
    'platforms', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'platform', platform, 'videos', c, 'views', v) order by v desc), '[]')
      from (
        select platform, count(*) as c, coalesce(sum(current_views), 0) as v
        from scoped group by platform
      ) q
    ),
    'post_types', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'type', t, 'count', c, 'avg_views', av) order by c desc), '[]')
      from (
        select coalesce(post_type, 'other') as t, count(*) as c,
               coalesce(round(avg(current_views)), 0) as av
        from scoped group by coalesce(post_type, 'other')
      ) q
    ),
    'duration', (
      select coalesce(jsonb_agg(jsonb_build_object('bucket', bucket, 'avg_views', round(avg_v)) order by ord), '[]')
      from (
        select b.bucket, b.ord, coalesce(avg(s.current_views), 0) as avg_v
        from (values
          ('0–15s', 1), ('15–30s', 2), ('30–60s', 3), ('1–3m', 4), ('3m+', 5)
        ) as b(bucket, ord)
        left join scoped s on b.bucket = case
          when s.duration_seconds is null then null
          when s.duration_seconds <= 15 then '0–15s'
          when s.duration_seconds <= 30 then '15–30s'
          when s.duration_seconds <= 60 then '30–60s'
          when s.duration_seconds <= 180 then '1–3m'
          else '3m+'
        end
        group by b.bucket, b.ord
      ) q
    ),
    'timeseries', (
      select coalesce(jsonb_agg(jsonb_build_object('month', m, 'views', v, 'engagement', e) order by m), '[]')
      from (
        select to_char(date_trunc('month', posted_at), 'YYYY-MM') as m,
               sum(current_views) as v,
               sum(current_likes + current_comments + current_shares) as e
        from scoped
        where posted_at is not null
        group by 1
      ) t
    ),
    'top_posts', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', id, 'caption', caption, 'thumbnail_url', thumbnail_url,
        'permalink', permalink, 'platform', platform,
        'views', current_views, 'viral_score', viral_score) order by viral_score desc), '[]')
      from (
        select * from scoped order by viral_score desc limit 6
      ) q
    ),
    'top_hashtags', (
      select coalesce(jsonb_agg(jsonb_build_object('tag', tag, 'count', c) order by c desc), '[]')
      from (
        select lower(tag) as tag, count(*) as c
        from scoped, unnest(hashtags) as tag
        group by lower(tag)
        order by c desc
        limit 10
      ) q
    ),
    'activity', (
      select coalesce(jsonb_agg(jsonb_build_object('month', m, 'count', c) order by m), '[]')
      from (
        select to_char(date_trunc('month', posted_at), 'YYYY-MM') as m, count(*) as c
        from scoped
        where posted_at is not null
          and posted_at >= date_trunc('month', now()) - interval '11 months'
        group by 1
      ) t
    )
  ) into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

comment on function public.account_overview is
  'Per-account analytics dashboard stats, same shape as manager_overview(). Security-definer; verifies account belongs to auth.uid().';
