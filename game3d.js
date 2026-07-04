/* ============================================================
   1001 世界 3D · Isle of 1001 — 荒野之息风低多边形海岛
   Three.js 三维开放世界:雪山 · 平原 · 大海 · 九大收藏区域
   与 2D 版共用 world-data.js 与 localStorage 进度。
   ============================================================ */
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { Water } from 'three/addons/objects/Water.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const D = window.WORLD_DATA;
const CDN = {
  art: 'https://cdn.jsdelivr.net/gh/xujiann/1001art-img@v1/',
  plants: 'https://cdn.jsdelivr.net/gh/xujiann/1001plants-img@v1/',
};
const commonsImg = f => 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(f) + '?width=440';

/* ---------- 收藏类别(与 2D 一致) ---------- */
const CATS = {
  art:       { icon: '🖼️', name: '一〇〇一美术馆', en: 'Art Museum',       color: '#8e5bd6', link: 'https://xujiann.github.io/1001art/',       tot: D.totals.art,       unit: '件真迹' },
  books:     { icon: '📚', name: '千夜图书馆',     en: 'Grand Library',    color: '#b5651d', link: 'https://xujiann.github.io/',               tot: D.totals.books,     unit: '本经典' },
  birds:     { icon: '🐦', name: '百鸟林',         en: 'Bird Forest',      color: '#2e86ab', link: 'https://xujiann.github.io/',               tot: 1001,               unit: '种飞鸟' },
  plants:    { icon: '🌿', name: '奇花植物园',     en: 'Botanical Garden', color: '#27ae60', link: 'https://xujiann.github.io/1001plants/',    tot: D.totals.plants,    unit: '种植物' },
  beers:     { icon: '🍺', name: '等待戈多酒馆',   en: 'Waiting for Godot', color: '#d35400', link: 'https://xujiann.github.io/1001craft/',    tot: 1001,               unit: '款精酿' },
  fish:      { icon: '🐠', name: '深蓝水族馆',     en: 'Aquarium',         color: '#16a085', link: 'https://xujiann.github.io/',               tot: D.totals.fish,      unit: '种鱼' },
  jazz:      { icon: '🎷', name: '蓝调爵士俱乐部', en: 'Jazz Club',        color: '#c0392b', link: 'https://xujiann.github.io/1001jazz/',      tot: D.totals.jazz,      unit: '张专辑' },
  classical: { icon: '🎻', name: '黄金音乐厅',     en: 'Concert Hall',     color: '#c8912a', link: 'https://xujiann.github.io/1001classical/', tot: D.totals.classical, unit: '份录音' },
  outdoor:   { icon: '⛰️', name: '雪峰营地',       en: 'Basecamp',         color: '#2c7a4b', link: 'https://xujiann.github.io/',               tot: 1001,               unit: '种户外' },
};
const BEER_COLOR = { lager:'#f5c542', pale:'#e8a33c', ipa:'#e07b28', wheat:'#ecd48a', belgian:'#c87f2f', stout:'#33200f', sour:'#d94f6b', amber:'#a8542c', strong:'#7a3b1e', specialty:'#8c6d3f' };
const FISH_COLOR = { reef:'#ff7f50', fresh:'#58c470', pelagic:'#4a90d9', deep:'#5b4a8a', temperate:'#7f8fa6', special:'#d4a017', rare:'#d94f6b', more:'#6aa8a0' };
const SPORT_ICON = { hike:'🥾', climb:'🧗', water:'🛶', surf:'🏄', dive:'🤿', snow:'⛷️', air:'🪂', wheel:'🚵', multi:'🏅', camp:'🏕️' };
const PALETTE = ['#c0392b','#2980b9','#27ae60','#8e44ad','#d35400','#16a085','#f39c12','#7f8c8d','#c2185b','#5d4037'];
const hashCol = s => PALETTE[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffled(arr, rnd) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* ---------- 岛屿区域布局 ---------- */
const ZONES3D = [
  { key: 'plaza',     x: 0,    z: 0,    r: 70, h: 6 },
  { key: 'art',       x: -190, z: -150, r: 62, h: 14 },
  { key: 'books',     x: 60,   z: -230, r: 55, h: 12 },
  { key: 'birds',     x: 230,  z: -150, r: 90, h: 10 },
  { key: 'plants',    x: -260, z: 40,   r: 70, h: 9 },
  { key: 'beers',     x: 240,  z: 70,   r: 55, h: 8 },
  { key: 'fish',      x: 0,    z: 330,  r: 70, h: 1.4 },
  { key: 'jazz',      x: -170, z: 230,  r: 52, h: 9 },
  { key: 'classical', x: 160,  z: 240,  r: 52, h: 10 },
  { key: 'outdoor',   x: 285,  z: -255, r: 62, h: 30 },
];
const TRAVEL3D = {
  plaza: [0, 14], art: [-190, -108], books: [60, -192], birds: [230, -95], plants: [-260, 88],
  beers: [240, 108], fish: [0, 300], jazz: [-170, 265], classical: [160, 275], outdoor: [285, -215],
};

/* ---------- 地形 ---------- */
function hash2(x, z) { const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return n - Math.floor(n); }
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const a = hash2(xi, zi), b = hash2(xi + 1, zi), c = hash2(xi, zi + 1), d2 = hash2(xi + 1, zi + 1);
  const sx = xf * xf * (3 - 2 * xf), sz = zf * zf * (3 - 2 * zf);
  return a + (b - a) * sx + (c - a) * sz * (1 - sx) + (d2 - b) * sx * sz;
}
const fbm = (x, z) => vnoise(x, z) * .55 + vnoise(x * 2.17, z * 2.17) * .28 + vnoise(x * 4.9, z * 4.9) * .17;
const smooth01 = t => t * t * (3 - 2 * t);
/* 主岛 = 一头俯瞰的鲸:头在西,尾鳍甩向东,雪山是背鳍,西南伸出胸鳍 */
const IS2 = { x: -720, z: -420, r: 150 };   // 灯塔屿
function capMask(x, z, ax, az, bx, bz, r0, r1) {
  const abx = bx - ax, abz = bz - az;
  const t = clamp(((x - ax) * abx + (z - az) * abz) / (abx * abx + abz * abz), 0, 1);
  const d = Math.hypot(x - (ax + abx * t), z - (az + abz * t));
  return (1 - d / (r0 + (r1 - r0) * t)) * 2.2;
}
function islandMask(x, z) {
  let m = (1 - Math.sqrt(((x + 120) / 380) ** 2 + ((z + 20) / 400) ** 2)) * 2.2;          // 鲸头与前身
  m = Math.max(m, (1 - Math.sqrt(((x - 190) / 280) ** 2 + ((z + 60) / 250) ** 2)) * 2.2); // 后身
  m = Math.max(m, capMask(x, z, -80, 150, 170, 255, 175, 150));   // 腹部(南)
  m = Math.max(m, capMask(x, z, 430, -70, 640, -15, 75, 42));     // 尾柄
  m = Math.max(m, capMask(x, z, 640, -15, 765, -140, 45, 16));    // 尾鳍北叶
  m = Math.max(m, capMask(x, z, 640, -15, 765, 105, 45, 16));     // 尾鳍南叶
  m = Math.max(m, capMask(x, z, 260, -200, 345, -310, 90, 60));   // 背鳍雪山连脊
  m = Math.max(m, capMask(x, z, -80, 330, -190, 455, 55, 22));    // 胸鳍
  m = Math.max(m, capMask(x, z, -390, -95, -390, 55, 92, 92));    // 钝圆的鲸头吻部
  m = Math.max(m, (1 - Math.hypot(x - IS2.x, z - IS2.z) / IS2.r) * 1.7);  // 灯塔屿
  return m;
}
/* 鲸的五官(用于地形与配色) */
const WHALE_EYE = { x: -352, z: 118, r: 20 };      // 眼(圆湖)
const WHALE_BLOW = { x: -300, z: -78, r: 9 };      // 喷水孔(小潭)
function mouthDist(x, z) {                          // 嘴线(头部南缘的弧)
  const seg = (ax, az, bx, bz) => {
    const abx = bx - ax, abz = bz - az;
    const t = clamp(((x - ax) * abx + (z - az) * abz) / (abx * abx + abz * abz), 0, 1);
    return Math.hypot(x - (ax + abx * t), z - (az + abz * t));
  };
  return Math.min(seg(-462, 20, -400, 105), seg(-400, 105, -305, 152));
}
function height(x, z) {
  const fall = smooth01(clamp(islandMask(x, z), 0, 1));
  let h = -9 + fall * (13 + fbm(x * .008, z * .008) * 14);
  const md = Math.hypot(x - 340, z + 320);            // 东北雪山(背鳍)
  h += smooth01(clamp(1 - md / 200, 0, 1)) ** 2 * 55;
  for (const zn of ZONES3D) {                          // 区域整平
    const zd = Math.hypot(x - zn.x, z - zn.z);
    const w = smooth01(clamp(1 - zd / (zn.r * 1.25), 0, 1));
    h = h * (1 - w * .95) + zn.h * w * .95;
  }
  const ld = Math.hypot(x - IS2.x, z - IS2.z);         // 灯塔基座整平
  const lw = smooth01(clamp(1 - ld / 45, 0, 1));
  h = h * (1 - lw * .9) + 8 * lw * .9;
  // 鲸眼(圆湖)与喷水孔(小潭):向下压出水面
  const ed = Math.hypot(x - WHALE_EYE.x, z - WHALE_EYE.z);
  h -= smooth01(clamp(1 - ed / WHALE_EYE.r, 0, 1)) * 9;
  const bd2 = Math.hypot(x - WHALE_BLOW.x, z - WHALE_BLOW.z);
  h -= smooth01(clamp(1 - bd2 / WHALE_BLOW.r, 0, 1)) * 11;
  return h;
}

/* ================= UI(与 2D 版共用逻辑与存档) ================= */
const $ = id => document.getElementById(id);
const modal = $('modal'), cardBody = $('cardBody'), hintEl = $('hint'), toastEl = $('toast');
let toastTimer = 0;
function toast(msg) {
  toastEl.textContent = msg; toastEl.classList.remove('hidden');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2200);
}
let seen = {};
try { seen = JSON.parse(localStorage.getItem('w1001.seen.v1') || '{}'); } catch (e) { seen = {}; }
for (const k in CATS) if (!Array.isArray(seen[k])) seen[k] = [];
const seenCount = () => Object.values(seen).reduce((a, v) => a + v.length, 0);
$('seenCount').textContent = seenCount();

/* --- 今日委托(共用存档) --- */
const QUEST_TPL = {
  art: [3, '在美术馆欣赏 3 幅名画'], birds: [3, '在百鸟林认识 3 种鸟'], plants: [3, '在植物园看 3 株植物'],
  beers: [2, '在酒馆品尝 2 款新精酿'], fish: [3, '在水族馆认识 3 种鱼'], jazz: [2, '在爵士俱乐部听 2 张唱片'],
  classical: [2, '在音乐厅听 2 份录音'], books: [2, '在图书馆翻 2 本书'], outdoor: [2, '在营地了解 2 种玩法'],
};
let quest = null, stars = parseInt(localStorage.getItem('w1001.stars') || '0', 10) || 0;
function saveQuest() { try { localStorage.setItem('w1001.quest', JSON.stringify(quest)); localStorage.setItem('w1001.stars', String(stars)); } catch (e) {} }
function initQuest() {
  const today = new Date().toISOString().slice(0, 10);
  try { quest = JSON.parse(localStorage.getItem('w1001.quest')); } catch (e) { quest = null; }
  if (!quest || quest.date !== today) {
    const r = mulberry32([...today].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7));
    const picks = shuffled(Object.keys(QUEST_TPL), r).slice(0, 3);
    quest = { date: today, cats: picks, prog: Object.fromEntries(picks.map(c => [c, 0])), done: false };
    saveQuest();
  }
  updateQuestHUD();
}
function questBump(cat) {
  if (!quest || quest.done || !(cat in quest.prog)) return;
  if (quest.prog[cat] >= QUEST_TPL[cat][0]) return;
  quest.prog[cat]++;
  if (quest.cats.every(c => quest.prog[c] >= QUEST_TPL[c][0])) {
    quest.done = true; stars++; earnSB(50);
    setTimeout(() => { toast(`🎉 今日委托完成!星星 ×${stars} · ⚡+50`); blip(660); setTimeout(() => blip(990), 120); }, 350);
  }
  saveQuest(); updateQuestHUD();
}
function updateQuestHUD() {
  if (!quest) return;
  const cur = quest.cats.reduce((a, c) => a + Math.min(quest.prog[c], QUEST_TPL[c][0]), 0);
  const tot = quest.cats.reduce((a, c) => a + QUEST_TPL[c][0], 0);
  $('hudQuest').textContent = quest.done ? `📜 委托完成 · ⭐×${stars}` : `📜 今日委托 ${cur}/${tot}`;
  $('hudQuest').classList.toggle('done', quest.done);
}
initQuest();
/* --- 算力币(SB)钱包 --- */
let sb = parseInt(localStorage.getItem('w1001.sb') ?? 'x', 10);
if (!Number.isFinite(sb)) sb = 101;   // 新玩家启动资金
let drinks = parseInt(localStorage.getItem('w1001.drinks') || '0', 10) || 0;
function saveSB() { try { localStorage.setItem('w1001.sb', String(sb)); localStorage.setItem('w1001.drinks', String(drinks)); } catch (e) {} }
function updateSB() { const el = $('sbCount'); if (el) el.textContent = sb; }
function earnSB(n) { sb += n; saveSB(); updateSB(); }
function spendSB(n) {
  if (sb < n) { toast(`⚡ 算力不足:需要 ${n} SB,还差 ${n - sb}——去看看藏品赚点算力吧`); blip(220); return false; }
  sb -= n; saveSB(); updateSB(); return true;
}
updateSB();

