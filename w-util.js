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

/* ---------- 梯度噪声(Perlin)+ 域扭曲 + 脊状:更有机的地貌 ---------- */
function pgrad(ix, iz, fx, fz) {   // 单元格随机梯度点乘
  const a = hash2(ix, iz) * 6.28318530718;
  return Math.cos(a) * fx + Math.sin(a) * fz;
}
export function perlin(x, z) {     // 经典 Perlin,五次淡化,范围约 [-1,1]
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10), v = zf * zf * zf * (zf * (zf * 6 - 15) + 10);
  const n00 = pgrad(xi, zi, xf, zf), n10 = pgrad(xi + 1, zi, xf - 1, zf);
  const n01 = pgrad(xi, zi + 1, xf, zf - 1), n11 = pgrad(xi + 1, zi + 1, xf - 1, zf - 1);
  const nx0 = n00 + u * (n10 - n00), nx1 = n01 + u * (n11 - n01);
  return (nx0 + v * (nx1 - nx0)) * 1.4;
}
export function fbm2(x, z, oct = 4) {   // 分形叠加,范围约 [-1,1]
  let a = 0, amp = .5, f = 1;
  for (let i = 0; i < oct; i++) { a += perlin(x * f, z * f) * amp; f *= 2; amp *= .5; }
  return a;
}
export function warpFbm(x, z) {          // 域扭曲(用噪声扰动采样坐标)→ 河谷走向,范围 [0,1]
  const wx = fbm2(x + 5.2, z + 1.3, 3) * 1.6;
  const wz = fbm2(x + 9.1, z + 4.7, 3) * 1.6;
  return clamp(fbm2(x + wx, z + wz, 4) * .5 + .5, 0, 1);
}
export function ridged(x, z, oct = 4) {  // 脊状多重分形(山脊线),范围 [0,1]
  let a = 0, amp = .5, f = 1;
  for (let i = 0; i < oct; i++) { let n = 1 - Math.abs(perlin(x * f, z * f)); n *= n; a += n * amp; f *= 2; amp *= .5; }
  return clamp(a, 0, 1);
}

/* ---------- 调色板 ---------- */
export const PALETTE = ['#c0392b','#2980b9','#27ae60','#8e44ad','#d35400','#16a085','#f39c12','#7f8c8d','#c2185b','#5d4037'];
export const hashCol = s => PALETTE[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];
export const BEER_COLOR = { lager:'#f5c542', pale:'#e8a33c', ipa:'#e07b28', wheat:'#ecd48a', belgian:'#c87f2f', stout:'#33200f', sour:'#d94f6b', amber:'#a8542c', strong:'#7a3b1e', specialty:'#8c6d3f' };
export const FISH_COLOR = { reef:'#ff7f50', fresh:'#58c470', pelagic:'#4a90d9', deep:'#5b4a8a', temperate:'#7f8fa6', special:'#d4a017', rare:'#d94f6b', more:'#6aa8a0' };
export const SPORT_ICON = { hike:'🥾', climb:'🧗', water:'🛶', surf:'🏄', dive:'🤿', snow:'⛷️', air:'🪂', wheel:'🚵', multi:'🏅', camp:'🏕️' };
