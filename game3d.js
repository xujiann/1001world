/* ============================================================
   1001 世界 3D · Isle of 1001 — 荒野之息风低多边形海岛
   Three.js 三维开放世界:雪山 · 平原 · 大海 · 九大收藏区域
   与 2D 版共用 world-data.js 与 localStorage 进度。
   ============================================================ */
import * as THREE from 'three';

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
  beers:     { icon: '🍺', name: '1001 酒馆',      en: 'The 1001 Tavern',  color: '#d35400', link: 'https://xujiann.github.io/1001craft/',     tot: 1001,               unit: '款精酿' },
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
function height(x, z) {
  const d = Math.hypot(x, z);
  const fall = smooth01(clamp((430 - d) / 170, 0, 1));
  let h = -9 + fall * (13 + fbm(x * .008, z * .008) * 14);
  const md = Math.hypot(x - 340, z + 320);            // 东北雪山
  h += smooth01(clamp(1 - md / 200, 0, 1)) ** 2 * 55;
  for (const zn of ZONES3D) {                          // 区域整平
    const zd = Math.hypot(x - zn.x, z - zn.z);
    const w = smooth01(clamp(1 - zd / (zn.r * 1.25), 0, 1));
    h = h * (1 - w * .95) + zn.h * w * .95;
  }
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
    quest.done = true; stars++;
    setTimeout(() => { toast(`🎉 今日委托完成!星星 ×${stars}`); blip(660); setTimeout(() => blip(990), 120); }, 350);
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
function markSeen(cat, id, title) {
  if (!CATS[cat]) return;
  if (!seen[cat].includes(id)) {
    seen[cat].push(id);
    try { localStorage.setItem('w1001.seen.v1', JSON.stringify(seen)); } catch (e) {}
    $('seenCount').textContent = seenCount();
    toast(`✦ 收录图鉴:${title}`);
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
function buildCard(s) {
  const cat = s.cat;
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
    desc = it.desc + (s.type === 'bar' ? '<br><br>🍻 酒保:“海风里喝一杯,再好不过!”' : '');
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
  const again = s.type === 'bar' ? '<div style="text-align:center;padding:0 0 16px"><button class="again" data-again>🍺 再来一杯</button></div>' : '';
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
  cardBody.querySelector('[data-again]')?.addEventListener('click', () => openCard(s));
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
$('btnHelp').addEventListener('click', () => { $('intro').classList.remove('hidden'); });
$('btnStart').addEventListener('click', () => { $('intro').classList.add('hidden'); initAudio(); });

/* --- 音效与音乐(与 2D 相同引擎) --- */
let actx = null, musicGain = null, musicOn = true;
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
const renderer = new THREE.WebGLRenderer({ canvas: $('game'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd4ee);
scene.fog = new THREE.Fog(0x9fd4ee, 320, 1100);
const camera = new THREE.PerspectiveCamera(58, 1, .1, 2400);
function resize() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x77995a, .95));
const sun = new THREE.DirectionalLight(0xfff1cf, 1.5);
sun.position.set(180, 260, 120); scene.add(sun);

/* --- 地形网格 --- */
const TER = 1100, SEG = 190;
{
  const g = new THREE.PlaneGeometry(TER, TER, SEG, SEG);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, colors = [];
  const cSand = new THREE.Color(0xe4d5a2), cGrass1 = new THREE.Color(0x74ad58), cGrass2 = new THREE.Color(0x639b4c),
        cRock = new THREE.Color(0x8d8577), cSnow = new THREE.Color(0xeef3f5), cSea = new THREE.Color(0xcdbf92);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = height(x, z);
    pos.setY(i, h);
    const sl = Math.abs(height(x + 3, z) - h) + Math.abs(height(x, z + 3) - h);   // 坡度
    let c;
    if (h > 34) c = cSnow;
    else if (sl > 3.4 || h > 26) c = cRock;
    else if (h < 1.8) c = h < -2 ? cSea : cSand;
    else c = fbm(x * .05, z * .05) > .52 ? cGrass1 : cGrass2;
    colors.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  scene.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })));
}
/* --- 海洋 --- */
let waterGeo;
{
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
  const item = (type === 'bar' || type === 'sign') ? null : pickers[cat]();
  const s = Object.assign({ x, z, y: height(x, z), r: 6.5, cat, type, item }, extra || {});
  spots.push(s); return s;
}
const M = {
  wood: new THREE.MeshLambertMaterial({ color: 0x8a6238 }),
  woodDark: new THREE.MeshLambertMaterial({ color: 0x5e4023 }),
  stone: new THREE.MeshLambertMaterial({ color: 0xb9b2a4 }),
  gold: new THREE.MeshLambertMaterial({ color: 0xd9b26a }),
  white: new THREE.MeshLambertMaterial({ color: 0xf5efdc }),
};
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
const cyl = (rT, rB, h, mat, seg = 10) => new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, seg), mat);
const lam = c => new THREE.MeshLambertMaterial({ color: c });

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
  const grp = pavilion(zn, { w: 46, d: 30, walls: 'three', roof: 0x8e5bd6, floor: 0xe8e2d4 });
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
  const grp = pavilion(zn, { w: 32, d: 24, walls: 'three', roof: 0xb5651d, floor: 0xd8c49c });
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
    s.updateVisual = () => flowers.forEach(f => f.material.color.set(hashCol(s.item.id)));
    cirObs.push({ x, z, r: 2.6 });
  }
}
/* --- 酒馆 --- */
{
  const zn = ZONES3D.find(z => z.key === 'beers');
  const grp = pavilion(zn, { w: 28, d: 22, walls: 'back', roof: 0xd35400, floor: 0x9c6b39 });
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
}
/* --- 爵士俱乐部 --- */
{
  const zn = ZONES3D.find(z => z.key === 'jazz');
  const grp = pavilion(zn, { w: 24, d: 20, walls: 'back', roof: 0x6e2436, floor: 0x4a2f3e });
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
  const grp = pavilion(zn, { w: 26, d: 22, walls: 'back', roof: 0xc8912a, floor: 0xd9cdb2 });
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
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2;
    const log = box(2, .4, .4, M.woodDark); log.rotation.y = a; log.position.set(fx + Math.cos(a), fh + .3, fz + Math.sin(a)); scene.add(log);
  }
  cirObs.push({ x: fx, z: fz, r: 1.8 });
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