/* --- 装备系统(每件自带品牌冠名位,便于日后接广告) --- */
const GEAR = [
  { id: 'swim',    icon: '🩱', name: '鲸泳衣',     en: 'Swimsuit',     slot: '身体', price: 20, desc: '专为鲸背海域设计,贴合流线。', effect: '解锁畅游:游泳恢复全速,不再受寒', brand: null },
  { id: 'goggles', icon: '🥽', name: '深蓝泳镜',   en: 'Goggles',      slot: '眼部', price: 15, desc: '看清深蓝之下的一切。',       effect: '海中的星之碎片升起光柱指引', brand: null },
  { id: 'boots',   icon: '🥾', name: '雪峰登山靴', en: 'Hiking Boots', slot: '脚部', price: 25, desc: '背鳍雪山特供防滑大底。',     effect: '奔跑 +18%,跳跃更高', brand: null },
  { id: 'rod',     icon: '🎣', name: '专业鱼竿',   en: 'Pro Rod',      slot: '手部', price: 30, desc: '等戈多,不如等鱼。',         effect: '咬钩窗口更长,渔获价格 +2 SB', brand: null },
];
let gear = { owned: [], on: [] };
try { const g0 = JSON.parse(localStorage.getItem('w1001.gear') || 'null'); if (g0 && Array.isArray(g0.owned) && Array.isArray(g0.on)) gear = g0; } catch (e) {}
function saveGear() { try { localStorage.setItem('w1001.gear', JSON.stringify(gear)); } catch (e) {} }
const gearOn = id => gear.on.includes(id);
function gearRows(mode) {
  return GEAR.map(g => {
    const owned = gear.owned.includes(g.id), on = gearOn(g.id);
    const brand = g.brand
      ? `<span class="gBrand">🤝 由 ${esc(g.brand)} 冠名</span>`
      : `<span class="gBrand vac">广告位招商中 · 详询墨丘利</span>`;
    let btn;
    if (!owned) btn = mode === 'shop'
      ? `<button class="gBtn" data-gbuy="${g.id}">买 ${g.price} SB</button>`
      : `<button class="gBtn" disabled>装备行有售 · ${g.price} SB</button>`;
    else btn = `<button class="gBtn${on ? '' : ' off'}" data-gtog="${g.id}">${on ? '已装备 ✓' : '装备'}</button>`;
    return `<div class="gRow"><div class="gi">${g.icon}</div>
      <div class="gInfo"><b>${esc(g.name)}</b> <span style="color:#8a7c62;font-size:12px">${g.en} · ${g.slot}</span>
      <div class="gEff">▲ ${esc(g.effect)}</div><div class="gDesc">${esc(g.desc)}</div>${brand}</div>${btn}</div>`;
  }).join('');
}
function shopCard() {
  return `<div class="cardHead" style="background:#2c7a4b">🧰 千岛装备行 · Gear Shop</div>
    <div class="cardTitle"><h3>老装备的铺子</h3><div class="en">"要下海?先穿上泳衣。" · 余额 ⚡${sb}</div></div>
    <div style="padding:4px 20px 18px">${gearRows('shop')}</div>`;
}
function bindGear(rerender) {
  cardBody.querySelectorAll('[data-gbuy]').forEach(b => b.addEventListener('click', () => {
    const g = GEAR.find(x => x.id === b.dataset.gbuy);
    if (!g || !spendSB(g.price)) return;
    gear.owned.push(g.id); gear.on.push(g.id); saveGear();
    toast(`🧰 入手「${g.name}」,已自动装备 · ⚡-${g.price}`); blip(740);
    rerender();
  }));
  cardBody.querySelectorAll('[data-gtog]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.gtog;
    if (gearOn(id)) gear.on = gear.on.filter(x => x !== id); else gear.on.push(id);
    saveGear(); rerender();
  }));
}
function openBag() {
  cardBody.innerHTML = `<div class="cardHead" style="background:#5a4a7a">🎒 背包 · Inventory</div>
    <div class="cardTitle"><h3>随身装备</h3><div class="en">⚡ ${sb} SB · 点按钮切换装备</div></div>
    <div style="padding:4px 20px 18px">${gearRows('bag')}</div>`;
  modal.classList.remove('hidden'); modalOpen = true;
  bindGear(openBag);
}

function markSeen(cat, id, title) {
  if (!CATS[cat]) return;
  if (!seen[cat].includes(id)) {
    seen[cat].push(id);
    try { localStorage.setItem('w1001.seen.v1', JSON.stringify(seen)); } catch (e) {}
    $('seenCount').textContent = seenCount();
    earnSB(2);
    toast(`✦ 收录图鉴:${title} · ⚡+2`);
    blip(660); setTimeout(() => blip(880), 90);
    questBump(cat);
  }
}

/* --- 卡片(与 2D 相同) --- */
function metaRows(rows) {
  return '<div class="cardMeta">' + rows.filter(r => r[1]).map(([k, v]) => `<span class="k">${k}</span><span>${esc(v)}</span>`).join('') + '</div>';
}
function cardHTML(cat, inner) {
  const cfg = CATS[cat];
  return `<div class="cardHead" style="background:${cfg.color}">${cfg.icon} ${cfg.name} · ${cfg.en}</div>${inner}
  <div class="cardFoot"><span class="collected">✓ 已收录 ${seen[cat].length} / ${D[cat].length}(全馆 ${cfg.tot} ${cfg.unit})</span>
  <a href="${cfg.link}" target="_blank" rel="noopener">去 1001 网站 →</a></div>`;
}
/* --- 万神殿日报 --- */
const todayStr = () => new Date().toISOString().slice(0, 10);
const paperBought = () => { try { return localStorage.getItem('w1001.paper') === todayStr(); } catch (e) { return false; } };
function paperHTML() {
  const ds = todayStr();
  const r = mulberry32([...ds].reduce((a, c) => (a * 33 + c.charCodeAt(0)) | 0, 5));
  const pick = arr => arr[Math.floor(r() * arr.length)];
  const art = pick(D.art), beer = pick(D.beers), bird = pick(D.birds), book = pick(D.books),
        alb = pick(D.jazz), plant = pick(D.plants), sport = pick(D.outdoor);
  const issue = Math.floor((Date.now() - new Date('2026-01-01').getTime()) / 86400000);
  const shardLeft = 24 - shardsGot.length;
  return `<div class="paper">
    <div class="pMast">万神殿日报</div>
    <div class="pSub">THE PANTHEON DAILY · ${ds} · 第 ${issue} 期 · 收藏之岛唯一日报 · 售价 2 SB</div>
    <div class="pHead">《${esc(art.title)}》真迹今日在一〇〇一美术馆展出</div>
    <div class="pBody">${esc(art.artist)}(${esc(art.artist_en)})作于${esc(art.year)},馆藏来自${esc(art.loc)}。策展人称:"错过要再等一千零一夜。"</div>
    <div class="pCols">
      <div><b>🍺 酒馆快讯</b><br>等待戈多酒馆新到「${esc(beer.name)}」(${esc(beer.style)} · ${esc(beer.abv)})。天哥已代表大家试过:"戈多没来,酒很好。"</div>
      <div><b>🐦 自然观察</b><br>百鸟林目击「${esc(bird.zh)}」(<i>${esc(bird.sci)}</i>)。观鸟协会提醒:请勿投喂,它比你懂吃。</div>
      <div><b>🎷 今夜乐评</b><br>蓝调俱乐部放送《${esc(alb.title)}》(${esc(alb.artist)},${alb.year})。剑敏大师短评:"留白极佳。"</div>
      <div><b>📚 一日一书</b><br>博尔赫斯荐《${esc(book.zh)}》(${esc(book.author)}):"${esc(String(book.desc)).slice(0, 38)}…"</div>
      <div><b>🌿 花讯</b><br>植物园「${esc(plant.zh)}」(${esc(plant.family)})正当时,解说牌照片已更新。</div>
      <div><b>⛰️ 户外专栏</b><br>雪峰营地本周主推:${esc(sport.name)}(难度 ${'●'.repeat(sport.diff)}${'○'.repeat(5 - sport.diff)})。</div>
    </div>
    <div class="pFoot">天气:恒晴,傍晚有物理正确的晚霞,夜间星空营业,灯塔照常旋转 ·
    寻物启事:全岛尚有 ${shardLeft} 枚星之碎片下落不明,拾获者奖 10 SB ·
    广告位招租(请洽报亭墨丘利)</div>
  </div>`;
}
function newsCard() {
  if (paperBought()) return paperHTML();
  return `<div class="cardHead" style="background:#4a4438">🗞️ 报亭 · Newsstand</div>
    <div class="cardMedia"><div class="paperRoll">📰</div></div>
    <div class="cardTitle"><h3>万神殿日报</h3><div class="en">The Pantheon Daily · 今日刊</div></div>
    <div class="cardDesc">墨丘利:"号外!全岛大事,尽在一纸。今天买过的,全天免费重读。"</div>
    <div style="text-align:center;padding:0 0 16px"><button class="again" data-buypaper>🗞️ 买一份(2 SB)</button></div>`;
}
function buildCard(s) {
  const cat = s.cat;
  if (cat === 'news') return newsCard();
  if (cat === 'shop') return shopCard();
  if (cat === 'sign') {
    return `<div class="cardHead" style="background:#5a7247">🧭 海岛路牌 · Signpost</div>
    <div class="cardTitle"><h3>要去哪儿?</h3><div class="en">Fast travel</div></div>
    <div class="travelGrid">${Object.keys(CATS).map(k =>
      `<button data-travel="${k}">${CATS[k].icon} ${CATS[k].name}</button>`).join('')}
      <button data-travel="plaza">⛲ 中央广场</button></div>`;
  }
  const it = s.type === 'bar' ? D.beers[Math.floor(Math.random() * D.beers.length)] : s.item;
  s.lastItem = it;
  let media = '', title = '', en = '', meta = '', desc = '';
  if (cat === 'art') {
    media = `<img class="artframe" src="${CDN.art + it.thumb}" alt="">`;
    title = it.title; en = it.title_en;
    meta = metaRows([['画家', `${it.artist}(${it.artist_en})`], ['年代', it.year], ['时期', it.era], ['馆藏', it.loc]]);
  } else if (cat === 'books') {
    media = `<div class="bookCover" style="background:linear-gradient(150deg,${hashCol(it.id)},#2c2418)"><span>${esc(it.zh)}</span></div>`;
    title = `《${it.zh}》`; en = it.en;
    meta = metaRows([['作者', it.author], ['年代', it.year]]); desc = it.desc;
  } else if (cat === 'birds') {
    media = `<img src="${commonsImg(it.file)}" alt="">`;
    title = it.zh; en = `${it.en} · <i>${esc(it.sci)}</i>`;
    meta = metaRows([['类群', it.group], ['分布', it.realm], ['保护级别', it.iucn]]); desc = it.desc;
  } else if (cat === 'plants') {
    media = `<img src="${CDN.plants + it.thumb}" alt="">`;
    title = it.zh; en = `${it.en} · <i>${esc(it.sci)}</i>`;
    meta = metaRows([['科', it.family], ['目', it.order], ['红色名录', it.iucn]]); desc = it.desc;
  } else if (cat === 'beers') {
    const col = BEER_COLOR[it.cat] || '#e8a33c';
    media = `<div class="beerGlass" style="background:linear-gradient(180deg,${col},#00000033 160%);"><div class="foam"></div><div class="abv">${esc(it.abv)}</div></div>`;
    title = it.name; en = it.name_en;
    meta = metaRows([['酒厂', it.brewery_en ? `${it.brewery} · ${it.brewery_en}` : it.brewery], ['风格', it.style_en ? `${it.style} · ${it.style_en}` : it.style], ['产地', it.origin]]);
    desc = it.desc + (s.type === 'bar' ? '<br><br>🍻 酒保:“戈多还没来。再等等,先喝一杯。”' : '');
  } else if (cat === 'fish') {
    const col = FISH_COLOR[it.cat] || '#4a90d9';
    media = `<svg class="fishSvg" width="200" height="120" viewBox="0 0 200 120"><ellipse cx="90" cy="60" rx="58" ry="30" fill="${col}"/><polygon points="140,60 180,35 180,85" fill="${col}"/><polygon points="80,32 100,8 108,34" fill="${col}" opacity=".8"/><circle cx="58" cy="52" r="6" fill="#fff"/><circle cx="58" cy="52" r="3" fill="#222"/><path d="M40 68 Q52 74 64 68" stroke="#00000044" fill="none" stroke-width="3"/></svg>`;
    title = it.name; en = `${it.name_en} · <i>${esc(it.sci)}</i>`;
    meta = metaRows([['科', it.family], ['栖息', it.habitat], ['最大体长', it.size]]);
  } else if (cat === 'jazz') {
    media = `<div class="vinyl" style="--label:${hashCol(it.era)}"></div>`;
    title = it.title; en = it.artist;
    meta = metaRows([['音乐家', it.artist], ['年份', it.year], ['厂牌', it.label], ['时期', it.era]]); desc = it.reason;
  } else if (cat === 'classical') {
    media = `<div class="medallion"><div class="g">🎼</div><div class="e">${esc(it.era).toUpperCase()}</div></div>`;
    title = it.zh || it.title; en = it.zh ? it.title : '';
    meta = metaRows([['作曲', it.artist], ['演绎', it.perf], ['年份', it.year], ['厂牌', it.label]]); desc = it.reason;
  } else if (cat === 'outdoor') {
    media = `<div class="sportTile" style="background:linear-gradient(150deg,#dfe8cf,#9dbd8a)">${SPORT_ICON[it.cat] || '⛰️'}</div>`;
    title = it.name; en = it.name_en;
    meta = metaRows([['形式', it.disc], ['关键装备', it.gear], ['难度', '●'.repeat(it.diff) + '○'.repeat(5 - it.diff)], ['环境', it.terrain]]);
    desc = it.desc;
  }
  if (CATS[cat]) markSeen(cat, it.id, title);
  const again = s.type === 'bar' ? `<div style="text-align:center;padding:0 0 16px"><button class="again" data-again>🍺 买一杯(6 SB)${drinks ? ` · 已饮 ${drinks} 杯` : ''}</button></div>` : '';
  return cardHTML(cat, `<div class="cardMedia">${media}</div>
    <div class="cardTitle"><h3>${esc(title)}</h3><div class="en">${en}</div></div>${meta}
    ${desc ? `<div class="cardDesc">${desc}</div>` : ''}${again}`);
}
let modalOpen = false;
function openCard(s) {
  cardBody.innerHTML = buildCard(s);
  modal.classList.remove('hidden'); modalOpen = true;
  cardBody.querySelectorAll('img').forEach(im => {
    im.onerror = () => { im.outerHTML = `<div class="medallion"><div class="g">${CATS[s.cat]?.icon || '✦'}</div><div class="e">图片加载中断</div></div>`; };
  });
  cardBody.querySelector('[data-again]')?.addEventListener('click', () => {
    if (!spendSB(6)) return;
    drinks++; saveSB();
    toast(`🍻 干杯!这是你的第 ${drinks} 杯 · ⚡-6`);
    openCard(s);
  });
  bindGear(() => openCard(s));
  cardBody.querySelector('[data-buypaper]')?.addEventListener('click', () => {
    if (!spendSB(2)) return;
    try { localStorage.setItem('w1001.paper', todayStr()); } catch (e) {}
    toast('🗞️ 墨丘利:"慢用,今日的世界。" ⚡-2');
    blip(740);
    openCard(s);
  });
  cardBody.querySelectorAll('[data-travel]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.travel, p = TRAVEL3D[k];
    player.position.set(p[0], height(p[0], p[1]) + 1, p[1]); vy = 0;
    closeModals(); toast(`${k === 'plaza' ? '⛲' : CATS[k].icon} 来到了${k === 'plaza' ? '中央广场' : CATS[k].name}`); blip(520);
  }));
}
function closeModals() { modal.classList.add('hidden'); $('journal').classList.add('hidden'); modalOpen = false; }
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModals));
modal.addEventListener('click', e => { if (e.target === modal) closeModals(); });
$('journal').addEventListener('click', e => { if (e.target === $('journal')) closeModals(); });
function rotateExhibits() {
  for (const s of spots) if (s.item) { s.item = pickers[s.cat](); s.updateVisual && s.updateVisual(); }
  closeModals(); toast('🔄 海岛换了一批新展品,再去逛逛吧!'); blip(520);
}
function openJournal() {
  const list = $('journalList');
  const qHtml = quest ? `<div class="qBox"><div class="qTitle"><span>📜 今日委托</span><span>⭐ ×${stars}</span></div>
    ${quest.cats.map(c => {
      const need = QUEST_TPL[c][0], p = Math.min(quest.prog[c], need), ok = p >= need;
      return `<div class="qRow${ok ? ' ok' : ''}"><span>${ok ? '✅' : CATS[c].icon}</span><span>${QUEST_TPL[c][1]}</span><span class="qn">${p}/${need}</span></div>`;
    }).join('')}
    <button id="btnRotate">🔄 给海岛换一批展品</button></div>` : '';
  list.innerHTML = qHtml + Object.keys(CATS).map(k => {
    const cfg = CATS[k], n = seen[k].length, embed = D[k].length;
    const pct = Math.round(n / embed * 100);
    return `<div class="jRow"><div class="ico">${cfg.icon}</div>
      <div class="info"><div class="nm">${cfg.name} <span style="color:#93a07f;font-weight:400">${cfg.en}</span></div>
      <div class="jBar"><i style="--c:${cfg.color};width:${pct}%"></i></div>
      <div class="tot">岛上在展 ${embed} · 完整收藏 ${cfg.tot} ${cfg.unit}</div></div>
      <div class="num">${n}/${embed}</div>
      <a href="${cfg.link}" target="_blank" rel="noopener">网站 →</a></div>`;
  }).join('');
  $('journal').classList.remove('hidden'); modalOpen = true;
  list.querySelector('#btnRotate')?.addEventListener('click', rotateExhibits);
}
$('btnJournal').addEventListener('click', openJournal);
$('hudQuest').addEventListener('click', openJournal);
$('btnBag').addEventListener('click', () => { modalOpen ? closeModals() : openBag(); });
$('btnHelp').addEventListener('click', () => { $('intro').classList.remove('hidden'); });
$('btnStart').addEventListener('click', () => { $('intro').classList.add('hidden'); initAudio(); });

