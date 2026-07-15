-- ============================================================
-- 1001 世界 · ☁️ 云存档(v1)建表脚本
-- 用法:Supabase 控制台 → SQL Editor → 粘贴全部 → Run
-- 模型:每个匿名身份一行;data = 与本地「导出存档码」同格式的文本;
--      绑定码 claim 经 security-definer RPC 跨设备取档(只读复制)。
-- ============================================================

create table if not exists saves (
  owner_uid  uuid primary key,
  data       text not null check (char_length(data) <= 200000),
  claim      text unique check (char_length(claim) <= 24),
  updated_at timestamptz not null default now()
);

alter table saves enable row level security;

drop policy if exists "saves_sel" on saves;
drop policy if exists "saves_ins" on saves;
drop policy if exists "saves_upd" on saves;

create policy "saves_sel" on saves for select using (owner_uid = auth.uid());
create policy "saves_ins" on saves for insert with check (owner_uid = auth.uid());
create policy "saves_upd" on saves for update using (owner_uid = auth.uid());

-- 绑定码认领:任何登录者可凭码取档(只返回 data 文本,不改归属)
create or replace function claim_save(code text) returns text
language sql security definer as
$$ select data from saves where claim = code and char_length(code) >= 6; $$;

grant execute on function claim_save(text) to authenticated;
