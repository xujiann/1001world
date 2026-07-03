/* ============================================================
   1001 世界 · 1001 World — 可漫游的收藏宇宙
   一个纯 Canvas 开放世界小游戏,内容来自 1001×1001 系列真实数据。
   ============================================================ */
(() => {
'use strict';
const D = window.WORLD_DATA;
const CDN = {
  art: 'https://cdn.jsdelivr.net/gh/xujiann/1001art-img@v1/',
  plants: 'https://cdn.jsdelivr.net/gh/xujiann/1001plants-img@v1/',
};
const commonsImg = f => 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(f) + '?width=440';
const WORLD = { w: 3200, h: 2400 };

/* ---------- 收藏类别 ---------- */
const CATS = {
  art:       { icon: '🖼️', name: '一〇〇一美术馆', en: 'Art Museum',       color: '#8e5bd6', link: 'https://xujiann.github.io/1001art/',       tot: D.totals.art,       unit: '件真迹' },
  books:     { icon: '📚', name: '千夜图书馆',     en: 'Grand Library',    color: '#b5651d', link: 'https://xujiann.github.io/',               tot: D.totals.books,     unit: '本经典' },
  birds:     { icon: '🐦', name: '百鸟林',         en: 'Bird Forest',      color: '#2e86ab', link: 'https://xujiann.github.io/',               tot: 1001,               unit: '种飞鸟' },
  plants:    { icon: '🌿', name: '奇花植物园',     en: 'Botanical Garden', color: '#27ae60', link: 'https://xujiann.github.io/1001plants/',    tot: D.totals.plants,    unit: '种植物' },
  beers:     { icon: '🍺', name: '1001 酒馆',      en: 'The 1001 Tavern',  color: '#d35400', link: 'https://xujiann.github.io/1001craft/',     tot: 1001,               unit: '款精酿' },
  fish:      { icon: '🐠', name: '深蓝水族馆',     en: 'Aquarium',         color: '#16a085', link: 'https://xujiann.github.io/',               tot: D.totals.fish,      unit: '种鱼' },
  jazz:      { icon: '🎷', name: '蓝调爵士俱乐部', en: 'Jazz Club',        color: '#c0392b', link: 'https://xujiann.github.io/1001jazz/',      tot: D.totals.jazz,      unit: '张专辑' },
  classical: { icon: '🎻', name: '黄金音乐厅',     en: 'Concert Hall',     color: '#c8912a', link: 'https://xujiann.github.io/1001classical/', tot: D.totals.classical, unit: '份录音' },
  outdoor:   { icon: '⛰️', name: '远方营地',       en: 'Basecamp',         color: '#2c7a4b', link: 'https://xujiann.github.io/',               tot: 1001,               unit: '种户外' },
};
const BEER_COLOR  = { lager:'#f5c542', pale:'#e8a33c', ipa:'#e07b28', wheat:'#ecd48a', belgian:'#c87f2f', stout:'#33200f', sour:'#d94f6b', amber:'#a8542c', strong:'#7a3b1e', specialty:'#8c6d3f' };
const FISH_COLOR  = { reef:'#ff7f50', fresh:'#58c470', pelagic:'#4a90d9', deep:'#5b4a8a', temperate:'#7f8fa6', special:'#d4a017', rare:'#d94f6b', more:'#6aa8a0' };
const SPORT_ICON  = { hike:'🥾', climb:'🧗', water:'🛶', surf:'🏄', dive:'🤿', snow:'⛷️', air:'🪂', wheel:'🚵', multi:'🏅', camp:'🏕️' };
const PALETTE = ['#c0392b','#2980b9','#27ae60','#8e44ad','#d35400','#16a085','#f39c12','#7f8c8d','#c2185b','#5d4037'];
const hashCol = s => PALETTE[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

/* ---------- 区域 ---------- */
const ZONES = [
  { key:'art',       x:180,  y:140,  w:840, h:660, indoor:true,  floor:'#efe9dc', door:{side:'b'} },
  { key:'books',     x:1230, y:120,  w:720, h:560, indoor:true,  floor:'#e2cfa8', door:{side:'b'} },
  { key:'birds',     x:2130, y:100,  w:940, h:820, indoor:false, floor:'#5d9451' },
  { key:'plants',    x:150,  y:1020, w:860, h:700, indoor:false, floor:'#6aa758' },
  { key:'beers',     x:2280, y:1060, w:640, h:500, indoor:true,  floor:'#8b5a2b', door:{side:'l'} },
  { key:'fish',      x:200,  y:1880, w:820, h:440, indoor:true,  floor:'#14364e', door:{side:'t'} },
  { key:'jazz',      x:1160, y:1780, w:520, h:460, indoor:true,  floor:'#31202e', door:{side:'t'} },
  { key:'classical', x:1780, y:1780, w:560, h:460, indoor:true,  floor:'#4a3524', door:{side:'t'} },
  { key:'outdoor',   x:2520, y:1720, w:600, h:600, indoor:false, floor:'#87a45f' },
];
const zoneOf = k => ZONES.find(z => z.key === k);
const zc = z => ({ x: z.x + z.w / 2, y: z.y + z.h / 2 });
// 快速旅行落点(区域门口)
const TRAVEL = {
  plaza:     { x:1560, y:1380 }, art: { x:600,  y:850 },  books: { x:1590, y:730 },
  birds:     { x:2500, y:970 },  plants: { x:1060, y:1360 }, beers: { x:2230, y:1310 },
  fish:      { x:610,  y:1830 }, jazz: { x:1420, y:1730 }, classical: { x:2060, y:1730 },
  outdoor:   { x:2820, y:1680 },
};

/* ---------- 小工具 ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rectHit = (r, x, y, rad) => x + rad > r.x && x - rad < r.x + r.w && y + rad > r.y && y - rad < r.y + r.h;
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffled(arr, rnd) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- 世界构建 ---------- */
const obstacles = [];   // {x,y,w,h}
const spots = [];       // 可交互点 {x,y,r,cat,type,item,zone}
const sprites = [];     // y 排序绘制 {y, draw(t)}
const wallRects = [];   // 墙(单独先画)
const T = 16;           // 墙厚

function addWalls(z) {
  const gap = 130, side = z.door.side;
  const cx = z.x + z.w / 2, cy = z.y + z.h / 2;
  const seg = (x, y, w, h) => { const r = { x, y, w, h }; wallRects.push(r); obstacles.push(r); };
  // top
  if (side === 't') { seg(z.x, z.y, cx - gap / 2 - z.x, T); seg(cx + gap / 2, z.y, z.x + z.w - cx - gap / 2, T); }
  else seg(z.x, z.y, z.w, T);
  // bottom
  if (side === 'b') { seg(z.x, z.y + z.h - T, cx - gap / 2 - z.x, T); seg(cx + gap / 2, z.y + z.h - T, z.x + z.w - cx - gap / 2, T); }
  else seg(z.x, z.y + z.h - T, z.w, T);
  // left
  if (side === 'l') { seg(z.x, z.y, T, cy - gap / 2 - z.y); seg(z.x, cy + gap / 2, T, z.y + z.h - cy - gap / 2); }
  else seg(z.x, z.y + T, T, z.h - 2 * T);
  // right
  if (side === 'r') { seg(z.x + z.w - T, z.y, T, cy - gap / 2 - z.y); seg(z.x + z.w - T, cy + gap / 2, T, z.y + z.h - cy - gap / 2); }
  else seg(z.x + z.w - T, z.y + T, T, z.h - 2 * T);
}

const rnd = mulberry32(20260703);
const pickers = {};   // 每类打乱后的取数器
for (const k of ['art', 'books', 'birds', 'plants', 'beers', 'fish', 'jazz', 'classical', 'outdoor'])
  pickers[k] = (arr => { let i = 0; return () => arr[i++ % arr.length]; })(shuffled(D[k], rnd));

function addSpot(x, y, cat, type, extra) {
  const item = (type === 'bar' || type === 'sign') ? null : pickers[cat]();
  spots.push(Object.assign({ x, y, r: 72, cat, type, item }, extra || {}));
}

/* --- 美术馆:墙上挂画 --- */
{
  const z = zoneOf('art'); addWalls(z);
  for (let i = 0; i < 6; i++) addSpot(280 + i * 130, 185, 'art', 'painting', { wall: 't' });
  for (let i = 0; i < 4; i++) addSpot(228, 300 + i * 115, 'art', 'painting', { wall: 'l' });
  for (let i = 0; i < 4; i++) addSpot(972, 300 + i * 115, 'art', 'painting', { wall: 'r' });
  // 中央长椅
  [[520, 470], [680, 470]].forEach(([x, y]) => {
    obstacles.push({ x: x - 40, y: y - 10, w: 80, h: 20 });
    sprites.push({ y, draw: c => { c.fillStyle = '#9c7b4f'; c.fillRect(x - 40, y - 10, 80, 20); c.fillStyle = '#7c5f3a'; c.fillRect(x - 40, y - 4, 80, 4); } });
  });
}
/* --- 图书馆:书架 --- */
{
  const z = zoneOf('books'); addWalls(z);
  for (let cI = 0; cI < 3; cI++) for (let r = 0; r < 4; r++) {
    const x = 1370 + cI * 220, y = 230 + r * 108;
    obstacles.push({ x: x - 85, y: y - 19, w: 170, h: 38 });
    const spineCols = Array.from({ length: 14 }, (_, i) => PALETTE[(i * 7 + cI + r) % PALETTE.length]);
    sprites.push({ y, draw: c => {
      c.fillStyle = '#6b4a2b'; c.fillRect(x - 85, y - 19, 170, 38);
      spineCols.forEach((col, i) => { c.fillStyle = col; c.fillRect(x - 78 + i * 11, y - 14, 8, 28); });
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x - 85, y + 15, 170, 4);
    } });
    addSpot(x, y + 34, 'books', 'shelf');
  }
}
/* --- 百鸟林:树与鸟 --- */
{
  const z = zoneOf('birds');
  const pts = [];
  let guard = 0;
  while (pts.length < 20 && guard++ < 600) {
    const x = z.x + 70 + rnd() * (z.w - 140), y = z.y + 90 + rnd() * (z.h - 150);
    if (pts.every(p => (p.x - x) ** 2 + (p.y - y) ** 2 > 110 ** 2)) pts.push({ x, y });
  }
  pts.forEach(p => {
    obstacles.push({ x: p.x - 9, y: p.y - 8, w: 18, h: 14 });
    addSpot(p.x, p.y - 6, 'birds', 'tree');
  });
}
/* --- 植物园:花圃 --- */
{
  for (let cI = 0; cI < 6; cI++) for (let r = 0; r < 3; r++) {
    const x = 240 + cI * 130, y = 1140 + r * 230;
    obstacles.push({ x: x - 52, y: y - 30, w: 104, h: 60 });
    addSpot(x, y + 34, 'plants', 'bed');
  }
}
/* --- 酒馆:吧台/酒桶/圆桌 --- */
{
  const z = zoneOf('beers'); addWalls(z);
  obstacles.push({ x: 2340, y: 1150, w: 480, h: 36 });    // 吧台
  sprites.push({ y: 1186, draw: c => {
    c.fillStyle = '#5e3d1e'; c.fillRect(2340, 1150, 480, 36);
    c.fillStyle = '#7a5227'; c.fillRect(2340, 1150, 480, 10);
    for (let i = 0; i < 6; i++) { c.fillStyle = '#caa24a'; c.fillRect(2380 + i * 80, 1138, 8, 14); }  // 酒头
  } });
  addSpot(2580, 1215, 'beers', 'bar', { r: 86 });
  for (let i = 0; i < 5; i++) {                            // 酒桶
    const x = 2370 + i * 112, y = 1500;
    obstacles.push({ x: x - 17, y: y - 16, w: 34, h: 30 });
    addSpot(x, y - 6, 'beers', 'keg');
  }
  [[2460, 1330], [2640, 1370], [2800, 1310], [2720, 1470]].forEach(([x, y]) => {  // 圆桌
    obstacles.push({ x: x - 22, y: y - 16, w: 44, h: 32 });
    addSpot(x, y, 'beers', 'table');
  });
}
/* --- 水族馆:鱼缸 --- */
{
  const z = zoneOf('fish'); addWalls(z);
  for (let i = 0; i < 6; i++) for (let r = 0; r < 2; r++) {
    const x = 300 + i * 122, y = 1990 + r * 180;
    obstacles.push({ x: x - 50, y: y - 34, w: 100, h: 66 });
    addSpot(x, y + 38, 'fish', 'tank');
  }
}
/* --- 爵士俱乐部 --- */
{
  const z = zoneOf('jazz'); addWalls(z);
  obstacles.push({ x: 1210, y: 1820, w: 420, h: 66 });
  sprites.push({ y: 1886, draw: (c, t) => {
    c.fillStyle = '#241422'; c.fillRect(1210, 1820, 420, 66);
    c.fillStyle = '#c0392b'; c.fillRect(1210, 1880, 420, 6);
    c.font = '34px serif'; c.fillText('🎷', 1300, 1868); c.fillText('🎹', 1390, 1868); c.fillText('🥁', 1480, 1868);
    c.fillStyle = `rgba(255,210,120,${.18 + .1 * Math.sin(t / 300)})`;
    c.beginPath(); c.arc(1420, 1855, 90, 0, 7); c.fill();
  } });
  for (let i = 0; i < 5; i++) for (let r = 0; r < 2; r++) {
    const x = 1250 + i * 88, y = 2010 + r * 130;
    obstacles.push({ x: x - 28, y: y - 18, w: 56, h: 34 });
    addSpot(x, y + 24, 'jazz', 'crate');
  }
}
/* --- 音乐厅 --- */
{
  const z = zoneOf('classical'); addWalls(z);
  obstacles.push({ x: 1830, y: 1820, w: 460, h: 66 });
  sprites.push({ y: 1886, draw: (c, t) => {
    c.fillStyle = '#3a2a18'; c.fillRect(1830, 1820, 460, 66);
    c.fillStyle = '#c8912a'; c.fillRect(1830, 1880, 460, 6);
    c.font = '34px serif'; c.fillText('🎻', 1930, 1868); c.fillText('🎹', 2040, 1868); c.fillText('🎺', 2140, 1868);
    c.fillStyle = `rgba(255,230,160,${.15 + .1 * Math.sin(t / 400)})`;
    c.beginPath(); c.arc(2060, 1855, 100, 0, 7); c.fill();
  } });
  for (let i = 0; i < 5; i++) for (let r = 0; r < 2; r++) {
    const x = 1870 + i * 96, y = 2020 + r * 130;
    addSpot(x, y, 'classical', 'stand');
  }
}
/* --- 营地 --- */
{
  [[2620, 1830, '#c0392b'], [2800, 1810, '#2980b9'], [2980, 1850, '#f39c12'], [2670, 2010, '#27ae60'], [2920, 2000, '#8e44ad']].forEach(([x, y, col]) => {
    obstacles.push({ x: x - 42, y: y - 18, w: 84, h: 40 });
    addSpot(x, y + 30, 'outdoor', 'tent', { tint: col });
  });
  [[2590, 2160], [2730, 2220], [2870, 2140], [3010, 2240], [2770, 2090]].forEach(([x, y]) => {
    obstacles.push({ x: x - 6, y: y - 4, w: 12, h: 8 });
    addSpot(x, y, 'outdoor', 'board');
  });
  // 篝火
  sprites.push({ y: 1950, draw: (c, t) => {
    c.fillStyle = '#5a4632'; for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; c.fillRect(2760 + Math.cos(a) * 26 - 4, 1944 + Math.sin(a) * 13 - 3, 9, 6); }
    const f = 1 + .2 * Math.sin(t / 90);
    c.fillStyle = '#e67e22'; c.beginPath(); c.ellipse(2760, 1940, 8 * f, 14 * f, 0, 0, 7); c.fill();
    c.fillStyle = '#f9d423'; c.beginPath(); c.ellipse(2760, 1944, 4 * f, 8 * f, 0, 0, 7); c.fill();
  } });
  obstacles.push({ x: 2748, y: 1936, w: 24, h: 14 });
}
/* --- 中央广场:喷泉与路牌 --- */
obstacles.push({ x: 1495, y: 1200, w: 130, h: 100 });
sprites.push({ y: 1300, draw: (c, t) => {
  c.fillStyle = '#9aa0a6'; c.beginPath(); c.ellipse(1560, 1250, 72, 54, 0, 0, 7); c.fill();
  c.fillStyle = '#3d7ba6'; c.beginPath(); c.ellipse(1560, 1250, 58, 41, 0, 0, 7); c.fill();
  c.fillStyle = '#9aa0a6'; c.beginPath(); c.ellipse(1560, 1244, 16, 11, 0, 0, 7); c.fill();
  for (let i = 0; i < 3; i++) {
    const p = (t / 700 + i / 3) % 1;
    c.strokeStyle = `rgba(220,240,255,${(1 - p) * .8})`; c.lineWidth = 2;
    c.beginPath(); c.ellipse(1560, 1250, 18 + p * 36, 13 + p * 26, 0, 0, 7); c.stroke();
  }
} });
obstacles.push({ x: 1424, y: 1136, w: 12, h: 10 });
addSpot(1430, 1140, 'sign', 'sign', { r: 80 });

/* 世界边界 */
obstacles.push({ x: -50, y: -50, w: WORLD.w + 100, h: 60 }, { x: -50, y: WORLD.h - 10, w: WORLD.w + 100, h: 60 },
               { x: -50, y: -50, w: 60, h: WORLD.h + 100 }, { x: WORLD.w - 10, y: -50, w: 60, h: WORLD.h + 100 });
/* 装饰树(镇外围) */
{
  let guard = 0, placed = 0;
  while (placed < 16 && guard++ < 800) {
    const x = 80 + rnd() * (WORLD.w - 160), y = 120 + rnd() * (WORLD.h - 200);
    const inZone = ZONES.some(z => x > z.x - 60 && x < z.x + z.w + 60 && y > z.y - 80 && y < z.y + z.h + 60);
    const inPlaza = (x - 1560) ** 2 + (y - 1280) ** 2 < 340 ** 2;
    if (inZone || inPlaza) continue;
    obstacles.push({ x: x - 9, y: y - 8, w: 18, h: 14 });
    sprites.push({ y, draw: c => drawTree(c, x, y, 1.1, null) });
    placed++;
  }
}

/* 藏品点造型注册为精灵 */
for (const s of spots) sprites.push({ y: s.y + (s.type === 'painting' ? -900 : 0), draw: (c, t) => drawSpot(c, s, t) });
// 挂画属于墙面,提前画(y 设得很小即可排前)

/* ---------- 造型绘制 ---------- */
function drawTree(c, x, y, scale = 1, birdCol) {
  c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 6, 24 * scale, 9 * scale, 0, 0, 7); c.fill();
  c.fillStyle = '#7a5230'; c.fillRect(x - 5 * scale, y - 26 * scale, 10 * scale, 32 * scale);
  c.fillStyle = '#3e7a3a'; c.beginPath(); c.arc(x, y - 46 * scale, 30 * scale, 0, 7); c.fill();
  c.fillStyle = '#4f9448'; c.beginPath(); c.arc(x - 16 * scale, y - 34 * scale, 20 * scale, 0, 7); c.fill();
  c.fillStyle = '#5aa851'; c.beginPath(); c.arc(x + 15 * scale, y - 36 * scale, 19 * scale, 0, 7); c.fill();
  if (birdCol) {   // 树上的鸟
    c.fillStyle = birdCol; c.beginPath(); c.ellipse(x + 6, y - 62 * scale, 8, 6, 0, 0, 7); c.fill();
    c.beginPath(); c.arc(x + 13, y - 66 * scale, 4, 0, 7); c.fill();
    c.fillStyle = '#e8963c'; c.beginPath(); c.moveTo(x + 17, y - 66 * scale); c.lineTo(x + 22, y - 64 * scale); c.lineTo(x + 17, y - 63 * scale); c.fill();
  }
}
function drawSpot(c, s, t) {
  const { x, y } = s;
  if (s.type === 'painting') {
    const vert = s.wall !== 't';
    const w = vert ? 40 : 56, h = vert ? 54 : 44;
    c.fillStyle = '#a8873c'; c.fillRect(x - w / 2 - 4, y - h / 2 - 4, w + 8, h + 8);
    const img = thumbImg(CDN.art + s.item.thumb);
    if (img.complete && img.naturalWidth) drawCover(c, img, x - w / 2, y - h / 2, w, h);
    else { c.fillStyle = hashCol(s.item.id); c.fillRect(x - w / 2, y - h / 2, w, h); }
  } else if (s.type === 'tree') {
    drawTree(c, x, y + 6, 1.15, hashCol(s.item.id));
  } else if (s.type === 'bed') {
    c.fillStyle = '#6b4a2b'; roundRect(c, x - 52, y - 64, 104, 60, 10); c.fill();
    c.fillStyle = '#7d5835'; roundRect(c, x - 46, y - 58, 92, 48, 8); c.fill();
    const col = hashCol(s.item.id);
    for (let i = 0; i < 5; i++) {
      const fx = x - 34 + i * 17, fy = y - 34 + ((i * 37) % 16) - 8, sway = Math.sin(t / 500 + i) * 1.5;
      c.strokeStyle = '#3e7a3a'; c.lineWidth = 2; c.beginPath(); c.moveTo(fx, fy + 10); c.lineTo(fx + sway, fy - 2); c.stroke();
      c.fillStyle = col; c.beginPath(); c.arc(fx + sway, fy - 5, 4.5, 0, 7); c.fill();
      c.fillStyle = '#ffe9a8'; c.beginPath(); c.arc(fx + sway, fy - 5, 1.8, 0, 7); c.fill();
    }
  } else if (s.type === 'keg') {
    c.fillStyle = '#8a5a2b'; roundRect(c, x - 16, y - 20, 32, 34, 8); c.fill();
    c.fillStyle = '#caa24a'; c.fillRect(x - 16, y - 14, 32, 4); c.fillRect(x - 16, y + 4, 32, 4);
  } else if (s.type === 'table') {
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 12, 24, 9, 0, 0, 7); c.fill();
    c.fillStyle = '#7a5227'; c.beginPath(); c.ellipse(x, y, 24, 15, 0, 0, 7); c.fill();
    c.fillStyle = BEER_COLOR[s.item.cat] || '#e8a33c'; c.fillRect(x - 4, y - 14, 8, 12);
    c.fillStyle = '#fffef5'; c.fillRect(x - 4, y - 17, 8, 4);
  } else if (s.type === 'tank') {
    const glow = .5 + .2 * Math.sin(t / 600 + x);
    c.fillStyle = '#0d2438'; roundRect(c, x - 50, y - 72, 100, 66, 8); c.fill();
    c.fillStyle = `rgba(40,140,200,${glow})`; roundRect(c, x - 44, y - 66, 88, 54, 6); c.fill();
    const col = FISH_COLOR[s.item.cat] || '#ffb26b';
    for (let i = 0; i < 3; i++) {
      const fx = x - 30 + ((t / (14 - i * 3) + i * 40 + x) % 60), fy = y - 52 + i * 15, dir = i % 2 ? 1 : -1;
      c.fillStyle = col; c.beginPath(); c.ellipse(fx, fy, 7, 3.5, 0, 0, 7); c.fill();
      c.beginPath(); c.moveTo(fx - dir * 7, fy); c.lineTo(fx - dir * 12, fy - 3); c.lineTo(fx - dir * 12, fy + 3); c.fill();
    }
  } else if (s.type === 'crate') {
    c.fillStyle = '#4a2f22'; c.fillRect(x - 28, y - 42, 56, 36);
    for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#111' : hashCol(s.item.id + i); c.fillRect(x - 22 + i * 9, y - 38, 7, 28); }
  } else if (s.type === 'stand') {
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 4, 12, 5, 0, 0, 7); c.fill();
    c.strokeStyle = '#c8912a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 26); c.stroke();
    c.fillStyle = '#e8b74c'; c.beginPath(); c.moveTo(x - 13, y - 24); c.lineTo(x + 13, y - 28); c.lineTo(x + 13, y - 44); c.lineTo(x - 13, y - 40); c.fill();
    c.fillStyle = '#5a3d00'; c.font = '10px serif'; c.fillText('♪', x - 3, y - 31);
  } else if (s.type === 'tent') {
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y - 24, 46, 12, 0, 0, 7); c.fill();
    c.fillStyle = s.tint; c.beginPath(); c.moveTo(x - 42, y - 12); c.lineTo(x, y - 58); c.lineTo(x + 42, y - 12); c.fill();
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.moveTo(x - 10, y - 12); c.lineTo(x, y - 40); c.lineTo(x + 10, y - 12); c.fill();
  } else if (s.type === 'board') {
    c.fillStyle = '#7a5230'; c.fillRect(x - 3, y - 20, 6, 22);
    c.fillStyle = '#a8783f'; roundRect(c, x - 23, y - 38, 46, 22, 4); c.fill();
    c.fillStyle = '#5a3d1e'; c.font = '13px serif'; c.fillText(SPORT_ICON[s.item.cat] || '⛰️', x - 8, y - 21);
  } else if (s.type === 'sign') {
    c.fillStyle = '#7a5230'; c.fillRect(x - 4, y - 46, 8, 50);
    const arrows = [['美术馆', -1, -40, '#8e5bd6'], ['酒馆', 1, -24, '#d35400'], ['植物园', -1, -8, '#27ae60'], ['百鸟林', 1, 8, '#2e86ab']];
    for (const [txt, dir, dy, col] of arrows) {
      c.fillStyle = col;
      c.beginPath();
      if (dir < 0) { c.moveTo(x - 58, y + dy + 7); c.lineTo(x - 50, y + dy); c.lineTo(x - 50, y + dy + 14); }
      else { c.moveTo(x + 58, y + dy + 7); c.lineTo(x + 50, y + dy); c.lineTo(x + 50, y + dy + 14); }
      c.fill();
      c.fillRect(dir < 0 ? x - 50 : x - 2, y + dy, 52, 14);
      c.fillStyle = '#fff'; c.font = 'bold 10px sans-serif';
      c.fillText(txt, (dir < 0 ? x - 46 : x + 4), y + dy + 11);
    }
  } else if (s.type === 'bar') {
    const bob = Math.sin(t / 420) * 1.5;    // 酒保
    const bx = x, by = 1128 + bob;
    c.fillStyle = '#8c3b2e'; c.beginPath(); c.ellipse(bx, by, 12, 14, 0, 0, 7); c.fill();
    c.fillStyle = '#f2c9a0'; c.beginPath(); c.arc(bx, by - 16, 8, 0, 7); c.fill();
    c.fillStyle = '#3a2415'; c.beginPath(); c.arc(bx, by - 19, 8, Math.PI, 0); c.fill();
    c.fillStyle = '#fff'; c.fillRect(bx - 7, by - 4, 14, 10);
  }
}
function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
const imgCache = {};
function thumbImg(url) {
  if (!imgCache[url]) { const im = new Image(); im.crossOrigin = 'anonymous'; im.src = url; imgCache[url] = im; }
  return imgCache[url];
}
function drawCover(c, img, x, y, w, h) {
  const ir = img.naturalWidth / img.naturalHeight, r = w / h;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (ir > r) { sw = sh * r; sx = (img.naturalWidth - sw) / 2; } else { sh = sw / r; sy = (img.naturalHeight - sh) / 2; }
  c.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/* ---------- 画布与相机 ---------- */
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
const mm = document.getElementById('minimap'), mctx = mm.getContext('2d');
let dpr = 1, vw = 0, vh = 0, view = 1;
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  vw = window.innerWidth; vh = window.innerHeight;
  cv.width = vw * dpr; cv.height = vh * dpr;
  view = clamp(vw / 1300, 0.62, 1.05);
}
window.addEventListener('resize', resize); resize();