/* --- 音效与音乐(与 2D 相同引擎) --- */
let actx = null, musicGain = null, musicOn = true, waveGain = null;
let musicZone = 'street', nextBeat = 0, beatCount = 0, melIdx = 3;
const THEMES = {
  street:    { tempo: 96,  wave: 'triangle', scale: [0, 2, 4, 7, 9, 12],   base: 220, dens: .5, bass: true },
  art:       { tempo: 64,  wave: 'sine', scale: [0, 4, 7, 11, 12],   base: 330, dens: .38 },
  books:     { tempo: 70,  wave: 'sine', scale: [0, 2, 3, 7, 8, 12], base: 294, dens: .4 },
  birds:     { tempo: 84,  wave: 'sine', scale: [0, 2, 4, 7, 9],     base: 392, dens: .22, chirp: true },
  plants:    { tempo: 84,  wave: 'sine', scale: [0, 2, 4, 7, 9, 12], base: 262, dens: .45 },
  beers:     { tempo: 148, wave: 'square', scale: [0, 2, 4, 5, 7, 9], base: 196, dens: .8, bass: true, vol: .55 },
  fish:      { tempo: 52,  wave: 'sine', scale: [0, 3, 7, 10, 12],   base: 147, dens: .35, pad: true },
  jazz:      { tempo: 138, wave: 'sine', scale: [0, 3, 5, 6, 7, 10], base: 175, dens: .72, swing: true, bass: true },
  classical: { tempo: 106, wave: 'sine', scale: [0, 4, 7, 12, 16, 19], base: 262, dens: .85, arp: true },
  outdoor:   { tempo: 100, wave: 'triangle', scale: [0, 7, 12, 14, 19], base: 165, dens: .5, bass: true },
};
function note(freq, t, dur, wave, vol) {
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = wave; o.frequency.value = freq;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .02);
  g.gain.exponentialRampToValueAtTime(.0008, t + dur);
  o.connect(g).connect(musicGain); o.start(t); o.stop(t + dur + .05);
}
function chirpS(t) {
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = 'sine'; const f = 2400 + Math.random() * 1400;
  o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .62, t + .12);
  g.gain.setValueAtTime(.028, t); g.gain.exponentialRampToValueAtTime(.0008, t + .14);
  o.connect(g).connect(musicGain); o.start(t); o.stop(t + .16);
}
function scheduler() {
  if (!actx || !musicOn) return;
  const th = THEMES[musicZone] || THEMES.street;
  const spb = 60 / th.tempo, vol = .042 * (th.vol || 1);
  if (nextBeat < actx.currentTime) nextBeat = actx.currentTime + .06;
  while (nextBeat < actx.currentTime + .38) {
    const t = nextBeat;
    if (Math.random() < th.dens) {
      melIdx = clamp(melIdx + (Math.random() < .5 ? -1 : 1), 0, th.scale.length - 1);
      note(th.base * Math.pow(2, th.scale[melIdx] / 12), t, spb * (th.arp ? .95 : 1.7), th.wave, vol);
      if (th.arp && Math.random() < .7)
        note(th.base * Math.pow(2, th.scale[(melIdx + 2) % th.scale.length] / 12), t + spb / 2, spb * .9, th.wave, vol * .7);
    }
    if (th.bass && beatCount % 4 === 0) note(th.base / 2, t, spb * 3.2, 'sine', vol * 1.25);
    if (th.pad && beatCount % 8 === 0) note(th.base, t, spb * 7, 'sine', vol * .8);
    if (th.chirp && Math.random() < .3) chirpS(t + Math.random() * spb);
    nextBeat += th.swing ? (beatCount % 2 ? spb * .64 : spb * 1.36) : spb;
    beatCount++;
  }
}
function initAudio() {
  if (actx) return;
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    musicGain = actx.createGain(); musicGain.gain.value = musicOn ? 1 : 0;
    musicGain.connect(actx.destination);
    // 海浪:循环白噪声 + 低通,靠近海边渐强
    const buf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    const src = actx.createBufferSource(); src.buffer = buf; src.loop = true;
    const filt = actx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 420;
    waveGain = actx.createGain(); waveGain.gain.value = 0;
    src.connect(filt).connect(waveGain).connect(actx.destination);
    src.start();
    setInterval(scheduler, 140);
  } catch (e) {}
}
function blip(freq) {
  if (!actx) return;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(.12, actx.currentTime);
  g.gain.exponentialRampToValueAtTime(.001, actx.currentTime + .18);
  o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + .2);
}
$('btnMusic').addEventListener('click', () => {
  initAudio(); musicOn = !musicOn;
  if (musicGain) musicGain.gain.value = musicOn ? 1 : 0;
  $('btnMusic').textContent = musicOn ? '🎵' : '🔇';
});

/* ================= 三维场景 ================= */
const MOBILE = matchMedia('(pointer: coarse)').matches;
const renderer = new THREE.WebGLRenderer({ canvas: $('game'), antialias: !MOBILE });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, MOBILE ? 1.5 : 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .68;
if (!MOBILE) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd4ee);
scene.fog = new THREE.Fog(0x9fd4ee, 320, 1100);
const camera = new THREE.PerspectiveCamera(58, 1, .1, 2400);
let composer = null;
function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  if (composer) composer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', resize); resize();
/* --- 后期处理:泛光 + ACES 输出(桌面) --- */
if (!MOBILE) {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .25, .55, .85));
  composer.addPass(new OutputPass());
}

const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x77995a, .95);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1cf, 2.6);
sun.position.set(180, 260, 120); scene.add(sun);
scene.add(sun.target);
const sunDirN = new THREE.Vector3(.5, .6, .3).normalize();
if (!MOBILE) {
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -170; sc.right = 170; sc.top = 170; sc.bottom = -170; sc.near = 10; sc.far = 900;
  sun.shadow.bias = -0.0006;
}
/* --- 物理大气天空 --- */
const sky = new Sky();
sky.scale.setScalar(2100);
scene.add(sky);
const skyUni = sky.material.uniforms;
skyUni.turbidity.value = 7;
skyUni.rayleigh.value = 1.6;
skyUni.mieCoefficient.value = .004;
skyUni.mieDirectionalG.value = .8;
/* --- 星空(夜晚可见) --- */
let starField;
{
  const n = 500, posArr = new Float32Array(n * 3);
  const r0 = mulberry32(99);
  for (let i = 0; i < n; i++) {
    const a = r0() * Math.PI * 2, e = Math.acos(r0() * .95);   // 上半球
    posArr[i * 3] = Math.sin(e) * Math.cos(a) * 1000;
    posArr[i * 3 + 1] = Math.cos(e) * 1000 + 40;
    posArr[i * 3 + 2] = Math.sin(e) * Math.sin(a) * 1000;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  starField = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2.4, transparent: true, opacity: 0, fog: false, sizeAttenuation: false }));
  scene.add(starField);
}
/* --- 昼夜循环(约 8 分钟一天,从清晨开始) --- */
let fireLight = null, lantern = null;
const DAY_LEN = 480, DAY_START = .12;
const cDaySky = new THREE.Color(0x9fd4ee), cNightSky = new THREE.Color(0x101a30), cDuskSky = new THREE.Color(0xf5915e);
const skyCol = new THREE.Color();
function dayAmount(p) { if (p < .58) return 1; if (p < .7) return 1 - (p - .58) / .12; if (p < .9) return 0; return (p - .9) / .1; }
function updateDayNight(t) {
  const p = (t / DAY_LEN + DAY_START) % 1;
  const da = dayAmount(p);
  const dusk = clamp(1 - Math.abs(p - .64) / .09, 0, 1) + clamp(1 - Math.abs(p - .95) / .05, 0, 1);
  skyCol.copy(cNightSky).lerp(cDaySky, da).lerp(cDuskSky, Math.min(dusk, 1) * .55);
  scene.background.copy(skyCol); scene.fog.color.copy(skyCol);
  sun.intensity = .06 + 2.7 * da;
  hemi.intensity = .16 + .62 * da;
  const sa = clamp((p + .1) / .8, 0, 1) * Math.PI;   // 日出(p≈0)→正午(p≈.3)→日落(p≈.7)
  const elev = Math.sin(sa) * da - .32 * (1 - da);   // 夜里太阳沉入地平线下
  sunDirN.set(Math.cos(sa), Math.max(elev, -0.4), .42).normalize();
  skyUni.sunPosition.value.copy(sunDirN);            // 驱动大气散射
  sun.position.copy(player.position).addScaledVector(sunDirN, 330);
  sun.target.position.copy(player.position);
  if (oceanWater) oceanWater.material.uniforms.sunDirection.value.copy(sunDirN);
  starField.material.opacity = (1 - da) * .95;
  if (fireLight) fireLight.intensity = (1 - da) * 55 + Math.sin(t * 9) * 5 * (1 - da);
  if (lantern) lantern.intensity = (1 - da) * 16;   // 夜间提灯
  if (lightLamp) lightLamp.intensity = (1 - da) * 90;   // 灯塔
  if (beacon) { beacon.material.opacity = (1 - da) * .32; beacon.rotation.y = t * .9; }
  return da;
}

/* --- 地形网格 --- */
const TER = 1900, SEG = MOBILE ? 150 : 240;
{
  const g = new THREE.PlaneGeometry(TER, TER, SEG, SEG);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, colors = [];
  const cSand = new THREE.Color(0xe4d5a2), cGrass1 = new THREE.Color(0x74ad58), cGrass2 = new THREE.Color(0x639b4c),
        cRock = new THREE.Color(0x8d8577), cSnow = new THREE.Color(0xeef3f5), cSea = new THREE.Color(0xcdbf92),
        cPath = new THREE.Color(0xcdb98c), cMouth = new THREE.Color(0x54453a);
  // 泥土小路:广场辐射到各区入口
  const PATH_A = [0, 14];
  const PATH_B = Object.entries(TRAVEL3D).filter(([k]) => k !== 'plaza').map(([, v]) => v);
  function pathDist(x, z) {
    let best = 1e9;
    for (const b of PATH_B) {
      const abx = b[0] - PATH_A[0], abz = b[1] - PATH_A[1];
      const t = clamp(((x - PATH_A[0]) * abx + (z - PATH_A[1]) * abz) / (abx * abx + abz * abz), 0, 1);
      const dx = x - (PATH_A[0] + abx * t), dz = z - (PATH_A[1] + abz * t);
      const d = dx * dx + dz * dz;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  }
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = height(x, z);
    pos.setY(i, h);
    const sl = Math.abs(height(x + 3, z) - h) + Math.abs(height(x, z + 3) - h);   // 坡度
    let c;
    if (h > 34) c = cSnow;
    else if (sl > 3.4 || h > 26) c = cRock;
    else if (h > -1 && mouthDist(x, z) < 5) c = cMouth;                                         // 鲸嘴线
    else if (h > 0 && Math.abs(Math.hypot(x - WHALE_EYE.x, z - WHALE_EYE.z) - WHALE_EYE.r) < 5) c = cMouth;  // 眼圈
    else if (h < 1.8) c = h < -2 ? cSea : cSand;
    else {
      c = fbm(x * .05, z * .05) > .52 ? cGrass1 : cGrass2;
      const pd = pathDist(x, z);
      if (pd < 4.2) c = cPath;
      else if (pd < 7.5) c = c.clone().lerp(cPath, (7.5 - pd) / 3.3 * .55);
    }
    colors.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  const terrainMat = MOBILE
    ? new THREE.MeshLambertMaterial({ vertexColors: true })
    : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .96, metalness: 0 });
  const terrain = new THREE.Mesh(g, terrainMat);
  terrain.receiveShadow = true; terrain.castShadow = !MOBILE;
  scene.add(terrain);
}
/* --- 海洋:桌面用反射水面着色器,手机用轻量波浪 --- */
let waterGeo = null, oceanWater = null;
function makeWaterNormals() {   // 程序化水面法线贴图(免外部纹理)
  const S = 256, cv2 = document.createElement('canvas'); cv2.width = cv2.height = S;
  const c = cv2.getContext('2d'), img = c.createImageData(S, S);
  const hgt = (x, y) => fbm(x * .06, y * .06) + fbm(x * .17 + 40, y * .17 + 40) * .4;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (hgt(x + 1, y) - hgt(x - 1, y)) * 2.2;
    const dy = (hgt(x, y + 1) - hgt(x, y - 1)) * 2.2;
    const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
    const o = (y * S + x) * 4;
    img.data[o] = (-dx * inv * .5 + .5) * 255;
    img.data[o + 1] = (-dy * inv * .5 + .5) * 255;
    img.data[o + 2] = inv * 255;
    img.data[o + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv2);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
if (!MOBILE) {
  oceanWater = new Water(new THREE.PlaneGeometry(3200, 3200), {
    textureWidth: 512, textureHeight: 512,
    waterNormals: makeWaterNormals(),
    sunDirection: new THREE.Vector3(.5, .6, .3).normalize(),
    sunColor: 0xffffff, waterColor: 0x0e3a52,
    distortionScale: 2.6, fog: true,
  });
  oceanWater.rotation.x = -Math.PI / 2;
  oceanWater.position.y = .15;
  scene.add(oceanWater);
} else {
  waterGeo = new THREE.PlaneGeometry(3200, 3200, 72, 72);
  waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeo, new THREE.MeshPhongMaterial({
    color: 0x2e7fb4, transparent: true, opacity: .82, shininess: 120, specular: 0x88c9ee,
  }));
  water.position.y = 0; scene.add(water);
}
/* --- 云 --- */
const clouds = [];
{
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: .85 });
  const rnd = mulberry32(11);
  for (let i = 0; i < 10; i++) {
    const grp = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(14 + rnd() * 12, 7, 5), mat);
      m.position.set(j * 20 - 20 + rnd() * 8, rnd() * 4, rnd() * 10 - 5); m.scale.y = .45;
      grp.add(m);
    }
    grp.position.set(rnd() * 1600 - 800, 130 + rnd() * 60, rnd() * 1600 - 800);
    scene.add(grp); clouds.push(grp);
  }
}

/* ---------- 障碍与藏品点 ---------- */
const boxObs = [];    // {x1,z1,x2,z2}
const cirObs = [];    // {x,z,r}
const spots = [];     // {x,z,y,cat,type,item,r,updateVisual?}
const rnd = mulberry32(20260703);
const pickers = {};
for (const k of ['art', 'books', 'birds', 'plants', 'beers', 'fish', 'jazz', 'classical', 'outdoor'])
  pickers[k] = (arr => { let i = 0; return () => arr[i++ % arr.length]; })(shuffled(D[k], rnd));
function addSpot(x, z, cat, type, extra) {
  const item = (type === 'bar' || type === 'sign' || type === 'news' || type === 'shop') ? null : pickers[cat]();
  const s = Object.assign({ x, z, y: height(x, z), r: 6.5, cat, type, item }, extra || {});
  spots.push(s); return s;
}
/* PBR:桌面用 Standard(粗糙度/金属度),手机用便宜的 Lambert */
const lam = c => MOBILE
  ? new THREE.MeshLambertMaterial({ color: c })
  : new THREE.MeshStandardMaterial({ color: c, roughness: .88, metalness: 0 });
