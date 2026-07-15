/* ============================================================
   w-net.js — 群岛集市轻后端(Supabase,v3)
   渐进增强:NET_URL/NET_KEY 为空时全部功能静默停用,游戏照常。
   安全:anon key 公开属设计内,边界在数据库 RLS;
        下载的岛屿码一律回到 uisleDec9 白名单校验后才渲染。
   ============================================================ */
export const NET_URL = 'https://bxxfucrzjemnirltfavx.supabase.co';   // Supabase Project URL
export const NET_KEY = 'sb_publishable_Nkiou2WFkw0ODGUQmWumIg_woWn2Ss6';   // anon/publishable key(公开安全,边界在 RLS)

let sb9 = null, uid9 = null;

export const netOn = () => !!(NET_URL && NET_KEY);

async function client9() {
  if (!netOn()) return null;
  if (sb9) return sb9;
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  sb9 = createClient(NET_URL, NET_KEY);
  const { data: s0 } = await sb9.auth.getSession();
  if (!s0 || !s0.session) await sb9.auth.signInAnonymously();
  const { data: u0 } = await sb9.auth.getUser();
  uid9 = u0 && u0.user && u0.user.id;
  return sb9;
}

/* 发布/更新自己的岛(每人一行,upsert by owner_uid) */
export async function netPublish(code, name, owner) {
  const c9 = await client9(); if (!c9) return { ok: false, msg: '集市未开通' };
  const { error } = await c9.from('islands')
    .upsert({ owner_uid: uid9, code, name, owner, updated_at: new Date().toISOString() }, { onConflict: 'owner_uid' });
  return error ? { ok: false, msg: error.message } : { ok: true };
}

/* 集市列表:hot=按赞,new=按更新 */
export async function netList(mode) {
  const c9 = await client9(); if (!c9) return [];
  const q9 = c9.from('islands').select('id,name,owner,likes,visits,code')
    .order(mode === 'hot' ? 'likes' : 'updated_at', { ascending: false }).limit(18);
  const { data, error } = await q9;
  return error ? [] : (data || []);
}

export async function netLike(iid) {
  const c9 = await client9(); if (!c9) return;
  await c9.rpc('like_island', { iid });
}

export async function netReport(iid) {
  const c9 = await client9(); if (!c9) return;
  await c9.rpc('report_island', { iid });
}

/* 到访计数(社交实证):迎接一座岛时 +1 */
export async function netVisit(iid) {
  const c9 = await client9(); if (!c9) return;
  await c9.rpc('visit_island', { iid });
}

/* 匿名埋点(fire-and-forget):直接 REST POST 到 events 表,不加载 supabase SDK(轻);
   keepalive 让离场心跳也能送达。无表/失败一律静默,不阻塞游戏。
   隐私:仅记聚合进度/时长 + 一个本地随机 cid(无任何 PII);anon 无 select 策略,读取只在后台。 */
export function netEvent(type, meta) {
  try {
    if (!NET_URL || !NET_KEY) return;
    fetch(NET_URL + '/rest/v1/events', {
      method: 'POST', keepalive: true,
      headers: { apikey: NET_KEY, Authorization: 'Bearer ' + NET_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ type, meta: meta || {} }),
    }).catch(() => {});
  } catch (e) {}
}

/* ☁️ 云存档:data = 与本地「导出存档码」同格式的文本,每匿名身份一行(见 cloud.sql)。
   安全:RLS 只许本人读写自己那行;跨设备取档走 claim_save RPC(凭绑定码只读复制)。 */
export async function netSaveUp(code, claim) {
  const c9 = await client9(); if (!c9) return { ok: false, msg: '集市未开通' };
  const { error } = await c9.from('saves')
    .upsert({ owner_uid: uid9, data: code, claim, updated_at: new Date().toISOString() }, { onConflict: 'owner_uid' });
  return error ? { ok: false, msg: error.message } : { ok: true };
}
export async function netSaveDown() {
  const c9 = await client9(); if (!c9) return null;
  const { data, error } = await c9.from('saves').select('data,claim,updated_at').eq('owner_uid', uid9).maybeSingle();
  return error ? null : data;
}
export async function netSaveClaim(code) {
  const c9 = await client9(); if (!c9) return null;
  const { data, error } = await c9.rpc('claim_save', { code });
  return error ? null : data;
}