let grassPat = null;
{
  const p = document.createElement('canvas'); p.width = p.height = 160;
  const g = p.getContext('2d'); g.fillStyle = '#6f9c5b'; g.fillRect(0, 0, 160, 160);
  const r2 = mulberry32(7);
  for (let i = 0; i < 210; i++) {
    g.fillStyle = ['#679455', '#77a763', '#5f8c4f', '#7fae6b'][Math.floor(r2() * 4)];
    g.fillRect(r2() * 160, r2() * 160, 3, 3);
  }
  for (let i = 0; i < 12; i++) { g.fillStyle = ['#e5e08a', '#e8b4c8', '#fff'][Math.floor(r2() * 3)]; g.fillRect(r2() * 160, r2() * 160, 3, 3); }
  grassPat = ctx.createPattern(p, 'repeat');
}

/* ---------- 玩家 ---------- */
const player = { x: TRAVEL.plaza.x, y: TRAVEL.plaza.y, r: 13, dx: 0, dy: 1, moving: false, phase: 0 };
const keys = {};
let joy = { on: false, vx: 0, vy: 0 };
function movePlayer(dt) {
  let mx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
  let my = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
  if (joy.on) { mx = joy.vx; my = joy.vy; }
  const len = Math.hypot(mx, my);
  player.moving = len > 0.15;
  if (!player.moving) return;
  mx /= len; my /= len;
  player.dx = mx; player.dy = my;
  const sp = 300 * dt;
  const tryX = player.x + mx * sp;
  if (!obstacles.some(o => rectHit(o, tryX, player.y, player.r))) player.x = tryX;
  const tryY = player.y + my * sp;
  if (!obstacles.some(o => rectHit(o, player.x, tryY, player.r))) player.y = tryY;
  player.x = clamp(player.x, 20, WORLD.w - 20); player.y = clamp(player.y, 20, WORLD.h - 20);
  player.phase += dt * 11;
}
function drawPlayer(c, t) {
  const { x, y } = player;
  const bob = player.moving ? Math.sin(player.phase) * 2 : 0;
  c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, y + 10, 12, 5, 0, 0, 7); c.fill();
  if (player.moving) {   // 腿
    c.strokeStyle = '#4a3520'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(x - 4, y + 2); c.lineTo(x - 4 + Math.sin(player.phase) * 4, y + 11); c.stroke();
    c.beginPath(); c.moveTo(x + 4, y + 2); c.lineTo(x + 4 - Math.sin(player.phase) * 4, y + 11); c.stroke();
  }
  c.fillStyle = '#3b6ea5'; c.beginPath(); c.ellipse(x, y - 2 + bob * .4, 11, 13, 0, 0, 7); c.fill();  // 身体
  c.fillStyle = '#2c547e'; c.fillRect(x - 11, y - 4 + bob * .4, 4, 10);                                // 背包带
  c.fillStyle = '#f2c9a0'; c.beginPath(); c.arc(x, y - 18 + bob, 9, 0, 7); c.fill();                   // 头
  c.fillStyle = '#c0392b'; c.beginPath(); c.arc(x, y - 21 + bob, 9, Math.PI, 0); c.fill();             // 帽子
  c.fillRect(x - 11, y - 22 + bob, 22, 3);
  const ex = player.dx * 3, ey = player.dy * 1.5;                                                      // 眼睛朝向
  c.fillStyle = '#222';
  c.beginPath(); c.arc(x - 3 + ex, y - 17 + ey + bob, 1.4, 0, 7); c.fill();
  c.beginPath(); c.arc(x + 3 + ex, y - 17 + ey + bob, 1.4, 0, 7); c.fill();
}