const M = {
  wood: lam(0x8a6238),
  woodDark: lam(0x5e4023),
  stone: lam(0xb9b2a4),
  gold: MOBILE ? new THREE.MeshLambertMaterial({ color: 0xd9b26a })
               : new THREE.MeshStandardMaterial({ color: 0xd9b26a, roughness: .38, metalness: .75 }),
  white: lam(0xf5efdc),
};
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
const cyl = (rT, rB, h, mat, seg = 10) => new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, seg), mat);

/* --- 亭台建筑 --- */
function pavilion(zn, opt) {
  const { x, z, h } = zn, o = Object.assign({ w: 26, d: 20, walls: 'back', roof: 0xa8542c, floor: 0xcfc5ae }, opt);
  const grp = new THREE.Group(); grp.position.set(x, h, z);
  const fl = box(o.w, .8, o.d, lam(o.floor)); fl.position.y = .4; grp.add(fl);
  for (const [cx, cz] of [[-o.w / 2 + 1, -o.d / 2 + 1], [o.w / 2 - 1, -o.d / 2 + 1], [-o.w / 2 + 1, o.d / 2 - 1], [o.w / 2 - 1, o.d / 2 - 1]]) {
    const c = cyl(.5, .6, 7, M.woodDark); c.position.set(cx, 4, cz); grp.add(c);
    cirObs.push({ x: x + cx, z: z + cz, r: 1 });
  }
  const roof = box(o.w + 3, .8, o.d + 3, lam(o.roof)); roof.position.y = 7.6; grp.add(roof);
  const cap = box(o.w * .55, .7, o.d * .55, lam(o.roof)); cap.position.y = 8.6; grp.add(cap);
  if (o.walls !== 'none') {
    const back = box(o.w, 6.6, .5, M.white); back.position.set(0, 3.7, -o.d / 2 + .3); grp.add(back);
    boxObs.push({ x1: x - o.w / 2, z1: z - o.d / 2 - .1, x2: x + o.w / 2, z2: z - o.d / 2 + .7 });
    if (o.walls === 'three') {
      for (const sgn of [-1, 1]) {
        const side = box(.5, 6.6, o.d, M.white); side.position.set(sgn * (o.w / 2 - .3), 3.7, 0); grp.add(side);
        boxObs.push({ x1: x + sgn * o.w / 2 - .7, z1: z - o.d / 2, x2: x + sgn * o.w / 2 + .7, z2: z + o.d / 2 });
      }
    }
  }
  scene.add(grp); return grp;
}
const texLoader = new THREE.TextureLoader();
texLoader.crossOrigin = 'anonymous';
/* 中文招牌(canvas 纹理,夜里也发亮) */
function makeSign(text, w = 9, bg = '#3a2a18', fg = '#ffd76a') {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 120;
  const c = cv.getContext('2d');
  c.fillStyle = bg; c.fillRect(0, 0, 512, 120);
  c.strokeStyle = fg; c.lineWidth = 6; c.strokeRect(8, 8, 496, 104);
  c.fillStyle = fg; c.font = 'bold 58px "Microsoft YaHei", sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, w * 120 / 512),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
}
/* 山墙三角(古典建筑) */
function pediment(w, h, depth, color) {
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, h); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
  return new THREE.Mesh(g, lam(color));
}
function paintingMesh(grp, lx, lz, ry, spot) {
  const frame = box(4.6, 3.8, .3, M.gold); frame.position.set(lx, 4, lz); frame.rotation.y = ry; grp.add(frame);
  const mat = new THREE.MeshLambertMaterial({ color: 0x777777 });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(4, 3.2), mat);
  pl.position.set(lx + Math.sin(ry) * .2, 4, lz + Math.cos(ry) * .2); pl.rotation.y = ry; grp.add(pl);
  const load = () => texLoader.load(CDN.art + spot.item.thumb, tx => {
    tx.colorSpace = THREE.SRGBColorSpace; mat.map = tx; mat.color.set(0xffffff); mat.needsUpdate = true;
  });
  load(); spot.updateVisual = load;
}

