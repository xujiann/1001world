-- ============================================================
-- 1001 世界 · 匿名埋点 events 表(在 Supabase 控制台 → SQL Editor 跑一次)
-- 隐私:只存聚合进度/时长 + 一个本地随机 cid,无任何 PII;anon 只能写不能读。
-- ============================================================

create table if not exists events (
  id         bigint generated always as identity primary key,
  type       text not null,          -- 'session' | 'ping' | ...
  meta       jsonb,                  -- { cid, ver, comp, streak, seen, titles, main, skel, mob, min ... }
  created_at timestamptz not null default now()
);

alter table events enable row level security;

drop policy if exists "ins" on events;
create policy "ins" on events for insert with check (true);   -- 任何(含匿名)可插入
-- 故意不建 select 策略 → anon 读不到,只有你在后台 / service_role 能查

create index if not exists events_created_idx on events (created_at desc);
create index if not exists events_type_idx    on events (type);

-- ── 跑完后,常用分析查询(在 SQL Editor 里跑)──────────────
-- 日活(去重 cid):
--   select date_trunc('day', created_at) d, count(distinct meta->>'cid') dau
--   from events where type='session' group by 1 order by 1 desc;
-- 次日留存 / 会话时长:看每个 cid 的 session 天数、ping 里最大 min。
-- 进度分布:select round((meta->>'comp')::numeric) c, count(*) from events where type='session' group by 1 order by 1;
