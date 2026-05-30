-- ============================================================================
-- 0009 — manager_overview(): aggregate dashboard stats computed in SQL (scales
-- to tens of thousands of posts without shipping rows to the app). Scoped to the
-- calling manager via auth.uid(); optional collection filter. SECURITY DEFINER,
-- so it must filter by manager explicitly (it bypasses RLS).
-- ============================================================================

create or replace function public.manager_overview(p_collection uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  with scoped as (
    select p.*
      from public.posts p
      join public.tracked_accounts ta on ta.id = p.account_id
     where ta.manager_id = auth.uid()
       and (
         p_collection is null
         or p.account_id in (
           select ca.account_id from public.collection_accounts ca
           where ca.collection_id = p_collection
         )
       )
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
        'engagement', coalesce(sum(current_likes + current_comments + current_shares), 0)
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
      select coalesce(jsonb_agg(jsonb_build_object('month', m, 'views', v) order by m), '[]')
      from (
        select to_char(date_trunc('month', posted_at), 'YYYY-MM') as m,
               sum(current_views) as v
        from scoped
        where posted_at is not null
        group by 1
      ) t
    )
  ) into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

comment on function public.manager_overview is
  'Aggregate dashboard stats for the calling manager (optional collection filter), computed in SQL.';
