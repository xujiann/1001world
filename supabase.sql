-- ============================================================
-- 1001 世界 · 群岛集市(v3 轻后端)建表脚本
-- 用法:Supabase 控制台 → SQL Editor → 粘贴全部 → Run
-- ============================================================

create table if not exists islands (
  id         uuid primary key default gen_random_uuid(),
  owner_uid  uuid not null,
  name       text not null check (char_length(name) <= 16),
  owner      text not null check (char_length(owner) <= 12),
  code       text not null check (char_length(code) <= 4096),
  likes      int  not null default 0,
  reported   int  not null default 0,
  updated_at timestamptz not null default now(),
  unique (owner_uid)                       -- 每人一岛,天然防灌水
);

alter table islands enable row level security;

drop policy if exists "read"   on islands;
drop policy if exists "insert" on islands;
drop policy if exists "update" on islands;

create policy "read"   on islands for select using (reported < 5);
create policy "insert" on islands for insert with check (owner_uid = auth.uid());
create policy "update" on islands for update using (owner_uid = auth.uid());

-- 点赞 / 举报:任何登录者可调用的原子自增(绕过 update 策略,只动计数列)
create or replace function like_island(iid uuid) returns void
language sql security definer as
$$ update islands set likes = likes + 1 where id = iid; $$;

create or replace function report_island(iid uuid) returns void
language sql security definer as
$$ update islands set reported = reported + 1 where id = iid; $$;

-- 允许匿名登录用户执行
grant execute on function like_island(uuid) to authenticated;
grant execute on function report_island(uuid) to authenticated;
