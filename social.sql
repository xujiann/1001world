-- ============================================================
-- social.sql — 🏆 每日排行榜 + 🍾 漂流瓶(轻社交)
-- 在 Supabase SQL Editor 整段粘贴运行一次即可。
-- 安全边界:匿名可写但字段全部强约束;漂流瓶只存「预设句编号」,
--           不收任何自由文本 → 零内容审核风险、零 PII。
-- ============================================================

-- 🏆 排行榜:每日 × 项目(quiz 鉴赏 / sail 帆船 / bike 骑行 / swim 横渡)
create table if not exists public.lb (
  id bigint generated always as identity primary key,
  day date not null default (now() at time zone 'utc')::date,
  kind text not null check (kind in ('quiz', 'sail', 'bike', 'swim')),
  cid text not null check (char_length(cid) between 4 and 24),
  alias text not null default '无名旅人' check (char_length(alias) <= 30),
  score int not null check (score between 0 and 100000),
  created_at timestamptz not null default now()
);
create index if not exists lb_day_kind on public.lb (day, kind);
alter table public.lb enable row level security;
drop policy if exists lb_ins on public.lb;
create policy lb_ins on public.lb for insert to anon, authenticated with check (true);
drop policy if exists lb_sel on public.lb;
create policy lb_sel on public.lb for select to anon, authenticated using (day >= (now() at time zone 'utc')::date - 7);

-- 🍾 漂流瓶:岛名 + 预设句编号 + 署名(佩戴称号)
create table if not exists public.bottles (
  id bigint generated always as identity primary key,
  isle text not null check (char_length(isle) <= 30),
  phrase int not null check (phrase >= 0 and phrase < 60),
  alias text not null default '无名旅人' check (char_length(alias) <= 30),
  cid text not null default '' check (char_length(cid) <= 24),
  created_at timestamptz not null default now()
);
create index if not exists bottles_isle on public.bottles (isle, created_at desc);
alter table public.bottles enable row level security;
drop policy if exists bt_ins on public.bottles;
create policy bt_ins on public.bottles for insert to anon, authenticated with check (true);
drop policy if exists bt_sel on public.bottles;
create policy bt_sel on public.bottles for select to anon, authenticated using (true);

-- 🧹 顺手保洁:遥测 ping 只留 30 天(建议每月手动跑一次这句)
delete from public.events where type = 'ping' and created_at < now() - interval '30 days';