/* ---------- 氛围粒子 ---------- */
const parts = [];
function spawnParts(t) {
  if (parts.length > 60) return;
  const z = ZONES[Math.floor(Math.random() * ZONES.length)];
  const r = Math.random();
  if (z.key === 'birds' && r < .5) parts.push({ ty: 'bird', x: z.x - 40, y: z.y + 60 + Math.random() * 500, vx: 60 + Math.random() * 50, vy: Math.sin(t) * 6, life: 18, col: PALETTE[Math.floor(Math.random() * 10)] });
  else if (z.key === 'plants' && r < .4) parts.push({ ty: 'petal', x: z.x + Math.random() * z.w, y: z.y + 30, vx: 12 - Math.random() * 24, vy: 18 + Math.random() * 14, life: 12, col: ['#e8b4c8', '#fff', '#ffd76a'][Math.floor(Math.random() * 3)] });
  else if ((z.key === 'jazz' || z.key === 'classical') && r < .5) { const cN = zc(z); parts.push({ ty: 'note', x: cN.x - 120 + Math.random() * 240, y: z.y + 80, vx: 6 - Math.random() * 12, vy: -22, life: 4, col: z.key === 'jazz' ? '#ff9d8a' : '#ffd76a' }); }
  else if (z.key === 'beers' && r < .35) parts.push({ ty: 'smoke', x: z.x + z.w - 60, y: z.y - 6, vx: 4, vy: -26, life: 5, col: 'rgba(230,230,220,.5)' });
}
function updateParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (p.ty === 'petal') p.x += Math.sin(p.y / 30) * .6;
    if (p.life <= 0 || p.x > WORLD.w + 60) parts.splice(i, 1);
  }
}
function drawParts(c, t) {
  for (const p of parts) {
    if (p.ty === 'bird') {
      c.strokeStyle = p.col; c.lineWidth = 2.5;
      const f = Math.sin(t / 90 + p.x) * 4;
      c.beginPath(); c.moveTo(p.x - 7, p.y - f); c.quadraticCurveTo(p.x, p.y + 3, p.x + 7, p.y - f); c.stroke();
    } else if (p.ty === 'petal') { c.fillStyle = p.col; c.beginPath(); c.ellipse(p.x, p.y, 3, 2, p.y / 20, 0, 7); c.fill(); }
    else if (p.ty === 'note') { c.fillStyle = p.col; c.font = '16px serif'; c.globalAlpha = clamp(p.life / 3, 0, 1); c.fillText(Math.floor(p.x) % 2 ? '♪' : '♫', p.x, p.y); c.globalAlpha = 1; }
    else if (p.ty === 'smoke') { c.fillStyle = p.col; c.globalAlpha = clamp(p.life / 5, 0, .6); c.beginPath(); c.arc(p.x, p.y, 8 + (5 - p.life) * 3, 0, 7); c.fill(); c.globalAlpha = 1; }
  }
}