/* --- 美术馆 --- */
{
  const zn = ZONES3D.find(z => z.key === 'art');
  const grp = pavilion(zn, { w: 46, d: 30, walls: 'three', roof: 0xd8d2c4, floor: 0xe8e2d4 });
  // 古典博物馆立面:柱廊 + 檐部 + 三角山墙(参考大英博物馆)
  for (let i = 0; i < 6; i++) {
    const col = cyl(.75, .85, 7.4, M.white); col.position.set(-17.5 + i * 7, 3.9, 14.2); grp.add(col);
    cirObs.push({ x: zn.x - 17.5 + i * 7, z: zn.z + 14.2, r: 1.1 });
  }
  const entab = box(50, 1.3, 3.4, M.white); entab.position.set(0, 8.1, 14.2); grp.add(entab);
  const ped = pediment(50, 5.5, 1.6, 0xe8e2d4); ped.position.set(0, 8.7, 13.6); grp.add(ped);
  const sign = makeSign('一〇〇一美术馆', 10); sign.position.set(0, 10.6, 15.4); grp.add(sign);
  for (let i = 0; i < 6; i++) {
    const s = addSpot(zn.x - 17.5 + i * 7, zn.z - 11, 'art', 'painting'); s.y = zn.h;
    paintingMesh(grp, -17.5 + i * 7, -14.4, 0, s);
  }
  for (let i = 0; i < 4; i++) {
    let s = addSpot(zn.x - 20, zn.z - 8 + i * 5.4, 'art', 'painting'); s.y = zn.h;
    paintingMesh(grp, -22.4, -8 + i * 5.4, Math.PI / 2, s);
    s = addSpot(zn.x + 20, zn.z - 8 + i * 5.4, 'art', 'painting'); s.y = zn.h;
    paintingMesh(grp, 22.4, -8 + i * 5.4, -Math.PI / 2, s);
  }
}
/* --- 图书馆 --- */
{
  const zn = ZONES3D.find(z => z.key === 'books');
  const grp = pavilion(zn, { w: 32, d: 24, walls: 'three', roof: 0xcfc0a2, floor: 0xd8c49c });
  // 古典图书馆:鼓座 + 铜绿穹顶(参考老图书馆圆顶)
  const drum = cyl(9.5, 10, 2.2, M.white); drum.position.y = 8.9; grp.add(drum);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(9.4, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), lam(0x4f9e8f));
  dome.position.y = 10; grp.add(dome);
  const finial = cyl(.3, .3, 2, M.gold); finial.position.y = 20; grp.add(finial);
  for (const sgn of [-1, 1]) {
    const col = cyl(.65, .75, 7, M.white); col.position.set(sgn * 4.5, 3.8, 12.6); grp.add(col);
    cirObs.push({ x: zn.x + sgn * 4.5, z: zn.z + 12.6, r: 1 });
  }
  const arch = box(11, 1.4, 2, M.white); arch.position.set(0, 7.6, 12.6); grp.add(arch);
  const sign = makeSign('千夜图书馆', 8, '#2c2418', '#ffe9a8'); sign.position.set(0, 9.4, 13.4); grp.add(sign);
  let n = 0;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    if (n++ >= 12) break;
    const lx = -10.5 + c * 7, lz = -7 + r * 6;
    const sh = box(5, 3.2, 1.3, M.woodDark); sh.position.set(lx, 2, lz); grp.add(sh);
    for (let b = 0; b < 6; b++) {
      const bk = box(.6, 2, .9, lam(hashCol(r * 4 + c + b))); bk.position.set(lx - 1.9 + b * .76, 2.2, lz); grp.add(bk);
    }
    boxObs.push({ x1: zn.x + lx - 2.5, z1: zn.z + lz - .8, x2: zn.x + lx + 2.5, z2: zn.z + lz + .8 });
    const s = addSpot(zn.x + lx, zn.z + lz + 2.6, 'books', 'shelf'); s.y = zn.h;
  }
}
/* --- 树(通用) --- */
function makeTree(x, z, scale, birdCol) {
  const h = height(x, z);
  const grp = new THREE.Group(); grp.position.set(x, h, z);
  const tr = cyl(.5 * scale, .7 * scale, 5 * scale, M.wood); tr.position.y = 2.5 * scale; grp.add(tr);
  const c1 = new THREE.Mesh(new THREE.IcosahedronGeometry(3.4 * scale, 0), lam(0x4f9448)); c1.position.y = 6.4 * scale; grp.add(c1);
  const c2 = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4 * scale, 0), lam(0x5fae52)); c2.position.set(1.4 * scale, 8 * scale, .6 * scale); grp.add(c2);
  let bird = null;
  if (birdCol) {
    bird = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(.55, 8, 6), lam(birdCol)); bird.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.34, 8, 6), lam(birdCol)); head.position.set(.5, .35, 0); bird.add(head);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(.14, .5, 6), lam(0xe8963c));
    beak.rotation.z = -Math.PI / 2; beak.position.set(.95, .35, 0); bird.add(beak);
    bird.position.y = 10.2 * scale; grp.add(bird);
  }
  cirObs.push({ x, z, r: 1.1 * scale });
  scene.add(grp);
  return { grp, bird };
}
/* --- 百鸟林 --- */
{
  const zn = ZONES3D.find(z => z.key === 'birds');
  const pts = []; let guard = 0;
  while (pts.length < 20 && guard++ < 500) {
    const a = rnd() * Math.PI * 2, rr = 12 + rnd() * (zn.r - 22);
    const x = zn.x + Math.cos(a) * rr, z = zn.z + Math.sin(a) * rr;
    if (pts.every(p => Math.hypot(p[0] - x, p[1] - z) > 13)) pts.push([x, z]);
  }
  pts.forEach(([x, z]) => {
    const s = addSpot(x, z, 'birds', 'tree', { r: 7.5 });
    const t = makeTree(x, z, 1.25, hashCol(s.item.id));
    s.birdRef = t.bird;
    s.updateVisual = () => t.bird.children.forEach((m, i) => { if (i < 2) m.material.color.set(hashCol(s.item.id)); });
  });
}
/* --- 植物园 --- */
{
  const zn = ZONES3D.find(z => z.key === 'plants');
  let n = 0;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
    if (n++ >= 18) break;
    const x = zn.x - 32 + c * 13, z = zn.z - 18 + r * 18;
    const h = height(x, z);
    const mound = cyl(2.6, 3, .9, lam(0x6b4a2b)); mound.position.set(x, h + .45, z); scene.add(mound);
    const s = addSpot(x, z + 3.4, 'plants', 'bed');
    const flowers = [];
    for (let f = 0; f < 5; f++) {
      const fm = new THREE.Mesh(new THREE.SphereGeometry(.42, 7, 5), lam(hashCol(s.item.id)));
      fm.position.set(x - 1.4 + f * .7, h + 1.5 + (f % 2) * .35, z + (f % 3) * .5 - .5);
      scene.add(fm); flowers.push(fm);
      const st = cyl(.06, .06, 1, lam(0x3e7a3a)); st.position.set(fm.position.x, h + .95, fm.position.z); scene.add(st);
    }
    // 真实植物照片解说牌(1001plants 图库)
    const bMat = new THREE.MeshLambertMaterial({ color: 0x9aa08a });
    const board = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.1), bMat);
    board.position.set(x, h + 3, z - 1.6); scene.add(board);
    const bFrame = box(3.15, 2.45, .15, M.wood); bFrame.position.set(x, h + 3, z - 1.7); scene.add(bFrame);
    for (const sgn of [-1, 1]) {
      const post = cyl(.12, .12, 3.2, M.woodDark); post.position.set(x + sgn * 1.35, h + 1.5, z - 1.7); scene.add(post);
    }
    const loadTex = () => texLoader.load(CDN.plants + s.item.thumb, tx => {
      tx.colorSpace = THREE.SRGBColorSpace; bMat.map = tx; bMat.color.set(0xffffff); bMat.needsUpdate = true;
    });
    loadTex();
    s.updateVisual = () => { flowers.forEach(f => f.material.color.set(hashCol(s.item.id))); loadTex(); };
    cirObs.push({ x, z, r: 2.6 });
  }
  const gSign = makeSign('奇花植物园', 8, '#1e3a1e', '#bff09a');
  const gsh = height(zn.x, zn.z + 46);
  gSign.position.set(zn.x, gsh + 4.6, zn.z + 46); scene.add(gSign);
  for (const sgn of [-1, 1]) {
    const post = cyl(.15, .15, 5, M.woodDark); post.position.set(zn.x + sgn * 3.6, gsh + 2.4, zn.z + 46); scene.add(post);
  }
}
/* --- 酒馆 --- */
{
  const zn = ZONES3D.find(z => z.key === 'beers');
  const grp = pavilion(zn, { w: 28, d: 22, walls: 'back', roof: 0x7a4a26, floor: 0x9c6b39 });
  // 欧式老酒馆:人字坡顶 + 悬挂招牌 + 门口一棵戈多枯树
  for (const sgn of [-1, 1]) {
    const slope = box(31, .6, 13.2, lam(0x6e3f1e));
    slope.rotation.x = sgn * .52; slope.position.set(0, 10, sgn * 5.2); grp.add(slope);
  }
  const ridge = box(31.5, .7, 1, M.woodDark); ridge.position.set(0, 12.9, 0); grp.add(ridge);
  const sPost = cyl(.22, .22, 6, M.woodDark); sPost.position.set(16, 3, 11); grp.add(sPost);
  const sArm = box(4, .3, .3, M.woodDark); sArm.position.set(14.2, 5.8, 11); grp.add(sArm);
  const sign = makeSign('等待戈多', 4.6, '#26160a', '#ffd76a'); sign.position.set(13.6, 4.6, 11); grp.add(sign);
  cirObs.push({ x: zn.x + 16, z: zn.z + 11, r: .7 });
  // 戈多枯树(那棵著名的树)
  {
    const tx = zn.x + 22, tz = zn.z + 16, th = height(zn.x + 22, zn.z + 16);
    const t = new THREE.Group(); t.position.set(tx, th, tz);
    const trunk = cyl(.35, .55, 6.5, lam(0x5b5148)); trunk.position.y = 3.2; t.add(trunk);
    [[.7, 1.4, 5.2, .28], [-.6, 1.1, 5.8, -.4], [.2, -1, 6.4, .9]].forEach(([bx, bz, by, rot]) => {
      const br = cyl(.12, .2, 3, lam(0x5b5148));
      br.position.set(bx, by, bz); br.rotation.z = rot + .8; br.rotation.x = bz * .3; t.add(br);
    });
    scene.add(t); cirObs.push({ x: tx, z: tz, r: .9 });
  }
  const bar = box(16, 1.8, 2.4, M.woodDark); bar.position.set(0, 1.5, -6); grp.add(bar);
  boxObs.push({ x1: zn.x - 8, z1: zn.z - 7.4, x2: zn.x + 8, z2: zn.z - 4.6 });
  // 酒保小人
  const bt = new THREE.Group();
  const btBody = cyl(.6, .75, 1.6, lam(0x8c3b2e)); btBody.position.y = 1; bt.add(btBody);
  const bh = new THREE.Mesh(new THREE.SphereGeometry(.5, 8, 6), lam(0xf2c9a0)); bh.position.y = 2.2; bt.add(bh);
  bt.position.set(0, .8, -8.4); grp.add(bt);
  addSpot(zn.x, zn.z - 3, 'beers', 'bar', { r: 8 }).y = zn.h;
  for (let i = 0; i < 5; i++) {
    const k = cyl(1, 1.1, 2.2, M.wood); k.position.set(-11 + i * 5.5, 1.6, 8.2); grp.add(k);
    const band = cyl(1.05, 1.05, .3, M.gold); band.position.set(-11 + i * 5.5, 2.1, 8.2); grp.add(band);
    cirObs.push({ x: zn.x - 11 + i * 5.5, z: zn.z + 8.2, r: 1.4 });
    addSpot(zn.x - 11 + i * 5.5, zn.z + 5.6, 'beers', 'keg').y = zn.h;
  }
  [[-8, 1], [0, 3], [8, 0]].forEach(([lx, lz]) => {
    const tb = cyl(1.8, .3, 1, M.wood); tb.position.set(lx, 1.4, lz); grp.add(tb);
    const bo = box(.5, 1, .5, lam(0xe8a33c)); bo.position.set(lx, 2.4, lz); grp.add(bo);
    cirObs.push({ x: zn.x + lx, z: zn.z + lz, r: 2 });
    addSpot(zn.x + lx, zn.z + lz + 2.8, 'beers', 'table').y = zn.h;
  });
}
/* --- 水族馆(南岸 + 栈桥入海) --- */
{
  const zn = ZONES3D.find(z => z.key === 'fish');
  // 半球玻璃穹顶
  const dome = new THREE.Mesh(new THREE.SphereGeometry(16, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhongMaterial({ color: 0x9fd4ee, transparent: true, opacity: .28, shininess: 140 }));
  dome.position.set(zn.x, zn.h, zn.z); scene.add(dome);
  const base = cyl(16.5, 17, 1, M.stone); base.position.set(zn.x, zn.h + .3, zn.z); scene.add(base);
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2, rr = i % 2 ? 6 : 11;
    const x = zn.x + Math.cos(a) * rr, z = zn.z + Math.sin(a) * rr;
    const s = addSpot(x, z, 'fish', 'tank', { r: 5 }); s.y = zn.h;
    const tank = box(2.6, 2.2, 1.8, new THREE.MeshPhongMaterial({ color: 0x2e86ab, transparent: true, opacity: .4 }));
    tank.position.set(x, zn.h + 2, z); scene.add(tank);
    const fish = box(1, .5, .3, lam(FISH_COLOR[s.item.cat] || '#4a90d9'));
    fish.position.set(x, zn.h + 2, z); scene.add(fish);
    s.fishRef = fish;
    s.updateVisual = () => fish.material.color.set(FISH_COLOR[s.item.cat] || '#4a90d9');
    cirObs.push({ x, z, r: 1.8 });
  }
  // 栈桥伸向大海
  for (let i = 0; i < 9; i++) {
    const pz = zn.z + 20 + i * 9;
    const plank = box(6, .5, 8.6, M.wood); plank.position.set(zn.x, 1.6, pz); scene.add(plank);
    for (const sgn of [-1, 1]) {
      const post = cyl(.35, .35, 4, M.woodDark); post.position.set(zn.x + sgn * 2.6, 0, pz); scene.add(post);
    }
  }
  const aqSign = makeSign('深蓝水族馆', 7, '#0a2438', '#8fd3ff');
  aqSign.position.set(zn.x, 5.4, zn.z + 17); scene.add(aqSign);
  for (const sgn of [-1, 1]) {
    const post = cyl(.16, .16, 5, M.woodDark); post.position.set(zn.x + sgn * 3.2, 2.5, zn.z + 17); scene.add(post);
  }
}
/* --- 爵士俱乐部 --- */
{
  const zn = ZONES3D.find(z => z.key === 'jazz');
  const grp = pavilion(zn, { w: 24, d: 20, walls: 'back', roof: 0x33202e, floor: 0x4a2f3e });
  // 新奥尔良风:条纹雨棚 + 霓虹招牌
  for (let i = 0; i < 8; i++) {
    const seg = box(3.1, .25, 3.6, lam(i % 2 ? 0xc0392b : 0xf5efdc));
    seg.rotation.x = .3; seg.position.set(-10.8 + i * 3.1, 6.9, 10.6); grp.add(seg);
  }
  const sign = makeSign('蓝调爵士俱乐部', 9, '#150a18', '#ff7ab0'); sign.position.set(0, 9.2, 10.2); grp.add(sign);
  const stage = box(14, 1.2, 6, lam(0x241422)); stage.position.set(0, 1.2, -6); grp.add(stage);
  boxObs.push({ x1: zn.x - 7, z1: zn.z - 9, x2: zn.x + 7, z2: zn.z - 3 });
  for (let i = 0; i < 5; i++) for (let r = 0; r < 2; r++) {
    const lx = -8 + i * 4, lz = 2 + r * 5;
    const cr = box(2.4, 1.5, 1.7, M.woodDark); cr.position.set(lx, 1.4, lz); grp.add(cr);
    const disc = cyl(.9, .9, .1, lam(0x111111)); disc.rotation.x = Math.PI / 2.3; disc.position.set(lx, 2.3, lz); grp.add(disc);
    cirObs.push({ x: zn.x + lx, z: zn.z + lz, r: 1.6 });
    addSpot(zn.x + lx, zn.z + lz + 2.4, 'jazz', 'crate').y = zn.h;
  }
}
/* --- 音乐厅 --- */
{
  const zn = ZONES3D.find(z => z.key === 'classical');
  const grp = pavilion(zn, { w: 26, d: 22, walls: 'back', roof: 0x8a6238, floor: 0xd9cdb2 });
  // 金色大厅风:一排金拱窗 + 坡顶(参考维也纳金色大厅)
  for (let i = 0; i < 5; i++) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(2, 3.2), new THREE.MeshBasicMaterial({ color: 0xffd76a, side: THREE.DoubleSide }));
    win.position.set(-8 + i * 4, 4, -10.6); grp.add(win);
  }
  for (const sgn of [-1, 1]) {
    const slope = box(29, .6, 12.6, lam(0xb5872e));
    slope.rotation.x = sgn * .48; slope.position.set(0, 9.8, sgn * 5.2); grp.add(slope);
  }
  const sign = makeSign('黄金音乐厅', 8, '#3a2a08', '#ffe9a8'); sign.position.set(0, 8.6, 11.2); grp.add(sign);
  const stage = box(16, 1.2, 6, lam(0x8a6238)); stage.position.set(0, 1.2, -7); grp.add(stage);
  boxObs.push({ x1: zn.x - 8, z1: zn.z - 10, x2: zn.x + 8, z2: zn.z - 4 });
  for (let i = 0; i < 5; i++) for (let r = 0; r < 2; r++) {
    const lx = -8 + i * 4, lz = 1 + r * 5;
    const pole = cyl(.1, .1, 2.4, M.gold); pole.position.set(lx, 1.6, lz); grp.add(pole);
    const plate = box(1.6, 1.2, .12, M.gold); plate.rotation.x = -.5; plate.position.set(lx, 3, lz); grp.add(plate);
    addSpot(zn.x + lx, zn.z + lz + 1.8, 'classical', 'stand', { r: 5 }).y = zn.h;
  }
}
/* --- 雪峰营地 --- */
{
  const zn = ZONES3D.find(z => z.key === 'outdoor');
  const cols = [0xc0392b, 0x2980b9, 0xf39c12, 0x27ae60, 0x8e44ad];
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 + .5, rr = 18;
    const x = zn.x + Math.cos(a) * rr, z = zn.z + Math.sin(a) * rr, h = height(x, z);
    const tent = new THREE.Mesh(new THREE.ConeGeometry(3.4, 4.4, 4), lam(cols[i]));
    tent.rotation.y = Math.PI / 4; tent.position.set(x, h + 2.2, z); scene.add(tent);
    cirObs.push({ x, z, r: 3.2 });
    addSpot(x, z + 4.6, 'outdoor', 'tent');
  }
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 - .2, rr = 9;
    const x = zn.x + Math.cos(a) * rr, z = zn.z + Math.sin(a) * rr, h = height(x, z);
    const post = cyl(.2, .2, 2.4, M.woodDark); post.position.set(x, h + 1.2, z); scene.add(post);
    const bd = box(2.6, 1.5, .2, M.wood); bd.position.set(x, h + 2.6, z); scene.add(bd);
    addSpot(x, z, 'outdoor', 'board', { r: 5 });
  }
  // 篝火
  const fx = zn.x, fz = zn.z, fh = height(fx, fz);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(1, 2.6, 7), new THREE.MeshBasicMaterial({ color: 0xf39c12 }));
  flame.position.set(fx, fh + 1.5, fz); scene.add(flame);
  window.__flame = flame;
  fireLight = new THREE.PointLight(0xff9a3c, 0, 70, 2);
  fireLight.position.set(fx, fh + 3, fz); scene.add(fireLight);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2;
    const log = box(2, .4, .4, M.woodDark); log.rotation.y = a; log.position.set(fx + Math.cos(a), fh + .3, fz + Math.sin(a)); scene.add(log);
  }
  cirObs.push({ x: fx, z: fz, r: 1.8 });
  const cSign = makeSign('雪峰营地', 6, '#1e3226', '#bfe8cf');
  const csh = height(zn.x, zn.z + 34);
  cSign.position.set(zn.x, csh + 4.4, zn.z + 34); scene.add(cSign);
  for (const sgn of [-1, 1]) {
    const post = cyl(.15, .15, 4.6, M.woodDark); post.position.set(zn.x + sgn * 2.7, csh + 2.2, zn.z + 34); scene.add(post);
  }
}
/* --- 中央广场 --- */
{
  const zn = ZONES3D[0];
  const b1 = cyl(7, 7.6, 1.2, M.stone); b1.position.set(0, zn.h + .6, 0); scene.add(b1);
  const wat = cyl(6.2, 6.2, .5, new THREE.MeshPhongMaterial({ color: 0x3d9bd6, transparent: true, opacity: .8 }));
  wat.position.set(0, zn.h + 1.1, 0); scene.add(wat);
  const b2 = cyl(1.4, 1.8, 2.6, M.stone); b2.position.set(0, zn.h + 2.2, 0); scene.add(b2);
  cirObs.push({ x: 0, z: 0, r: 7.8 });
  // 路牌
  const post = cyl(.25, .25, 5, M.woodDark); post.position.set(-14, zn.h + 2.5, -10); scene.add(post);
  [['#8e5bd6', 4.2], ['#d35400', 3.4], ['#27ae60', 2.6], ['#2e86ab', 1.8]].forEach(([c, y], i) => {
    const arrow = box(3, .6, .15, lam(c)); arrow.rotation.y = i * .5; arrow.position.set(-14, zn.h + y, -10); scene.add(arrow);
  });
  cirObs.push({ x: -14, z: -10, r: .8 });
  addSpot(-14, -10, 'sign', 'sign', { r: 7 });
}
/* --- 报亭:万神殿日报(广场东南角) --- */
{
  const kx = 38, kz = 52, kh = 6;
  const booth = box(5, 3.4, 4, lam(0x2e7d4f)); booth.position.set(kx, kh + 1.7, kz); scene.add(booth);
  const kroof = box(5.8, .4, 4.8, lam(0x1e5c38)); kroof.position.set(kx, kh + 3.6, kz); scene.add(kroof);
  for (let i = 0; i < 5; i++) {   // 条纹雨棚
    const seg = box(1.05, .18, 1.7, lam(i % 2 ? 0xf5efdc : 0xc0392b));
    seg.rotation.x = .5; seg.position.set(kx - 2.1 + i * 1.05, kh + 3.35, kz + 2.6); scene.add(seg);
  }
  const counter = box(4.6, .3, .9, M.wood); counter.position.set(kx, kh + 1.5, kz + 2.25); scene.add(counter);
  for (let i = 0; i < 3; i++) {   // 一摞摞报纸
    const pp = box(.95, .1, 1.25, lam(0xf0ead8));
    pp.position.set(kx - 1.4 + i * 1.4, kh + 1.72, kz + 2.25); pp.rotation.y = (i - 1) * .18; scene.add(pp);
  }
  const ks = makeSign('万神殿日报', 5.2, '#f0ead8', '#2c2418');
  ks.position.set(kx, kh + 4.5, kz + .3); scene.add(ks);
  boxObs.push({ x1: kx - 2.7, z1: kz - 2.2, x2: kx + 2.7, z2: kz + 2.2 });
  addSpot(kx, kz + 4.4, 'news', 'news', { r: 7 });
}
/* --- 星之碎片(24 枚,收集玩法) --- */
const SHARD_POS = [
  [340, -320], [300, -210], [0, 428], [60, 300], [-60, 300], [230, -40], [280, -140], [190, -200],
  [-250, -60], [-320, 60], [-230, -200], [-160, -90], [-100, -260], [130, -270], [20, -320], [-700, -350],
  [-120, 300], [90, 180], [-90, 160], [-498, -277, 10.8], [150, 90], [-14, -60], [130, 460], [-140, 455],
];
let shardsGot = [];
try { shardsGot = JSON.parse(localStorage.getItem('w1001.shards') || '[]'); } catch (e) { shardsGot = []; }
const shards = [];
{
  const geo = new THREE.OctahedronGeometry(.85, 0);
  SHARD_POS.forEach(([x, z, fy], i) => {
    if (shardsGot.includes(i)) return;
    const h = height(x, z);
    const baseY = fy != null ? fy : (h < 0 ? .7 : h + 1.6);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x7df9ff, transparent: true, opacity: .92 }));
    m.position.set(x, baseY, z);
    scene.add(m);
    const sd = { i, m, x, z, baseY };
    if (baseY < 1.2) {   // 海中碎片:泳镜可见的光柱
      sd.beam = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 30, 8),
        new THREE.MeshBasicMaterial({ color: 0x7df9ff, transparent: true, opacity: .22, depthWrite: false }));
      sd.beam.position.set(x, 15, z); sd.beam.visible = false;
      scene.add(sd.beam);
    }
    shards.push(sd);
  });
}
function updateShardHUD() { const el = $('shardCount'); if (el) el.textContent = shardsGot.length; }
updateShardHUD();
function collectShard(s) {
  shardsGot.push(s.i);
  try { localStorage.setItem('w1001.shards', JSON.stringify(shardsGot)); } catch (e) {}
  scene.remove(s.m);
  if (s.beam) scene.remove(s.beam);
  shards.splice(shards.indexOf(s), 1);
  updateShardHUD();
  earnSB(10);
  blip(880); setTimeout(() => blip(1320), 100);
  const n = shardsGot.length;
  if (n === 8 || n === 16 || n === 24) {
    stars++; saveQuest(); updateQuestHUD();
    toast(`🌟 集齐 ${n} 枚星之碎片,获得 1 颗星!⚡+10`);
  } else {
    toast(`✨ 星之碎片 ${n} / 24 · ⚡+10`);
  }
}

