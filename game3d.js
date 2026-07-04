/* ============================================================
   1001 世界 3D · Isle of 1001 — 荒野之息风低多边形海岛
   Three.js 三维开放世界:雪山 · 平原 · 大海 · 九大收藏区域
   与 2D 版共用 world-data.js;进度按账号(本机多档)隔离保存。
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

/* ---------- 账号系统(本机多档,进度按账号隔离) ---------- */
const RAWLS = window.localStorage;
let PROFILE_ID = '';
try { PROFILE_ID = RAWLS.getItem('w1001.profile') || ''; } catch (e) {}
const nsKey = k => (PROFILE_ID && k.startsWith('w1001.')) ? `w1001.p_${PROFILE_ID}.${k.slice(6)}` : k;
const PSTORE = {
  getItem: k => RAWLS.getItem(nsKey(k)),
  setItem: (k, v) => RAWLS.setItem(nsKey(k), v),
  removeItem: k => RAWLS.removeItem(nsKey(k)),
};
function profileList() { try { return JSON.parse(RAWLS.getItem('w1001.profiles') || '[]'); } catch (e) { return []; } }
function saveProfiles(l) { try { RAWLS.setItem('w1001.profiles', JSON.stringify(l)); } catch (e) {} }
function curProfileName() {
  if (!PROFILE_ID) return '旅人(本机默认)';
  const p = profileList().find(x => x.id === PROFILE_ID);
  return p ? p.name : '未知账号';
}
const SAVE_FIELDS = ['seen.v1', 'stars', 'quest', 'shards', 'pos3d', 'sb', 'drinks', 'paper', 'paper2', 'gear', 'ring', 'house', 'dbl'];

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
const TRU = { x: 760, z: 560, r: 135 };     // 楚门的世界(多元宇宙 1 号岛)
const MID = { x: -150, z: -700, r: 170 };   // 中土(多元宇宙 2 号岛)
const VOL = { x: -50, z: -700 };            // 末日火山
const HOG = { x: 660, z: -560, r: 150 };    // 霍格沃茨(多元宇宙 3 号岛)
const MOB = { x: 120, z: 800, r: 130 };     // 莫比·迪克(多元宇宙 4 号岛)
const SPT = { x: -780, z: 120, r: 130 };    // 体育岛(多元宇宙 5 号岛)
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
  m = Math.max(m, (1 - Math.hypot(x - TRU.x, z - TRU.z) / TRU.r) * 1.8);  // 楚门的世界·桃源岛
  m = Math.max(m, (1 - Math.hypot(x - MID.x, z - MID.z) / MID.r) * 1.8);  // 中土
  m = Math.max(m, (1 - Math.hypot(x - HOG.x, z - HOG.z) / HOG.r) * 1.8);  // 霍格沃茨
  m = Math.max(m, (1 - Math.hypot(x - MOB.x, z - MOB.z) / MOB.r) * 1.8);  // 南塔开特捕鲸港
  m = Math.max(m, (1 - Math.hypot(x - SPT.x, z - SPT.z) / SPT.r) * 1.8);  // 体育岛
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
  const td = Math.hypot(x - TRU.x, z - TRU.z);         // 桃源岛小镇整平
  const tw = smooth01(clamp(1 - td / 62, 0, 1));
  h = h * (1 - tw * .92) + 7 * tw * .92;
  const dd3 = Math.hypot(x - 618, z - 560);            // 天空之门前的浅滩
  const dw3 = smooth01(clamp(1 - dd3 / 16, 0, 1));
  h = h * (1 - dw3 * .9) + 1.6 * dw3 * .9;
  const sh2 = Math.hypot(x + 230, z + 690);            // 夏尔缓丘整平
  const sw2 = smooth01(clamp(1 - sh2 / 70, 0, 1));
  h = h * (1 - sw2 * .85) + 8 * sw2 * .85;
  h += smooth01(clamp(1 - Math.hypot(x - VOL.x, z - VOL.z) / 70, 0, 1)) ** 2 * 30;   // 末日火山
  const mdk = Math.hypot(x + 150, z + 552);            // 中土渡口浅滩
  const mdw = smooth01(clamp(1 - mdk / 18, 0, 1));
  h = h * (1 - mdw * .96) + 2.2 * mdw * .96;
  // 霍格沃茨:城堡山丘 / 车站台地 / 魁地奇球场 / 黑湖
  const hgc = Math.hypot(x - 690, z + 592);
  h = h * (1 - smooth01(clamp(1 - hgc / 52, 0, 1)) * .9) + 16 * smooth01(clamp(1 - hgc / 52, 0, 1)) * .9;
  const hgs = Math.hypot(x - 585, z + 495);
  h = h * (1 - smooth01(clamp(1 - hgs / 24, 0, 1)) * .92) + 3.2 * smooth01(clamp(1 - hgs / 24, 0, 1)) * .92;
  const hgp = Math.hypot(x - 735, z + 505);
  h = h * (1 - smooth01(clamp(1 - hgp / 30, 0, 1)) * .9) + 10 * smooth01(clamp(1 - hgp / 30, 0, 1)) * .9;
  h -= smooth01(clamp(1 - Math.hypot(x - 600, z + 628) / 20, 0, 1)) * 10;   // 黑湖
  const mss = Math.hypot(x - 140, z + 80);             // 主岛 9¾ 车站台地
  h = h * (1 - smooth01(clamp(1 - mss / 24, 0, 1)) * .9) + 6.5 * smooth01(clamp(1 - mss / 24, 0, 1)) * .9;
  const mbt = Math.hypot(x - MOB.x, z - MOB.z);        // 南塔开特港镇整平
  h = h * (1 - smooth01(clamp(1 - mbt / 52, 0, 1)) * .88) + 6 * smooth01(clamp(1 - mbt / 52, 0, 1)) * .88;
  const mbf = Math.hypot(x - 120, z - 697);            // 渡口浅滩(北岸)
  h = h * (1 - smooth01(clamp(1 - mbf / 18, 0, 1)) * .95) + 2.2 * smooth01(clamp(1 - mbf / 18, 0, 1)) * .95;
  const spf = Math.hypot(x - SPT.x, z - SPT.z);        // 体育岛整平(球场基座)
  h = h * (1 - smooth01(clamp(1 - spf / 72, 0, 1)) * .92) + 6 * smooth01(clamp(1 - spf / 72, 0, 1)) * .92;
  const spd2 = Math.hypot(x + 678, z - 120);           // 体育岛渡口浅滩(东岸)
  h = h * (1 - smooth01(clamp(1 - spd2 / 18, 0, 1)) * .95) + 2.2 * smooth01(clamp(1 - spd2 / 18, 0, 1)) * .95;
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
try { seen = JSON.parse(PSTORE.getItem('w1001.seen.v1') || '{}'); } catch (e) { seen = {}; }
for (const k in CATS) if (!Array.isArray(seen[k])) seen[k] = [];
const seenCount = () => Object.values(seen).reduce((a, v) => a + v.length, 0);
$('seenCount').textContent = seenCount();

/* --- 今日委托(共用存档) --- */
const QUEST_TPL = {
  art: [3, '在美术馆欣赏 3 幅名画'], birds: [3, '在百鸟林认识 3 种鸟'], plants: [3, '在植物园看 3 株植物'],
  beers: [2, '在酒馆品尝 2 款新精酿'], fish: [3, '在水族馆认识 3 种鱼'], jazz: [2, '在爵士俱乐部听 2 张唱片'],
  classical: [2, '在音乐厅听 2 份录音'], books: [2, '在图书馆翻 2 本书'], outdoor: [2, '在营地了解 2 种玩法'],
};
let quest = null, stars = parseInt(PSTORE.getItem('w1001.stars') || '0', 10) || 0;
function saveQuest() { try { PSTORE.setItem('w1001.quest', JSON.stringify(quest)); PSTORE.setItem('w1001.stars', String(stars)); } catch (e) {} }
function initQuest() {
  const today = new Date().toISOString().slice(0, 10);
  try { quest = JSON.parse(PSTORE.getItem('w1001.quest')); } catch (e) { quest = null; }
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
let sb = parseInt(PSTORE.getItem('w1001.sb') ?? 'x', 10);
if (!Number.isFinite(sb)) sb = 101;   // 新玩家启动资金
let drinks = parseInt(PSTORE.getItem('w1001.drinks') || '0', 10) || 0;
function saveSB() { try { PSTORE.setItem('w1001.sb', String(sb)); PSTORE.setItem('w1001.drinks', String(drinks)); } catch (e) {} }
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
try { const g0 = JSON.parse(PSTORE.getItem('w1001.gear') || 'null'); if (g0 && Array.isArray(g0.owned) && Array.isArray(g0.on)) gear = g0; } catch (e) {}
function saveGear() { try { PSTORE.setItem('w1001.gear', JSON.stringify(gear)); } catch (e) {} }
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

/* --- 账号管理界面 --- */
function accountCard() {
  const list = profileList();
  const rows = [{ id: '', name: '旅人(本机默认)' }, ...list].map(p => {
    const cur = p.id === PROFILE_ID;
    return `<div class="gRow"><div class="gi">${cur ? '👤' : '·'}</div>
      <div class="gInfo"><b>${esc(p.name)}</b>${cur ? ' <span style="color:#2c7a4b;font-size:12px">当前账号</span>' : ''}</div>
      ${cur ? '' : `<button class="gBtn" data-accswitch="${p.id}">切换</button>`}
      ${p.id && !cur ? `<button class="gBtn off" data-accdel="${p.id}">删除</button>` : ''}</div>`;
  }).join('');
  return `<div class="cardHead" style="background:#3a4a5a">👤 账号 · Accounts</div>
    <div class="cardTitle" style="padding-top:16px"><h3>${esc(curProfileName())}</h3><div class="en">每个账号独立保存进度(存于本机浏览器)</div></div>
    <div style="padding:4px 20px 18px">${rows}
      <div class="gRow"><div class="gi">➕</div>
        <div class="gInfo"><input id="accName" placeholder="新账号名字…" style="width:100%;padding:8px;border:1px solid #d8ceb8;border-radius:8px;font-size:14px;box-sizing:border-box"></div>
        <button class="gBtn" data-accnew>新建</button></div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="gBtn off" data-accexport style="flex:1">📤 导出存档码</button>
        <button class="gBtn off" data-accimport style="flex:1">📥 导入存档码</button>
      </div>
      <textarea id="accCode" placeholder="存档码会出现在这里;或把别的设备导出的存档码粘贴到这里,点导入" style="width:100%;height:70px;margin-top:8px;border:1px solid #d8ceb8;border-radius:8px;padding:8px;font-size:11px;box-sizing:border-box"></textarea>
    </div>`;
}
function openAccount() {
  cardBody.innerHTML = accountCard();
  modal.classList.remove('hidden'); modalOpen = true;
  cardBody.querySelectorAll('[data-accswitch]').forEach(b => b.addEventListener('click', () => {
    try { RAWLS.setItem('w1001.profile', b.dataset.accswitch); } catch (e) {}
    location.reload();
  }));
  cardBody.querySelectorAll('[data-accdel]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.accdel;
    const p = profileList().find(x => x.id === id);
    if (!confirm(`删除账号「${p ? p.name : id}」及其全部进度?此操作不可恢复。`)) return;
    saveProfiles(profileList().filter(x => x.id !== id));
    SAVE_FIELDS.forEach(f => { try { RAWLS.removeItem(`w1001.p_${id}.${f}`); } catch (e) {} });
    toast('账号已删除');
    openAccount();
  }));
  cardBody.querySelector('[data-accnew]')?.addEventListener('click', () => {
    const name = (document.getElementById('accName').value || '').trim().slice(0, 12);
    if (!name) { toast('给新账号起个名字吧'); return; }
    const id = Date.now().toString(36);
    saveProfiles([...profileList(), { id, name }]);
    try { RAWLS.setItem('w1001.profile', id); } catch (e) {}
    location.reload();
  });
  cardBody.querySelector('[data-accexport]')?.addEventListener('click', () => {
    const data = {};
    SAVE_FIELDS.forEach(f => { const v = PSTORE.getItem('w1001.' + f); if (v != null) data[f] = v; });
    document.getElementById('accCode').value = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    toast('📤 存档码已生成,请复制保存');
  });
  cardBody.querySelector('[data-accimport]')?.addEventListener('click', () => {
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(document.getElementById('accCode').value.trim()))));
      SAVE_FIELDS.forEach(f => { if (data[f] != null) PSTORE.setItem('w1001.' + f, data[f]); });
      toast('📥 导入成功,正在重载…');
      setTimeout(() => location.reload(), 600);
    } catch (e) { toast('存档码无效,请检查后重试'); }
  });
}

