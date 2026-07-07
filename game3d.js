/* ============================================================
   1001 世界 3D · Isle of 1001 — 荒野之息风低多边形海岛
   Three.js 三维开放世界:雪山 · 平原 · 大海 · 九大收藏区域
   数据来自 world-data.js;进度按账号(本机多档)隔离保存。
   ============================================================ */
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { Water } from 'three/addons/objects/Water.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { clamp, esc, smooth01, mulberry32, shuffled, hash2, vnoise, fbm, warpFbm, ridged, PALETTE, hashCol, BEER_COLOR, FISH_COLOR, SPORT_ICON } from './w-util.js?v=2';
import { THEMES, NI_QUESTS } from './w-config.js?v=6';
import { CONSTELLATIONS } from './constellations.js?v=1';
import { MAZE_NODES, ZONES, NODE_ZONE, MAZE_EDGES, AIR_NODES, GATES, DISC, MAZE_PORTALS, TUBE_R } from './w-maze.js?v=1';

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
const SAVE_FIELDS = ['seen.v1', 'stars', 'quest', 'shards', 'pos3d', 'sb', 'drinks', 'paper', 'paper2', 'gear', 'ring', 'house', 'dbl', 'ticket',
  'lamp', 'rose', 'jingu', 'pantao', 'tiny', 'arrows', 'qian', 'hero', 'rodbuff', 'fishcount', 'siren', 'charge', 'yfb', 'poem', 'flowers', 'flotsam', 'wind', 'taofound', 'stargate', 'vellum', 'guide', 'savev', 'title', 'mile', 'consts', 'purg', 'peng', 'marlin', 'treasure', 'caved', 'wreck', 'babel', 'd_heart', 'd_mural', 'skeleton'];

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
/* 颜色/随机/转义工具 → w-util.js */

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

/* ---------- 地形(hash2/vnoise/fbm/smooth01 → w-util.js) ---------- */
/* 主岛 = 一头俯瞰的鲸:头在西,尾鳍甩向东,雪山是背鳍,西南伸出胸鳍 */
const IS2 = { x: -720, z: -420, r: 150 };   // 灯塔屿
const TRU = { x: 760, z: 560, r: 135 };     // 楚门的世界(多元宇宙 1 号岛)
const MID = { x: -150, z: -700, r: 170 };   // 中土(多元宇宙 2 号岛)
const VOL = { x: -50, z: -700 };            // 末日火山
const HOG = { x: 660, z: -560, r: 150 };    // 霍格沃茨(多元宇宙 3 号岛)
const MOB = { x: 120, z: 800, r: 130 };     // 莫比·迪克(多元宇宙 4 号岛)
const SPT = { x: -780, z: 120, r: 130 };    // 体育岛(多元宇宙 5 号岛)
const SHJ = { x: -520, z: -1020, r: 140 };  // 山海经·异兽之野
const THY = { x: 1060, z: -180, r: 115 };   // 桃花源(隐藏秘境,无航线)
const ANH = { x: -1020, z: 640, r: 130 };   // 一千零一夜·巴格达
const NEM = { x: 720, z: 1060, r: 90 };     // 海底两万里·鹦鹉螺锚地
const B612 = { x: 1120, z: 330, r: 62 };    // 小王子·B-612
const JUR = { x: 1020, z: 920, r: 140 };    // 侏罗纪公园
/* —— 名著十岛(路线图 ISLANDS-ROADMAP.md) —— */
const HGS = { x: 150, z: -1250, r: 150 };   // 西游记·花果山
const ALC = { x: -1250, z: 350, r: 130 };   // 爱丽丝梦游仙境
const CBI = { x: 700, z: -1150, r: 140 };   // 三国·赤壁
const LRS = { x: -950, z: -800, r: 120 };   // 聊斋·兰若寺
const LSP = { x: -1250, z: -300, r: 150 };  // 水浒·梁山泊
const SIR = { x: 1330, z: 640, r: 0 };      // 奥德赛·塞壬海域(礁石群,无岛)
const FCY = { x: -600, z: 1150, r: 140 };   // 堂吉诃德·风车原野
const YFB = { x: -130, z: 1250, r: 110 };   // 基督山·伊夫堡
const MCD = { x: 80, z: 1360, r: 45 };      // 小基督山(宝藏屿)
const RBX = { x: 420, z: 1300, r: 120 };    // 鲁滨逊·绝望岛
const DGY = { x: 1250, z: -650, r: 130 };   // 红楼梦·大观园
const PUR = { x: -1060, z: 960, r: 92 };    // 神曲·炼狱山(南海孤峰,七层螺旋)
/* —— 海洋文学带:外环诸岛(数据驱动,内容见 NI_CONTENT)—— */
const NISLES = [
  { key: 'mys', x: -1780, z: -420, r: 92, mask: 2.0, h: 7, peak: { r: 52, hh: 30 }, dock: [-1690, -400] }, // 神秘岛(火山)
  { key: 'trs', x: 1720, z: -520, r: 92, mask: 2.0, h: 7, peak: { r: 40, hh: 16 }, dock: [1632, -498] },   // 金银岛(望远山)
  { key: 'chr', x: -80, z: -1780, r: 88, mask: 2.0, h: 8, dock: [-76, -1690] },                            // 无人生还岛
  { key: 'tmp', x: -1780, z: 260, r: 88, mask: 2.0, h: 9, dock: [-1690, 247] },                            // 暴风雨岛
  { key: 'mor', x: -1490, z: -1010, r: 90, mask: 2.0, h: 7, dock: [-1406, -953] },                         // 莫罗博士岛
  { key: 'dol', x: 1300, z: 1350, r: 90, mask: 2.0, h: 6, dock: [1225, 1272] },                            // 蓝色海豚岛
  { key: 'fly', x: -1050, z: -1450, r: 90, mask: 2.0, h: 7, peak: { r: 42, hh: 14 }, dock: [-993, -1380] }, // 蝇王
  { key: 'uto', x: -1560, z: 850, r: 92, mask: 2.0, h: 6, dock: [-1476, 805] },                            // 乌托邦
  { key: 'hux', x: -1150, z: 1350, r: 88, mask: 2.0, h: 6, dock: [-1084, 1272] },                          // 岛(赫胥黎)
  { key: 'gul', x: 1440, z: -1060, r: 90, mask: 2.0, h: 6, dock: [1360, -1002] },                          // 格列佛
  { key: 'nvl', x: -520, z: 1720, r: 90, mask: 2.0, h: 7, dock: [-500, 1636] },                            // 梦幻岛
  { key: 'cor', x: 180, z: 1780, r: 86, mask: 2.0, h: 5, dock: [172, 1698] },                              // 珊瑚岛
  { key: 'typ', x: 820, z: 1620, r: 90, mask: 2.0, h: 7, peak: { r: 40, hh: 16 }, dock: [772, 1544] },     // 泰皮
  { key: 'tah', x: 1660, z: 780, r: 88, mask: 2.0, h: 6, dock: [1584, 743] },                              // 画家岛(塔希提)
  { key: 'daw', x: 1770, z: 180, r: 86, mask: 2.0, h: 5, dock: [1686, 172] },                              // 黎明踏浪号
  { key: 'rain', x: 650, z: -1650, r: 88, mask: 2.0, h: 6, dock: [620, -1568] },                           // 雨岛
  { key: 'shu', x: -560, z: -1680, r: 88, mask: 2.0, h: 8, peak: { r: 30, hh: 14 }, dock: [-536, -1598] }, // 禁闭岛
];
const NI_DEST = {}, NI_MSG = {};   // 渡口坐标 / 到达播报(由 NI_CONTENT 框架填充)
for (const s of NISLES) if (s.key !== 'trs') SAVE_FIELDS.push('nq_' + s.key);   // 各岛故事线存档位(金银岛用 treasure)
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
  m = Math.max(m, (1 - Math.hypot(x - SHJ.x, z - SHJ.z) / SHJ.r) * 1.8);  // 山海经
  m = Math.max(m, (1 - Math.hypot(x - THY.x, z - THY.z) / THY.r) * 1.8);  // 桃花源
  m = Math.max(m, (1 - Math.hypot(x - ANH.x, z - ANH.z) / ANH.r) * 1.8);  // 一千零一夜
  m = Math.max(m, (1 - Math.hypot(x - NEM.x, z - NEM.z) / NEM.r) * 1.8);  // 鹦鹉螺锚地
  m = Math.max(m, (1 - Math.hypot(x - B612.x, z - B612.z) / B612.r) * 2.0); // B-612
  m = Math.max(m, (1 - Math.hypot(x - JUR.x, z - JUR.z) / JUR.r) * 1.8);  // 侏罗纪
  m = Math.max(m, (1 - Math.hypot(x - HGS.x, z - HGS.z) / HGS.r) * 1.8);
  m = Math.max(m, (1 - Math.hypot(x - ALC.x, z - ALC.z) / ALC.r) * 1.8);
  m = Math.max(m, (1 - Math.hypot(x - CBI.x, z - CBI.z) / CBI.r) * 1.8);
  m = Math.max(m, (1 - Math.hypot(x - LRS.x, z - LRS.z) / LRS.r) * 1.8);
  m = Math.max(m, (1 - Math.hypot(x - LSP.x, z - LSP.z) / LSP.r) * 1.8);
  m = Math.max(m, (1 - Math.hypot(x - FCY.x, z - FCY.z) / FCY.r) * 1.8);
  m = Math.max(m, (1 - Math.hypot(x - YFB.x, z - YFB.z) / YFB.r) * 1.8);
  m = Math.max(m, (1 - Math.hypot(x - MCD.x, z - MCD.z) / MCD.r) * 1.7);
  m = Math.max(m, (1 - Math.hypot(x - RBX.x, z - RBX.z) / RBX.r) * 1.8);
  m = Math.max(m, (1 - Math.hypot(x - DGY.x, z - DGY.z) / DGY.r) * 1.8);
  m = Math.max(m, (1 - Math.hypot(x - PUR.x, z - PUR.z) / PUR.r) * 2.0);  // 炼狱山
  for (const s of NISLES) m = Math.max(m, (1 - Math.hypot(x - s.x, z - s.z) / s.r) * (s.mask || 1.8));  // 海洋文学带
  for (const [rx2, rz2] of [[SIR.x, SIR.z], [SIR.x - 42, SIR.z + 30], [SIR.x + 36, SIR.z - 34]])
    m = Math.max(m, (1 - Math.hypot(x - rx2, z - rz2) / 24) * 1.7);       // 塞壬礁
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
  // 域扭曲梯度噪声:内陆起伏更有机、有河谷走向(振幅与原值噪声一致,不改水位/海岸线)
  let h = -9 + fall * (13 + warpFbm(x * .009, z * .009) * 14);
  const md = Math.hypot(x - 340, z + 320);            // 东北雪山(背鳍)
  // 脊状多重分形:山坡刻出山脊线,峰高仍封顶 55,不影响营地整平
  h += smooth01(clamp(1 - md / 200, 0, 1)) ** 2 * 55 * (.7 + .3 * ridged(x * .028, z * .028, 4));
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
  // —— 六新岛地形(q:局部整平) ——
  const q = (cxq, czq, rq, hq, wq0 = .9) => {
    const wq = smooth01(clamp(1 - Math.hypot(x - cxq, z - czq) / rq, 0, 1)) * wq0;
    h = h * (1 - wq) + hq * wq;
  };
  q(SHJ.x, SHJ.z, 72, 8);                                                                    // 山海经腹地
  h += smooth01(clamp(1 - Math.hypot(x - SHJ.x, z - (SHJ.z - 72)) / 55, 0, 1)) ** 2 * 20;    // 烛龙峰
  q(SHJ.x, SHJ.z + 118, 16, 2.2, .95);
  q(THY.x, THY.z, 72, 7);                                                                    // 桃花源谷地
  q(THY.x - 96, THY.z, 15, 2.5, .95);
  q(ANH.x, ANH.z, 74, 6);                                                                    // 巴格达
  q(ANH.x, ANH.z - 112, 16, 2.2, .95);
  q(NEM.x, NEM.z, 46, 5);                                                                    // 鹦鹉螺岩台
  q(NEM.x, NEM.z - 76, 15, 2.2, .95);
  h += smooth01(clamp(1 - Math.hypot(x - B612.x, z - B612.z) / 55, 0, 1)) ** 1.4 * 15;       // B-612 圆丘
  q(B612.x, B612.z, 14, 21, .9);
  q(B612.x, B612.z - 54, 12, 2.2, .95);
  q(JUR.x, JUR.z, 80, 7);                                                                    // 侏罗纪园区
  q(JUR.x, JUR.z - 126, 16, 2.2, .95);
  // —— 名著十岛 ——
  q(HGS.x, HGS.z, 78, 8);                                                                    // 花果山山脚
  h += smooth01(clamp(1 - Math.hypot(x - HGS.x, z - (HGS.z - 60)) / 70, 0, 1)) ** 2 * 26;    // 花果山主峰
  q(HGS.x, HGS.z + 128, 16, 2.2, .95);
  q(ALC.x, ALC.z, 72, 7); q(ALC.x, ALC.z + 112, 16, 2.2, .95);                               // 爱丽丝
  q(CBI.x, CBI.z, 76, 7); q(CBI.x, CBI.z + 120, 16, 2.2, .95);                               // 赤壁
  q(LRS.x, LRS.z, 66, 8); q(LRS.x, LRS.z + 102, 16, 2.2, .95);                               // 兰若寺
  q(LSP.x, LSP.z, 80, 5); q(LSP.x + 128, LSP.z, 16, 2.2, .95);                               // 梁山泊(低洼水泊)
  h -= smooth01(clamp(1 - Math.hypot(x - (LSP.x - 30), z - (LSP.z + 20)) / 45, 0, 1)) * 8;   // 泊心水面
  q(FCY.x, FCY.z, 78, 8); q(FCY.x, FCY.z - 120, 16, 2.2, .95);                               // 风车原野
  q(YFB.x, YFB.z, 56, 9); q(YFB.x, YFB.z - 96, 16, 2.2, .95);                                // 伊夫堡高台
  q(MCD.x, MCD.z, 26, 5);                                                                    // 小基督山
  q(RBX.x, RBX.z, 66, 6); q(RBX.x, RBX.z - 104, 16, 2.2, .95);                               // 绝望岛
  q(DGY.x, DGY.z, 72, 7); q(DGY.x, DGY.z + 112, 16, 2.2, .95);                               // 大观园
  q(PUR.x, PUR.z, PUR.r, 3);                                                                 // 炼狱山·涤罪滩(环山基座)
  { const dpu = Math.hypot(x - PUR.x, z - PUR.z), R2 = PUR.r * .82;                          // 七层阶梯螺旋锥
    if (dpu < R2) { const lvl = (1 - dpu / R2) * 7, k = Math.min(6, Math.floor(lvl)), fr = lvl - k;
      const rise = fr > .58 ? (fr - .58) / .42 : 0; h += (k + rise) * 4; } }
  q(PUR.x, PUR.z, 9.5, 30.5, .82);                                                           // 炼狱山巅·地上乐园(平台)
  q(PUR.x, PUR.z + PUR.r + 20, 15, 2.2, .95);                                                // 炼狱山渡口浅滩
  for (const s of NISLES) {                                                                  // 海洋文学带地形
    q(s.x, s.z, s.r, s.h);
    if (s.peak) h += smooth01(clamp(1 - Math.hypot(x - s.x, z - s.z) / s.peak.r, 0, 1)) ** 2 * s.peak.hh;
    q(s.dock[0], s.dock[1], 13, 2.2, .95);
  }
  const ed = Math.hypot(x - WHALE_EYE.x, z - WHALE_EYE.z);
  h -= smooth01(clamp(1 - ed / WHALE_EYE.r, 0, 1)) * 9;
  const bd2 = Math.hypot(x - WHALE_BLOW.x, z - WHALE_BLOW.z);
  h -= smooth01(clamp(1 - bd2 / WHALE_BLOW.r, 0, 1)) * 11;
  // 海岸柔化:抬高 -3.5..+3.5 过渡带(修复新噪声下沉的栈桥,滩涂也更自然)
  if (h > -3.5 && h < 3.5) h += (3.5 - Math.abs(h)) / 3.5 * 2.2;
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
  { id: 'wax',     icon: '🕯️', name: '蜂蜡耳塞',   en: 'Beeswax Plugs', slot: '耳部', price: 12, desc: '奥德修斯同款,船员们都说好。', effect: '塞壬海域免疫歌声魅惑,可安全穿越', brand: null },
  { id: 'rope',    icon: '🧵', name: '阿里阿德涅导绳', en: 'Guide Reel', slot: '腰间', price: 28, desc: '洞穴潜水员的命——一头系在洞口,顺着它绝不会迷路。', effect: '海底隧道迷宫中显现发光导绳与出口浮标,照亮通往各岛的暗道', brand: null },
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

/* --- 鉴赏里程碑:深化 1001 收藏,每类看得越多奖励越丰 --- */
const MILE_TIERS = [[10, '🥉 初鉴', 10], [25, '🥈 品鉴', 25], [50, '🥇 精鉴', 50]];
const mileGot = new Set((() => { try { return (PSTORE.getItem('w1001.mile') || '').split(',').filter(Boolean); } catch (e) { return []; } })());
function mileTier(cat) {   // 返回该类当前已达最高段位图标(用于图鉴徽章)
  const n = seen[cat] ? seen[cat].length : 0;
  if (n >= (D[cat] ? D[cat].length : 1e9)) return '🏆';
  if (n >= 50) return '🥇'; if (n >= 25) return '🥈'; if (n >= 10) return '🥉'; return '';
}
function checkMilestone(cat) {
  const n = seen[cat].length;
  const tiers = [...MILE_TIERS, [D[cat].length, '🏆 全收录', 100]];
  for (const [th, nm, rw] of tiers) {
    const key = cat + ':' + th;
    if (n >= th && !mileGot.has(key)) {
      mileGot.add(key);
      try { PSTORE.setItem('w1001.mile', [...mileGot].join(',')); } catch (e) {}
      earnSB(rw);
      setTimeout(() => { toast(`${nm} · ${CATS[cat].name} 达成!⚡+${rw}`); blip(740); setTimeout(() => blip(990), 110); }, 450);
    }
  }
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
    checkMilestone(cat);
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
    <div class="pFoot">天气:${WEATHER === 'rain' ? '全域有雨,渔汛正旺,出门带蓑衣' : WEATHER === 'fog' ? '大雾,能见度低,塞壬海域尤请谨慎' : '晴,傍晚有物理正确的晚霞'},夜间星空营业,灯塔照常旋转 ·
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
      <div class="gRow"><div class="gi">📜</div>
        <div class="gInfo"><b>羊皮纸典藏创刊号</b> <span style="color:#8a7c62;font-size:12px">限量收藏</span>
        <div class="gDesc">1001日报创刊号复刻,羊皮纸印制,全岛仅一份</div></div>
        <button class="gBtn" data-vellum>${PSTORE.getItem('w1001.vellum') === '1' ? '已收藏 ✓' : '收藏 · 15 SB'}</button></div>
    </div>`;
}
/* --- 多元宇宙:世界列表与穿越 --- */
const WORLDS = [
  { key: 'truman', icon: '📺', name: '楚门的世界', en: 'The Truman Show', open: true, desc: '桃源岛 · 一座直播了三十年的摄影棚' },
  { key: 'lotr', icon: '💍', name: '指环王 · 中土', en: 'Middle-earth', open: true, desc: '西有夏尔炊烟,东有魔多火山' },
  { key: 'hp', icon: '⚡', name: '哈利·波特', en: 'Wizarding World', open: false, desc: '霍格沃茨已通车——请走主岛 9¾ 站台', note: '🚂 乘特快列车' },
  { key: 'mob', icon: '🐳', name: '莫比·迪克', en: 'Moby-Dick', open: true, desc: '南塔开特捕鲸港 · 白鲸在环岛海域出没' },
  { key: 'sport', icon: '⚽', name: '体育岛', en: 'Sports Isle', open: true, desc: '一万人红色梦剧场 · 曼联 vs 曼城进行中' },
  { key: 'shj', icon: '🐉', name: '山海经', en: 'Shan Hai Jing', open: true, desc: '异兽之野:九尾狐 · 烛龙 · 饕餮 · 帝江' },
  { key: 'anh', icon: '🪔', name: '一千零一夜', en: 'Arabian Nights', open: true, desc: '巴格达集市 · 神灯 · 飞毯 · 山鲁佐德' },
  { key: 'nem', icon: '🐚', name: '海底两万里', en: '20,000 Leagues', open: true, desc: '鹦鹉螺号锚地 · 尼摩船长' },
  { key: 'b612', icon: '🌹', name: 'B-612 小行星', en: 'The Little Prince', open: true, desc: '玫瑰 · 猴面包树 · 一盏路灯' },
  { key: 'jur', icon: '🦖', name: '侏罗纪公园', en: 'Jurassic Park', open: true, desc: '电网围场 · 生命总会找到出路' },
  { key: 'hgs', icon: '🐒', name: '花果山', en: 'Journey to the West', open: true, desc: '水帘洞 · 蟠桃园 · 石中金箍棒' },
  { key: 'alc', icon: '🎩', name: '爱丽丝梦游仙境', en: 'Wonderland', open: true, desc: '巨蘑菇 · 疯帽子茶会 · 柴郡猫' },
  { key: 'cbi', icon: '🔥', name: '三国 · 赤壁', en: 'Red Cliffs', open: true, desc: '连环战船 · 七星坛借东风 · 夜借箭' },
  { key: 'lrs', icon: '🏮', name: '聊斋 · 兰若寺', en: 'Liaozhai', open: true, desc: '昼夜两副面孔的荒寺(夜里再去)' },
  { key: 'lsp', icon: '⚔️', name: '水浒 · 梁山泊', en: 'Water Margin', open: true, desc: '八百里水泊 · 聚义厅纳投名状' },
  { key: 'fcy', icon: '🌀', name: '堂吉诃德 · 风车原野', en: 'Don Quixote', open: true, desc: '巨人(风车)阵 · 陪骑士冲锋' },
  { key: 'yfb', icon: '⛓️', name: '基督山 · 伊夫堡', en: 'Monte Cristo', open: true, desc: '海上监狱 · 越狱 · 黑岩宝藏' },
  { key: 'rbx', icon: '🏝️', name: '鲁滨逊 · 绝望岛', en: 'Robinson Crusoe', open: true, desc: '海难船骸 · 集五箱漂流物资' },
  { key: 'dgy', icon: '🏮', name: '红楼梦 · 大观园', en: 'Dream of Red Chamber', open: true, desc: '潇湘竹影 · 海棠诗社 · 葬花冢' },
  { key: 'pur', icon: '⛰️', name: '神曲 · 炼狱山', en: 'Mount Purgatory', open: true, desc: '南海孤峰 · 七层螺旋涤七罪 · 山巅地上乐园' },
  { key: 'sirinfo', icon: '🧜‍♀️', name: '塞壬海域', en: 'The Sirens', open: false, desc: '巴格达与侏罗纪之间的危险水道,备好蜂蜡耳塞', note: '无航线,凭勇气' },
  { key: 'thy', icon: '🌸', name: '桃花源 · ???', en: 'Peach Blossom Spring', open: false, desc: '寻向所志,遂迷,不复得路——此地无航线', note: '有缘自遇' },
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
let scaleT = 0, curDA = 1, photoFilter = 0;
const PHOTO_FILTERS = [['原色', ''], ['旧梦', 'sepia(.55) contrast(1.06)'], ['黑白', 'grayscale(1) contrast(1.12)'], ['暖阳', 'saturate(1.4) hue-rotate(-8deg) brightness(1.04)'], ['冷冽', 'saturate(1.2) hue-rotate(12deg) contrast(1.1) brightness(.94)']];
let windFlip = PSTORE.getItem('w1001.wind') === '1';
/* 存档版本(为未来字段迁移预留) */
const SAVE_V = '2';
try { if (PSTORE.getItem('w1001.savev') !== SAVE_V) { /* v1→v2:字段全部向后兼容,无需迁移 */ PSTORE.setItem('w1001.savev', SAVE_V); } } catch (e) {}
const COUPLETS = [
  ['寒塘渡鹤影', '冷月葬花魂'], ['芳情只自遣', '雅趣向谁言'], ['宝鼎茶闲烟尚绿', '幽窗棋罢指犹凉'],
  ['绕堤柳借三篙翠', '隔岸花分一脉香'], ['吟成豆蔻才犹艳', '睡足酴醿梦亦香'], ['珠玉自应传盛世', '神仙何幸下瑶台'],
  ['软衬三春草', '柔拖一缕香'], ['幽微灵秀地', '无可奈何天'],
];
/* --- 典藏卡(LORE 框架) --- */
const LORE = {
  // 山海经
  jiuwei:  { icon: '🦊', color: '#b03a2e', title: '九尾狐', en: 'Nine-tailed Fox', hint: '青丘之兽',
    desc: '《南山经》:青丘之山有兽焉,其状如狐而九尾,其音如婴儿。九条尾巴在暮色里缓缓摇动,像九缕火。' },
  zhulong: { icon: '🐲', color: '#8c2f10', title: '烛龙', en: 'Torch Dragon', hint: '峰顶的赤影',
    desc: '《大荒北经》:人面蛇身而赤,直目正乘。视为昼,瞑为夜,吹为冬,呼为夏。此刻它半阖着眼——所以现在是黄昏。' },
  taotie:  { icon: '🍖', color: '#4a3626', title: '饕餮', en: 'Taotie', hint: '有首无身之兽',
    desc: '贪于饮食,冒于货贿。见到什么吃什么,最后把自己的身体也吃掉了——所以你看,它只剩一个大头。' },
  bifang:  { icon: '🔥', color: '#d35400', title: '毕方', en: 'Bifang', hint: '独脚青鸟',
    desc: '状如鹤,一足,赤文青质而白喙。见则其邑有讹火。它单脚立了一千年,从没喊过累。' },
  dijiang: { icon: '🎭', color: '#d9b26a', title: '帝江', en: 'Hundun', hint: '会跳舞的混沌',
    desc: '状如黄囊,赤如丹火,六足四翼,浑敦无面目——却识歌舞。没有脸,不妨碍它活得最快乐。' },
  baize:   { icon: '🦁', color: '#e8e4dc', title: '白泽', en: 'Bai Ze', hint: '通晓万物的神兽',
    desc: '能言语,达于万物之情。天下鬼神之事,问它就好——不过它只回答用心提的问题。' },
  // 桃花源
  taocave: { icon: '🕳️', color: '#4a4438', title: '临水山洞', en: 'A Cave', hint: '仿佛若有光',
    desc: '山有小口,仿佛若有光。初极狭,才通人。——要进去看看吗?' },
  taoback: { icon: '🕳️', color: '#4a4438', title: '来时的洞口', en: 'The Way Back', hint: '既出,得其船',
    desc: '村里人说:不足为外人道也。你回头看了看桃花深处,把路记在了心里——虽然他们说,后遂无问津者。' },
  taofield:{ icon: '🌾', color: '#6a9c50', title: '良田美池', en: 'Fields of Peace', hint: '阡陌交通',
    desc: '土地平旷,屋舍俨然,有良田美池桑竹之属。阡陌交通,鸡犬相闻。黄发垂髫,并怡然自乐。' },
  // 一千零一夜
  genie:   { icon: '🪔', color: '#b8862e', title: '神灯', en: 'The Wonderful Lamp', hint: '擦一擦?',
    desc: '一盏其貌不扬的铜油灯,擦亮的地方映出你的脸。传说灯神有起床气,但对有礼貌的人很大方。(每天可许愿一次)' },
  carpet:  { icon: '🧞', color: '#8c2f4e', title: '飞毯', en: 'Magic Carpet', hint: '乘飞毯回主岛',
    desc: '一张绣着星图的红毯悬在半空,边缘的流苏无风自动。它认得回收藏之岛的路——抓稳了。' },
  story:   { icon: '🌙', color: '#2a2438', title: '山鲁佐德之夜', en: "Scheherazade's Night", hint: '今夜的故事',
    desc: () => { const r = mulberry32([...todayStr()].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 9)); const b = D.books[Math.floor(r() * D.books.length)]; const a2 = D.art[Math.floor(r() * D.art.length)]; return `第 ${1001 - (Math.floor(Date.now() / 86400000) % 1001)} 夜。山鲁佐德今晚讲的是《${esc(b.zh)}》里的故事,讲到一半,又扯到了一幅叫《${esc(a2.title)}》的画。国王听得忘了杀她。天就亮了。`; } },
  bazaar:  { icon: '🏺', color: '#c87f2f', title: '巴格达集市', en: 'The Bazaar', hint: '逛逛集市',
    desc: '香料、铜器、地毯与谎言,应有尽有。摊主赌咒发誓说那只旧瓶子里封着魔鬼——"所罗门的封印,看到没有!"' },
  // 海底两万里
  nautilus:{ icon: '🐚', color: '#2a3a44', title: '鹦鹉螺号', en: 'The Nautilus', hint: '传奇潜艇',
    desc: '一万两千米深海归来的钢铁鲸鱼。铆钉外壳上还挂着章鱼吸盘的痕迹。"Mobilis in Mobili"——动中之动。' },
  porthole:{ icon: '🔭', color: '#16506a', title: '观景舷窗', en: 'The Salon Window', hint: '看看海里',
    desc: () => { const p3 = () => D.fish[Math.floor(Math.random() * D.fish.length)].name; return `钢板缓缓滑开,灯光射进深蓝。舷窗外正游过:「${p3()}」「${p3()}」「${p3()}」……阿龙纳斯教授已经趴在玻璃上了。`; } },
  // B-612
  rose:    { icon: '🌹', color: '#c2185b', title: '玫瑰', en: 'The Rose', hint: '她需要照顾',
    desc: '玻璃罩下,一朵骄傲的红玫瑰。"我才不怕老虎呢,"她说,"但我讨厌穿堂风。"(每天可以为她浇一次水)' },
  baobab:  { icon: '🌳', color: '#7a5230', title: '猴面包树', en: 'Baobabs', hint: '要每天拔的树',
    desc: '小王子说:猴面包树长大之前和玫瑰差不多,一旦认出来就要立刻拔掉,不然它们会把整个星球撑裂。这三棵……好像已经拔不动了。' },
  lamppost:{ icon: '🏮', color: '#d9b26a', title: '路灯', en: 'The Lamp', hint: '点灯人的岗位',
    desc: '这颗星球一天只需要点一次灯。点灯人说从前这里一分钟一昼夜,他点了又熄,熄了又点,连打盹的工夫都没有。现在好多了。' },
  // 侏罗纪公园
  jurgate: { icon: '🦖', color: '#3a4a2a', title: '园区大门', en: 'Jurassic Park Gate', hint: '欢迎来到侏罗纪公园',
    desc: '十五米高的木门,火把在两侧燃烧。哈蒙德博士的声音仿佛还在:"Welcome... to Jurassic Park."(电网今天是通电的,别摸)' },
  trex:    { icon: '🦖', color: '#5a4632', title: '霸王龙', en: 'T-Rex', hint: '别跑,它看得见你',
    desc: '暴龙王,咬合力六吨。围栏内侧的警示牌已经被咬掉了一角。有人说它看不见静止的东西——那是电影骗你的,快跑。' },
  brachio: { icon: '🦕', color: '#4a6a4a', title: '腕龙', en: 'Brachiosaurus', hint: '温柔的巨人',
    desc: '二十二米长的温柔巨人,正踮起前脚去够树顶的嫩叶。看到它的第一眼,格兰特博士摘下了墨镜——你现在懂那种感觉了。' },
  raptor:  { icon: '🦎', color: '#6a5a2a', title: '迅猛龙', en: 'Velociraptor', hint: '聪明的女孩们',
    desc: '成对狩猎,会开门,会声东击西。饲养员马尔杜恩最后一句话是:"Clever girl."——所以别背对着围栏。' },
  // 花果山
  shuilian:{ icon: '💦', color: '#2e86ab', title: '水帘洞', en: 'Water Curtain Cave', hint: '瀑布后有洞天',
    desc: '"一派白虹起,千寻雪浪飞。"帘后石碣上刻着十个大字:花果山福地,水帘洞洞天。石猴当年就是从这里跳进去的。' },
  pantao:  { icon: '🍑', color: '#ef9fbc', title: '蟠桃园', en: 'Peach Orchard', hint: '摘个桃?(每日一次)',
    desc: '三千年一熟的没有,三百年一熟的也没有——但今早刚熟的有。八戒说他"就闻闻",已经闻掉了两筐。' },
  jingu:   { icon: '🥢', color: '#b8862e', title: '定海神针', en: 'The Golden Cudgel', hint: '石中金箍棒',
    desc: '重一万三千五百斤,如意金箍棒。插在山顶石中,微微嗡鸣。碑文:"集齐三颗星辰者,可将其请出。"' },
  // 爱丽丝
  mushroom:{ icon: '🍄', color: '#c0392b', title: '双面蘑菇', en: 'The Mushroom', hint: '吃一口试试?',
    desc: '毛毛虫留下的忠告:"一边让你变高,另一边让你变矮。"它没说哪边是哪边。(效果一分钟)' },
  tinydoor:{ icon: '🚪', color: '#b8862e', title: '小小门', en: 'The Tiny Door', hint: '只有变小才进得去',
    desc: '一扇十五厘米高的小门,门后金光闪闪。门把手打着哈欠:"变小再来敲,谢谢配合。"(每日一次)' },
  cheshire:{ icon: '😼', color: '#6a3a8c', title: '柴郡猫', en: 'Cheshire Cat', hint: '树上有个笑',
    desc: '"我们这儿全是疯子。"它一边说一边消失,最后只剩下笑容挂在树梢——没有猫,只有笑。' },
  rabbithole:{ icon: '🐇', color: '#4a4438', title: '兔子洞', en: 'The Rabbit Hole', hint: '兔子先生迟到了',
    desc: '洞口散落着一只怀表和一副白手套。里面传来渐远的喊声:"来不及了来不及了!"——别跳,你已经在仙境了。' },
  // 赤壁
  caochuan:{ icon: '🛶', color: '#4a5a6a', title: '草船', en: 'The Straw Boats', hint: '夜里来借箭',
    desc: '二十只草船,束草千余。军师吩咐:雾夜近曹营擂鼓,天明前满载而归。白天去?白天去就是活靶子。(夜里每次+1 SB,每晚 20 支)' },
  qixingtan:{ icon: '🌬️', color: '#2a3a5a', title: '七星坛', en: 'The Seven-Star Altar', hint: '借东风',
    desc: '孔明沐浴斋戒,身披道衣,缓步登坛。"万事俱备,只欠东风。"——要替他把风借来吗?' },
  // 兰若寺
  well:    { icon: '🪣', color: '#2a3630', title: '寺后古井', en: 'The Old Well', hint: '夜里井下有物',
    desc: '白日看只是枯井。入夜后,井底隐隐有白衣飘动——小倩的骨灰坛藏在井壁暗格里,取出它,才能送她投胎。' },
  grave:   { icon: '🕯️', color: '#3a4436', title: '安魂之处', en: 'A Resting Place', hint: '白杨树下',
    desc: '寺外白杨萧萧。燕赤霞说:"把骨灰葬在生人阳气旺处,姥姥就再也拿她无可奈何。"' },
  laolao:  { icon: '🌲', color: '#2a1c22', title: '千年树妖·姥姥', en: 'The Tree Demon', hint: '别靠古树太近',
    desc: '寺后那株老树,根须钻进坟茔,枝桠伸向人间。她以女鬼为饵、摄人精血已逾千年——小倩,不过是她千百个替身之一。夜里靠近,能听见树心里咯咯的笑。' },
  huapi:   { icon: '🎭', color: '#3a2028', title: '画皮', en: 'The Painted Skin', hint: '墙上那张人皮',
    desc: '厉鬼取五彩笔,于一张人皮上细细描画,画毕披于身,便成绝色女子。《画皮》有言:"世人愚昧,明明是妖,而以为美。"——你看得出谁是画皮吗?' },
  hall:    { icon: '🏯', color: '#2a2620', title: '兰若寺·大殿', en: 'The Main Hall', hint: '残佛低眉',
    desc: '梁木朽断,金身剥落,残佛仍低眉垂目,似怜众生。香案积灰三寸,唯有一盏长明灯,不知被谁夜夜续着油。' },
  // 梁山泊
  juyi:    { icon: '⚔️', color: '#8c2f24', title: '聚义厅', en: 'Hall of Loyalty', hint: '上山要交投名状',
    desc: '杏黄旗上"替天行道"四个大字。交椅一百单八把,还空着一把。王伦规矩:上山者,先纳投名状——钓满五尾鱼,即见诚心。' },
  zhangshun:{ icon: '🐟', color: '#3a6a8a', title: '浪里白条', en: 'Zhang Shun', hint: '水边的好汉',
    desc: '张顺,浑身雪白,水底伏得七日七夜。"兄弟,看你也是爱钓的——我教你个诀窍:提竿别急,数半拍。"(永久:咬钩窗口+0.35秒)' },
  // 塞壬海域
  sirenrock:{ icon: '🧜‍♀️', color: '#4a2a5a', title: '塞壬之礁', en: 'The Sirens', hint: '歌声危险',
    desc: '礁石上白骨与竖琴并陈。她们唱的不是歌,是你最想听的那句话。塞好耳塞的人,才能看清礁顶的珍宝。' },
  odysseus:{ icon: '⛵', color: '#3a4a5a', title: '奥德修斯之船', en: "Odysseus' Ship", hint: '桅杆上绑着人',
    desc: '船员双耳封蜡,奋力划桨;桅杆上绑着他们的王。"无论我怎么哀求,都不要给我松绑——我要听完这支歌,并且活着。"' },
  // 风车原野
  windmill:{ icon: '🌀', color: '#8a7a5a', title: '巨人(风车)', en: 'The Giants', hint: '那是……风车吧?',
    desc: '"命运指引我们走向比想象更伟大的冒险!看,三十多个狂暴的巨人!"——桑丘:"大人,那是风车。""闭嘴,胆小鬼。"' },
  charge:  { icon: '🐎', color: '#b8862e', title: '冲锋起点', en: 'The Charge', hint: '陪骑士冲一次?',
    desc: '堂吉诃德挺枪跨马,驽骍难得打了个喷嚏。"侍从!随我把这些巨人挑落马下,荣耀属于杜尔西内娅!"(就冲一次,真的就一次)' },
  // 伊夫堡
  cell:    { icon: '⛓️', color: '#2a2a30', title: '34 号牢房', en: 'Cell No. 34', hint: '墙后有敲击声',
    desc: '法利亚长老用二十年凿通了这堵墙。"孩子,我把宝藏的秘密给你——基督山岛,黑岩之下。我出不去了,你替我看看海。"(获得藏宝图)' },
  jumpsea: { icon: '🌊', color: '#16506a', title: '城堡崖缘', en: 'The Leap', hint: '越狱只有一条路',
    desc: '狱卒把"尸袋"抛进海里的地方。三十米,黑浪,铁链。唐泰斯就是从这里获得自由的——带着图,跳。' },
  digtreasure:{ icon: '💎', color: '#b8862e', title: '黑岩之下', en: 'The Treasure', hint: '按图索骥',
    desc: '小基督山岛,黑色岩石的阴影里。挖开浮土,铁箱的锁早已锈蚀——"世界上最大的智慧,是等待和希望。"' },
  // 大观园
  zanghua: { icon: '🌺', color: '#c2185b', title: '葬花冢', en: 'Flower Grave', hint: '花冢添一抔(每日)',
    desc: '"侬今葬花人笑痴,他年葬侬知是谁?"锦囊收艳骨,净土掩风流。替她添一抔落花吧。' },
  shishe:  { icon: '📜', color: '#6a3a8c', title: '海棠诗社', en: 'The Poetry Club', hint: '今日诗题',
    desc: '稻香老农社长立的规矩:每日一题,限韵不限体。对上了,社里出润笔。(每日一题)' },
  // 绝望岛
  wreck:   { icon: '🚢', color: '#5a4632', title: '海难船骸', en: 'The Wreck', hint: '搁浅的旧船',
    desc: '桅杆折断,船身半埋沙中。鲁滨逊从这里搬走了木板、火药、饼干和一条狗。"我把能拆的都拆了,"他说,"包括绝望。"' },
  footprint:{ icon: '👣', color: '#c8a86a', title: '沙滩脚印', en: 'The Footprint', hint: '沙滩上有什么',
    desc: '一个赤裸的人的脚印,清清楚楚印在沙上。鲁滨逊盯着它看了整整一天——独居第十七年,这是他见过最可怕、也最动人的东西。' },
  flotsam: { icon: '📦', color: '#7a5230', title: '漂流物资', en: 'Flotsam', hint: '海上漂来的箱子',
    desc: '被海浪推上岸的木箱,裹着海藻。鲁滨逊说集齐五箱,他就把二十八年的生存术倾囊相授。(+2 SB)' },
  // 神曲·炼狱山(七层螺旋 + 山门 + 山巅乐园)
  purgate: { icon: '⛰️', color: '#3a4a6a', title: '涤罪滩', en: 'The Shore', hint: '炼狱山脚',
    desc: '晨光里,一座孤峰从南海升起。守门的老者卡托拦住你:"用芦苇束腰,以露水净面——凡登此山者,须洗去脸上地狱的煤灰。"沿螺旋而上,七层各涤一罪。' },
  purpride: { icon: '🪨', color: '#6a5a4a', title: '第一层 · 傲慢', en: 'Pride', hint: '俯身负石',
    desc: '傲慢者背负巨石,压得直不起腰,只能盯着脚下——地面刻满谦卑的浮雕。"生前昂着的头,如今学着低下。"石头很重,但越走越轻。' },
  purenvy:  { icon: '🧵', color: '#7a8a6a', title: '第二层 · 嫉妒', en: 'Envy', hint: '铁线缝眼',
    desc: '嫉妒者穿灰色苦衣,靠墙而坐,眼睑被铁线缝合——生前用嫉妒的目光刺人,此刻什么也看不见,只能互相搀扶。风里有声音在念:凡爱人者有福了。' },
  purwrath: { icon: '🌫️', color: '#4a4650', title: '第三层 · 愤怒', en: 'Wrath', hint: '浓烟蔽目',
    desc: '刺鼻的黑烟裹住整层,伸手不见五指——愤怒曾蒙蔽人心,如今化作浓烟蒙蔽双眼。你屏住呼吸走过,烟里有人低声祈求平安。' },
  pursloth: { icon: '🏃', color: '#5a6a5a', title: '第四层 · 怠惰', en: 'Sloth', hint: '不停奔跑',
    desc: '怠惰者绕着山层疯狂奔跑,一刻也不敢停——生前爱得太冷淡、太迟缓,此刻要用奔跑补足。他们喊着彼此激励的口号,从你身边呼啸而过。' },
  puravar:  { icon: '💰', color: '#6a5a3a', title: '第五层 · 贪财', en: 'Avarice', hint: '面朝尘土',
    desc: '贪财者俯卧在地,面贴尘土,手脚被缚——"生前眼里只有地上的黄金,如今就让他们看个够。"有个教皇也在其中,谦卑地报出自己的名字。' },
  purglut:  { icon: '🍎', color: '#7a4a3a', title: '第六层 · 贪吃', en: 'Gluttony', hint: '果树难及',
    desc: '两株清泉浇灌的果树垂满鲜果,香气诱人;贪吃者形销骨立,却怎么也够不着——饥渴使他们瘦得眼窝深陷,却也第一次尝到节制的滋味。' },
  purlust:  { icon: '🔥', color: '#b8482e', title: '第七层 · 色欲', en: 'Lust', hint: '穿火而行',
    desc: '一堵火墙横贯整层,烈焰灼人却不伤形。要登顶,唯有穿火而过——但丁在此犹豫良久。维吉尔说:"这火与你和贝雅特丽齐之间,只隔一层。"于是他闭眼走了进去。' },
  marlin:  { icon: '🐟', color: '#2a4a7a', title: '大马林鱼', en: 'The Great Marlin', hint: '帮老人搏鱼',
    desc: '拴在船舷的这条马林鱼,从吻到尾比小船还长——银蓝的脊背,长剑似的上颌。圣地亚哥说他等了八十四天,又搏了三天三夜才制服它。如今归途未半,血腥味已招来成群的鲨鱼……你要帮他守住这条鱼吗?' },
  peng:    { icon: '🕊️', color: '#2c4a6a', title: '大鹏', en: 'The Peng', hint: '乘之扶摇直上',
    desc: '《逍遥游》:北冥有鱼,其名为鲲。鲲之大,不知其几千里也;化而为鸟,其名为鹏。鹏之背,不知其几千里也;怒而飞,其翼若垂天之云。——它低头看你,似在相邀:可要乘我扶摇直上,环游这一千零一个世界?' },
  eden:    { icon: '🌸', color: '#4a8a5a', title: '山巅 · 地上乐园', en: 'Earthly Paradise', hint: '登临绝顶',
    desc: '七层已尽,眼前豁然:一片神圣的森林,忘川(勒忒)与欢河(欧诺埃)在花间流淌。玛蒂尔达在对岸采花微笑。饮忘川之水,忘却罪的记忆;饮欢河之水,重拾行善的欢愉。贝雅特丽齐正乘光而来。(登顶奖励)' },
};
function loreCard(k) {
  const L = LORE[k];
  const desc = typeof L.desc === 'function' ? L.desc() : L.desc;
  let btn = '';
  if (k === 'taocave') btn = '<button class="again" data-taogo>🕳️ 侧身入洞</button>';
  if (k === 'taoback') btn = '<button class="again" data-taoexit>🕳️ 循原路而出</button>';
  if (k === 'genie') btn = '<button class="again" data-lampgift>🪔 擦亮神灯</button>';
  if (k === 'carpet') btn = '<button class="again" data-flycarpet>🧞 乘飞毯回收藏之岛</button>';
  if (k === 'rose') btn = '<button class="again" data-rosewater>💧 为玫瑰浇水</button>';
  if (k === 'pantao') btn = '<button class="again" data-pantao>🍑 摘一个蟠桃</button>';
  if (k === 'jingu') btn = PSTORE.getItem('w1001.jingu') === '1'
    ? '<span style="color:#8a7c62;font-size:13px">神针已随你去,石中只余棒印。</span>'
    : (stars >= 3 ? '<button class="again" data-jingu>🥢 双手握棒,请出神针!</button>'
      : `<span style="color:#8a7c62;font-size:13px">(现有 ⭐×${stars},尚需集齐 3 颗)</span>`);
  if (k === 'mushroom') btn = '<button class="again" data-grow>🍄 咬左边(变大)</button><button class="again" data-shrink style="margin-left:8px">🍄 咬右边(变小)</button>';
  if (k === 'tinydoor') btn = '<button class="again" data-tiny>🚪 敲小小门</button>';
  if (k === 'caochuan') btn = '<button class="again" data-arrow>🏹 擂鼓!受箭!</button>';
  if (k === 'qixingtan') btn = '<button class="again" data-wind>🌬️ 登坛借风</button>';
  if (k === 'well') btn = '<button class="again" data-well>🪣 探井</button>';
  if (k === 'grave') btn = '<button class="again" data-bury>🕯️ 安葬骨灰坛</button>';
  if (k === 'juyi') btn = '<button class="again" data-juyi>⚔️ 递上投名状</button>';
  if (k === 'zhangshun') btn = '<button class="again" data-zhangshun>🐟 请教钓诀</button>';
  if (k === 'sirenrock') btn = '<button class="again" data-siren>💎 取礁顶珍宝</button>';
  if (k === 'charge') btn = '<button class="again" data-charge>🐎 冲啊——!</button>';
  if (k === 'cell') btn = '<button class="again" data-cell>🗺️ 接过藏宝图</button>';
  if (k === 'jumpsea') btn = '<button class="again" data-jumpsea>🌊 跳!</button>';
  if (k === 'digtreasure') btn = '<button class="again" data-dig>💎 挖!</button>';
  if (k === 'zanghua') btn = '<button class="again" data-flower>🌺 添一抔落花</button>';
  if (k === 'shishe') btn = '<button class="again" data-poem>📜 领今日诗题</button>';
  if (k === 'flotsam') btn = '<button class="again" data-flotsam>📦 撬开木箱</button>';
  if (k === 'treasuredig') btn = PSTORE.getItem('w1001.treasure') === '1'
    ? '<span style="color:#8a7c62;font-size:13px">坑已挖开,弗林特的黄金归你——空气里还飘着一点朗姆酒味。</span>'
    : '<button class="again" data-treasure>⛏️ 照着藏宝图,挖!</button>';
  if (k === 'marlin') btn = PSTORE.getItem('w1001.marlin') === '1'
    ? '<span style="color:#8a7c62;font-size:13px">船边只剩一副雪白的巨大骨架。老人睡了,梦见狮子。</span>'
    : '<button class="again" data-marlin>🦈 抄起鱼叉,和鲨鱼拼了!</button>';
  if (k === 'peng') btn = '<button class="again" data-peng>🕊️ 乘大鹏,扶摇直上九万里</button>';
  if (k === 'eden') btn = PSTORE.getItem('w1001.purg') === '1'
    ? '<span style="color:#8a7c62;font-size:13px">你已饮过忘川之水,罪的记忆随流水而去,只余轻盈。</span>'
    : '<button class="again" data-eden>🌸 饮忘川之水,登临乐园</button>';
  const _niq = NIQ_BY_LORE[k];   // 海洋文学带故事线:自动挂在对应 lore 卡上
  if (_niq) btn = PSTORE.getItem('w1001.' + _niq.flag) === '1'
    ? `<span style="color:#8a7c62;font-size:13px">${_niq.done}——这一段,已写进你的航海日志。</span>`
    : `<button class="again" data-niq="${_niq.flag}">${_niq.btn}</button>`;
  return `<div class="cardHead" style="background:${L.color}">${L.icon} ${esc(L.title)}</div>
    <div class="cardMedia"><div class="paperRoll">${L.icon}</div></div>
    <div class="cardTitle"><h3>${esc(L.title)}</h3><div class="en">${L.en}</div></div>
    <div class="cardDesc">${desc}</div>
    ${btn ? `<div style="text-align:center;padding:0 0 16px">${btn}</div>` : ''}`;
}
/* --- 体育岛卡片 --- */
let scalperDeal = false;
function sptCard(type) {
  if (type === 'scalper') {
    if (PSTORE.getItem('w1001.ticket') === '1') return `<div class="cardHead" style="background:#4a4438">🎫 德比纪念票根</div>
      <div class="cardMedia"><div class="paperRoll">🎫</div></div>
      <div class="cardTitle"><h3>曼联 vs 曼城 · 内场票</h3><div class="en">座位:弗爵爷身后第一排(自称)</div></div>
      <div class="cardDesc">票面印刷精美,防伪水印是黄牛哥的头像。<br>后来你发现南门本来就免费进……但票根确实挺有纪念意义的。</div>`;
    const price = scalperDeal ? 8 : 30;
    return `<div class="cardHead" style="background:#4a4438">🧢 黄牛哥 · Ticket Tout</div>
      <div class="cardMedia"><div class="paperRoll">🎫</div></div>
      <div class="cardTitle"><h3>"内场票,最后两张!"</h3><div class="en">德比日特别行情</div></div>
      <div class="cardDesc">${scalperDeal ? '黄牛哥(肉痛地):"行吧行吧,球都开场了——8 个币,拿走拿走!"' : '黄牛哥搓着手:"弗爵爷身后第一排,原价 5 币,现在 30。爱要不要,后面还排着队呢。"(身后并没有队)'}</div>
      <div style="text-align:center;padding:0 0 16px">
        <button class="again" data-scalpbuy>🎫 买一张(${price} SB)</button>
        ${scalperDeal ? '' : '<button class="gBtn off" data-scalphaggle style="margin-left:8px">砍价</button>'}
      </div>`;
  }
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
/* --- 星门(星星消费:1⭐ 解锁全域传送) --- */
const SG_LIST = [
  ['main', '🐋 收藏之岛'], ['truman', '📺 楚门的世界'], ['lotr', '💍 中土'], ['hp', '⚡ 霍格沃茨'],
  ['mob', '🐳 南塔开特'], ['sport', '⚽ 体育岛'], ['shj', '🐉 山海经'], ['anh', '🪔 一千零一夜'],
  ['nem', '🐚 鹦鹉螺锚地'], ['b612', '🌹 B-612'], ['jur', '🦖 侏罗纪'], ['hgs', '🐒 花果山'],
  ['alc', '🎩 爱丽丝仙境'], ['cbi', '🔥 赤壁'], ['lrs', '🏮 兰若寺'], ['lsp', '⚔️ 梁山泊'],
  ['fcy', '🌀 风车原野'], ['yfb', '⛓️ 伊夫堡'], ['rbx', '🏝️ 绝望岛'], ['dgy', '🏮 大观园'],
  ['pur', '⛰️ 炼狱山'],
];
function stargateCard() {
  if (PSTORE.getItem('w1001.stargate') !== '1') {
    return `<div class="cardHead" style="background:#3a2a5a">🌀 星门 · Stargate</div>
      <div class="cardMedia"><div class="paperRoll">🌀</div></div>
      <div class="cardTitle"><h3>沉睡的星门</h3><div class="en">以一颗星辰为钥</div></div>
      <div class="cardDesc">石环上刻着古老的铭文:"献上一颗星辰,此门永为你开。"<br>解锁后,可随时传送到任何已通航的世界——一劳永逸。<br><br>当前星星:⭐×${stars}</div>
      ${stars >= 1 ? '<div style="text-align:center;padding:0 0 16px"><button class="again" data-sgunlock>⭐ 献出一颗星,唤醒星门</button></div>'
        : '<div style="text-align:center;padding:0 0 16px;color:#8a7c62;font-size:13px">(完成任意支线即可获得星星)</div>'}`;
  }
  return `<div class="cardHead" style="background:#3a2a5a">🌀 星门 · Stargate</div>
    <div class="cardTitle" style="padding-top:16px"><h3>要去哪个世界?</h3><div class="en">即刻抵达 · 不收船费</div></div>
    <div class="travelGrid">${SG_LIST.map(([k2, nm4]) => `<button data-goworld="${k2}">${nm4}</button>`).join('')}</div>`;
}
function buildCard(s) {
  const cat = s.cat;
  if (cat === 'gate') return stargateCard();
  if (cat === 'news') return newsCard();
  if (cat === 'shop') return shopCard();
  if (cat === 'ferry') return ferryCard();
  if (cat === 'truman') return trumanCard(s.type);
  if (cat === 'lotr') return lotrCard(s.type);
  if (cat === 'hp') return hpCard(s.type, s);
  if (cat === 'mob') return mobCard(s.type);
  if (cat === 'spt') return sptCard(s.type);
  if (cat === 'lore') return loreCard(s.type);
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
  const again = s.type === 'bar' ? `<div style="text-align:center;padding:0 0 16px"><button class="again" data-again>🍺 买一杯(6 SB)${drinks ? ` · 已饮 ${drinks} 杯` : ''}</button><button class="again" data-cellar style="margin-left:8px;background:#5a3a1e">🥃 珍藏窖藏(30 SB)</button></div>` : '';
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
    const dests = { truman: [694, 624], lotr: [-150, -558], hp: [588, -492], mainstation: [146, -84], mob: [120, 702], sport: [-688, 122],
      shj: [SHJ.x, SHJ.z + 112], anh: [ANH.x, ANH.z - 106], nem: [NEM.x, NEM.z - 70], b612: [B612.x, B612.z - 48], jur: [JUR.x, JUR.z - 120],
      hgs: [HGS.x, HGS.z + 118], alc: [ALC.x, ALC.z + 102], cbi: [CBI.x, CBI.z + 110], lrs: [LRS.x, LRS.z + 92], lsp: [LSP.x + 118, LSP.z],
      fcy: [FCY.x, FCY.z - 112], yfb: [YFB.x, YFB.z - 88], rbx: [RBX.x, RBX.z - 96], dgy: [DGY.x, DGY.z + 102],
      pur: [PUR.x, PUR.z + PUR.r + 18], main: [372, 12] };
    const dest = dests[k] || NI_DEST[k] || dests.main;
    player.position.set(dest[0], height(dest[0], dest[1]) + 1, dest[1]); vy = 0;
    closeModals(); blip(520);
    toast(k === 'truman' ? '📺 欢迎来到楚门的世界 · 第 10909 天'
      : k === 'lotr' ? '💍 欢迎来到中土 · 西有夏尔,东有魔多'
      : k === 'hp' ? '⚡ 呜——!霍格沃茨特快抵达霍格莫德站'
      : k === 'mainstation' ? '🚂 呜——!列车抵达 9¾ 站台'
      : k === 'mob' ? '🐳 南塔开特到了。海上有咸腥味,和一个关于白鲸的传说'
      : k === 'sport' ? '⚽ 体育岛到了——听,梦剧场的声浪!'
      : k === 'shj' ? '🐉 山海经·异兽之野——石阙之后,群兽候君'
      : k === 'anh' ? '🪔 巴格达到了。今夜,又是一千零一夜的开始'
      : k === 'nem' ? '🐚 锚地到了。那艘钢铁鲸鱼,就是鹦鹉螺号'
      : k === 'b612' ? '🌹 B-612 到了。小心猴面包树,替玫瑰盖好罩子'
      : k === 'jur' ? '🦖 侏罗纪公园到了——电网是通电的,别摸'
      : k === 'hgs' ? '🐒 花果山福地到了!山顶有神针,瀑后有洞天'
      : k === 'alc' ? '🎩 仙境到了。这里全是疯子——包括渡你来的船'
      : k === 'cbi' ? '🔥 赤壁到了。江风微紧,战船相连'
      : k === 'lrs' ? '🏮 兰若寺到了。白日无妨——夜里,自己小心'
      : k === 'lsp' ? '⚔️ 梁山泊到了。好汉,可带了投名状?'
      : k === 'fcy' ? '🌀 风车原野到了。那位骑士又在跟"巨人"较劲'
      : k === 'yfb' ? '⛓️ 伊夫堡到了。有人在墙里敲了二十年'
      : k === 'rbx' ? '🏝️ 绝望岛到了。沙滩上,好像有脚印'
      : k === 'dgy' ? '🏮 大观园到了。今日诗社有题,潇湘馆竹影正好'
      : k === 'pur' ? '⛰️ 炼狱山到了。七层螺旋通向山巅——每登一层,拂去一宗罪'
      : (NI_MSG[k] || '🐋 回到收藏之岛(主世界)'));
  }));
  cardBody.querySelector('[data-taogo]')?.addEventListener('click', () => {
    PSTORE.setItem('w1001.taofound', '1');
    player.position.set(THY.x - 90, height(THY.x - 90, THY.z) + 1, THY.z); vy = 0;
    closeModals(); blip(520);
    toast('🌸 复行数十步,豁然开朗——桃花源');
  });
  cardBody.querySelector('[data-taoexit]')?.addEventListener('click', () => {
    player.position.set(352, height(352, -388) + 1, -388); vy = 0;
    closeModals(); blip(520);
    toast('🕳️ 既出,得其船。——不足为外人道也');
  });
  cardBody.querySelector('[data-lampgift]')?.addEventListener('click', () => {
    if (PSTORE.getItem('w1001.lamp') === todayStr()) { toast('🧞 灯神(睡眼惺忪):"一天一个愿望,明天请早。"'); return; }
    PSTORE.setItem('w1001.lamp', todayStr());
    earnSB(5);
    closeModals();
    toast('🧞 灯神打着哈欠丢给你一小袋算力:"拿去拿去。" ⚡+5');
    blip(740);
  });
  cardBody.querySelector('[data-rosewater]')?.addEventListener('click', () => {
    if (PSTORE.getItem('w1001.rose') === todayStr()) { toast('🌹 玫瑰:"今天浇过了。殷勤也要有分寸。"'); return; }
    PSTORE.setItem('w1001.rose', todayStr());
    earnSB(2);
    closeModals();
    toast('🌹 玫瑰轻轻晃了晃:"……谢谢。别让小王子知道我说过。" ⚡+2');
    blip(740);
  });
  const daily = (key, gain, okMsg, dupMsg) => {
    if (PSTORE.getItem('w1001.' + key) === todayStr()) { toast(dupMsg); return false; }
    PSTORE.setItem('w1001.' + key, todayStr());
    if (gain) earnSB(gain);
    closeModals(); toast(okMsg); blip(740);
    return true;
  };
  cardBody.querySelector('[data-pantao]')?.addEventListener('click', () =>
    daily('pantao', 3, '🍑 蟠桃入手,咬一口满嘴仙气 ⚡+3', '🍑 八戒(护住桃树):"今天的份没啦!明儿请早!"'));
  cardBody.querySelector('[data-flower]')?.addEventListener('click', () =>
    daily('flowers', 2, '🌺 落花入冢。黛玉远远看了你一眼,轻轻点头 ⚡+2', '🌺 今日花冢已添过,明日再来。'));
  cardBody.querySelector('[data-tiny]')?.addEventListener('click', () => {
    if (player.scale.x > .8) { toast('🚪 门把手:"你这么大,敲了也白敲。先去吃蘑菇。"'); return; }
    daily('tiny', 5, '🚪 小小门开了一条缝,推出一小袋金沙 ⚡+5', '🚪 门把手:"一天一次,规矩就是规矩。"');
  });
  cardBody.querySelector('[data-jingu]')?.addEventListener('click', () => {
    if (PSTORE.getItem('w1001.jingu') === '1' || stars < 3) return;
    PSTORE.setItem('w1001.jingu', '1');
    if (window.__jinguMesh) window.__jinguMesh.visible = false;
    earnSB(40);
    closeModals();
    toast('🥢 金光万道!神针认主,化作绣花针藏进你耳朵 · ⚡+40');
    blip(660); setTimeout(() => blip(880), 100); setTimeout(() => blip(1180), 200);
  });
  cardBody.querySelector('[data-grow]')?.addEventListener('click', () => {
    player.scale.setScalar(1.5); scaleT = 60; closeModals(); toast('🍄 咕唧——你长到了一米八乘一点五!(一分钟)'); blip(520);
  });
  cardBody.querySelector('[data-niq]')?.addEventListener('click', ev => {
    const flag = ev.currentTarget.dataset.niq, q = NIQ_BY_FLAG[flag];
    if (!q || PSTORE.getItem('w1001.' + flag) === '1') return;
    PSTORE.setItem('w1001.' + flag, '1');
    earnSB(q.sb); stars++; saveQuest(); updateQuestHUD();
    closeModals(); toast(q.msg); blip(560); setTimeout(() => blip(720), 110); setTimeout(() => blip(880), 220);
  });
  cardBody.querySelector('[data-treasure]')?.addEventListener('click', () => {
    if (PSTORE.getItem('w1001.treasure') === '1') return;
    PSTORE.setItem('w1001.treasure', '1');
    earnSB(40); stars++; saveQuest(); updateQuestHUD();
    closeModals();
    toast('💰 铁锹磕到了硬物——弗林特船长的六十万英镑!⚡+40 · ⭐+1');
    blip(523); setTimeout(() => blip(659), 100); setTimeout(() => blip(880), 200);
  });
  cardBody.querySelector('[data-marlin]')?.addEventListener('click', () => {
    if (PSTORE.getItem('w1001.marlin') === '1') return;
    PSTORE.setItem('w1001.marlin', '1');
    earnSB(40); stars++; saveQuest(); updateQuestHUD();
    closeModals();
    toast('🦈 你和老人拼死搏斗——大鱼被啃成白骨,可你们没被打败。⚡+40 · ⭐+1');
    blip(392); setTimeout(() => blip(330), 120); setTimeout(() => blip(523), 260);
  });
  cardBody.querySelector('[data-peng]')?.addEventListener('click', () => {
    const a0 = Math.atan2(player.position.z, player.position.x);
    flight = { orbit: true, t: 0, dur: 34, cx: 0, cz: 0, radius: 1260, alt: 168, spins: 1, a0,
      px0: player.position.x, pz0: player.position.z, msg: '🕊️ 大鹏收翼,轻轻落回栖石。“鹏程万里,后会有期。”' };
    if (PSTORE.getItem('w1001.peng') !== '1') { PSTORE.setItem('w1001.peng', '1'); earnSB(5); }
    closeModals();
    toast('🕊️ 抟扶摇而上者九万里!且看这一千零一个世界……');
    blip(392); setTimeout(() => blip(523), 120); setTimeout(() => blip(659), 240); setTimeout(() => blip(784), 360);
  });
  cardBody.querySelector('[data-eden]')?.addEventListener('click', () => {
    if (PSTORE.getItem('w1001.purg') === '1') return;
    PSTORE.setItem('w1001.purg', '1');
    earnSB(40); stars++; saveQuest(); updateQuestHUD();
    closeModals();
    toast('🌸 七罪已涤,你登临山巅地上乐园 · ⚡+40 · ⭐+1');
    blip(523); setTimeout(() => blip(659), 110); setTimeout(() => blip(784), 220);
  });
  cardBody.querySelector('[data-shrink]')?.addEventListener('click', () => {
    player.scale.setScalar(.55); scaleT = 60; closeModals(); toast('🍄 咻——世界忽然变得好大!(一分钟)'); blip(880);
  });
  cardBody.querySelector('[data-arrow]')?.addEventListener('click', () => {
    if (curDA >= .35) { toast('🏹 白日擂鼓?曹操一眼识破,一支箭也没放。等夜里有雾再来!'); return; }
    let [d3, n3] = (PSTORE.getItem('w1001.arrows') || ':0').split(':'); n3 = d3 === todayStr() ? parseInt(n3, 10) || 0 : 0;
    if (n3 >= 20) { toast('🏹 今晚二十支已满——"谢曹丞相赠箭!"'); return; }
    n3++;
    PSTORE.setItem('w1001.arrows', `${todayStr()}:${n3}`);
    earnSB(1);
    toast(`🏹 咚咚咚!曹军放箭——第 ${n3}/20 支 ⚡+1`);
    blip(440 + n3 * 14);
  });
  cardBody.querySelector('[data-wind]')?.addEventListener('click', () => {
    windFlip = !windFlip;
    PSTORE.setItem('w1001.wind', windFlip ? '1' : '');
    closeModals();
    toast(windFlip ? '🌬️ 东风起!旌旗尽向西——"周郎,可以点火了。"' : '🌬️ 风向复原,江面重归平静。');
    blip(520);
  });
  cardBody.querySelector('[data-well]')?.addEventListener('click', () => {
    if (curDA >= .35) { toast('🪣 白日井中只有枯叶。夜里再来。'); return; }
    if (PSTORE.getItem('w1001.qian')) { toast('🪣 井壁暗格已空。'); return; }
    PSTORE.setItem('w1001.qian', 'urn');
    closeModals();
    toast('🏺 取得骨灰坛!井底传来一声轻轻的"多谢"——快送去白杨树下安葬');
    blip(320);
  });
  cardBody.querySelector('[data-bury]')?.addEventListener('click', () => {
    const st2 = PSTORE.getItem('w1001.qian');
    if (st2 === 'done') { toast('🕯️ 小倩已安息。杨树梢上,晨光正好。'); return; }
    if (st2 !== 'urn') { toast('🕯️ 先去寺后古井(夜里)取回骨灰坛。'); return; }
    PSTORE.setItem('w1001.qian', 'done');
    stars++; saveQuest(); updateQuestHUD();
    closeModals();
    toast('🕯️ 骨灰入土,一道白影盈盈一拜,随晨风散去 · ⭐+1');
    blip(660); setTimeout(() => blip(990), 130);
  });
  cardBody.querySelector('[data-juyi]')?.addEventListener('click', () => {
    if (PSTORE.getItem('w1001.hero') === '1') { toast('⚔️ 好汉请上座!您的交椅一直留着。'); return; }
    const fc = parseInt(PSTORE.getItem('w1001.fishcount') || '0', 10) || 0;
    if (fc < 5) { toast(`⚔️ 王伦规矩:投名状=渔获五尾(现有 ${fc} 尾)。去栈桥钓吧!`); return; }
    PSTORE.setItem('w1001.hero', '1');
    stars++; saveQuest(); updateQuestHUD();
    closeModals();
    toast('⚔️ 五尾献上,好汉入伙!得名号「浪里青鳞」· ⭐+1');
    blip(660); setTimeout(() => blip(880), 110);
  });
  cardBody.querySelector('[data-zhangshun]')?.addEventListener('click', () => {
    if (PSTORE.getItem('w1001.rodbuff') === '1') { toast('🐟 张顺:"诀窍教过啦,提竿别急,数半拍。"'); return; }
    PSTORE.setItem('w1001.rodbuff', '1');
    closeModals();
    toast('🐟 张顺授你钓诀:提竿别急,数半拍(永久:咬钩窗口 +0.35 秒)');
    blip(740);
  });
  cardBody.querySelector('[data-siren]')?.addEventListener('click', () => {
    if (PSTORE.getItem('w1001.siren') === '1') { toast('💎 礁顶已空,只剩竖琴与白骨。'); return; }
    PSTORE.setItem('w1001.siren', '1');
    earnSB(15);
    closeModals();
    toast('💎 拾得沉船珍宝!塞壬的歌声恨恨地停了半拍 · ⚡+15');
    blip(880);
  });
  cardBody.querySelector('[data-charge]')?.addEventListener('click', () => {
    const done = PSTORE.getItem('w1001.charge') === '1';
    if (!done) { PSTORE.setItem('w1001.charge', '1'); earnSB(8); }
    flight = { t: 0, dur: 2.4, from: [player.position.x, player.position.z], to: [FCY.x - 18, FCY.z - 6], lift: 6,
      msg: done ? '💥 哐当!又摔了个四仰八叉。桑丘叹了口气。' : '💥 哐当!人仰马翻。堂吉诃德(躺着):"它们用了妖术……" 成就「敢与巨人为敌」⚡+8' };
    closeModals();
    toast('🐎 冲啊——为了杜尔西内娅!!');
    blip(520); setTimeout(() => blip(660), 150);
  });
  cardBody.querySelector('[data-cell]')?.addEventListener('click', () => {
    if (PSTORE.getItem('w1001.yfb')) { toast('🗺️ 地图在你身上。长老向墙那头去了。'); return; }
    PSTORE.setItem('w1001.yfb', 'map');
    closeModals();
    toast('🗺️ 得藏宝图!长老:"从崖缘跳海,游去小基督山——替我自由地活。"');
    blip(320);
  });
  cardBody.querySelector('[data-jumpsea]')?.addEventListener('click', () => {
    if (PSTORE.getItem('w1001.yfb') !== 'map' && PSTORE.getItem('w1001.yfb') !== 'done') { toast('🌊 先去 34 号牢房见法利亚长老。'); return; }
    player.position.set(YFB.x + 52, 0, YFB.z + 58); vy = 0;
    closeModals();
    toast('🌊 扑通!!冰冷的黑浪——向东,游向小基督山!');
    blip(220);
  });
  cardBody.querySelector('[data-dig]')?.addEventListener('click', () => {
    const st3 = PSTORE.getItem('w1001.yfb');
    if (st3 === 'done') { toast('💎 铁箱已空。"等待和希望。"'); return; }
    if (st3 !== 'map') { toast('💎 黑岩之下确有东西,但没有图,不知从何挖起。'); return; }
    PSTORE.setItem('w1001.yfb', 'done');
    earnSB(50);
    stars++; saveQuest(); updateQuestHUD();
    closeModals();
    toast('💎 基督山的宝藏!!"世界上最大的智慧,是等待和希望。" ⚡+50 ⭐+1');
    blip(660); setTimeout(() => blip(880), 100); setTimeout(() => blip(1180), 200); setTimeout(() => blip(1560), 300);
  });
  cardBody.querySelector('[data-poem]')?.addEventListener('click', () => {
    const idx = Math.floor(Date.now() / 86400000) % COUPLETS.length;
    if (PSTORE.getItem('w1001.poem') === todayStr()) { toast(`📜 今日已对:「${COUPLETS[idx][0]}」——「${COUPLETS[idx][1]}」`); return; }
    PSTORE.setItem('w1001.poem', todayStr());
    earnSB(4);
    toast(`📜 上联「${COUPLETS[idx][0]}」,你对「${COUPLETS[idx][1]}」——满座称妙!⚡+4`);
    blip(740);
  });
  cardBody.querySelector('[data-flotsam]')?.addEventListener('click', () => {
    const got = (PSTORE.getItem('w1001.flotsam') || '').split(',').filter(Boolean);
    const fid = String(s.fid ?? 0);
    if (got.includes(fid)) { toast('📦 这只箱子已经撬过了。'); return; }
    got.push(fid);
    PSTORE.setItem('w1001.flotsam', got.join(','));
    earnSB(2);
    if (got.length >= 5) {
      stars++; saveQuest(); updateQuestHUD();
      toast('📦 五箱集齐!鲁滨逊传你二十八年生存术 · ⚡+2 ⭐+1');
      blip(660); setTimeout(() => blip(990), 130);
    } else {
      toast(`📦 撬开木箱:饼干、火药、一把好斧头 ⚡+2(${got.length}/5)`);
      blip(600);
    }
    closeModals();
  });
  cardBody.querySelector('[data-flycarpet]')?.addEventListener('click', () => {
    flight = { t: 0, dur: 10, from: [ANH.x + 20, ANH.z - 28], to: [22, 44] };
    closeModals();
    toast('🧞 飞毯呼啸而起!抓稳流苏——');
    blip(660); setTimeout(() => blip(880), 120);
  });
  cardBody.querySelector('[data-sgunlock]')?.addEventListener('click', () => {
    if (stars < 1) return;
    stars--; saveQuest(); updateQuestHUD();
    PSTORE.setItem('w1001.stargate', '1');
    toast('🌀 星辰没入石环,星门醒了!此后传送不再收费');
    blip(660); setTimeout(() => blip(990), 120);
    const gs3 = spots.find(x3 => x3.cat === 'gate');
    if (gs3) openCard(gs3);
  });
  cardBody.querySelector('[data-cellar]')?.addEventListener('click', () => {
    if (!spendSB(30)) return;
    const pool = D.beers.filter(b4 => b4.cat === 'strong' || b4.cat === 'specialty');
    const b5 = pool[Math.floor(Math.random() * pool.length)] || D.beers[0];
    drinks++; saveSB();
    if (CATS.beers) markSeen('beers', b5.id, b5.name);
    toast(`🥃 珍藏窖藏开瓶:「${b5.name}」(${b5.abv})——值回票价 ⚡-30`);
    blip(520);
    closeModals();
  });
  cardBody.querySelector('[data-vellum]')?.addEventListener('click', () => {
    if (PSTORE.getItem('w1001.vellum') === '1') { toast('🗞️ 典藏号仅此一份,已在你手中。'); return; }
    if (!spendSB(15)) return;
    PSTORE.setItem('w1001.vellum', '1');
    toast('📜 羊皮纸典藏创刊号到手!墨丘利:"传家的东西,别拿来垫桌脚。" ⚡-15');
    blip(740);
    closeModals();
  });
  cardBody.querySelector('[data-scalphaggle]')?.addEventListener('click', () => {
    scalperDeal = true;
    blip(320);
    openCard(s);
  });
  cardBody.querySelector('[data-scalpbuy]')?.addEventListener('click', () => {
    if (!spendSB(scalperDeal ? 8 : 30)) return;
    PSTORE.setItem('w1001.ticket', '1');
    toast('🎫 到手!黄牛哥:"看完别扔,能升值。"(转身消失在人群中)');
    blip(600);
    openCard(s);
  });
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
/* --- 称号系统:成就换称号,可佩戴,显示在 HUD --- */
function titleList() {
  const flot = (PSTORE.getItem('w1001.flotsam') || '').split(',').filter(Boolean).length;
  const f = {
    jingu:  PSTORE.getItem('w1001.jingu') === '1',
    ring:   ringDone(),
    yfb:    PSTORE.getItem('w1001.yfb') === 'done',
    shards: shardsGot.length >= 24,
    dbl:    dblState === 'done',
    qian:   PSTORE.getItem('w1001.qian') === 'done',
    hero:   PSTORE.getItem('w1001.hero') === '1',
    flot:   flot >= 5,
    house:  !!PSTORE.getItem('w1001.house'),
    charge: PSTORE.getItem('w1001.charge') === '1',
    siren:  PSTORE.getItem('w1001.siren') === '1',
    ticket: PSTORE.getItem('w1001.ticket') === '1',
    tao:    PSTORE.getItem('w1001.taofound') === '1',
    purg:   PSTORE.getItem('w1001.purg') === '1',
    marlin: PSTORE.getItem('w1001.marlin') === '1',
    treasure: PSTORE.getItem('w1001.treasure') === '1',
    caved: PSTORE.getItem('w1001.caved') === '1',
  };
  const done = Object.values(f).filter(Boolean).length;
  const tier = done >= 17 ? '👑 万世收藏之主' : done >= 12 ? '🧭 多元宇宙巡礼者' : done >= 6 ? '⛵ 远洋收藏家' : done >= 3 ? '🗺️ 见习航海家' : '🎖️ 无名旅人';
  return [
    { id: 'tier',   name: tier,           got: true,      note: `已成 ${done}/17 传奇` },
    { id: 'qitian', name: '🐒 齐天大圣',   got: f.jingu,   note: '拔出定海神针' },
    { id: 'ring',   name: '💍 护戒使者',   got: f.ring,    note: '销毁至尊魔戒' },
    { id: 'monte',  name: '💎 基督山伯爵', got: f.yfb,     note: '挖出黑岩宝藏' },
    { id: 'star',   name: '✨ 拾星者',     got: f.shards,  note: '集齐 24 枚星之碎片' },
    { id: 'whaler', name: '🐳 望鲸人',     got: f.dbl,     note: '领取白鲸悬赏' },
    { id: 'hero',   name: '⚔️ 梁山好汉',   got: f.hero,    note: '纳投名状入伙' },
    { id: 'qian',   name: '🕯️ 兰若义士',   got: f.qian,    note: '井底救倩安魂' },
    { id: 'tao',    name: '🌸 桃源客',     got: f.tao,     note: '寻得桃花源秘境' },
    { id: 'pilgrim', name: '⛰️ 神曲行者',  got: f.purg,    note: '涤七罪登临乐园' },
    { id: 'marlin', name: '🦈 不可战胜',   got: f.marlin,  note: '与鲨鱼搏至终局' },
    { id: 'treasure', name: '🏴‍☠️ 寻宝者', got: f.treasure, note: '挖出弗林特宝藏' },
    { id: 'caver',  name: '🤿 洞穴潜水员', got: f.caved,   note: '穿越海底隧道迷宫' },
    { id: 'babel',  name: '📖 巴别读者',   got: PSTORE.getItem('w1001.babel') === '1', note: '满月夜入海底巴别海窟' },
    { id: 'skeleton', name: '🕸️ 世界骨架 · 见证者', got: PSTORE.getItem('w1001.skeleton') === '1', note: '窥破星球真正的结构' },
    { id: 'crusoe', name: '🏝️ 荒岛求生者', got: f.flot,    note: '集齐五箱漂流物资' },
    { id: 'connois', name: '🎨 鉴赏大家', got: Object.keys(CATS).some(c => (seen[c] || []).length >= (D[c] ? D[c].length : 1e9)), note: '完整收录任一馆藏' },
    { id: 'astro',  name: '🔭 星图大师',   got: constSeen.size >= constDirs.length && constDirs.length > 0, note: '认全 88 星座' },
  ];
}
function updateTitleHUD() {
  const el = $('hudTitle'); if (!el) return;
  const eqId = PSTORE.getItem('w1001.title') || 'tier';
  const list = titleList();
  let t = list.find(x => x.id === eqId && x.got);
  if (!t) t = list[0];   // 回退到当前段位
  el.textContent = t.name;
}
function equipTitle(id) {
  const t = titleList().find(x => x.id === id);
  if (!t || !t.got) return;
  PSTORE.setItem('w1001.title', id);
  updateTitleHUD();
  toast(`🎖️ 已佩戴称号:${t.name}`);
  blip(660);
  openJournal();
}

function drawStarChart(cv3) {
  if (!cv3) return;
  const ctx = cv3.getContext('2d'), W = cv3.width, H = cv3.height, cx = W / 2, cy = H / 2, RR = Math.min(W, H) / 2 - 16;
  ctx.clearRect(0, 0, W, H);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, RR); g.addColorStop(0, '#0d1836'); g.addColorStop(1, '#05070f');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, RR, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(120,150,210,.22)'; ctx.lineWidth = 1;
  for (const el of [30, 60]) { const r = (90 - el) / 90 * RR; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(cx, cy, RR, 0, 7); ctx.stroke();
  ctx.fillStyle = '#7f93c0'; ctx.font = '11px system-ui'; ctx.textAlign = 'center';
  for (const [t, a] of [['北', 0], ['东', 90], ['南', 180], ['西', 270]]) { const ar = a * Math.PI / 180; ctx.fillText(t, cx + Math.sin(ar) * (RR + 9), cy - Math.cos(ar) * (RR + 9) + 4); }
  let idx = 0;
  for (const cst of CONSTELLATIONS) {
    const az = cst.az * Math.PI / 180, r = (90 - cst.el) / 90 * RR, px = cx + Math.sin(az) * r, py = cy - Math.cos(az) * r;
    if (constSeen.has(idx)) {
      let mx = 0, my = 0; for (const s of cst.stars) { mx += s[0]; my += s[1]; } mx /= cst.stars.length; my /= cst.stars.length;
      const pts = cst.stars.map(([lx, ly]) => [px + (lx - mx) * 3, py - (ly - my) * 3]);
      ctx.strokeStyle = 'rgba(255,220,120,.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); for (const [i, j] of cst.lines) { ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[j][0], pts[j][1]); } ctx.stroke();
      ctx.fillStyle = '#ffe799'; for (const p of pts) { ctx.beginPath(); ctx.arc(p[0], p[1], 1.4, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#ffefb0'; ctx.font = '9px system-ui';
      ctx.fillText(cst.name.replace(/^.+·/, ''), px, py - 6);
    } else { ctx.fillStyle = 'rgba(150,165,200,.32)'; ctx.beginPath(); ctx.arc(px, py, 1.3, 0, 7); ctx.fill(); }
    idx++;
  }
}
/* 主线阶段:由已有进度 flag 推导「追查海底真相」的当前目标(无新增存档)*/
function mainQuest() {
  const seenAny = Object.keys(CATS).some(k => (seen[k] || []).length > 0);
  const hasRope = gear.owned.includes('rope');
  const caved = PSTORE.getItem('w1001.caved') === '1';
  const clues = ['d_heart', 'd_mural', 'babel'].filter(f => PSTORE.getItem('w1001.' + f) === '1').length;
  const skel = PSTORE.getItem('w1001.skeleton') === '1';
  if (skel) return { st: '终章 · 主线已通关', tip: '你已窥破世界骨架的真相。剩下的旅程,是把每座岛的故事都走一遍——看下方各馆藏进度。', done: true };
  if (caved || clues > 0) return { st: `第四章 · 世界骨架 · 线索 ${clues}/3`, tip: '海底迷宫并非天然。潜入深处集齐三线索:🫀 潮汐之心(迷宫正中)· 🖼️ 海底壁画(某条死路尽头)· 📖 巴别海窟(满月夜穿过潮汐门)。' };
  if (hasRope) return { st: '第三章 · 潜入海底', tip: '带上导绳,从主岛西岸「牛首回廊」海蚀洞、或各岛蓝洞潜入海底隧道迷宫,顺着发光导绳穿行到别的岛。' };
  if (seenAny) return { st: '第二章 · 扬帆出海', tip: '去东滩渡口坐船,逛四十余座文学岛(每岛藏着一条故事线)。顺路到千岛装备行买一条「导绳」——那是海底迷宫的钥匙。' };
  return { st: '第一章 · 初来乍到', tip: '在收藏之岛四处走走:走近按 E 看藏品、和 NPC 说话、做支线,攒算力币 ⚡。' };
}
function openJournal() {
  const list = $('journalList');
  const mq = mainQuest();
  const mHtml = `<div class="qBox" style="border:1px solid rgba(120,200,255,.4);background:rgba(60,140,220,.09)"><div class="qTitle"><span>🧭 主线 · 追查海底真相</span><span>${mq.done ? '✅ 通关' : ''}</span></div>
    <div style="font-size:13.5px;color:#8fd0ff;font-weight:700;padding:2px 2px 5px">${mq.st}</div>
    <div style="font-size:12.5px;color:#c4d2c0;padding:0 2px 4px;line-height:1.6">👉 ${mq.tip}</div></div>`;
  const qHtml = quest ? `<div class="qBox"><div class="qTitle"><span>📜 今日委托</span><span>⭐ ×${stars}</span></div>
    ${quest.cats.map(c => {
      const need = QUEST_TPL[c][0], p = Math.min(quest.prog[c], need), ok = p >= need;
      return `<div class="qRow${ok ? ' ok' : ''}"><span>${ok ? '✅' : CATS[c].icon}</span><span>${QUEST_TPL[c][1]}</span><span class="qn">${p}/${need}</span></div>`;
    }).join('')}
    <button id="btnRotate">🔄 给海岛换一批展品</button></div>` : '';
  /* 航海日志:跨世界成就总览 */
  const fc2 = parseInt(PSTORE.getItem('w1001.fishcount') || '0', 10) || 0;
  const flot = (PSTORE.getItem('w1001.flotsam') || '').split(',').filter(Boolean).length;
  const yfbSt = PSTORE.getItem('w1001.yfb'), qianSt = PSTORE.getItem('w1001.qian');
  const LOGROWS = [
    ['✨ 星之碎片(全域)', `${shardsGot.length}/24` + (shardsGot.length >= 24 ? ' ✅' : '')],
    ['💍 魔戒远征(中土)', ringDone() ? '✅ 已销毁' : (hasRing ? '🔥 魔戒在身,去末日火山' : '⏳ 夏尔基座')],
    ['🥢 定海神针(花果山)', PSTORE.getItem('w1001.jingu') === '1' ? '✅ 已拔出' : `⏳ 需 ⭐×3(现 ${stars})`],
    ['💎 基督山宝藏(伊夫堡)', yfbSt === 'done' ? '✅ 已挖出' : (yfbSt === 'map' ? '🗺️ 持图,去小基督山' : '⏳ 34 号牢房')],
    ['🪙 白鲸悬赏(南塔开特)', dblState === 'done' ? '✅ 金币到手' : (dblState === 'seen' ? '🐳 已目击,找亚哈' : (dblState === 'active' ? '🔭 盯住海面' : '⏳ 桅杆金币'))],
    ['🕯️ 井底救倩(兰若寺)', qianSt === 'done' ? '✅ 已安葬' : (qianSt === 'urn' ? '🏺 持坛,去白杨下' : '⏳ 夜探古井')],
    ['⚔️ 投名状(梁山泊)', PSTORE.getItem('w1001.hero') === '1' ? '✅ 好汉入伙' : `⏳ 渔获 ${Math.min(fc2, 5)}/5`],
    ['📦 漂流物资(绝望岛)', flot >= 5 ? '✅ 生存术已学' : `⏳ ${flot}/5 箱`],
    ['🎩 分院(霍格沃茨)', PSTORE.getItem('w1001.house') || '⏳ 城堡门口戴帽'],
    ['🐎 敢与巨人为敌(风车原野)', PSTORE.getItem('w1001.charge') === '1' ? '✅ 冲过了' : '⏳ 陪骑士冲锋'],
    ['💎 塞壬珍宝(塞壬海域)', PSTORE.getItem('w1001.siren') === '1' ? '✅ 已取得' : '⏳ 备好蜂蜡耳塞'],
    ['🎫 德比票根(体育岛)', PSTORE.getItem('w1001.ticket') === '1' ? '✅ 收藏中' : '⏳ 找黄牛哥'],
    ['🌸 桃花源(秘境)', PSTORE.getItem('w1001.taofound') === '1' ? '✅ 曾入桃源' : '⏳ 仿佛若有光……'],
    ['⛰️ 涤罪登顶(炼狱山)', PSTORE.getItem('w1001.purg') === '1' ? '✅ 已登乐园' : '⏳ 登临七层山巅'],
    ['🦈 大马林鱼(老人与海)', PSTORE.getItem('w1001.marlin') === '1' ? '✅ 虽败犹荣' : '⏳ 栈桥旁助老人'],
    ['💰 弗林特宝藏(金银岛)', PSTORE.getItem('w1001.treasure') === '1' ? '✅ 已挖出' : '⏳ 按藏宝图开挖'],
    ['🤿 海底隧道迷宫(蓝洞)', PSTORE.getItem('w1001.caved') === '1' ? '✅ 已穿越' : '⏳ 带导绳潜蓝洞'],
    ['📖 巴别海窟(满月秘门)', PSTORE.getItem('w1001.babel') === '1' ? '✅ 已入密室' : '⏳ 满月夜过潮汐门'],
    ['🕸️ 世界骨架(终局)', PSTORE.getItem('w1001.skeleton') === '1' ? '✅ 已窥全貌' : `⏳ 集齐三线索(${['d_heart', 'd_mural', 'babel'].filter(f => PSTORE.getItem('w1001.' + f) === '1').length}/3)`],
  ];
  for (const k in NI_QUESTS) { const q = NI_QUESTS[k]; LOGROWS.push([q.log, PSTORE.getItem('w1001.nq_' + k) === '1' ? q.done : q.pend]); }   // 海洋文学带 16 条故事线
  const logHtml = `<div class="qBox"><div class="qTitle"><span>🧭 航海日志 · 成就</span><span>${LOGROWS.filter(r2 => r2[1].includes('✅')).length}/${LOGROWS.length}</span></div>
    ${LOGROWS.map(([nm2, st5]) => `<div class="qRow${st5.includes('✅') ? ' ok' : ''}"><span>${nm2}</span><span class="qn">${st5}</span></div>`).join('')}</div>`;
  /* 称号:成就换称号,点击佩戴 */
  const eqId = PSTORE.getItem('w1001.title') || 'tier';
  const titleHtml = `<div class="qBox"><div class="qTitle"><span>🎖️ 称号</span><span>${titleList().filter(t => t.got).length} 个可佩戴</span></div>
    ${titleList().map(t => `<div class="qRow${t.got ? ' ok' : ''}">
      <span>${t.got ? t.name : '🔒 ???'}</span>
      <span class="qn">${t.got ? (t.id === eqId ? '佩戴中' : `<button class="tEquip" data-eqtitle="${t.id}">佩戴</button>`) : t.note}</span></div>`).join('')}</div>`;
  const chartHtml = `<div class="qBox"><div class="qTitle"><span>🌌 星图 · 认得的星座</span><span>${constSeen.size}/${constDirs.length}</span></div>
    <canvas id="starChart" width="320" height="320" style="width:100%;max-width:340px;display:block;margin:8px auto;border-radius:10px"></canvas>
    <div style="font-size:12px;color:#8a9a7c;text-align:center">夜里按 <b>K</b> 观星,把星座转到视野中央即可认得它</div></div>`;
  list.innerHTML = mHtml + qHtml + titleHtml + chartHtml + logHtml + Object.keys(CATS).map(k => {
    const cfg = CATS[k], n = seen[k].length, embed = D[k].length;
    const pct = Math.round(n / embed * 100);
    const badge = mileTier(k);
    return `<div class="jRow"><div class="ico">${cfg.icon}</div>
      <div class="info"><div class="nm">${cfg.name} ${badge}<span style="color:#93a07f;font-weight:400">${cfg.en}</span></div>
      <div class="jBar"><i style="--c:${cfg.color};width:${pct}%"></i></div>
      <div class="tot">岛上在展 ${embed} · 完整收藏 ${cfg.tot} ${cfg.unit} · 鉴赏 10/25/50/全</div></div>
      <div class="num">${n}/${embed}</div>
      <a href="${cfg.link}" target="_blank" rel="noopener">网站 →</a></div>`;
  }).join('');
  $('journal').classList.remove('hidden'); modalOpen = true;
  drawStarChart(list.querySelector('#starChart'));
  list.querySelector('#btnRotate')?.addEventListener('click', rotateExhibits);
  list.querySelectorAll('[data-eqtitle]').forEach(b => b.addEventListener('click', () => equipTitle(b.dataset.eqtitle)));
}
$('btnJournal').addEventListener('click', openJournal);
$('hudQuest').addEventListener('click', openJournal);
$('btnBag').addEventListener('click', () => { modalOpen ? closeModals() : openBag(); });
$('btnAcc').addEventListener('click', () => { modalOpen ? closeModals() : openAccount(); });
$('btnHelp').addEventListener('click', () => { $('intro').classList.remove('hidden'); });
function openGuide() {
  cardBody.innerHTML = `<div class="cardHead" style="background:#2c5a7a">🕊️ 墨丘利的世界导览</div>
    <div class="cardTitle" style="padding-top:16px"><h3>初来乍到?三件事</h3><div class="en">A Guide to the 1001 Multiverse</div></div>
    <div class="cardDesc">
    <b>1. 看藏品赚算力币(⚡)</b>——名画、飞鸟、草木、美酒……走近按 E,每件 +2。钓鱼来钱最快(栈桥尽头)。<br><br>
    <b>2. 花钱变强</b>——千岛装备行买泳衣才好下海;酒馆、报亭都收算力币。<br><br>
    <b>3. 出海远行</b>——东滩渡口通往四十余座岛(中土、霍格沃茨走 9¾ 站台的火车;南海有但丁的炼狱山,外环是一整条「海洋文学带」:金银岛、神秘岛、无人生还岛……)。每座岛都藏着一条故事线,<b>按 J 打开图鉴看「航海日志」</b>逐一点亮,按 <b>M</b> 看海图。<br><br>
    <b>4. 抬头与起飞</b>——夜里按 <b>K</b> 观星,认全 88 星座;主岛栖石上有一只大鹏,按 <b>E</b> 乘它扶摇直上,环游诸岛。<br><br>
    <div style="background:rgba(60,140,220,.12);border:1px solid rgba(120,200,255,.35);border-radius:10px;padding:10px 12px;margin:2px 0">🧭 <b style="color:#8fd0ff">一条主线</b>:这些岛看似散落海上,其实脚下的海底隧道把它们连成一张网。<b>追查这张网的真相</b>——从潜入海底迷宫开始,集齐三条线索,你会明白这颗星球到底是什么。<b>随时按 J</b> 看「主线」当前该去哪。</div>
    <span style="font-size:12px;color:#8a7c62">另:岛上散落 24 枚星之碎片;夜里有明月与潮汐;还有一处不在任何海图上的秘境。</span></div>
    <div style="text-align:center;padding:0 0 16px"><button class="again" data-close-guide>🧭 出发!</button></div>`;
  modal.classList.remove('hidden'); modalOpen = true;
  cardBody.querySelector('[data-close-guide]')?.addEventListener('click', () => closeModals());
}
$('btnStart').addEventListener('click', () => {
  $('intro').classList.add('hidden');
  initAudio();
  try {
    if (PSTORE.getItem('w1001.guide') !== '1') {
      PSTORE.setItem('w1001.guide', '1');
      setTimeout(openGuide, 700);
    }
  } catch (e) {}
  // 今日天气播报(雨天提示渔汛)
  setTimeout(() => {
    if (WEATHER === 'rain') toast('🌧️ 今日有雨——渔汛正旺!钓鱼上钩快、售价翻倍');
    else if (WEATHER === 'fog') toast('🌫️ 今日大雾,能见度低,塞壬海域尤请谨慎');
    else toast('☀️ 今日晴,傍晚有物理正确的晚霞');
  }, 2600);
  // 节日彩蛋播报
  if (FESTIVAL) setTimeout(() => { toast(`${FESTIVAL.emoji} ${FESTIVAL.name}快乐!${FESTIVAL.flavor}`); blip(660); setTimeout(() => blip(880), 120); }, 4800);
});

/* --- 音效与音乐(与 2D 相同引擎) --- */
let actx = null, musicGain = null, musicOn = true, waveGain = null, crowdGain = null, windGain = null;
let musicZone = 'street', nextBeat = 0, beatCount = 0, melIdx = 3;
/* THEMES(分区配乐参数)→ w-config.js */
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
    // 高处风声(低通噪声,海拔越高越响;雨天常鸣)
    const src3 = actx.createBufferSource(); src3.buffer = buf; src3.loop = true;
    const lp3 = actx.createBiquadFilter(); lp3.type = 'lowpass'; lp3.frequency.value = 280;
    windGain = actx.createGain(); windGain.gain.value = 0;
    src3.connect(lp3).connect(windGain).connect(actx.destination);
    src3.start();
    // 雨声(雨天恒鸣)
    if (WEATHER === 'rain') {
      const src4 = actx.createBufferSource(); src4.buffer = buf; src4.loop = true;
      const hp3 = actx.createBiquadFilter(); hp3.type = 'highpass'; hp3.frequency.value = 1400;
      const rg = actx.createGain(); rg.gain.value = .028;
      src4.connect(hp3).connect(rg).connect(actx.destination);
      src4.start();
    }
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
scene.fog = new THREE.Fog(0x9fd4ee, 320, 1850);
const camera = new THREE.PerspectiveCamera(58, 1, .1, 2400);
let composer = null, bokehPass = null, gtaoPass = null, quality = 2;   // 画质:2 高(GTAO)/1 中/0 低(无后期)
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
  try {   // GTAO 环境光遮蔽:接触/凹陷阴影,增强落地感
    gtaoPass = new GTAOPass(scene, camera, innerWidth, innerHeight);
    gtaoPass.output = GTAOPass.OUTPUT.Default;
    if (gtaoPass.updateGtaoMaterial) gtaoPass.updateGtaoMaterial({ radius: 3.5, distanceExponent: 1, scale: 1, samples: 8, thickness: 1 });
    composer.addPass(gtaoPass);
  } catch (e) {}
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .25, .55, .85));
  try { bokehPass = new BokehPass(scene, camera, { focus: 18, aperture: .0006, maxblur: .008 }); bokehPass.enabled = false; composer.addPass(bokehPass); } catch (e) {}   // 景深:仅照片模式
  composer.addPass(new OutputPass());
  composer.addPass(new SMAAPass(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio()));   // 抗锯齿(合成后)
}
function applyQuality() { if (gtaoPass) gtaoPass.enabled = quality >= 2; }

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
/* --- 星空(夜晚可见:软圆星点 + 亮度/色温变化 + 银河带) --- */
let starField;
{
  // 软圆星点贴图(径向渐变)
  const sc0 = document.createElement('canvas'); sc0.width = sc0.height = 32;
  const sctx = sc0.getContext('2d');
  const grd = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(.35, 'rgba(255,255,255,.75)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  sctx.fillStyle = grd; sctx.fillRect(0, 0, 32, 32);
  const starTex = new THREE.CanvasTexture(sc0);
  const n = 1100, posArr = new Float32Array(n * 3), colArr = new Float32Array(n * 3);
  const r0 = mulberry32(99);
  const cWarm = new THREE.Color(0xfff0d0), cCool = new THREE.Color(0xcfe0ff), cW = new THREE.Color(0xffffff);
  for (let i = 0; i < n; i++) {
    let a, e;
    if (i < 320) {          // 银河带:聚在一条倾斜大圆附近
      a = r0() * Math.PI * 2;
      e = Math.acos(clamp((r0() - .5) * .28 + .45, 0, .95)) ;
      a += Math.sin(e * 3) * .5;
    } else {
      a = r0() * Math.PI * 2; e = Math.acos(r0() * .95);   // 上半球均匀
    }
    posArr[i * 3] = Math.sin(e) * Math.cos(a) * 1000;
    posArr[i * 3 + 1] = Math.cos(e) * 1000 + 40;
    posArr[i * 3 + 2] = Math.sin(e) * Math.sin(a) * 1000;
    const t = r0(), tint = t < .18 ? cWarm : t < .34 ? cCool : cW;
    const b = i < 320 ? .35 + r0() * .35 : .5 + r0() * .5;   // 银河带偏暗,主星偏亮
    colArr[i * 3] = tint.r * b; colArr[i * 3 + 1] = tint.g * b; colArr[i * 3 + 2] = tint.b * b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  g.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
  starField = new THREE.Points(g, new THREE.PointsMaterial({
    map: starTex, size: 4, transparent: true, opacity: 0, fog: false, sizeAttenuation: false,
    vertexColors: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(starField);
}
/* --- 星座系统:全 88 IAU 星座 → constellations.js;连线成图,夜间显现,随天旋 --- */
let constStars = null, constLines = null, constDirs = [];
{
  const R = 980, S = .045, starPos = [], linePos = [];
  const Dv = new THREE.Vector3(), Ev = new THREE.Vector3(), Uv = new THREE.Vector3(), tmp = new THREE.Vector3();
  for (const cst of CONSTELLATIONS) {
    const az = cst.az * Math.PI / 180, el = cst.el * Math.PI / 180;
    Dv.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
    Ev.set(-Math.sin(az), 0, Math.cos(az));
    Uv.set(-Math.sin(el) * Math.cos(az), Math.cos(el), -Math.sin(el) * Math.sin(az));
    let mx = 0, my = 0; for (const s of cst.stars) { mx += s[0]; my += s[1]; } mx /= cst.stars.length; my /= cst.stars.length;
    const pts = cst.stars.map(([lx, ly]) => { tmp.copy(Dv).addScaledVector(Ev, (lx - mx) * S).addScaledVector(Uv, (ly - my) * S).normalize().multiplyScalar(R); return new THREE.Vector3(tmp.x, tmp.y + 40, tmp.z); });
    for (const p of pts) starPos.push(p.x, p.y, p.z);
    for (const [i, j] of cst.lines) { const a = pts[i], b = pts[j]; linePos.push(a.x, a.y, a.z, b.x, b.y, b.z); }
    const c = new THREE.Vector3(); for (const p of pts) c.add(p); c.multiplyScalar(1 / pts.length);   // 质心=观星标签锚点
    constDirs.push({ name: cst.name, c });
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  constStars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xeaf4ff, size: 6, transparent: true, opacity: 0, fog: false, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: false }));
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
  constLines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x5f86bf, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  starField.add(constStars, constLines);
}
/* --- 观星模式(K):夜间把视野内星座名投影到屏幕;瞄准可「认得」 --- */
let starGaze = false, constLabels = [], skyLabels = null, sgY = new THREE.Vector3(0, 1, 0), sgV = new THREE.Vector3();
const constSeen = new Set((PSTORE.getItem('w1001.consts') || '').split(',').filter(Boolean).map(Number));
function recognizeConst(i) {
  if (constSeen.has(i)) return;
  constSeen.add(i);
  PSTORE.setItem('w1001.consts', [...constSeen].join(','));
  const nm = constDirs[i].name.replace(/^.+·/, '');
  toast(`🌟 认得了「${nm}」 · 星图 ${constSeen.size}/${constDirs.length}`);
  if (constSeen.size === constDirs.length) toast('🔭 集齐 88 星座!你已是星图大师');
}
{
  skyLabels = document.createElement('div'); skyLabels.id = 'skyLabels';
  Object.assign(skyLabels.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '6', display: 'none', overflow: 'hidden' });
  document.body.appendChild(skyLabels);
  for (let i = 0; i < constDirs.length; i++) {
    const el = document.createElement('div');
    Object.assign(el.style, { position: 'absolute', transform: 'translate(-50%,-50%)', font: '600 12px system-ui,sans-serif', color: '#dce8ff', textShadow: '0 0 6px #2a4a8c,0 1px 2px #000', whiteSpace: 'nowrap', opacity: '0', transition: 'opacity .25s', letterSpacing: '.5px' });
    el.textContent = '✦ ' + constDirs[i].name;
    skyLabels.appendChild(el); constLabels.push(el);
  }
}
function updateStarGaze() {
  if (!starGaze || curDA >= .32) { if (skyLabels.style.display !== 'none') skyLabels.style.display = 'none'; return; }
  if (skyLabels.style.display === 'none') skyLabels.style.display = 'block';
  const ry = starField.rotation.y, W = innerWidth, H = innerHeight, fade = Math.min(1, (.32 - curDA) / .2);
  for (let i = 0; i < constDirs.length; i++) {
    sgV.copy(constDirs[i].c).applyAxisAngle(sgY, ry).project(camera);
    const on = sgV.z < 1 && Math.abs(sgV.x) < 1 && sgV.y > -.9 && sgV.y < 1;
    const lab = constLabels[i];
    if (!on) { if (lab.style.opacity !== '0') lab.style.opacity = '0'; continue; }
    lab.style.left = ((sgV.x * .5 + .5) * W) + 'px';
    lab.style.top = ((-sgV.y * .5 + .5) * H) + 'px';
    const edge = Math.min(1, (1 - Math.abs(sgV.x)) * 3, (1 - Math.abs(sgV.y)) * 3);   // 近屏幕边缘淡出
    const known = constSeen.has(i);
    lab.style.opacity = (fade * edge * (known ? 1 : .85)).toFixed(2);
    if (known && lab.style.color !== 'rgb(255, 231, 153)') { lab.style.color = '#ffe799'; lab.textContent = '★ ' + constDirs[i].name; }
    if (!known && Math.abs(sgV.x) < .42 && sgV.y > -.55 && edge > .95) recognizeConst(i);   // 瞄准中央区即认得
  }
}
/* --- 天气(按日期随机:晴/雨/雾) --- */
const WEATHER = (() => {
  const r0 = mulberry32([...new Date().toISOString().slice(0, 10)].reduce((a, c2) => (a * 37 + c2.charCodeAt(0)) | 0, 3))();
  return r0 < .62 ? 'clear' : (r0 < .85 ? 'rain' : 'fog');
})();
/* 真实月相近似:距 2000-01-06 新月的天数 mod 29.53,满月≈14.77 天 */
const FULLMOON = (() => {
  const days = (Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
  const phase = ((days % 29.53059) + 29.53059) % 29.53059;
  return Math.abs(phase - 14.7653) < 1.4;
})();
/* 节日彩蛋:按真实日期触发。农历节日用 2026-2028 硬表;可 ?fest=key 强制预览 */
const FEST_DEFS = {
  spring:     { name: '春节', emoji: '🧧', color: 0xd94040, hue: 'red',   flavor: '新春大吉!花果山猴群闹春,广场挂起红灯笼' },
  lantern:    { name: '元宵节', emoji: '🏮', color: 0xff8a3c, hue: 'red',   flavor: '正月十五闹元宵——大观园的灯谜,巴格达的花灯' },
  dragon:     { name: '端午节', emoji: '🐉', color: 0x2e8b57, hue: 'green', flavor: '端午安康!梁山泊龙舟竞渡,粽叶飘香' },
  midautumn:  { name: '中秋节', emoji: '🌕', color: 0xffe08a, hue: 'gold',  flavor: '海上生明月——今夜月最圆,潮最盛' },
  christmas:  { name: '圣诞节', emoji: '🎄', color: 0xffffff, hue: 'snow',  flavor: '雪落多元宇宙,愿你收到想要的礼物' },
  halloween:  { name: '万圣节', emoji: '🎃', color: 0xe8963c, hue: 'purple', flavor: '兰若寺今夜格外热闹,聂小倩说她也想要糖' },
  newyear:    { name: '元旦', emoji: '🎉', color: 0xffd76a, hue: 'gold',  flavor: '新的一年,新的一千零一种美好' },
  children:   { name: '儿童节', emoji: '🎈', color: 0x66c2ff, hue: 'gold',  flavor: '今天所有人都是小孩——爱丽丝请你喝下午茶' },
};
const FEST_BY_YMD = {
  '2026-02-17': 'spring', '2027-02-06': 'spring', '2028-01-26': 'spring',
  '2026-03-03': 'lantern', '2027-02-20': 'lantern', '2028-02-09': 'lantern',
  '2026-06-19': 'dragon', '2027-06-09': 'dragon', '2028-05-28': 'dragon',
  '2026-09-25': 'midautumn', '2027-09-15': 'midautumn', '2028-10-03': 'midautumn',
};
const FEST_BY_MD = { '12-24': 'christmas', '12-25': 'christmas', '10-31': 'halloween', '01-01': 'newyear', '06-01': 'children' };
const FESTIVAL = (() => {
  const forced = new URLSearchParams(location.search).get('fest');
  if (forced && FEST_DEFS[forced]) return Object.assign({ key: forced }, FEST_DEFS[forced]);
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10);
  const key = FEST_BY_YMD[ymd] || FEST_BY_MD[ymd.slice(5)];
  return key ? Object.assign({ key }, FEST_DEFS[key]) : null;
})();
const MOON_FULL = FULLMOON || (FESTIVAL && FESTIVAL.key === 'midautumn');   // 中秋强制满月
let rainPts = null;
if (WEATHER === 'rain') {
  const N4 = 480, arr2 = new Float32Array(N4 * 3);
  const rr2 = mulberry32(44);
  for (let i = 0; i < N4; i++) {
    arr2[i * 3] = (rr2() - .5) * 110;
    arr2[i * 3 + 1] = rr2() * 60;
    arr2[i * 3 + 2] = (rr2() - .5) * 110;
  }
  const g4 = new THREE.BufferGeometry();
  g4.setAttribute('position', new THREE.BufferAttribute(arr2, 3));
  rainPts = new THREE.Points(g4, new THREE.PointsMaterial({ color: 0x9ab8d8, size: 1.5, transparent: true, opacity: .55, sizeAttenuation: false }));
  scene.add(rainPts);
}
if (WEATHER === 'fog') { scene.fog.near = 110; scene.fog.far = 520; }
/* --- 节日粒子(雪 / 花瓣 / 星火,跟随玩家) --- */
let festPts = null;
if (FESTIVAL) {
  const N5 = 420, arr3 = new Float32Array(N5 * 3);
  const rr3 = mulberry32(88);
  for (let i = 0; i < N5; i++) { arr3[i * 3] = (rr3() - .5) * 130; arr3[i * 3 + 1] = rr3() * 70; arr3[i * 3 + 2] = (rr3() - .5) * 130; }
  const g5 = new THREE.BufferGeometry();
  g5.setAttribute('position', new THREE.BufferAttribute(arr3, 3));
  const snowy = FESTIVAL.hue === 'snow';
  festPts = new THREE.Points(g5, new THREE.PointsMaterial({ color: FESTIVAL.color, size: snowy ? 2.4 : 2, transparent: true, opacity: snowy ? .85 : .7, sizeAttenuation: false }));
  festPts.userData = { fall: snowy ? 10 : 16, sway: snowy ? 1 : .3 };
  scene.add(festPts);
}
/* --- 月亮(夜间升起,月光洒海) --- */
let moonMesh = null, moonGlow = null, moonLight = null, tideY = 0, springTideToldT = 0;
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
  const wxMul = WEATHER === 'rain' ? .55 : (WEATHER === 'fog' ? .75 : 1);
  sun.intensity = (.06 + 2.7 * da) * wxMul;
  hemi.intensity = (.16 + .62 * da) * (WEATHER === 'clear' ? 1 : .85);
  if (WEATHER === 'rain') skyCol.lerp(new THREE.Color(0x6a7480), .4);
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
  moonGlow.material.opacity = night * (MOON_FULL ? .34 : .18);   // 满月更亮
  moonLight.intensity = night * (MOON_FULL ? .75 : .5);
  if (MOON_FULL && !springTideToldT && night > .4) { springTideToldT = 1; toast('🌕 满月大潮之夜——海水涨得比平日更高'); }
  moonLight.position.copy(player.position).addScaledVector(moonDirN, 300);
  moonLight.target.position.copy(player.position);
  /* 潮汐:月升潮涨 */
  tideY = night * mElev * .9 * (MOON_FULL ? 1.7 : 1);   // 满月大潮:潮位更高
  if (oceanWater) {
    oceanWater.position.y = .15 + tideY;
    oceanWater.material.uniforms.sunDirection.value.copy(night > .5 ? moonDirN : sunDirN);
    oceanWater.material.uniforms.sunColor.value.setHex(night > .5 ? 0xbdd8ff : 0xffffff);
  }
  if (mobileWater) mobileWater.position.y = tideY;
  starField.material.opacity = night * (.9 + Math.sin(t * 1.7) * .06);   // 整体微闪
  starField.rotation.y = t * .006;                                        // 缓慢天旋
  if (constStars) { constStars.material.opacity = night * .95; constLines.material.opacity = night * .32; }   // 星座随夜显现
  if (fireLight) fireLight.intensity = (1 - da) * 55 + Math.sin(t * 9) * 5 * (1 - da);
  if (lantern) lantern.intensity = (1 - da) * 16;   // 夜间提灯
  if (lightLamp) lightLamp.intensity = (1 - da) * 90;   // 灯塔
  for (const L2 of nightLamps) L2.intensity = (1 - da) * L2.userData.pow;   // 各岛夜灯
  if (beacon) { beacon.material.opacity = (1 - da) * .32; beacon.rotation.y = t * .9; }
  return da;
}

/* --- 地形网格 --- */
const TER = 4000, SEG = MOBILE ? 190 : 300;
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
  const cGrassDry = new THREE.Color(0x9caf5e);   // 高处/向阳的干草色
  // 第一遍:每顶点只算一次 height(),存高度;坡度/曲率下一遍从网格邻居取(零额外 height 调用)
  const W = SEG + 1, HT = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) { const h = height(pos.getX(i), pos.getZ(i)); pos.setY(i, h); HT[i] = h; }
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = HT[i];
    const gx = i % W, gz = (i / W) | 0;
    const hR = HT[gx < W - 1 ? i + 1 : i], hL = HT[gx > 0 ? i - 1 : i];
    const hF = HT[gz < W - 1 ? i + W : i], hB = HT[gz > 0 ? i - W : i];
    const sl = (Math.abs(hR - h) + Math.abs(hF - h)) * .28;  // 坡度(网格间距约 10.7,缩放到原 ±3 尺度)
    const lap = (hR + hL + hF + hB) * .25 - h;               // 曲率:>0 凹(汇水),<0 凸(山脊)
    const gj = fbm(x * .05, z * .05);                        // 草色/边界抖动
    const biome = fbm(x * .0016, z * .0016);                 // 大尺度生物群系:大片区域暖/冷倾向
    const grass = (gj > .52 ? cGrass1 : cGrass2).clone().offsetHSL((biome - .5) * .05, (biome - .5) * .14, (biome - .5) * .05);
    let c;
    if (Math.hypot(x - VOL.x, z - VOL.z) < 82 && h > 1) {    // 魔多焦土
      c = fbm(x * .07, z * .07) > .5 ? new THREE.Color(0x4a4038) : new THREE.Color(0x3a322c);
    } else if (h < -2) {
      c = cSea.clone();
    } else {
      // —— splat 风:高度平滑混合 沙→草→岩→雪(边界带噪声抖动) ——
      const jit = (gj - .5) * 1.6;
      c = cSand.clone().lerp(grass.lerp(cGrassDry, smooth01(clamp((h - 12) / 16, 0, 1)) * .4), smooth01(clamp((h - 1) / 2.6, 0, 1)));
      c.lerp(cRock, smooth01(clamp((h - 22 + jit) / 8, 0, 1)));
      c.lerp(cSnow, smooth01(clamp((h - 33 + jit) / 5, 0, 1)));
      // 坡度露岩(碎石带)
      c.lerp(cRock, clamp((sl - 2 + jit * .8) / 3.2, 0, 1) * .75);
      // —— 侵蚀观感:曲率明暗 ——
      if (lap > .12) c.multiplyScalar(clamp(1 - lap * .22, .62, 1));      // 凹处汇水/背阴 → 压暗成沟
      else if (lap < -.12) c.lerp(cRock, clamp(-lap * .32, 0, .5));       // 凸处山脊/棱线 → 露岩
      // 泥土小路
      const pd = pathDist(x, z);
      if (pd < 4.2) c = cPath.clone();
      else if (pd < 7.5) c.lerp(cPath, (7.5 - pd) / 3.3 * .5);
      // 鲸嘴线 / 眼圈
      if (h > -1 && mouthDist(x, z) < 5) c.lerp(cMouth, .8);
      else if (h > 0 && Math.abs(Math.hypot(x - WHALE_EYE.x, z - WHALE_EYE.z) - WHALE_EYE.r) < 5) c.lerp(cMouth, .8);
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
  oceanWater = new Water(new THREE.PlaneGeometry(5200, 5200), {
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
  waterGeo = new THREE.PlaneGeometry(5200, 5200, 72, 72);
  waterGeo.rotateX(-Math.PI / 2);
  mobileWater = new THREE.Mesh(waterGeo, new THREE.MeshPhongMaterial({
    color: 0x2e7fb4, transparent: true, opacity: .82, shininess: 120, specular: 0x88c9ee,
  }));
  mobileWater.position.y = 0; scene.add(mobileWater);
}
/* --- 云(多团絮状、底部偏灰、各自漂移) --- */
const clouds = [];
{
  const rnd = mulberry32(11);
  // 蓬松云形贴图:多团柔和白斑叠成不规则云廓(底平顶鼓),Sprite 单张即像一朵云
  const CW = 200, CH = 120, cc = document.createElement('canvas'); cc.width = CW; cc.height = CH; const cx = cc.getContext('2d');
  const blob = (x, y, r, a) => { const g = cx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,' + a + ')'); g.addColorStop(.7, 'rgba(255,255,255,' + (a * .42) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)'); cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.fill(); };
  for (let i = 0; i < 7; i++) blob(28 + i * 24, 84, 32, .5);        // 底部一排(平底)
  for (let i = 0; i < 5; i++) blob(42 + i * 29, 64, 40, .5);        // 中层
  blob(66, 50, 30, .46); blob(108, 44, 37, .5); blob(150, 52, 28, .46);   // 顶部鼓包
  const cloudTex = new THREE.CanvasTexture(cc);
  const NC = MOBILE ? 14 : 22;
  for (let i = 0; i < NC; i++) {
    const grp = new THREE.Group();
    const tp = rnd();   // 云型:<.5 积云(少而大) / <.82 层云(扁平铺展) / 其余 卷云(高·稀薄)
    let puffs, size, spX, spY, spZ, alt, op, flat;
    if (tp < .5) { puffs = 3 + (rnd() * 3 | 0); size = 44 + rnd() * 26; spX = size * .9; spY = size * .22; spZ = size * .7; alt = 150 + rnd() * 70; op = .92; flat = .62; }
    else if (tp < .82) { puffs = 4 + (rnd() * 3 | 0); size = 54 + rnd() * 24; spX = size * 1.7; spY = size * .12; spZ = size * 1.1; alt = 120 + rnd() * 40; op = .82; flat = .4; }
    else { puffs = 3 + (rnd() * 3 | 0); size = 30 + rnd() * 16; spX = size * 2.6; spY = size * .16; spZ = size * .5; alt = 245 + rnd() * 90; op = .5; flat = .4; }
    for (let j = 0; j < puffs; j++) {
      const py = (rnd() - .5) * spY, shade = py < 0 ? .86 : 1;   // 底部略压暗 → 体积感
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: op, depthWrite: false, fog: true, color: new THREE.Color(shade, shade * .99, shade * 1.03) }));
      const s = size * (.8 + rnd() * .5); sp.scale.set(s, s * flat, 1);
      sp.position.set((rnd() - .5) * spX, py, (rnd() - .5) * spZ);
      grp.add(sp);
    }
    grp.position.set(rnd() * 3600 - 1800, alt, rnd() * 3600 - 1800);
    grp.userData = { sp: .5 + rnd() * 1.5, ph: rnd() * 6.28 };
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
  const item = (cat === 'lore' || cat === 'gate' || cat === 'dive' || ['bar', 'sign', 'news', 'shop', 'ferry', 'door', 'camera', 'lamp', 'ring', 'crater', 'hole', 'eye', 'train', 'castle', 'hoops', 'hut', 'inn', 'chowder', 'doubloon', 'stadium', 'pitch', 'scalper'].includes(type)) ? null : pickers[cat]();
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
/* 程序化法线贴图:给岩石/木头表面加起伏细节(桌面 PBR)*/
function makeNoiseNormal(size, freq, strength) {
  const c = document.createElement('canvas'); c.width = c.height = size; const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size), d = img.data, H = (x, y) => fbm(x * freq, y * freq);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let nx = (H(x - 1, y) - H(x + 1, y)) * strength, ny = (H(x, y - 1) - H(x, y + 1)) * strength, nz = 1;
    const inv = 1 / Math.hypot(nx, ny, nz); nx *= inv; ny *= inv; nz *= inv;
    const o = (y * size + x) * 4; d[o] = (nx * .5 + .5) * 255; d[o + 1] = (ny * .5 + .5) * 255; d[o + 2] = (nz * .5 + .5) * 255; d[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; return tex;
}
if (!MOBILE) {
  const rockNrm = makeNoiseNormal(128, .07, 2.4); rockNrm.repeat.set(3, 3);
  const woodNrm = makeNoiseNormal(128, .05, 1.6); woodNrm.repeat.set(2, 4);
  M.stone.normalMap = rockNrm; M.stone.normalScale.set(.7, .7); M.stone.roughness = .95;
  M.wood.normalMap = woodNrm; M.wood.normalScale.set(.45, .45);
  M.woodDark.normalMap = woodNrm; M.woodDark.normalScale.set(.45, .45);
  M.stone.needsUpdate = M.wood.needsUpdate = M.woodDark.needsUpdate = true;
}
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
  const tr = cyl(.42 * scale, .7 * scale, 5 * scale, M.wood); tr.position.y = 2.5 * scale; grp.add(tr);
  // 三团树冠 + 逐树色相微变(暖/冷绿)
  const tv = (hash2(x, z) - .5) * .12;
  const g1 = new THREE.Color(0x4f9448).offsetHSL(tv, 0, tv * .3);
  const g2 = new THREE.Color(0x5fae52).offsetHSL(tv, 0, tv * .3);
  const g3 = new THREE.Color(0x3e7a3a).offsetHSL(tv, 0, tv * .3);
  const c0 = new THREE.Mesh(new THREE.IcosahedronGeometry(3.7 * scale, 0), lam(g3.getHex())); c0.position.y = 5.4 * scale; c0.scale.y = .82; grp.add(c0);
  const c1 = new THREE.Mesh(new THREE.IcosahedronGeometry(3.2 * scale, 0), lam(g1.getHex())); c1.position.set(-.8 * scale, 6.9 * scale, .5 * scale); grp.add(c1);
  const c2 = new THREE.Mesh(new THREE.IcosahedronGeometry(2.3 * scale, 0), lam(g2.getHex())); c2.position.set(1.4 * scale, 8.1 * scale, .6 * scale); grp.add(c2);
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
/* --- 星门(广场西侧) --- */
{
  const sgx = -42, sgz = 38, sgh = height(-42, 38);
  const ped2 = cyl(3.4, 4, 1.2, M.stone); ped2.position.set(sgx, sgh + .6, sgz); scene.add(ped2);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.2, .45, 10, 28),
    MOBILE ? new THREE.MeshLambertMaterial({ color: 0x8a7ab0 }) : new THREE.MeshStandardMaterial({ color: 0x8a7ab0, roughness: .35, metalness: .7 }));
  ring2.position.set(sgx, sgh + 4.6, sgz); scene.add(ring2);
  const glow2 = new THREE.Mesh(new THREE.CircleGeometry(2.7, 24),
    new THREE.MeshBasicMaterial({ color: 0x9a8ae0, transparent: true, opacity: .18, side: THREE.DoubleSide }));
  glow2.position.set(sgx, sgh + 4.6, sgz); scene.add(glow2);
  cirObs.push({ x: sgx, z: sgz, r: 3.8 });
  addSpot(sgx, sgz + 5.4, 'gate', 'gate', { r: 7.5 });
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
updateTitleHUD();
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
const treeWindMats = [];
{
  // 散布树:实例化(3 次绘制取代 ~180 个网格)
  const treePts = [];
  let guard = 0;
  while (treePts.length < 60 && guard++ < 1500) {
    const x = rnd() * 900 - 450, z = rnd() * 900 - 450;
    const h = height(x, z);
    if (h < 3 || h > 26) continue;
    if (ZONES3D.some(zn => Math.hypot(x - zn.x, z - zn.z) < zn.r + 8)) continue;
    treePts.push([x, z, h, .8 + rnd() * .7]);
    cirObs.push({ x, z, r: 1 });
  }
  {
    const n = treePts.length;
    const trunkI = new THREE.InstancedMesh(new THREE.CylinderGeometry(.42, .7, 5), M.wood, n);
    const windMat = (ph) => {   // 树冠风摆:按实例世界坐标错相轻摇(零 CPU,同草地方案)
      const m = lam(0xffffff);
      m.onBeforeCompile = sh => {
        sh.uniforms.uTime = { value: 0 };
        sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
          `#include <begin_vertex>
           #ifdef USE_INSTANCING
             vec3 iP = instanceMatrix[3].xyz;
           #else
             vec3 iP = vec3(0.0);
           #endif
           float wv = sin(uTime * 1.15 + iP.x * .14 + iP.z * .1 + ${ph.toFixed(2)}) * .17;
           transformed.x += wv; transformed.z += wv * .6;`);
        m.userData.shader = sh;
      };
      treeWindMats.push(m); return m;
    };
    const canoLo = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(3.7, 0), windMat(0.0), n);
    const canoAI = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(3.2, 0), windMat(1.3), n);
    const canoBI = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.3, 0), windMat(2.6), n);
    const m4t = new THREE.Matrix4(), qt = new THREE.Quaternion(), st = new THREE.Vector3(), pt = new THREE.Vector3();
    const gg1 = new THREE.Color(), gg2 = new THREE.Color(), gg3 = new THREE.Color();
    treePts.forEach(([x, z, h, sc], i) => {
      st.setScalar(sc);
      m4t.compose(pt.set(x, h + 2.5 * sc, z), qt, st); trunkI.setMatrixAt(i, m4t);
      st.set(sc, sc * .82, sc);
      m4t.compose(pt.set(x, h + 5.4 * sc, z), qt, st); canoLo.setMatrixAt(i, m4t);
      st.setScalar(sc);
      m4t.compose(pt.set(x - .8 * sc, h + 6.9 * sc, z + .5 * sc), qt, st); canoAI.setMatrixAt(i, m4t);
      m4t.compose(pt.set(x + 1.4 * sc, h + 8.1 * sc, z + .6 * sc), qt, st); canoBI.setMatrixAt(i, m4t);
      const tv = (hash2(x, z) - .5) * .13;   // 逐树色相微变
      canoLo.setColorAt(i, gg3.setHex(0x3e7a3a).offsetHSL(tv, 0, tv * .3));
      canoAI.setColorAt(i, gg1.setHex(0x4f9448).offsetHSL(tv, 0, tv * .3));
      canoBI.setColorAt(i, gg2.setHex(0x5fae52).offsetHSL(tv, 0, tv * .3));
    });
    [trunkI, canoLo, canoAI, canoBI].forEach(im => { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; scene.add(im); });
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
  const wide = opts.wide || 1, tall = opts.tall || 1, skin = 0xf2c9a0;
  const body = cyl(.44 * wide, .54 * wide, 1.15 * tall, lam(bodyCol)); body.position.y = 1.42 * tall; g.add(body);   // children[0](供 bob/换色沿用)
  const limbs = {};
  for (const s of [-1, 1]) {   // 腿:髋关节可摆
    const hip = new THREE.Group(); hip.position.set(.2 * wide * s, .82 * tall, 0);
    const leg = cyl(.15 * wide, .17 * wide, .82 * tall, lam(bodyCol)); leg.position.y = -.41 * tall; hip.add(leg);
    const foot = box(.22 * wide, .14, .42, M.woodDark); foot.position.set(0, -.82 * tall + .05, .12); hip.add(foot);
    g.add(hip); limbs[s < 0 ? 'legL' : 'legR'] = hip;
  }
  for (const s of [-1, 1]) {   // 臂:肩关节可摆
    const sh = new THREE.Group(); sh.position.set(.52 * wide * s, 1.78 * tall, 0);
    const arm = cyl(.12 * wide, .14 * wide, .82 * tall, lam(bodyCol)); arm.position.y = -.41 * tall; sh.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.13, 6, 5), lam(skin)); hand.position.y = -.82 * tall; sh.add(hand);
    g.add(sh); limbs[s < 0 ? 'armL' : 'armR'] = sh;
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(.48, 12, 9), lam(skin)); head.position.y = 2.28 * tall; g.add(head);
  for (const s of [-1, 1]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(.075, 6, 5), lam(0x222222)); eye.position.set(.16 * s, 2.33 * tall, .42); g.add(eye); }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(.06, 5, 4), lam(0xe0b088)); nose.position.set(0, 2.24 * tall, .47); g.add(nose);
  if (opts.hat === 'cone') { const h = new THREE.Mesh(new THREE.ConeGeometry(.55, .74, 8), lam(hatCol)); h.position.y = 2.92 * tall; g.add(h); }
  else { const h = new THREE.Mesh(new THREE.SphereGeometry(.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), lam(hatCol)); h.position.y = 2.44 * tall; g.add(h); }
  if (opts.cane) { const c1 = cyl(.05, .05, 1.9, M.woodDark); c1.position.set(.72, .95, .2); g.add(c1); }
  g.userData.limbs = limbs;
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });   // NPC 投影落地
  return g;
}
/* 四肢摆动:走路时手脚交替、静止时轻微呼吸摆 */
function animLimbs(g, phase, amt) {
  const L = g.userData.limbs; if (!L) return;
  const s = Math.sin(phase) * amt;
  L.legL.rotation.x = s; L.legR.rotation.x = -s;
  L.armL.rotation.x = -s * .8; L.armR.rotation.x = s * .8;
}
/* 游泳姿态:配合俯身,打腿 + 交替划水 */
function animSwim(g, phase) {
  const L = g.userData.limbs; if (!L) return;
  const k = Math.sin(phase * 2);
  L.legL.rotation.x = k * .45; L.legR.rotation.x = -k * .45;
  L.armL.rotation.x = -1.4 + Math.sin(phase) * 1.3;
  L.armR.rotation.x = -1.4 + Math.sin(phase + Math.PI) * 1.3;
}
const NPC_HUB3 = [14, 24];
const allNpcs = [];
function addNpc(cfg) {
  const g = makePerson(cfg.body, cfg.hat ?? 0xf5efdc, cfg.opts || {});
  const y = cfg.y != null ? cfg.y : Math.max(height(cfg.x, cfg.z), 0);
  g.position.set(cfg.x, y, cfg.z);
  if (cfg.faceUp) g.rotation.x = -0.34;   // 仰望姿态
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
  addNpc({ x: 300, z: -290, name: '康德', body: 0x3a4a6a, hat: 0x2a3a52, opts: { cane: true }, faceUp: true, face: '🔭',
    lines: ['有两样东西,愈是持久地思索,愈使内心充满敬畏:头上的星空,和心中的道德律。',
      '这漫天星座,今夜比往常更清晰。', '我几乎没离开过柯尼斯堡——可星空带我去过任何地方。'],
    topics: [
      { q: '你为何仰望星空?', a: '星空让我看见自己的渺小;道德律又让我重获尊严。二者都在我"之上",也都在我"之内"。' },
      { q: '什么是启蒙?', a: 'Sapere aude——要有勇气运用你自己的理性。这就是启蒙的格言。' },
      { q: '人应当如何行动?', a: '要只按照你同时愿意它成为普遍法则的准则去行动。' },
      { q: '认得那些星座吗?', a: '(抬手一指)那是猎户,那是北斗七星……名字是人给的,秩序却是它们自己的。' },
    ] });
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
    c.strokeStyle = '#ffffff'; c.fillStyle = '#ffffff'; c.lineWidth = 10;
    c.strokeRect(20, 20, 1050, 680);                                   // 边线与底线
    c.beginPath(); c.moveTo(545, 20); c.lineTo(545, 700); c.stroke();  // 中线
    c.beginPath(); c.arc(545, 360, 91.5, 0, 7); c.stroke();            // 中圈 9.15m
    c.beginPath(); c.arc(545, 360, 8, 0, 7); c.fill();                 // 中点
    for (const [x0, dir] of [[20, 1], [1070, -1]]) {
      c.strokeRect(dir > 0 ? x0 : x0 - 165, 158.4, 165, 403.2);        // 罚球区 16.5m
      c.strokeRect(dir > 0 ? x0 : x0 - 55, 268.4, 55, 183.2);          // 球门区 5.5m
      const px5 = x0 + dir * 110;
      c.beginPath(); c.arc(px5, 360, 8, 0, 7); c.fill();               // 点球点 11m
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
    ptex.anisotropy = renderer.capabilities.getMaxAnisotropy();   // 掠射角下画线不糊
    const pitch = new THREE.Mesh(new THREE.PlaneGeometry(44, 29), new THREE.MeshLambertMaterial({ map: ptex }));
    pitch.rotation.x = -Math.PI / 2; pitch.position.set(cx3, baseH + .12, cz3); scene.add(pitch);
    // —— 场地画线改为几何白线(浮于草皮上,任何视角清晰) ——
    {
      const lm = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const LY = baseH + .18, U = 42.39 / 105;   // 单位换算:0.4037u/m
      const lineBox = (len, wid, lx, lz, rotY = 0) => {
        const b2 = new THREE.Mesh(new THREE.BoxGeometry(len, .05, wid), lm);
        b2.position.set(cx3 + lx, LY, cz3 + lz); b2.rotation.y = rotY; scene.add(b2);
      };
      const W2 = .26, HL = 105 * U / 2, HW = 68 * U / 2;   // 半长 21.2 半宽 13.7
      lineBox(HL * 2 + W2, W2, 0, -HW); lineBox(HL * 2 + W2, W2, 0, HW);   // 边线
      lineBox(W2, HW * 2, -HL, 0); lineBox(W2, HW * 2, HL, 0);             // 底线
      lineBox(W2, HW * 2, 0, 0);                                           // 中线
      const flatRing = (r0, r1, lx, lz, th0, thL) => {
        const g2 = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 48, 1, th0, thL), lm);
        g2.rotation.x = -Math.PI / 2; g2.position.set(cx3 + lx, LY, cz3 + lz); scene.add(g2);
      };
      flatRing(9.15 * U - .13, 9.15 * U + .13, 0, 0, 0, Math.PI * 2);      // 中圈
      const dot = (lx, lz) => {
        const d2 = new THREE.Mesh(new THREE.CircleGeometry(.2, 12), lm);
        d2.rotation.x = -Math.PI / 2; d2.position.set(cx3 + lx, LY, cz3 + lz); scene.add(d2);
      };
      dot(0, 0);
      for (const sgn of [-1, 1]) {
        const pd = 16.5 * U, pw = 40.32 * U / 2, gd = 5.5 * U, gw = 18.32 * U / 2, ps = 11 * U;
        lineBox(W2, pw * 2, sgn * (HL - pd), 0);                            // 罚球区前沿
        lineBox(pd, W2, sgn * (HL - pd / 2), -pw); lineBox(pd, W2, sgn * (HL - pd / 2), pw);
        lineBox(W2, gw * 2, sgn * (HL - gd), 0);                            // 球门区
        lineBox(gd, W2, sgn * (HL - gd / 2), -gw); lineBox(gd, W2, sgn * (HL - gd / 2), gw);
        dot(sgn * (HL - ps), 0);                                            // 点球点
        const arcHalf = Math.acos((pd - ps) / (9.15 * U));                   // 罚球弧半角 ≈53°
        flatRing(9.15 * U - .13, 9.15 * U + .13, sgn * (HL - ps), 0,
          sgn > 0 ? Math.PI - arcHalf : -arcHalf, arcHalf * 2);             // 罚球弧
      }
    }
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
      topNet.rotation.x = -Math.PI / 2;   // 水平顶网:x 向纵深 1.5,z 向跨度 8
      topNet.position.set(gx2 + sgn * .7, baseH + 3.42, cz3); scene.add(topNet);
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
  addNpc({ x: cx3 + 8, z: cz3 + 57, name: '黄牛哥', body: 0x4a4438, hat: 0x2a2620,
    lines: ['票!要票吗?内场票,弗爵爷身后第一排!', '(左右张望)德比日行情,懂的都懂。', '什么?南门免费入场?嘘——别嚷嚷!'] });
  addSpot(cx3 + 11, cz3 + 58, 'spt', 'scalper', { r: 6.5 });
}
/* ================= 六新岛:山海经/桃花源/一千零一夜/海底两万里/B-612/侏罗纪 ================= */
let nautilusHull = null, nemFishSchool = null, trexGrp = null, brachioNeck = null;
const raptorGrps = [], nightLamps = [];
let ghostFire = null; const laolaoEyes = [];   // 兰若寺:鬼火 / 姥姥红眼
/* —— 山海经 · 异兽之野 —— */
{
  const gx = SHJ.x, gz = SHJ.z;
  for (const sgn of [-1, 1]) {   // 石阙
    const pil = box(3, 12, 3, M.stone); pil.position.set(gx + sgn * 8, height(gx + sgn * 8, gz + 60) + 6, gz + 60); scene.add(pil);
    cirObs.push({ x: gx + sgn * 8, z: gz + 60, r: 2.4 });
  }
  const lintel = box(22, 2.4, 3.4, M.stone); lintel.position.set(gx, height(gx, gz + 60) + 13, gz + 60); scene.add(lintel);
  const shSign = makeSign('山海经 · 异兽之野', 7.5, '#20262e', '#c9d8a0');
  shSign.position.set(gx, height(gx, gz + 60) + 15.6, gz + 60); scene.add(shSign);
  // 九尾狐
  {
    const fx = gx - 45, fz = gz + 20, fh = height(fx, fz);
    const g = new THREE.Group(); g.position.set(fx, fh, fz);
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8), lam(0xe07b28)); body.scale.set(1.5, 1, 1); body.position.y = 1.4; g.add(body);
    const head = new THREE.Mesh(new THREE.ConeGeometry(.8, 1.6, 8), lam(0xe07b28)); head.rotation.z = -Math.PI / 2; head.position.set(2.4, 1.8, 0); g.add(head);
    for (let i = 0; i < 9; i++) {
      const tail = new THREE.Mesh(new THREE.ConeGeometry(.3, 3.4, 6), lam(i % 2 ? 0xf2a45e : 0xe07b28));
      tail.position.set(-2, 2, 0); tail.rotation.z = .9; tail.rotation.x = (i - 4) * .3; g.add(tail);
    }
    scene.add(g); cirObs.push({ x: fx, z: fz, r: 2.6 });
    addSpot(fx, fz + 4, 'lore', 'jiuwei');
  }
  // 烛龙(峰顶赤蛇)
  {
    const px6 = gx, pz6 = gz - 72, ph6 = height(px6, pz6);
    for (let i = 0; i < 7; i++) {
      const seg = new THREE.Mesh(new THREE.SphereGeometry(1.6 - i * .12, 10, 8), lam(0xb03a2e));
      const a = i * .8;
      seg.position.set(px6 + Math.cos(a) * (4 - i * .3), ph6 + 1.2 + i * 1.1, pz6 + Math.sin(a) * (4 - i * .3));
      scene.add(seg);
    }
    const zHead = new THREE.Mesh(new THREE.SphereGeometry(1.5, 10, 8), lam(0xc84a3a)); zHead.position.set(px6, ph6 + 9.4, pz6); scene.add(zHead);
    const zEye = new THREE.Mesh(new THREE.SphereGeometry(.5, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd76a }));
    zEye.position.set(px6, ph6 + 9.7, pz6 + 1.3); scene.add(zEye);
    addSpot(px6, pz6 + 6, 'lore', 'zhulong', { r: 8 });
  }
  // 饕餮 / 毕方 / 帝江 / 白泽
  {
    const tx = gx + 42, tz = gz - 8, th4 = height(tx, tz);
    const tHead = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 8), lam(0x4a3626)); tHead.scale.set(1.2, 1, 1.1); tHead.position.set(tx, th4 + 2, tz); scene.add(tHead);
    for (const sgn of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(.4, 2, 6), lam(0xd9b26a)); horn.position.set(tx + sgn * 1.6, th4 + 4.2, tz); horn.rotation.z = -sgn * .5; scene.add(horn);
    }
    cirObs.push({ x: tx, z: tz, r: 2.8 }); addSpot(tx, tz + 4.4, 'lore', 'taotie');
    const bx2 = gx + 20, bz2 = gz + 34, bh4 = height(bx2, bz2);
    const bLeg = cyl(.12, .12, 2.4, lam(0xc84a3a)); bLeg.position.set(bx2, bh4 + 1.2, bz2); scene.add(bLeg);
    const bBody = new THREE.Mesh(new THREE.SphereGeometry(.9, 9, 7), lam(0x3a6a7a)); bBody.scale.set(1, 1.2, 1); bBody.position.set(bx2, bh4 + 3, bz2); scene.add(bBody);
    const bBeak = new THREE.Mesh(new THREE.ConeGeometry(.18, .9, 6), M.white); bBeak.rotation.z = -Math.PI / 2; bBeak.position.set(bx2 + .9, bh4 + 3.2, bz2); scene.add(bBeak);
    addSpot(bx2, bz2 + 3.4, 'lore', 'bifang');
    const dx2 = gx - 20, dz2 = gz - 30, dh4 = height(dx2, dz2);
    const dBody = new THREE.Mesh(new THREE.SphereGeometry(1.8, 10, 8), lam(0xe8c84a)); dBody.position.set(dx2, dh4 + 1.9, dz2); scene.add(dBody);
    for (let i = 0; i < 6; i++) {
      const leg = cyl(.14, .14, 1.4, lam(0xc8a43a)); leg.position.set(dx2 + Math.cos(i) * 1.4, dh4 + .6, dz2 + Math.sin(i) * 1.4); scene.add(leg);
    }
    for (let i = 0; i < 4; i++) {
      const wing = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .7), new THREE.MeshLambertMaterial({ color: 0xf2dc8a, side: THREE.DoubleSide }));
      wing.position.set(dx2 + Math.cos(i * 1.57 + .78) * 1.9, dh4 + 2.6, dz2 + Math.sin(i * 1.57 + .78) * 1.9);
      wing.rotation.y = i * 1.57; scene.add(wing);
    }
    cirObs.push({ x: dx2, z: dz2, r: 2.2 }); addSpot(dx2, dz2 + 4, 'lore', 'dijiang');
    const wx2 = gx + 8, wz2 = gz - 52, wh4 = height(wx2, wz2);
    const wBody2 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 10, 8), M.white); wBody2.scale.set(1.5, 1, 1); wBody2.position.set(wx2, wh4 + 1.5, wz2); scene.add(wBody2);
    const wHead2 = new THREE.Mesh(new THREE.SphereGeometry(.9, 9, 7), M.white); wHead2.position.set(wx2 + 2.2, wh4 + 2.2, wz2); scene.add(wHead2);
    for (const sgn of [-1, 1]) {
      const wHorn = new THREE.Mesh(new THREE.ConeGeometry(.16, 1, 6), M.gold); wHorn.position.set(wx2 + 2.2 + sgn * .5, wh4 + 3.2, wz2); scene.add(wHorn);
    }
    cirObs.push({ x: wx2, z: wz2, r: 2.4 }); addSpot(wx2, wz2 + 3.8, 'lore', 'baize');
  }
  addNpc({ x: gx - 8, z: gz + 46, name: '夸父', body: 0x7a4a2a, hat: 0x5a3620, opts: { tall: 1.35, wide: 1.3, cane: true },
    lines: ['太阳又往西边跑了。今天,一定追上它。', '渴。真渴。黄河渭水,怕是不够喝。', '(把手杖插进土里)若我倒下,这里就长出一片桃林。'] });
  const dk = height(gx, gz + 114);
  const plank = box(5, .5, 9, M.wood); plank.position.set(gx, dk + .9, gz + 112); scene.add(plank);
  addSpot(gx, gz + 110, 'ferry', 'ferry', { r: 8 });
}
/* —— 桃花源(隐藏秘境) —— */
{
  const gx = THY.x, gz = THY.z;
  // 主岛入口山洞(雪山北麓)
  {
    const ch = height(352, -388);
    const rockL = new THREE.Mesh(new THREE.DodecahedronGeometry(4), M.stone); rockL.position.set(348, ch + 2, -390); scene.add(rockL);
    const rockR = new THREE.Mesh(new THREE.DodecahedronGeometry(3.4), M.stone); rockR.position.set(356, ch + 1.6, -387); scene.add(rockR);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(1.6, 12), new THREE.MeshBasicMaterial({ color: 0x0a0c10 }));
    hole.position.set(352, ch + 1.8, -387.4); scene.add(hole);
    addSpot(352, -385, 'lore', 'taocave', { r: 6 });
  }
  // 桃林(粉冠树)
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2, rr = 26 + (i % 3) * 14;
    const tx = gx + Math.cos(a) * rr, tz = gz + Math.sin(a) * rr, th4 = height(tx, tz);
    const trunk = cyl(.4, .55, 3.6, M.wood); trunk.position.set(tx, th4 + 1.8, tz); scene.add(trunk);
    const cano = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 0), lam(i % 2 ? 0xf5b8cc : 0xef9fbc));
    cano.position.set(tx, th4 + 5, tz); scene.add(cano);
    cirObs.push({ x: tx, z: tz, r: .9 });
  }
  // 屋舍俨然
  [[gx - 16, gz - 12], [gx + 14, gz - 16], [gx + 2, gz + 18]].forEach(([hx, hz]) => {
    const hh = height(hx, hz);
    const bodyH = box(7, 4, 5.5, lam(0xe8dcc0)); bodyH.position.set(hx, hh + 2, hz); scene.add(bodyH);
    const roofH = new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.6, 4), lam(0x6a5a40)); roofH.rotation.y = Math.PI / 4; roofH.position.set(hx, hh + 5.3, hz); scene.add(roofH);
    cirObs.push({ x: hx, z: hz, r: 4.4 });
  });
  // 良田
  for (let i = 0; i < 4; i++) {
    const fx = gx - 30 + i * 16, fz = gz + 34;
    const field = box(13, .3, 9, lam(i % 2 ? 0x8fbc5a : 0x7aa84c)); field.position.set(fx, height(fx, fz) + .2, fz); scene.add(field);
  }
  addSpot(gx, gz + 34, 'lore', 'taofield', { r: 10 });
  // 返回洞口
  {
    const bx3 = gx - 90, bz3 = gz, bh5 = height(bx3, bz3);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(3.6), M.stone); rock.position.set(bx3 - 3, bh5 + 1.8, bz3); scene.add(rock);
    const hole2 = new THREE.Mesh(new THREE.CircleGeometry(1.5, 12), new THREE.MeshBasicMaterial({ color: 0x0a0c10 }));
    hole2.rotation.y = Math.PI / 2; hole2.position.set(bx3 - 1.4, bh5 + 1.7, bz3); scene.add(hole2);
    addSpot(bx3 + 2, bz3, 'lore', 'taoback', { r: 6 });
  }
  addNpc({ x: gx - 60, z: gz + 6, name: '武陵渔人', body: 0x4a6a7a, hat: 0xd9c9a0,
    lines: ['缘溪行,忘路之远近……然后我就到这儿了。', '此中人语云:不足为外人道也。——你就当没见过我。', '我的船还系在洞外,你信不信?'] });
  addNpc({ x: gx + 6, z: gz - 10, name: '村中老人', body: 0x8a7a5a, hat: 0xe8dcc0, opts: { cane: true },
    lines: ['先世避秦时乱,率妻子邑人来此绝境。', '今是何世?乃不知有汉,无论魏晋。', '来,设酒杀鸡作食。别客气。'] });
}
/* —— 一千零一夜 · 巴格达 —— */
{
  const gx = ANH.x, gz = ANH.z;
  // 宣礼塔
  {
    const th4 = height(gx - 20, gz - 20);
    const shaft = cyl(2.4, 3.2, 22, lam(0xe8d8b8)); shaft.position.set(gx - 20, th4 + 11, gz - 20); scene.add(shaft);
    const onion = new THREE.Mesh(new THREE.SphereGeometry(3.4, 12, 10), lam(0x2e86ab)); onion.scale.y = 1.3; onion.position.set(gx - 20, th4 + 24.6, gz - 20); scene.add(onion);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(.5, 2.4, 8), M.gold); tip.position.set(gx - 20, th4 + 29.6, gz - 20); scene.add(tip);
    cirObs.push({ x: gx - 20, z: gz - 20, r: 3.6 });
  }
  // 集市(条纹摊棚)
  const stallCols = [0xc0392b, 0x2e86ab, 0xb8862e, 0x6a3a8c];
  for (let i = 0; i < 4; i++) {
    const sx2 = gx + 10 + (i % 2) * 14, sz3 = gz - 6 + Math.floor(i / 2) * 14, sh4 = height(sx2, sz3);
    for (const [ox, oz] of [[-3, -2], [3, -2], [-3, 2], [3, 2]]) {
      const pole = cyl(.12, .12, 3.4, M.woodDark); pole.position.set(sx2 + ox, sh4 + 1.7, sz3 + oz); scene.add(pole);
    }
    for (let k = 0; k < 4; k++) {
      const seg = box(1.8, .16, 5.4, lam(k % 2 ? 0xf5efdc : stallCols[i]));
      seg.position.set(sx2 - 2.7 + k * 1.8, sh4 + 3.5, sz3); scene.add(seg);
    }
    const table = box(6, .8, 2.4, M.wood); table.position.set(sx2, sh4 + .8, sz3); scene.add(table);
    cirObs.push({ x: sx2, z: sz3, r: 3.4 });
  }
  addSpot(gx + 17, gz + 1, 'lore', 'bazaar', { r: 9 });
  // 神灯
  {
    const lx = gx - 6, lz = gz + 24, lh = height(lx, lz);
    const ped = cyl(1, 1.3, 1.8, M.stone); ped.position.set(lx, lh + .9, lz); scene.add(ped);
    const lampBody = new THREE.Mesh(new THREE.SphereGeometry(.8, 12, 8), M.gold); lampBody.scale.set(1.3, .7, .8); lampBody.position.set(lx, lh + 2.2, lz); scene.add(lampBody);
    const spout = new THREE.Mesh(new THREE.ConeGeometry(.22, 1.2, 8), M.gold); spout.rotation.z = Math.PI / 2 + .3; spout.position.set(lx - 1.1, lh + 2.4, lz); scene.add(spout);
    cirObs.push({ x: lx, z: lz, r: 1.6 });
    addSpot(lx, lz + 3, 'lore', 'genie');
  }
  // 飞毯(悬浮微晃)
  {
    const cx6 = gx + 20, cz6 = gz - 28, ch6 = height(cx6, cz6);
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.6, 6, 4),
      new THREE.MeshLambertMaterial({ color: 0x8c2f4e, side: THREE.DoubleSide }));
    rug.rotation.x = -Math.PI / 2; rug.position.set(cx6, ch6 + 1.6, cz6); scene.add(rug);
    window.__rug = rug;
    addSpot(cx6, cz6 + 3, 'lore', 'carpet', { r: 7 });
  }
  // 星夜讲台
  addSpot(gx - 24, gz + 10, 'lore', 'story', { r: 7 });
  addNpc({ x: gx - 26, z: gz + 14, name: '山鲁佐德', body: 0x6a3a8c, hat: 0xd9b26a,
    lines: ['故事讲到最精彩处,天就该亮了。', '想活下去,就要让人想听你的下一句。', '第一千零一夜之后呢?之后,是每一夜。'] });
  addNpc({ x: gx + 14, z: gz + 8, name: '阿拉丁', body: 0x2e86ab, hat: 0xc0392b,
    lines: ['别信集市上任何一个说"免费"的人。', '灯神脾气不坏,就是起床气大。', '飞毯比骆驼快,还不吐口水。'] });
  const dk2 = height(gx, gz - 108);
  const plank2 = box(5, .5, 9, M.wood); plank2.position.set(gx, dk2 + .9, gz - 106); scene.add(plank2);
  addSpot(gx, gz - 104, 'ferry', 'ferry', { r: 8 });
  const anSign = makeSign('一千零一夜 · 巴格达', 8, '#241c38', '#e8c86a');
  anSign.position.set(gx + 12, height(gx + 12, gz - 90) + 4.6, gz - 90); scene.add(anSign);
}
/* —— 海底两万里 · 鹦鹉螺锚地 —— */
{
  const gx = NEM.x, gz = NEM.z;
  nautilusHull = new THREE.Group();
  const hull = cyl(4.5, 4.5, 30, lam(0x3a3630), 14); hull.rotation.z = Math.PI / 2; nautilusHull.add(hull);
  const noseN = new THREE.Mesh(new THREE.ConeGeometry(4.5, 8, 14), lam(0x3a3630)); noseN.rotation.z = -Math.PI / 2; noseN.position.x = 19; nautilusHull.add(noseN);
  const spike = new THREE.Mesh(new THREE.ConeGeometry(.7, 6, 8), lam(0x5a544a)); spike.rotation.z = -Math.PI / 2; spike.position.x = 25; nautilusHull.add(spike);
  const tower = box(6, 3, 3.4, lam(0x2e2a24)); tower.position.set(-2, 5.2, 0); nautilusHull.add(tower);
  const finN = box(1, 5, 4, lam(0x2e2a24)); finN.position.set(-16, 2, 0); nautilusHull.add(finN);
  for (let i = 0; i < 6; i++) {
    const ph7 = new THREE.Mesh(new THREE.CircleGeometry(.55, 10), new THREE.MeshBasicMaterial({ color: 0xaef0e8 }));
    ph7.position.set(-10 + i * 4, 1.2, 4.55); nautilusHull.add(ph7);
  }
  nautilusHull.position.set(gx + 34, .4, gz + 14);
  nautilusHull.rotation.y = .5;
  scene.add(nautilusHull);
  addSpot(gx + 16, gz + 8, 'lore', 'nautilus', { r: 9 });
  // 观景台(岩台边缘)
  addSpot(gx + 8, gz + 24, 'lore', 'porthole', { r: 7 });
  // 环艇鱼群
  {
    const fg = new THREE.ConeGeometry(.4, 1.4, 5);
    nemFishSchool = new THREE.InstancedMesh(fg, new THREE.MeshLambertMaterial({ color: 0xffffff }), 30);
    const cols2 = Object.values(FISH_COLOR).map(c2 => new THREE.Color(c2));
    for (let i = 0; i < 30; i++) nemFishSchool.setColorAt(i, cols2[i % cols2.length]);
    if (nemFishSchool.instanceColor) nemFishSchool.instanceColor.needsUpdate = true;
    scene.add(nemFishSchool);
  }
  addNpc({ x: gx - 6, z: gz + 10, name: '尼摩船长', body: 0x1c2a34, hat: 0x2e3e4a, opts: { tall: 1.1 },
    lines: ['我不是什么"文明人"。我和整个人类社会决裂了。', '海洋不属于暴君。在海面以下三十英尺,他们的权力就终止了。', 'Mobilis in mobili——动中之动,这是鹦鹉螺号的座右铭。'] });
  addNpc({ x: gx + 4, z: gz - 8, name: '尼德·兰', body: 0x8a4a2a, hat: 0x6a3620, opts: { wide: 1.3 },
    lines: ['牛排!我只想要一块真正的牛排!', '教授,我们到底什么时候逃跑?', '鱼我这辈子都不想再吃了。'] });
  const dk3 = height(gx, gz - 72);
  const plank3 = box(5, .5, 9, M.wood); plank3.position.set(gx, dk3 + .9, gz - 70); scene.add(plank3);
  addSpot(gx, gz - 68, 'ferry', 'ferry', { r: 8 });
  const neSign = makeSign('海底两万里', 6.4, '#12242e', '#8ae0d8');
  neSign.position.set(gx + 10, height(gx + 10, gz - 56) + 4.4, gz - 56); scene.add(neSign);
}
/* —— B-612 小行星 —— */
{
  const gx = B612.x, gz = B612.z, top = height(gx, gz);
  // 玫瑰与玻璃罩
  const stem = cyl(.06, .06, 1.4, lam(0x3e7a3a)); stem.position.set(gx + 3, top + .7, gz); scene.add(stem);
  const bloom = new THREE.Mesh(new THREE.SphereGeometry(.42, 10, 8), lam(0xc2185b)); bloom.position.set(gx + 3, top + 1.5, gz); scene.add(bloom);
  const dome2 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhongMaterial({ color: 0xbfe8ff, transparent: true, opacity: .3 }));
  dome2.position.set(gx + 3, top, gz); scene.add(dome2);
  addSpot(gx + 3, gz + 2.6, 'lore', 'rose', { r: 5 });
  // 三棵猴面包树
  [[gx - 6, gz - 5], [gx - 2, gz + 6], [gx + 7, gz - 6]].forEach(([bx4, bz4]) => {
    const bh6 = height(bx4, bz4);
    const trunk = cyl(1.1, 1.5, 4.4, M.wood); trunk.position.set(bx4, bh6 + 2.2, bz4); scene.add(trunk);
    const cano = new THREE.Mesh(new THREE.CylinderGeometry(3, 2.2, 1.2, 10), lam(0x5a8a44)); cano.position.set(bx4, bh6 + 5.2, bz4); scene.add(cano);
    cirObs.push({ x: bx4, z: bz4, r: 1.8 });
  });
  addSpot(gx - 6, gz - 2, 'lore', 'baobab', { r: 5 });
  // 路灯与点灯人
  {
    const lx = gx - 1, lz = gz - 9, lh2 = height(lx, lz);
    const pole = cyl(.12, .16, 4, lam(0x2a5a3a)); pole.position.set(lx, lh2 + 2, lz); scene.add(pole);
    const lampG = new THREE.Mesh(new THREE.SphereGeometry(.5, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
    lampG.position.set(lx, lh2 + 4.3, lz); scene.add(lampG);
    const lampLight = new THREE.PointLight(0xffe9a0, 0, 40, 2);
    lampLight.position.set(lx, lh2 + 4.3, lz); lampLight.userData.pow = 24; scene.add(lampLight);
    nightLamps.push(lampLight);
    addSpot(lx, lz - 2.6, 'lore', 'lamppost', { r: 5 });
  }
  addNpc({ x: gx - 4, z: gz + 3, name: '小王子', body: 0x2e86ab, hat: 0xf2d13c, opts: { tall: .85 },
    lines: ['真正重要的东西,用眼睛是看不见的。', '你在你的玫瑰身上花费的时间,让她变得如此重要。', '我的星球上,一天可以看四十四次日落。'] });
  addNpc({ x: gx + 2, z: gz - 11, name: '点灯人', body: 0x4a4a52, hat: 0xd9b26a,
    lines: ['早上好。——为什么熄灯?——命令。晚上好。', '从前这里一分钟一昼夜,我连打盹的工夫都没有。', '在所有星球的人里,只有他不显得可笑。小王子这么说过我。'] });
  addNpc({ x: gx + 8, z: gz + 5, name: '狐狸', body: 0xe07b28, hat: 0xc25e18, opts: { tall: .7 },
    lines: ['请你……驯养我吧。', '对我而言,你还只是一个小男孩,和其他千万个小男孩一样。', '如果你驯养了我,我们就彼此需要了。'] });
  const dk4 = height(gx, gz - 50);
  const plank4 = box(4.4, .5, 8, M.wood); plank4.position.set(gx, dk4 + .9, gz - 48); scene.add(plank4);
  addSpot(gx, gz - 46, 'ferry', 'ferry', { r: 8 });
  const bSign = makeSign('B-612', 3.6, '#1c2440', '#f2d13c');
  bSign.position.set(gx + 7, height(gx + 7, gz - 40) + 3.6, gz - 40); scene.add(bSign);
}
/* —— 侏罗纪公园 —— */
{
  const gx = JUR.x, gz = JUR.z;
  // 大门(火把木门)
  {
    const dz3 = gz - 92, dh5 = height(gx, dz3);
    for (const sgn of [-1, 1]) {
      const towerJ = box(4, 16, 4, M.woodDark); towerJ.position.set(gx + sgn * 9, dh5 + 8, dz3); scene.add(towerJ);
      cirObs.push({ x: gx + sgn * 9, z: dz3, r: 3 });
      const torch = new THREE.Mesh(new THREE.ConeGeometry(.7, 1.8, 7), new THREE.MeshBasicMaterial({ color: 0xf39c12 }));
      torch.position.set(gx + sgn * 9, dh5 + 17.2, dz3); scene.add(torch);
    }
    const beam = box(22, 3, 3, M.woodDark); beam.position.set(gx, dh5 + 15, dz3); scene.add(beam);
    const jSign = makeSign('侏罗纪公园', 8.5, '#2a2014', '#f0c84a');
    jSign.position.set(gx, dh5 + 12.4, dz3 + .4); scene.add(jSign);
    addSpot(gx, dz3 + 6, 'lore', 'jurgate', { r: 9 });
  }
  // 电网围场(霸王龙 + 迅猛龙)
  {
    const fr = 52;
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * Math.PI * 2;
      const post = cyl(.3, .35, 6, lam(0x4a4438));
      post.position.set(gx + Math.cos(a) * fr, height(gx + Math.cos(a) * fr, gz + Math.sin(a) * fr) + 3, gz + Math.sin(a) * fr);
      scene.add(post);
      cirObs.push({ x: gx + Math.cos(a) * fr, z: gz + Math.sin(a) * fr, r: 8.2 });   // 围栏挡人
    }
    for (const hy of [2, 3.6, 5.2]) {
      const wire = new THREE.Mesh(new THREE.TorusGeometry(fr, .07, 6, 40), lam(0x8a8a92));
      wire.rotation.x = Math.PI / 2; wire.position.set(gx, height(gx, gz) + hy, gz); scene.add(wire);
    }
    // 霸王龙
    trexGrp = new THREE.Group();
    const tBody = new THREE.Mesh(new THREE.SphereGeometry(3.4, 12, 10), lam(0x5a4632)); tBody.scale.set(1.7, 1.1, 1); tBody.position.y = 6; trexGrp.add(tBody);
    const tHead2 = box(4.4, 3, 2.6, lam(0x6a5238)); tHead2.position.set(6.5, 8.6, 0); trexGrp.add(tHead2);
    const tJaw = box(3.6, 1, 2.2, lam(0x4a3a28)); tJaw.position.set(6.9, 6.9, 0); trexGrp.add(tJaw);
    const tTail = new THREE.Mesh(new THREE.ConeGeometry(2, 9, 8), lam(0x5a4632)); tTail.rotation.z = Math.PI / 2 + .25; tTail.position.set(-8, 5.4, 0); trexGrp.add(tTail);
    for (const sgn of [-1, 1]) {
      const leg = cyl(1.1, 1.4, 5.6, lam(0x4a3a28)); leg.position.set(-1, 2.8, sgn * 2); trexGrp.add(leg);
      const arm = cyl(.3, .3, 1.6, lam(0x4a3a28)); arm.rotation.z = .8; arm.position.set(4, 6.4, sgn * 1.6); trexGrp.add(arm);
    }
    trexGrp.position.set(gx, height(gx, gz) + .1, gz);
    scene.add(trexGrp);
    addSpot(gx, gz + 58, 'lore', 'trex', { r: 8 });
    // 两只迅猛龙
    for (const sgn of [-1, 1]) {
      const rp = new THREE.Group();
      const rBody = new THREE.Mesh(new THREE.SphereGeometry(1, 9, 7), lam(0x6a5a2a)); rBody.scale.set(1.8, 1, .8); rBody.position.y = 1.6; rp.add(rBody);
      const rHead = box(1.4, .8, .7, lam(0x7a6a34)); rHead.position.set(1.9, 2.2, 0); rp.add(rHead);
      const rTail = new THREE.Mesh(new THREE.ConeGeometry(.5, 3.4, 6), lam(0x6a5a2a)); rTail.rotation.z = Math.PI / 2; rTail.position.set(-2.6, 1.7, 0); rp.add(rTail);
      rp.position.set(gx + sgn * 18, height(gx, gz) + .1, gz - sgn * 12);
      rp.userData = { sgn };
      scene.add(rp); raptorGrps.push(rp);
    }
  }
  // 腕龙(围场外,树旁)
  {
    const bx5 = gx - 66, bz5 = gz + 30, bh7 = height(bx5, bz5);
    makeTree(bx5 + 8, bz5 - 2, 2.4, null);
    const grp = new THREE.Group();
    const bBody2 = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 10), lam(0x4a6a4a)); bBody2.scale.set(1.6, 1.1, 1); bBody2.position.y = 6.5; grp.add(bBody2);
    for (const [lx2, lz2] of [[-3.5, -2.4], [3.5, -2.4], [-3.5, 2.4], [3.5, 2.4]]) {
      const leg = cyl(1, 1.3, 6, lam(0x3e5a3e)); leg.position.set(lx2, 3, lz2); grp.add(leg);
    }
    brachioNeck = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const seg = cyl(1.1 - i * .18, 1.2 - i * .18, 4.4, lam(0x4a6a4a));
      seg.position.set(0, i * 4, 0); brachioNeck.add(seg);
    }
    const bHead3 = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), lam(0x5a7a5a)); bHead3.position.set(.6, 14.6, 0); brachioNeck.add(bHead3);
    brachioNeck.position.set(5.5, 8, 0); brachioNeck.rotation.z = -.5;
    grp.add(brachioNeck);
    grp.position.set(bx5, bh7 + .1, bz5);
    scene.add(grp);
    cirObs.push({ x: bx5, z: bz5, r: 7 });
    addSpot(bx5, bz5 + 10, 'lore', 'brachio', { r: 9 });
  }
  addSpot(gx + 20, gz - 14, 'lore', 'raptor', { r: 9 });
  addNpc({ x: gx - 6, z: gz - 84, name: '哈蒙德博士', body: 0xe8e4dc, hat: 0xd9d5c8, opts: { cane: true },
    lines: ['欢迎——来到侏罗纪公园!', '我们不惜血本(Spared no expense)。', '连自动讲解都是请理查德·基利配的音,不惜血本!'] });
  addNpc({ x: gx + 8, z: gz - 80, name: '马尔科姆博士', body: 0x1c1c20, hat: 0x2a2a30,
    lines: ['生命总会找到出路。', '你们的科学家光顾着"能不能",没人停下来想"该不该"。', '混沌理论。啧,又对了。'] });
  const dk5 = height(gx, gz - 122);
  const plank5 = box(5, .5, 9, M.wood); plank5.position.set(gx, dk5 + .9, gz - 120); scene.add(plank5);
  addSpot(gx, gz - 118, 'ferry', 'ferry', { r: 8 });
}
/* ================= 名著十岛 ================= */
const windmillBlades = [], cbFlags = [], cheshireMats = [];
const boats = [];
/* —— 花果山 —— */
{
  const gx = HGS.x, gz = HGS.z, peakZ = gz - 60;
  const cliffH = height(gx, peakZ + 32);
  const fall2 = new THREE.Mesh(new THREE.PlaneGeometry(10, 18),
    new THREE.MeshPhongMaterial({ color: 0xdfeefc, transparent: true, opacity: .55, side: THREE.DoubleSide }));
  fall2.position.set(gx, cliffH + 2, peakZ + 34); scene.add(fall2);
  const caveH = new THREE.Mesh(new THREE.CircleGeometry(3, 14), new THREE.MeshBasicMaterial({ color: 0x0a0c10 }));
  caveH.position.set(gx, cliffH + 1, peakZ + 33.4); scene.add(caveH);
  addSpot(gx, peakZ + 40, 'lore', 'shuilian', { r: 8 });
  for (let i = 0; i < 6; i++) {   // 蟠桃园
    const a = i / 6 * Math.PI * 2, tx = gx + 46 + Math.cos(a) * 14, tz = gz + 30 + Math.sin(a) * 14, th5 = height(tx, tz);
    const trunk = cyl(.4, .5, 3, M.wood); trunk.position.set(tx, th5 + 1.5, tz); scene.add(trunk);
    const cano = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 0), lam(0x5fae52)); cano.position.set(tx, th5 + 4.2, tz); scene.add(cano);
    for (let p4 = 0; p4 < 3; p4++) {
      const peach = new THREE.Mesh(new THREE.SphereGeometry(.34, 8, 6), lam(0xf5a8c0));
      peach.position.set(tx + Math.cos(p4 * 2.1) * 1.6, th5 + 3.8 + (p4 % 2) * .8, tz + Math.sin(p4 * 2.1) * 1.6); scene.add(peach);
    }
    cirObs.push({ x: tx, z: tz, r: .9 });
  }
  addSpot(gx + 46, gz + 30, 'lore', 'pantao', { r: 9 });
  {   // 山顶定海神针
    const px7 = gx, pz7 = peakZ, ph8 = height(px7, pz7);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(3), M.stone); rock.position.set(px7, ph8 + 1.4, pz7); scene.add(rock);
    const cudgel = cyl(.35, .35, 9, MOBILE ? new THREE.MeshLambertMaterial({ color: 0xd9b26a }) : new THREE.MeshStandardMaterial({ color: 0xd9b26a, roughness: .3, metalness: .85 }));
    cudgel.position.set(px7, ph8 + 6.4, pz7); scene.add(cudgel);
    for (const yy of [2.6, 6.2]) {
      const band = cyl(.44, .44, .5, M.gold); band.position.set(px7, ph8 + yy + 2, pz7); scene.add(band);
    }
    window.__jinguMesh = cudgel;
    if (PSTORE.getItem('w1001.jingu') === '1') cudgel.visible = false;
    cirObs.push({ x: px7, z: pz7, r: 3 });
    addSpot(px7, pz7 + 5.5, 'lore', 'jingu', { r: 8 });
  }
  for (let i = 0; i < 4; i++) {   // 猴群
    const mx = gx - 30 + i * 8, mz2 = gz + 8 + (i % 2) * 10, mh2 = height(mx, mz2);
    const mb = new THREE.Mesh(new THREE.SphereGeometry(.6, 8, 6), lam(0x8a6238)); mb.position.set(mx, mh2 + .7, mz2); scene.add(mb);
    const mhd = new THREE.Mesh(new THREE.SphereGeometry(.4, 8, 6), lam(0xa87c4a)); mhd.position.set(mx, mh2 + 1.4, mz2); scene.add(mhd);
  }
  addNpc({ x: gx - 6, z: gz + 20, name: '孙悟空', body: 0xd9a24a, hat: 0xc0392b, opts: { tall: .95 },
    lines: ['俺老孙五百年前大闹天宫,如今看这石头山,还是家里好。', '皇帝轮流做,明年到我家!', '你这泼猴——欸不对,俺才是猴。'] });
  addNpc({ x: gx + 40, z: gz + 36, name: '八戒', body: 0xefb8c8, hat: 0x8a6238, opts: { wide: 1.6 },
    lines: ['俺就闻闻,真的就闻闻。', '猴哥!有妖……哦没有,是风。', '散伙吧散伙吧,俺回高老庄。'] });
  addNpc({ x: gx + 8, z: gz + 44, name: '唐僧', body: 0xd9c9a0, hat: 0xb8862e,
    lines: ['悟空,休得无礼。', '出家人以慈悲为怀。', '(小声)其实……为师也想摘个桃。'] });
  const dk6 = height(gx, gz + 122);
  const plank6 = box(5, .5, 9, M.wood); plank6.position.set(gx, dk6 + .9, gz + 120); scene.add(plank6);
  addSpot(gx, gz + 118, 'ferry', 'ferry', { r: 8 });
  const hgsSign = makeSign('花果山 · 水帘洞', 7, '#1e3a1e', '#f5c9a0');
  hgsSign.position.set(gx + 12, height(gx + 12, gz + 100) + 4.4, gz + 100); scene.add(hgsSign);
}
/* —— 爱丽丝梦游仙境 —— */
{
  const gx = ALC.x, gz = ALC.z;
  const capCols = [0xc0392b, 0x8e44ad, 0xe8963c, 0xc0392b, 0x2e86ab];
  for (let i = 0; i < 5; i++) {   // 巨蘑菇
    const a = i / 5 * Math.PI * 2 + .4, mx = gx - 26 + Math.cos(a) * 20, mz3 = gz - 10 + Math.sin(a) * 18, mh3 = height(mx, mz3);
    const stem = cyl(1.2, 1.6, 4 + (i % 3) * 2, lam(0xf0ead8)); stem.position.set(mx, mh3 + 2 + (i % 3), mz3); scene.add(stem);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(3 + (i % 2), 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), lam(capCols[i]));
    cap.position.set(mx, mh3 + 4 + (i % 3) * 2, mz3); scene.add(cap);
    cirObs.push({ x: mx, z: mz3, r: 1.8 });
  }
  addSpot(gx - 26, gz - 10, 'lore', 'mushroom', { r: 10 });
  {   // 小小门
    const dx4 = gx + 8, dz5 = gz - 30, dh6 = height(dx4, dz5);
    makeTree(dx4, dz5 - 3, 1.8, null);
    const td2 = box(.9, 1.4, .15, lam(0xb8862e)); td2.position.set(dx4, dh6 + .7, dz5 + 1.2); scene.add(td2);
    addSpot(dx4, dz5 + 3, 'lore', 'tinydoor', { r: 5 });
  }
  {   // 疯帽子茶会
    const tx2 = gx + 22, tz3 = gz + 14, th6 = height(tx2, tz3);
    const table2 = box(14, .6, 3.4, M.wood); table2.position.set(tx2, th6 + 1.3, tz3); scene.add(table2);
    for (let i = 0; i < 5; i++) {
      const pot = new THREE.Mesh(new THREE.SphereGeometry(.5, 8, 6), lam([0xf5efdc, 0x2e86ab, 0xc2185b, 0xd9b26a, 0x6a3a8c][i]));
      pot.position.set(tx2 - 5.6 + i * 2.8, th6 + 1.9, tz3 + (i % 2 ? .8 : -.8)); scene.add(pot);
    }
    for (const sgn of [-1, 1]) {
      const chair = box(1.2, 2.2, 1.2, M.woodDark); chair.position.set(tx2 + sgn * 5, th6 + 1.1, tz3 + 3); scene.add(chair);
    }
    boxObs.push({ x1: tx2 - 7, z1: tz3 - 1.8, x2: tx2 + 7, z2: tz3 + 1.8 });
  }
  {   // 柴郡猫(会消失只剩笑)
    const cx7 = gx - 4, cz7 = gz + 30, chh2 = height(cx7, cz7);
    makeTree(cx7, cz7, 1.6, null);
    const catBody = new THREE.Mesh(new THREE.SphereGeometry(.9, 10, 8), new THREE.MeshLambertMaterial({ color: 0xb06ad4, transparent: true }));
    catBody.scale.set(1.3, 1, 1); catBody.position.set(cx7 + 1.5, chh2 + 8.2, cz7 + .5); scene.add(catBody);
    const catHead = new THREE.Mesh(new THREE.SphereGeometry(.6, 10, 8), new THREE.MeshLambertMaterial({ color: 0xb06ad4, transparent: true }));
    catHead.position.set(cx7 + 2.6, chh2 + 8.8, cz7 + .5); scene.add(catHead);
    const grin = new THREE.Mesh(new THREE.TorusGeometry(.42, .09, 6, 12, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    grin.rotation.z = Math.PI; grin.position.set(cx7 + 2.6, chh2 + 8.7, cz7 + 1.05); scene.add(grin);
    cheshireMats.push(catBody.material, catHead.material);
    addSpot(cx7, cz7 + 4, 'lore', 'cheshire', { r: 7 });
  }
  {   // 刷漆玫瑰与兔子洞
    const rx3 = gx + 34, rz3 = gz - 14, rh3 = height(rx3, rz3);
    for (let i = 0; i < 6; i++) {
      const rose2 = new THREE.Mesh(new THREE.SphereGeometry(.4, 8, 6), lam(i < 3 ? 0xc0392b : 0xf0ead8));
      rose2.position.set(rx3 - 2.4 + i * 1, rh3 + 1.6, rz3); scene.add(rose2);
      const st4 = cyl(.06, .06, 1.2, lam(0x3e7a3a)); st4.position.set(rx3 - 2.4 + i * 1, rh3 + .8, rz3); scene.add(st4);
    }
    const hole3 = new THREE.Mesh(new THREE.CircleGeometry(2, 14), new THREE.MeshBasicMaterial({ color: 0x0a0c10 }));
    hole3.rotation.x = -Math.PI / 2; hole3.position.set(gx - 34, height(gx - 34, gz + 26) + .15, gz + 26); scene.add(hole3);
    addSpot(gx - 34, gz + 29, 'lore', 'rabbithole', { r: 6 });
  }
  addNpc({ x: gx + 22, z: gz + 20, name: '疯帽子', body: 0x2e6a5a, hat: 0x8e44ad, opts: { hat: 'cone' },
    lines: ['为什么乌鸦像写字台?——我也不知道!哈哈哈!', '换座位!全体换座位!', '这里永远是下午茶时间,因为时间先生跟我闹掰了。'] });
  addNpc({ x: gx + 34, z: gz - 8, name: '红桃皇后', body: 0xc0392b, hat: 0xffd76a, opts: { wide: 1.3 },
    lines: ['砍掉他的头!!', '谁把白玫瑰种进了朕的花园?!', '先判决,后审判!'] });
  const dk7 = height(gx, gz + 106);
  const plank7 = box(5, .5, 9, M.wood); plank7.position.set(gx, dk7 + .9, gz + 104); scene.add(plank7);
  addSpot(gx, gz + 102, 'ferry', 'ferry', { r: 8 });
  const alcSign = makeSign('爱丽丝梦游仙境', 7.5, '#3a1e40', '#f5c9d4');
  alcSign.position.set(gx + 14, height(gx + 14, gz + 88) + 4.4, gz + 88); scene.add(alcSign);
}
/* —— 三国 · 赤壁 —— */
{
  const gx = CBI.x, gz = CBI.z;
  for (let i = 0; i < 5; i++) {   // 连环战船(南岸江面)
    const sx3 = gx - 44 + i * 22, sz4 = gz + 96;
    const hull2 = box(18, 3, 6.5, lam(0x4a3626)); hull2.position.set(sx3, 1.2, sz4); scene.add(hull2);
    const mast2 = cyl(.3, .4, 12, M.woodDark); mast2.position.set(sx3, 8, sz4); scene.add(mast2);
    const sail2 = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), new THREE.MeshLambertMaterial({ color: 0xd9c9a0, side: THREE.DoubleSide }));
    sail2.position.set(sx3, 8, sz4); scene.add(sail2);
    if (i < 4) { const chain = box(4.5, .4, .4, lam(0x3a3a40)); chain.position.set(sx3 + 11, 1.6, sz4); scene.add(chain); }
  }
  for (let i = 0; i < 3; i++) {   // 草船
    const cx8 = gx + 40 + i * 10, cz8 = gz + 74;
    const strawB = box(7, 1.6, 2.6, lam(0xc8b06a)); strawB.position.set(cx8, .8, cz8); scene.add(strawB);
    const strawMan = cyl(.5, .6, 1.8, lam(0xd9c9a0)); strawMan.position.set(cx8, 2.4, cz8); scene.add(strawMan);
  }
  addSpot(gx + 50, gz + 68, 'lore', 'caochuan', { r: 10 });
  {   // 七星坛
    const ax2 = gx - 20, az2 = gz - 20, ah2 = height(ax2, az2);
    for (let i = 0; i < 3; i++) {
      const tier2 = cyl(8 - i * 2.2, 8.6 - i * 2.2, 1.6, M.stone); tier2.position.set(ax2, ah2 + .8 + i * 1.6, az2); scene.add(tier2);
    }
    for (let i = 0; i < 3; i++) {
      const fp = cyl(.12, .12, 7, M.woodDark); fp.position.set(ax2 - 5 + i * 5, ah2 + 8, az2 - 5); scene.add(fp);
      const flag2 = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), new THREE.MeshLambertMaterial({ color: 0xd4b02a, side: THREE.DoubleSide }));
      flag2.position.set(ax2 - 5 + i * 5 + 1.3, ah2 + 10.6, az2 - 5); scene.add(flag2);
      cbFlags.push(flag2);
    }
    cirObs.push({ x: ax2, z: az2, r: 8.8 });
    addSpot(ax2, az2 + 11, 'lore', 'qixingtan', { r: 8 });
  }
  addNpc({ x: gx - 20, z: gz - 4, name: '诸葛亮', body: 0xd9c9a0, hat: 0x3a4a5a, opts: { hat: 'cone', cane: true },
    lines: ['万事俱备,只欠东风。', '亮借三日东南大风,助都督成此大功。', '(摇扇)天下三分,尽在此火。'] });
  addNpc({ x: gx + 6, z: gz + 30, name: '周瑜', body: 0x8c2f24, hat: 0xb8862e,
    lines: ['既生瑜——罢了,今日只谈火攻。', '蒋干又来了?让他抄。', '东风一起,火船齐发!'] });
  addNpc({ x: gx - 44, z: gz + 88, name: '曹操', body: 0x2a3a5a, hat: 0x1c2a44, opts: { tall: 1.1 },
    lines: ['铁索连舟,如履平地,妙哉!', '对酒当歌,人生几何。', '(望着东南方)这风……不对。'] });
  const dk8 = height(gx, gz + 114);
  const plank8 = box(5, .5, 9, M.wood); plank8.position.set(gx, dk8 + .9, gz + 112); scene.add(plank8);
  addSpot(gx, gz + 110, 'ferry', 'ferry', { r: 8 });
  const cbSign = makeSign('三国 · 赤壁', 6.4, '#2a1c14', '#e8a45e');
  cbSign.position.set(gx - 16, height(gx - 16, gz + 96) + 4.4, gz + 96); scene.add(cbSign);
}
/* —— 聊斋 · 兰若寺 —— */
{
  const gx = LRS.x, gz = LRS.z;
  {   // 破败古寺
    const th7 = height(gx, gz - 10);
    const wall1 = box(20, 5, 1, lam(0x6a6258)); wall1.position.set(gx, th7 + 2.5, gz - 18); scene.add(wall1);
    const wall2 = box(1, 4, 10, lam(0x6a6258)); wall2.position.set(gx - 10, th7 + 2, gz - 13); scene.add(wall2);
    const wall3 = box(1, 3, 6, lam(0x6a6258)); wall3.position.set(gx + 10, th7 + 1.5, gz - 15); scene.add(wall3);
    const roofL = box(14, .6, 8, lam(0x3a342c)); roofL.rotation.z = .12; roofL.position.set(gx - 2, th7 + 5.6, gz - 14); scene.add(roofL);
    boxObs.push({ x1: gx - 10, z1: gz - 19, x2: gx + 10, z2: gz - 17 });
    for (let i = 0; i < 4; i++) {
      const lp = cyl(.1, .1, 3, M.woodDark); lp.position.set(gx - 12 + i * 8, th7 + 1.5, gz + 6); scene.add(lp);
      const lantern2 = new THREE.Mesh(new THREE.SphereGeometry(.55, 8, 6), new THREE.MeshBasicMaterial({ color: 0xd94f4f, transparent: true, opacity: .9 }));
      lantern2.position.set(gx - 12 + i * 8, th7 + 3.2, gz + 6); scene.add(lantern2);
      const ll = new THREE.PointLight(0xd94f4f, 0, 26, 2); ll.position.set(gx - 12 + i * 8, th7 + 3.2, gz + 6); ll.userData.pow = 14;
      scene.add(ll); nightLamps.push(ll);
    }
  }
  {   // 古井与白杨坟
    const wx3 = gx + 20, wz3 = gz - 26, wh5 = height(wx3, wz3);
    const wellRing = cyl(1.6, 1.8, 1.2, M.stone); wellRing.position.set(wx3, wh5 + .6, wz3); scene.add(wellRing);
    const wellHole = new THREE.Mesh(new THREE.CircleGeometry(1.3, 12), new THREE.MeshBasicMaterial({ color: 0x06080a }));
    wellHole.rotation.x = -Math.PI / 2; wellHole.position.set(wx3, wh5 + 1.25, wz3); scene.add(wellHole);
    cirObs.push({ x: wx3, z: wz3, r: 2 });
    addSpot(wx3, wz3 + 3.4, 'lore', 'well', { r: 6 });
    makeTree(gx - 26, gz + 20, 1.9, null);
    const stone2 = box(1.6, 2, .4, M.stone); stone2.position.set(gx - 24, height(gx - 24, gz + 24) + 1, gz + 24); scene.add(stone2);
    addSpot(gx - 24, gz + 26, 'lore', 'grave', { r: 6 });
  }
  {   // 破败大殿 + 残佛
    const hx = gx, hz = gz - 30, hh = height(hx, hz);
    for (const sgn of [-1, 1]) { const pil = cyl(.5, .6, 6, lam(0x5a4636)); pil.rotation.z = sgn * .06; pil.position.set(hx + sgn * 5, hh + 3, hz); scene.add(pil); cirObs.push({ x: hx + sgn * 5, z: hz, r: .9 }); }
    const beam = box(12, .7, 1, lam(0x3a2e22)); beam.rotation.z = .05; beam.position.set(hx, hh + 6, hz); scene.add(beam);
    const dais = cyl(2.6, 3, 1, M.stone); dais.position.set(hx, hh + .5, hz - 1); scene.add(dais);
    const budBody = cyl(1.2, 1.7, 3.4, lam(0x8a7a4a)); budBody.position.set(hx, hh + 2.7, hz - 1); scene.add(budBody);
    const budHead = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), lam(0x9a8a56)); budHead.position.set(hx, hh + 5, hz - 1); scene.add(budHead);
    cirObs.push({ x: hx, z: hz - 1, r: 2.6 });
    const eternLamp = new THREE.Mesh(new THREE.SphereGeometry(.3, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffb347 }));
    eternLamp.position.set(hx + 2.2, hh + 1.6, hz + .4); scene.add(eternLamp);
    addSpot(hx, hz + 2.4, 'lore', 'hall', { r: 6 });
  }
  {   // 千年树妖·姥姥(古树,夜里红眼透光)
    const tx = gx - 30, tz = gz - 22, tth = height(tx, tz);
    const trunk = cyl(2, 3, 11, lam(0x2e241e)); trunk.position.set(tx, tth + 5.5, tz); scene.add(trunk);
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; const br = cyl(.3, .7, 5 + (i % 3), lam(0x241c16)); br.position.set(tx + Math.cos(a) * 2, tth + 9 + (i % 3), tz + Math.sin(a) * 2); br.rotation.z = Math.cos(a) * .8; br.rotation.x = Math.sin(a) * .8; scene.add(br); }
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(4.5, 0), lam(0x1e2a1c)); crown.position.set(tx, tth + 13, tz); scene.add(crown);
    for (const sgn of [-1, 1]) {   // 树心红眼(夜间发光)
      const eye = new THREE.Mesh(new THREE.SphereGeometry(.4, 8, 6), new THREE.MeshBasicMaterial({ color: 0x8a1010 }));
      eye.position.set(tx + sgn * .7, tth + 6.5, tz + 2.1); scene.add(eye); laolaoEyes.push(eye.material);
    }
    const eyeLight = new THREE.PointLight(0xaa1818, 0, 24, 2); eyeLight.position.set(tx, tth + 6.5, tz + 2); eyeLight.userData.pow = 10; scene.add(eyeLight); nightLamps.push(eyeLight);
    cirObs.push({ x: tx, z: tz, r: 3.2 });
    addSpot(tx, tz + 5, 'lore', 'laolao', { r: 7 });
  }
  {   // 画皮:破墙上的一张人皮
    const px2 = gx + 26, pz2 = gz + 6, ph2 = height(px2, pz2);
    const wallP = box(.4, 4, 4, lam(0x4a423a)); wallP.position.set(px2, ph2 + 2, pz2); scene.add(wallP);
    const skin = new THREE.Mesh(new THREE.PlaneGeometry(2, 3.2), new THREE.MeshBasicMaterial({ color: 0xe8c8b0, side: THREE.DoubleSide, transparent: true, opacity: .92 }));
    skin.rotation.y = Math.PI / 2; skin.position.set(px2 + .25, ph2 + 2.2, pz2); scene.add(skin);
    cirObs.push({ x: px2, z: pz2, r: .8 });
    addSpot(px2 + 1.6, pz2, 'lore', 'huapi', { r: 6 });
  }
  {   // 鬼火磷光(寺周,夜间飘绿焰)
    const geo = new THREE.BufferGeometry();
    const gp = [];
    for (let i = 0; i < 18; i++) { const a = i / 18 * 6.28, rr = 14 + (i % 5) * 4; const fx = gx + Math.cos(a) * rr, fz = gz - 6 + Math.sin(a) * rr; gp.push(fx, height(fx, fz) + 1.5 + (i % 3), fz); }
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gp), 3));
    ghostFire = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x6affa0, size: 8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false }));
    ghostFire.frustumCulled = false; ghostFire.userData = { base: Float32Array.from(gp) };
    scene.add(ghostFire);
  }
  addNpc({ x: gx - 4, z: gz + 2, name: '宁采臣', body: 0x4a5a6a, hat: 0x3a4452, day: true, face: '📖',
    lines: ['小生宁采臣,借宿一晚,天亮就走。', '此寺荒凉,夜里却似有人声……许是风吧。', '君子坦荡,不义之财分毫不取。'],
    topics: [
      { q: '你为何独宿荒寺?', a: '囊中羞涩,投宿不起客栈,便在这兰若寺廊下将就一夜。天亮即走,不叨扰。' },
      { q: '夜里听见了什么?', a: '有女子吟诗,有金铁交鸣,还有……老树咯咯的笑。小生装作没听见——君子不涉怪力乱神。' },
      { q: '若有女鬼相诱呢?', a: '(正色)富贵不能淫,鬼魅亦不能。她若真有苦衷,我倒愿意帮衬;媚我害我,断然不从。' },
    ] });
  addNpc({ x: gx + 16, z: gz - 20, name: '聂小倩', body: 0xe8e4ec, hat: 0xd8d4e0, night: true, face: '👻',
    lines: ['公子,深夜至此,不怕鬼么?', '妾身不由己……井底暗格里的东西,可否劳烦公子?', '十里平湖霜满天,寸寸青丝愁华年。'],
    topics: [
      { q: '你为何被困于此?', a: '妾十八而夭,葬于寺侧。姥姥摄我魂魄,逼我以色媚人、取生人精血……我不愿,却身不由己。' },
      { q: '如何才能救你?', a: '寺后古井井壁有暗格,藏着我的骨灰。夜里取出,葬到白杨树下阳气旺处——姥姥便再拿我无可奈何。' },
      { q: '姥姥是什么?', a: '寺后那株千年老树成的精。她的根钻进我的坟……公子若去,万莫靠得太近。' },
    ] });
  addNpc({ x: gx + 4, z: gz + 14, name: '燕赤霞', body: 0x5a4632, hat: 0x3a2c1c, night: true, opts: { tall: 1.1, cane: true }, face: '🗡️',
    lines: ['妖气!——哦,是你。夜里少在寺里走动。', '把骨灰葬到生人阳气旺处,姥姥就再拿她没办法。', '剑是直的,人心是弯的。'],
    topics: [
      { q: '你是何人?', a: '一介剑客,专收妖邪。这兰若寺阴气重,我在此已候了姥姥三年。' },
      { q: '如何对付姥姥?', a: '树妖千年道行,硬拼不易。先断她爪牙——把小倩的骨灰迁走,她少一具替身,便弱一分。' },
      { q: '画皮又是什么?', a: '(压低声)寺里混着一只画皮厉鬼。它披着好人皮,你未必认得出。看人,别只看脸。' },
    ] });
  addNpc({ x: gx + 24, z: gz + 4, name: '画皮鬼', body: 0x7a3040, hat: 0x4a1c28, night: true, face: '🎭',
    lines: ['(一位绝色女子对你嫣然一笑)', '公子,进来坐坐?奴家一个人,好怕……', '(墙上似有窸窣描画之声)'],
    topics: [
      { q: '你是人是鬼?', a: '(笑意一僵)公子说笑了……奴家自然是人。(指甲在袖中悄悄变长)' },
      { q: '墙上那张皮是什么?', a: '(脸色骤变)你……你看见了?!——罢了。世人愚昧,明明是妖,偏以为美。你算头一个看破的。' },
      { q: '为何害人?', a: '皮囊会烂,唯有活人的心头血,能让这张画皮鲜艳如初。这不叫害——叫续命。' },
    ] });
  const dk9 = height(gx, gz + 96);
  const plank9 = box(5, .5, 9, M.wood); plank9.position.set(gx, dk9 + .9, gz + 94); scene.add(plank9);
  addSpot(gx, gz + 92, 'ferry', 'ferry', { r: 8 });
  const lrsSign = makeSign('聊斋 · 兰若寺', 6.4, '#1c2026', '#a0b0c8');
  lrsSign.position.set(gx + 14, height(gx + 14, gz + 80) + 4.4, gz + 80); scene.add(lrsSign);
}
/* —— 水浒 · 梁山泊 —— */
{
  const gx = LSP.x, gz = LSP.z;
  {   // 芦苇荡(实例化)
    const reedPts = [];
    for (let i = 0; i < 90; i++) {
      const a = rnd() * Math.PI * 2, rr = 30 + rnd() * 34;
      const rx4 = gx - 30 + Math.cos(a) * rr, rz4 = gz + 20 + Math.sin(a) * rr, rh4 = height(rx4, rz4);
      if (rh4 < -.5 || rh4 > 4) continue;
      reedPts.push([rx4, rz4, rh4]);
    }
    const reedI = new THREE.InstancedMesh(new THREE.CylinderGeometry(.05, .07, 3), lam(0x9aa860), reedPts.length);
    const m4r = new THREE.Matrix4(), qr = new THREE.Quaternion(), sr = new THREE.Vector3(1, 1, 1), pr2 = new THREE.Vector3();
    reedPts.forEach(([rx4, rz4, rh4], i) => {
      qr.setFromEuler(new THREE.Euler((rnd() - .5) * .2, 0, (rnd() - .5) * .2));
      m4r.compose(pr2.set(rx4, rh4 + 1.4, rz4), qr, sr);
      reedI.setMatrixAt(i, m4r);
    });
    reedI.instanceMatrix.needsUpdate = true;
    scene.add(reedI);
  }
  pavilion({ x: gx + 30, z: gz - 30, h: height(gx + 30, gz - 30) }, { w: 26, d: 18, walls: 'back', roof: 0x8c2f24, floor: 0xc8b06a });
  {   // 替天行道大旗
    const fx3 = gx + 30, fz3 = gz - 14, fh3 = height(fx3, fz3);
    const pole2 = cyl(.2, .28, 16, M.woodDark); pole2.position.set(fx3, fh3 + 8, fz3); scene.add(pole2);
    const banner = makeSign('替天行道', 5.4, '#d4b02a', '#8c2f24');
    banner.position.set(fx3, fh3 + 13.5, fz3 + .3); scene.add(banner);
  }
  addSpot(gx + 30, gz - 22, 'lore', 'juyi', { r: 9 });
  addSpot(gx - 24, gz + 26, 'lore', 'zhangshun', { r: 7 });
  addNpc({ x: gx + 26, z: gz - 20, name: '宋江', body: 0x3a3630, hat: 0x2a2620,
    lines: ['四海之内,皆兄弟也。', '山寨替天行道,不害良民。', '(望着汴京方向,不说话)'] });
  addNpc({ x: gx + 38, z: gz - 18, name: '李逵', body: 0x2a2620, hat: 0x1c1c20, opts: { wide: 1.5 },
    lines: ['杀去东京,夺了鸟位!', '哥哥说什么就是什么!', '两把板斧,专砍不平事!'] });
  addNpc({ x: gx - 26, z: gz + 30, name: '张顺', body: 0xe8e4dc, hat: 0xd8d4c8,
    lines: ['水底伏七日七夜,不换气,你信?', '浪里白条,不是白叫的。', '这泊里的鱼,认得我。'] });
  const dk10 = height(gx + 122, gz);
  const plank10 = box(9, .5, 5, M.wood); plank10.position.set(gx + 120, dk10 + .9, gz); scene.add(plank10);
  addSpot(gx + 118, gz, 'ferry', 'ferry', { r: 8 });
  const lspSign = makeSign('水浒 · 梁山泊', 6.6, '#2a2014', '#e8d06a');
  lspSign.position.set(gx + 104, height(gx + 104, gz + 14) + 4.4, gz + 14); scene.add(lspSign);
}
/* —— 塞壬海域 —— */
{
  const rocks = [[SIR.x, SIR.z], [SIR.x - 42, SIR.z + 30], [SIR.x + 36, SIR.z - 34]];
  rocks.forEach(([rx5, rz5], i) => {
    const rh5 = height(rx5, rz5);
    const rock2 = new THREE.Mesh(new THREE.DodecahedronGeometry(6 + i), M.stone);
    rock2.position.set(rx5, rh5 + 3, rz5); rock2.rotation.y = i * 1.3; scene.add(rock2);
    cirObs.push({ x: rx5, z: rz5, r: 5 });
  });
  for (const sgn of [-1, 1]) {   // 塞壬
    const sx4 = SIR.x + sgn * 4, sz5 = SIR.z - sgn * 3, sh5 = height(sx4, sz5);
    const sBody2 = cyl(.5, .7, 1.6, lam(0x3a8a8a)); sBody2.position.set(sx4, sh5 + 6.6, sz5); scene.add(sBody2);
    const sHead = new THREE.Mesh(new THREE.SphereGeometry(.5, 9, 7), lam(0xf2c9a0)); sHead.position.set(sx4, sh5 + 7.8, sz5); scene.add(sHead);
    const sHair = new THREE.Mesh(new THREE.SphereGeometry(.55, 9, 6, 0, Math.PI * 2, 0, Math.PI / 1.8), lam(0x2a5a5a)); sHair.position.set(sx4, sh5 + 7.9, sz5); scene.add(sHair);
    const sTail = new THREE.Mesh(new THREE.ConeGeometry(.5, 2, 7), lam(0x3a8a8a)); sTail.rotation.z = 2.4; sTail.position.set(sx4 + .9, sh5 + 5.6, sz5); scene.add(sTail);
  }
  const harp = new THREE.Mesh(new THREE.TorusGeometry(.9, .12, 8, 16, Math.PI * 1.3), M.gold);
  harp.position.set(SIR.x - 2, height(SIR.x, SIR.z) + 6.6, SIR.z + 2); scene.add(harp);
  addSpot(SIR.x, SIR.z + 8, 'lore', 'sirenrock', { r: 8 });
  const oShip = makeBoat(0xd9d5c8, 1.5);
  oShip.userData = { anchor: [SIR.x - 70, SIR.z - 40] };
  const bindPole = cyl(.15, .15, 4, M.woodDark); bindPole.position.set(0, 3.4, 0); oShip.add(bindPole);
  const rope = new THREE.Mesh(new THREE.TorusGeometry(.55, .09, 6, 12), lam(0x8a6238)); rope.position.set(0, 3.2, 0); rope.rotation.x = Math.PI / 2; oShip.add(rope);
  addSpot(SIR.x - 64, SIR.z - 36, 'lore', 'odysseus', { r: 10 });
  addNpc({ x: SIR.x - 70, z: SIR.z - 32, name: '奥德修斯', body: 0x8a6238, hat: 0xb8862e,
    lines: ['把我绑紧!无论我如何哀求,都不要松绑!', '我要听完这支歌,并且——活着回伊萨卡。', '(挣扎)松开我!……不,别听我的!'] });
}
/* —— 堂吉诃德 · 风车原野 —— */
{
  const gx = FCY.x, gz = FCY.z;
  for (let i = 0; i < 3; i++) {   // 风车阵
    const wx4 = gx - 30 + i * 30, wz4 = gz - 20 + (i % 2) * 16, wh6 = height(wx4, wz4);
    const towerW = cyl(3, 4.4, 14, M.white); towerW.position.set(wx4, wh6 + 7, wz4); scene.add(towerW);
    const capW = new THREE.Mesh(new THREE.ConeGeometry(3.6, 3, 10), lam(0x8c5a2e)); capW.position.set(wx4, wh6 + 15.5, wz4); scene.add(capW);
    const blades = new THREE.Group();
    for (let b3 = 0; b3 < 4; b3++) {
      const blade = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 8), new THREE.MeshLambertMaterial({ color: 0xd9c9a0, side: THREE.DoubleSide }));
      blade.position.y = 4; blade.rotation.z = 0;
      const holder = new THREE.Group(); holder.rotation.z = b3 * Math.PI / 2; holder.add(blade);
      blades.add(holder);
    }
    blades.position.set(wx4, wh6 + 13, wz4 + 3.8);
    scene.add(blades); windmillBlades.push(blades);
    cirObs.push({ x: wx4, z: wz4, r: 4.6 });
  }
  addSpot(gx - 30, gz - 12, 'lore', 'windmill', { r: 9 });
  addSpot(gx + 14, gz + 24, 'lore', 'charge', { r: 8 });
  {   // 驽骍难得
    const hx2 = gx + 20, hz2 = gz + 28, hh4 = height(hx2, hz2);
    const hBody = box(2.6, 1.2, 1, lam(0xb8a68a)); hBody.position.set(hx2, hh4 + 1.7, hz2); scene.add(hBody);
    for (const [ox, oz] of [[-1, -.4], [1, -.4], [-1, .4], [1, .4]]) {
      const leg2 = cyl(.09, .1, 1.4, lam(0xa89678)); leg2.position.set(hx2 + ox, hh4 + .7, hz2 + oz); scene.add(leg2);
    }
    const neck = cyl(.3, .4, 1.4, lam(0xb8a68a)); neck.rotation.z = -.7; neck.position.set(hx2 + 1.7, hh4 + 2.5, hz2); scene.add(neck);
    const hHead = box(1, .5, .5, lam(0xa89678)); hHead.position.set(hx2 + 2.3, hh4 + 3, hz2); scene.add(hHead);
  }
  addNpc({ x: gx + 12, z: gz + 20, name: '堂吉诃德', body: 0x8a8a92, hat: 0x6a6a72, opts: { tall: 1.2, cane: true },
    lines: ['看!三十多个狂暴的巨人!', '命运指引我们走向比想象更伟大的冒险!', '游侠骑士受伤,从不呻吟——哪怕肠子流出来。'] });
  addNpc({ x: gx + 18, z: gz + 18, name: '桑丘', body: 0x7a5230, hat: 0x8a6238, opts: { wide: 1.4, tall: .85 },
    lines: ['大人,那真的、真的是风车。', '我的海岛总督什么时候上任?', '(掏出面包)垫垫肚子再冲,大人。'] });
  const dk11 = height(gx, gz - 116);
  const plank11 = box(5, .5, 9, M.wood); plank11.position.set(gx, dk11 + .9, gz - 114); scene.add(plank11);
  addSpot(gx, gz - 112, 'ferry', 'ferry', { r: 8 });
  const fcySign = makeSign('堂吉诃德 · 风车原野', 8, '#3a3020', '#e8d8a0');
  fcySign.position.set(gx + 14, height(gx + 14, gz - 100) + 4.4, gz - 100); scene.add(fcySign);
}
/* —— 基督山伯爵 · 伊夫堡 —— */
{
  const gx = YFB.x, gz = YFB.z, fh4 = height(gx, gz);
  const keep2 = box(24, 12, 20, M.stone); keep2.position.set(gx, fh4 + 6, gz); scene.add(keep2);
  boxObs.push({ x1: gx - 12, z1: gz - 10, x2: gx + 12, z2: gz + 10 });
  for (const [ox, oz] of [[-13, -11], [13, -11], [-13, 11], [13, 11]]) {
    const tw2 = cyl(3, 3.6, 15, M.stone); tw2.position.set(gx + ox, fh4 + 7.5, gz + oz); scene.add(tw2);
    const tc2 = new THREE.Mesh(new THREE.ConeGeometry(3.6, 3, 10), lam(0x3a3630)); tc2.position.set(gx + ox, fh4 + 16.5, gz + oz); scene.add(tc2);
    cirObs.push({ x: gx + ox, z: gz + oz, r: 3.4 });
  }
  for (let i = 0; i < 3; i++) {   // 牢窗铁栏
    const bar2 = cyl(.06, .06, 1.6, lam(0x2a2a30)); bar2.position.set(gx - 12.2, fh4 + 5, gz - 3 + i * 1 - 1); scene.add(bar2);
  }
  addSpot(gx - 15, gz - 3, 'lore', 'cell', { r: 7 });
  addSpot(gx + 30, gz + 30, 'lore', 'jumpsea', { r: 7 });
  addNpc({ x: gx - 17, z: gz + 2, name: '法利亚长老', body: 0x6a625a, hat: 0x5a544c, opts: { cane: true },
    lines: ['我用二十年凿穿了这堵墙——方向错了。', '知识是唯一没人能没收的财产。', '基督山岛,黑岩之下。替我看看海,孩子。'] });
  addNpc({ x: gx + 8, z: gz + 14, name: '狱卒', body: 0x3a3a44, hat: 0x2a2a34,
    lines: ['34 号今天又在敲墙。随他敲,反正凿不穿。', '这里进来的人,只从海里出去。', '(打了个哈欠)换班还有四小时。'] });
  {   // 小基督山
    const bh8 = height(MCD.x, MCD.z);
    const blackRock = new THREE.Mesh(new THREE.DodecahedronGeometry(5), lam(0x1c1c20));
    blackRock.position.set(MCD.x, bh8 + 2.4, MCD.z); scene.add(blackRock);
    cirObs.push({ x: MCD.x, z: MCD.z, r: 4.4 });
    makeTree(MCD.x - 8, MCD.z + 6, 1.1, null);
    addSpot(MCD.x, MCD.z + 7, 'lore', 'digtreasure', { r: 7 });
  }
  const dk12 = height(gx, gz - 92);
  const plank12 = box(5, .5, 9, M.wood); plank12.position.set(gx, dk12 + .9, gz - 90); scene.add(plank12);
  addSpot(gx, gz - 88, 'ferry', 'ferry', { r: 8 });
  const yfbSign = makeSign('基督山 · 伊夫堡', 7, '#20242e', '#a8b8d0');
  yfbSign.position.set(gx + 12, height(gx + 12, gz - 76) + 4.4, gz - 76); scene.add(yfbSign);
}
/* —— 鲁滨逊 · 绝望岛 —— */
{
  const gx = RBX.x, gz = RBX.z;
  {   // 海难船骸
    const wx5 = gx + 52, wz5 = gz + 40;
    const hull3 = box(16, 5, 6, lam(0x4a3a2a)); hull3.rotation.z = .3; hull3.rotation.y = .6; hull3.position.set(wx5, 1.6, wz5); scene.add(hull3);
    const mast3 = cyl(.25, .3, 9, M.woodDark); mast3.rotation.z = 1; mast3.position.set(wx5 - 3, 5, wz5); scene.add(mast3);
    addSpot(wx5 - 8, wz5 - 4, 'lore', 'wreck', { r: 9 });
  }
  {   // 木栅堡垒
    const bx6 = gx - 20, bz6 = gz - 16, bh9 = height(bx6, bz6);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      if (a > 1 && a < 1.8) continue;
      const log2 = cyl(.3, .35, 3.6, M.woodDark);
      log2.position.set(bx6 + Math.cos(a) * 7, bh9 + 1.8, bz6 + Math.sin(a) * 7); scene.add(log2);
      cirObs.push({ x: bx6 + Math.cos(a) * 7, z: bz6 + Math.sin(a) * 7, r: .8 });
    }
    const hut2 = box(5, 3.4, 4, lam(0x8a6238)); hut2.position.set(bx6, bh9 + 1.7, bz6); scene.add(hut2);
    cirObs.push({ x: bx6, z: bz6, r: 3.4 });
  }
  for (let i = 0; i < 3; i++) {   // 山羊
    const mgx = gx + 8 + i * 9, mgz = gz - 30 + (i % 2) * 8, mgh = height(mgx, mgz);
    const gBody2 = box(1.6, 1, .8, lam(0xe8e4dc)); gBody2.position.set(mgx, mgh + 1, mgz); scene.add(gBody2);
    const gHead2 = box(.7, .6, .5, lam(0xd8d4c8)); gHead2.position.set(mgx + 1.1, mgh + 1.5, mgz); scene.add(gHead2);
  }
  for (let i = 0; i < 5; i++) {   // 沙滩脚印
    const fpr = new THREE.Mesh(new THREE.CircleGeometry(.3, 8), new THREE.MeshBasicMaterial({ color: 0x9a8668 }));
    fpr.rotation.x = -Math.PI / 2; fpr.position.set(gx + 30 + i * 2, height(gx + 30 + i * 2, gz + 58) + .1, gz + 58 + (i % 2) * .8); scene.add(fpr);
  }
  addSpot(gx + 34, gz + 55, 'lore', 'footprint', { r: 7 });
  [[gx - 44, gz + 20], [gx + 10, gz + 46], [gx + 44, gz - 12], [gx - 8, gz - 44], [gx - 36, gz - 28]].forEach(([cx9, cz9], i) => {
    const ch3 = height(cx9, cz9);
    const crate2 = box(1.6, 1.3, 1.6, lam(0x7a5230)); crate2.rotation.y = i; crate2.position.set(cx9, ch3 + .7, cz9); scene.add(crate2);
    addSpot(cx9, cz9 + 2.4, 'lore', 'flotsam', { r: 5.5, fid: i });
  });
  addNpc({ x: gx - 16, z: gz - 8, name: '鲁滨逊', body: 0x8a6a3a, hat: 0xa88a54, opts: { wide: 1.1 },
    lines: ['木刻日历告诉我:今天是第 10220 天。大概。', '把能拆的都拆下来——包括绝望。', '集齐五箱漂流物资,我教你活下去的全部本事。'] });
  addNpc({ x: gx - 10, z: gz - 4, name: '星期五', body: 0x6a4a2a, hat: 0x4a3620,
    lines: ['主人说,今天是星期五。昨天也是。', '(指着海)大独木舟!很多人!……哦,是渡船。', '火药要省着用,鲁滨逊说的。'] });
  const dk13 = height(gx, gz - 100);
  const plank13 = box(5, .5, 9, M.wood); plank13.position.set(gx, dk13 + .9, gz - 98); scene.add(plank13);
  addSpot(gx, gz - 96, 'ferry', 'ferry', { r: 8 });
  const rbxSign = makeSign('鲁滨逊 · 绝望岛', 7, '#2a2418', '#d8c89a');
  rbxSign.position.set(gx + 12, height(gx + 12, gz - 84) + 4.4, gz - 84); scene.add(rbxSign);
}
/* —— 红楼梦 · 大观园 —— */
{
  const gx = DGY.x, gz = DGY.z;
  pavilion({ x: gx - 20, z: gz - 16, h: height(gx - 20, gz - 16) }, { w: 22, d: 16, walls: 'back', roof: 0x2e5a4a, floor: 0xd8c8a8 });
  pavilion({ x: gx + 24, z: gz - 10, h: height(gx + 24, gz - 10) }, { w: 20, d: 14, walls: 'back', roof: 0x8c2f4e, floor: 0xe0d0b0 });
  {   // 沁芳亭(水边小亭)
    const ax3 = gx + 2, az3 = gz + 26, ah3 = height(ax3, az3);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      const col2 = cyl(.22, .26, 3.6, lam(0x8c2f24)); col2.position.set(ax3 + Math.cos(a) * 3, ah3 + 1.8, az3 + Math.sin(a) * 3); scene.add(col2);
    }
    const aRoof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2.6, 6), lam(0x2e5a4a)); aRoof.position.set(ax3, ah3 + 4.8, az3); scene.add(aRoof);
    addSpot(ax3, az3 + 5.4, 'lore', 'shishe', { r: 7 });
  }
  for (let i = 0; i < 18; i++) {   // 竹影
    const bx7 = gx - 38 + (i % 6) * 3.5, bz7 = gz + 8 + Math.floor(i / 6) * 4, bh10 = height(bx7, bz7);
    const bamboo = cyl(.12, .14, 6 + (i % 3), lam(0x5a9a4a)); bamboo.position.set(bx7, bh10 + 3, bz7); scene.add(bamboo);
  }
  const pond2 = new THREE.Mesh(new THREE.CircleGeometry(8, 20), new THREE.MeshPhongMaterial({ color: 0x3d7ba6, transparent: true, opacity: .8 }));
  pond2.rotation.x = -Math.PI / 2; pond2.position.set(gx + 14, height(gx + 14, gz + 24) + .25, gz + 24); scene.add(pond2);
  {   // 葬花冢
    const zx = gx - 30, zz = gz + 34, zh = height(zx, zz);
    const mound2 = new THREE.Mesh(new THREE.SphereGeometry(1.8, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), lam(0x8a7a5a));
    mound2.position.set(zx, zh, zz); scene.add(mound2);
    for (let i = 0; i < 8; i++) {
      const petal = new THREE.Mesh(new THREE.CircleGeometry(.16, 6), new THREE.MeshBasicMaterial({ color: 0xf5b8cc, side: THREE.DoubleSide }));
      petal.rotation.x = -Math.PI / 2 + (rnd() - .5); petal.position.set(zx + (rnd() - .5) * 4, zh + .3 + rnd(), zz + (rnd() - .5) * 4); scene.add(petal);
    }
    addSpot(zx, zz + 3, 'lore', 'zanghua', { r: 6 });
  }
  addNpc({ x: gx - 28, z: gz + 30, name: '黛玉', body: 0xd8e0ec, hat: 0xb8c8dc,
    lines: ['花谢花飞花满天,红消香断有谁怜?', '你也来了?这里葬的是花,不许笑。', '质本洁来还洁去,强于污淖陷渠沟。'] });
  addNpc({ x: gx + 20, z: gz - 2, name: '宝玉', body: 0xc0392b, hat: 0xb8862e,
    lines: ['女儿是水做的骨肉,见了便清爽。', '这个妹妹,我曾见过的。', '什么金玉良缘,我偏说木石前盟!'] });
  addNpc({ x: gx + 4, z: gz + 14, name: '刘姥姥', body: 0x8a7a5a, hat: 0x6a5a40, opts: { wide: 1.2 },
    lines: ['老刘,老刘,食量大如牛!', '这园子,比画儿还好看!', '一两银子一个的鸽子蛋,滚喽!'] });
  const dk14 = height(gx, gz + 106);
  const plank14 = box(5, .5, 9, M.wood); plank14.position.set(gx, dk14 + .9, gz + 104); scene.add(plank14);
  addSpot(gx, gz + 102, 'ferry', 'ferry', { r: 8 });
  const dgySign = makeSign('红楼梦 · 大观园', 7, '#2a1c28', '#e8b8cc');
  dgySign.position.set(gx + 14, height(gx + 14, gz + 90) + 4.4, gz + 90); scene.add(dgySign);
}
/* —— 神曲 · 炼狱山(南海孤峰,七层螺旋涤七罪,山巅地上乐园) —— */
{
  const gx = PUR.x, gz = PUR.z, R2 = PUR.r * .82;
  const SINS = [
    ['purpride', '一层·傲慢', 0x6a5a4a], ['purenvy', '二层·嫉妒', 0x7a8a6a],
    ['purwrath', '三层·愤怒', 0x4a4650], ['pursloth', '四层·怠惰', 0x5a6a5a],
    ['puravar',  '五层·贪财', 0x6a5a3a], ['purglut', '六层·贪吃', 0x7a4a3a],
    ['purlust',  '七层·色欲', 0xb8482e],
  ];
  for (let k = 0; k < 7; k++) {
    const rk = k < 6 ? R2 * (1 - (k + .3) / 7) : 13, th = k * 1.15;
    const px = gx + Math.cos(th) * rk, pz = gz + Math.sin(th) * rk, py = height(px, pz);
    const stele = box(1.3, 2.6, .5, lam(SINS[k][2])); stele.position.set(px, py + 1.3, pz); scene.add(stele);
    cirObs.push({ x: px, z: pz, r: 1 });
    const sgn = makeSign(SINS[k][1], 3.6, '#2a2620', '#e6dcc4');
    sgn.position.set(px + Math.cos(th) * 2.6, py + 3, pz + Math.sin(th) * 2.6); scene.add(sgn);
    addSpot(px, pz, 'lore', SINS[k][0], { r: 6, y: py + 1 });
  }
  // 第七层火墙(色欲):一圈火焰,穿之而登顶
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2, fx = gx + Math.cos(a) * 10.5, fz = gz + Math.sin(a) * 10.5, fy = height(fx, fz);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(.6, 2.6, 6), new THREE.MeshBasicMaterial({ color: 0xff6a2a }));
    flame.position.set(fx, fy + 1.3, fz); scene.add(flame);
  }
  // 山巅:地上乐园(圣林 + 忘川/欢河两潭 + 但丁与贝雅特丽齐)
  const sy = height(gx, gz);
  for (const [ox, oz] of [[-6, -4], [5, -6], [7, 4], [-5, 5]]) {
    const tx = gx + ox, tz = gz + oz, ty = height(tx, tz);
    const trunk = cyl(.4, .6, 3.4, M.wood); trunk.position.set(tx, ty + 1.7, tz); scene.add(trunk);
    const cano = new THREE.Mesh(new THREE.SphereGeometry(2.4, 10, 8), lam(0x4a8a4a)); cano.position.set(tx, ty + 4.4, tz); scene.add(cano);
  }
  for (const [ox, oz, col] of [[-2, 2, 0x6ab0d8], [3, -1, 0x8ad0b0]]) {
    const pond = new THREE.Mesh(new THREE.CircleGeometry(2.6, 18), new THREE.MeshPhongMaterial({ color: col, transparent: true, opacity: .82 }));
    pond.rotation.x = -Math.PI / 2; pond.position.set(gx + ox, height(gx + ox, gz + oz) + .2, gz + oz); scene.add(pond);
  }
  addSpot(gx, gz, 'lore', 'eden', { r: 8, y: sy + 1 });
  addNpc({ x: gx - 3, z: gz + 3, name: '贝雅特丽齐', body: 0xf0f0e0, hat: 0x4a8a5a, opts: { tall: 1.05 },
    lines: ['看着我!我就是,我就是贝雅特丽齐。', '你怎敢踏上这座山?难道不知这里人人皆有福?', '低头饮下忘川之水,忘掉那些眼泪吧。'] });
  addNpc({ x: gx + 3, z: gz - 4, name: '但丁', body: 0x8c2f2f, hat: 0xb03a2e,
    lines: ['在人生的中途,我发现自己身处一片幽暗的森林。', '我已随维吉尔走出地狱,登临此山七层。', '那推动太阳和群星的爱啊——我终于要见到她了。'] });
  addNpc({ x: gx + 7, z: gz + 2, name: '玛蒂尔达', body: 0xe0e8d0, hat: 0xd9b26a, opts: { tall: .95 },
    lines: ['一边采花,一边唱歌——你来得正好。', '这忘川的水,饮之忘却一切罪的记忆。', '那边的欢河,饮之重拾行善的欢愉。'] });
  // 山脚:守门人卡托 + 渡口
  addNpc({ x: gx, z: gz + PUR.r - 12, name: '卡托', body: 0x9a9088, hat: 0xcfc5b4, opts: { tall: 1.1 },
    lines: ['是谁?竟从永夜的深渊逆流而上?', '去,用芦苇束腰,以露水净面——再登此山。', '自由诚可贵。我为它舍了性命——你可懂得?'] });
  addSpot(gx, gz + PUR.r - 6, 'lore', 'purgate', { r: 7 });
  const dk = height(gx, gz + PUR.r + 16);
  const plank = box(5, .5, 9, M.wood); plank.position.set(gx, dk + .9, gz + PUR.r + 16); scene.add(plank);
  addSpot(gx, gz + PUR.r + 12, 'ferry', 'ferry', { r: 8 });
  const purSign = makeSign('神曲 · 炼狱山', 7, '#1e2436', '#ccd8f0');
  purSign.position.set(gx + 12, height(gx + 12, gz + PUR.r) + 4.4, gz + PUR.r); scene.add(purSign);
}
/* —— 逍遥游 · 大鹏(可乘,扶摇直上环游诸岛) —— */
const PENG_X = 78, PENG_Z = -52;
let pengBird = null, pengWings = null;
{
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 10), lam(0x3a2a1e)); body.scale.set(1, .82, 2.3); g.add(body);
  const neck = cyl(.5, .72, 1.7, lam(0x43301e)); neck.position.set(0, .8, 2.4); neck.rotation.x = -.55; g.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.8, 10, 8), lam(0x4a3626)); head.position.set(0, 1.5, 3.2); g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(.32, 1.1, 6), lam(0xe0a02a)); beak.rotation.x = Math.PI / 2 + .3; beak.position.set(0, 1.4, 4.0); g.add(beak);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(.3, .9, 5), lam(0xc0392b)); crown.position.set(0, 2.2, 3.0); g.add(crown);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.4, 6), lam(0x2e2018)); tail.rotation.x = -Math.PI / 2; tail.position.set(0, .2, -3.2); tail.scale.set(1, .32, 1); g.add(tail);
  pengWings = [];
  for (const s of [-1, 1]) {
    const wing = new THREE.Group();
    const pane = box(7.5, .3, 3.6, lam(0x43301e)); pane.position.set(s * 4.2, 0, -.2); wing.add(pane);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(1.9, 4.4, 4), lam(0x241a10)); tip.rotation.z = -s * Math.PI / 2; tip.position.set(s * 8.8, 0, -.5); tip.scale.set(1, .35, .9); wing.add(tip);
    wing.position.set(0, .6, 0); g.add(wing); pengWings.push({ w: wing, s });
  }
  g.position.set(PENG_X, height(PENG_X, PENG_Z) + 2.4, PENG_Z);
  g.rotation.y = 2.2;
  scene.add(g); pengBird = g;
  // 栖石
  const perch = cyl(2.6, 3.4, 4, M.stone, 8); perch.position.set(PENG_X, height(PENG_X, PENG_Z), PENG_Z); scene.add(perch);
  cirObs.push({ x: PENG_X, z: PENG_Z, r: 3.2 });
  addSpot(PENG_X, PENG_Z + 4.4, 'lore', 'peng', { r: 7 });
}
const ISLES = [
  { c: SHJ, name: '山海经 · 异兽之野', icon: '🐉', theme: 'shanhai' },
  { c: THY, name: '桃花源', icon: '🌸', theme: 'taoyuan' },
  { c: ANH, name: '一千零一夜 · 巴格达', icon: '🪔', theme: 'nights' },
  { c: NEM, name: '海底两万里 · 锚地', icon: '🐚', theme: 'nautdeep' },
  { c: B612, name: 'B-612 小行星', icon: '🌹', theme: 'b612' },
  { c: JUR, name: '侏罗纪公园', icon: '🦖', theme: 'jurassic' },
  { c: HGS, name: '西游记 · 花果山', icon: '🐒', theme: 'huaguo' },
  { c: ALC, name: '爱丽丝梦游仙境', icon: '🎩', theme: 'alice' },
  { c: CBI, name: '三国 · 赤壁', icon: '🔥', theme: 'chibi' },
  { c: LRS, name: '聊斋 · 兰若寺', icon: '🏮', theme: 'lanruo' },
  { c: LSP, name: '水浒 · 梁山泊', icon: '⚔️', theme: 'liangshan' },
  { c: { x: SIR.x, z: SIR.z, r: 150 }, name: '塞壬海域', icon: '🧜‍♀️', theme: 'siren' },
  { c: FCY, name: '堂吉诃德 · 风车原野', icon: '🌀', theme: 'quixote' },
  { c: YFB, name: '基督山 · 伊夫堡', icon: '⛓️', theme: 'chateau' },
  { c: MCD, name: '小基督山(宝藏屿)', icon: '💎', theme: 'chateau' },
  { c: RBX, name: '鲁滨逊 · 绝望岛', icon: '🏝️', theme: 'crusoe' },
  { c: DGY, name: '红楼梦 · 大观园', icon: '🏮', theme: 'daguan' },
  { c: PUR, name: '神曲 · 炼狱山', icon: '⛰️', theme: 'purgatory' },
];
/* ===== 海洋文学带:数据驱动内容(每岛一份 lore/npcs/build)===== */
const NI_CONTENT = {
  mys: {
    name: '神秘岛', en: 'The Mysterious Island', icon: '🌋', theme: 'mystisle',
    desc: '林肯岛 · 工程师用科学重建文明 · 火山与神秘恩人',
    ferryMsg: '🌋 林肯岛到了。史密斯工程师说,给他一座火山,他能造出一个文明',
    lore: {
      mystvolcano: { icon: '🌋', color: '#8c3a1a', title: '富兰克林火山', en: 'Mount Franklin', hint: '登顶望全岛',
        desc: '岛心的死火山又醒了。史密斯凭它测出了纬度、烧出了陶、炼出了铁——"我们不是漂流者,是殖民者。"多年后,火山将把整座岛沉入海底。' },
      mystforge: { icon: '⚒️', color: '#5a4636', title: '花岗石宫的工场', en: 'The Chimneys', hint: '科学重建文明',
        desc: '风箱、陶窑、铁砧。五个人从一根火柴、一颗麦粒起家,造出了砖、玻璃、硝化甘油,甚至一部电报机。潘克洛夫说:"只要史密斯先生在,荒岛也是家。"' },
      mystnemo: { icon: '🐚', color: '#1c3a4a', title: '神秘的恩人', en: 'The Benefactor', hint: '是谁在暗中相助?',
        desc: '每逢绝境,总有人暗中相救:治好病的奎宁、击沉海盗船的鱼雷……直到他们潜入海底洞穴,才见到那位垂死的老人和他的钢铁潜艇——"我叫尼摩船长。"' },
    },
    spots: [[-2, -4, 'mystvolcano'], [16, -10, 'mystforge'], [-20, 16, 'mystnemo']],
    npcs: [
      { dx: -14, dz: 12, name: '史密斯工程师', body: 0x5a6a7a, hat: 0x3a4a5a, opts: { tall: 1.05 },
        lines: ['给我一座火山,我能还你一个文明。', '知识,是一个人身上抢不走的行李。', '别灰心,潘克洛夫——荒岛只是尚未开化的家。'] },
      { dx: 16, dz: -6, name: '潘克洛夫', body: 0x8a5a2a, hat: 0x6a4420, opts: { wide: 1.2 },
        lines: ['只要史密斯先生在,魔鬼来了我也不怕!', '这岛上什么都能造,就是造不出烟草……', '一根火柴!你敢信?我们的家业是从一根火柴开始的。'] },
    ],
    build: (gx, gz) => {
      const hx = gx - 14, hz = gz + 12, hh = height(hx, hz);
      const house = box(9, 5, 7, lam(0x8a8478)); house.position.set(hx, hh + 2.5, hz); scene.add(house); cirObs.push({ x: hx, z: hz, r: 5 });
      const fx = gx + 15, fz = gz - 8, fh = height(fx, fz);
      const forge = cyl(1.1, 1.4, 3.4, M.stone); forge.position.set(fx, fh + 1.7, fz); scene.add(forge);
      const chim = cyl(.5, .6, 2.6, lam(0x5a5048)); chim.position.set(fx, fh + 3.9, fz); scene.add(chim);
      const px = gx + 4, pz = gz + 18, ph = height(px, pz);
      const pole = cyl(.12, .14, 7, M.woodDark); pole.position.set(px, ph + 3.5, pz); scene.add(pole);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), new THREE.MeshLambertMaterial({ color: 0xd94040, side: THREE.DoubleSide })); flag.position.set(px + 1.2, ph + 6.2, pz); scene.add(flag);
      const glow = new THREE.PointLight(0xff6a2a, 0, 150, 2); glow.position.set(gx, height(gx, gz) + 3, gz); glow.userData.pow = 26; nightLamps.push(glow); scene.add(glow);
    },
  },
  trs: {
    name: '金银岛', en: 'Treasure Island', icon: '🏴‍☠️', theme: 'treasure',
    desc: '藏宝图 · 海盗营 · 骷髅礁 · 弗林特船长的黄金',
    ferryMsg: '🏴‍☠️ 金银岛到了。西尔弗压低嗓子:"十五个人趴在死人箱上——呦嗬嗬,还有一瓶朗姆酒。"',
    lore: {
      pirateflag: { icon: '🏴‍☠️', color: '#2a2a2a', title: '海盗营', en: 'The Stockade', hint: '黑斑与朗姆酒',
        desc: '木栅栏围起的营地,篝火没熄。弗林特的老船员们为一张藏宝图反目——递到谁手里一张涂黑的圆纸片,就是死刑判决:"黑斑"。' },
      skullrock: { icon: '💀', color: '#6a6258', title: '骷髅礁', en: 'Spy-glass Hill', hint: '藏宝图的地标',
        desc: '一块形如骷髅的礁石,正是藏宝图上的方位基准。"望远镜山"的影子指向哪里,弗林特六十万英镑的黄金就埋在哪里。' },
      treasuredig: { icon: '💰', color: '#b8862e', title: '藏宝坑(X 记号)', en: "The Treasure", hint: '按图开挖',
        desc: '藏宝图上一个朱红的 X。传说弗林特把六十万英镑埋在这三棵大树之间——不过,吉姆总觉得会不会早被人挖走了……要不,自己挖挖看?' },
    },
    spots: [[10, 14, 'pirateflag'], [-18, -12, 'skullrock'], [0, -2, 'treasuredig']],
    npcs: [
      { dx: 8, dz: 12, name: '高个约翰·西尔弗', body: 0x4a5a3a, hat: 0x2e2a24, opts: { tall: 1.06, cane: true },
        lines: ['呦嗬嗬,还有一瓶朗姆酒!', '我这条腿,是在英国海军里丢的——霍金斯,做海盗要趁早。', '死人不咬人。可我偏偏留着你这小鬼的命,你说怪不怪?'] },
      { dx: -6, dz: 8, name: '吉姆·霍金斯', body: 0x9c640c, hat: 0x7d5109, opts: { tall: .74 },
        lines: ['我从苹果桶里,听见了他们全部的密谋。', '西尔弗又坏又好,我到现在也没想明白。', '八个里亚尔!八个里亚尔!——那是弗林特船长的鹦鹉在叫。'] },
    ],
    build: (gx, gz) => {
      const sx = gx + 10, sz = gz + 14, sh = height(sx, sz);
      for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; const post = cyl(.2, .24, 2.6, M.woodDark); post.position.set(sx + Math.cos(a) * 6, sh + 1.3, sz + Math.sin(a) * 6); scene.add(post); }
      const kx = gx - 18, kz = gz - 12, kh = height(kx, kz);
      const skull = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 8), M.stone); skull.position.set(kx, kh + 1.6, kz); scene.add(skull); cirObs.push({ x: kx, z: kz, r: 2.4 });
      for (const ox of [-3.2, 3.2]) { const boat = box(2, .5, 5, lam(0x7a4a26)); boat.position.set(gx + ox + 4, height(gx + 4, gz - 20) + .6, gz - 20); scene.add(boat); }
      for (const [tx, tz] of [[-3, -4], [3, -5], [0, 1]]) { const t = gx + tx * 2, u = gz + tz * 2, th = height(t, u); const tr = cyl(.5, .7, 5, M.wood); tr.position.set(t, th + 2.5, u); scene.add(tr); const cn = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 6), lam(0x4a7a3a)); cn.position.set(t, th + 6, u); scene.add(cn); }
      const xg = new THREE.Group(); for (const r of [-1, 1]) { const b = box(2.6, .12, .4, lam(0x8c2f2f)); b.rotation.y = r * .78; xg.add(b); } xg.position.set(gx, height(gx, gz) + .2, gz); scene.add(xg);
    },
  },
  chr: {
    name: '无人生还岛', en: 'And Then There Were None', icon: '🔪', theme: 'mystery',
    desc: '士兵岛 · 暴风雨封岛 · 十位客人 · 一首童谣',
    ferryMsg: '🔪 士兵岛到了。管家说:"欧文先生临时有事,今晚不到。请各位……先在客厅坐坐。"(送你来的船,不会再回头了)',
    lore: {
      tensoldiers: { icon: '🪆', color: '#4a4650', title: '十个小瓷兵', en: 'Ten Little Soldiers', hint: '数一数,少了几个',
        desc: '餐桌中央,十个瓷制小士兵,配着墙上那首童谣:"十个小兵人,外出去用餐;一个被噎死,还剩九个人……"每死一位客人,桌上就少一个瓷兵。现在还剩几个?你数了数,心里一凉。' },
      chrmansion: { icon: '🏚️', color: '#3a3a44', title: '孤岛庄园', en: 'Soldier Island House', hint: '暴风雨困住了所有人',
        desc: '一座现代派的白色宅邸,孤悬海中。八位素不相识的客人被一封信骗来,加上一对管家夫妇——共十人。留声机忽然响起,一个声音逐一念出他们隐秘的旧罪。窗外,暴风雨封死了归路。' },
    },
    spots: [[0, 3, 'tensoldiers'], [0, -8, 'chrmansion']],
    npcs: [
      { dx: -8, dz: -2, name: '沃格雷夫法官', body: 0x3a3a44, hat: 0x2a2a30, opts: { tall: 1.04 },
        lines: ['我审了一辈子案子。有些人,法律碰不到——但正义可以。', '别慌。恐惧,才是这座岛真正的凶手。', '童谣不会说谎。下一个,该轮到谁了?'] },
      { dx: 7, dz: 4, name: '维拉', body: 0x8c6a9a, hat: 0x6a4a78, opts: { tall: .96 },
        lines: ['我没有……那个孩子是自己游出去的,不是我!', '每念完一句童谣,就有人再也醒不来。', '我数过了,瓷兵又少了一个。是谁?是谁干的?'] },
    ],
    build: (gx, gz) => {
      const mx = gx, mz = gz - 8, mh = height(mx, mz);
      const manor = box(16, 7, 11, lam(0xe6e2d8)); manor.position.set(mx, mh + 3.5, mz); scene.add(manor); cirObs.push({ x: mx, z: mz, r: 8 });
      const roof = box(17, .6, 12, lam(0x4a4650)); roof.position.set(mx, mh + 7.3, mz); scene.add(roof);
      for (const ox of [-5, 0, 5]) { const win = box(1.6, 2, .2, new THREE.MeshBasicMaterial({ color: 0x2a2a34 })); win.position.set(mx + ox, mh + 3.4, mz + 5.6); scene.add(win); }
      const tx = gx, tz = gz + 3, th2 = height(tx, tz);
      const tbl = cyl(2.2, 2.2, .3, lam(0x5a4636), 16); tbl.position.set(tx, th2 + 1.2, tz); scene.add(tbl);
      for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; const sol = cyl(.14, .18, .7, lam(0xe0dccc)); sol.position.set(tx + Math.cos(a) * 1.4, th2 + 1.7, tz + Math.sin(a) * 1.4); scene.add(sol); }
    },
  },
  tmp: {
    name: '暴风雨岛', en: 'The Tempest', icon: '⛈️', theme: 'tempest',
    desc: '普洛斯彼罗的魔法岛 · 精灵爱丽儿 · 一场召唤的风暴',
    ferryMsg: '⛈️ 魔法岛到了。海面的风暴是假的——普洛斯彼罗只想把仇人请上岸,而非淹死他们',
    lore: {
      prospero: { icon: '📖', color: '#3a2a5a', title: '普洛斯彼罗的魔法书', en: "Prospero's Book", hint: '法力尽在此书',
        desc: '被弟弟篡位、放逐荒岛的米兰公爵,在这里研习魔法十二年。他召来一场暴风雨,把仇人的船引到岸边。"我要折断我的法杖,把魔法书沉入海底——比铅锤到不了的深处。"宽恕,比复仇更难。' },
      ariel: { icon: '🧚', color: '#4a8ab0', title: '精灵爱丽儿', en: 'Ariel', hint: '风与火的仆役',
        desc: '被囚在裂松里十二年,普洛斯彼罗放它出来,它便化作风暴、火焰、水中的女妖,替主人办事,只求一样:自由。"我全心全意为你效劳——但请记得你的承诺:还我自由。"' },
    },
    spots: [[0, 2, 'prospero'], [12, -8, 'ariel']],
    npcs: [
      { dx: -3, dz: 4, name: '普洛斯彼罗', body: 0x4a3a6a, hat: 0x2e2450, opts: { tall: 1.08, cane: true },
        lines: ['我们本是造梦的材料,短短一生,前后都环绕在睡眠里。', '稀有的德性,比之报复,是更高贵的行为。', '爱丽儿,把风暴收了吧——我要的不是他们的命,是他们的悔。'] },
      { dx: 6, dz: 6, name: '米兰达', body: 0xd8c4e0, hat: 0xb89ac8, opts: { tall: .98 },
        lines: ['啊,新奇的世界,竟有这样出色的人物!', '父亲,您施法的时候,总是这样温柔又可怕。', '我从没见过男人——除了你,和那个梦里的青年。'] },
    ],
    build: (gx, gz) => {
      const cy = height(gx, gz);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(5, .3, 8, 24), new THREE.MeshBasicMaterial({ color: 0x8a6ad0 })); ring.rotation.x = Math.PI / 2; ring.position.set(gx, cy + .3, gz); scene.add(ring);
      const ped = cyl(.7, .9, 1.6, M.stone); ped.position.set(gx, cy + .8, gz); scene.add(ped);
      const book = box(1.2, .3, .9, lam(0x6a2a8a)); book.position.set(gx, cy + 1.75, gz); scene.add(book);
      const cx = gx - 16, cz = gz + 10, ch = height(cx, cz);
      const cave = new THREE.Mesh(new THREE.SphereGeometry(4, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), lam(0x4a4636)); cave.position.set(cx, ch, cz); scene.add(cave); cirObs.push({ x: cx, z: cz, r: 3.4 });
      const cloud = new THREE.Mesh(new THREE.SphereGeometry(9, 10, 8), new THREE.MeshLambertMaterial({ color: 0x4a4a58, transparent: true, opacity: .75 })); cloud.scale.set(1.6, .5, 1.6); cloud.position.set(gx, cy + 34, gz); scene.add(cloud);
      for (const ox of [-2, 2]) { const wr = box(2, .5, 6, lam(0x6a4a2a)); wr.rotation.z = .3; wr.position.set(gx + 22 + ox, height(gx + 22, gz - 24) + .4, gz - 24); scene.add(wr); }
    },
  },
  mor: {
    name: '莫罗博士岛', en: 'The Island of Doctor Moreau', icon: '🧪', theme: 'moreau',
    desc: '兽形实验岛 · 痛苦之屋 · 兽人律法(我们不是人吗?)',
    ferryMsg: '🧪 诺布尔岛到了。空气里有防腐剂和野兽的味道。莫罗说:"这里做的是造物主的工作。"',
    lore: {
      morlaw: { icon: '📜', color: '#5a4a3a', title: '兽人律法', en: 'The Law', hint: '"我们不是人吗?"',
        desc: '兽人们围坐诵念律法者的教条:"不许四脚爬行——我们不是人吗?不许吸血——我们不是人吗?不许追逐旁人——我们不是人吗?"念律法,是为了压住体内正在苏醒的兽性。' },
      morhouse: { icon: '🔬', color: '#4a5a5a', title: '痛苦之屋', en: 'The House of Pain', hint: '实验室(别在夜里靠近)',
        desc: '铁皮屋顶的实验室,门后传出的哀嚎让人脊背发凉。莫罗用活体解剖把野兽塑成人形——不用麻药。"疼痛?那不过是造物过程里,一点必要的杂音。"入夜,他的造物们会想起自己曾是什么。' },
    },
    spots: [[0, 6, 'morlaw'], [-12, -8, 'morhouse']],
    npcs: [
      { dx: -10, dz: -4, name: '莫罗博士', body: 0xe0dcd2, hat: 0xc8c4ba, opts: { tall: 1.08 },
        lines: ['我研究的是生命可塑的极限。', '痛苦?再过一两百年,人类会觉得那不值一提。', '这些造物一犯错,就得回痛苦之屋——律法必须刻进血里。'] },
      { dx: 8, dz: 6, name: '念律法者', body: 0x6a5a4a, hat: 0x4a3a2a, opts: { tall: .9, wide: 1.2 },
        lines: ['不许四脚爬行——我们,不是人吗?', '他的是造物之手,他的是伤人之手,他的是治愈之手。', '入夜了……律法,越来越难念下去了。'] },
    ],
    build: (gx, gz) => {
      const lx = gx - 12, lz = gz - 8, lh = height(lx, lz);
      const lab = box(11, 5, 8, lam(0x9a9a8a)); lab.position.set(lx, lh + 2.5, lz); scene.add(lab); cirObs.push({ x: lx, z: lz, r: 6 });
      const labr = box(12, .5, 9, lam(0x6a6a5a)); labr.position.set(lx, lh + 5.2, lz); scene.add(labr);
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, r = 16; const post = cyl(.16, .2, 2.4, M.woodDark); const fx = gx + Math.cos(a) * r, fz = gz + Math.sin(a) * r; post.position.set(fx, height(fx, fz) + 1.2, fz); scene.add(post); }
      for (const [hx, hz] of [[10, 8], [14, -2], [6, 12]]) { const hut = cyl(2, 2.4, 2.6, lam(0x7a5a3a), 6); const u = gx + hx, v = gz + hz, hh = height(u, v); hut.position.set(u, hh + 1.3, v); scene.add(hut); const top = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.6, 6), lam(0x5a4028)); top.position.set(u, hh + 3.4, v); scene.add(top); }
    },
  },
  dol: {
    name: '蓝色海豚岛', en: 'Island of the Blue Dolphins', icon: '🐬', theme: 'dolphin',
    desc: '海獭 · 独木舟 · 鲸骨屋 · 一个女孩十八年的独处',
    ferryMsg: '🐬 蓝色海豚岛到了。潮声很轻。卡拉娜独自在这里生活了十八年,与海獭、海鸟为伴',
    lore: {
      karana: { icon: '🐚', color: '#2a7a8a', title: '卡拉娜的鲸骨屋', en: "Karana's House", hint: '一个人的岛',
        desc: '族人乘船离开时,她为寻找弟弟跳下了船——弟弟却被野狗咬死了。此后十八年,她独自守着这座岛:用鲸骨围篱,用海象牙做鱼钩,缝一条鸬鹚羽毛的裙子。她不再猎杀,只是学着与万物共处。' },
      otterbay: { icon: '🦦', color: '#3a6a5a', title: '海獭湾', en: 'The Otter Cove', hint: '与海獭为友',
        desc: '海獭在海藻里翻滚、用石头砸开贝壳。曾经她为报仇猎杀过它们,后来却给受伤的头领海獭取名"獠牙",一勺一勺喂它。孤独教会她:海岛上的每一条命,都值得温柔。' },
    },
    spots: [[0, 4, 'karana'], [14, -10, 'otterbay']],
    npcs: [
      { dx: -3, dz: 6, name: '卡拉娜', body: 0x2e6a7a, hat: 0x1a4a5a, opts: { tall: .96 },
        lines: ['我留下了,为了弟弟——可我终究只剩自己。', '这座岛给我食物、衣裳,还有说话的伙伴:海獭、海鸟、还有风。', '若有一天船再来,我该走吗?我竟有些舍不得了。'] },
    ],
    build: (gx, gz) => {
      const kx = gx, kz = gz + 4, kh = height(kx, kz);
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; const rib = cyl(.12, .16, 2.2 + Math.sin(a * 2) * .4, lam(0xe8e2d4)); rib.position.set(kx + Math.cos(a) * 3, kh + 1.1, kz + Math.sin(a) * 3); rib.rotation.z = Math.cos(a) * .3; scene.add(rib); }
      const canoe = box(1.6, .5, 5, lam(0x6a4a2a)); canoe.position.set(gx + 12, height(gx + 12, gz - 12) + .5, gz - 12); scene.add(canoe);
      for (let i = 0; i < 5; i++) { const kelp = cyl(.1, .12, 3, lam(0x2a6a4a)); const u = gx + 12 + (rnd() - .5) * 10, v = gz - 18 - rnd() * 6; kelp.position.set(u, .6, v); scene.add(kelp); }
      for (const [sx, sz] of [[-6, 8], [5, 10], [8, 2]]) { const sh = new THREE.Mesh(new THREE.SphereGeometry(.5, 8, 6), lam(0xf0e6d0)); const u = gx + sx, v = gz + sz; sh.position.set(u, height(u, v) + .3, v); scene.add(sh); }
    },
  },
  fly: {
    name: '蝇王', en: 'Lord of the Flies', icon: '🐚', theme: 'golding',
    desc: '童岛 · 海螺号角 · 信号火堆 · 岛上没有怪物,怪物在人心',
    ferryMsg: '🐚 一群孩子流落的荒岛。海螺还在,可召集会的规矩,正在一寸寸崩塌',
    lore: {
      flyconch: { icon: '🐚', color: '#d8b46a', title: '海螺', en: 'The Conch', hint: '谁拿着它,谁说话',
        desc: '拉尔夫吹响这枚白色海螺,把散落沙滩的孩子召到一起——"拿着海螺的人才能发言"。文明,一度就系在这枚贝壳上。后来海螺碎了,规矩也碎了。' },
      flybeast: { icon: '🔥', color: '#8c3a1a', title: '信号火堆', en: 'The Signal Fire', hint: '别让火灭了',
        desc: '山顶的火堆,是他们回家的唯一指望。可孩子们宁愿去打猎、去跳舞、去害怕那头并不存在的"野兽"。西蒙说出了真相:野兽,就是我们自己。没人听。' },
    },
    spots: [[0, 4, 'flyconch'], [-2, -8, 'flybeast']],
    npcs: [
      { dx: -4, dz: 6, name: '拉尔夫', body: 0xd9c34a, hat: 0xb8a030, opts: { tall: .8 },
        lines: ['我们得有规矩!拿着海螺才能说话。', '火堆不能灭——那是我们唯一能回家的办法。', '我在哭,为童年的终结,为人心的黑暗。'] },
      { dx: 5, dz: 5, name: '猪崽子', body: 0xc86a6a, hat: 0x9a4a4a, opts: { wide: 1.3, tall: .78 },
        lines: ['我的眼镜!没了它我什么都看不见——火也生不起来。', '到底是做人好,还是做打猎的野人好?', '拉尔夫,他们把海螺当回事的时候,一切还都好好的。'] },
    ],
    build: (gx, gz) => {
      const cx = gx, cz = gz + 4, ch = height(cx, cz);
      const rock = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 6), M.stone); rock.position.set(cx, ch + .8, cz); scene.add(rock);
      const conch = new THREE.Mesh(new THREE.SphereGeometry(.6, 8, 6), lam(0xe8d090)); conch.scale.set(1, 1.4, 1); conch.position.set(cx, ch + 2, cz); scene.add(conch);
      const fx = gx - 2, fz = gz - 8, fh = height(fx, fz);
      for (let i = 0; i < 5; i++) { const log = cyl(.2, .24, 3, M.woodDark); log.rotation.z = Math.PI / 2; log.rotation.y = i / 5 * 3.14; log.position.set(fx, fh + .4, fz); scene.add(log); }
      for (let i = 0; i < 4; i++) { const fl = new THREE.Mesh(new THREE.ConeGeometry(.5, 1.8, 6), new THREE.MeshBasicMaterial({ color: 0xff7a2a })); fl.position.set(fx + (rnd() - .5) * 1.4, fh + 1.4, fz + (rnd() - .5) * 1.4); scene.add(fl); }
      const fire = new THREE.PointLight(0xff7a2a, 0, 90, 2); fire.position.set(fx, fh + 2, fz); fire.userData.pow = 20; nightLamps.push(fire); scene.add(fire);
      for (const [mx, mz] of [[8, 6], [11, -2], [6, 10]]) { const u = gx + mx, v = gz + mz, mh = height(u, v); const stake = cyl(.1, .12, 2.4, M.woodDark); stake.position.set(u, mh + 1.2, v); scene.add(stake); const mask = new THREE.Mesh(new THREE.SphereGeometry(.5, 8, 6), lam(0xc23a2a)); mask.position.set(u, mh + 2.6, v); scene.add(mask); }
    },
  },
  uto: {
    name: '乌托邦', en: 'Utopia', icon: '🏛️', theme: 'utopia',
    desc: '理想国岛 · 五十四座一模一样的城 · 以黄金为溺器',
    ferryMsg: '🏛️ 乌托邦到了。这里没有私产、没有货币,人人劳作六小时——你会觉得完美,还是害怕?',
    lore: {
      utocity: { icon: '🏛️', color: '#7a8a9a', title: '规划之城', en: 'The Ideal City', hint: '五十四城,一模一样',
        desc: '拉斐尔说:岛上五十四座城,街道、房屋、制度分毫不差,走遍一城便识全国。家家十年一换房,门不上锁——因为无物可偷。整齐得令人安心,也令人不寒而栗。' },
      utogold: { icon: '🪙', color: '#b8862e', title: '夜壶里的黄金', en: 'Gold Chamber-pots', hint: '他们蔑视黄金',
        desc: '乌托邦人把金银打成夜壶和囚犯的镣铐,让孩子拿珠宝当玩具——好让人从小就瞧不起它。"我们不明白,为何有人甘愿为一点会发光的金属,把自己活成奴隶。"' },
    },
    spots: [[0, 4, 'utocity'], [14, -8, 'utogold']],
    npcs: [
      { dx: -4, dz: 6, name: '拉斐尔', body: 0x5a7a8a, hat: 0x3a5a6a, opts: { tall: 1.05, cane: true },
        lines: ['我周游过那座岛。那里没有钱,却什么都不缺。', '哪里有私有财产,哪里就难有公正与繁荣。', '完美的制度,代价是每个人都长得一样。你愿意吗?'] },
      { dx: 8, dz: 8, name: '乌托邦市民', body: 0x8a9aa8, hat: 0x6a7a88,
        lines: ['我们每天劳作六小时,其余时间读书、听讲、种花。', '黄金?我家的夜壶就是金的。', '门不必上锁——十年之后,这房子就是别家的了。'] },
    ],
    build: (gx, gz) => {
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
        const u = gx - 18 + c * 12, v = gz - 12 + r * 12, hh = height(u, v);
        const house = box(7, 4, 6, lam(0xd8d2c4)); house.position.set(u, hh + 2, v); scene.add(house);
        const rf = new THREE.Mesh(new THREE.ConeGeometry(5, 2.4, 4), lam(0x8a9098)); rf.rotation.y = Math.PI / 4; rf.position.set(u, hh + 5.2, v); scene.add(rf);
      }
      const hx = gx, hz = gz + 20, hh2 = height(hx, hz);
      const hall = cyl(6, 6.6, 6, lam(0xe6e0d2), 12); hall.position.set(hx, hh2 + 3, hz); scene.add(hall); cirObs.push({ x: hx, z: hz, r: 6.6 });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(6, 14, 10, 0, 6.283, 0, Math.PI / 2), lam(0xbfae6a)); dome.position.set(hx, hh2 + 6, hz); scene.add(dome);
    },
  },
  hux: {
    name: '帕拉岛', en: 'Island (Huxley)', icon: '🧘', theme: 'awaken',
    desc: '醒觉岛 · 会说话的鸟 · 解脱与当下 · 没有战斗,只有理解',
    ferryMsg: '🧘 帕拉到了。树上的八哥一遍遍提醒:"注意——此时,此地。"',
    lore: {
      mynah: { icon: '🐦', color: '#3a6a5a', title: '会说话的八哥', en: 'The Mynah Birds', hint: '注意!此时此地',
        desc: '满岛的八哥被训练只说两句话:"注意!""此时,此地,伙计们!"帕拉人让鸟儿替他们记着——别活在悔恨的过去或焦虑的将来,就活在这一刻。' },
      moksha: { icon: '🌸', color: '#8a5a9a', title: '解脱之药', en: 'The Moksha-medicine', hint: '冥想与觉知',
        desc: '一种取自蘑菇的圣药,一年服用几回,让人短暂窥见万物一体的实相。帕拉把东方的禅、西方的科学、身体的觉知揉在一起,教人如何清醒地活、也清醒地死。' },
    },
    spots: [[0, 4, 'mynah'], [12, -6, 'moksha']],
    npcs: [
      { dx: -3, dz: 6, name: '苏珊娜医生', body: 0xd8c4d0, hat: 0x9a7a9a, opts: { tall: 1.0 },
        lines: ['注意,此时此地——这是我们全部的功课。', '我们既不否认痛苦,也不沉溺其中;我们只是看着它。', '你从哪个焦虑的世界来?在这里,先学会呼吸。'] },
      { dx: 7, dz: 5, name: '威尔', body: 0x6a7a6a, hat: 0x4a5a4a,
        lines: ['我原是来搞石油生意的,却在这里第一次学会活着。', '那只鸟说得对:注意。我半辈子都没真正"注意"过。', '也许这样温柔的乌托邦,终究挡不住外面的坦克……但今天,还有今天。'] },
    ],
    build: (gx, gz) => {
      const px = gx, pz = gz + 4, ph = height(px, pz);
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; const col = cyl(.2, .24, 3.4, lam(0xc8a878)); col.position.set(px + Math.cos(a) * 4, ph + 1.7, pz + Math.sin(a) * 4); scene.add(col); }
      const roof = new THREE.Mesh(new THREE.ConeGeometry(5.4, 2.6, 6), lam(0xa86a4a)); roof.position.set(px, ph + 4.8, pz); scene.add(roof);
      const pond = new THREE.Mesh(new THREE.CircleGeometry(4, 20), new THREE.MeshPhongMaterial({ color: 0x4a8ab0, transparent: true, opacity: .82 })); pond.rotation.x = -Math.PI / 2; pond.position.set(gx + 12, height(gx + 12, gz + 8) + .2, gz + 8); scene.add(pond);
      for (const [tx, tz] of [[-12, -6], [10, -8], [14, 6]]) { const u = gx + tx, v = gz + tz, th = height(u, v); const tr = cyl(.3, .4, 4, M.wood); tr.position.set(u, th + 2, v); scene.add(tr); const cn = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 6), lam(0x4a8a5a)); cn.position.set(u, th + 5, v); scene.add(cn); const bird = new THREE.Mesh(new THREE.SphereGeometry(.3, 6, 5), lam(0x2a2a2a)); bird.position.set(u, th + 6.4, v); scene.add(bird); }
    },
  },
  gul: {
    name: '格列佛群岛', en: "Gulliver's Travels", icon: '👣', theme: 'gulliver',
    desc: '尺寸错位 · 小人国利立浦特 · 飞岛国拉普达 · 荒诞政治讽刺',
    ferryMsg: '👣 利立浦特到了。小心脚下——这里的人只有你的手指高,却为"鸡蛋从哪头敲"打了三十六个月的仗',
    lore: {
      lilliput: { icon: '🥚', color: '#6a8a4a', title: '小人国', en: 'Lilliput', hint: '大端派 vs 小端派',
        desc: '一寸高的小人,却有一寸高的党争:朝廷分"高跟党"与"低跟党",邻国因"敲鸡蛋该从大头还是小头"与之血战多年。格列佛一泡尿浇灭了皇宫大火,却因此获罪——救驾有功,弄脏御所有罪。' },
      laputa: { icon: '🛸', color: '#8a8a9a', title: '飞岛拉普达', en: 'Laputa', hint: '沉思到需要人拍醒',
        desc: '一座浮在空中的圆岛,住着满脑子数学与音乐、却生活不能自理的学者。他们沉思得太深,需仆人拿气囊拍打嘴巴和耳朵才想起该说话、该听话。楼下的科学院,正忙着从黄瓜里提取阳光。' },
    },
    spots: [[0, 3, 'lilliput'], [16, -10, 'laputa']],
    npcs: [
      { dx: -6, dz: 6, name: '利立浦特皇帝', body: 0xc23a3a, hat: 0xf2d13c, opts: { tall: .4 },
        lines: ['宇宙的欢乐、万民的恐怖——朕,欢迎你这座"人山"。', '敲鸡蛋,必须从小头敲!此乃祖制!', '你救驾有功……但你在御花园撒尿,该当何罪?'] },
      { dx: 8, dz: 7, name: '拉普达学者', body: 0x8a8a9a, hat: 0x5a5a6a, opts: { tall: 1.02 },
        lines: ['请稍候……(仆人拍了他一下)……哦,你说什么?', '我正从这根黄瓜里,提取封存的阳光。', '实用之学?粗鄙!我们只研究纯粹而无用的真理。'] },
    ],
    build: (gx, gz) => {
      for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { const u = gx - 16 + c * 6, v = gz - 8 + r * 6, hh = height(u, v); const h2 = box(1.6, 1.2, 1.4, lam([0xd8b088, 0xc8a878, 0xe0c498][(r + c) % 3])); h2.position.set(u, hh + .6, v); scene.add(h2); const rf = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1, 4), lam(0x9a4a3a)); rf.rotation.y = .78; rf.position.set(u, hh + 1.7, v); scene.add(rf); }
      const palace = box(3, 2.4, 2.6, lam(0xe8d8b0)); palace.position.set(gx, height(gx, gz) + 1.2, gz); scene.add(palace);
      const lx = gx + 16, lz = gz - 10, lh = height(lx, lz) + 28;
      const disc = cyl(9, 7, 2.4, M.stone, 16); disc.position.set(lx, lh, lz); scene.add(disc);
      const ltop = new THREE.Mesh(new THREE.SphereGeometry(3, 12, 8), lam(0x8a8a9a)); ltop.position.set(lx, lh + 2.4, lz); scene.add(ltop);
      const lens = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8), new THREE.MeshBasicMaterial({ color: 0xbfd0e0 })); lens.position.set(lx, lh - 2, lz); scene.add(lens);
    },
  },
  nvl: {
    name: '梦幻岛', en: 'Neverland', icon: '🧚', theme: 'neverland',
    desc: '永不长大岛 · 地下之家 · 美人鱼礁湖 · 飞行(原创致敬)',
    ferryMsg: '🧚 梦幻岛到了。这里的孩子永远长不大——第二颗星向右转,一直飞到天亮',
    lore: {
      lostchildren: { icon: '🌳', color: '#3a5a3a', title: '地下之家', en: 'The Hollow Tree', hint: '长不大的孩子们',
        desc: '一棵空心大树通向地下的家,住着一群从婴儿车里掉出来、没人认领的孩子。他们打海盗、追美人鱼、听那位会飞的少年吹排笛——只是,谁也说不清自己在这儿待了多久。因为在这里,时间是不长个子的。' },
      mermaidlagoon: { icon: '🧜', color: '#2a7a8a', title: '美人鱼礁湖', en: 'The Lagoon', hint: '午后的礁湖别久留',
        desc: '正午的礁湖,美人鱼们在礁石上梳头晒太阳,美得让人挪不开眼;可一到日落,湖水就泛起危险的幽光。她们并不友善——会笑着把爱听故事的人往水里拖。' },
    },
    spots: [[0, 4, 'lostchildren'], [16, -8, 'mermaidlagoon']],
    npcs: [
      { dx: -4, dz: 6, name: '长不大的少年', body: 0x3a7a3a, hat: 0x2a5a2a, opts: { tall: .82 },
        lines: ['死亡,将是一场了不起的大冒险!', '你只要想着快乐的事,就能飞起来。', '我不想长大,永远都不想——来,和我们一起吧?'] },
      { dx: 7, dz: 5, name: '钩子船长', body: 0x8c2f4e, hat: 0x2a2a2a, opts: { tall: 1.06, cane: true },
        lines: ['听……那滴答声。那条吞了我一只手的鳄鱼,又来了。', '好风度!那才是最要紧的。', '总有一天,我要让那个会飞的臭小子付出代价。'] },
    ],
    build: (gx, gz) => {
      const tx = gx, tz = gz + 4, th = height(tx, tz);
      const trunk = cyl(2.2, 2.8, 7, M.wood, 10); trunk.position.set(tx, th + 3.5, tz); scene.add(trunk); cirObs.push({ x: tx, z: tz, r: 2.8 });
      const cano = new THREE.Mesh(new THREE.SphereGeometry(5, 12, 9), lam(0x3a7a3a)); cano.position.set(tx, th + 8.5, tz); scene.add(cano);
      const lag = new THREE.Mesh(new THREE.CircleGeometry(6, 22), new THREE.MeshPhongMaterial({ color: 0x2a9ab0, transparent: true, opacity: .82 })); lag.rotation.x = -Math.PI / 2; lag.position.set(gx + 16, height(gx + 16, gz - 8) + .2, gz - 8); scene.add(lag);
      const ship = makeBoat(0x8c2f4e, .9); ship.userData = { anchor: [gx + 20, gz + 16] };
      for (const [rx, rz] of [[13, -12], [19, -5]]) { const rock = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 6), M.stone); const u = gx + rx, v = gz + rz; rock.position.set(u, height(u, v) + .8, v); scene.add(rock); }
    },
  },
  cor: {
    name: '珊瑚岛', en: 'The Coral Island', icon: '🐠', theme: 'coral',
    desc: '少年珊瑚岛 · 环礁潟湖 · 热带果林 · 潜水与冒险',
    ferryMsg: '🐠 珊瑚岛到了。三个遇船难的少年在这片环礁上,过着他们此生最快活的日子',
    lore: {
      coralreef: { icon: '🐠', color: '#2a8aa0', title: '环礁潟湖', en: 'The Lagoon', hint: '潜进珊瑚花园',
        desc: '一圈珊瑚礁围出平静的潟湖,水清得能看见海底的花园:紫的脑珊瑚、红的扇珊瑚,鱼群像碎金一样穿梭。拉尔夫屏一口气潜下去,发现了一个连海盗都不知道的水下岩洞。' },
      coralboys: { icon: '🥥', color: '#8a6a3a', title: '少年们的营地', en: 'The Castaways', hint: '椰子、烤鱼与冒险',
        desc: '拉尔夫、杰克、彼得金——三个英国少年在这荒岛上分工合作:砍椰子、造独木舟、烤鱼、躲海盗。没有大人,没有争吵,只有一场接一场的冒险。这是荒岛文学里,最阳光的一座岛。' },
    },
    spots: [[0, 4, 'coralreef'], [-12, -6, 'coralboys']],
    npcs: [
      { dx: -4, dz: 6, name: '彼得金', body: 0xe0a83a, hat: 0xb88420, opts: { tall: .8 },
        lines: ['又是烤鱼!不过说真的,我一辈子没这么快活过。', '拉尔夫潜水,杰克啥都会,我嘛——负责逗大家笑。', '海盗要是敢来,咱们就用椰子砸他个落花流水!'] },
    ],
    build: (gx, gz) => {
      const lag = new THREE.Mesh(new THREE.CircleGeometry(8, 24), new THREE.MeshPhongMaterial({ color: 0x2ab0c0, transparent: true, opacity: .8 })); lag.rotation.x = -Math.PI / 2; lag.position.set(gx, height(gx, gz) + .2, gz); scene.add(lag);
      for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; const cor = new THREE.Mesh(new THREE.ConeGeometry(.8, 1.6, 5), lam([0xe86a8a, 0xd94040, 0xe0a040, 0x8a4ab0][i % 4])); const u = gx + Math.cos(a) * 9.5, v = gz + Math.sin(a) * 9.5; cor.position.set(u, height(u, v) + .8, v); scene.add(cor); }
      for (const [tx, tz] of [[-12, -6], [12, -8], [10, 8], [-10, 8]]) { const u = gx + tx, v = gz + tz, th = height(u, v); const tr = cyl(.28, .4, 5.5, M.wood); tr.rotation.z = (rnd() - .5) * .3; tr.position.set(u, th + 2.7, v); scene.add(tr); const fr = new THREE.Mesh(new THREE.SphereGeometry(2, 7, 5), lam(0x4a9a4a)); fr.scale.set(1.4, .7, 1.4); fr.position.set(u, th + 5.6, v); scene.add(fr); }
      const raft = box(3, .4, 4, M.woodDark); raft.position.set(gx + 11, height(gx + 11, gz + 10) + .5, gz + 10); scene.add(raft);
    },
  },
  typ: {
    name: '泰皮山谷', en: 'Typee', icon: '🌴', theme: 'typee',
    desc: '南洋峡谷 · 食人族的温柔款待 · 逃亡水手的两难',
    ferryMsg: '🌴 泰皮山谷到了。传说这里住着食人族——可他们待你像贵客,你反倒不敢走了',
    lore: {
      typeevalley: { icon: '🏝️', color: '#3a6a4a', title: '泰皮山谷', en: 'The Valley', hint: '异文化的两副面孔',
        desc: '汤莫从捕鲸船逃进这座与世隔绝的山谷。泰皮人给他最好的果子、最美的姑娘、最闲适的日子——可他始终不确定:他们是把他当客人,还是当……日后的一顿飨宴?文明与野蛮,究竟谁更"开化"?' },
      typeetabu: { icon: '🗿', color: '#5a4a3a', title: '禁忌与文身', en: 'Tabu', hint: '一切都被"塔布"管着',
        desc: '"塔布"(tabu)统治着山谷的一切:哪些食物女人不能碰,哪条独木舟神圣不可近。老文身师追着汤莫,想在他脸上刺满花纹——一旦刺了,他就再也回不去白人的世界了。' },
    },
    spots: [[0, 4, 'typeevalley'], [14, -8, 'typeetabu']],
    npcs: [
      { dx: -4, dz: 6, name: '汤莫', body: 0x6a7a8a, hat: 0x4a5a6a, opts: { tall: 1.0 },
        lines: ['他们待我这样好……可我总在数,盛宴的日子是不是快到了。', '在这山谷里,没人为明天发愁——这倒把我这个文明人衬得可笑。', '法亚薇替我求了情,他们才允我去海边。船,快来吧。'] },
      { dx: 7, dz: 5, name: '法亚薇', body: 0xd8a86a, hat: 0x8a5a2a, opts: { tall: .95 },
        lines: ['你为什么总望着海?海那边,有比这里更好的地方吗?', '别怕文身师……不过,你要真留下,就得像我们一样。', '(她替你拨开独木舟的禁忌绳)——去吧,趁潮水正好。'] },
    ],
    build: (gx, gz) => {
      for (const [hx, hz] of [[-6, 6], [6, 8], [10, -2], [-10, -4]]) { const u = gx + hx, v = gz + hz, hh = height(u, v); for (const px of [-1.5, 1.5]) for (const pz of [-1.5, 1.5]) { const stilt = cyl(.12, .14, 2, M.woodDark); stilt.position.set(u + px, hh + 1, v + pz); scene.add(stilt); } const flr = box(4, .3, 4, M.wood); flr.position.set(u, hh + 2, v); scene.add(flr); const rf = new THREE.Mesh(new THREE.ConeGeometry(3.2, 2.2, 4), lam(0x6a5a3a)); rf.rotation.y = .78; rf.position.set(u, hh + 3.4, v); scene.add(rf); }
      for (const [tx, tz] of [[0, 0], [3, -3]]) { const u = gx + tx, v = gz + tz + 12, th = height(u, v); const tiki = box(1, 3.4, 1, lam(0x5a4030)); tiki.position.set(u, th + 1.7, v); scene.add(tiki); const face = new THREE.Mesh(new THREE.SphereGeometry(.7, 6, 5), lam(0x8a6a4a)); face.position.set(u, th + 3.4, v); scene.add(face); }
      for (const [tx, tz] of [[-14, 4], [13, 6], [8, -12]]) { const u = gx + tx, v = gz + tz, th = height(u, v); const tr = cyl(.3, .42, 6, M.wood); tr.position.set(u, th + 3, v); scene.add(tr); const fr = new THREE.Mesh(new THREE.SphereGeometry(2.2, 7, 5), lam(0x3a8a3a)); fr.scale.set(1.4, .7, 1.4); fr.position.set(u, th + 6.2, v); scene.add(fr); }
    },
  },
  tah: {
    name: '画家岛', en: 'The Moon and Sixpence', icon: '🎨', theme: 'tahiti',
    desc: '塔希提 · 逃离文明去画画 · 满墙杰作与麻风,毛姆笔下的高更',
    ferryMsg: '🎨 塔希提到了。有个英国人抛下伦敦的一切来这里画画——他说他"必须画,像溺水的人必须挣扎"',
    lore: {
      studio: { icon: '🖼️', color: '#b85a2e', title: '椰林里的画室', en: "The Painter's Hut", hint: '满墙的杰作',
        desc: '一间椰叶顶的木屋,四壁画满了斑斓怪诞的画:金黄的女人、猩红的树、从未有人见过的乐园。斯特里克兰画完最后一笔就双目失明、死于麻风——临终前,他叫人把这满屋杰作,一把火烧了。' },
      sixpence: { icon: '🌙', color: '#3a3a5a', title: '月亮与六便士', en: 'The Moon', hint: '为月亮丢了六便士',
        desc: '四十岁的证券经纪人,某天忽然抛妻弃子、远走他乡,只为画画。世人说他疯了。"我必须画画。就像一个掉进水里的人,不管游得好不好,总得挣扎,不然就淹死。"他为了天上的月亮,丢掉了脚下的六便士。' },
    },
    spots: [[0, 4, 'studio'], [14, -6, 'sixpence']],
    npcs: [
      { dx: -3, dz: 6, name: '斯特里克兰', body: 0x8a4a2a, hat: 0x5a2a18, opts: { tall: 1.08 },
        lines: ['我必须画画。就像溺水的人必须挣扎。', '我不需要爱情,我没有时间——爱情是种软弱。', '美是艺术家用灵魂的痛苦,从世界的混沌里换来的东西。'] },
      { dx: 8, dz: 6, name: '蒂阿瑞', body: 0xd86a8a, hat: 0xb84a6a, opts: { wide: 1.2, tall: .98 },
        lines: ['那个怪人,一文不名,却把我的旅店住成了传奇。', '爱塔跟了他,伺候他画画,直到他烂了、瞎了、死了。', '他叫人把满屋的画都烧了。天哪,那可是……那可是神迹啊。'] },
    ],
    build: (gx, gz) => {
      const hx = gx, hz = gz + 4, hh = height(hx, hz);
      const hut = box(8, 4, 6, lam(0xc8a878)); hut.position.set(hx, hh + 2, hz); scene.add(hut); cirObs.push({ x: hx, z: hz, r: 4.5 });
      const rf = new THREE.Mesh(new THREE.ConeGeometry(6, 2.4, 4), lam(0x7a6a3a)); rf.rotation.y = Math.PI / 4; rf.position.set(hx, hh + 5, hz); scene.add(rf);
      for (const [ox, col] of [[-3.9, 0xe0a020], [0, 0xc23a3a], [3.9, 0x2a7a5a]]) { const mural = box(.15, 3, 5.4, lam(col)); mural.position.set(hx - 4.05, hh + 2, hz); scene.add(mural); const m2 = box(5.4, 3, .15, lam([0xd94080, 0x4a8ac0, 0xe0b040][(ox + 4) % 3 | 0])); m2.position.set(hx, hh + 2, hz + 3.05); scene.add(m2); break; }
      const easel = cyl(.1, .12, 3, M.woodDark); easel.position.set(gx + 10, height(gx + 10, gz - 4) + 1.5, gz - 4); scene.add(easel);
      const canvas = box(.1, 2, 1.6, lam(0xe0d0a0)); canvas.position.set(gx + 10.2, height(gx + 10, gz - 4) + 2.2, gz - 4); scene.add(canvas);
      for (const [tx, tz] of [[-12, 6], [12, 8], [10, -12]]) { const u = gx + tx, v = gz + tz, th = height(u, v); const tr = cyl(.28, .4, 6, M.wood); tr.position.set(u, th + 3, v); scene.add(tr); const fr = new THREE.Mesh(new THREE.SphereGeometry(2.2, 7, 5), lam(0x4a9a4a)); fr.scale.set(1.4, .7, 1.4); fr.position.set(u, th + 6.2, v); scene.add(fr); }
    },
  },
  daw: {
    name: '黎明踏浪号', en: 'The Voyage of the Dawn Treader', icon: '🐉', theme: 'dawntreader',
    desc: '群岛远征 · 龙首帆船 · 变成龙的男孩 · 世界尽头的百合之海(原创致敬)',
    ferryMsg: '🐉 龙首船"黎明踏浪号"停在这里。船头指向东方——世界的尽头,阿斯兰的国度',
    lore: {
      dragonisle: { icon: '🐉', color: '#8c3a2e', title: '龙岛', en: 'Dragon Island', hint: '贪婪让男孩变成了龙',
        desc: '尤斯塔斯是个讨人厌的男孩。他躲进龙穴、枕着金银睡去,醒来发现自己变成了一条龙——贪婪的心,长出了贪婪的鳞。唯有让狮王阿斯兰用利爪剥去他一层层龙皮,那个自私的男孩才痛得脱胎换骨。' },
      worldsend: { icon: '🌊', color: '#2a6a9a', title: '世界尽头', en: "The World's End", hint: '海水甜如百合',
        desc: '越往东,海水越清越甜,铺满洁白的睡莲,阳光亮得能直视。老鼠雷佩契普划着小舟,越过最后一道浪墙,独自去往阿斯兰的国度——它这一生的心愿。世界的尽头,不是深渊,是光。' },
    },
    spots: [[0, 4, 'dragonisle'], [16, -8, 'worldsend']],
    npcs: [
      { dx: -4, dz: 6, name: '卡斯宾王', body: 0x2a6a8a, hat: 0xd9b24a, opts: { tall: 1.05 },
        lines: ['我们向东航行,去寻找父王放逐的七位爵爷。', '只要"黎明踏浪号"还浮着,我们就一直向着日出开。', '雷佩契普,你这只勇敢的老鼠,比许多骑士都更像骑士。'] },
      { dx: 8, dz: 6, name: '雷佩契普', body: 0x8a5a3a, hat: 0xc23a3a, opts: { tall: .5 },
        lines: ['我这一生,只为抵达世界的尽头,阿斯兰的国度。', '当我还在摇篮里,一位女预言者就为我唱了那支歌。', '恐惧?一只有尊严的老鼠,是不认得这个词的。'] },
    ],
    build: (gx, gz) => {
      const ship = makeBoat(0x6a2a9a, 1.5); ship.userData = { anchor: [gx + 2, gz + 4] };
      const dragonHead = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3, 6), M.gold); dragonHead.rotation.x = Math.PI / 2; dragonHead.position.set(gx + 12, height(gx + 2, gz + 4) + 4, gz + 4); scene.add(dragonHead);
      const dx2 = gx - 12, dz2 = gz - 8, dh = height(dx2, dz2);
      const dragon = new THREE.Mesh(new THREE.SphereGeometry(2, 10, 8), lam(0x7a3a2a)); dragon.scale.set(1, .8, 2); dragon.position.set(dx2, dh + 1.6, dz2); scene.add(dragon); cirObs.push({ x: dx2, z: dz2, r: 2.6 });
      for (const wg of [-1, 1]) { const wing = new THREE.Mesh(new THREE.ConeGeometry(1.6, 4, 3), lam(0x5a2a1a)); wing.rotation.z = wg * 1.2; wing.position.set(dx2 + wg * 2.6, dh + 2.6, dz2); scene.add(wing); }
      const lily = new THREE.Mesh(new THREE.CircleGeometry(9, 24), new THREE.MeshPhongMaterial({ color: 0xd0eaff, transparent: true, opacity: .7 })); lily.rotation.x = -Math.PI / 2; lily.position.set(gx + 18, height(gx + 18, gz - 8) + .3, gz - 8); scene.add(lily);
      for (let i = 0; i < 8; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(.6, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })); p.rotation.x = -Math.PI / 2; p.position.set(gx + 18 + (rnd() - .5) * 14, height(gx + 18, gz - 8) + .35, gz - 8 + (rnd() - .5) * 14); scene.add(p); }
    },
  },
  rain: {
    name: '雨岛', en: 'Rain', icon: '🌧️', theme: 'rainisle',
    desc: '帕果帕果 · 连绵不绝的雨 · 传教士与风尘女子的对峙,毛姆短篇',
    ferryMsg: '🌧️ 帕果帕果到了。雨已经下了半个月,还看不到头。旅店里,一场关于灵魂的战争正在上演',
    lore: {
      rainhotel: { icon: '🏨', color: '#4a5a6a', title: '雨中旅店', en: 'The Boarding House', hint: '被雨困住的人们',
        desc: '检疫封岛,一群旅客挤在这间闷热的木板旅店里,听着屋顶永不停歇的雨。楼上的留声机彻夜放着爵士乐——那是汤普森小姐的房间。楼下,戴维森牧师的脸一天比一天阴沉。' },
      missionary: { icon: '✝️', color: '#3a3a44', title: '牧师与汤普森小姐', en: 'Davidson & Miss Thompson', hint: '谁在拯救谁?',
        desc: '戴维森牧师立誓要拯救风尘女子汤普森小姐的灵魂,日夜逼她祈祷、忏悔,几乎要把她送回监狱。她从反抗到崩溃、到跪地皈依……然后某个清晨,牧师被发现割喉自尽在海滩。而她冷笑:"男人!你们都是一路货色。"雨,还在下。' },
    },
    spots: [[0, 4, 'rainhotel'], [12, -8, 'missionary']],
    npcs: [
      { dx: -4, dz: 6, name: '戴维森牧师', body: 0x2a2a34, hat: 0x1a1a22, opts: { tall: 1.08 },
        lines: ['这座岛上遍地是罪。我来,是要把光带给他们。', '那个女人的灵魂,我一定要把它从火里夺回来。', '(他望着汤普森小姐的窗,眼神里有种他自己也不懂的东西……)'] },
      { dx: 7, dz: 5, name: '汤普森小姐', body: 0x9a3a5a, hat: 0x6a2a3a, opts: { tall: .98 },
        lines: ['凭什么?我碍着谁了?这该死的雨,这该死的岛!', '好啊,牧师,你要救我,那就来救啊。', '(结局那句)——男人!你们这些猪猡,全都一个样!'] },
    ],
    build: (gx, gz) => {
      const hx = gx, hz = gz + 4, hh = height(hx, hz);
      const hotel = box(12, 6, 8, lam(0x8a8478)); hotel.position.set(hx, hh + 3, hz); scene.add(hotel); cirObs.push({ x: hx, z: hz, r: 6.5 });
      const ver = box(14, .3, 3, M.wood); ver.position.set(hx, hh + .3, hz + 5.5); scene.add(ver);
      const rf = box(13, .5, 9, lam(0x4a4a52)); rf.position.set(hx, hh + 6.3, hz); scene.add(rf);
      for (const px of [-5, -1.5, 1.5, 5]) { const post = cyl(.14, .14, 6, M.woodDark); post.position.set(hx + px, hh + 3, hz + 5.5); scene.add(post); }
      for (let i = 0; i < 8; i++) { const pud = new THREE.Mesh(new THREE.CircleGeometry(.8 + rnd(), 10), new THREE.MeshPhongMaterial({ color: 0x5a6a7a, transparent: true, opacity: .6 })); pud.rotation.x = -Math.PI / 2; const u = gx + (rnd() - .5) * 40, v = gz + (rnd() - .5) * 40, ph = height(u, v); if (ph > 2) { pud.position.set(u, ph + .1, v); scene.add(pud); } }
    },
  },
  shu: {
    name: '禁闭岛', en: 'Shutter Island', icon: '🌫️', theme: 'shutter',
    desc: '雾中疗养岛 · 灯塔与病院 · 记忆随谎言改写,勒翰心理悬疑',
    ferryMsg: '🌫️ 禁闭岛到了。渡轮不会等你——岛上只有一座精神病院、一座灯塔,和一场分不清真假的暴风雨',
    lore: {
      shulighthouse: { icon: '🗼', color: '#5a5a64', title: '灯塔', en: 'The Lighthouse', hint: '真相锁在塔里',
        desc: '所有人都说灯塔里在做违禁的脑science实验;泰迪拼死也要闯进去查明真相。可当他终于登上塔顶,等着他的不是手术台,而是考利医生温和的一句话:"欢迎回来……你已经在这座岛上,住了很久了。"' },
      shuward: { icon: '🏥', color: '#3a4048', title: 'C 病区', en: 'Ward C', hint: '记忆是靠不住的',
        desc: '联邦执法官泰迪来岛上调查一桩失踪案,却发现每个人的说法都自相矛盾、每张地图都对不上。到底是全岛在合谋骗他,还是……这一切,本就是为他一个人精心搭起的戏?"要像个怪物一样活着,还是像个好人一样死去?"' },
    },
    spots: [[0, 4, 'shuward'], [-2, -10, 'shulighthouse']],
    npcs: [
      { dx: -4, dz: 6, name: '泰迪', body: 0x4a5560, hat: 0x2a3038, opts: { tall: 1.05 },
        lines: ['我是联邦执法官,我来调查一名失踪的病人。', '这座岛不对劲……每个人都在对我撒谎。', '要像怪物一样活着,还是像好人一样死去?——我选后者。'] },
      { dx: 8, dz: 6, name: '考利医生', body: 0xd8d2c8, hat: 0xb0a898, opts: { tall: 1.02 },
        lines: ['我们试过所有办法。这场"角色扮演",是最后的希望。', '你构建了一个精巧的故事,好让自己不必面对真相。', '想想吧:这四天,到底是谁,在追查谁?'] },
    ],
    build: (gx, gz) => {
      const wx = gx, wz = gz + 4, wh = height(wx, wz);
      const ward = box(14, 6, 9, lam(0x6a6a72)); ward.position.set(wx, wh + 3, wz); scene.add(ward); cirObs.push({ x: wx, z: wz, r: 7.5 });
      const rf = box(15, .6, 10, lam(0x3a3a42)); rf.position.set(wx, wh + 6.3, wz); scene.add(rf);
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, r = 20; const fp = cyl(.12, .14, 2.6, M.woodDark); const u = gx + Math.cos(a) * r, v = gz + Math.sin(a) * r; fp.position.set(u, height(u, v) + 1.3, v); scene.add(fp); }
      const lx = gx - 2, lz = gz - 10, lh = height(lx, lz);
      const tower = cyl(1.4, 2, 12, M.white, 12); tower.position.set(lx, lh + 6, lz); scene.add(tower); cirObs.push({ x: lx, z: lz, r: 2.2 });
      const lroom = cyl(2, 2.2, 2.4, new THREE.MeshPhongMaterial({ color: 0xbfe8ff, transparent: true, opacity: .5 })); lroom.position.set(lx, lh + 13, lz); scene.add(lroom);
      const lamp = new THREE.PointLight(0xfff2b0, 0, 120, 2); lamp.position.set(lx, lh + 13, lz); lamp.userData.pow = 24; nightLamps.push(lamp); scene.add(lamp);
    },
  },
};
/* 框架:把每岛内容接入世界(渡口/图鉴/海图/配乐/分桶经各自定义点补齐)*/
for (const s of NISLES) {
  const c = NI_CONTENT[s.key]; if (!c) continue;
  const gx = s.x, gz = s.z;
  Object.assign(LORE, c.lore);
  WORLDS.push({ key: s.key, icon: c.icon, name: c.name, en: c.en, open: true, desc: c.desc || '' });
  SG_LIST.push([s.key, c.icon + ' ' + c.name]);
  ISLES.push({ c: { x: gx, z: gz, r: s.r }, name: c.name, icon: c.icon, theme: c.theme });
  NI_DEST[s.key] = s.dock; NI_MSG[s.key] = c.ferryMsg;
  if (c.build) c.build(gx, gz);
  for (const n of (c.npcs || [])) addNpc(Object.assign({}, n, { x: gx + n.dx, z: gz + n.dz }));
  for (const [dx, dz, tp] of (c.spots || [])) addSpot(gx + dx, gz + dz, 'lore', tp, { r: 6 });
  const dk = height(s.dock[0], s.dock[1]);
  const plk = box(5, .5, 9, M.wood); plk.position.set(s.dock[0], dk + .9, s.dock[1]); scene.add(plk);
  addSpot(s.dock[0], s.dock[1], 'ferry', 'ferry', { r: 8 });
  const sgn = makeSign(c.name, 6.5, '#1e2430', '#dfe8f0'); const sgz = gz + (gz > 0 ? -s.r * .6 : s.r * .6);
  sgn.position.set(gx + 10, height(gx + 10, sgz) + 4, sgz); scene.add(sgn);
}
/* 海洋文学带故事线 NI_QUESTS → w-config.js(纯数据模块,顶部 import) */
const NIQ_BY_LORE = {}, NIQ_BY_FLAG = {};
for (const k in NI_QUESTS) { const q = Object.assign({ flag: 'nq_' + k, key: k }, NI_QUESTS[k]); NIQ_BY_LORE[q.lore] = q; NIQ_BY_FLAG[q.flag] = q; }
/* ===== 海底隧道迷宫 · 洞穴潜水(导绳=关键装备)===== */
/* 迷宫拓扑/分区/门/发现点/出入口 → w-maze.js(纯数据模块,顶部 import) */
let diving = false, diveEntry = 0, diveAir = 100, nearPortal = -1, diveLight = null;
let mazeWhale = null, tidalHeart = null, sonarRing = null, sonarT = 0, sonarCD = 0, airChamberT = 0, gateHintT = 0, diveZone = 0;
let causticLight = null, causticTex = null;
const gateMeshes = [];
const _zfog = new THREE.Color();
const diveGroup = new THREE.Group(); diveGroup.visible = false; scene.add(diveGroup);
const ropeGroup = new THREE.Group(); scene.add(ropeGroup); ropeGroup.visible = false;
const portalBeacons = [];
{
  const V = i => new THREE.Vector3(MAZE_NODES[i][0], MAZE_NODES[i][1], MAZE_NODES[i][2]);
  const up = new THREE.Vector3(0, 1, 0);
  const zoneMats = ZONES.map(z => MOBILE ? new THREE.MeshLambertMaterial({ color: z.col, side: THREE.BackSide })
    : new THREE.MeshStandardMaterial({ color: z.col, roughness: 1, metalness: 0, side: THREE.BackSide }));
  const ropeMat = new THREE.MeshBasicMaterial({ color: 0x6ffcff, fog: false });
  const glassMat = new THREE.MeshPhongMaterial({ color: 0x9fd8ff, transparent: true, opacity: .18, side: THREE.DoubleSide, shininess: 90, fog: false });
  MAZE_EDGES.forEach(([a, b], ei) => {
    const A = V(a), B = V(b), len = A.distanceTo(B), mid = A.clone().add(B).multiplyScalar(.5);
    const q = new THREE.Quaternion().setFromUnitVectors(up, B.clone().sub(A).normalize());
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(TUBE_R, TUBE_R, len + 2, 16, 1, true), ei === 0 ? glassMat : zoneMats[NODE_ZONE[a]]);   // 首段=玻璃观景廊,其余按分区配色
    tube.position.copy(mid); tube.quaternion.copy(q); diveGroup.add(tube);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, len, 5), ropeMat);
    rope.position.copy(mid); rope.quaternion.copy(q); ropeGroup.add(rope);
  });
  for (let i = 0; i < MAZE_NODES.length; i++) {   // 交汇处开阔洞室 + 分区地标
    const n = MAZE_NODES[i], z = NODE_ZONE[i];
    const cav = new THREE.Mesh(new THREE.SphereGeometry(TUBE_R + 3, 12, 10), zoneMats[z]);
    cav.position.copy(V(i)); diveGroup.add(cav);
    if (z === 0) for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283, cor = new THREE.Mesh(new THREE.ConeGeometry(.6, 1.8, 5), new THREE.MeshBasicMaterial({ color: [0xe86a8a, 0xe0a040, 0x8a4ab0, 0x2ad0c0][k % 4], fog: false })); cor.position.set(n[0] + Math.cos(a) * (TUBE_R + 1), n[1] - TUBE_R + 1.2, n[2] + Math.sin(a) * (TUBE_R + 1)); diveGroup.add(cor); }
    else if (z === 2) { const pts = []; for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283; pts.push(n[0] + Math.cos(a) * (TUBE_R + 2), n[1] + Math.sin(k * 1.7) * 4, n[2] + Math.sin(a) * (TUBE_R + 2)); } const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); diveGroup.add(new THREE.Points(bg, new THREE.PointsMaterial({ color: 0x9fc0ff, size: .8, transparent: true, opacity: .9, fog: false }))); }
    else if (z === 3) for (let k = -2; k <= 2; k++) { const rib = new THREE.Mesh(new THREE.TorusGeometry(TUBE_R + 1, .3, 6, 14, Math.PI), new THREE.MeshBasicMaterial({ color: 0xcfc8b8, fog: false })); rib.position.set(n[0], n[1] - 1, n[2] + k * 2.6); diveGroup.add(rib); }
  }
  for (const p of MAZE_PORTALS) {   // 出口浮标 + 竖直光柱
    const g = new THREE.Group(); g.position.copy(V(p.n));
    const orb = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 10), new THREE.MeshBasicMaterial({ color: p.col, fog: false }));
    orb.position.y = 4; g.add(orb);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 40, 8, 1, true), new THREE.MeshBasicMaterial({ color: p.col, transparent: true, opacity: .32, fog: false, side: THREE.DoubleSide }));
    shaft.position.y = 24; g.add(shaft);
    const pl = new THREE.PointLight(p.col, 1.4, 40, 2); pl.position.y = 4; g.add(pl);
    ropeGroup.add(g); portalBeacons.push(g);
  }
  diveLight = new THREE.PointLight(0xbfeaff, 0, 70, 1.6); diveLight.visible = false; scene.add(diveLight);
  /* 水下焦散:自上而下投影一张晃动的光斑贴图(桌面) */
  if (!MOBILE) {
    const cc = document.createElement('canvas'); cc.width = cc.height = 256; const cg = cc.getContext('2d');
    cg.fillStyle = '#000'; cg.fillRect(0, 0, 256, 256); cg.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 46; i++) { const x = Math.random() * 256, y = Math.random() * 256, r = 16 + Math.random() * 40; const grd = cg.createRadialGradient(x, y, 0, x, y, r); grd.addColorStop(0, 'rgba(190,235,255,.55)'); grd.addColorStop(.55, 'rgba(120,200,255,.12)'); grd.addColorStop(1, 'rgba(0,0,0,0)'); cg.fillStyle = grd; cg.beginPath(); cg.arc(x, y, r, 0, 7); cg.fill(); }
    causticTex = new THREE.CanvasTexture(cc); causticTex.wrapS = causticTex.wrapT = THREE.RepeatWrapping; causticTex.repeat.set(2.2, 2.2);
    causticLight = new THREE.SpotLight(0xafe4ff, 0, 110, Math.PI / 2.6, .7, 1.1);
    causticLight.map = causticTex; causticLight.castShadow = true; causticLight.shadow.mapSize.set(512, 512); causticLight.shadow.camera.far = 120;
    causticLight.visible = false; scene.add(causticLight); scene.add(causticLight.target);
  }
  /* 观景廊外的巨鲸剪影(周期性掠过玻璃隧道) */
  mazeWhale = new THREE.Group();
  const wbody = new THREE.Mesh(new THREE.SphereGeometry(9, 14, 10), new THREE.MeshBasicMaterial({ color: 0x0a1a26, fog: false })); wbody.scale.set(1, .7, 2.7); mazeWhale.add(wbody);
  const wtail = new THREE.Mesh(new THREE.ConeGeometry(5, 8, 4), new THREE.MeshBasicMaterial({ color: 0x0a1a26, fog: false })); wtail.rotation.x = -Math.PI / 2; wtail.scale.set(1, .3, 1); wtail.position.z = -26; mazeWhale.add(wtail);
  mazeWhale.userData = { mid: new THREE.Vector3((MAZE_NODES[0][0] + MAZE_NODES[1][0]) / 2, (MAZE_NODES[0][1] + MAZE_NODES[1][1]) / 2, (MAZE_NODES[0][2] + MAZE_NODES[1][2]) / 2) };
  diveGroup.add(mazeWhale);
  /* 气室:开阔洞室顶部一层明亮水镜 + 上升气泡 */
  for (const ni of AIR_NODES) {
    const n = MAZE_NODES[ni];
    const disc = new THREE.Mesh(new THREE.CircleGeometry(TUBE_R + 2, 20), new THREE.MeshBasicMaterial({ color: 0xbfeeff, transparent: true, opacity: .5, fog: false, side: THREE.DoubleSide }));
    disc.rotation.x = -Math.PI / 2; disc.position.set(n[0], n[1] + TUBE_R + 1.5, n[2]); diveGroup.add(disc);
    const bg = new THREE.BufferGeometry(); const bp = new Float32Array(30 * 3);
    for (let i = 0; i < 30; i++) { bp[i * 3] = n[0] + (Math.random() - .5) * 8; bp[i * 3 + 1] = n[1] + Math.random() * 8; bp[i * 3 + 2] = n[2] + (Math.random() - .5) * 8; }
    bg.setAttribute('position', new THREE.BufferAttribute(bp, 3));
    diveGroup.add(new THREE.Points(bg, new THREE.PointsMaterial({ color: 0xcfeeff, size: .5, transparent: true, opacity: .7, fog: false })));
  }
  /* 死路壁画(节点 11):鲸与灯塔 */
  { const n = MAZE_NODES[11]; const cv = document.createElement('canvas'); cv.width = 128; cv.height = 96; const cx = cv.getContext('2d');
    cx.fillStyle = '#26343e'; cx.fillRect(0, 0, 128, 96); cx.fillStyle = '#8fb6c8';
    cx.beginPath(); cx.ellipse(44, 56, 28, 12, 0, 0, 7); cx.fill(); cx.beginPath(); cx.moveTo(16, 56); cx.lineTo(4, 44); cx.lineTo(6, 64); cx.fill();
    cx.fillRect(92, 32, 10, 44); cx.beginPath(); cx.moveTo(88, 32); cx.lineTo(106, 32); cx.lineTo(97, 20); cx.fill(); cx.fillStyle = '#ffd76a'; cx.fillRect(94, 30, 6, 6);
    const mural = new THREE.Mesh(new THREE.PlaneGeometry(9, 6.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), fog: false }));
    mural.position.set(n[0], n[1], n[2] - (TUBE_R + 2)); diveGroup.add(mural); }
  /* 沉船宝箱(节点 13) */
  { const n = MAZE_NODES[13]; const hull = box(3, 1.4, 8, new THREE.MeshStandardMaterial({ color: 0x3a2c1e, roughness: 1 })); hull.rotation.z = .3; hull.position.set(n[0] - 2, n[1] - 2, n[2]); diveGroup.add(hull);
    const chest = box(2, 1.3, 1.4, new THREE.MeshStandardMaterial({ color: 0x6a4a24, roughness: .8 })); chest.position.set(n[0] + 1, n[1] - 2, n[2] + 1); diveGroup.add(chest);
    const gold = box(1.7, .4, 1.1, new THREE.MeshBasicMaterial({ color: 0xe8c040, fog: false })); gold.position.set(n[0] + 1, n[1] - 1.3, n[2] + 1); diveGroup.add(gold); }
  /* 潮汐之心(中心节点 9) */
  { const n = MAZE_NODES[9]; tidalHeart = new THREE.Group(); tidalHeart.position.set(n[0], n[1], n[2]);
    tidalHeart.add(new THREE.Mesh(new THREE.IcosahedronGeometry(4, 1), new THREE.MeshBasicMaterial({ color: 0x2a6a8a, transparent: true, opacity: .55, fog: false })));
    tidalHeart.add(new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 0), new THREE.MeshBasicMaterial({ color: 0x8ffcff, fog: false })));
    const hl = new THREE.PointLight(0x6ffcff, 1.2, 60, 2); tidalHeart.add(hl); diveGroup.add(tidalHeart); }
  /* 声呐脉冲环 */
  sonarRing = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: 0x7ffcff, transparent: true, opacity: 0, wireframe: true, fog: false }));
  sonarRing.visible = false; diveGroup.add(sonarRing);
  /* 潮汐门 / 满月门:铜绿闸栅,升降开合 */
  const gateMat = new THREE.MeshStandardMaterial({ color: 0x2e6a5a, roughness: .6, metalness: .5, emissive: 0x0a2a22 });
  const moonGateMat = new THREE.MeshStandardMaterial({ color: 0x3a4a7a, roughness: .5, metalness: .6, emissive: 0x1a2450 });
  for (const g of GATES) {
    const A = V(g.a), B = V(g.b), mid = A.clone().add(B).multiplyScalar(.5), dir = B.clone().sub(A).normalize();
    const mat = g.kind === 'moon' ? moonGateMat : gateMat;
    const grp = new THREE.Group(); grp.position.copy(mid); grp.rotation.y = Math.atan2(dir.x, dir.z);   // 局部 z 沿隧道
    grp.add(new THREE.Mesh(new THREE.TorusGeometry(TUBE_R, .5, 8, 18), mat));   // 门框环绕隧道口
    const bars = new THREE.Group();
    for (let i = -2; i <= 2; i++) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, TUBE_R * 2, 6), mat); bar.position.x = i * 2.2; bars.add(bar); }
    if (g.kind === 'moon') { const glyph = new THREE.Mesh(new THREE.CircleGeometry(1.5, 20), new THREE.MeshBasicMaterial({ color: 0xbfd0ff, transparent: true, opacity: .8, fog: false })); bars.add(glyph); }
    grp.add(bars); diveGroup.add(grp);
    gateMeshes.push({ cfg: g, bars, mid, openY: TUBE_R * 2 + 2 });
  }
  /* 巴别海窟(满月门后的六边形密室) */
  { const n = MAZE_NODES[14], hex = new THREE.Group(); hex.position.set(n[0], n[1], n[2]);
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; const wall = box(9, 12, .6, new THREE.MeshStandardMaterial({ color: 0x1e2a3a, roughness: 1, side: THREE.BackSide })); wall.position.set(Math.cos(a) * 8, 0, Math.sin(a) * 8); wall.rotation.y = -a + Math.PI / 2; hex.add(wall);
      for (let s = 0; s < 3; s++) { const shelf = box(7, .3, .8, new THREE.MeshBasicMaterial({ color: [0x6ffcff, 0xffd76a, 0xd98ac8][s], fog: false })); shelf.position.set(Math.cos(a) * 7.2, -3 + s * 3, Math.sin(a) * 7.2); shelf.rotation.y = -a + Math.PI / 2; hex.add(shelf); } }
    const lamp = new THREE.PointLight(0x9fd0ff, 1.6, 40, 2); hex.add(lamp);
    hex.add(new THREE.Mesh(new THREE.OctahedronGeometry(1.4, 0), new THREE.MeshBasicMaterial({ color: 0xbfe4ff, fog: false })));
    diveGroup.add(hex); }
}
{   // 潜水 HUD:气瓶条 + 提示
  const d = document.createElement('div'); d.id = 'diveHud'; d.className = 'hidden';
  Object.assign(d.style, { position: 'fixed', left: '50%', bottom: '96px', transform: 'translateX(-50%)', zIndex: '7', textAlign: 'center', pointerEvents: 'none', font: '13px system-ui,sans-serif', color: '#cfeeff', textShadow: '0 1px 3px #000' });
  d.innerHTML = '<div id="diveAirBar" style="width:220px;height:12px;border:1px solid #4a7a9a;border-radius:7px;background:#0a1f2c;margin:0 auto;overflow:hidden"><i id="diveAirFill" style="display:block;height:100%;width:100%;background:linear-gradient(90deg,#2ad0ff,#7affd0)"></i></div><div id="diveHint" style="margin-top:5px">🫧 空格上浮 · Shift下潜 · WASD 游动 · E 从浮标处出水面</div>';
  document.body.appendChild(d);
  /* 移动端潜水:上浮/下潜按钮(触屏时随潜水显隐,驱动 joy.up/joy.down) */
  [['btnDiveUp', '⬆️', 258, 'up'], ['btnDiveDown', '⬇️', 178, 'down']].forEach(([id, sym, bottom, key]) => {
    const b = document.createElement('button'); b.id = id; b.textContent = sym; b.className = 'hidden';
    Object.assign(b.style, { position: 'fixed', right: '26px', bottom: bottom + 'px', zIndex: '30', width: '62px', height: '62px', borderRadius: '50%', border: '3px solid rgba(255,255,255,.45)', background: 'rgba(70,160,230,.8)', fontSize: '24px', touchAction: 'none' });
    const set = v => e => { e.preventDefault(); joy[key] = v; };
    b.addEventListener('pointerdown', set(true));
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, set(false));
    document.body.appendChild(b);
  });
}
/* 步行洞窟:围绕潜水潭建一座可走进的小洞(顶盖+半圈石壁+钟乳石),留前方开口 */
function buildGrotto(sx, sz, gy) {
  const rock = lam(0x39352e);
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(9, 14, 8, 0, 6.283, 0, Math.PI / 2.4), new THREE.MeshLambertMaterial({ color: 0x39352e, side: THREE.DoubleSide }));
  canopy.scale.y = .7; canopy.position.set(sx, gy + 3, sz); scene.add(canopy);
  for (const a of [1.5, 2.3, 3.14, 3.98, 4.78]) { const b = new THREE.Mesh(new THREE.DodecahedronGeometry(2.8), rock); const bx = sx + Math.cos(a) * 7.5, bz = sz + Math.sin(a) * 7.5; b.position.set(bx, gy + 1.5, bz); b.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); scene.add(b); cirObs.push({ x: bx, z: bz, r: 2.6 }); }
  for (let i = 0; i < 5; i++) { const st = new THREE.Mesh(new THREE.ConeGeometry(.4, 1.6, 5), rock); st.rotation.x = Math.PI; st.position.set(sx + (rnd() - .5) * 10, gy + 5, sz + (rnd() - .5) * 10); scene.add(st); }
  const gl = new THREE.PointLight(0x6fd0e8, .7, 18, 2); gl.position.set(sx, gy + 2, sz); scene.add(gl);
}
/* 各海岛的蓝洞(潜水口):走近按 E 潜入;cave 者外面罩一座可步行洞窟 */
for (const p of MAZE_PORTALS) {
  const [sx, sz] = p.surf;
  const gy = Math.max(height(sx, sz), pierHeight(sx, sz) || 0, 0);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, .6, 8, 20), new THREE.MeshBasicMaterial({ color: 0x0a2a3a }));
  ring.rotation.x = Math.PI / 2; ring.position.set(sx, gy + .15, sz); scene.add(ring);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(3, 20), new THREE.MeshBasicMaterial({ color: 0x061a26, transparent: true, opacity: .92 }));
  hole.rotation.x = -Math.PI / 2; hole.position.set(sx, gy + .17, sz); scene.add(hole);
  if (p.cave) buildGrotto(sx, sz, gy);
  addSpot(sx, sz, 'dive', 'bluehole', { r: 7, y: gy + 1, portal: MAZE_PORTALS.indexOf(p) });
}
/* 主岛「牛首回廊」海蚀洞:西岸空旷海滩(远离水族馆),洞口朝岛内、从陆地走进,里侧潜水潭下水 */
{
  const cx = -328, cz = 180, poolX = -338, fh = height(cx, cz), rock = lam(0x39352e);
  // 沿 x 的两侧壁(z=167 / z=193),留 +x 侧洞口
  for (const wz of [167, 193]) { const wall = box(46, 9, 2, rock); wall.position.set(cx, fh + 4, wz); scene.add(wall); boxObs.push({ x1: -351, z1: wz - 1, x2: -305, z2: wz + 1 }); }
  // 后壁(朝海一侧 x=-350)
  const back = box(2, 9, 28, rock); back.position.set(-350, fh + 4, cz); scene.add(back); boxObs.push({ x1: -351, z1: 167, x2: -349, z2: 193 });
  const ceil = box(48, 2, 30, rock); ceil.position.set(cx, fh + 8.5, cz); scene.add(ceil);
  // 洞口拱门(朝岛内 +x)
  for (const pz of [170, 190]) { const pil = cyl(2.2, 2.6, 8, rock, 7); pil.position.set(-306, fh + 4, pz); scene.add(pil); cirObs.push({ x: -306, z: pz, r: 2.4 }); }
  const lintel = box(3, 3, 26, rock); lintel.position.set(-306, fh + 8, cz); scene.add(lintel);
  // 钟乳石
  for (let i = 0; i < 7; i++) { const st = new THREE.Mesh(new THREE.ConeGeometry(.5 + Math.random() * .4, 2 + Math.random() * 2, 6), rock); st.rotation.x = Math.PI; st.position.set(-348 + Math.random() * 40, fh + 7, 170 + Math.random() * 20); scene.add(st); }
  // 潜水潭幽光 + 洞名牌
  const glow = new THREE.PointLight(0x6fd0e8, 0, 26, 2); glow.position.set(poolX, height(poolX, cz) + 3, cz); glow.userData.pow = 10; nightLamps.push(glow); scene.add(glow);
  const gl2 = new THREE.PointLight(0x6fd0e8, .8, 20, 2); gl2.position.set(poolX, height(poolX, cz) + 1, cz); scene.add(gl2);
  const cSign = makeSign('牛首回廊 · 潜水潭', 6, '#14202a', '#8fe0e8'); cSign.position.set(-300, height(-300, 205) + 3.4, 205); scene.add(cSign);
}
function clampToMaze(pos) {
  let best = 1e9, cx = 0, cy = 0, cz = 0;
  const px = pos.x, py = pos.y, pz = pos.z;
  for (const [a, b] of MAZE_EDGES) {
    const A = MAZE_NODES[a], B = MAZE_NODES[b];
    const abx = B[0] - A[0], aby = B[1] - A[1], abz = B[2] - A[2];
    const L2 = abx * abx + aby * aby + abz * abz;
    let tt = ((px - A[0]) * abx + (py - A[1]) * aby + (pz - A[2]) * abz) / (L2 || 1);
    tt = tt < 0 ? 0 : tt > 1 ? 1 : tt;
    const qx = A[0] + abx * tt, qy = A[1] + aby * tt, qz = A[2] + abz * tt;
    const d = Math.hypot(px - qx, py - qy, pz - qz);
    if (d < best) { best = d; cx = qx; cy = qy; cz = qz; }
  }
  const R = TUBE_R - 1.3;
  if (best > R) { const f = R / best; pos.x = cx + (px - cx) * f; pos.y = cy + (py - cy) * f; pos.z = cz + (pz - cz) * f; }
  return best;
}
const discSeen = new Set();
function gateOpen(g, t) {
  if (g.kind === 'moon') return MOON_FULL && curDA < .4;   // 满月夜方开
  return Math.sin(t * .18 + g.phase) > -.15;                // 潮汐:约 35s 周期,开约六成
}
function fireSonar() {
  if (!diving || sonarCD > 0) return;
  sonarCD = 4; sonarT = 1.4;
  sonarRing.position.copy(player.position); sonarRing.visible = true;
  // 回声:报出最近出口的方位与距离
  let best = 1e9, bi = -1;
  for (let i = 0; i < MAZE_PORTALS.length; i++) { if (i === diveEntry) continue; const n = MAZE_NODES[MAZE_PORTALS[i].n]; const d = Math.hypot(player.position.x - n[0], player.position.y - n[1], player.position.z - n[2]); if (d < best) { best = d; bi = i; } }
  if (bi >= 0) { const n = MAZE_NODES[MAZE_PORTALS[bi].n]; const ang = Math.atan2(n[0] - player.position.x, n[2] - player.position.z) * 180 / Math.PI; const dir = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'][((Math.round(ang / 45) + 8) % 8)]; toast(`🔊 声呐回声:最近的出口(${MAZE_PORTALS[bi].isle})在${dir}方,约 ${Math.round(best)} 米`); }
  if (actx && musicOn) { const o = actx.createOscillator(), g = actx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(880, actx.currentTime); o.frequency.exponentialRampToValueAtTime(220, actx.currentTime + .5); g.gain.setValueAtTime(.12, actx.currentTime); g.gain.exponentialRampToValueAtTime(.001, actx.currentTime + .6); o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + .6); }
}
function enterDive(pi) {
  if (diving) return;
  diving = true; diveEntry = pi; diveAir = 100; modalOpen = false;
  const n = MAZE_NODES[MAZE_PORTALS[pi].n];
  player.position.set(n[0], n[1], n[2]); vy = 0;
  diveGroup.visible = true; diveLight.visible = true;
  if (causticLight) causticLight.visible = true;
  ropeGroup.visible = gearOn('rope');
  scene.fog.near = 3; scene.fog.far = gearOn('rope') ? 90 : 46; scene.fog.color.setHex(0x04121c);
  scene.background.setHex(0x04121c);
  $('diveHud').classList.remove('hidden');
  if (matchMedia('(pointer: coarse)').matches) { $('btnDiveUp').classList.remove('hidden'); $('btnDiveDown').classList.remove('hidden'); }
  toast(gearOn('rope') ? '🤿 潜入蓝洞——顺着发光导绳,游向任意海岛的出口' : '🤿 潜入蓝洞……四下漆黑,没有导绳,当心迷路和憋气!');
}
function surfaceDive(pi) {
  const p = MAZE_PORTALS[pi], [sx, sz] = p.surf;
  diving = false; diveGroup.visible = false; ropeGroup.visible = false; diveLight.visible = false;
  if (causticLight) causticLight.visible = false;
  scene.fog.near = 320; scene.fog.far = 1850; scene.fog.color.copy(skyCol); scene.background.copy(skyCol);
  $('diveHud').classList.add('hidden');
  $('btnDiveUp').classList.add('hidden'); $('btnDiveDown').classList.add('hidden'); joy.up = joy.down = false;
  player.position.set(sx, Math.max(height(sx, sz), pierHeight(sx, sz) || 0, 0) + 1.2, sz); vy = 0;
  if (pi !== diveEntry) {
    toast(`🌊 你从${p.isle}的蓝洞浮出水面!`);
    if (PSTORE.getItem('w1001.caved') !== '1') { PSTORE.setItem('w1001.caved', '1'); earnSB(25); toast('🤿 首次穿越海底隧道 · ⚡+25 · 新称号「洞穴潜水员」'); }
  } else toast('🌊 你原路浮回了洞口。');
  blip(560);
}
/* 终局:集齐潮汐之心/壁画/巴别地图三线索 → 揭示「世界骨架」*/
function maybeRevealSkeleton() {
  if (PSTORE.getItem('w1001.skeleton') === '1') return;
  if (PSTORE.getItem('w1001.d_heart') === '1' && PSTORE.getItem('w1001.d_mural') === '1' && PSTORE.getItem('w1001.babel') === '1') {
    PSTORE.setItem('w1001.skeleton', '1');
    earnSB(100); stars++; saveQuest(); updateQuestHUD();
    setTimeout(showSkeletonCard, 1000);
  }
}
function showSkeletonCard() {
  cardBody.innerHTML = `<div class="cardHead" style="background:#0e1830">🕸️ 世界骨架 · The World's Skeleton</div>
    <div class="cardMedia"><div class="paperRoll">🕸️</div></div>
    <div class="cardTitle"><h3>海下大迷宫 · 世界脐带</h3><div class="en">Blue Ariadne</div></div>
    <div class="cardDesc">三样东西在脑中拼合:搏动的潮汐之心、鲸与灯塔并肩的壁画、巴别海窟里那张迷宫全图。<br><br>
    你忽然明白——这些海底隧道从来不是天然的水道。把所有海岛在星球表面的位置连起来,再叠上脚下这张迷宫网……从极高处俯瞰,它们组成一个巨大的符号。<br><br>
    <b>这颗星球不是自然形成的。</b>海底大迷宫,才是它真正的骨架;而每座岛,只是骨架浮出水面的关节。有人——或什么——亲手把这颗星球编织成一只线团。<br><br>
    而你,是第一个走通它的人。<br>
    <span style="color:#8fbcd8;font-size:12px">海图(<b>M</b>)上已浮现出这张脐带网。⚡+100 · ⭐+1 · 新称号「🕸️ 世界骨架 · 见证者」</span></div>
    <div style="text-align:center;padding:0 0 16px"><button class="again" data-close>合上眼,记住这张网</button></div>`;
  modal.classList.remove('hidden'); modalOpen = true;
  cardBody.querySelector('[data-close]')?.addEventListener('click', closeModals);
  blip(196); setTimeout(() => blip(262), 220); setTimeout(() => blip(392), 440); setTimeout(() => blip(523), 700);
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
  npcFrame++;
  let ni = 0;
  for (const n of allNpcs) {
    ni++;
    // 远端 NPC 降频:600 米外每 8 帧更新一次
    const farD2 = (player.position.x - n.g.position.x) ** 2 + (player.position.z - n.g.position.z) ** 2;
    if (farD2 > 360000 && (npcFrame + ni) % 8 !== 0) continue;
    if (n.night || n.day) {   // 昼夜限定 NPC(兰若寺)
      const show = n.night ? curDA < .35 : curDA >= .35;
      n.g.visible = show;
      if (!show) { n.bub.classList.add('hidden'); n.talk = false; continue; }
    }
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
    animLimbs(n.g, n.phase, (n.wander && n.wp) ? .5 : .06);
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
    const x = (px / mm.width - .5) * 3950, z = (py / mm.height - .5) * 3850;
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
  const W2X = x => (x / 3950 + .5) * mm.width, W2Y = z => (z / 3850 + .5) * mm.height;
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
  for (const iz of ISLES) {     // 六新岛(桃花源不标——秘境)
    if (iz.c === THY) continue;
    mctx.fillStyle = '#e8e4dc';
    mctx.beginPath(); mctx.arc(W2X(iz.c.x), W2Y(iz.c.z), 2.4, 0, 7); mctx.fill();
  }
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

/* --- 世界地图(M) --- */
const bigmapEl = $('bigmap'), bigCv = $('bigmapCv'), bigCtx = bigCv ? bigCv.getContext('2d') : null;
let bigBase = null;
const MAP_LABELS = [
  ['收藏之岛', 0, -60], ['灯塔屿', IS2.x, IS2.z], ['楚门的世界', TRU.x, TRU.z], ['中土', MID.x, MID.z],
  ['霍格沃茨', HOG.x, HOG.z], ['南塔开特', MOB.x, MOB.z], ['体育岛', SPT.x, SPT.z], ['山海经', SHJ.x, SHJ.z],
  ['一千零一夜', ANH.x, ANH.z], ['鹦鹉螺锚地', NEM.x, NEM.z], ['B-612', B612.x, B612.z], ['侏罗纪公园', JUR.x, JUR.z],
  ['花果山', HGS.x, HGS.z], ['爱丽丝仙境', ALC.x, ALC.z], ['赤壁', CBI.x, CBI.z], ['兰若寺', LRS.x, LRS.z],
  ['梁山泊', LSP.x, LSP.z], ['风车原野', FCY.x, FCY.z], ['伊夫堡', YFB.x, YFB.z], ['绝望岛', RBX.x, RBX.z],
  ['大观园', DGY.x, DGY.z], ['炼狱山', PUR.x, PUR.z], ['塞壬海域⚠', SIR.x, SIR.z],
  ...NISLES.map(s => [NI_CONTENT[s.key].name, s.x, s.z]),
];
function renderBigMap() {
  if (!bigCtx) return;
  const W3 = bigCv.width, H3 = bigCv.height, SC2 = 4000;
  const BX = x => (x / SC2 + .5) * W3, BY = z => (z / (SC2 * H3 / W3) + .5) * H3;
  if (!bigBase) {
    bigBase = document.createElement('canvas'); bigBase.width = W3; bigBase.height = H3;
    const c = bigBase.getContext('2d');
    const img = c.createImageData(W3, H3);
    for (let py = 0; py < H3; py += 2) for (let px = 0; px < W3; px += 2) {
      const x = (px / W3 - .5) * SC2, z = (py / H3 - .5) * (SC2 * H3 / W3);
      const h = height(x, z);
      let r2, g3, b2;
      if (h < -.5) { r2 = 24; g3 = 62; b2 = 92; }
      else if (h < 1.8) { r2 = 216; g3 = 200; b2 = 150; }
      else if (h > 34) { r2 = 238; g3 = 243; b2 = 245; }
      else if (h > 26) { r2 = 141; g3 = 133; b2 = 119; }
      else { r2 = 106; g3 = 165; b2 = 78; }
      for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const o2 = ((py + oy) * W3 + px + ox) * 4;
        img.data[o2] = r2; img.data[o2 + 1] = g3; img.data[o2 + 2] = b2; img.data[o2 + 3] = 255;
      }
    }
    c.putImageData(img, 0, 0);
    c.font = 'bold 15px "Microsoft YaHei", sans-serif';
    c.textAlign = 'center';
    for (const [nm3, lx3, lz3] of MAP_LABELS) {
      c.lineWidth = 4; c.strokeStyle = 'rgba(10,16,10,.75)';
      c.strokeText(nm3, BX(lx3), BY(lz3) - 8);
      c.fillStyle = nm3.includes('⚠') ? '#ff9d8a' : '#f5efdc';
      c.fillText(nm3, BX(lx3), BY(lz3) - 8);
    }
  }
  bigCtx.drawImage(bigBase, 0, 0);
  if (PSTORE.getItem('w1001.skeleton') === '1') {   // 世界脐带:海底隧道网浮现为符号(自中心辐射 + 外环)
    const pts = MAZE_PORTALS.map(p => [BX(p.surf[0]), BY(p.surf[1])]);
    const cX = BX(0), cZ = BY(0);
    bigCtx.strokeStyle = 'rgba(120,220,255,.5)'; bigCtx.lineWidth = 1;
    for (const [px, py] of pts) { bigCtx.beginPath(); bigCtx.moveTo(cX, cZ); bigCtx.lineTo(px, py); bigCtx.stroke(); }   // 辐射脐带
    bigCtx.strokeStyle = 'rgba(120,220,255,.28)';
    const ring = pts.slice().sort((a, b) => Math.atan2(a[1] - cZ, a[0] - cX) - Math.atan2(b[1] - cZ, b[0] - cX));
    bigCtx.beginPath(); ring.forEach(([px, py], i) => i ? bigCtx.lineTo(px, py) : bigCtx.moveTo(px, py)); bigCtx.closePath(); bigCtx.stroke();   // 外环
    bigCtx.fillStyle = '#7fdcff'; for (const [px, py] of pts) { bigCtx.beginPath(); bigCtx.arc(px, py, 2, 0, 7); bigCtx.fill(); }
    const core = bigCtx.createRadialGradient(cX, cZ, 0, cX, cZ, 14); core.addColorStop(0, 'rgba(140,250,255,.9)'); core.addColorStop(1, 'rgba(140,250,255,0)');
    bigCtx.fillStyle = core; bigCtx.beginPath(); bigCtx.arc(cX, cZ, 14, 0, 7); bigCtx.fill();
    bigCtx.fillStyle = '#8fe0ff'; bigCtx.font = 'italic 13px "Microsoft YaHei",sans-serif'; bigCtx.textAlign = 'center';
    bigCtx.fillText('海下大迷宫 · 世界脐带', cX, cZ - 20);
  }
  bigCtx.fillStyle = '#ffd76a';
  bigCtx.beginPath(); bigCtx.arc(BX(player.position.x), BY(player.position.z), 6, 0, 7); bigCtx.fill();
  bigCtx.fillStyle = '#26211a';
  bigCtx.beginPath(); bigCtx.arc(BX(player.position.x), BY(player.position.z), 2.6, 0, 7); bigCtx.fill();
}
function toggleBigMap() {
  if (!bigmapEl) return;
  const opening = bigmapEl.classList.contains('hidden');
  if (opening) { renderBigMap(); bigmapEl.classList.remove('hidden'); modalOpen = true; }
  else { bigmapEl.classList.add('hidden'); modalOpen = false; }
}
if (bigmapEl) {
  bigmapEl.addEventListener('click', e => { if (e.target === bigmapEl || e.target.dataset.close !== undefined) toggleBigMap(); });
  bigmapEl.querySelector('[data-close]')?.addEventListener('click', () => toggleBigMap());
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
CP_MARKS.push({ x: SHJ.x, z: SHJ.z, col: '#c9d8a0' });
CP_MARKS.push({ x: ANH.x, z: ANH.z, col: '#e8c86a' });
CP_MARKS.push({ x: NEM.x, z: NEM.z, col: '#8ae0d8' });
CP_MARKS.push({ x: B612.x, z: B612.z, col: '#f2d13c' });
CP_MARKS.push({ x: JUR.x, z: JUR.z, col: '#9cc46a' });
CP_MARKS.push({ x: HGS.x, z: HGS.z, col: '#f5c9a0' });
CP_MARKS.push({ x: ALC.x, z: ALC.z, col: '#f5c9d4' });
CP_MARKS.push({ x: CBI.x, z: CBI.z, col: '#e8a45e' });
CP_MARKS.push({ x: LRS.x, z: LRS.z, col: '#a0b0c8' });
CP_MARKS.push({ x: LSP.x, z: LSP.z, col: '#e8d06a' });
CP_MARKS.push({ x: FCY.x, z: FCY.z, col: '#e8d8a0' });
CP_MARKS.push({ x: YFB.x, z: YFB.z, col: '#a8b8d0' });
CP_MARKS.push({ x: RBX.x, z: RBX.z, col: '#d8c89a' });
CP_MARKS.push({ x: DGY.x, z: DGY.z, col: '#e8b8cc' });
CP_MARKS.push({ x: PUR.x, z: PUR.z, col: '#ccd8f0' });
for (const s of NISLES) CP_MARKS.push({ x: s.x, z: s.z, col: '#cfe0ea' });
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
/* --- 海上的船(boats 声明已前移至名著十岛块前) --- */
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
/* —— 老人与海:圣地亚哥的小船 + 拴在船舷的大马林鱼(不设岛,挂在钓鱼栈桥旁)—— */
{
  makeBoat(null, .82).userData = { anchor: [13, 414] };   // 圣地亚哥的小帆船
  // 大马林鱼(拴在船舷,半浮于水)
  const mx = 13, mz = 407, my = .9;
  const marlin = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), lam(0x35548a)); body.scale.set(1, 1.15, 3.4); marlin.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(.92, 12, 10), lam(0xccd6e2)); belly.scale.set(.86, .64, 3.1); belly.position.y = -.32; marlin.add(belly);
  const bill = new THREE.Mesh(new THREE.ConeGeometry(.16, 3.4, 6), lam(0x24324a)); bill.rotation.x = Math.PI / 2; bill.position.z = 5.2; marlin.add(bill);
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(1.7, .12, 3), lam(0x2a4a7a)); dorsal.rotation.z = Math.PI / 2; dorsal.scale.set(1, 1, .5); dorsal.position.set(0, 1.4, .6); marlin.add(dorsal);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.6, 4), lam(0x2a4a7a)); tail.rotation.x = -Math.PI / 2; tail.scale.set(1, .28, 1); tail.position.z = -3.6; marlin.add(tail);
  marlin.position.set(mx, my, mz); marlin.rotation.y = .35; marlin.rotation.z = .12; scene.add(marlin);
  window.__marlin = marlin;
  // 圣地亚哥(老人)+ 马诺林(男孩),站在可行走的桥面上
  addNpc({ x: 0, z: 400, y: 1.85, name: '圣地亚哥', body: 0x6a7a6a, hat: 0xb8a888, opts: { tall: 1.02 }, face: '🧓',
    lines: ['一个人可以被毁灭,但不能被打败。', '这是我打过的最大的鱼——整整八十四天没开张,然后就是它。', '可惜孩子不在。有他在,就好了。'],
    topics: [
      { q: '那条大鱼呢?', a: '比船还长。我跟它耗了三天三夜,手都勒烂了。终于把鱼叉扎进它心脏——可回来的路上,鲨鱼闻着血来了。' },
      { q: '鲨鱼来了怎么办?', a: '打。用鱼叉、用桨、用舵把。它们咬一口,我还一下。等靠岸,只剩一副雪白的大骨架了……但我没认输。' },
      { q: '还会再出海吗?', a: '当然。明天,后天,只要我还拿得动桨。人不是为失败而生的。' },
    ] });
  addNpc({ x: 0, z: 372, y: 1.85, name: '马诺林', body: 0xd98a3a, hat: 0x8c5a20, opts: { tall: .72 }, face: '🧒',
    lines: ['圣地亚哥老爹!我给你带了沙丁鱼和啤酒。', '他们说你倒了血霉,可我不信。', '等我长大,还跟你一条船。' ] });
  addSpot(0, 411, 'lore', 'marlin', { r: 6, y: 1.85 });
}
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
  // 雨天渔汛:上钩更快
  fishing.t = (2.2 + Math.random() * 4.5) * (WEATHER === 'rain' ? .5 : 1);
  bobber.position.set(fs.bx, .35, fs.bz); bobber.visible = true;
  blip(440);
}
function endFishing() { fishing.state = 'idle'; fishing.spot = null; bobber.visible = false; }
function catchFish() {
  const f = D.fish[Math.floor(Math.random() * D.fish.length)];
  const rainy = WEATHER === 'rain';
  const price = ((FISH_PRICE[f.cat] || 4) + (gearOn('rod') ? 2 : 0)) * (rainy ? 2 : 1);   // 雨天渔汛:售价翻倍
  openCard({ cat: 'fish', type: 'tank', item: f });   // 收进图鉴(+2)
  try { PSTORE.setItem('w1001.fishcount', String((parseInt(PSTORE.getItem('w1001.fishcount') || '0', 10) || 0) + 1)); } catch (e) {}
  earnSB(price);
  toast(`🎣 钓到了「${f.name}」!卖给水族馆 ⚡+${price}${rainy ? '(雨天渔汛×2)' : ''}`);
  blip(880); setTimeout(() => blip(1180), 110);
  endFishing();
}
function updateFishing(dt, t) {
  if (fishing.state === 'idle') return;
  fishing.t -= dt;
  if (fishing.state === 'wait') {
    bobber.position.y = .35 + Math.sin(t * 2.2) * .1;
    if (fishing.t <= 0) { fishing.state = 'bite'; fishing.t = (gearOn('rod') ? 2.1 : 1.15) + (PSTORE.getItem('w1001.rodbuff') === '1' ? .35 : 0); blip(1400); }
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
  const plimbs = {};
  for (const s of [-1, 1]) {   // 腿
    const hip = new THREE.Group(); hip.position.set(.22 * s, .78, 0);
    const leg = cyl(.17, .19, .8, lam(0x2c5578)); leg.position.y = -.4; hip.add(leg);
    const foot = box(.24, .14, .44, M.woodDark); foot.position.set(0, -.78, .12); hip.add(foot);
    player.add(hip); plimbs[s < 0 ? 'legL' : 'legR'] = hip;
  }
  for (const s of [-1, 1]) {   // 臂
    const sh = new THREE.Group(); sh.position.set(.6 * s, 1.6, 0);
    const arm = cyl(.13, .15, .82, lam(0x3b6ea5)); arm.position.y = -.41; sh.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.14, 6, 5), lam(0xf2c9a0)); hand.position.y = -.82; sh.add(hand);
    player.add(sh); plimbs[s < 0 ? 'armL' : 'armR'] = sh;
  }
  for (const s of [-1, 1]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(.08, 6, 5), lam(0x222222)); eye.position.set(.17 * s, 2.4, .48); player.add(eye); }
  player.userData.limbs = plimbs;
  player.userData.procMeshes = player.children.filter(c => c.isMesh || c.userData.limbs || c.type === 'Group');   // 程序化可见部件(加载 glTF 后隐藏)
  lantern = new THREE.PointLight(0xffc978, 0, 22, 2);
  lantern.position.set(0, 2.6, .6); player.add(lantern);
}
/* --- 玩家 glTF 骨骼模型(RobotExpressive,Three CDN 自带,含骨骼动画;加载失败则沿用程序化模型)--- */
let playerMixer = null, playerActions = {}, playerAct = '', usingGLTF = false, playerRobot = null;
function setPlayerAct(name, fade = .22) {
  if (!playerMixer || playerAct === name || !playerActions[name]) return;
  const nx = playerActions[name]; nx.reset().fadeIn(fade).play();
  if (playerActions[playerAct]) playerActions[playerAct].fadeOut(fade);
  playerAct = name;
}
try {
  new GLTFLoader().load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
    gltf => {
      playerRobot = gltf.scene; playerRobot.scale.setScalar(.46); playerRobot.rotation.y = 0; playerRobot.position.y = 0;   // 该模型原点即脚底(与官方示例一致),配合物理 +.06 抬升防陷
      playerRobot.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
      player.add(playerRobot);
      for (const m of player.userData.procMeshes) m.visible = false;   // 隐藏程序化部件,保留提灯
      playerMixer = new THREE.AnimationMixer(playerRobot);
      for (const c of gltf.animations) playerActions[c.name] = playerMixer.clipAction(c);
      usingGLTF = true; playerAct = 'Idle'; playerActions['Idle'] && playerActions['Idle'].play();
    }, undefined, () => {/* 加载失败:保留程序化模型 */ });
} catch (e) {}
const blob = new THREE.Mesh(new THREE.CircleGeometry(1, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .3 }));
blob.rotation.x = -Math.PI / 2; scene.add(blob);
player.position.set(0, height(0, 14) + .1, 14);
scene.add(player);
let vy = 0, grounded = true, swimming = false, walkPhase = 0, faceYaw = 0;

/* --- 跟随玩家的实例化草地(荒野之息式,着色器风摆,零 CPU 摇曳) --- */
let grassBlades = null, grassMat = null, grassCx = 1e9, grassCz = 1e9, flowerInst = null, rockInst = null;
{
  const GN = MOBILE ? 1000 : 2400, R = MOBILE ? 30 : 42;
  const bladeGeo = new THREE.ConeGeometry(.055, .62, 3);   // 细小草叶(更像草,不像圆锥)
  bladeGeo.translate(0, .31, 0);   // 基部落到 y=0,便于自底摇摆
  grassMat = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: false });
  grassMat.onBeforeCompile = sh => {
    sh.uniforms.uTime = { value: 0 };
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      `#include <begin_vertex>
       #ifdef USE_INSTANCING
         vec3 iP = instanceMatrix[3].xyz;
       #else
         vec3 iP = vec3(0.0);
       #endif
       float wv = sin(uTime * 1.5 + iP.x * .28 + iP.z * .19) * .16 * transformed.y;
       transformed.x += wv; transformed.z += wv * .55;`);
    grassMat.userData.shader = sh;
  };
  grassBlades = new THREE.InstancedMesh(bladeGeo, grassMat, GN);
  grassBlades.frustumCulled = false;
  scene.add(grassBlades);
  grassBlades.userData = { GN, R, rnd: mulberry32(303) };
  const gc = [new THREE.Color(0x5aa048), new THREE.Color(0x6cb556), new THREE.Color(0x4c8c40), new THREE.Color(0x7fb85e)];
  for (let i = 0; i < GN; i++) grassBlades.setColorAt(i, gc[i % 4]);
  // 野花:草丛间零星点缀(实例化,随草一起重铺)
  const FN = MOBILE ? 140 : 320;
  flowerInst = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.26, 0), new THREE.MeshLambertMaterial({ vertexColors: false }), FN);
  flowerInst.frustumCulled = false;
  scene.add(flowerInst);
  flowerInst.userData = { FN, R, rnd: mulberry32(717) };
  const fc = [new THREE.Color(0xe8b4c8), new THREE.Color(0xffd76a), new THREE.Color(0xffffff), new THREE.Color(0xd94f6b), new THREE.Color(0x9a7fd6)];
  for (let i = 0; i < FN; i++) flowerInst.setColorAt(i, fc[i % 5]);
  // 碎石:地表零星石块(随草一起重铺)
  const KN = MOBILE ? 70 : 150;
  rockInst = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.55, 0), new THREE.MeshLambertMaterial({ vertexColors: false }), KN);
  rockInst.frustumCulled = false;
  scene.add(rockInst);
  rockInst.userData = { KN, R, rnd: mulberry32(431) };
  const kc = [new THREE.Color(0x8d8577), new THREE.Color(0x9a9184), new THREE.Color(0x77706a), new THREE.Color(0xa39a8c)];
  for (let i = 0; i < KN; i++) rockInst.setColorAt(i, kc[i % 4]);
}
/* 无草岛屿(按地理:火山岩/沙滩/岩石/荒岛/石铺港,不长草)*/
const NO_GRASS = [
  { x: -1780, z: -420, r: 108 },  // 神秘岛(火山岩)
  { x: 1720, z: -520, r: 108 },   // 金银岛(海盗沙滩)
  { x: 180, z: 1780, r: 100 },    // 珊瑚岛(珊瑚沙)
  { x: -560, z: -1680, r: 100 },  // 禁闭岛(岩石)
  { x: -1490, z: -1010, r: 100 }, // 莫罗博士岛(荒岛)
  { x: 120, z: 800, r: 150 },     // 南塔开特(石铺捕鲸港)
];
function grassOK(x, z) { for (const g of NO_GRASS) if ((x - g.x) ** 2 + (z - g.z) ** 2 < g.r * g.r) return false; return true; }
function redistributeGrass(cx, cz) {
  grassCx = cx; grassCz = cz;
  const u = grassBlades.userData, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
  for (let i = 0; i < u.GN; i++) {
    const a = u.rnd() * 6.2832, rr = Math.sqrt(u.rnd()) * u.R;
    const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr, h = height(x, z);
    if (h > 2.6 && h < 19 && grassOK(x, z) && fbm(x * .045, z * .045) > .5) {   // 草地高度带 + 地理门控 + 噪声成簇(留出空地)
      e.set(0, u.rnd() * 6.2832, 0);
      q.setFromEuler(e); s.set(.9 + u.rnd() * .5, .7 + u.rnd() * .5, .9 + u.rnd() * .5);
      m4.compose(p.set(x, h, z), q, s);
    } else {
      m4.compose(p.set(x, -999, z), q.identity(), s.set(0, 0, 0));   // 非草地:藏起
    }
    grassBlades.setMatrixAt(i, m4);
  }
  grassBlades.instanceMatrix.needsUpdate = true;
  if (grassBlades.instanceColor) grassBlades.instanceColor.needsUpdate = true;
  // 野花同步重铺
  if (flowerInst) {
    const fu = flowerInst.userData;
    for (let i = 0; i < fu.FN; i++) {
      const a = fu.rnd() * 6.2832, rr = Math.sqrt(fu.rnd()) * fu.R;
      const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr, h = height(x, z);
      if (h > 2.8 && h < 17 && grassOK(x, z)) { q.setFromEuler(e.set(0, fu.rnd() * 6.2832, 0)); s.set(1, 1, 1); m4.compose(p.set(x, h + .45, z), q, s); }
      else m4.compose(p.set(x, -999, z), q.identity(), s.set(0, 0, 0));
      flowerInst.setMatrixAt(i, m4);
    }
    flowerInst.instanceMatrix.needsUpdate = true;
    if (flowerInst.instanceColor) flowerInst.instanceColor.needsUpdate = true;
  }
  // 碎石同步重铺(草地与低岩带,半埋入地)
  if (rockInst) {
    const ku = rockInst.userData;
    for (let i = 0; i < ku.KN; i++) {
      const a = ku.rnd() * 6.2832, rr = Math.sqrt(ku.rnd()) * ku.R;
      const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr, h = height(x, z);
      if (h > 2 && h < 26) { q.setFromEuler(e.set(ku.rnd() * 3, ku.rnd() * 6.28, ku.rnd() * 3)); const sc = .5 + ku.rnd() * 1.4; s.set(sc, sc * .7, sc); m4.compose(p.set(x, h + .1, z), q, s); }
      else m4.compose(p.set(x, -999, z), q.identity(), s.set(0, 0, 0));
      rockInst.setMatrixAt(i, m4);
    }
    rockInst.instanceMatrix.needsUpdate = true;
    if (rockInst.instanceColor) rockInst.instanceColor.needsUpdate = true;
  }
}
/* --- 萤火虫(夜间草地随玩家浮动发光) --- */
let fireflies = null, ffCx = 1e9, ffCz = 1e9;
{
  const FF = MOBILE ? 20 : 42;
  const fc0 = document.createElement('canvas'); fc0.width = fc0.height = 32;
  const fx0 = fc0.getContext('2d');
  const fg = fx0.createRadialGradient(16, 16, 0, 16, 16, 16);
  fg.addColorStop(0, 'rgba(255,255,240,1)'); fg.addColorStop(.35, 'rgba(230,255,150,.6)'); fg.addColorStop(1, 'rgba(200,255,120,0)');
  fx0.fillStyle = fg; fx0.fillRect(0, 0, 32, 32);
  const ffTex = new THREE.CanvasTexture(fc0);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FF * 3), 3));
  fireflies = new THREE.Points(g, new THREE.PointsMaterial({ map: ffTex, color: 0xf2ffa0, size: 1.5, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false }));
  fireflies.frustumCulled = false;
  const ph = new Float32Array(FF), r0 = mulberry32(555);
  for (let i = 0; i < FF; i++) ph[i] = r0() * 6.2832;
  fireflies.userData = { FF, R: 34, rnd: r0, base: new Float32Array(FF * 3), ph };
  scene.add(fireflies);
}
function redistributeFireflies(cx, cz) {
  ffCx = cx; ffCz = cz;
  const u = fireflies.userData, b = u.base;
  for (let i = 0; i < u.FF; i++) {
    const a = u.rnd() * 6.2832, rr = Math.sqrt(u.rnd()) * u.R;
    const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr, h = height(x, z);
    b[i * 3] = x; b[i * 3 + 2] = z;
    b[i * 3 + 1] = (h > 2.2 && h < 20) ? h + 1.2 + u.rnd() * 2.5 : -999;
  }
}
/* --- 流星(夜空偶尔划过) --- */
let meteor = null, meteorT = 10, meteorLife = 0;
{
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  meteor = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  meteor.frustumCulled = false;
  meteor.userData = { dir: new THREE.Vector3(), head: new THREE.Vector3() };
  scene.add(meteor);
}
/* --- 晨昏地面薄雾(软精灵贴地,低洼处浮现,twilight 时最浓) --- */
let mistPts = null, mistCx = 1e9, mistCz = 1e9;
{
  const mc = document.createElement('canvas'); mc.width = mc.height = 128;
  const mx2 = mc.getContext('2d');
  const grd = mx2.createRadialGradient(64, 64, 8, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,.55)'); grd.addColorStop(.55, 'rgba(255,255,255,.22)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  mx2.fillStyle = grd; mx2.fillRect(0, 0, 128, 128);
  const mtex = new THREE.CanvasTexture(mc);
  const MN = MOBILE ? 26 : 46;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MN * 3), 3));
  mistPts = new THREE.Points(g, new THREE.PointsMaterial({ map: mtex, color: 0xe6edf3, size: 36, transparent: true, opacity: 0, depthWrite: false, fog: false, sizeAttenuation: true }));
  mistPts.frustumCulled = false;
  const ph = new Float32Array(MN), r0 = mulberry32(919);
  for (let i = 0; i < MN; i++) ph[i] = r0() * 6.2832;
  mistPts.userData = { MN, R: 62, rnd: r0, base: new Float32Array(MN * 3), ph };
  scene.add(mistPts);
}
function redistributeMist(cx, cz) {
  mistCx = cx; mistCz = cz;
  const u = mistPts.userData, b = u.base;
  for (let i = 0; i < u.MN; i++) {
    const a = u.rnd() * 6.2832, rr = Math.sqrt(u.rnd()) * u.R;
    const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr, h = height(x, z);
    b[i * 3] = x; b[i * 3 + 2] = z;
    b[i * 3 + 1] = (h > 1.6 && h < 15) ? h + 1.8 : -999;   // 低洼草地才起雾
  }
}
/* 恢复上次位置 */
try {
  const sv = JSON.parse(PSTORE.getItem('w1001.pos3d') || 'null');
  if (Array.isArray(sv) && sv.every(Number.isFinite) && Math.hypot(sv[0], sv[1]) < 1560) {
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
    if (bokehPass) bokehPass.enabled = photoMode;   // 景深仅照片模式
    if (!photoMode) { cv.style.filter = ''; photoFilter = 0; toast('已退出照片模式'); }
    else toast('📷 照片模式:景深虚化开启(F 切换滤镜,P 退出)');
    return;
  }
  if (k === 'f' && photoMode) {   // 照片滤镜
    photoFilter = (photoFilter + 1) % PHOTO_FILTERS.length;
    cv.style.filter = PHOTO_FILTERS[photoFilter][1];
    toast('🎞️ 滤镜:' + PHOTO_FILTERS[photoFilter][0]);
    return;
  }
  if (k === 'm') { toggleBigMap(); return; }
  if (k === 'g' && !MOBILE) { quality = (quality + 2) % 3; applyQuality(); toast('🖥️ 画质:' + ['低(最流畅)', '中', '高(GTAO 环境光遮蔽)'][quality]); return; }
  if (k === 'q' && diving) { fireSonar(); return; }   // 声呐探路
  if (k === 'k') {   // 观星模式:夜间显示星座名
    starGaze = !starGaze;
    toast(starGaze ? (curDA >= .32 ? '🔭 观星模式已开(夜幕降临后仰望星空)' : '🔭 观星模式:仰望星空,星座之名浮现') : '观星模式已关');
    return;
  }
  if (modalOpen) { if (k === 'e' || k === 'enter') closeModals(); return; }
  if (k === 'e' || k === 'enter') { tryInteract(); return; }
  if (k === ' ') { e.preventDefault(); keys[' '] = true; if (!diving && grounded && !swimming) vy = gearOn('boots') ? 13.4 : 11.5; return; }
  if (k === 'b') { modalOpen ? closeModals() : openBag(); return; }
  keys[k] = true;
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
let nearSpot = null, nearFspot = null, nearNpc = null, talkNpc = null;
function tryInteract() {
  if (diving) { if (nearPortal >= 0) surfaceDive(nearPortal); return; }
  if (fishing.state === 'bite') { catchFish(); return; }
  if (fishing.state === 'wait') { toast('收竿了,今天鱼不咬钩'); endFishing(); return; }
  if (nearSpot && nearSpot.cat === 'dive') { enterDive(nearSpot.portal); return; }
  if (nearSpot) { openCard(nearSpot); return; }
  if (nearFspot) { startCast(nearFspot); return; }
  if (nearNpc) talkTo(nearNpc);
}
/* --- NPC 文字对话:走近按 E,选话题、听应答 --- */
function talkTo(npc) { talkNpc = npc; npc._t = 0; renderTalk(npc.lines[0] || '(……)'); blip(520); }
function renderTalk(text) {
  const npc = talkNpc; if (!npc) return;
  const topics = npc.topics || [];
  cardBody.innerHTML = `<div class="cardHead" style="background:#3a4a6a">💬 与 ${esc(npc.name)} 交谈</div>
    <div class="cardMedia"><div class="paperRoll">${npc.face || '🧑'}</div></div>
    <div class="cardDesc" style="min-height:56px;font-size:15px;line-height:1.8">"${esc(text)}"</div>
    <div style="padding:0 20px 16px">
      ${topics.map((tp, i) => `<button class="gBtn off" data-topic="${i}" style="display:block;width:100%;margin:6px 0;text-align:left">${esc(tp.q)}</button>`).join('')}
      <button class="gBtn off" data-more style="display:block;width:100%;margin:6px 0">…(听他再说些)</button>
      <button class="gBtn" data-bye style="display:block;width:100%;margin:6px 0">告辞</button>
    </div>`;
  modal.classList.remove('hidden'); modalOpen = true;
  cardBody.querySelectorAll('[data-topic]').forEach(b => b.addEventListener('click', () => { renderTalk(topics[+b.dataset.topic].a); blip(660); }));
  cardBody.querySelector('[data-more]')?.addEventListener('click', () => { npc._t = ((npc._t || 0) + 1) % npc.lines.length; renderTalk(npc.lines[npc._t]); });
  cardBody.querySelector('[data-bye]')?.addEventListener('click', () => closeModals());
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
    stickBase = null; joy = { on: false, vx: 0, vy: 0, up: joy.up, down: joy.down };   // 保留潜水上浮/下潜按钮状态
    knob.style.transform = 'translate(-50%,-50%)'; stick.classList.add('hidden');
  }
  if (dragCam && e.pointerId === dragCam.id) dragCam = null;
};
addEventListener('pointerup', endPtr); addEventListener('pointercancel', endPtr);
addEventListener('wheel', e => { camDist = clamp(camDist * (1 + e.deltaY * .001), 7, 30); }, { passive: true });

/* ---------- 主循环 ---------- */
const HINTS = { painting: '欣赏这幅画', shelf: '翻翻这架书', tree: '观察这只鸟', bed: '看看这株植物', bar: '来一杯!', keg: '看看这桶酒', table: '看看桌上的酒', tank: '看看水里', crate: '翻翻唱片', stand: '听听这份录音', tent: '参观营地', board: '查看路线', sign: '查看路牌', news: '报亭 · 今日两刊', shop: '逛逛装备行', ferry: '多元宇宙渡口', door: '推开天空之门', camera: '看看那是什么', lamp: '检查坠落物', ring: '看看基座上的东西', crater: '末日火山口', hole: '敲敲圆门', eye: '仰望黑塔(别看太久)', train: '霍格沃茨特快', castle: '城堡大门 · 分院帽', hoops: '魁地奇球场', hut: '拜访海格小屋', inn: '喷水鲸客栈', chowder: '来碗杂烩汤(4 SB)', doubloon: '桅杆上的金币', stadium: '梦剧场 · 德比日', pitch: '场边观战', scalper: '这位朋友鬼鬼祟祟', gate: '沉睡的星门', bluehole: '🤿 潜入海底蓝洞' };
for (const k in LORE) HINTS[k] = LORE[k].hint;
const clock = new THREE.Clock();
const v3 = new THREE.Vector3();
let saveT = 0, whaleT = 20, coldT = 0, lastTint = 0x3b6ea5, chowderT = 0, lastScoreMin = -1;
let flight = null, roarT = 14, sirenT = 2;
let bucketT = 0, npcFrame = 0, fpsN = 0, fpsT = 0, prScale = MOBILE ? 1.5 : 1.75;
const PR_MAX = prScale;
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
  let pMoving = false;

  /* 海底潜水:自由 3D 游动 + 隧道约束 + 气瓶 + 出口检测 */
  if (diving) {
    if (!modalOpen) {
      let mx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
      let mz = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
      if (joy.on) { mx = joy.vx; mz = joy.vy; }
      const sp = (gearOn('swim') ? 13 : 9) * dt;
      const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw), rx = -fz, rz = fx;
      player.position.x += (fx * -mz + rx * mx) * sp;
      player.position.z += (fz * -mz + rz * mx) * sp;
      if (keys[' '] || joy.up) player.position.y += sp;
      if (keys.shift || joy.down) player.position.y -= sp;
      if (Math.hypot(mx, mz) > .1) { faceYaw = camYaw; pMoving = true; walkPhase += dt * 6; }
    }
    clampToMaze(player.position);
    player.rotation.x += ((-1.2 - camPitch * .25) - player.rotation.x) * Math.min(1, dt * 6);   // 潜水俯身姿态
    diveLight.position.set(player.position.x - Math.sin(camYaw) * 3, player.position.y + 1, player.position.z - Math.cos(camYaw) * 3);
    diveLight.intensity = 2.4;
    if (causticLight) {   // 焦散光斑自上而下,贴图缓慢漂移
      causticLight.position.set(player.position.x, player.position.y + 34, player.position.z);
      causticLight.target.position.set(player.position.x, player.position.y - 6, player.position.z);
      causticLight.intensity = 2.6; causticTex.offset.x = t * .035; causticTex.offset.y = t * .022;
    }
    // 气瓶(气室内回充)
    let inAir = false;
    for (const ni of AIR_NODES) { const n = MAZE_NODES[ni]; if (Math.hypot(player.position.x - n[0], player.position.y - n[1], player.position.z - n[2]) < TUBE_R + 3) { inAir = true; break; } }
    diveAir = inAir ? Math.min(100, diveAir + dt * 28) : diveAir - dt * 1.4;
    if (inAir && airChamberT <= 0) { airChamberT = 6; toast('🫧 气室——氧气回满,喘口气再走'); }
    airChamberT -= dt;
    const fill = $('diveAirFill'); if (fill) { fill.style.width = Math.max(0, diveAir) + '%'; fill.style.background = diveAir < 25 ? '#ff5a4a' : 'linear-gradient(90deg,#2ad0ff,#7affd0)'; }
    if (diveAir <= 0) { toast('🫧 憋不住了——你勉强浮回了洞口'); surfaceDive(diveEntry); }
    // 潮汐门 / 满月门:升降开合 + 关闭时挡路
    for (const gm of gateMeshes) {
      const open = gateOpen(gm.cfg, t);
      gm.bars.position.y += ((open ? gm.openY : 0) - gm.bars.position.y) * Math.min(1, dt * 3);
      if (!open) {
        const d = Math.hypot(player.position.x - gm.mid.x, player.position.y - gm.mid.y, player.position.z - gm.mid.z);
        if (d < 5.5 && d > .001) { const f = 5.5 / d; player.position.x = gm.mid.x + (player.position.x - gm.mid.x) * f; player.position.y = gm.mid.y + (player.position.y - gm.mid.y) * f; player.position.z = gm.mid.z + (player.position.z - gm.mid.z) * f;
          if (gateHintT <= 0) { gateHintT = 5; toast(gm.cfg.kind === 'moon' ? '🌕 这道门只在满月之夜开启……' : '🌊 潮汐门关闭中——退潮时它会再次升起'); } }
      }
    }
    gateHintT -= dt;
    // 死路/中心发现(迷路有奖励)
    for (const nk in DISC) { const n = MAZE_NODES[nk], d = DISC[nk]; if (Math.hypot(player.position.x - n[0], player.position.y - n[1], player.position.z - n[2]) < 10) {
      if (d.flag) { if (PSTORE.getItem('w1001.' + d.flag) !== '1') { PSTORE.setItem('w1001.' + d.flag, '1'); if (d.sb) earnSB(d.sb); if (d.star) { stars++; saveQuest(); updateQuestHUD(); } toast(d.msg); blip(760); maybeRevealSkeleton(); } }
      else if (!discSeen.has(nk)) { discSeen.add(nk); toast(d.msg); blip(560); }
    } }
    // 潮汐之心搏动 + 巨鲸掠过玻璃观景廊
    if (tidalHeart) { const s = 1 + Math.sin(t * 1.6) * .12; tidalHeart.children[1].scale.setScalar(s); tidalHeart.rotation.y = t * .3; }
    if (mazeWhale) { const m = mazeWhale.userData.mid, ph = (t * .06) % 1, wz = -60 + ph * 120; mazeWhale.position.set(m.x + 24, m.y + 4, m.z + wz); mazeWhale.rotation.y = Math.PI / 2; }
    if (sonarT > 0) { sonarT -= dt; sonarRing.scale.setScalar(1 + (1.4 - sonarT) * 30); sonarRing.material.opacity = Math.max(0, sonarT / 1.4) * .5; if (sonarT <= 0) sonarRing.visible = false; }
    if (sonarCD > 0) sonarCD -= dt;
    // 所在主题区(最近节点)→ 雾色渐变 + HUD 区名
    { let zd = 1e9; for (let i = 0; i < MAZE_NODES.length; i++) { const n = MAZE_NODES[i], d = (player.position.x - n[0]) ** 2 + (player.position.y - n[1]) ** 2 + (player.position.z - n[2]) ** 2; if (d < zd) { zd = d; diveZone = NODE_ZONE[i]; } } }
    scene.fog.color.lerp(_zfog.setHex(ZONES[diveZone].fog), Math.min(1, dt * .5));
    // 出口检测
    nearPortal = -1;
    for (let i = 0; i < MAZE_PORTALS.length; i++) { if (i === diveEntry) continue; const n = MAZE_NODES[MAZE_PORTALS[i].n]; if (Math.hypot(player.position.x - n[0], player.position.y - n[1], player.position.z - n[2]) < 9) { nearPortal = i; break; } }
    const dh = $('diveHint');
    if (dh) dh.textContent = nearPortal >= 0 ? `⬆️ 按 E 从「${MAZE_PORTALS[nearPortal].isle}」的蓝洞浮出水面` : `${ZONES[diveZone].name} · 空格上浮 Shift下潜 · Q 声呐 · 找浮标按 E 出水`;
  }
  /* 移动 */
  if (!modalOpen && !flight && !diving) {
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
      walkPhase += dt * 10; pMoving = true;
    }
    // 边界
    const pd = Math.hypot(player.position.x, player.position.z);
    if (pd > 1950) { player.position.x *= 1950 / pd; player.position.z *= 1950 / pd; }
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
    // 梦剧场外墙:低处不可穿越,只能走四座大门(顶层可越沿跳下)
    {
      const dxS = player.position.x - SPT.x, dzS = player.position.z - SPT.z;
      const dS = Math.hypot(dxS, dzS);
      if (dS > 48.6 && dS < 52.2 && player.position.y < 26) {
        const ang = Math.atan2(dzS, dxS);
        const nearGate = [-Math.PI / 2, 0, Math.PI / 2, Math.PI].some(g => {
          let dd = Math.abs(ang - g) % (Math.PI * 2);
          if (dd > Math.PI) dd = Math.PI * 2 - dd;
          return dd < .12;
        });
        if (!nearGate) {
          const target = dS >= 50.4 ? 52.4 : 48.4;
          player.position.x = SPT.x + dxS / dS * target;
          player.position.z = SPT.z + dzS / dS * target;
        }
      }
    }
  }
  /* 重力 / 游泳(桥面可行走) */
  let gh = height(player.position.x, player.position.z);
  let bh = null;
  if (!diving) {
    bh = bridgeHeight(player.position.x, player.position.z);
    if (bh != null && player.position.y > bh - 1.6) gh = Math.max(gh, bh);
    const ph2 = pierHeight(player.position.x, player.position.z);
    if (ph2 != null && player.position.y > ph2 - 1.4) gh = Math.max(gh, ph2);
    const sth = stadiumHeight(player.position.x, player.position.z);
    if (sth != null && player.position.y > sth - 2.4) gh = Math.max(gh, sth);
    swimming = gh < -.6;
    if (swimming) {
      vy = 0; grounded = false;
      player.position.y += ((-.55 + tideY) - player.position.y) * Math.min(1, dt * 6);
      player.rotation.x += ((-1.15 + Math.sin(t * 2.4) * .08) - player.rotation.x) * Math.min(1, dt * 5);   // 俯身入水
    } else {
      player.rotation.x += (0 - player.rotation.x) * Math.min(1, dt * 8);
      vy -= 34 * dt;
      player.position.y += vy * dt;
      if (player.position.y <= gh + .06) { player.position.y = gh + .06; vy = 0; grounded = true; } else grounded = false;   // +.06 防止在崎岖地面轻微陷入
    }
  }
  player.rotation.y += ((faceYaw - player.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 10);
  player.children[0].scale.y = 1 + (grounded ? Math.sin(walkPhase) * .04 : 0);
  if (usingGLTF) {
    playerMixer.update(dt);
    setPlayerAct((swimming || diving) ? 'Running' : (pMoving ? (keys.shift ? 'Running' : 'Walking') : 'Idle'));
  } else if (swimming || diving) animSwim(player, t * 6.5);
  else animLimbs(player, pMoving ? walkPhase : t * 1.6, pMoving ? .5 : .06);
  blob.position.set(player.position.x, Math.max(gh, 0) + .06, player.position.z);
  blob.material.opacity = (swimming || diving) ? 0 : .3;

  /* 草地:移动超 7m 重铺一次,风摆逐帧 */
  if (grassBlades) {
    if ((player.position.x - grassCx) ** 2 + (player.position.z - grassCz) ** 2 > 49) redistributeGrass(player.position.x, player.position.z);
    if (grassMat.userData.shader) grassMat.userData.shader.uniforms.uTime.value = t;
    for (const m of treeWindMats) if (m.userData.shader) m.userData.shader.uniforms.uTime.value = t;   // 树冠风摆
  }

  /* 相机 */
  if (diving) {   // 洞内贴身跟随:相机留在管道内,朝游动方向看
    const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
    camera.position.lerp(v3.set(player.position.x - fx * 4.2, player.position.y + 1.6 + camPitch * 2, player.position.z - fz * 4.2), Math.min(1, dt * 9));
    camera.lookAt(player.position.x + fx * 6, player.position.y - camPitch * 3, player.position.z + fz * 6);
  } else {
    const cp = camPitch, off = new THREE.Vector3(Math.sin(camYaw) * Math.cos(cp), Math.sin(cp), Math.cos(camYaw) * Math.cos(cp)).multiplyScalar(camDist);
    const target = v3.copy(player.position).add(off);
    target.y = Math.max(target.y, height(target.x, target.z) + 1.4, .8);
    camera.position.lerp(target, Math.min(1, dt * 8));
    camera.lookAt(player.position.x, player.position.y + 2.4, player.position.z);
  }

  /* 动画:水 / 云 / 鱼 / 海鸥 / 篝火 / 鸟 */
  if (oceanWater) oceanWater.material.uniforms.time.value = t * .55;
  if (waterGeo) {
    const wp = waterGeo.attributes.position;
    for (let i = 0; i < wp.count; i += 3) {
      wp.setY(i, Math.sin(t * 1.4 + wp.getX(i) * .02 + wp.getZ(i) * .017) * .5);
    }
    wp.needsUpdate = true;
  }
  for (const c of clouds) { c.position.x += dt * c.userData.sp; if (c.position.x > 2000) c.position.x = -2000; c.scale.setScalar(1 + Math.sin(t * .1 + c.userData.ph) * .06); }   // 漂移 + 缓慢卷舒
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
  /* 六岛动态:鹦鹉螺 / 鱼群 / 恐龙 / 飞毯 / 龙吼 */
  if (nautilusHull) nautilusHull.position.y = .4 + Math.sin(t * .9) * .35;
  if (nemFishSchool) {
    const m4n = new THREE.Matrix4(), qn = new THREE.Quaternion(), sn = new THREE.Vector3(1, 1, 1), pn = new THREE.Vector3();
    for (let i = 0; i < 30; i++) {
      const a = t * (.3 + (i % 5) * .08) + i * .7, rr = 10 + (i % 6) * 4;
      pn.set(NEM.x + 34 + Math.cos(a) * rr, -1.4 - (i % 3), NEM.z + 14 + Math.sin(a) * rr);
      qn.setFromEuler(new THREE.Euler(0, -a - Math.PI / 2, 0));
      m4n.compose(pn, qn, sn);
      nemFishSchool.setMatrixAt(i, m4n);
    }
    nemFishSchool.instanceMatrix.needsUpdate = true;
  }
  if (trexGrp) {
    const ta = t * .12;
    trexGrp.position.x = JUR.x + Math.cos(ta) * 24;
    trexGrp.position.z = JUR.z + Math.sin(ta) * 24;
    trexGrp.rotation.y = -ta - Math.PI / 2;
    trexGrp.position.y = height(trexGrp.position.x, trexGrp.position.z) + .1 + Math.abs(Math.sin(t * 2.2)) * .35;
  }
  for (const rp of raptorGrps) {
    const u = rp.userData;
    rp.position.x = JUR.x + u.sgn * 18 + Math.sin(t * 1.1 + u.sgn) * 14;
    rp.rotation.y = Math.cos(t * 1.1 + u.sgn) > 0 ? 0 : Math.PI;
    rp.position.y = height(rp.position.x, rp.position.z) + .1;
  }
  if (brachioNeck) brachioNeck.rotation.z = -.5 + Math.sin(t * .4) * .16;
  if (window.__rug) { window.__rug.position.y = height(ANH.x + 20, ANH.z - 28) + 1.6 + Math.sin(t * 1.6) * .25; window.__rug.rotation.z = Math.sin(t * 1.2) * .06; }
  roarT -= dt;
  if (roarT <= 0) {
    roarT = 22 + Math.random() * 18;
    if (actx && musicOn && Math.hypot(player.position.x - JUR.x, player.position.z - JUR.z) < 260) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sawtooth';
      const t0 = actx.currentTime;
      o.frequency.setValueAtTime(38, t0);
      o.frequency.exponentialRampToValueAtTime(85, t0 + .5);
      o.frequency.exponentialRampToValueAtTime(30, t0 + 1.8);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(.12, t0 + .25);
      g.gain.exponentialRampToValueAtTime(.001, t0 + 2);
      o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + 2.1);
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
  /* 雨幕跟随玩家 + 高处风声 */
  if (rainPts) {
    rainPts.position.copy(player.position);
    const rp3 = rainPts.geometry.attributes.position;
    for (let i = 0; i < rp3.count; i++) {
      let y3 = rp3.getY(i) - 55 * dt;
      if (y3 < -4) y3 = 55;
      rp3.setY(i, y3);
    }
    rp3.needsUpdate = true;
  }
  if (festPts) {
    festPts.position.copy(player.position);
    const fp3 = festPts.geometry.attributes.position, fu = festPts.userData;
    for (let i = 0; i < fp3.count; i++) {
      let y4 = fp3.getY(i) - fu.fall * dt;
      if (y4 < -6) y4 = 66;
      fp3.setY(i, y4);
      fp3.setX(i, fp3.getX(i) + Math.sin(y4 * .3 + i) * fu.sway * dt);   // 飘摆
    }
    fp3.needsUpdate = true;
  }
  if (windGain) {
    const wTar = clamp((player.position.y - 14) / 34, 0, 1) * .05 + (WEATHER === 'rain' ? .012 : 0);
    windGain.gain.value += (wTar - windGain.gain.value) * Math.min(1, dt * 3);
  }
  /* 蘑菇缩放恢复 */
  if (scaleT > 0) {
    scaleT -= dt;
    if (scaleT <= 0) { player.scale.setScalar(1); toast('🍄 药效退了,你恢复了原本的大小'); }
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
  /* 飞毯航线(巴格达 → 收藏之岛) */
  if (flight && flight.orbit) {   // 大鹏环游:从栖石螺旋升空,环岛一周,再螺旋落回
    flight.t += dt;
    const k2 = Math.min(1, flight.t / flight.dur);
    let ramp = k2 < .16 ? k2 / .16 : k2 > .84 ? (1 - k2) / .16 : 1; ramp = ramp * ramp * (3 - 2 * ramp);
    const ang = flight.a0 + k2 * flight.spins * Math.PI * 2;
    const orbX = flight.cx + Math.cos(ang) * flight.radius, orbZ = flight.cz + Math.sin(ang) * flight.radius;
    const fx2 = flight.px0 + (orbX - flight.px0) * ramp, fz2 = flight.pz0 + (orbZ - flight.pz0) * ramp;
    player.position.set(fx2, Math.max(height(fx2, fz2), 0) + 3 + flight.alt * ramp, fz2);
    faceYaw = -ang; vy = 0;   // 面朝切线飞行方向(travel dir = (-sin,cos) → atan2 = -ang)
    if (pengBird) { pengBird.visible = true; pengBird.position.set(fx2, player.position.y - 2.3, fz2); pengBird.rotation.y = faceYaw; }
    if (k2 >= 1) { flight = null; toast('🕊️ 大鹏收翼,轻轻落回栖石。“鹏程万里,后会有期。”'); blip(659);
      if (pengBird) { pengBird.position.set(PENG_X, height(PENG_X, PENG_Z) + 2.4, PENG_Z); pengBird.rotation.y = 2.2; } }
  } else if (flight) {
    flight.t += dt;
    const k2 = Math.min(1, flight.t / flight.dur);
    const e2 = k2 * k2 * (3 - 2 * k2);
    const fx2 = flight.from[0] + (flight.to[0] - flight.from[0]) * e2;
    const fz2 = flight.from[1] + (flight.to[1] - flight.from[1]) * e2;
    const lift = Math.sin(Math.min(1, k2 * 1.04) * Math.PI) * (flight.lift ?? 120);
    player.position.set(fx2, Math.max(height(fx2, fz2), 0) + 2.2 + lift, fz2);
    vy = 0;
    if (k2 >= 1) { const msg2 = flight.msg || '🧞 飞毯轻轻把你放下,一溜烟飞回了巴格达'; flight = null; toast(msg2); blip(660); }
  }
  /* 大鹏振翅(骑乘时快扇,栖息时缓扇) */
  if (pengWings) { const fl = (flight && flight.orbit) ? Math.sin(t * 6) * .55 : Math.sin(t * 1.1) * .16;
    for (const { w: wg, s } of pengWings) wg.rotation.z = s * fl; }
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
  /* 名著十岛动态 */
  for (const wb of windmillBlades) wb.rotation.z += dt * .8;
  for (const fg2 of cbFlags) fg2.rotation.y += ((windFlip ? Math.PI : 0) - fg2.rotation.y) * Math.min(1, dt * 2);
  cheshireMats.forEach(m3 => { m3.opacity = .1 + .9 * Math.abs(Math.sin(t * .35)); });
  if (scaleT > 0) { scaleT -= dt; if (scaleT <= 0) { player.scale.setScalar(1); toast('🍄 药效退了,你变回了原来的大小'); } }
  if (!flight && !gearOn('wax')) {   // 塞壬魅惑
    const sd2 = Math.hypot(player.position.x - SIR.x, player.position.z - SIR.z);
    if (sd2 < 130 && sd2 > 12) {
      const pull = 4.5 * dt;
      player.position.x += (SIR.x - player.position.x) / sd2 * pull;
      player.position.z += (SIR.z - player.position.z) / sd2 * pull;
      sirenT -= dt;
      if (sirenT <= 0) { sirenT = 6; toast('🧜‍♀️ 歌声钻进耳朵——身体不由自主地漂向礁石!(蜂蜡耳塞可免疫)'); }
    }
  }
  updateNpcs3(dt);
  curDA = updateDayNight(t);
  /* 萤火虫 + 流星(夜间氛围) */
  const nite = 1 - curDA;
  if (fireflies) {
    if ((player.position.x - ffCx) ** 2 + (player.position.z - ffCz) ** 2 > 36) redistributeFireflies(player.position.x, player.position.z);
    const u = fireflies.userData, b = u.base, arr = fireflies.geometry.attributes.position.array;
    for (let i = 0; i < u.FF; i++) {
      const p2 = u.ph[i];
      arr[i * 3] = b[i * 3] + Math.sin(t * .8 + p2) * .5;
      arr[i * 3 + 1] = b[i * 3 + 1] + Math.sin(t * 1.3 + p2) * .6;
      arr[i * 3 + 2] = b[i * 3 + 2] + Math.cos(t * .7 + p2) * .5;
    }
    fireflies.geometry.attributes.position.needsUpdate = true;
    fireflies.visible = nite > .12;
    fireflies.material.opacity = nite * (.55 + Math.sin(t * 3) * .45);
  }
  if (meteor) {
    if (meteorLife > 0) {
      meteorLife -= dt;
      const u = meteor.userData; u.head.addScaledVector(u.dir, dt * 820);
      const arr = meteor.geometry.attributes.position.array;
      arr[0] = u.head.x; arr[1] = u.head.y; arr[2] = u.head.z;
      arr[3] = u.head.x - u.dir.x * 70; arr[4] = u.head.y - u.dir.y * 70; arr[5] = u.head.z - u.dir.z * 70;
      meteor.geometry.attributes.position.needsUpdate = true;
      meteor.material.opacity = Math.min(1, meteorLife * 2.5) * nite;
    } else {
      meteorT -= dt;
      if (meteorT <= 0) {
        meteorT = 12 + Math.random() * 28;
        if (nite > .4) {
          const u = meteor.userData, az = Math.random() * 6.2832, el = .55 + Math.random() * .6;
          u.head.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).multiplyScalar(950).add(player.position);
          u.dir.set(Math.random() - .5, -.12 - Math.random() * .22, Math.random() - .5).normalize();
          meteorLife = .85;
        }
      }
    }
  }
  updateStarGaze();
  /* 晨昏薄雾 */
  if (mistPts) {
    const mistF = clamp(1 - Math.abs(curDA - .45) * 3, 0, .62);
    if (mistF > .02) {
      if ((player.position.x - mistCx) ** 2 + (player.position.z - mistCz) ** 2 > 400) redistributeMist(player.position.x, player.position.z);
      const u = mistPts.userData, b = u.base, arr = mistPts.geometry.attributes.position.array;
      for (let i = 0; i < u.MN; i++) {
        arr[i * 3] = b[i * 3] + Math.sin(t * .12 + u.ph[i]) * 3;
        arr[i * 3 + 1] = b[i * 3 + 1];
        arr[i * 3 + 2] = b[i * 3 + 2] + Math.cos(t * .1 + u.ph[i]) * 3;
      }
      mistPts.geometry.attributes.position.needsUpdate = true;
      mistPts.material.opacity = mistF;
      mistPts.visible = true;
    } else mistPts.visible = false;
  }
  /* 兰若寺:鬼火飘 + 姥姥红眼(夜间) */
  if (ghostFire) {
    const b = ghostFire.userData.base, arr = ghostFire.geometry.attributes.position.array, nN = arr.length / 3;
    for (let i = 0; i < nN; i++) arr[i * 3 + 1] = b[i * 3 + 1] + Math.sin(t * 1.4 + i * .7) * .5;
    ghostFire.geometry.attributes.position.needsUpdate = true;
    ghostFire.visible = nite > .15;
    ghostFire.material.opacity = nite * (.5 + Math.sin(t * 4) * .35);
  }
  for (const m of laolaoEyes) m.color.setHex(nite > .3 ? (Math.sin(t * 3) > 0 ? 0xcc2020 : 0x7a0e0e) : 0x2e1010);
  renderMinimap();
  renderCompass();

  /* 最近藏品点 + 提示 */
  nearSpot = null; nearFspot = null; nearNpc = null; let best = 1e9;
  for (const s of spots) {
    const d2 = (s.x - player.position.x) ** 2 + (s.z - player.position.z) ** 2;
    if (d2 < s.r * s.r && d2 < best && Math.abs((s.y ?? 0) - player.position.y) < 8) { best = d2; nearSpot = s; }
  }
  for (const fs of FSPOTS) {
    if ((fs.x - player.position.x) ** 2 + (fs.z - player.position.z) ** 2 < 36) nearFspot = fs;
  }
  if (!nearSpot && !nearFspot) {   // 无藏品点时才找可交谈的 NPC
    let nb = 34;
    for (const n of allNpcs) {
      if (n.g.visible === false) continue;
      const d2 = (n.g.position.x - player.position.x) ** 2 + (n.g.position.z - player.position.z) ** 2;
      if (d2 < nb) { nb = d2; nearNpc = n; }
    }
  }
  let hintTxt = null, hx = 0, hy = 0, hz = 0;
  if (fishing.state === 'bite') { hintTxt = '❗收竿!'; hx = bobber.position.x; hy = 2.4; hz = bobber.position.z; }
  else if (fishing.state === 'wait') { hintTxt = '…等鱼上钩(E 收竿)'; hx = bobber.position.x; hy = 2.4; hz = bobber.position.z; }
  else if (nearSpot) { hintTxt = HINTS[nearSpot.type] || '看看'; hx = nearSpot.x; hy = (nearSpot.y ?? height(nearSpot.x, nearSpot.z)) + 5.2; hz = nearSpot.z; }
  else if (nearFspot) { hintTxt = '🎣 抛竿钓鱼'; hx = nearFspot.bx; hy = 3; hz = nearFspot.bz; }
  else if (nearNpc) { hintTxt = '💬 交谈'; hx = nearNpc.g.position.x; hy = nearNpc.g.position.y + 3.6; hz = nearNpc.g.position.z; }
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
  const isl = ISLES.find(z3 => Math.hypot(player.position.x - z3.c.x, player.position.z - z3.c.z) < z3.c.r + 20);
  const mz2 = swimming ? 'fish' : (onMordor ? 'mordor' : (onMid ? 'shire' : (onHog ? 'hogwarts' : (onMob ? 'mobydick' : (onSpt ? 'stadium' : (isl ? isl.theme : (onTruman ? 'truman' : (hereKey || 'street'))))))));
  if (mz2 !== musicZone) { musicZone = mz2; melIdx = 3; }
  const onIsle2 = Math.hypot(player.position.x - IS2.x, player.position.z - IS2.z) < IS2.r + 10;
  const onBridge = !swimming && bh != null && Math.abs(player.position.y - bh) < 3;
  $('zoneIcon').textContent = swimming ? '🌊' : (onMordor ? '🌋' : (onMid ? '💍' : (onHog ? '⚡' : (onMob ? '🐳' : (onSpt ? '⚽' : (isl ? isl.icon : (onTruman ? '📺' : (hereKey ? CATS[hereKey].icon : (onBridge ? '🌉' : (onIsle2 ? '🗼' : '🧭'))))))))));
  $('zoneName').textContent = swimming ? '大海' : (onMordor ? '中土 · 魔多' : (onMid ? '中土 · 夏尔' : (onHog ? '霍格沃茨' : (onMob ? '南塔开特 · 捕鲸港' : (onSpt ? '体育岛 · 梦剧场' : (isl ? isl.name : (onTruman ? '楚门的世界 · 桃源岛' : (hereKey ? CATS[hereKey].name : (onBridge ? '跨海大桥' : (onIsle2 ? '灯塔屿' : '鲸背旷野'))))))))));

  /* 岛屿分桶显隐(0.5s 节流) */
  bucketT -= dt;
  if (bucketT <= 0) {
    bucketT = .5;
    for (const b of BUCKETS) b.g.visible = ((player.position.x - b.x) ** 2 + (player.position.z - b.z) ** 2) < 1210000;   // 1100²
  }
  /* 动态画质:帧率过低自动降像素比,恢复后升回 */
  fpsN++; fpsT += dt;
  if (fpsT >= 2.5) {
    const fps = fpsN / fpsT; fpsN = 0; fpsT = 0;
    if (fps < 20 && quality > 0 && prScale <= .85) { quality--; applyQuality(); toast('🖥️ 帧率偏低,已自动降到' + ['低画质', '中画质'][quality] + '(G 键可手动调)'); }   // 先降像素比,仍卡再降画质档
    if (fps < 27 && prScale > .85) {
      prScale = Math.max(.85, prScale - .25);
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, prScale));
      if (composer) composer.setSize(innerWidth, innerHeight);
    } else if (fps > 55 && prScale < PR_MAX) {
      prScale = Math.min(PR_MAX, prScale + .25);
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, prScale));
      if (composer) composer.setSize(innerWidth, innerHeight);
    }
  }
  if (composer && quality > 0) composer.render(); else renderer.render(scene, camera);
}
/* ---------- 岛屿分桶距离显隐(性能:远岛整组不渲染) ---------- */
const BUCKETS = [
  { x: 0, z: 0 }, { x: IS2.x, z: IS2.z }, { x: TRU.x, z: TRU.z }, { x: MID.x, z: MID.z },
  { x: HOG.x, z: HOG.z }, { x: MOB.x, z: MOB.z }, { x: SPT.x, z: SPT.z }, { x: SHJ.x, z: SHJ.z },
  { x: THY.x, z: THY.z }, { x: ANH.x, z: ANH.z }, { x: NEM.x, z: NEM.z }, { x: B612.x, z: B612.z },
  { x: JUR.x, z: JUR.z }, { x: HGS.x, z: HGS.z }, { x: ALC.x, z: ALC.z }, { x: CBI.x, z: CBI.z },
  { x: LRS.x, z: LRS.z }, { x: LSP.x, z: LSP.z }, { x: FCY.x, z: FCY.z }, { x: YFB.x, z: YFB.z },
  { x: MCD.x, z: MCD.z }, { x: RBX.x, z: RBX.z }, { x: DGY.x, z: DGY.z }, { x: SIR.x, z: SIR.z },
  { x: PUR.x, z: PUR.z },
  ...NISLES.map(s => ({ x: s.x, z: s.z })),
].map(b => Object.assign(b, { g: new THREE.Group() }));
{
  const excl = new Set([player, blob, sky, starField, moonMesh, moonGlow, moonLight, moonLight.target, sun, sun.target, hemi, mobySpout, meteor, fireflies, pengBird]);
  clouds.forEach(c => excl.add(c));
  for (const o of [...scene.children]) {
    if (excl.has(o) || o.isInstancedMesh || o.isPoints) continue;
    if (o.geometry && o.geometry.type === 'PlaneGeometry' && o.geometry.parameters && o.geometry.parameters.width >= 3000) continue;   // 海面
    if (o.material && o.material.uniforms && o.material.uniforms.waterColor) continue;   // 反射海面
    if (o.geometry && o.geometry.type === 'PlaneGeometry' && o.material && o.material.vertexColors) continue;   // 地形
    let best = null, bd = Infinity;
    for (const b of BUCKETS) {
      const d2 = (o.position.x - b.x) ** 2 + (o.position.z - b.z) ** 2;
      if (d2 < bd) { bd = d2; best = b; }
    }
    best.g.add(o);
  }
  BUCKETS.forEach(b => scene.add(b.g));
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

window.__w3d = { player, spots, TRAVEL3D, openCard, openJournal, seen, height, camera, scene, allNpcs, shards, collectShard, boats, bridgeHeight, islandMask, spendSB, earnSB, sb: () => sb, paperHTML, fishing, startCast, catchFish, FSPOTS, pierHeight, GEAR, gear, gearOn, openBag, parsePantheon, pantheonHTML, openPantheon, openAccount, profileList, PROFILE_ID: () => PROFILE_ID, talkTo, constDirs, updateStarGaze, setGaze: v => { starGaze = v; }, skyLabels, constSeen, recognizeConst, openJournal, titleList,
  enterDive, surfaceDive, clampToMaze, MAZE_PORTALS, MAZE_NODES, MAZE_EDGES, AIR_NODES, DISC, GATES, gateOpen, fireSonar, diving: () => diving, diveAir: () => diveAir, setAir: v => { diveAir = v; }, gear, GEAR,
  usingGLTF: () => usingGLTF, playerRobot: () => playerRobot, playerActs: () => Object.keys(playerActions), playerAct: () => playerAct,
  quality: () => quality, setQuality: q => { quality = q; applyQuality(); }, gtaoEnabled: () => gtaoPass ? gtaoPass.enabled : null,
  maybeRevealSkeleton, showSkeletonCard };