/* --- 散布树 / 岩石 / 花 --- */
{
  let placed = 0, guard = 0;
  while (placed < 60 && guard++ < 1500) {
    const x = rnd() * 900 - 450, z = rnd() * 900 - 450;
    const h = height(x, z);
    if (h < 3 || h > 26) continue;
    if (ZONES3D.some(zn => Math.hypot(x - zn.x, z - zn.z) < zn.r + 8)) continue;
    makeTree(x, z, .8 + rnd() * .7, null); placed++;
  }
  const rockG = new THREE.IcosahedronGeometry(1.6, 0);
  for (let i = 0; i < 40; i++) {
    const x = rnd() * 1000 - 500, z = rnd() * 1000 - 500, h = height(x, z);
    if (h < -1 || (h > 3 && h < 24)) continue;
    const rk = new THREE.Mesh(rockG, M.stone);
    rk.position.set(x, h + .8, z); rk.scale.setScalar(.7 + rnd() * 1.8); rk.rotation.y = rnd() * 3;
    scene.add(rk);
  }
  const flG = new THREE.SphereGeometry(.32, 6, 5);
  for (let i = 0; i < 130; i++) {
    const x = rnd() * 800 - 400, z = rnd() * 800 - 400, h = height(x, z);
    if (h < 2.5 || h > 20) continue;
    if (ZONES3D.some(zn => Math.hypot(x - zn.x, z - zn.z) < zn.r * .6)) continue;
    const f = new THREE.Mesh(flG, lam(['#e8b4c8', '#ffd76a', '#ffffff', '#d94f6b'][i % 4]));
    f.position.set(x, h + .35, z); scene.add(f);
  }
}
/* --- 原野草丛(1 次绘制) --- */
{
  const gGeo = new THREE.ConeGeometry(.28, 1.5, 4);
  const gMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const GN = MOBILE ? 900 : 1600;
  const grass = new THREE.InstancedMesh(gGeo, gMat, GN);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pv = new THREE.Vector3();
  const gc = [new THREE.Color(0x6aa54e), new THREE.Color(0x7cb85e), new THREE.Color(0x5c9a45), new THREE.Color(0x8fc46b)];
  let gi = 0, guard = 0;
  while (gi < GN && guard++ < 9000) {
    const x = rnd() * 860 - 430, z = rnd() * 860 - 430, h = height(x, z);
    if (h < 2.2 || h > 24) continue;
    if (ZONES3D.some(zn => Math.hypot(x - zn.x, z - zn.z) < zn.r * .55)) continue;
    q.setFromEuler(new THREE.Euler(rnd() * .22 - .11, rnd() * Math.PI, rnd() * .22 - .11));
    sc.setScalar(.7 + rnd() * .9);
    m4.compose(pv.set(x, h + .6, z), q, sc);
    grass.setMatrixAt(gi, m4);
    grass.setColorAt(gi, gc[gi % 4]);
    gi++;
  }
  grass.count = gi;
  grass.instanceMatrix.needsUpdate = true;
  if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
  scene.add(grass);
}
/* --- 人物与 NPC --- */
function makePerson(bodyCol, hatCol, opts = {}) {
  const g = new THREE.Group();
  const wide = opts.wide || 1, tall = opts.tall || 1;
  const body = cyl(.5 * wide, .62 * wide, 1.4 * tall, lam(bodyCol)); body.position.y = 1.1 * tall; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.5, 9, 7), lam(0xf2c9a0)); head.position.y = 2.15 * tall; g.add(head);
  if (opts.hat === 'cone') {
    const h = new THREE.Mesh(new THREE.ConeGeometry(.55, .7, 8), lam(hatCol)); h.position.y = 2.75 * tall; g.add(h);
  } else {
    const h = new THREE.Mesh(new THREE.SphereGeometry(.52, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2), lam(hatCol)); h.position.y = 2.3 * tall; g.add(h);
  }
  if (opts.cane) { const c1 = cyl(.05, .05, 1.8, M.woodDark); c1.position.set(.72, .9, .2); g.add(c1); }
  return g;
}
const NPC_HUB3 = [14, 24];
const allNpcs = [];
function addNpc(cfg) {
  const g = makePerson(cfg.body, cfg.hat ?? 0xf5efdc, cfg.opts || {});
  const y = cfg.y != null ? cfg.y : Math.max(height(cfg.x, cfg.z), 0);
  g.position.set(cfg.x, y, cfg.z);
  scene.add(g);
  if (!cfg.wander) cirObs.push({ x: cfg.x, z: cfg.z, r: .9 });
  const bub = document.createElement('div');
  bub.className = 'npcBub hidden'; document.body.appendChild(bub);
  allNpcs.push(Object.assign({ g, bub, idx: -1, talk: false, phase: Math.random() * 6, pause: 1 + Math.random() * 4, wp: null, route: null, leg: 0 }, cfg));
}
/* 驻场人物 */
{
  const hBeers = ZONES3D.find(z => z.key === 'beers').h + .8;
  const hJazz = ZONES3D.find(z => z.key === 'jazz').h + .8;
  const hBooks = ZONES3D.find(z => z.key === 'books').h + .8;
  addNpc({ x: 234, z: 76, y: hBeers, name: '天哥', body: 0x2471a3, hat: 0x1a5276,
    lines: ['来来来,天哥请你喝一杯!', '这家的 IPA,比戈多靠谱多了。', '等戈多的时候,酒不能停。'] });
  addNpc({ x: 247, z: 74, y: hBeers, name: '大肚皮老师', body: 0x9c640c, hat: 0x7d5109, opts: { wide: 1.5 },
    lines: ['我这肚皮,装得下一百零一种精酿。', '世涛要慢慢品,人生要慢慢过。', '别催,戈多来了也得先喝完这杯。'] });
  addNpc({ x: -176, z: 238, y: hJazz, name: '剑敏大师', body: 0x6c3483, hat: 0x4a235a, opts: { tall: 1.08 },
    lines: ['听,这段即兴,像不像剑气?', '《Kind of Blue》,百听不厌。', '爵士的秘诀是留白,武学也是。'] });
  addNpc({ x: 52, z: -222, y: hBooks, name: 'Jackie', body: 0xc0392b, hat: 0xe74c3c,
    lines: ['这本我读了三遍,每遍都不一样。', '想入门?先从《小王子》开始。', '嘘——这里是图书馆哦。'] });
  addNpc({ x: 68, z: -218, y: hBooks, name: '博尔赫斯', body: 0x707b7c, hat: 0x515a5a, opts: { cane: true },
    lines: ['我一直暗暗设想,天堂应该是图书馆的模样。', '我写作,是为了时光流逝使我心安。', '任何一本书,都是一座小径分岔的花园。'] });
  addNpc({ x: 32, z: 57, name: '墨丘利', body: 0x5d7a99, hat: 0xd9b26a,
    lines: ['号外号外!万神殿日报,今日新鲜出炉!', '两个算力币,知晓全岛大事。', '诸神也订这份报,你还在等什么?'] });
  addNpc({ x: 19, z: 214, name: '老装备', body: 0x3e5c46, hat: 0x2c4436,
    lines: ['要下海?先穿上泳衣,冷得很。', '这鱼竿,等得起戈多,更等得起鱼。', '装备上的广告位?去问墨丘利。'] });
}
/* 游荡的文豪(1001books 的作者们,说他们的话) */
const AUTHORS = [
  { name: '鲁迅', body: 0x2c3e50, lines: ['其实地上本没有路,走的人多了,也便成了路。', '愿中国青年都摆脱冷气,只是向上走。'] },
  { name: '海明威', body: 0x784212, lines: ['人可以被毁灭,但不能被打败。', '这个世界如此美好,值得人们为它奋斗。'] },
  { name: '加西亚·马尔克斯', body: 0xb03a2e, lines: ['过去都是假的,回忆是一条没有归途的路。', '生命中所有的灿烂,终要用寂寞偿还。'] },
  { name: '卡夫卡', body: 0x1b2631, lines: ['一本书,必须是劈开我们内心冰海的斧头。', '在你与世界的斗争中,请站在世界这边。'] },
  { name: '加缪', body: 0x21618c, lines: ['在隆冬,我终于知道,我身上有一个不可战胜的夏天。', '登上顶峰的斗争,本身足以充实人的心灵。'] },
  { name: '圣埃克苏佩里', body: 0xca6f1e, lines: ['真正重要的东西,用眼睛是看不见的。', '所有的大人,都曾经是小孩。'] },
];
{
  const wps = Object.entries(TRAVEL3D).filter(([k]) => k !== 'plaza').map(([, v]) => v);
  AUTHORS.forEach((a, i) => addNpc({
    x: NPC_HUB3[0] + (i % 3) * 5 - 5, z: NPC_HUB3[1] + Math.floor(i / 3) * 5,
    name: a.name, body: a.body, hat: 0xf5efdc, opts: { hat: 'cone' },
    lines: a.lines, wander: true, wps,
  }));
}
function updateNpcs3(dt) {
  for (const n of allNpcs) {
    const p = n.g.position;
    if (n.wander) {
      if (n.pause > 0) { n.pause -= dt; }
      else {
        if (!n.wp) {
          const target = n.wps[Math.floor(Math.random() * n.wps.length)];
          n.route = [NPC_HUB3, target]; n.leg = 0; n.wp = n.route[0];
        }
        const dx = n.wp[0] - p.x, dz = n.wp[1] - p.z, d = Math.hypot(dx, dz);
        if (d < 2) {
          if (n.leg === 0) { n.leg = 1; n.wp = n.route[1]; }
          else { n.wp = null; n.pause = 3 + Math.random() * 5; }
        } else {
          const sp = 6.5 * dt;
          p.x += dx / d * sp; p.z += dz / d * sp;
          n.g.rotation.y = Math.atan2(dx, dz);
          n.phase += dt * 9;
        }
      }
      p.y = Math.max(height(p.x, p.z), 0);
    } else { n.phase += dt * 2.2; }
    n.g.children[0].scale.y = 1 + Math.sin(n.phase) * (n.wander && n.wp ? .05 : .02);
    const pd = Math.hypot(player.position.x - p.x, player.position.z - p.z);
    if (pd < 11 && !n.talk) { n.talk = true; n.idx = (n.idx + 1) % n.lines.length; }
    else if (pd > 18) { n.talk = false; }
    if (n.talk) {
      if (!n.wander) {   // 驻场人物转身面向玩家
        const want = Math.atan2(player.position.x - p.x, player.position.z - p.z);
        n.g.rotation.y += ((want - n.g.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 6);
      }
      v3.set(p.x, p.y + 3.8, p.z).project(camera);
      if (v3.z < 1) {
        n.bub.innerHTML = `<b>${n.name}</b>:${n.lines[n.idx]}`;
        n.bub.style.left = ((v3.x + 1) / 2 * innerWidth) + 'px';
        n.bub.style.top = ((1 - v3.y) / 2 * innerHeight) + 'px';
        n.bub.classList.remove('hidden');
      } else n.bub.classList.add('hidden');
    } else n.bub.classList.add('hidden');
  }
}
/* --- 小地图 --- */
const mm = $('minimap'), mctx = mm ? mm.getContext('2d') : null;
let mmBase = null;
function buildMinimapBase() {
  mmBase = document.createElement('canvas'); mmBase.width = mm.width; mmBase.height = mm.height;
  const c = mmBase.getContext('2d');
  const img = c.createImageData(mm.width, mm.height);
  for (let py = 0; py < mm.height; py++) for (let px = 0; px < mm.width; px++) {
    const x = (px / mm.width - .5) * 1900, z = (py / mm.height - .5) * 1425;
    const h = height(x, z);
    let r, g2, b;
    if (h < -.5) { r = 29; g2 = 77; b = 112; }
    else if (h < 1.8) { r = 216; g2 = 200; b = 150; }
    else if (h > 34) { r = 238; g2 = 243; b = 245; }
    else if (h > 26) { r = 141; g2 = 133; b = 119; }
    else { r = 106; g2 = 165; b = 78; }
    const o = (py * mm.width + px) * 4;
    img.data[o] = r; img.data[o + 1] = g2; img.data[o + 2] = b; img.data[o + 3] = 255;
  }
  c.putImageData(img, 0, 0);
}
function renderMinimap() {
  if (!mctx) return;
  if (!mmBase) buildMinimapBase();
  mctx.drawImage(mmBase, 0, 0);
  const W2X = x => (x / 1900 + .5) * mm.width, W2Y = z => (z / 1425 + .5) * mm.height;
  for (const zn of ZONES3D) {
    if (zn.key === 'plaza') continue;
    mctx.fillStyle = CATS[zn.key].color;
    mctx.beginPath(); mctx.arc(W2X(zn.x), W2Y(zn.z), 3, 0, 7); mctx.fill();
  }
  mctx.fillStyle = '#ffe9a8';   // 灯塔
  mctx.beginPath(); mctx.arc(W2X(IS2.x), W2Y(IS2.z), 2.6, 0, 7); mctx.fill();
  // 玩家朝向箭头
  const px = W2X(player.position.x), py = W2Y(player.position.z);
  mctx.save(); mctx.translate(px, py); mctx.rotate(-camYaw);
  mctx.fillStyle = '#fff';
  mctx.beginPath(); mctx.moveTo(0, -5); mctx.lineTo(3.4, 4); mctx.lineTo(-3.4, 4); mctx.closePath(); mctx.fill();
  mctx.restore();
}

/* --- 指南针(顶部罗盘条) --- */
const cpCv = $('compass'), cpCtx = cpCv ? cpCv.getContext('2d') : null;
const CP_MARKS = ZONES3D.filter(z => z.key !== 'plaza').map(z => ({ x: z.x, z: z.z, col: CATS[z.key].color }));
CP_MARKS.push({ x: IS2.x, z: IS2.z, col: '#ffe9a8' });
const CP_CARDS = [['北', Math.PI, '#ff8a7a'], ['东', Math.PI / 2, '#f0ead6'], ['南', 0, '#f0ead6'], ['西', -Math.PI / 2, '#f0ead6']];
function renderCompass() {
  if (!cpCtx) return;
  const W = cpCv.width, H = cpCv.height;
  cpCtx.clearRect(0, 0, W, H);
  const face = camYaw + Math.PI;                       // 相机朝向的方位角
  const span = Math.PI * .85;                          // 可见 ±76°
  const off = a => (a - face + Math.PI * 3) % (Math.PI * 2) - Math.PI;
  cpCtx.textAlign = 'center'; cpCtx.textBaseline = 'middle';
  for (let k = 0; k < 24; k++) {                       // 刻度
    const d = off(k * Math.PI / 12);
    if (Math.abs(d) > span) continue;
    const x = W / 2 + d / span * (W / 2 - 18);
    cpCtx.globalAlpha = (1 - Math.abs(d) / span) * .8;
    cpCtx.fillStyle = '#cfd8bd';
    cpCtx.fillRect(x - 1, 6, 2, k % 6 === 0 ? 10 : 6);
  }
  for (const [txt, ang, col] of CP_CARDS) {            // 四方位
    const d = off(ang);
    if (Math.abs(d) > span) continue;
    const x = W / 2 + d / span * (W / 2 - 18);
    cpCtx.globalAlpha = 1 - Math.abs(d) / span * .55;
    cpCtx.fillStyle = col;
    cpCtx.font = 'bold 19px "Microsoft YaHei", sans-serif';
    cpCtx.fillText(txt, x, 22);
  }
  for (const mk of CP_MARKS) {                         // 各区域方位点
    const d = off(Math.atan2(mk.x - player.position.x, mk.z - player.position.z));
    if (Math.abs(d) > span) continue;
    const x = W / 2 + d / span * (W / 2 - 18);
    cpCtx.globalAlpha = .95;
    cpCtx.fillStyle = mk.col;
    cpCtx.beginPath(); cpCtx.arc(x, 37, 3.6, 0, 7); cpCtx.fill();
  }
  cpCtx.globalAlpha = 1;
  cpCtx.fillStyle = '#ffd76a';                          // 中央准星
  cpCtx.beginPath(); cpCtx.moveTo(W / 2 - 5, 0); cpCtx.lineTo(W / 2 + 5, 0); cpCtx.lineTo(W / 2, 8); cpCtx.closePath(); cpCtx.fill();
}

/* --- 海里的鱼群 & 海鸥 --- */
const seaFish = [];
{
  const cols = Object.values(FISH_COLOR);
  for (let i = 0; i < 24; i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(.5, 2, 6), lam(cols[i % cols.length]));
    body.rotation.z = -Math.PI / 2; g.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(.4, .9, 5), lam(cols[i % cols.length]));
    tail.rotation.z = Math.PI / 2; tail.position.x = -1.3; g.add(tail);
    const cx = (i % 3 - 1) * 60, cz = 430 + (i % 4) * 18;
    g.userData = { cx, cz, rr: 8 + (i * 7) % 30, sp: .3 + (i % 5) * .12, ph: i * .7, dep: -1.2 - (i % 3) };
    scene.add(g); seaFish.push(g);
  }
}
const gulls = [];
{
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group();
    const wl = box(2.2, .1, .5, M.white); wl.position.x = -1.1; g.add(wl);
    const wr = box(2.2, .1, .5, M.white); wr.position.x = 1.1; g.add(wr);
    g.userData = { rr: 160 + i * 60, sp: .1 + i * .02, ph: i * 1.3, hgt: 55 + i * 10, wl, wr };
    scene.add(g); gulls.push(g);
  }
}
/* --- 植物园的蝴蝶 --- */
const flies = [];
{
  const zn = ZONES3D.find(z => z.key === 'plants');
  const cols = [0xe8b4c8, 0xffd76a, 0xffffff, 0xd94f6b];
  for (let i = 0; i < 8; i++) {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: cols[i % 4], side: THREE.DoubleSide });
    const wl = new THREE.Mesh(new THREE.PlaneGeometry(.55, .4), mat); wl.position.x = -.3; g.add(wl);
    const wr = new THREE.Mesh(new THREE.PlaneGeometry(.55, .4), mat); wr.position.x = .3; g.add(wr);
    g.userData = { cx: zn.x + (i % 4) * 18 - 27, cz: zn.z + Math.floor(i / 4) * 24 - 12, ph: i * 1.7, wl, wr };
    scene.add(g); flies.push(g);
  }
}