function markSeen(cat, id, title) {
  if (!CATS[cat]) return;
  if (!seen[cat].includes(id)) {
    seen[cat].push(id);
    try { PSTORE.setItem('w1001.seen.v1', JSON.stringify(seen)); } catch (e) {}
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
const paperBought = () => { try { return PSTORE.getItem('w1001.paper') === todayStr(); } catch (e) { return false; } };
function paperHTML() {
  const ds = todayStr();
  const r = mulberry32([...ds].reduce((a, c) => (a * 33 + c.charCodeAt(0)) | 0, 5));
  const pick = arr => arr[Math.floor(r() * arr.length)];
  const art = pick(D.art), beer = pick(D.beers), bird = pick(D.birds), book = pick(D.books),
        alb = pick(D.jazz), plant = pick(D.plants), sport = pick(D.outdoor);
  const issue = Math.floor((Date.now() - new Date('2026-01-01').getTime()) / 86400000);
  const shardLeft = 24 - shardsGot.length;
  return `<div class="paper">
    <div class="pMast">1001日报</div>
    <div class="pSub">THE 1001 DAILY · ${ds} · 第 ${issue} 期 · 收藏之岛第一小报 · 售价 2 SB</div>
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
/* 万神殿日报(真实日报,联网直供 https://news-dev.goood.space) */
const NEWS_BASE = 'https://news-dev.goood.space';
const paper2Bought = () => { try { return PSTORE.getItem('w1001.paper2') === todayStr(); } catch (e) { return false; } };
function parsePantheon(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const date = (doc.querySelector('.masthead-v2__meta span') || { textContent: '' }).textContent.trim();
  const tabs = [...doc.querySelectorAll('.tab-nav-v2__btn')].map(b => ({ key: b.dataset.tab, name: b.textContent.trim() }));
  const grab = (el, sel) => { const n = el.querySelector(sel); return n ? n.textContent.trim() : ''; };
  const heroes = [...doc.querySelectorAll('.hero-section')].map(h => ({
    tab: h.dataset.tab,
    title: grab(h, '.hero-title span') || grab(h, '.hero-title'),
    lede: grab(h, '.hero-lede'),
    href: (h.querySelector('a') || { getAttribute: () => '' }).getAttribute('href') || '',
  })).filter(x => x.title);
  const items = [...doc.querySelectorAll('.section-items-v2__item')].map(a => ({
    tab: a.dataset.homeTab,
    title: grab(a, 'h3 span') || grab(a, 'h3'),
    lede: grab(a, '.item-v2__lede') || grab(a, '.section-lead-v2__lede'),
    href: (a.querySelector('a') || { getAttribute: () => '' }).getAttribute('href') || '',
  })).filter(x => x.title);
  return { date, tabs, heroes, items };
}
function pantheonHTML(d) {
  const link = h => h ? `${NEWS_BASE}${h}` : NEWS_BASE;
  const secs = d.tabs.map(tb => {
    const hero = d.heroes.find(h => h.tab === tb.key);
    const its = d.items.filter(i => i.tab === tb.key).slice(0, 4);
    if (!hero && !its.length) return '';
    return `<div class="pHead" style="font-size:15px;border-bottom:1px solid #b9ae98;padding-bottom:4px">◈ ${esc(tb.name)}</div>
      ${hero ? `<div class="pBody" style="border-bottom:none"><a href="${esc(link(hero.href))}" target="_blank" rel="noopener" style="color:#26211a;font-weight:800;text-decoration:none">${esc(hero.title)}</a><br><span style="font-size:12px">${esc(hero.lede).slice(0, 90)}…</span></div>` : ''}
      <div class="pCols" style="padding-top:4px">${its.map(i =>
        `<div><a href="${esc(link(i.href))}" target="_blank" rel="noopener" style="color:#26211a;font-weight:700;text-decoration:none">${esc(i.title)}</a><br>${esc(i.lede).slice(0, 56)}…</div>`).join('')}</div>`;
  }).join('');
  return `<div class="paper">
    <div class="pMast">万神殿日报</div>
    <div class="pSub">PANTHEON DAILY · ${esc(d.date)} · 联网直供 · 点标题读全文</div>
    ${secs}
    <div class="pFoot">内容由 news-dev.goood.space 提供 · 本报在报亭售价 3 SB,当日免费重读</div>
  </div>
  <div style="text-align:center;padding:10px"><button class="gBtn off" data-backstand>↩ 返回报亭</button></div>`;
}
function pantheonFallback() {
  return `<div class="cardHead" style="background:#26211a">🏛️ 万神殿日报 · Pantheon Daily</div>
    <div class="cardMedia"><div class="paperRoll">🏛️</div></div>
    <div class="cardTitle"><h3>万神殿日报</h3><div class="en">PANTHEON DAILY · 真实世界日报</div></div>
    <div class="cardDesc">墨丘利:"这份大报由报社直供,得去亭外看——我给你把门打开。"<br><br>
    <span style="font-size:12px;color:#8a7c62">(在新窗口阅读,需登录报社账号;待报社开通跨域直供后,即可在游戏里直接翻阅)</span></div>
    <div style="text-align:center;padding:0 0 16px">
      <button class="again" data-openp2>🌐 打开万神殿日报</button>
      <button class="gBtn off" data-backstand style="margin-left:8px">↩ 返回报亭</button></div>`;
}
async function openPantheon(s) {
  cardBody.innerHTML = `<div class="cardHead" style="background:#26211a">🏛️ 万神殿日报</div><div class="cardDesc" style="padding:26px 22px">🕊️ 墨丘利取报中……</div>`;
  modal.classList.remove('hidden'); modalOpen = true;
  let ok = false;
  try {
    const res = await fetch(NEWS_BASE + '/', { credentials: 'include' });
    const data = parsePantheon(await res.text());
    if (data.items.length || data.heroes.length) { cardBody.innerHTML = pantheonHTML(data); ok = true; }
  } catch (e) { /* CORS 未开通或未登录 */ }
  if (!ok) {
    cardBody.innerHTML = pantheonFallback();
    cardBody.querySelector('[data-openp2]')?.addEventListener('click', () => window.open(NEWS_BASE + '/', '_blank'));
  }
  cardBody.querySelector('[data-backstand]')?.addEventListener('click', () => openCard(s));
}
function showPaper1(s) {
  cardBody.innerHTML = paperHTML() + '<div style="text-align:center;padding:10px"><button class="gBtn off" data-backstand>↩ 返回报亭</button></div>';
  modal.classList.remove('hidden'); modalOpen = true;
  cardBody.querySelector('[data-backstand]')?.addEventListener('click', () => openCard(s));
}
function newsCard() {
  return `<div class="cardHead" style="background:#4a4438">🗞️ 报亭 · Newsstand</div>
    <div class="cardTitle" style="padding-top:18px"><h3>今日两刊</h3><div class="en">墨丘利:"小报知岛事,大报知天下。"</div></div>
    <div style="padding:4px 20px 18px">
      <div class="gRow"><div class="gi">🗞️</div>
        <div class="gInfo"><b>1001日报</b> <span style="color:#8a7c62;font-size:12px">THE 1001 DAILY</span>
        <div class="gDesc">收藏之岛本地小报:展讯 · 酒讯 · 鸟讯 · 乐评 · 寻物启事</div></div>
        <button class="gBtn" data-buypaper>${paperBought() ? '免费重读' : '买一份 · 2 SB'}</button></div>
      <div class="gRow"><div class="gi">🏛️</div>
        <div class="gInfo"><b>万神殿日报</b> <span style="color:#8a7c62;font-size:12px">PANTHEON DAILY</span>
        <div class="gDesc">真实世界日报:国际新闻 · 外媒看中国 · 科技 · 预测市场(联网直供)</div></div>
        <button class="gBtn" data-buyp2>${paper2Bought() ? '再次翻阅' : '买一份 · 3 SB'}</button></div>
    </div>`;
}
/* --- 多元宇宙:世界列表与穿越 --- */
const WORLDS = [
  { key: 'truman', icon: '📺', name: '楚门的世界', en: 'The Truman Show', open: true, desc: '桃源岛 · 一座直播了三十年的摄影棚' },
  { key: 'lotr', icon: '💍', name: '指环王 · 中土', en: 'Middle-earth', open: true, desc: '西有夏尔炊烟,东有魔多火山' },
  { key: 'hp', icon: '⚡', name: '哈利·波特', en: 'Wizarding World', open: false, desc: '霍格沃茨已通车——请走主岛 9¾ 站台', note: '🚂 乘特快列车' },
  { key: 'mob', icon: '🐳', name: '莫比·迪克', en: 'Moby-Dick', open: true, desc: '南塔开特捕鲸港 · 白鲸在环岛海域出没' },
  { key: 'sport', icon: '⚽', name: '体育岛', en: 'Sports Isle', open: true, desc: '一万人红色梦剧场 · 曼联 vs 曼城进行中' },
  { key: 'xiyou', icon: '🐒', name: '西游记', en: 'Journey to the West', open: false, desc: '花果山(在建)' },
];
function ferryCard() {
  return `<div class="cardHead" style="background:#141826">⛵ 多元宇宙渡口 · Multiverse Ferry</div>
    <div class="cardTitle" style="padding-top:16px"><h3>要渡去哪个世界?</h3><div class="en">卡戎:"船票免费,记忆自理。"</div></div>
    <div style="padding:4px 20px 18px">
      <div class="gRow"><div class="gi">🐋</div><div class="gInfo"><b>收藏之岛(主世界)</b><div class="gDesc">鲸背上的一千零一收藏</div></div><button class="gBtn" data-goworld="main">返回</button></div>
      ${WORLDS.map(w => `<div class="gRow"><div class="gi">${w.icon}</div>
        <div class="gInfo"><b>${w.name}</b> <span style="color:#8a7c62;font-size:12px">${w.en}</span><div class="gDesc">${w.desc}</div></div>
        ${w.open ? `<button class="gBtn" data-goworld="${w.key}">前往</button>` : `<button class="gBtn" disabled>${w.note || '在建'}</button>`}</div>`).join('')}
    </div>`;
}
function trumanCard(type) {
  if (type === 'door') return `<div class="cardHead" style="background:#2a4456">🚪 天空之门 · Exit</div>
    <div class="cardMedia"><div class="paperRoll">🚪</div></div>
    <div class="cardTitle"><h3>世界的尽头是一堵墙</h3><div class="en">The Truman Show · 1998</div></div>
    <div class="cardDesc">帆船撞破的"天空",原来是布景。门后是黑暗,也是真实。<br><br>
    克里斯托弗(画外音):"你可以留下。这里没有真相,但也没有恐惧。"<br>
    楚门:"以防再也见不到你——下午好、晚上好、晚安。"(鞠躬)</div>
    <div style="text-align:center;padding:0 0 16px"><button class="again" data-goworld="main">🚪 走出这扇门(回到主世界)</button></div>`;
  if (type === 'camera') return `<div class="cardHead" style="background:#2a2a2e">📹 隐藏摄像机 #${Math.floor(Math.random() * 4980) + 20}</div>
    <div class="cardMedia"><div class="paperRoll">📹</div></div>
    <div class="cardTitle"><h3>你正在被直播</h3><div class="en">LIVE · 全球 1.7 亿观众在线</div></div>
    <div class="cardDesc">桃源岛共布设 5000 台摄像机,24 小时直播,已播出 10909 集。<br>你刚才在美术馆打的那个哈欠,收视率很高。</div>`;
  return `<div class="cardHead" style="background:#1c1c20">💡 坠落的舞台灯</div>
    <div class="cardMedia"><div class="paperRoll">💡</div></div>
    <div class="cardTitle"><h3>「天狼星 · 大犬座 9 号」</h3><div class="en">Prop No. SIRIUS-9</div></div>
    <div class="cardDesc">某个清晨,它从"天上"坠落在楚门家门前的街道。电台立刻解释:飞机在高空掉了零件。<br><br>一切怀疑,从这盏灯开始。</div>`;
}
/* --- 魔戒支线 --- */
let hasRing = false;
const ringDone = () => { try { return PSTORE.getItem('w1001.ring') === '1'; } catch (e) { return false; } };
function lotrCard(type) {
  if (type === 'ring') {
    if (ringDone()) return `<div class="cardHead" style="background:#2a3a22">💍 空基座</div>
      <div class="cardMedia"><div class="paperRoll">🕊️</div></div>
      <div class="cardTitle"><h3>魔戒已被销毁</h3><div class="en">The War is over</div></div>
      <div class="cardDesc">基座空空,和平长存。甘道夫远远地朝你点了点头。</div>`;
    if (hasRing) return `<div class="cardHead" style="background:#3a2a10">💍 空基座</div>
      <div class="cardTitle" style="padding-top:16px"><h3>魔戒在你身上</h3><div class="en">It is whispering…</div></div>
      <div class="cardDesc">它在低语你的名字。快,去东边的末日火山,把它投进去!</div>`;
    return `<div class="cardHead" style="background:#3a2a10">💍 至尊戒 · The One Ring</div>
      <div class="cardMedia"><div class="paperRoll">💍</div></div>
      <div class="cardTitle"><h3>至尊戒,驭众戒</h3><div class="en">One Ring to rule them all</div></div>
      <div class="cardDesc">"至尊戒,驭众戒;至尊戒,寻众戒;魔戒至尊引众戒,禁锢众戒黑暗中。"<br><br>基座上的金环泛着温润的光。它很轻,又重得可怕。</div>
      <div style="text-align:center;padding:0 0 16px"><button class="again" data-takering>💍 拾起魔戒</button></div>`;
  }
  if (type === 'crater') {
    if (hasRing) return `<div class="cardHead" style="background:#8c2f10">🌋 末日火山口 · Mount Doom</div>
      <div class="cardMedia"><div class="paperRoll">🌋</div></div>
      <div class="cardTitle"><h3>就是这里</h3><div class="en">Cast it into the fire!</div></div>
      <div class="cardDesc">岩浆翻涌,热浪扑面。魔戒在你掌心越来越沉。<br>咕噜的声音在身后:"宝贝……别!"</div>
      <div style="text-align:center;padding:0 0 16px"><button class="again" data-dropring>🔥 把魔戒投入火山</button></div>`;
    return `<div class="cardHead" style="background:#8c2f10">🌋 末日火山口 · Mount Doom</div>
      <div class="cardMedia"><div class="paperRoll">🌋</div></div>
      <div class="cardTitle"><h3>唯一能销毁魔戒的地方</h3><div class="en">Mount Doom</div></div>
      <div class="cardDesc">${ringDone() ? '魔戒已在此销毁。岩浆平静了许多,魔多的天也亮了一点。' : '铸成魔戒之火,也是唯一能熔毁它的火。——夏尔那边的基座上,好像放着什么东西。'}</div>`;
  }
  if (type === 'eye') return `<div class="cardHead" style="background:#1c1a20">👁️ 巴拉多 · 索伦之眼</div>
    <div class="cardMedia"><div class="paperRoll">👁️</div></div>
    <div class="cardTitle"><h3>它看见你了</h3><div class="en">The Eye of Sauron</div></div>
    <div class="cardDesc">"我看见你。"<br><br>无睑之眼裹挟着火焰,昼夜不息地转动。别盯太久——${hasRing ? '尤其是现在,魔戒就在你身上!' : '它在找一样东西。'}</div>`;
  return `<div class="cardHead" style="background:#2e7d4f">🚪 圆门 · 袋底洞</div>
    <div class="cardMedia"><div class="paperRoll">🚪</div></div>
    <div class="cardTitle"><h3>霍比特人的家</h3><div class="en">Bag End, Hobbiton</div></div>
    <div class="cardDesc">门上刻着一行小字:"不请自来者恕不接待——推销魔戒者除外。"<br>门里飘出二次早餐的香气。</div>`;
}
/* --- 霍格沃茨卡片 --- */
const HOUSES = [['格兰芬多', '🦁'], ['斯莱特林', '🐍'], ['拉文克劳', '🦅'], ['赫奇帕奇', '🦡']];
function hpCard(type, s) {
  if (type === 'train') {
    const toHog = s.side === 'main';
    return `<div class="cardHead" style="background:#7a1414">🚂 ${toHog ? '九又四分之三站台' : '霍格莫德站'}</div>
      <div class="cardMedia"><div class="paperRoll">🚂</div></div>
      <div class="cardTitle"><h3>霍格沃茨特快</h3><div class="en">${toHog ? "Platform 9¾ · King's Cross" : 'Hogsmeade Station'}</div></div>
      <div class="cardDesc">${toHog ? '猩红色的蒸汽机车喷着白汽。检票员看了看你:"麻瓜?今天破例。"' : '晚课的钟声从城堡传来。回程列车已经烧好了锅炉。'}</div>
      <div style="text-align:center;padding:0 0 16px"><button class="again" data-goworld="${toHog ? 'hp' : 'mainstation'}">🚂 ${toHog ? '开往霍格沃茨' : '返回收藏之岛'}</button></div>`;
  }
  if (type === 'castle') {
    let house = null;
    try { house = PSTORE.getItem('w1001.house'); } catch (e) {}
    return `<div class="cardHead" style="background:#2a2438">🏰 霍格沃茨城堡</div>
      <div class="cardMedia"><div class="paperRoll">${house ? (HOUSES.find(h => h[0] === house) || ['', '🎩'])[1] : '🎩'}</div></div>
      <div class="cardTitle"><h3>${house ? `你属于${house}` : '分院帽在等你'}</h3><div class="en">Hogwarts School of Witchcraft and Wizardry</div></div>
      <div class="cardDesc">${house ? '帽子从不改口。为你的学院赢得荣耀吧!' : '一顶打满补丁的旧尖顶帽放在凳子上。它突然开口:"嗯——放哪儿呢?"'}</div>
      ${house ? '' : '<div style="text-align:center;padding:0 0 16px"><button class="again" data-sorthat>🎩 戴上分院帽</button></div>'}`;
  }
  if (type === 'hoops') return `<div class="cardHead" style="background:#b8862e">🥅 魁地奇球场</div>
    <div class="cardMedia"><div class="paperRoll">🧹</div></div>
    <div class="cardTitle"><h3>魁地奇球场</h3><div class="en">Quidditch Pitch</div></div>
    <div class="cardDesc">三根金环立在草地上。一颗金色的小东西正嗡嗡地绕场乱飞——<b>金色飞贼</b>!<br><br>追上它、碰到它就算抓住(奖 8 SB)。它很快,祝你好运。</div>`;
  return `<div class="cardHead" style="background:#6b4a2b">🛖 海格小屋</div>
    <div class="cardMedia"><div class="paperRoll">🐉</div></div>
    <div class="cardTitle"><h3>猎场看守的小屋</h3><div class="en">Hagrid's Hut</div></div>
    <div class="cardDesc">屋里传出茶壶的响声和某种……幼龙的喷嚏?门口挂着弩弓和一串鼹鼠皮。<br>海格:"进来喝茶!岩皮饼管够!"(建议委婉拒绝岩皮饼)</div>`;
}
/* --- 莫比·迪克卡片(金币悬赏支线) --- */
let dblState = '';
try { dblState = PSTORE.getItem('w1001.dbl') || ''; } catch (e) {}
function setDbl(v) { dblState = v; try { PSTORE.setItem('w1001.dbl', v); } catch (e) {} }
function mobCard(type) {
  if (type === 'inn') return `<div class="cardHead" style="background:#1c2a30">🏨 喷水鲸客栈</div>
    <div class="cardMedia"><div class="paperRoll">🛏️</div></div>
    <div class="cardTitle"><h3>The Spouter-Inn</h3><div class="en">店主:彼得·科芬(棺材)先生</div></div>
    <div class="cardDesc">门口立着鲸颚骨拱门,墙上挂着一幅谁也看不出画的是什么的油画。<br><br>
    店主:"床位紧张,你可能得和一位文身标枪手拼床——放心,他人很好,就是抱着标枪睡。"</div>`;
  if (type === 'chowder') return `<div class="cardHead" style="background:#b8862e">🍲 杂烩汤大锅</div>
    <div class="cardMedia"><div class="paperRoll">🍲</div></div>
    <div class="cardTitle"><h3>蛤蜊杂烩汤</h3><div class="en">Try Pots Chowder</div></div>
    <div class="cardDesc">小蛤蜊不比榛子大,和捣碎的船用饼干、切细的咸肉一起炖,最后加一大块黄油。<br>喝完浑身暖烘烘——<b>8 分钟内下海不怕冷</b>。</div>
    <div style="text-align:center;padding:0 0 16px"><button class="again" data-chowder>🍲 来一碗(4 SB)</button></div>`;
  // doubloon
  if (dblState === 'done') return `<div class="cardHead" style="background:#3a3226">🪙 空钉痕</div>
    <div class="cardTitle" style="padding-top:16px"><h3>金币已被取走</h3><div class="en">by you.</div></div>
    <div class="cardDesc">桅杆上只剩一个钉孔。亚哈望着南方的海,牙骨假腿笃笃作响。</div>`;
  if (dblState === 'seen') return `<div class="cardHead" style="background:#b8862e">🪙 西班牙金币</div>
    <div class="cardMedia"><div class="paperRoll">🪙</div></div>
    <div class="cardTitle"><h3>你看见白鲸了!</h3><div class="en">"There she blows!"</div></div>
    <div class="cardDesc">亚哈眼中燃着火:"在哪儿?!……好。金币是你的了。但鲸,是我的。"</div>
    <div style="text-align:center;padding:0 0 16px"><button class="again" data-dblclaim>🪙 撬下金币(+30 SB · ⭐)</button></div>`;
  if (dblState === 'active') return `<div class="cardHead" style="background:#b8862e">🪙 西班牙金币</div>
    <div class="cardMedia"><div class="paperRoll">🪙</div></div>
    <div class="cardTitle"><h3>悬赏进行中</h3><div class="en">Keep watching the sea…</div></div>
    <div class="cardDesc">盯着环岛的海面。白鲸每隔一阵会浮上来喷水——靠近些,亲眼看到它!</div>`;
  return `<div class="cardHead" style="background:#b8862e">🪙 钉在桅杆上的金币</div>
    <div class="cardMedia"><div class="paperRoll">🪙</div></div>
    <div class="cardTitle"><h3>一枚西班牙金币</h3><div class="en">The Doubloon</div></div>
    <div class="cardDesc">亚哈把它钉进桅杆,吼声传遍码头:<br>"谁第一个望见那头白头白背的鲸——这枚金币就是谁的!"</div>
    <div style="text-align:center;padding:0 0 16px"><button class="again" data-dblaccept>🔭 接下悬赏,望向大海</button></div>`;
}
/* --- 体育岛卡片 --- */
function sptCard(type) {
  if (type === 'stadium') return `<div class="cardHead" style="background:#c8102e">🏟️ 梦剧场 · Theatre of Dreams</div>
    <div class="cardMedia"><div class="paperRoll">🏟️</div></div>
    <div class="cardTitle"><h3>红色梦剧场</h3><div class="en">容量 10,000 · 主队:曼联</div></div>
    <div class="cardDesc">20 层看台自草坪螺旋升起,红色外坡道缠绕整座球场两周;东南西北四座出口大门,四角泛光灯彻夜通明。<br><br>
    今日赛事:<b>曼彻斯特德比</b>——曼联 vs 曼城。从南门(出口3)入场,不需要门票,需要嗓子。</div>`;
  return `<div class="cardHead" style="background:#2e8b3d">⚽ 场边 · 德比进行中</div>
    <div class="cardMedia"><div class="paperRoll">⚽</div></div>
    <div class="cardTitle"><h3>曼联 ${score[0]} : ${score[1]} 曼城</h3><div class="en">MANCHESTER DERBY · LIVE</div></div>
    <div class="cardDesc">红衫与蓝衫在草皮上追逐,皮球在脚下传导。弗格森在场边嚼着口香糖,瓜迪奥拉的手势越来越复杂。<br><br>看台上一万人的声浪一阵接一阵——进球时,你会听见整座岛在震。</div>`;
}
function buildCard(s) {
  const cat = s.cat;
  if (cat === 'news') return newsCard();
  if (cat === 'shop') return shopCard();
  if (cat === 'ferry') return ferryCard();
  if (cat === 'truman') return trumanCard(s.type);
  if (cat === 'lotr') return lotrCard(s.type);
  if (cat === 'hp') return hpCard(s.type, s);
  if (cat === 'mob') return mobCard(s.type);
  if (cat === 'spt') return sptCard(s.type);
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
  cardBody.querySelectorAll('[data-goworld]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.goworld;
    const dests = { truman: [694, 624], lotr: [-150, -558], hp: [588, -492], mainstation: [146, -84], mob: [120, 702], sport: [-688, 122], main: [372, 12] };
    const dest = dests[k] || dests.main;
    player.position.set(dest[0], height(dest[0], dest[1]) + 1, dest[1]); vy = 0;
    closeModals(); blip(520);
    toast(k === 'truman' ? '📺 欢迎来到楚门的世界 · 第 10909 天'
      : k === 'lotr' ? '💍 欢迎来到中土 · 西有夏尔,东有魔多'
      : k === 'hp' ? '⚡ 呜——!霍格沃茨特快抵达霍格莫德站'
      : k === 'mainstation' ? '🚂 呜——!列车抵达 9¾ 站台'
      : k === 'mob' ? '🐳 南塔开特到了。海上有咸腥味,和一个关于白鲸的传说'
      : k === 'sport' ? '⚽ 体育岛到了——听,梦剧场的声浪!' : '🐋 回到收藏之岛(主世界)');
  }));
  cardBody.querySelector('[data-chowder]')?.addEventListener('click', () => {
    if (!spendSB(4)) return;
    chowderT = 480;
    closeModals();
    toast('🍲 杂烩汤下肚,浑身暖烘烘(8 分钟内下海不怕冷)⚡-4');
    blip(600);
  });
  cardBody.querySelector('[data-dblaccept]')?.addEventListener('click', () => {
    setDbl('active');
    closeModals();
    toast('🔭 悬赏接下!盯住环岛海面,等白鲸喷水');
    blip(520);
  });
  cardBody.querySelector('[data-dblclaim]')?.addEventListener('click', () => {
    setDbl('done');
    stars++; earnSB(30); saveQuest(); updateQuestHUD();
    closeModals();
    toast('🪙 金币到手!"There she blows!" · ⚡+30 ⭐+1');
    blip(660); setTimeout(() => blip(880), 110); setTimeout(() => blip(1180), 220);
  });
  cardBody.querySelector('[data-sorthat]')?.addEventListener('click', () => {
    const h2 = HOUSES[Math.floor(Math.random() * HOUSES.length)];
    try { PSTORE.setItem('w1001.house', h2[0]); } catch (e) {}
    toast(`🎩 分院帽(沉吟片刻):"${h2[0]}!!" ${h2[1]}`);
    blip(660); setTimeout(() => blip(990), 130);
    const cs = spots.find(x2 => x2.type === 'castle');
    if (cs) openCard(cs);
  });
  cardBody.querySelector('[data-takering]')?.addEventListener('click', () => {
    hasRing = true;
    if (window.__ringMesh) window.__ringMesh.visible = false;
    closeModals();
    toast('💍 魔戒在手……它在低语。去末日火山!');
    blip(320);
  });
  cardBody.querySelector('[data-dropring]')?.addEventListener('click', () => {
    hasRing = false;
    try { PSTORE.setItem('w1001.ring', '1'); } catch (e) {}
    stars++; earnSB(20); saveQuest(); updateQuestHUD();
    closeModals();
    toast('🌋 魔戒已销毁!中土得救 · ⚡+20 ⭐+1');
    blip(660); setTimeout(() => blip(880), 110); setTimeout(() => blip(1180), 220);
  });
  cardBody.querySelector('[data-buypaper]')?.addEventListener('click', () => {
    if (!paperBought()) {
      if (!spendSB(2)) return;
      try { PSTORE.setItem('w1001.paper', todayStr()); } catch (e) {}
      toast('🗞️ 墨丘利:"1001日报,岛上的事都在这儿。" ⚡-2'); blip(740);
    }
    showPaper1(s);
  });
  cardBody.querySelector('[data-buyp2]')?.addEventListener('click', () => {
    if (!paper2Bought()) {
      if (!spendSB(3)) return;
      try { PSTORE.setItem('w1001.paper2', todayStr()); } catch (e) {}
      toast('🏛️ 墨丘利:"万神殿日报,知天下。" ⚡-3'); blip(740);
    }
    openPantheon(s);
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
$('btnAcc').addEventListener('click', () => { modalOpen ? closeModals() : openAccount(); });
$('btnHelp').addEventListener('click', () => { $('intro').classList.remove('hidden'); });
$('btnStart').addEventListener('click', () => { $('intro').classList.add('hidden'); initAudio(); });

/* --- 音效与音乐(与 2D 相同引擎) --- */
let actx = null, musicGain = null, musicOn = true, waveGain = null, crowdGain = null;
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
  truman:    { tempo: 118, wave: 'triangle', scale: [0, 4, 7, 9, 12], base: 294, dens: .68, bass: true, vol: .6 },
  shire:     { tempo: 90, wave: 'triangle', scale: [0, 2, 4, 7, 9], base: 220, dens: .6, bass: true },
  mordor:    { tempo: 58, wave: 'sine', scale: [0, 1, 3, 6, 7], base: 87, dens: .35, pad: true, vol: .85 },
  hogwarts:  { tempo: 96, wave: 'sine', scale: [0, 3, 5, 7, 8, 12], base: 392, dens: .6, arp: true, vol: .8 },
  mobydick:  { tempo: 76, wave: 'triangle', scale: [0, 3, 5, 7, 10], base: 165, dens: .55, bass: true, swing: true },
  stadium:   { tempo: 104, wave: 'square', scale: [0, 2, 4, 5, 7], base: 196, dens: .5, bass: true, vol: .5 },
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
    // 球场人声:带通噪声,靠近梦剧场渐强,进球时爆发
    const src2 = actx.createBufferSource(); src2.buffer = buf; src2.loop = true;
    const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = .8;
    crowdGain = actx.createGain(); crowdGain.gain.value = 0;
    src2.connect(bp).connect(crowdGain).connect(actx.destination);
    src2.start();
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
/* --- 月亮(夜间升起,月光洒海) --- */
let moonMesh = null, moonGlow = null, moonLight = null, tideY = 0;
const moonDirN = new THREE.Vector3(0, 1, 0);
{
  const cv2 = document.createElement('canvas'); cv2.width = cv2.height = 128;
  const c = cv2.getContext('2d');
  c.fillStyle = '#efeadb'; c.fillRect(0, 0, 128, 128);
  const r0 = mulberry32(77);
  for (let i = 0; i < 26; i++) {   // 月海与环形山
    c.fillStyle = `rgba(150,148,138,${.18 + r0() * .3})`;
    c.beginPath(); c.arc(r0() * 128, r0() * 128, 3 + r0() * 14, 0, 7); c.fill();
  }
  const tex = new THREE.CanvasTexture(cv2); tex.colorSpace = THREE.SRGBColorSpace;
  moonMesh = new THREE.Mesh(new THREE.SphereGeometry(26, 24, 18), new THREE.MeshBasicMaterial({ map: tex, fog: false }));
  moonGlow = new THREE.Mesh(new THREE.SphereGeometry(38, 20, 14),
    new THREE.MeshBasicMaterial({ color: 0xdfe8ff, transparent: true, opacity: .16, fog: false, depthWrite: false }));
  scene.add(moonMesh, moonGlow);
  moonLight = new THREE.DirectionalLight(0xa8c0e8, 0);
  scene.add(moonLight, moonLight.target);
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
  /* 月亮:夜里从海上升起,月光在水面拉出反光带(海上明月共潮生) */
  const night = 1 - da;
  const mp = clamp((p - .6) / .36, 0, 1);              // 夜段进度 0..1
  const mElev = Math.sin(mp * Math.PI) * .85 + .06;
  moonDirN.set(-Math.cos(mp * Math.PI), mElev, -.38).normalize();
  moonMesh.position.copy(player.position).addScaledVector(moonDirN, 820);
  moonGlow.position.copy(moonMesh.position);
  moonMesh.visible = moonGlow.visible = night > .05;
  moonGlow.material.opacity = night * .18;
  moonLight.intensity = night * .5;
  moonLight.position.copy(player.position).addScaledVector(moonDirN, 300);
  moonLight.target.position.copy(player.position);
  /* 潮汐:月升潮涨 */
  tideY = night * mElev * .9;
  if (oceanWater) {
    oceanWater.position.y = .15 + tideY;
    oceanWater.material.uniforms.sunDirection.value.copy(night > .5 ? moonDirN : sunDirN);
    oceanWater.material.uniforms.sunColor.value.setHex(night > .5 ? 0xbdd8ff : 0xffffff);
  }
  if (mobileWater) mobileWater.position.y = tideY;
  starField.material.opacity = night * .95;
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
    if (Math.hypot(x - VOL.x, z - VOL.z) < 82 && h > 1) c = fbm(x * .07, z * .07) > .5 ? new THREE.Color(0x4a4038) : new THREE.Color(0x3a322c);   // 魔多焦土
    else if (h > 34) c = cSnow;
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
let waterGeo = null, oceanWater = null, mobileWater = null;
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
  mobileWater = new THREE.Mesh(waterGeo, new THREE.MeshPhongMaterial({
    color: 0x2e7fb4, transparent: true, opacity: .82, shininess: 120, specular: 0x88c9ee,
  }));
  mobileWater.position.y = 0; scene.add(mobileWater);
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
  const item = ['bar', 'sign', 'news', 'shop', 'ferry', 'door', 'camera', 'lamp', 'ring', 'crater', 'hole', 'eye', 'train', 'castle', 'hoops', 'hut', 'inn', 'chowder', 'doubloon', 'stadium', 'pitch'].includes(type) ? null : pickers[cat]();
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
try { shardsGot = JSON.parse(PSTORE.getItem('w1001.shards') || '[]'); } catch (e) { shardsGot = []; }
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
  try { PSTORE.setItem('w1001.shards', JSON.stringify(shardsGot)); } catch (e) {}
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
    lines: ['号外号外!今日双刊到齐!', '1001日报知岛事,万神殿日报知天下。', '小报两个币,大报三个币,童叟无欺。', '诸神也订万神殿日报,你还在等什么?'] });
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
/* ================= 多元宇宙 1 号:楚门的世界(桃源岛) ================= */
const trumanCams = [];
{
  const cx = TRU.x, cz = TRU.z, ch = 7;
  // 摄影棚穹顶(内侧看是"画出来的天空")
  const dome = new THREE.Mesh(new THREE.SphereGeometry(150, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhongMaterial({ color: 0xcfe8f5, transparent: true, opacity: .1, side: THREE.DoubleSide, depthWrite: false }));
  dome.position.set(cx, 0, cz); scene.add(dome);
  // 穹顶内的摄影棚吊灯
  for (const [lx, lz] of [[cx - 40, cz - 30], [cx + 45, cz + 20]]) {
    const wire = cyl(.06, .06, 40, M.woodDark); wire.position.set(lx, 120, lz); scene.add(wire);
    const lamp2 = new THREE.Mesh(new THREE.ConeGeometry(4, 6, 8), lam(0x222222)); lamp2.position.set(lx, 98, lz); scene.add(lamp2);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff2cc })); bulb.position.set(lx, 95.5, lz); scene.add(bulb);
  }
  // 天空之门(穹顶西壁,海中浅滩尽头)
  {
    const frame = box(7.5, 11, 1.2, M.white); frame.position.set(612, 6.6, cz); scene.add(frame);
    const doorM = box(5.6, 9, .8, lam(0x1a2430)); doorM.position.set(612.4, 6, cz); scene.add(doorM);
    const steps = box(8, 1, 5, M.stone); steps.position.set(616, 1.7, cz); scene.add(steps);
    addSpot(617, cz, 'truman', 'door', { r: 7 });
    boxObs.push({ x1: 608, z1: cz - 4, x2: 611, z2: cz + 4 });
  }
  // 1950s 彩色小楼(围着草坪一圈)
  const houseCols = [0xaee8d2, 0xf5c9d4, 0xf5ecc9, 0xbcd8f0, 0xd8c9ee];
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 + .3, hx = cx + Math.cos(a) * 42, hz = cz + Math.sin(a) * 42;
    const hh = height(hx, hz);
    const bodyH = box(9, 6.5, 7, lam(houseCols[i])); bodyH.position.set(hx, hh + 3.2, hz); bodyH.rotation.y = -a; scene.add(bodyH);
    const roofH = new THREE.Mesh(new THREE.ConeGeometry(7.4, 4.4, 4), lam(0x9c4a3a));
    roofH.rotation.y = Math.PI / 4 - a; roofH.position.set(hx, hh + 8.6, hz); scene.add(roofH);
    const doorH = box(1.8, 3.2, .3, M.woodDark);
    doorH.position.set(hx - Math.cos(a) * 4.6, hh + 1.6, hz - Math.sin(a) * 4.6); doorH.rotation.y = -a; scene.add(doorH);
    cirObs.push({ x: hx, z: hz, r: 6 });
  }
  // 隐藏摄像机(红灯闪烁)
  [[cx - 20, cz + 26], [cx + 30, cz - 24], [cx - 44, cz - 8], [cx + 8, cz + 52]].forEach(([px2, pz2], i) => {
    const hh = height(px2, pz2);
    const pole = cyl(.14, .18, 4.6, M.woodDark); pole.position.set(px2, hh + 2.3, pz2); scene.add(pole);
    const cam = box(1.4, .9, .9, lam(0x2a2a2e)); cam.position.set(px2, hh + 4.8, pz2); cam.rotation.y = i * 1.7; scene.add(cam);
    const red = new THREE.Mesh(new THREE.SphereGeometry(.22, 6, 5), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
    red.position.set(px2, hh + 5.4, pz2); scene.add(red);
    trumanCams.push(red.material);
    addSpot(px2, pz2, 'truman', 'camera', { r: 6 });
  });
  // 坠落的舞台灯「天狼星」——一切穿帮的开始
  {
    const hh = height(706, 508);
    const lampBody = box(3, 2.2, 2.2, lam(0x1c1c20)); lampBody.rotation.z = .5; lampBody.position.set(706, hh + 1.1, 508); scene.add(lampBody);
    const lens = cyl(1, 1, .4, new THREE.MeshBasicMaterial({ color: 0xfff2cc })); lens.rotation.z = Math.PI / 2 + .5; lens.position.set(707.5, hh + 1.7, 508); scene.add(lens);
    cirObs.push({ x: 706, z: 508, r: 2.2 });
    addSpot(706, 508, 'truman', 'lamp', { r: 6 });
  }
  // 返程渡口 + 岛名牌
  {
    const hh = height(694, 632);
    const plank = box(5, .5, 9, M.wood); plank.position.set(694, hh + .9, 636); scene.add(plank);
    const post = cyl(.3, .3, 3.6, M.woodDark); post.position.set(692, hh + 1.6, 640); scene.add(post);
    addSpot(694, 634, 'ferry', 'ferry', { r: 8 });
    const tsign = makeSign('楚门的世界', 6, '#e8f2f5', '#2a4456');
    tsign.position.set(700, height(700, 610) + 4.4, 610); scene.add(tsign);
  }
  // 原著 NPC
  addNpc({ x: cx + 6, z: cz - 6, name: '楚门', body: 0x3a6ea5, hat: 0x8a6238,
    lines: ['早上好!以防见不到你——下午好、晚上好、晚安!', '我总觉得……天上有摄像机在看我。', '全世界只有我一个人被蒙在鼓里。', '如果这是梦,别叫醒我;如果是节目,请换台。'] });
  addNpc({ x: 622, z: cz + 6, name: '克里斯托弗', body: 0x2a2a30, hat: 0x44444c,
    lines: ['我是这个世界的创造者。', '外面的世界,和我给他的一样虚假。', '他随时可以离开——只要他真的想。', '摄像机五千台,直播三十年。'] });
  addNpc({ x: cx + 14, z: cz + 30, name: '美露', body: 0xd46a8c, hat: 0xf5ecc9,
    lines: ['(对空气微笑)这杯"摩可可",百分百天然可可豆!', '新款"厨师帮手",主妇的好朋友!', '生活嘛,就该被赞助。——你问镜头在哪?什么镜头?'] });
  addNpc({ x: cx - 26, z: cz - 32, name: '马龙', body: 0x6b7a3a, hat: 0x4a5528,
    lines: ['哥们,我会为你挡子弹。', '这话是我自己想说的,没人提词。真的。', '来瓶啤酒?这牌子……特别好喝(看向远方)。'] });
}
/* ================= 多元宇宙 2 号:中土(夏尔与魔多) ================= */
let sauronEye = null, lavaDisc = null;
{
  // —— 夏尔:霍比特洞 ——
  const holeCols = [0x2e7d4f, 0xc0392b, 0xd9b26a];
  [[-250, -670], [-215, -715], [-260, -725]].forEach(([hx, hz], i) => {
    const hh = height(hx, hz);
    const mound = new THREE.Mesh(new THREE.SphereGeometry(7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), lam(0x6a9c50));
    mound.position.set(hx, hh, hz); mound.scale.y = .6; scene.add(mound);
    const doorDir = Math.atan2(-150 - hx, -690 - hz);   // 圆门朝向岛心
    const dx = hx + Math.sin(doorDir) * 6.6, dz = hz + Math.cos(doorDir) * 6.6;
    const door = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, .5, 16), lam(holeCols[i]));
    door.rotation.x = Math.PI / 2; door.rotation.y = doorDir;
    door.position.set(dx, hh + 2, dz); scene.add(door);
    const chimney = cyl(.4, .5, 2, M.stone); chimney.position.set(hx - 2, hh + 4.6, hz); scene.add(chimney);
    cirObs.push({ x: hx, z: hz, r: 7 });
    addSpot(dx, dz, 'lotr', 'hole', { r: 6 });
  });
  makeTree(-228, -652, 2.2, null);   // 宴会树
  // 魔戒基座
  {
    const ph = height(-190, -650);
    const ped = cyl(1, 1.4, 2.4, M.stone); ped.position.set(-190, ph + 1.2, -650); scene.add(ped);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.7, .18, 10, 24),
      MOBILE ? new THREE.MeshLambertMaterial({ color: 0xffd76a })
             : new THREE.MeshStandardMaterial({ color: 0xffd76a, roughness: .2, metalness: 1 }));
    ring.rotation.x = Math.PI / 2.4; ring.position.set(-190, ph + 3, -650); scene.add(ring);
    window.__ringMesh = ring;
    if (ringDone()) ring.visible = false;
    cirObs.push({ x: -190, z: -650, r: 1.6 });
    addSpot(-190, -650, 'lotr', 'ring', { r: 6.5 });
  }
  // —— 魔多:末日火山 ——
  {
    const vh = height(VOL.x, VOL.z);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(9, 13, 5, 12, 1, true),
      new THREE.MeshLambertMaterial({ color: 0x3a322c, side: THREE.DoubleSide }));
    rim.position.set(VOL.x, vh + 1.5, VOL.z); scene.add(rim);
    lavaDisc = new THREE.Mesh(new THREE.CylinderGeometry(8.4, 8.4, .6, 12),
      new THREE.MeshBasicMaterial({ color: 0xff5a1a }));
    lavaDisc.position.set(VOL.x, vh + 2.4, VOL.z); scene.add(lavaDisc);
    const lavaLight = new THREE.PointLight(0xff6a2a, 30, 60, 2);
    lavaLight.position.set(VOL.x, vh + 6, VOL.z); scene.add(lavaLight);
    addSpot(VOL.x, VOL.z + 11, 'lotr', 'crater', { r: 8 });
  }
  // —— 巴拉多黑塔与索伦之眼 ——
  {
    const tx = -70, tz = -770, th2 = height(tx, tz);
    const t1 = cyl(4.5, 6, 26, lam(0x1c1a20)); t1.position.set(tx, th2 + 13, tz); scene.add(t1);
    const t2 = cyl(2.6, 4, 16, lam(0x24202a)); t2.position.set(tx, th2 + 32, tz); scene.add(t2);
    for (const sgn of [-1, 1]) {
      const prong = new THREE.Mesh(new THREE.ConeGeometry(1, 9, 5), lam(0x14121a));
      prong.position.set(tx + sgn * 2.2, th2 + 45, tz); scene.add(prong);
    }
    sauronEye = new THREE.Group();
    const eyeBall = new THREE.Mesh(new THREE.SphereGeometry(2.6, 16, 12), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
    eyeBall.scale.set(1, 1.5, .6); sauronEye.add(eyeBall);
    const pupil = new THREE.Mesh(new THREE.BoxGeometry(.5, 3.4, .4), new THREE.MeshBasicMaterial({ color: 0x0a0a0a }));
    pupil.position.z = 1.5; sauronEye.add(pupil);
    sauronEye.position.set(tx, th2 + 44, tz); scene.add(sauronEye);
    const eyeLight = new THREE.PointLight(0xff7a1a, 40, 90, 2);
    eyeLight.position.set(tx, th2 + 44, tz); scene.add(eyeLight);
    cirObs.push({ x: tx, z: tz, r: 6.5 });
    addSpot(tx, tz + 9, 'lotr', 'eye', { r: 9 });
  }
  // —— 渡口与岛名牌 ——
  {
    const dh = height(-150, -556);
    const plank = box(5, .5, 9, M.wood); plank.position.set(-150, dh + .9, -552); scene.add(plank);
    addSpot(-150, -554, 'ferry', 'ferry', { r: 8 });
    const msign = makeSign('中土 · 夏尔与魔多', 7, '#1e2a1a', '#cfe8a8');
    msign.position.set(-158, height(-158, -580) + 4.2, -580); scene.add(msign);
  }
  // —— 原著 NPC ——
  addNpc({ x: -238, z: -688, name: '弗罗多', body: 0x3a6ea5, hat: 0x8a6238,
    lines: ['我愿意带上魔戒——虽然,我不知道路。', '夏尔的早晨,比什么都珍贵。', '有时候你必须离开,才能守护你所爱的。'] });
  addNpc({ x: -226, z: -700, name: '山姆', body: 0x9c640c, hat: 0x6b7a3a, opts: { wide: 1.2 },
    lines: ['我不能替你背戒指,但我能背你!', '土豆!煮一煮,捣成泥,炖进汤里。', '这世上总有些美好,值得我们奋战到底。'] });
  addNpc({ x: -195, z: -662, name: '甘道夫', body: 0x8f8fa0, hat: 0xd8d5cc, opts: { hat: 'cone', tall: 1.15, cane: true },
    lines: ['你——不能——通过!', '所有迷路的人,并非都迷失了自己。', '我们无法选择自己的时代,只能选择如何度过。', '傻瓜,快跑!'] });
  addNpc({ x: -75, z: -688, name: '咕噜', body: 0x7a8a6a, hat: 0x5a684e, opts: { tall: .8 },
    lines: ['我的宝贝……宝贝!!', '是它偷了它!滑溜的小贼!', '我们发誓,为宝贝的主人效劳……咕噜,咕噜。'] });
}
/* ================= 多元宇宙 3 号:霍格沃茨 ================= */
let snitch = null, snitchT = 0;
function makeTrain(x, z, ry) {
  const g = new THREE.Group(); g.position.set(x, height(x, z), z); g.rotation.y = ry;
  const base = box(7.5, .6, 2.6, lam(0x1c1c20)); base.position.y = 1; g.add(base);
  const boiler = cyl(1.1, 1.1, 4.6, lam(0x9c1c1c), 12); boiler.rotation.z = Math.PI / 2; boiler.position.set(-1, 2.2, 0); g.add(boiler);
  const cab = box(2.2, 2.6, 2.4, lam(0x7a1414)); cab.position.set(2.4, 2.6, 0); g.add(cab);
  const roofT = box(2.6, .3, 2.8, lam(0x1c1c20)); roofT.position.set(2.4, 4, 0); g.add(roofT);
  const funnel = cyl(.35, .55, 1.4, lam(0x1c1c20)); funnel.position.set(-2.6, 3.6, 0); g.add(funnel);
  for (const [wx, sgn] of [[-2.2, 1], [-2.2, -1], [.2, 1], [.2, -1], [2.4, 1], [2.4, -1]]) {
    const wheel = cyl(.7, .7, .3, lam(0x0e0e12), 10);
    wheel.rotation.x = Math.PI / 2; wheel.position.set(wx, .8, sgn * 1.35); g.add(wheel);
  }
  scene.add(g);
  cirObs.push({ x, z, r: 4 });
  return g;
}
{
  // —— 主岛:九又四分之三站台 ——
  const sx = 140, sz2 = -80, sh3 = height(sx, sz2);
  const platform = box(16, 1, 6, M.stone); platform.position.set(sx, sh3 + .5, sz2 + 5); scene.add(platform);
  for (const rz of [-1.1, 1.1]) {   // 铁轨
    const rail = box(30, .2, .3, lam(0x3a3a40)); rail.position.set(sx, sh3 + .3, sz2 - 2 + rz); scene.add(rail);
  }
  for (let i = 0; i < 7; i++) {
    const tie = box(.5, .15, 3, M.woodDark); tie.position.set(sx - 12 + i * 4, sh3 + .22, sz2 - 2); scene.add(tie);
  }
  makeTrain(sx - 4, sz2 - 2, 0);
  const wall = box(7, 5.6, 1.4, lam(0x8c4a3a));   // 红砖墙
  wall.position.set(sx + 6, sh3 + 2.8, sz2 + 9); scene.add(wall);
  boxObs.push({ x1: sx + 2.5, z1: sz2 + 8.3, x2: sx + 9.5, z2: sz2 + 9.7 });
  const wsign = makeSign('9¾ 站台', 4, '#5a2c22', '#ffd76a');
  wsign.position.set(sx + 6, sh3 + 6.2, sz2 + 8.2); scene.add(wsign);
  addSpot(sx, sz2 + 3, 'hp', 'train', { r: 8, side: 'main' });
  // —— 霍格莫德站(霍格沃茨岛) ——
  const hx = 585, hz = -495, hh3 = height(hx, hz);
  const plat2 = box(14, 1, 6, M.stone); plat2.position.set(hx, hh3 + .5, hz + 5); scene.add(plat2);
  for (const rz of [-1.1, 1.1]) {
    const rail = box(26, .2, .3, lam(0x3a3a40)); rail.position.set(hx, hh3 + .3, hz - 2 + rz); scene.add(rail);
  }
  makeTrain(hx + 3, hz - 2, 0);
  const hsign = makeSign('霍格莫德站', 5, '#2a2438', '#cfb8ff');
  hsign.position.set(hx - 5, hh3 + 4.6, hz + 8); scene.add(hsign);
  addSpot(hx, hz + 3, 'hp', 'train', { r: 8, side: 'hog' });
  // —— 霍格沃茨城堡(塔群) ——
  const cx2 = 690, cz2 = -592, chh = height(cx2, cz2);
  const keep = box(16, 14, 12, M.stone); keep.position.set(cx2, chh + 7, cz2); scene.add(keep);
  const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(10, 6, 4), lam(0x2a3448));
  keepRoof.rotation.y = Math.PI / 4; keepRoof.position.set(cx2, chh + 17, cz2); scene.add(keepRoof);
  [[-11, -8, 22, 3], [11, -7, 26, 3.4], [-9, 7, 18, 2.6], [10, 8, 20, 2.8]].forEach(([ox, oz, th3, tr]) => {
    const tower = cyl(tr, tr + .5, th3, M.stone, 10); tower.position.set(cx2 + ox, chh + th3 / 2, cz2 + oz); scene.add(tower);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(tr + .7, 6, 10), lam(0x2a3448));
    spire.position.set(cx2 + ox, chh + th3 + 3, cz2 + oz); scene.add(spire);
    cirObs.push({ x: cx2 + ox, z: cz2 + oz, r: tr + 1 });
  });
  cirObs.push({ x: cx2, z: cz2, r: 10 });
  const gate = box(4, 6, 1, lam(0x3a3026)); gate.position.set(cx2, chh + 3, cz2 + 6.4); scene.add(gate);
  addSpot(cx2, cz2 + 10, 'hp', 'castle', { r: 8 });
  const csign = makeSign('霍格沃茨', 6, '#2a2438', '#ffd76a');
  csign.position.set(cx2, chh + 22, cz2 + 2); scene.add(csign);
  // —— 魁地奇球场 + 金色飞贼 ——
  const px3 = 735, pz3 = -505, phh = height(px3, pz3);
  [[-10, 0, 9], [0, 4, 11], [10, -2, 8]].forEach(([ox, oz, hp2]) => {
    const pole = cyl(.25, .3, hp2, M.gold); pole.position.set(px3 + ox, phh + hp2 / 2, pz3 + oz); scene.add(pole);
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(1.6, .18, 8, 20), M.gold);
    hoop.position.set(px3 + ox, phh + hp2 + 1.2, pz3 + oz); scene.add(hoop);
    cirObs.push({ x: px3 + ox, z: pz3 + oz, r: .8 });
  });
  addSpot(px3, pz3 - 8, 'hp', 'hoops', { r: 8 });
  snitch = new THREE.Group();
  const sBall = new THREE.Mesh(new THREE.SphereGeometry(.35, 10, 8),
    MOBILE ? new THREE.MeshLambertMaterial({ color: 0xffd76a }) : new THREE.MeshStandardMaterial({ color: 0xffd76a, roughness: .25, metalness: .9 }));
  snitch.add(sBall);
  const wingMat = new THREE.MeshBasicMaterial({ color: 0xf5f0e0, transparent: true, opacity: .85, side: THREE.DoubleSide });
  const wl2 = new THREE.Mesh(new THREE.PlaneGeometry(.9, .3), wingMat); wl2.position.x = -.6; snitch.add(wl2);
  const wr2 = new THREE.Mesh(new THREE.PlaneGeometry(.9, .3), wingMat); wr2.position.x = .6; snitch.add(wr2);
  snitch.userData = { cx: px3, cz: pz3, cy: phh, wl: wl2, wr: wr2 };
  scene.add(snitch);
  // —— 禁林与海格小屋 ——
  [[600, -560], [615, -545], [590, -540], [625, -565], [605, -580], [635, -540]].forEach(([tx2, tz2]) => makeTree(tx2, tz2, 1.3 + rnd() * .5, null));
  const hutH = height(640, -530);
  const hut = cyl(3.4, 3.8, 3.6, M.stone, 10); hut.position.set(640, hutH + 1.8, -530); scene.add(hut);
  const hutRoof = new THREE.Mesh(new THREE.ConeGeometry(4.4, 3.2, 10), lam(0x6b4a2b));
  hutRoof.position.set(640, hutH + 5.2, -530); scene.add(hutRoof);
  cirObs.push({ x: 640, z: -530, r: 4.2 });
  addSpot(640, -524, 'hp', 'hut', { r: 7 });
  // —— 原著 NPC ——
  addNpc({ x: 684, z: -578, name: '哈利', body: 0x2a2a30, hat: 0x1c1c20,
    lines: ['我是……就是哈利。', '呼神护卫!!(一道银光掠过)', '是霍格沃茨,把我变成今天的我。'] });
  addNpc({ x: 694, z: -576, name: '赫敏', body: 0x6b3a5a, hat: 0x8a5a3a,
    lines: ['是"漂浮咒"!Wing-GAR-dium Levi-O-sa,O 要读长音!', '我在《霍格沃茨:一段校史》里读到过。', '打败黑魔王靠的是书本和聪明——还有勇气。'] });
  addNpc({ x: 676, z: -570, name: '罗恩', body: 0xb03a2e, hat: 0xd97c3a,
    lines: ['梅林的胡子!', '要不……我们先吃点东西?', '她是真的可怕(小声):我说赫敏。'] });
  addNpc({ x: 690, z: -602, name: '邓布利多', body: 0x4a3a6a, hat: 0x8a7ab0, opts: { hat: 'cone', tall: 1.15, cane: true },
    lines: ['幸福,属于那些在黑暗中仍记得点灯的人。', '决定我们成为什么样的人的,不是能力,而是选择。', '对聪明绝顶的头脑而言,死亡不过是下一场伟大的冒险。'] });
  addNpc({ x: 646, z: -524, name: '海格', body: 0x4a3626, hat: 0x2e2418, opts: { wide: 1.7, tall: 1.3 },
    lines: ['你是一个巫师,哈利!', '我本不该说这个的……当我没说!', '再来块岩皮饼?自家烤的。'] });
}
/* ================= 多元宇宙 4 号:莫比·迪克(南塔开特捕鲸港) ================= */
let mobyWhale = null, mobySpout = null;
{
  const px4 = MOB.x, pz4 = MOB.z;
  // —— 喷水鲸客栈(鲸颚骨拱门) ——
  {
    const ix = px4 - 25, iz = pz4 - 20, ih = height(ix, iz);
    const bodyI = box(14, 6.5, 10, lam(0x6b5540)); bodyI.position.set(ix, ih + 3.2, iz); scene.add(bodyI);
    for (const sgn of [-1, 1]) {
      const slope = box(15.5, .5, 6.4, lam(0x3e3228));
      slope.rotation.x = sgn * .5; slope.position.set(ix, ih + 8, iz + sgn * 2.6); scene.add(slope);
    }
    for (const sgn of [-1, 1]) {   // 鲸颚骨拱门
      const jaw = cyl(.28, .5, 7.5, M.white);
      jaw.rotation.z = sgn * .5; jaw.position.set(ix + sgn * 2.4, ih + 3.4, iz + 5.6); scene.add(jaw);
    }
    const doorI = box(2.4, 3.6, .3, M.woodDark); doorI.position.set(ix, ih + 1.8, iz + 5.1); scene.add(doorI);
    boxObs.push({ x1: ix - 7, z1: iz - 5, x2: ix + 7, z2: iz + 5 });
    const isign = makeSign('喷水鲸客栈', 5.6, '#1c2a30', '#bfe0e8');
    isign.position.set(ix, ih + 9.6, iz + 5.4); scene.add(isign);
    addSpot(ix, iz + 7.5, 'mob', 'inn', { r: 7 });
    // 门口的杂烩汤大锅
    const pot = cyl(1.4, 1.1, 1.4, lam(0x2a2a30)); pot.position.set(ix + 8, ih + .9, iz + 5); scene.add(pot);
    const soup = cyl(1.2, 1.2, .3, new THREE.MeshBasicMaterial({ color: 0xd9b26a })); soup.position.set(ix + 8, ih + 1.5, iz + 5); scene.add(soup);
    cirObs.push({ x: ix + 8, z: iz + 5, r: 1.7 });
    addSpot(ix + 8, iz + 8, 'mob', 'chowder', { r: 6 });
  }
  // —— 码头与裴廓德号 ——
  {
    for (let i = 0; i < 6; i++) {   // 栈桥伸向南海
      const pz5 = pz4 + 55 + i * 9;
      const plank = box(5.5, .5, 8.6, M.wood); plank.position.set(150, 2, pz5); scene.add(plank);
      for (const sgn of [-1, 1]) {
        const post = cyl(.3, .3, 4, M.woodDark); post.position.set(150 + sgn * 2.4, .4, pz5); scene.add(post);
      }
    }
    // 裴廓德号(泊于码头东侧,随浪起伏)
    const ship = new THREE.Group();
    const hull = box(22, 3.4, 6.5, lam(0x3e2e20)); hull.position.y = 1.2; ship.add(hull);
    const bow = new THREE.Mesh(new THREE.ConeGeometry(3.2, 6, 4), lam(0x3e2e20));
    bow.rotation.z = -Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.position.set(13.5, 1.2, 0); ship.add(bow);
    const deck = box(21, .4, 6, lam(0x8a6238)); deck.position.y = 3.1; ship.add(deck);
    [[-6, 16], [2, 19], [9, 13]].forEach(([mx, mh2]) => {
      const mast = cyl(.32, .4, mh2, M.woodDark); mast.position.set(mx, 3 + mh2 / 2, 0); ship.add(mast);
      const yard = box(7, .25, .25, M.woodDark); yard.position.set(mx, 3 + mh2 * .72, 0); ship.add(yard);
      const sail = new THREE.Mesh(new THREE.PlaneGeometry(6, mh2 * .4),
        new THREE.MeshLambertMaterial({ color: 0xe8e0cc, side: THREE.DoubleSide }));
      sail.position.set(mx, 3 + mh2 * .5, 0); ship.add(sail);
    });
    const nest = cyl(.9, .7, 1.2, M.woodDark); nest.position.set(2, 3 + 19 * .9, 0); ship.add(nest);
    ship.position.set(168, 0, pz4 + 92); ship.rotation.y = Math.PI / 2;
    scene.add(ship);
    window.__pequod = ship;
    // 金币桅杆(码头尽头,亚哈的悬赏)
    const dh2 = 2;
    const mast2 = cyl(.3, .38, 9, M.woodDark); mast2.position.set(150, dh2 + 4.5, pz4 + 105); scene.add(mast2);
    const coin = cyl(.75, .75, .12, new THREE.MeshBasicMaterial({ color: 0xffd76a }));
    coin.rotation.x = Math.PI / 2; coin.position.set(150, dh2 + 5.6, pz4 + 104.7); scene.add(coin);
    addSpot(150, pz4 + 102, 'mob', 'doubloon', { r: 7 });
    // 码头杂物:油桶与标枪架
    for (let i = 0; i < 3; i++) {
      const barrel = cyl(1, 1.1, 2.2, M.wood); barrel.position.set(140 + i * 4, height(140 + i * 4, pz4 + 48) + 1.4, pz4 + 48); scene.add(barrel);
      cirObs.push({ x: 140 + i * 4, z: pz4 + 48, r: 1.4 });
    }
    for (let i = 0; i < 3; i++) {
      const harpoon = cyl(.08, .08, 5, lam(0x8a8a92)); harpoon.rotation.z = .4;
      harpoon.position.set(128 + i * 1.2, height(128, pz4 + 40) + 2.4, pz4 + 40); scene.add(harpoon);
    }
  }
  // —— 渡口与岛名牌 ——
  {
    const fh2 = height(120, 700);
    const plank = box(5, .5, 9, M.wood); plank.position.set(120, fh2 + .9, 696); scene.add(plank);
    addSpot(120, 699, 'ferry', 'ferry', { r: 8 });
    const msign2 = makeSign('南塔开特 · 捕鲸港', 7, '#1c2a30', '#bfe0e8');
    msign2.position.set(128, height(128, 720) + 4.4, 720); scene.add(msign2);
  }
  // —— 原著 NPC ——
  addNpc({ x: 152, z: pz4 + 96, y: 2.8, name: '亚哈船长', body: 0x1c1c20, hat: 0x2a2a30, opts: { tall: 1.12, cane: true },
    lines: ['它夺走了我的腿!我要追它到天涯海角!', '看好了——一枚西班牙金币,给第一个望见白鲸的人!', '就算太阳侮辱了我,我也要戳穿它。', '(牙骨假腿在甲板上笃、笃、笃地响)'] });
  addNpc({ x: 146, z: pz4 + 88, y: 2.8, name: '斯达巴克', body: 0x3a4a5a, hat: 0x2a3644,
    lines: ['我来捕鲸是为了糊口,不是为了复仇。', '船长,放过那头鲸,我们回家吧。', '(望着海面,轻声)南塔开特还有人在等我们。'] });
  addNpc({ x: px4 - 22, z: pz4 - 10, name: '以实玛利', body: 0x4a5a6a, hat: 0x6b5540,
    lines: ['叫我以实玛利吧。', '每当我心头阴雨绵绵,我就知道——该出海了。', '这家的蛤蜊杂烩汤,是全岛最好的。'] });
  addNpc({ x: px4 - 14, z: pz4 - 12, name: '魁魁格', body: 0x2e5a50, hat: 0x1c3830, opts: { wide: 1.3 },
    lines: ['(磨着标枪,朝你友善地点头)', '我的小神像约约说:今天风向不错。', '棺材?别怕,那是我的救生圈。'] });
  // —— 大白鲸莫比·迪克(环岛巡游,定时浮出喷水) ——
  mobyWhale = new THREE.Group();
  const wBody = new THREE.Mesh(new THREE.SphereGeometry(5, 18, 12), lam(0xf0ede4));
  wBody.scale.set(2.2, .9, 1); mobyWhale.add(wBody);
  const wHead = box(6.5, 6.5, 8.5, lam(0xf0ede4)); wHead.position.set(9, .8, 0); mobyWhale.add(wHead);
  const wTail = new THREE.Mesh(new THREE.ConeGeometry(2.6, 7, 6), lam(0xe8e4d8));
  wTail.rotation.z = Math.PI / 2; wTail.position.set(-12.5, .5, 0); mobyWhale.add(wTail);
  for (const sgn of [-1, 1]) {
    const fluke = box(4.5, .5, 3, lam(0xe8e4d8));
    fluke.position.set(-15.5, 1.4, sgn * 2); fluke.rotation.y = sgn * .5; mobyWhale.add(fluke);
  }
  for (const sgn of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.45, 8, 6), lam(0x1c1c20));
    eye.position.set(11.5, 1.6, sgn * 3.6); mobyWhale.add(eye);
  }
  mobyWhale.position.set(MOB.x, -7, MOB.z + 170);
  scene.add(mobyWhale);
  mobySpout = new THREE.Mesh(new THREE.ConeGeometry(1.6, 6, 8),
    new THREE.MeshBasicMaterial({ color: 0xeafaff, transparent: true, opacity: 0, depthWrite: false }));
  scene.add(mobySpout);
}
/* ================= 多元宇宙 5 号:体育岛(红色梦剧场) ================= */
let matchPlayers = [], matchBall = null, matchRef = null, score = [0, 0], scoreTex = null, scoreCtx = null;
let nextGoalT = 50, crowdBoost = 0, ballTarget = 0, ballSwapT = 0;
function updateScoreboard(minute) {
  if (!scoreCtx) return;
  const c = scoreCtx;
  c.fillStyle = '#0e0e12'; c.fillRect(0, 0, 512, 150);
  c.strokeStyle = '#c8102e'; c.lineWidth = 8; c.strokeRect(6, 6, 500, 138);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = '#fff'; c.font = 'bold 56px "Microsoft YaHei", sans-serif';
  c.fillText(`曼联 ${score[0]} : ${score[1]} 曼城`, 256, 62);
  c.fillStyle = '#ffd76a'; c.font = 'bold 30px sans-serif';
  c.fillText(`${minute}'  MANCHESTER DERBY`, 256, 116);
  scoreTex.needsUpdate = true;
}
{
  const cx3 = SPT.x, cz3 = SPT.z, baseH = 6;
  // —— 草坪:FIFA 标准画线(10px = 1m,105×68 场地 + 2m 缓冲) ——
  {
    const pc = document.createElement('canvas'); pc.width = 1090; pc.height = 720;
    const c = pc.getContext('2d');
    for (let i = 0; i < 12; i++) {   // 浅绿 / 深绿割草条纹
      c.fillStyle = i % 2 ? '#57b463' : '#2f7a3c';
      c.fillRect(20 + i * 87.5, 0, 87.5, 720);
    }
    c.fillStyle = '#2f7a3c'; c.fillRect(0, 0, 20, 720); c.fillRect(1070, 0, 20, 720);
    c.strokeStyle = '#ffffff'; c.fillStyle = '#ffffff'; c.lineWidth = 5;
    c.strokeRect(20, 20, 1050, 680);                                   // 边线与底线
    c.beginPath(); c.moveTo(545, 20); c.lineTo(545, 700); c.stroke();  // 中线
    c.beginPath(); c.arc(545, 360, 91.5, 0, 7); c.stroke();            // 中圈 9.15m
    c.beginPath(); c.arc(545, 360, 5, 0, 7); c.fill();                 // 中点
    for (const [x0, dir] of [[20, 1], [1070, -1]]) {
      c.strokeRect(dir > 0 ? x0 : x0 - 165, 158.4, 165, 403.2);        // 罚球区 16.5m
      c.strokeRect(dir > 0 ? x0 : x0 - 55, 268.4, 55, 183.2);          // 球门区 5.5m
      const px5 = x0 + dir * 110;
      c.beginPath(); c.arc(px5, 360, 5, 0, 7); c.fill();               // 点球点 11m
      const a0 = Math.acos(55 / 91.5);                                  // 罚球弧(区外部分)
      c.beginPath();
      if (dir > 0) c.arc(px5, 360, 91.5, -a0, a0);
      else c.arc(px5, 360, 91.5, Math.PI - a0, Math.PI + a0);
      c.stroke();
    }
    for (const [cx5, cy5, a1, a2] of [[20, 20, 0, Math.PI / 2], [1070, 20, Math.PI / 2, Math.PI], [1070, 700, Math.PI, Math.PI * 1.5], [20, 700, Math.PI * 1.5, Math.PI * 2]]) {
      c.beginPath(); c.arc(cx5, cy5, 10, a1, a2); c.stroke();          // 角旗弧 1m
    }
    const ptex = new THREE.CanvasTexture(pc); ptex.colorSpace = THREE.SRGBColorSpace;
    const pitch = new THREE.Mesh(new THREE.PlaneGeometry(44, 29), new THREE.MeshLambertMaterial({ map: ptex }));
    pitch.rotation.x = -Math.PI / 2; pitch.position.set(cx3, baseH + .12, cz3); scene.add(pitch);
    // —— 网状球门(门柱 + 横梁 + 线框网) ——
    for (const sgn of [-1, 1]) {
      const gx2 = cx3 + sgn * 21.2;
      for (const pz6 of [-4, 4]) {
        const post = cyl(.14, .14, 3.4, M.white); post.position.set(gx2, baseH + 1.7, cz3 + pz6); scene.add(post);
      }
      const bar = cyl(.14, .14, 8, M.white); bar.rotation.x = Math.PI / 2; bar.position.set(gx2, baseH + 3.4, cz3); scene.add(bar);
      const netMat = new THREE.MeshBasicMaterial({ color: 0xf0f0f0, wireframe: true, transparent: true, opacity: .55 });
      const backNet = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.4, 16, 7), netMat);
      backNet.rotation.y = Math.PI / 2; backNet.position.set(gx2 + sgn * 1.4, baseH + 1.7, cz3); scene.add(backNet);
      const topNet = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 8, 3, 16), netMat);
      topNet.rotation.z = Math.PI / 2; topNet.rotation.y = Math.PI / 2;
      topNet.rotation.x = Math.PI / 2; topNet.position.set(gx2 + sgn * .7, baseH + 3.4, cz3); scene.add(topNet);
      for (const pz6 of [-4, 4]) {   // 侧网
        const sideNet = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 3.4, 3, 7), netMat);
        sideNet.position.set(gx2 + sgn * .7, baseH + 1.7, cz3 + pz6); scene.add(sideNet);
      }
    }
  }
  // —— 20 层红色看台(碗状) ——
  const redA = lam(0xc8102e), redB = lam(0x9c0c24);
  redA.side = THREE.DoubleSide; redB.side = THREE.DoubleSide;
  for (let i = 0; i < 20; i++) {
    const r = 27 + i * 1.05;
    const tier = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1.0, 30, 1, true), i % 2 ? redA : redB);
    tier.position.set(cx3, baseH + 1 + i * 1.02, cz3);
    scene.add(tier);
  }
  // 顶檐与泛光灯
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(48.5, 48.5, .8, 30, 1, true),
    new THREE.MeshLambertMaterial({ color: 0xe8e4dc, side: THREE.DoubleSide }));
  rim.position.set(cx3, baseH + 21.6, cz3); scene.add(rim);
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2 + Math.PI / 4;
    const fx = cx3 + Math.cos(a) * 54, fz = cz3 + Math.sin(a) * 54;
    const pole = cyl(.5, .7, 34, M.stone); pole.position.set(fx, baseH + 17, fz); scene.add(pole);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(6, 3.4, .8), new THREE.MeshBasicMaterial({ color: 0xfff8e0 }));
    panel.position.set(fx, baseH + 34, fz); panel.lookAt(cx3, baseH + 10, cz3); scene.add(panel);
    cirObs.push({ x: fx, z: fz, r: 1.2 });
  }
  // —— 螺旋上升的外坡道(缠绕两圈) ——
  for (let i = 0; i < 72; i++) {
    const tt = i / 72;
    const a = tt * Math.PI * 4;
    const rr = 51;
    const seg = box(4.6, .5, 2.4, lam(0xe23b4e));
    seg.position.set(cx3 + Math.cos(a) * rr, baseH + 1.5 + tt * 19, cz3 + Math.sin(a) * rr);
    seg.rotation.y = -a;
    scene.add(seg);
  }
  // —— 四座出口大门(东南西北) ——
  const gateNames = ['北门 · 出口1', '东门 · 出口2', '南门 · 出口3', '西门 · 出口4'];
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2 - Math.PI / 2;   // 北/东/南/西
    const gx = cx3 + Math.cos(a) * 48, gz = cz3 + Math.sin(a) * 48;
    const gate = box(9, 7, 5, lam(0x6b0a18)); gate.position.set(gx, baseH + 3.5, gz); gate.rotation.y = -a; scene.add(gate);
    const arch = box(4.5, 5, 5.4, lam(0x1c1014)); arch.position.set(gx, baseH + 2.5, gz); arch.rotation.y = -a; scene.add(arch);
    const gs2 = makeSign(gateNames[i], 4.6, '#6b0a18', '#ffd76a');
    gs2.position.set(gx, baseH + 8.2, gz); gs2.rotation.y = -a + Math.PI / 2; scene.add(gs2);
  }
  // (看台不设碰撞墙:可从任意方向拾级而上——见 stadiumHeight)
  // —— 记分牌(北侧高悬) ——
  {
    const sc2 = document.createElement('canvas'); sc2.width = 512; sc2.height = 150;
    scoreCtx = sc2.getContext('2d');
    scoreTex = new THREE.CanvasTexture(sc2); scoreTex.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(17, 5),
      new THREE.MeshBasicMaterial({ map: scoreTex, side: THREE.DoubleSide }));
    board.position.set(cx3, baseH + 27, cz3 - 46); scene.add(board);
    updateScoreboard(0);
  }
  // —— 场上 22 名球员(与玩家同比例)+ 门将异色 + 裁判 + 皮球 ——
  function makeFootballer(kitCol, shortsCol) {
    const g = new THREE.Group();
    const bodyP = cyl(.5, .58, 1.1, lam(kitCol)); bodyP.position.y = 1.35; g.add(bodyP);
    const shorts = cyl(.52, .5, .5, lam(shortsCol)); shorts.position.y = .58; g.add(shorts);
    const legs = cyl(.42, .46, .5, lam(0xf2c9a0)); legs.position.y = .18; g.add(legs);
    const headP = new THREE.Mesh(new THREE.SphereGeometry(.5, 9, 7), lam(0xf2c9a0)); headP.position.y = 2.25; g.add(headP);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(.5, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2.4), lam(0x2a2018)); hair.position.y = 2.38; g.add(hair);
    return g;
  }
  for (let i = 0; i < 22; i++) {
    const home = i < 11;
    const col = i % 11;
    const isGK = col === 0;
    // 曼联红/白,门将亮黄;曼城天蓝/白,门将橙
    const kit = home ? (isGK ? 0xf2d13c : 0xc8102e) : (isGK ? 0xe87422 : 0x6cabdd);
    const g = makeFootballer(kit, isGK ? 0x1c1c20 : 0xffffff);
    let ax, az;
    if (isGK) { ax = (home ? -1 : 1) * 19.6; az = 0; }
    else {
      const row = Math.floor((col - 1) / 4), lane = (col - 1) % 4;
      ax = (home ? -1 : 1) * (5 + row * 6);
      az = (lane - 1.5) * 6.4;
    }
    g.userData = { ax: cx3 + ax, az: cz3 + az, ph: i * 1.3, sp: .6 + (i % 5) * .18, gk: isGK };
    g.position.set(g.userData.ax, baseH + .1, g.userData.az);
    scene.add(g); matchPlayers.push(g);
  }
  matchRef = makeFootballer(0x1c1c20, 0x1c1c20);   // 黑衣裁判
  matchRef.position.set(cx3, baseH + .1, cz3 + 3);
  scene.add(matchRef);
  matchBall = new THREE.Mesh(new THREE.SphereGeometry(.42, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  matchBall.position.set(cx3, baseH + .5, cz3);
  scene.add(matchBall);
  // —— 看台上的球迷(实例化,主场红海 + 东北角客队蓝区) ——
  {
    const fanGeo = new THREE.ConeGeometry(.38, 1.05, 5);
    const spotsF = [];
    for (let i = 0; i < 20; i++) {
      const rr = 27.5 + i * 1.05;
      const n = Math.floor(rr * Math.PI * 2 / 1.35);
      for (let k = 0; k < n; k++) {
        if (Math.random() > .88) continue;   // 少量空座
        spotsF.push([rr, k / n * Math.PI * 2, i]);
      }
    }
    const fans = new THREE.InstancedMesh(fanGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), spotsF.length);
    const m4f = new THREE.Matrix4(), qf = new THREE.Quaternion(), sf = new THREE.Vector3(1, 1, 1), pf = new THREE.Vector3();
    const cRed = new THREE.Color(0xc8102e), cRed2 = new THREE.Color(0x8c1c2c), cBlue = new THREE.Color(0x6cabdd), cWhite = new THREE.Color(0xe8e4dc);
    spotsF.forEach(([rr, a, tier], idx) => {
      pf.set(cx3 + Math.cos(a) * rr, baseH + 1.02 * (tier + 1) + .5, cz3 + Math.sin(a) * rr);
      sf.setScalar(.9 + Math.random() * .25);
      m4f.compose(pf, qf, sf);
      fans.setMatrixAt(idx, m4f);
      const away = a > .55 && a < 1.25;   // 东北角客队区
      const r0 = Math.random();
      fans.setColorAt(idx, away ? (r0 < .85 ? cBlue : cWhite) : (r0 < .7 ? cRed : (r0 < .88 ? cRed2 : cWhite)));
    });
    fans.instanceMatrix.needsUpdate = true;
    if (fans.instanceColor) fans.instanceColor.needsUpdate = true;
    scene.add(fans);
  }
  // —— 场外:队旗 / 渡口 / 岛名牌 ——
  const f1 = makeSign('曼联 MUFC', 5, '#c8102e', '#ffd76a'); f1.position.set(cx3 - 12, baseH + 9, cz3 + 52); scene.add(f1);
  const f2 = makeSign('曼城 MCFC', 5, '#6cabdd', '#1c2c4c'); f2.position.set(cx3 + 12, baseH + 9, cz3 + 52); scene.add(f2);
  addSpot(cx3, cz3 + 51, 'spt', 'stadium', { r: 9 });
  addSpot(cx3, cz3 + 17, 'spt', 'pitch', { r: 10 });
  {
    const dh3 = height(-682, 120);
    const plank = box(9, .5, 5, M.wood); plank.position.set(-686, dh3 + .9, 120); scene.add(plank);
    addSpot(-684, 120, 'ferry', 'ferry', { r: 8 });
    const ss2 = makeSign('体育岛 · 梦剧场', 7, '#4a0a14', '#ffb8c4');
    ss2.position.set(-700, height(-700, 138) + 4.4, 138); scene.add(ss2);
  }
  // —— 场边 NPC ——
  addNpc({ x: cx3 - 8, z: cz3 + 17, name: '弗格森', body: 0x1c1c20, hat: 0xc8102e,
    lines: ['补时阶段,才是我们的主场——弗格森时间!', 'Football, bloody hell!', '(嚼着口香糖,死死盯着场上)'] });
  addNpc({ x: cx3 + 8, z: cz3 + 17, name: '瓜迪奥拉', body: 0x2c3e50, hat: 0x6cabdd, opts: { tall: 1.05 },
    lines: ['传球!把球传起来!控住它!', '(蹲在场边,手势复杂得像在解微分方程)', '德比,从来没有容易两个字。'] });
  addNpc({ x: cx3 - 20, z: cz3 + 50, name: '红魔球迷', body: 0xc8102e, hat: 0xffd76a, opts: { wide: 1.2 },
    lines: ['Glory Glory Man United!', '两万条围巾,今天全到齐了!', '20 层看台,座无虚席——你听这声浪!'] });
}
/* 多元宇宙渡口(鲸岛东滩) */
{
  const fh = height(380, 12);
  const plank = box(5, .5, 10, M.wood); plank.position.set(384, fh + .9, 12); scene.add(plank);
  const post = cyl(.3, .3, 4, M.woodDark); post.position.set(381, fh + 1.8, 17); scene.add(post);
  const fsign = makeSign('多元宇宙渡口', 6.4, '#141826', '#9fb8e8');
  fsign.position.set(380, fh + 4.6, 4); scene.add(fsign);
  addSpot(382, 12, 'ferry', 'ferry', { r: 8 });
  addNpc({ x: 376, z: 20, name: '卡戎', body: 0x3a3a44, hat: 0x1c1c26,
    lines: ['渡一切想去别的世界的人。', '楚门的世界已通航;中土、霍格沃茨、花果山,在建。', '船票免费,回程也是——但记忆要自己带回来。'] });
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
    const x = (px / mm.width - .5) * 1900, z = (py / mm.height - .5) * 1800;
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
  const W2X = x => (x / 1900 + .5) * mm.width, W2Y = z => (z / 1800 + .5) * mm.height;
  for (const zn of ZONES3D) {
    if (zn.key === 'plaza') continue;
    mctx.fillStyle = CATS[zn.key].color;
    mctx.beginPath(); mctx.arc(W2X(zn.x), W2Y(zn.z), 3, 0, 7); mctx.fill();
  }
  mctx.fillStyle = '#ffe9a8';   // 灯塔
  mctx.beginPath(); mctx.arc(W2X(IS2.x), W2Y(IS2.z), 2.6, 0, 7); mctx.fill();
  mctx.fillStyle = '#f5c9d4';   // 楚门的世界
  mctx.beginPath(); mctx.arc(W2X(TRU.x), W2Y(TRU.z), 2.6, 0, 7); mctx.fill();
  mctx.fillStyle = '#cfe8a8';   // 中土
  mctx.beginPath(); mctx.arc(W2X(MID.x), W2Y(MID.z), 2.6, 0, 7); mctx.fill();
  mctx.fillStyle = '#cfb8ff';   // 霍格沃茨
  mctx.beginPath(); mctx.arc(W2X(HOG.x), W2Y(HOG.z), 2.6, 0, 7); mctx.fill();
  mctx.fillStyle = '#bfe0e8';   // 南塔开特
  mctx.beginPath(); mctx.arc(W2X(MOB.x), W2Y(MOB.z), 2.6, 0, 7); mctx.fill();
  mctx.fillStyle = '#ff6b7e';   // 体育岛
  mctx.beginPath(); mctx.arc(W2X(SPT.x), W2Y(SPT.z), 2.6, 0, 7); mctx.fill();
  if (mobyWhale && mobyWhale.position.y > -2.5) {   // 浮出的白鲸
    mctx.fillStyle = '#ffffff';
    mctx.beginPath(); mctx.arc(W2X(mobyWhale.position.x), W2Y(mobyWhale.position.z), 2.2, 0, 7); mctx.fill();
  }
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
CP_MARKS.push({ x: TRU.x, z: TRU.z, col: '#f5c9d4' });
CP_MARKS.push({ x: MID.x, z: MID.z, col: '#cfe8a8' });
CP_MARKS.push({ x: HOG.x, z: HOG.z, col: '#cfb8ff' });
CP_MARKS.push({ x: MOB.x, z: MOB.z, col: '#bfe0e8' });
CP_MARKS.push({ x: SPT.x, z: SPT.z, col: '#ff6b7e' });
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
/* 梦剧场看台台阶(可拾级而上,20 层) */
function stadiumHeight(x, z) {
  const d = Math.hypot(x - SPT.x, z - SPT.z);
  if (d < 26.8 || d > 48.4) return null;
  const i = Math.min(19, Math.floor((d - 26.8) / 1.05));
  return 6 + 1.02 * (i + 1);
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
  const sv = JSON.parse(PSTORE.getItem('w1001.pos3d') || 'null');
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
const HINTS = { painting: '欣赏这幅画', shelf: '翻翻这架书', tree: '观察这只鸟', bed: '看看这株植物', bar: '来一杯!', keg: '看看这桶酒', table: '看看桌上的酒', tank: '看看水里', crate: '翻翻唱片', stand: '听听这份录音', tent: '参观营地', board: '查看路线', sign: '查看路牌', news: '报亭 · 今日两刊', shop: '逛逛装备行', ferry: '多元宇宙渡口', door: '推开天空之门', camera: '看看那是什么', lamp: '检查坠落物', ring: '看看基座上的东西', crater: '末日火山口', hole: '敲敲圆门', eye: '仰望黑塔(别看太久)', train: '霍格沃茨特快', castle: '城堡大门 · 分院帽', hoops: '魁地奇球场', hut: '拜访海格小屋', inn: '喷水鲸客栈', chowder: '来碗杂烩汤(4 SB)', doubloon: '桅杆上的金币', stadium: '梦剧场 · 德比日', pitch: '场边观战' };
const clock = new THREE.Clock();
const v3 = new THREE.Vector3();
let saveT = 0, whaleT = 20, coldT = 0, lastTint = 0x3b6ea5, chowderT = 0, lastScoreMin = -1;
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
      const sp = (swimming ? (gearOn('swim') ? 7.5 : (chowderT > 0 ? 5.5 : 3.2)) : (keys.shift ? (gearOn('boots') ? 26 : 22) : 14)) * dt;
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
  const sth = stadiumHeight(player.position.x, player.position.z);
  if (sth != null && player.position.y > sth - 2.4) gh = Math.max(gh, sth);
  swimming = gh < -.6;
  if (swimming) {
    vy = 0; grounded = false;
    player.position.y += ((-.55 + tideY) - player.position.y) * Math.min(1, dt * 6);
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
  trumanCams.forEach((m2, i) => m2.color.setHex(Math.sin(t * 4 + i * 2) > 0 ? 0xff2222 : 0x481414));
  if (sauronEye) { sauronEye.lookAt(player.position.x, player.position.y + 2, player.position.z); }   // 魔眼盯人
  /* 大白鲸莫比·迪克:环岛巡游,定时浮出喷水 */
  if (mobyWhale) {
    const wa = t * .045;
    const wx3 = MOB.x + Math.cos(wa) * 175, wz3 = MOB.z + Math.sin(wa) * 175;
    const cyc2 = t % 42;
    const surfaced = cyc2 < 13;
    const targetY = surfaced ? -1 : -8;
    mobyWhale.position.x = wx3; mobyWhale.position.z = wz3;
    mobyWhale.position.y += (targetY - mobyWhale.position.y) * Math.min(1, dt * 1.2);
    mobyWhale.rotation.y = -wa - Math.PI;
    mobyWhale.rotation.z = Math.sin(t * .8) * .04;
    if (surfaced && (cyc2 % 4.5) < 1.1 && mobyWhale.position.y > -2.5) {
      const k2 = (cyc2 % 4.5) / 1.1;
      mobySpout.material.opacity = Math.sin(k2 * Math.PI) * .8;
      mobySpout.position.set(wx3 + Math.cos(mobyWhale.rotation.y) * 10, 3 + k2 * 3.5, wz3 - Math.sin(mobyWhale.rotation.y) * 10);
      mobySpout.scale.setScalar(.7 + k2 * 1);
    } else mobySpout.material.opacity = 0;
    // 悬赏目击判定
    if (surfaced && dblState === 'active' && mobyWhale.position.y > -2.5) {
      const dW = Math.hypot(player.position.x - wx3, player.position.z - wz3);
      if (dW < 120) {
        setDbl('seen');
        toast('🐳 白鲸!!它在那儿喷水!快回码头找亚哈领金币!');
        blip(880); setTimeout(() => blip(660), 140);
      }
    }
  }
  /* 梦剧场:德比进行中 */
  if (matchBall) {
    const minute = Math.floor(t / 4) % 90;
    for (const p2 of matchPlayers) {
      const u = p2.userData;
      if (u.gk) {   // 门将:守在门线,小幅横移
        p2.position.x = u.ax + Math.sin(t * u.sp + u.ph) * .5;
        p2.position.z = u.az + Math.sin(t * u.sp * 1.3 + u.ph) * 2.6;
      } else {
        p2.position.x = u.ax + Math.sin(t * u.sp + u.ph) * 3.2;
        p2.position.z = u.az + Math.cos(t * u.sp * .8 + u.ph) * 2.6;
      }
      p2.lookAt(matchBall.position.x, p2.position.y, matchBall.position.z);
    }
    if (matchRef) {   // 裁判贴着皮球跑动
      matchRef.position.x += (matchBall.position.x + 3.5 - matchRef.position.x) * Math.min(1, dt * 1.6);
      matchRef.position.z += (matchBall.position.z + 3 - matchRef.position.z) * Math.min(1, dt * 1.6);
      matchRef.lookAt(matchBall.position.x, matchRef.position.y, matchBall.position.z);
    }
    ballSwapT -= dt;
    if (ballSwapT <= 0) { ballSwapT = 1.4 + Math.random() * 1.2; ballTarget = Math.floor(Math.random() * matchPlayers.length); }
    const tp = matchPlayers[ballTarget];
    matchBall.position.x += (tp.position.x - matchBall.position.x) * Math.min(1, dt * 3);
    matchBall.position.z += (tp.position.z - matchBall.position.z) * Math.min(1, dt * 3);
    matchBall.position.y = 6.5 + Math.abs(Math.sin(t * 6)) * .5;
    nextGoalT -= dt;
    if (nextGoalT <= 0) {
      nextGoalT = 55 + Math.random() * 60;
      const homeGoal = Math.random() < .58;   // 主场优势
      score[homeGoal ? 0 : 1]++;
      updateScoreboard(minute);
      crowdBoost = homeGoal ? 2.2 : 1.2;
      if (Math.hypot(player.position.x - SPT.x, player.position.z - SPT.z) < 260) {
        toast(`⚽ GOOOAL!${homeGoal ? '曼联' : '曼城'}破门!曼联 ${score[0]} - ${score[1]} 曼城`);
        blip(660); setTimeout(() => blip(880), 100); setTimeout(() => blip(1100), 200);
      }
    }
    if (Math.floor(t) % 5 === 0 && Math.floor(t) !== lastScoreMin) { lastScoreMin = Math.floor(t); updateScoreboard(minute); }
    crowdBoost = Math.max(0, crowdBoost - dt * .6);
    if (crowdGain) {
      const dStad = Math.hypot(player.position.x - SPT.x, player.position.z - SPT.z);
      const tgt = clamp(1 - dStad / 240, 0, 1) * (.035 + crowdBoost * .05);
      crowdGain.gain.value += (tgt - crowdGain.gain.value) * Math.min(1, dt * 3);
    }
  }
  /* 金色飞贼:绕场乱飞,碰到即抓住 */
  if (snitch) {
    if (snitch.visible) {
      const u = snitch.userData;
      snitch.position.set(
        u.cx + Math.sin(t * 1.7) * 16 + Math.sin(t * 3.3) * 5,
        u.cy + 3.5 + Math.sin(t * 2.6) * 2 + Math.cos(t * 4.1) * 1,
        u.cz + Math.cos(t * 1.3) * 13 + Math.cos(t * 2.9) * 5);
      u.wl.rotation.y = Math.sin(t * 22) * .9; u.wr.rotation.y = -Math.sin(t * 22) * .9;
      const dS = snitch.position.distanceTo(player.position);
      if (dS < 3.2) {
        snitch.visible = false; snitchT = 45;
        earnSB(8);
        toast('✨ 抓住了金色飞贼!⚡+8(45 秒后它会再出现)');
        blip(990); setTimeout(() => blip(1320), 90);
      }
    } else {
      snitchT -= dt;
      if (snitchT <= 0) snitch.visible = true;
    }
  }
  if (lavaDisc) { const lp = 1 + Math.sin(t * 3) * .06; lavaDisc.scale.set(lp, 1, lp); lavaDisc.material.color.setHex(Math.sin(t * 5) > 0 ? 0xff5a1a : 0xff7a2e); }
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
    try { PSTORE.setItem('w1001.pos3d', JSON.stringify([+player.position.x.toFixed(1), +player.position.z.toFixed(1)])); } catch (e) {}
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
  chowderT = Math.max(0, chowderT - dt);
  if (swimming && !gearOn('swim') && chowderT <= 0) {
    coldT += dt;
    if (coldT > 7) { coldT = 0; toast('🥶 好冷!没泳衣游不快——买件泳衣,或去南塔开特喝碗热杂烩汤'); }
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
  const onTruman = Math.hypot(player.position.x - TRU.x, player.position.z - TRU.z) < TRU.r + 20;
  const onMid = Math.hypot(player.position.x - MID.x, player.position.z - MID.z) < MID.r + 20;
  const onMordor = onMid && Math.hypot(player.position.x - VOL.x, player.position.z - VOL.z) < 90;
  const onHog = Math.hypot(player.position.x - HOG.x, player.position.z - HOG.z) < HOG.r + 20;
  const onMob = Math.hypot(player.position.x - MOB.x, player.position.z - MOB.z) < MOB.r + 20;
  const onSpt = Math.hypot(player.position.x - SPT.x, player.position.z - SPT.z) < SPT.r + 20;
  const mz2 = swimming ? 'fish' : (onMordor ? 'mordor' : (onMid ? 'shire' : (onHog ? 'hogwarts' : (onMob ? 'mobydick' : (onSpt ? 'stadium' : (onTruman ? 'truman' : (hereKey || 'street')))))));
  if (mz2 !== musicZone) { musicZone = mz2; melIdx = 3; }
  const onIsle2 = Math.hypot(player.position.x - IS2.x, player.position.z - IS2.z) < IS2.r + 10;
  const onBridge = !swimming && bh != null && Math.abs(player.position.y - bh) < 3;
  $('zoneIcon').textContent = swimming ? '🌊' : (onMordor ? '🌋' : (onMid ? '💍' : (onHog ? '⚡' : (onMob ? '🐳' : (onSpt ? '⚽' : (onTruman ? '📺' : (hereKey ? CATS[hereKey].icon : (onBridge ? '🌉' : (onIsle2 ? '🗼' : '🧭')))))))));
  $('zoneName').textContent = swimming ? '大海' : (onMordor ? '中土 · 魔多' : (onMid ? '中土 · 夏尔' : (onHog ? '霍格沃茨' : (onMob ? '南塔开特 · 捕鲸港' : (onSpt ? '体育岛 · 梦剧场' : (onTruman ? '楚门的世界 · 桃源岛' : (hereKey ? CATS[hereKey].name : (onBridge ? '跨海大桥' : (onIsle2 ? '灯塔屿' : '鲸背旷野')))))))));

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

window.__w3d = { player, spots, TRAVEL3D, openCard, openJournal, seen, height, camera, scene, allNpcs, shards, collectShard, boats, bridgeHeight, islandMask, spendSB, earnSB, sb: () => sb, paperHTML, fishing, startCast, catchFish, FSPOTS, pierHeight, GEAR, gear, gearOn, openBag, parsePantheon, pantheonHTML, openPantheon, openAccount, profileList, PROFILE_ID: () => PROFILE_ID };