/* ---------- 玩家 ---------- */
const player = new THREE.Group();
{
  const body = cyl(.55, .68, 1.5, lam(0x3b6ea5)); body.position.y = 1.2; player.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.55, 10, 8), lam(0xf2c9a0)); head.position.y = 2.35; player.add(head);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.58, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), lam(0xc0392b));
  cap.position.y = 2.5; player.add(cap);
  const brim = box(.7, .1, .5, lam(0xc0392b)); brim.position.set(0, 2.5, .62); player.add(brim);
  const pack = box(.9, 1.1, .5, lam(0x7a5230)); pack.position.set(0, 1.5, -.62); player.add(pack);
}
const blob = new THREE.Mesh(new THREE.CircleGeometry(1, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .3 }));
blob.rotation.x = -Math.PI / 2; scene.add(blob);
player.position.set(0, height(0, 14) + .1, 14);
scene.add(player);
let vy = 0, grounded = true, swimming = false, walkPhase = 0, faceYaw = 0;

/* ---------- 相机与输入 ---------- */
let camYaw = Math.PI, camPitch = .42, camDist = 15;
const keys = {};
let joy = { on: false, vx: 0, vy: 0 };
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'escape') { closeModals(); return; }
  if (k === 'j') { modalOpen && !$('journal').classList.contains('hidden') ? closeModals() : openJournal(); return; }
  if (k === 'h') { $('intro').classList.remove('hidden'); return; }
  if (modalOpen) { if (k === 'e' || k === 'enter') closeModals(); return; }
  if (k === 'e' || k === 'enter') { tryInteract(); return; }
  if (k === ' ') { e.preventDefault(); if (grounded && !swimming) vy = 11.5; return; }
  keys[k] = true;
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
let nearSpot = null;
function tryInteract() { if (nearSpot) openCard(nearSpot); }
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
const HINTS = { painting: '欣赏这幅画', shelf: '翻翻这架书', tree: '观察这只鸟', bed: '看看这株植物', bar: '来一杯!', keg: '看看这桶酒', table: '看看桌上的酒', tank: '看看水里', crate: '翻翻唱片', stand: '听听这份录音', tent: '参观营地', board: '查看路线', sign: '查看路牌' };
const clock = new THREE.Clock();
const v3 = new THREE.Vector3();
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
      const sp = (swimming ? 7.5 : 14) * dt;
      let dx = (fx * -mz + rx * mx) * sp, dz = (fz * -mz + rz * mx) * sp;
      player.position.x += dx; player.position.z += dz;
      faceYaw = Math.atan2(dx, dz);
      walkPhase += dt * 10;
    }
    // 边界
    const pd = Math.hypot(player.position.x, player.position.z);
    if (pd > 900) { player.position.x *= 900 / pd; player.position.z *= 900 / pd; }
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
  /* 重力 / 游泳 */
  const gh = height(player.position.x, player.position.z);
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
  const wp = waterGeo.attributes.position;
  for (let i = 0; i < wp.count; i += 3) {
    wp.setY(i, Math.sin(t * 1.4 + wp.getX(i) * .02 + wp.getZ(i) * .017) * .5);
  }
  wp.needsUpdate = true;
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

  /* 最近藏品点 + 提示 */
  nearSpot = null; let best = 1e9;
  for (const s of spots) {
    const d2 = (s.x - player.position.x) ** 2 + (s.z - player.position.z) ** 2;
    if (d2 < s.r * s.r && d2 < best && Math.abs((s.y ?? 0) - player.position.y) < 8) { best = d2; nearSpot = s; }
  }
  if (nearSpot && !modalOpen) {
    v3.set(nearSpot.x, (nearSpot.y ?? height(nearSpot.x, nearSpot.z)) + 5.2, nearSpot.z).project(camera);
    if (v3.z < 1) {
      hintEl.innerHTML = `<kbd>E</kbd>${HINTS[nearSpot.type] || '看看'}`;
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
  $('zoneIcon').textContent = swimming ? '🌊' : (hereKey ? CATS[hereKey].icon : '🧭');
  $('zoneName').textContent = swimming ? '大海' : (hereKey ? CATS[hereKey].name : '收藏之岛 · 旷野');

  renderer.render(scene, camera);
}
loop();

window.__w3d = { player, spots, TRAVEL3D, openCard, openJournal, seen, height, camera, scene };