/* --- 跨海大桥(鲸岛 ⇄ 灯塔屿,可步行) --- */
const BR_A = [-360, -190], BR_B = [-637, -364];
const brDX = BR_B[0] - BR_A[0], brDZ = BR_B[1] - BR_A[1];
const brLen = Math.hypot(brDX, brDZ);
const brAng = Math.atan2(brDX, brDZ);
const deckY = t => 3 + Math.sin(t * Math.PI) * 6;
/* 水族馆栈桥桥面(可行走) */
function pierHeight(x, z) {
  return (Math.abs(x) < 3.2 && z > 346 && z < 427) ? 1.85 : null;
}
function bridgeHeight(x, z) {
  const t = ((x - BR_A[0]) * brDX + (z - BR_A[1]) * brDZ) / (brDX * brDX + brDZ * brDZ);
  if (t < 0 || t > 1) return null;
  const d = Math.hypot(x - (BR_A[0] + brDX * t), z - (BR_A[1] + brDZ * t));
  return d < 4.6 ? deckY(t) : null;
}
{
  const N = 30, segL = brLen / N + .6;
  for (let i = 0; i < N; i++) {
    const t = (i + .5) / N;
    const x = BR_A[0] + brDX * t, z = BR_A[1] + brDZ * t;
    const pitch = -Math.cos(t * Math.PI) * (6 * Math.PI / brLen);
    const seg = box(9.4, .7, segL, M.wood);
    seg.position.set(x, deckY(t), z); seg.rotation.y = brAng; seg.rotation.x = pitch;
    scene.add(seg);
    for (const sgn of [-1, 1]) {
      const rail = box(.35, 1.2, segL, M.woodDark);
      rail.position.set(x + Math.cos(brAng) * 4.5 * sgn, deckY(t) + .95, z - Math.sin(brAng) * 4.5 * sgn);
      rail.rotation.y = brAng; rail.rotation.x = pitch;
      scene.add(rail);
    }
  }
  for (const tt of [.28, .72]) {   // 双塔
    const x = BR_A[0] + brDX * tt, z = BR_A[1] + brDZ * tt;
    for (const sgn of [-1, 1]) {
      const py = cyl(.9, 1.4, 42, lam(0xb03a2e));
      py.position.set(x + Math.cos(brAng) * 5.6 * sgn, 12, z - Math.sin(brAng) * 5.6 * sgn);
      scene.add(py);
    }
    const cross = box(14, 1.3, 1.3, lam(0xb03a2e)); cross.position.set(x, 30, z); cross.rotation.y = brAng + Math.PI / 2; scene.add(cross);
  }
  for (const sgn of [-1, 1]) {     // 主缆
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const x = BR_A[0] + brDX * t + Math.cos(brAng) * 5.6 * sgn;
      const z = BR_A[1] + brDZ * t - Math.sin(brAng) * 5.6 * sgn;
      const dt = Math.min(Math.abs(t - .28), Math.abs(t - .72));
      const y = 32 - Math.min(dt / .28, 1) ** 2 * 21;
      pts.push(new THREE.Vector3(x, y, z));
    }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, .28, 5), lam(0x8c2f24));
    scene.add(tube);
  }
}
/* --- 灯塔屿 --- */
let lightLamp = null, beacon = null;
{
  const bx = IS2.x, bz = IS2.z, bh0 = height(bx, bz);
  const base = cyl(6, 7.2, 3, M.stone); base.position.set(bx, bh0 + 1.2, bz); scene.add(base);
  for (let i = 0; i < 5; i++) {
    const band = cyl(3.4 - i * .16, 3.56 - i * .16, 3.6, lam(i % 2 ? 0xc0392b : 0xf5efdc));
    band.position.set(bx, bh0 + 4.4 + i * 3.5, bz); scene.add(band);
  }
  const lampRoom = cyl(2.2, 2.4, 2.6, new THREE.MeshPhongMaterial({ color: 0xbfe8ff, transparent: true, opacity: .55 }));
  lampRoom.position.set(bx, bh0 + 22.6, bz); scene.add(lampRoom);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(2.9, 2.4, 10), lam(0xc0392b)); cap.position.set(bx, bh0 + 25.1, bz); scene.add(cap);
  lightLamp = new THREE.PointLight(0xfff2b0, 0, 180, 1.8); lightLamp.position.set(bx, bh0 + 22.6, bz); scene.add(lightLamp);
  beacon = new THREE.Mesh(new THREE.PlaneGeometry(80, 2.4), new THREE.MeshBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: 0, side: THREE.DoubleSide }));
  beacon.position.set(bx, bh0 + 22.6, bz); scene.add(beacon);
  cirObs.push({ x: bx, z: bz, r: 4.2 });
  makeTree(bx + 24, bz + 16, 1.1, null); makeTree(bx - 20, bz + 24, .9, null); makeTree(bx + 8, bz - 28, 1.2, null);
  const sg = makeSign('灯塔屿', 5.5, '#12242e', '#bfe8ff');
  sg.position.set(bx + 14, height(bx + 14, bz + 30) + 3.6, bz + 30); scene.add(sg);
}
/* --- 海上的船 --- */
const boats = [];
function makeBoat(sailCol, scale = 1) {
  const g = new THREE.Group();
  const hull = box(7 * scale, 1.6 * scale, 2.6 * scale, lam(0x7a4a26));
  hull.position.y = .5 * scale; g.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(1.3 * scale, 2.6 * scale, 4), lam(0x7a4a26));
  bow.rotation.z = -Math.PI / 2; bow.position.set(4.6 * scale, .5 * scale, 0); g.add(bow);
  if (sailCol) {
    const mast = cyl(.13, .16, 7.5 * scale, M.woodDark); mast.position.y = 4.4 * scale; g.add(mast);
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(3.4 * scale, 4.8 * scale),
      new THREE.MeshLambertMaterial({ color: sailCol, side: THREE.DoubleSide }));
    sail.position.set(1.9 * scale, 4.6 * scale, 0); g.add(sail);
  }
  scene.add(g); boats.push(g); return g;
}
makeBoat(0xf5efdc, 1.25).userData = { cruise: { cx: 380, cz: 480, r: 155, sp: .12, ph: 0 } };
makeBoat(0xd94f6b, 1).userData = { cruise: { cx: 380, cz: 480, r: 105, sp: -.17, ph: 2.2 } };
makeBoat(0xffd76a, 1.1).userData = { anchor: [-350, 300] };
makeBoat(null, .7).userData = { anchor: [14, 408] };   // 栈桥边的小舢板
/* 喷水孔的水雾(周期性喷发) */
const spray = new THREE.Mesh(new THREE.ConeGeometry(2.2, 7, 9),
  new THREE.MeshBasicMaterial({ color: 0xeafaff, transparent: true, opacity: 0, depthWrite: false }));
spray.position.set(WHALE_BLOW.x, 3, WHALE_BLOW.z);
scene.add(spray);

/* --- 千岛装备行(去水族馆的路边) --- */
{
  const sx = 26, szz = 218, sh = height(26, 218);
  const stall = box(6, .5, 4, M.wood); stall.position.set(sx, sh + 1.4, szz); scene.add(stall);   // 柜台
  for (const [ox, oz] of [[-2.6, -1.6], [2.6, -1.6], [-2.6, 1.6], [2.6, 1.6]]) {
    const post = cyl(.18, .22, 4.6, M.woodDark); post.position.set(sx + ox, sh + 2.3, szz + oz); scene.add(post);
  }
  for (let i = 0; i < 6; i++) {   // 条纹雨棚
    const seg = box(1.15, .16, 4.6, lam(i % 2 ? 0x2c7a4b : 0xf5efdc));
    seg.position.set(sx - 2.9 + i * 1.16, sh + 4.7, szz); scene.add(seg);
  }
  // 货品:泳衣色布卷 / 靴子箱 / 鱼竿
  const roll = cyl(.5, .5, 1.6, lam(0xe8702a)); roll.rotation.z = Math.PI / 2; roll.position.set(sx - 1.6, sh + 2, szz); scene.add(roll);
  const crate = box(1.2, 1, 1.2, lam(0x7a5230)); crate.position.set(sx + .4, sh + 2.1, szz); scene.add(crate);
  const rodM = cyl(.05, .05, 3.6, M.woodDark); rodM.rotation.z = .5; rodM.position.set(sx + 2, sh + 3, szz); scene.add(rodM);
  const ssign = makeSign('千岛装备行', 5.4, '#1e3a2a', '#9fe8b8'); ssign.position.set(sx, sh + 5.6, szz + .3); scene.add(ssign);
  boxObs.push({ x1: sx - 3.2, z1: szz - 2.2, x2: sx + 3.2, z2: szz + 2.2 });
  addSpot(sx, szz + 4.4, 'shop', 'shop', { r: 7.5 });
}

/* --- 钓鱼系统(栈桥尽头 / 西湾滩头) --- */
const FSPOTS = [
  { x: 0, z: 421, bx: 0, bz: 442 },        // 栈桥尽头
  { x: -340, z: 295, bx: -368, bz: 322 },  // 西湾(黄帆船旁)
];
const fishing = { state: 'idle', t: 0, spot: null };
const bobber = new THREE.Group();
{
  const top = new THREE.Mesh(new THREE.SphereGeometry(.32, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xd94040 }));
  const bot = new THREE.Mesh(new THREE.SphereGeometry(.32, 8, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf5efdc }));
  bobber.add(top, bot);
  bobber.visible = false;
  scene.add(bobber);
}
const FISH_PRICE = { deep: 9, rare: 9, pelagic: 7, special: 6, reef: 5 };
function startCast(fs) {
  fishing.state = 'wait'; fishing.spot = fs;
  fishing.t = 2.2 + Math.random() * 4.5;
  bobber.position.set(fs.bx, .35, fs.bz); bobber.visible = true;
  blip(440);
}
function endFishing() { fishing.state = 'idle'; fishing.spot = null; bobber.visible = false; }
function catchFish() {
  const f = D.fish[Math.floor(Math.random() * D.fish.length)];
  const price = (FISH_PRICE[f.cat] || 4) + (gearOn('rod') ? 2 : 0);
  openCard({ cat: 'fish', type: 'tank', item: f });   // 收进图鉴(+2)
  earnSB(price);
  toast(`🎣 钓到了「${f.name}」!卖给水族馆 ⚡+${price}`);
  blip(880); setTimeout(() => blip(1180), 110);
  endFishing();
}
function updateFishing(dt, t) {
  if (fishing.state === 'idle') return;
  fishing.t -= dt;
  if (fishing.state === 'wait') {
    bobber.position.y = .35 + Math.sin(t * 2.2) * .1;
    if (fishing.t <= 0) { fishing.state = 'bite'; fishing.t = gearOn('rod') ? 2.1 : 1.15; blip(1400); }
  } else if (fishing.state === 'bite') {
    bobber.position.y = -.25 + Math.sin(t * 18) * .12;   // 猛沉
    if (fishing.t <= 0) { toast('💨 鱼跑了……再试一次'); blip(260); endFishing(); }
  }
}

/* ---------- 玩家 ---------- */
const player = new THREE.Group();
{
  const body = cyl(.55, .68, 1.5, lam(0x3b6ea5)); body.position.y = 1.2; player.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.55, 10, 8), lam(0xf2c9a0)); head.position.y = 2.35; player.add(head);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.58, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), lam(0xc0392b));
  cap.position.y = 2.5; player.add(cap);
  const brim = box(.7, .1, .5, lam(0xc0392b)); brim.position.set(0, 2.5, .62); player.add(brim);
  const pack = box(.9, 1.1, .5, lam(0x7a5230)); pack.position.set(0, 1.5, -.62); player.add(pack);
  lantern = new THREE.PointLight(0xffc978, 0, 22, 2);
  lantern.position.set(0, 2.6, .6); player.add(lantern);
}
const blob = new THREE.Mesh(new THREE.CircleGeometry(1, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .3 }));
blob.rotation.x = -Math.PI / 2; scene.add(blob);
player.position.set(0, height(0, 14) + .1, 14);
scene.add(player);
let vy = 0, grounded = true, swimming = false, walkPhase = 0, faceYaw = 0;
/* 恢复上次位置 */
try {
  const sv = JSON.parse(localStorage.getItem('w1001.pos3d') || 'null');
  if (Array.isArray(sv) && sv.every(Number.isFinite) && Math.hypot(sv[0], sv[1]) < 1020) {
    player.position.set(sv[0], Math.max(height(sv[0], sv[1]), 0) + .5, sv[1]);
  }
} catch (e) {}

/* ---------- 相机与输入 ---------- */
let camYaw = Math.PI, camPitch = .42, camDist = 15;
const keys = {};
let joy = { on: false, vx: 0, vy: 0 }, photoMode = false;
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'escape') { closeModals(); return; }
  if (k === 'j') { modalOpen && !$('journal').classList.contains('hidden') ? closeModals() : openJournal(); return; }
  if (k === 'h') { $('intro').classList.remove('hidden'); return; }
  if (k === 'p') {   // 照片模式:隐藏全部 UI
    photoMode = !photoMode;
    for (const id of ['hud', 'minimap', 'compass', 'hint']) $(id).style.visibility = photoMode ? 'hidden' : '';
    if (!photoMode) toast('已退出照片模式');
    return;
  }
  if (modalOpen) { if (k === 'e' || k === 'enter') closeModals(); return; }
  if (k === 'e' || k === 'enter') { tryInteract(); return; }
  if (k === ' ') { e.preventDefault(); if (grounded && !swimming) vy = gearOn('boots') ? 13.4 : 11.5; return; }
  if (k === 'b') { modalOpen ? closeModals() : openBag(); return; }
  keys[k] = true;
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
let nearSpot = null, nearFspot = null;
function tryInteract() {
  if (fishing.state === 'bite') { catchFish(); return; }
  if (fishing.state === 'wait') { toast('收竿了,今天鱼不咬钩'); endFishing(); return; }
  if (nearSpot) { openCard(nearSpot); return; }
  if (nearFspot) startCast(nearFspot);
}
hintEl.addEventListener('click', tryInteract);
$('btnAct').addEventListener('click', () => { modalOpen ? closeModals() : tryInteract(); });

