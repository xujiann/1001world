/* 1001 世界 3D · 纯工具层(零依赖:数学 / 随机 / 噪声 / 颜色 / 转义)
   引擎与内容都依赖它,但它不依赖任何引擎状态或 DOM。安全独立、可单测。 */

/* ---------- 数学 / 转义 ---------- */
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const smooth01 = t => t * t * (3 - 2 * t);

/* ---------- 确定性随机 ---------- */
export function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function shuffled(arr, rnd) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* ---------- 值噪声(地形) ---------- */
export function hash2(x, z) { const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return n - Math.floor(n); }
export function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const a = hash2(xi, zi), b = hash2(xi + 1, zi), c = hash2(xi, zi + 1), d2 = hash2(xi + 1, zi + 1);
  const sx = xf * xf * (3 - 2 * xf), sz = zf * zf * (3 - 2 * zf);
  return a + (b - a) * sx + (c - a) * sz * (1 - sx) + (d2 - b) * sx * sz;
}
export const fbm = (x, z) => vnoise(x, z) * .55 + vnoise(x * 2.17, z * 2.17) * .28 + vnoise(x * 4.9, z * 4.9) * .17;

/* ---------- 调色板 ---------- */
export const PALETTE = ['#c0392b','#2980b9','#27ae60','#8e44ad','#d35400','#16a085','#f39c12','#7f8c8d','#c2185b','#5d4037'];
export const hashCol = s => PALETTE[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];
export const BEER_COLOR = { lager:'#f5c542', pale:'#e8a33c', ipa:'#e07b28', wheat:'#ecd48a', belgian:'#c87f2f', stout:'#33200f', sour:'#d94f6b', amber:'#a8542c', strong:'#7a3b1e', specialty:'#8c6d3f' };
export const FISH_COLOR = { reef:'#ff7f50', fresh:'#58c470', pelagic:'#4a90d9', deep:'#5b4a8a', temperate:'#7f8fa6', special:'#d4a017', rare:'#d94f6b', more:'#6aa8a0' };
export const SPORT_ICON = { hike:'🥾', climb:'🧗', water:'🛶', surf:'🏄', dive:'🤿', snow:'⛷️', air:'🪂', wheel:'🚵', multi:'🏅', camp:'🏕️' };