/* ---------- 收藏进度 ---------- */
let seen = {};
try { seen = JSON.parse(localStorage.getItem('w1001.seen.v1') || '{}'); } catch (e) { seen = {}; }
for (const k in CATS) if (!Array.isArray(seen[k])) seen[k] = [];
const seenCount = () => Object.values(seen).reduce((a, v) => a + v.length, 0);
function markSeen(cat, id, title) {
  if (!CATS[cat]) return;
  if (!seen[cat].includes(id)) {
    seen[cat].push(id);
    try { localStorage.setItem('w1001.seen.v1', JSON.stringify(seen)); } catch (e) {}
    document.getElementById('seenCount').textContent = seenCount();
    toast(`✦ 收录图鉴:${title}`);
    blip(660); setTimeout(() => blip(880), 90);
  }
}
document.getElementById('seenCount').textContent = seenCount();

/* ---------- UI ---------- */
const $ = id => document.getElementById(id);
const modal = $('modal'), cardBody = $('cardBody'), hintEl = $('hint'), toastEl = $('toast');
let toastTimer = 0;
function toast(msg) {
  toastEl.textContent = msg; toastEl.classList.remove('hidden');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2200);
}
function metaRows(rows) {
  return '<div class="cardMeta">' + rows.filter(r => r[1]).map(([k, v]) => `<span class="k">${k}</span><span>${esc(v)}</span>`).join('') + '</div>';
}
function cardHTML(cat, inner, item) {
  const cfg = CATS[cat];
  const n = seen[cat].length, tot = cfg.tot;
  return `<div class="cardHead" style="background:${cfg.color}">${cfg.icon} ${cfg.name} · ${cfg.en}</div>${inner}
  <div class="cardFoot"><span class="collected">✓ 已收录 ${n} / ${D[cat].length}(全馆 ${tot} ${cfg.unit})</span>
  <a href="${cfg.link}" target="_blank" rel="noopener">去 1001 网站 →</a></div>`;
}
function buildCard(s) {
  const cat = s.cat;
  if (cat === 'sign') {
    return `<div class="cardHead" style="background:#5a7247">🧭 小镇路牌 · Signpost</div>
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
    desc = it.desc + (s.type === 'bar' ? '<br><br>🍻 酒保:“尝尝这杯,喜欢再来!”' : '');
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
  if (CATS[cat]) markSeen(cat, it.id, title);   // 先收录,页脚计数才是最新的
  const again = s.type === 'bar' ? '<div style="text-align:center;padding:0 0 16px"><button class="again" data-again>🍺 再来一杯</button></div>' : '';
  return cardHTML(cat, `<div class="cardMedia">${media}</div>
    <div class="cardTitle"><h3>${esc(title)}</h3><div class="en">${en}</div></div>${meta}
    ${desc ? `<div class="cardDesc">${desc}</div>` : ''}${again}`, it);
}
let modalOpen = false;
function openCard(s) {
  cardBody.innerHTML = buildCard(s);
  modal.classList.remove('hidden'); modalOpen = true;
  cardBody.querySelectorAll('img').forEach(im => {
    im.onerror = () => { im.outerHTML = `<div class="medallion"><div class="g">${CATS[s.cat]?.icon || '✦'}</div><div class="e">图片加载中断</div></div>`; };
  });
  cardBody.querySelector('[data-again]')?.addEventListener('click', () => openCard(s));
  cardBody.querySelectorAll('[data-travel]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.travel, p = TRAVEL[k];
    player.x = p.x; player.y = p.y; closeModals();
    toast(`${k === 'plaza' ? '⛲' : CATS[k].icon} 来到了${k === 'plaza' ? '中央广场' : CATS[k].name}`);
    blip(520);
  }));
}
function closeModals() { modal.classList.add('hidden'); $('journal').classList.add('hidden'); modalOpen = false; }
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModals));
modal.addEventListener('click', e => { if (e.target === modal) closeModals(); });
$('journal').addEventListener('click', e => { if (e.target === $('journal')) closeModals(); });

function openJournal() {
  const list = $('journalList');
  list.innerHTML = Object.keys(CATS).map(k => {
    const cfg = CATS[k], n = seen[k].length, embed = D[k].length;
    const pct = Math.round(n / embed * 100);
    return `<div class="jRow"><div class="ico">${cfg.icon}</div>
      <div class="info"><div class="nm">${cfg.name} <span style="color:#93a07f;font-weight:400">${cfg.en}</span></div>
      <div class="jBar"><i style="--c:${cfg.color};width:${pct}%"></i></div>
      <div class="tot">小镇在展 ${embed} · 完整收藏 ${cfg.tot} ${cfg.unit}</div></div>
      <div class="num">${n}/${embed}</div>
      <a href="${cfg.link}" target="_blank" rel="noopener">网站 →</a></div>`;
  }).join('');
  $('journal').classList.remove('hidden'); modalOpen = true;
}
$('btnJournal').addEventListener('click', openJournal);
$('btnHelp').addEventListener('click', () => { $('intro').classList.remove('hidden'); });
$('btnStart').addEventListener('click', () => { $('intro').classList.add('hidden'); initAudio(); });

/* ---------- 音效 ---------- */
let actx = null;
function initAudio() { if (!actx) try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
function blip(freq) {
  if (!actx) return;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(.12, actx.currentTime);
  g.gain.exponentialRampToValueAtTime(.001, actx.currentTime + .18);
  o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + .2);
}

/* ---------- 输入 ---------- */
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'escape') { closeModals(); return; }
  if (k === 'j') { modalOpen && !$('journal').classList.contains('hidden') ? closeModals() : openJournal(); return; }
  if (k === 'h') { $('intro').classList.remove('hidden'); return; }
  if (modalOpen) { if (k === 'e' || k === ' ' || k === 'enter') closeModals(); return; }
  if (k === 'e' || k === ' ' || k === 'enter') { e.preventDefault(); tryInteract(); return; }
  keys[k] = true;
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

let nearSpot = null;
function tryInteract() { if (nearSpot) { openCard(nearSpot); } }
hintEl.addEventListener('click', tryInteract);
$('btnAct').addEventListener('click', () => { modalOpen ? closeModals() : tryInteract(); });

/* 移动端摇杆 */
const isTouch = matchMedia('(pointer: coarse)').matches;
if (isTouch) $('btnAct').classList.remove('hidden');
const stick = $('stick'), knob = $('stickKnob');
let stickBase = null;
window.addEventListener('pointerdown', e => {
  if (!isTouch || modalOpen || e.clientX > vw * .5 || e.target.closest('button,#hint,#hud')) return;
  stickBase = { x: e.clientX, y: e.clientY, id: e.pointerId };
  stick.style.left = (e.clientX - 55) + 'px'; stick.style.top = (e.clientY - 55) + 'px';
  stick.classList.remove('hidden'); joy.on = true;
});
window.addEventListener('pointermove', e => {
  if (!stickBase || e.pointerId !== stickBase.id) return;
  let dx = e.clientX - stickBase.x, dy = e.clientY - stickBase.y;
  const d = Math.hypot(dx, dy), max = 46;
  if (d > max) { dx = dx / d * max; dy = dy / d * max; }
  knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  joy.vx = dx / max; joy.vy = dy / max;
});
const endStick = e => {
  if (!stickBase || (e.pointerId !== undefined && e.pointerId !== stickBase.id)) return;
  stickBase = null; joy = { on: false, vx: 0, vy: 0 };
  knob.style.transform = 'translate(-50%,-50%)'; stick.classList.add('hidden');
};
window.addEventListener('pointerup', endStick); window.addEventListener('pointercancel', endStick);

/* ---------- 渲染 ---------- */
const HINTS = { painting: '欣赏这幅画', shelf: '翻翻这架书', tree: '观察这只鸟', bed: '看看这株植物', bar: '来一杯!', keg: '看看这桶酒', table: '看看桌上的酒', tank: '看看水里', crate: '翻翻唱片', stand: '听听这份录音', tent: '参观营地', board: '查看路线', sign: '查看路牌' };
const cam = { x: 0, y: 0 };
function worldToScreen(x, y) { return [(x - cam.x) * view, (y - cam.y) * view]; }

const sortedSprites = () => sprites.slice().sort((a, b) => a.y - b.y);
let spriteList = sortedSprites();   // 静态排序一次(仅玩家动态插入)

function render(t) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cam.x = clamp(player.x - vw / view / 2, 0, WORLD.w - vw / view);
  cam.y = clamp(player.y - vh / view / 2, 0, WORLD.h - vh / view);
  if (WORLD.w < vw / view) cam.x = (WORLD.w - vw / view) / 2;
  ctx.save();
  ctx.scale(view, view); ctx.translate(-cam.x, -cam.y);

  // 草地
  ctx.fillStyle = grassPat; ctx.fillRect(cam.x - 200, cam.y - 200, vw / view + 400, vh / view + 400);

  // 道路
  ctx.strokeStyle = '#dcCB98'; ctx.lineWidth = 54; ctx.lineCap = 'round';
  const hub = { x: 1560, y: 1330 };
  for (const k in TRAVEL) {
    if (k === 'plaza') continue;
    const p = TRAVEL[k];
    ctx.beginPath(); ctx.moveTo(hub.x, hub.y); ctx.lineTo(p.x, p.y); ctx.stroke();
  }
  ctx.fillStyle = '#dcCB98'; ctx.beginPath(); ctx.arc(hub.x, hub.y - 60, 190, 0, 7); ctx.fill();

  // 区域地面
  for (const z of ZONES) {
    ctx.fillStyle = z.floor;
    roundRect(ctx, z.x, z.y, z.w, z.h, z.indoor ? 4 : 26); ctx.fill();
    if (z.key === 'art') {          // 大理石缝
      ctx.strokeStyle = 'rgba(0,0,0,.06)'; ctx.lineWidth = 1;
      for (let gx = z.x + 80; gx < z.x + z.w; gx += 80) { ctx.beginPath(); ctx.moveTo(gx, z.y); ctx.lineTo(gx, z.y + z.h); ctx.stroke(); }
      for (let gy = z.y + 80; gy < z.y + z.h; gy += 80) { ctx.beginPath(); ctx.moveTo(z.x, gy); ctx.lineTo(z.x + z.w, gy); ctx.stroke(); }
    }
    if (z.key === 'beers' || z.key === 'books') {   // 木地板
      ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1;
      for (let gy = z.y + 26; gy < z.y + z.h; gy += 26) { ctx.beginPath(); ctx.moveTo(z.x, gy); ctx.lineTo(z.x + z.w, gy); ctx.stroke(); }
    }
    if (z.key === 'fish') {        // 水光
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = `rgba(90,180,240,${.05 + .03 * Math.sin(t / 800 + i * 2)})`;
        ctx.beginPath(); ctx.arc(z.x + 140 + i * 150, z.y + 220, 70, 0, 7); ctx.fill();
      }
    }
    if (z.key === 'jazz') {
      ctx.fillStyle = 'rgba(255,170,90,.07)'; ctx.beginPath(); ctx.arc(z.x + z.w / 2, z.y + 120, 130, 0, 7); ctx.fill();
    }
  }
  // 墙
  for (const w of wallRects) { ctx.fillStyle = '#4a3a2a'; ctx.fillRect(w.x, w.y, w.w, w.h); ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(w.x, w.y, w.w, 4); }

  // 精灵(y 排序,含玩家)
  let inserted = false;
  for (const s of spriteList) {
    if (!inserted && player.y < s.y) { drawPlayer(ctx, t); inserted = true; }
    s.draw(ctx, t);
  }
  if (!inserted) drawPlayer(ctx, t);

  drawParts(ctx, t);

  // 区域名牌
  ctx.textAlign = 'center';
  for (const z of ZONES) {
    const cfg = CATS[z.key], cN = zc(z);
    ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(20,26,14,.65)';
    const label = `${cfg.icon} ${cfg.name}`;
    ctx.strokeText(label, cN.x, z.y - 14); ctx.fillStyle = '#fff'; ctx.fillText(label, cN.x, z.y - 14);
    if (z.key === 'birds') { ctx.font = '13px sans-serif'; ctx.strokeText('1001 只鸟栖息于此', cN.x, z.y + 8); ctx.fillText('1001 只鸟栖息于此', cN.x, z.y + 8); }
  }
  ctx.textAlign = 'left';
  ctx.restore();

  // 提示
  nearSpot = null; let best = 1e9;
  for (const s of spots) {
    const d2 = (s.x - player.x) ** 2 + (s.y - player.y) ** 2;
    if (d2 < s.r * s.r && d2 < best) { best = d2; nearSpot = s; }
  }
  if (nearSpot && !modalOpen) {
    const [sx, sy] = worldToScreen(nearSpot.x, nearSpot.y - (nearSpot.type === 'tree' ? 90 : nearSpot.type === 'painting' ? 46 : 50));
    hintEl.innerHTML = `<kbd>E</kbd>${HINTS[nearSpot.type] || '看看'}`;
    hintEl.style.left = sx + 'px'; hintEl.style.top = sy + 'px';
    hintEl.classList.remove('hidden');
    if (isTouch) $('btnAct').textContent = '👀';
  } else { hintEl.classList.add('hidden'); if (isTouch) $('btnAct').textContent = '·'; }

  // 当前区域
  const here = ZONES.find(z => player.x > z.x && player.x < z.x + z.w && player.y > z.y && player.y < z.y + z.h);
  $('zoneIcon').textContent = here ? CATS[here.key].icon : '🧭';
  $('zoneName').textContent = here ? CATS[here.key].name : '小镇街道';

  renderMinimap();
}
function renderMinimap() {
  const s = mm.width / WORLD.w;
  mctx.clearRect(0, 0, mm.width, mm.height);
  mctx.fillStyle = '#2a3a22'; mctx.fillRect(0, 0, mm.width, mm.height);
  for (const z of ZONES) { mctx.fillStyle = CATS[z.key].color; mctx.globalAlpha = .85; mctx.fillRect(z.x * s, z.y * s, z.w * s, z.h * s); }
  mctx.globalAlpha = 1;
  mctx.strokeStyle = 'rgba(255,255,255,.5)'; mctx.lineWidth = 1;
  mctx.strokeRect(cam.x * s, cam.y * s, vw / view * s, vh / view * s);
  mctx.fillStyle = '#fff'; mctx.beginPath(); mctx.arc(player.x * s, player.y * s, 3, 0, 7); mctx.fill();
  mctx.fillStyle = '#ffd76a'; mctx.beginPath(); mctx.arc(player.x * s, player.y * s, 1.6, 0, 7); mctx.fill();
}

/* ---------- 主循环 ---------- */
let last = 0, partTimer = 0;
function loop(t) {
  const dt = Math.min((t - last) / 1000, .05); last = t;
  if (!modalOpen) movePlayer(dt);
  partTimer += dt;
  if (partTimer > .4) { partTimer = 0; spawnParts(t / 1000); }
  updateParts(dt);
  render(t);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// 调试句柄(供自动化测试/控制台使用)
window.__w1001 = { player, spots, TRAVEL, openCard, openJournal, seen };
})();