const isTouch = matchMedia('(pointer: coarse)').matches;
if (isTouch) $('btnAct').classList.remove('hidden');
const stick = $('stick'), knob = $('stickKnob');
let stickBase = null, dragCam = null;
addEventListener('pointerdown', e => {
  if (modalOpen || e.target.closest('button,#hint,#hud,.overlay')) return;
  if (isTouch && e.clientX < innerWidth * .45) {
    stickBase = { x: e.clientX, y: e.clientY, id: e.pointerId };
    stick.style.left = (e.clientX - 55) + 'px'; stick.style.top = (e.clientY - 55) + 'px';
    stick.classList.remove('hidden'); joy.on = true;
  } else {
    dragCam = { x: e.clientX, y: e.clientY, id: e.pointerId };
  }
});
addEventListener('pointermove', e => {
  if (stickBase && e.pointerId === stickBase.id) {
    let dx = e.clientX - stickBase.x, dy = e.clientY - stickBase.y;
    const d = Math.hypot(dx, dy), max = 46;
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    joy.vx = dx / max; joy.vy = dy / max;
  } else if (dragCam && e.pointerId === dragCam.id) {
    camYaw -= (e.clientX - dragCam.x) * .005;
    camPitch = clamp(camPitch + (e.clientY - dragCam.y) * .004, .08, 1.25);
    dragCam.x = e.clientX; dragCam.y = e.clientY;
  }
});
const endPtr = e => {
  if (stickBase && e.pointerId === stickBase.id) {
    stickBase = null; joy = { on: false, vx: 0, vy: 0 };
    knob.style.transform = 'translate(-50%,-50%)'; stick.classList.add('hidden');
  }
  if (dragCam && e.pointerId === dragCam.id) dragCam = null;
};
addEventListener('pointerup', endPtr); addEventListener('pointercancel', endPtr);
addEventListener('wheel', e => { camDist = clamp(camDist * (1 + e.deltaY * .001), 7, 30); }, { passive: true });

/* ---------- 主循环 ---------- */
const HINTS = { painting: '欣赏这幅画', shelf: '翻翻这架书', tree: '观察这只鸟', bed: '看看这株植物', bar: '来一杯!', keg: '看看这桶酒', table: '看看桌上的酒', tank: '看看水里', crate: '翻翻唱片', stand: '听听这份录音', tent: '参观营地', board: '查看路线', sign: '查看路牌', news: '万神殿日报(2 SB)', shop: '逛逛装备行' };
const clock = new THREE.Clock();
const v3 = new THREE.Vector3();
let saveT = 0, whaleT = 20, coldT = 0, lastTint = 0x3b6ea5;
/* 鲸鸣:低频滑音 */
function whaleCall() {
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = 'sine';
  const t0 = actx.currentTime;
  o.frequency.setValueAtTime(70, t0);
  o.frequency.exponentialRampToValueAtTime(180, t0 + 1.4);
  o.frequency.exponentialRampToValueAtTime(55, t0 + 3.2);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(.07, t0 + .6);
  g.gain.exponentialRampToValueAtTime(.0008, t0 + 3.4);
  o.connect(g).connect(actx.destination);
  o.start(t0); o.stop(t0 + 3.5);
}
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), .05);
  const t = clock.elapsedTime;

  /* 移动 */
  if (!modalOpen) {
    let mx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
    let mz = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
    if (joy.on) { mx = joy.vx; mz = joy.vy; }
    const len = Math.hypot(mx, mz);
    if (len > .15) {
      mx /= Math.max(len, 1); mz /= Math.max(len, 1);
      const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
      const rx = -fz, rz = fx;
      const sp = (swimming ? (gearOn('swim') ? 7.5 : 3.2) : (keys.shift ? (gearOn('boots') ? 26 : 22) : 14)) * dt;
      let dx = (fx * -mz + rx * mx) * sp, dz = (fz * -mz + rz * mx) * sp;
      player.position.x += dx; player.position.z += dz;
      faceYaw = Math.atan2(dx, dz);
      walkPhase += dt * 10;
    }
    // 边界
    const pd = Math.hypot(player.position.x, player.position.z);
    if (pd > 1020) { player.position.x *= 1020 / pd; player.position.z *= 1020 / pd; }
    // 障碍推离
    const pr = .9;
    for (const o of cirObs) {
      const dx = player.position.x - o.x, dz = player.position.z - o.z, d = Math.hypot(dx, dz), min = o.r + pr;
      if (d < min && d > .001) { player.position.x = o.x + dx / d * min; player.position.z = o.z + dz / d * min; }
    }
    for (const o of boxObs) {
      const px = player.position.x, pz = player.position.z;
      if (px > o.x1 - pr && px < o.x2 + pr && pz > o.z1 - pr && pz < o.z2 + pr) {
        const dl = px - (o.x1 - pr), drr = (o.x2 + pr) - px, dtp = pz - (o.z1 - pr), db = (o.z2 + pr) - pz;
        const m = Math.min(dl, drr, dtp, db);
        if (m === dl) player.position.x = o.x1 - pr; else if (m === drr) player.position.x = o.x2 + pr;
        else if (m === dtp) player.position.z = o.z1 - pr; else player.position.z = o.z2 + pr;
      }
    }
  }
  /* 重力 / 游泳(桥面可行走) */
  let gh = height(player.position.x, player.position.z);
  const bh = bridgeHeight(player.position.x, player.position.z);
  if (bh != null && player.position.y > bh - 1.6) gh = Math.max(gh, bh);
  const ph2 = pierHeight(player.position.x, player.position.z);
  if (ph2 != null && player.position.y > ph2 - 1.4) gh = Math.max(gh, ph2);
  swimming = gh < -.6;
  if (swimming) {
    vy = 0; grounded = false;
    player.position.y += ((-.55) - player.position.y) * Math.min(1, dt * 6);
    player.rotation.x = Math.sin(t * 2.4) * .06;
  } else {
    player.rotation.x = 0;
    vy -= 34 * dt;
    player.position.y += vy * dt;
    if (player.position.y <= gh) { player.position.y = gh; vy = 0; grounded = true; } else grounded = false;
  }
  player.rotation.y += ((faceYaw - player.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 10);
  player.children[0].scale.y = 1 + (grounded ? Math.sin(walkPhase) * .04 : 0);
  blob.position.set(player.position.x, Math.max(gh, 0) + .06, player.position.z);
  blob.material.opacity = swimming ? 0 : .3;

  /* 相机 */
  const cp = camPitch, off = new THREE.Vector3(Math.sin(camYaw) * Math.cos(cp), Math.sin(cp), Math.cos(camYaw) * Math.cos(cp)).multiplyScalar(camDist);
  const target = v3.copy(player.position).add(off);
  target.y = Math.max(target.y, height(target.x, target.z) + 1.4, .8);
  camera.position.lerp(target, Math.min(1, dt * 8));
  camera.lookAt(player.position.x, player.position.y + 2.4, player.position.z);

  /* 动画:水 / 云 / 鱼 / 海鸥 / 篝火 / 鸟 */
  if (oceanWater) oceanWater.material.uniforms.time.value = t * .55;
  if (waterGeo) {
    const wp = waterGeo.attributes.position;
    for (let i = 0; i < wp.count; i += 3) {
      wp.setY(i, Math.sin(t * 1.4 + wp.getX(i) * .02 + wp.getZ(i) * .017) * .5);
    }
    wp.needsUpdate = true;
  }
  for (const c of clouds) { c.position.x += dt * 2.2; if (c.position.x > 850) c.position.x = -850; }
  for (const f of seaFish) {
    const u = f.userData;
    const a = t * u.sp + u.ph;
    f.position.set(u.cx + Math.cos(a) * u.rr, u.dep + Math.sin(t * 1.3 + u.ph) * .3, u.cz + Math.sin(a) * u.rr);
    f.rotation.y = -a - Math.PI / 2;
  }
  for (const g of gulls) {
    const u = g.userData, a = t * u.sp + u.ph;
    g.position.set(Math.cos(a) * u.rr, u.hgt + Math.sin(t + u.ph) * 3, Math.sin(a) * u.rr);
    g.rotation.y = -a;
    u.wl.rotation.z = Math.sin(t * 9 + u.ph) * .5; u.wr.rotation.z = -Math.sin(t * 9 + u.ph) * .5;
  }
  if (window.__flame) window.__flame.scale.setScalar(1 + Math.sin(t * 9) * .18);
  for (const s of spots) if (s.birdRef) s.birdRef.position.y = 12.7 + Math.sin(t * 2 + s.x) * .18;
  /* 星之碎片:旋转 + 浮动 + 拾取 */
  for (let i = shards.length - 1; i >= 0; i--) {
    const s = shards[i];
    s.m.rotation.y += dt * 2.2;
    s.m.position.y = s.baseY + Math.sin(t * 2 + s.i) * .3;
    if (s.beam) s.beam.visible = gearOn('goggles');
    const d2 = (s.x - player.position.x) ** 2 + (s.z - player.position.z) ** 2;
    if (d2 < 12 && Math.abs(s.baseY - player.position.y) < 6) collectShard(s);
  }
  /* 蝴蝶 */
  for (const f of flies) {
    const u = f.userData;
    const fx = u.cx + Math.sin(t * .5 + u.ph) * 9, fz = u.cz + Math.cos(t * .37 + u.ph) * 7;
    f.position.set(fx, Math.max(height(fx, fz), 0) + 2.2 + Math.sin(t * 1.3 + u.ph) * .5, fz);
    f.rotation.y = t * .5 + u.ph + Math.PI / 2;
    u.wl.rotation.y = Math.sin(t * 14 + u.ph) * .8;
    u.wr.rotation.y = -Math.sin(t * 14 + u.ph) * .8;
  }
  /* 船只起伏 / 巡航 */
  for (const b of boats) {
    const u = b.userData;
    if (u.cruise) {
      const a = t * u.cruise.sp + u.cruise.ph;
      b.position.set(u.cruise.cx + Math.cos(a) * u.cruise.r, Math.sin(t * 1.1 + a) * .3, u.cruise.cz + Math.sin(a) * u.cruise.r);
      b.rotation.y = -a - Math.PI / 2 * Math.sign(u.cruise.sp);
    } else {
      b.position.set(u.anchor[0], Math.sin(t * 1.2 + u.anchor[0]) * .35, u.anchor[1]);
      b.rotation.y = Math.sin(t * .18 + u.anchor[1]) * .5;
    }
    b.rotation.z = Math.sin(t * 1.4 + b.position.x) * .05;
  }
  /* 海浪声强度 */
  if (waveGain) {
    const target = clamp(1 - Math.abs(gh) / 7, 0, 1) * .05;
    waveGain.gain.value += (target - waveGain.gain.value) * Math.min(1, dt * 3);
  }
  /* 位置存档(每 3 秒) */
  saveT += dt;
  if (saveT > 3) {
    saveT = 0;
    try { localStorage.setItem('w1001.pos3d', JSON.stringify([+player.position.x.toFixed(1), +player.position.z.toFixed(1)])); } catch (e) {}
  }
  /* 鲸的喷水孔喷雾 */
  {
    const cyc = t % 9;
    if (cyc < 1.6) {
      const k = cyc / 1.6;
      spray.material.opacity = Math.sin(k * Math.PI) * .7;
      spray.scale.set(1 + k * 1.3, .4 + k * 1.8, 1 + k * 1.3);
      spray.position.y = 2 + k * 5;
    } else spray.material.opacity = 0;
  }
  updateFishing(dt, t);
  /* 泳衣:受寒提示 + 换装配色 */
  if (swimming && !gearOn('swim')) {
    coldT += dt;
    if (coldT > 7) { coldT = 0; toast('🥶 好冷!没泳衣游不快——去千岛装备行看看'); }
  } else coldT = 0;
  const tint = swimming && gearOn('swim') ? 0xe8702a : 0x3b6ea5;
  if (tint !== lastTint) { lastTint = tint; player.children[0].material.color.set(tint); }
  /* 夜半鲸鸣(靠近喷水孔) */
  whaleT -= dt;
  if (whaleT <= 0) {
    whaleT = 34 + Math.random() * 30;
    if (actx && musicOn && Math.hypot(player.position.x - WHALE_BLOW.x, player.position.z - WHALE_BLOW.z) < 150) whaleCall();
  }
  updateNpcs3(dt);
  updateDayNight(t);
  renderMinimap();
  renderCompass();

  /* 最近藏品点 + 提示 */
  nearSpot = null; nearFspot = null; let best = 1e9;
  for (const s of spots) {
    const d2 = (s.x - player.position.x) ** 2 + (s.z - player.position.z) ** 2;
    if (d2 < s.r * s.r && d2 < best && Math.abs((s.y ?? 0) - player.position.y) < 8) { best = d2; nearSpot = s; }
  }
  for (const fs of FSPOTS) {
    if ((fs.x - player.position.x) ** 2 + (fs.z - player.position.z) ** 2 < 36) nearFspot = fs;
  }
  let hintTxt = null, hx = 0, hy = 0, hz = 0;
  if (fishing.state === 'bite') { hintTxt = '❗收竿!'; hx = bobber.position.x; hy = 2.4; hz = bobber.position.z; }
  else if (fishing.state === 'wait') { hintTxt = '…等鱼上钩(E 收竿)'; hx = bobber.position.x; hy = 2.4; hz = bobber.position.z; }
  else if (nearSpot) { hintTxt = HINTS[nearSpot.type] || '看看'; hx = nearSpot.x; hy = (nearSpot.y ?? height(nearSpot.x, nearSpot.z)) + 5.2; hz = nearSpot.z; }
  else if (nearFspot) { hintTxt = '🎣 抛竿钓鱼'; hx = nearFspot.bx; hy = 3; hz = nearFspot.bz; }
  if (hintTxt && !modalOpen) {
    v3.set(hx, hy, hz).project(camera);
    if (v3.z < 1) {
      hintEl.innerHTML = `<kbd>E</kbd>${hintTxt}`;
      hintEl.style.left = ((v3.x + 1) / 2 * innerWidth) + 'px';
      hintEl.style.top = ((1 - v3.y) / 2 * innerHeight) + 'px';
      hintEl.classList.remove('hidden');
    } else hintEl.classList.add('hidden');
  } else hintEl.classList.add('hidden');

  /* 区域侦测(HUD + 音乐) */
  let hereKey = null;
  for (const zn of ZONES3D) {
    if (zn.key !== 'plaza' && Math.hypot(player.position.x - zn.x, player.position.z - zn.z) < zn.r) { hereKey = zn.key; break; }
  }
  const mz2 = swimming ? 'fish' : (hereKey || 'street');
  if (mz2 !== musicZone) { musicZone = mz2; melIdx = 3; }
  const onIsle2 = Math.hypot(player.position.x - IS2.x, player.position.z - IS2.z) < IS2.r + 10;
  const onBridge = !swimming && bh != null && Math.abs(player.position.y - bh) < 3;
  $('zoneIcon').textContent = swimming ? '🌊' : (hereKey ? CATS[hereKey].icon : (onBridge ? '🌉' : (onIsle2 ? '🗼' : '🧭')));
  $('zoneName').textContent = swimming ? '大海' : (hereKey ? CATS[hereKey].name : (onBridge ? '跨海大桥' : (onIsle2 ? '灯塔屿' : '鲸背旷野')));

  if (composer) composer.render(); else renderer.render(scene, camera);
}
/* 阴影开关(桌面):不透明网格投/受阴影,天空与水面除外 */
if (!MOBILE) {
  scene.traverse(o => {
    if (o.isMesh && o.material && !o.material.transparent) { o.castShadow = true; o.receiveShadow = true; }
  });
  sky.castShadow = sky.receiveShadow = false;
  if (oceanWater) { oceanWater.castShadow = false; oceanWater.receiveShadow = false; }
}
loop();

window.__w3d = { player, spots, TRAVEL3D, openCard, openJournal, seen, height, camera, scene, allNpcs, shards, collectShard, boats, bridgeHeight, islandMask, spendSB, earnSB, sb: () => sb, paperHTML, fishing, startCast, catchFish, FSPOTS, pierHeight, GEAR, gear, gearOn, openBag };
