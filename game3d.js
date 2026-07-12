/* ============================================================
   1001 世界 3D · Isle of 1001 — 荒野之息风低多边形海岛
   Three.js 三维开放世界:雪山 · 平原 · 大海 · 九大收藏区域
   数据来自 world-data.js;进度按账号(本机多档)隔离保存。
   ============================================================ */
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { Water } from 'three/addons/objects/Water.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeNIContent, osmCity, osmRoads } from './w-isles.js?v=21';
import { OSM_MOBT, OSM_TRUMAN, OSM_DGYT, OSM_SPTT, OSM_GUNKAN_COAST, OSM_ROADS, OSM_GGB, OSM_FOGJAIL_COAST, OSM_PIERS_MOB, OSM_DGY_WATER, OSM_ATL_COAST, OSM_WG_COAST } from './w-osm.js?v=11';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { clamp, esc, smooth01, mulberry32, shuffled, hash2, vnoise, fbm, warpFbm, ridged, PALETTE, hashCol, BEER_COLOR, FISH_COLOR, SPORT_ICON } from './w-util.js?v=2';
import { THEMES, NI_QUESTS } from './w-config.js?v=17';
import { AIRPORTS, FOODS, FOOD_SPOTS, CAPES, HATS, LETTER_TXT, LETTER_TPL, DQ_FOODS } from './w-data.js?v=1';
import { CONSTELLATIONS } from './constellations.js?v=1';
import { MAZE_NODES, ZONES, NODE_ZONE, MAZE_EDGES, AIR_NODES, GATES, DISC, MAZE_PORTALS, TUBE_R } from './w-maze.js?v=11';

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
  'lamp', 'rose', 'jingu', 'pantao', 'tiny', 'arrows', 'qian', 'hero', 'rodbuff', 'fishcount', 'siren', 'charge', 'yfb', 'poem', 'flowers', 'flotsam', 'wind', 'taofound', 'stargate', 'vellum', 'guide', 'savev', 'title', 'mile', 'consts', 'purg', 'peng', 'marlin', 'treasure', 'caved', 'wreck', 'babel', 'd_heart', 'd_mural', 'skeleton', 'nq_grant', 'abyss', 'unjb1', 'unjb2', 'unjb3', 'unjb4', 'unjlit', 'unjend', 'unjtop', 'unjgames', 'unjn1', 'unjn2', 'unjn3', 'unjnews', 'skycity', 'skyc1', 'skyc2', 'skyc3', 'skyc4', 'skychime', 'skyflower', 'skyspell'];
SAVE_FIELDS.push('unjw1', 'unjw2', 'unjw3', 'unjlang');   // 语言迷宫
SAVE_FIELDS.push('kao1', 'kao2', 'kao3', 'kao4', 'kao5', 'kao6', 'kaodone');   // 群岛考据线
SAVE_FIELDS.push('stamps', 'pass10', 'pass30', 'passall');   // 环球护照
SAVE_FIELDS.push('wreck2', 'pearl9');   // 隧道新发现
SAVE_FIELDS.push('donated', 'honor1', 'honor2', 'fundstone');   // 群岛基金会
SAVE_FIELDS.push('aff');   // NPC 好感度
SAVE_FIELDS.push('eaten', 'foodie', 'home', 'wardrobe', 'homelv', 'wc100', 'mail', 'maildate');   // 衣食住·食客·完成度·家书

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
const UNJ = { x: 350, z: 620, r: 115 };     // 未竟之都(人工几何岛:世界交流中心遗址)
/* —— 海洋文学带:外环诸岛(数据驱动,内容见 NI_CONTENT)—— */
const NISLES = [
  { key: 'mys', x: -1500, z: -1400, r: 92, mask: 2.0, h: 7, peak: { r: 52, hh: 30 }, dock: [-1434, -1339] }, // 神秘岛(火山)
  { key: 'trs', x: -560, z: 380, r: 92, mask: 2.0, h: 7, peak: { r: 40, hh: 16 }, dock: [-486, 329] },   // 金银岛(望远山)
  { key: 'chr', x: -340, z: 980, r: 88, mask: 2.0, h: 8, dock: [-312, 899] },                            // 无人生还岛
  { key: 'tmp', x: -560, z: 660, r: 88, mask: 2.0, h: 9, dock: [-504, 594] },                            // 暴风雨岛
  { key: 'mor', x: -1270, z: 20, r: 90, mask: 2.0, h: 7, dock: [-1182, 19] },                         // 莫罗博士岛
  { key: 'dol', x: -1300, z: 760, r: 90, mask: 2.0, h: 6, dock: [-1224, 716] },                            // 蓝色海豚岛
  { key: 'fly', x: -1690, z: -1000, r: 90, mask: 2.0, h: 7, peak: { r: 42, hh: 14 }, dock: [-1614, -955] }, // 蝇王
  { key: 'uto', x: -560, z: -620, r: 92, mask: 2.0, h: 6, dock: [-500, -553] },                            // 乌托邦
  { key: 'hux', x: 880, z: 120, r: 88, mask: 2.0, h: 6, dock: [795, 108] },                          // 岛(赫胥黎)
  { key: 'gul', x: 980, z: -480, r: 90, mask: 2.0, h: 6, dock: [901, -441] },                          // 格列佛
  { key: 'nvl', x: 1600, z: 1600, r: 90, mask: 2.0, h: 7, dock: [1538, 1538] },                            // 梦幻岛
  { key: 'cor', x: -1780, z: -660, r: 86, mask: 2.0, h: 5, dock: [-1701, -631] },                              // 珊瑚岛
  { key: 'typ', x: -1500, z: -100, r: 90, mask: 2.0, h: 7, peak: { r: 40, hh: 16 }, dock: [-1412, -94] },     // 泰皮
  { key: 'tah', x: -1560, z: -420, r: 88, mask: 2.0, h: 6, dock: [-1477, -398] },                              // 画家岛(塔希提)
  { key: 'daw', x: 1850, z: -500, r: 86, mask: 2.0, h: 5, dock: [1769, -478] },                              // 黎明踏浪号
  { key: 'rain', x: -1760, z: -230, r: 88, mask: 2.0, h: 6, dock: [-1675, -219] },                           // 雨岛
  { key: 'shu', x: -760, z: 880, r: 88, mask: 2.0, h: 8, peak: { r: 30, hh: 14 }, dock: [-704, 815] }, // 禁闭岛
  /* —— 岛屿组合(现实地貌 × 文学主题)第一批 —— */
  { key: 'gala', x: -980, z: -120, r: 92, mask: 2.0, h: 6, peak: { r: 38, hh: 18 }, dock: [-891, -109] },  // 进化群岛(加拉帕戈斯×博物学)
  { key: 'moai', x: -1010, z: -520, r: 90, mask: 2.0, h: 7, peak: { r: 34, hh: 14 }, dock: [-932, -480] },  // 星历仙岛(复活节岛×蓬莱)
  { key: 'fogjail', x: -1500, z: 1050, r: 88, mask: 2.0, h: 8, dock: [-1430, 1001] },                          // 雾中牢岛(恶魔岛×禁闭岛)
  { key: 'kilda', x: -360, z: 1480, r: 90, mask: 2.0, h: 10, peak: { r: 32, hh: 16 }, dock: [-339, 1394] },// 风暴孤岛(圣基尔达×鲁滨逊)
  { key: 'gunkan', x: 1520, z: 460, r: 88, mask: 2.0, h: 7, dock: [1468, 446] },                          // 废矿海城(军舰岛×海底两万里)
  { key: 'soco', x: 640, z: 260, r: 90, mask: 2.0, h: 8, peak: { r: 36, hh: 10 }, dock: [558, 227] },   // 真名植物岛(索科特拉×地海)
  { key: 'skell', x: -160, z: 1660, r: 86, mask: 2.0, h: 9, peak: { r: 30, hh: 20 }, dock: [-152, 1576] },// 静默之岩(斯凯利格×瓦尔登湖)
  { key: 'mada', x: 360, z: -620, r: 100, mask: 2.0, h: 7, peak: { r: 44, hh: 12 }, dock: [311, -535] }, // 方舟大陆岛(马达加斯加×诺亚方舟)
  { key: 'helena', x: -160, z: -1060, r: 88, mask: 2.0, h: 8, peak: { r: 30, hh: 10 }, dock: [-147, -975] },  // 风中庄园(圣赫勒拿×李尔王)
  { key: 'komodo', x: 1390, z: -120, r: 92, mask: 2.0, h: 6, peak: { r: 40, hh: 12 }, dock: [1300, -112] },// 龙蜥荒原(科莫多×贝奥武甫)
  { key: 'sanxian', x: 1400, z: 940, r: 88, mask: 2.0, h: 8, peak: { r: 34, hh: 16 }, dock: [1329, 892] }, // 三仙岛(蓬莱三山×海市蜃楼)
  { key: 'shixia', x: 620, z: -1450, r: 90, mask: 2.0, h: 9, peak: { r: 38, hh: 18 }, dock: [585, -1369] },// 石刻武学岛(侠客石窟)
  { key: 'taozhen', x: 1650, z: 700, r: 90, mask: 2.0, h: 7, dock: [1569, 666] },                            // 桃阵岛(桃花八阵)
  { key: 'venezia', x: 330, z: 1020, r: 90, mask: 2.0, h: 5, dock: [303, 936] },                             // 看不见的水城(威尼斯×卡尔维诺)
  { key: 'saga', x: -700, z: 1560, r: 92, mask: 2.0, h: 8, peak: { r: 38, hh: 16 }, dock: [-663, 1478] },      // 冰火萨迦岛(冰岛×埃达)
  { key: 'atl', x: 540, z: 850, r: 88, mask: 2.0, h: 7, dock: [494, 777] },     // 沉环之岛(圣托里尼×柏拉图)
  { key: 'aeol', x: 900, z: 1440, r: 88, mask: 2.0, h: 7, peak: { r: 32, hh: 15 }, dock: [854, 1367] },        // 风袋岛(埃奥利×奥德赛风神)
  { key: 'tusi', x: -1320, z: -1160, r: 88, mask: 2.0, h: 8, peak: { r: 34, hh: 16 }, dock: [-1255, -1103] },  // 讲故事人之岛(萨摩亚×史蒂文森)
  { key: 'qq', x: 1760, z: 240, r: 96, mask: 2.0, h: 6, dock: [1690, 207] },   // 青丘(放射九街滨海古城×山海经九尾狐乡)
  { key: 'wg', x: 1620, z: -60, r: 92, mask: 2.0, h: 6, dock: [1606, -142] },  // 雾港(真实港湾水岸×张岱夜航船)
];
const COMBO_KEYS = NISLES.slice(NISLES.findIndex(s9 => s9.key === 'gala')).map(s9 => s9.key);   // 组合岛清单(gala 起自动派生,加岛零维护)
/* 🗂️ 岛屿空间索引:height/islandMask 只遍历附近 1-3 座(原 37 座全扫) */
const NIDX_CELL = 100, NIDX_W = 42, NIDX = new Array(NIDX_W * NIDX_W).fill(null), NIDX_EMPTY = [];
for (const s of NISLES) {
  const reach = s.r + 130;   // 覆盖 dock 浅滩与 atl/wg 的偏移基座
  const x0 = Math.max(0, ((s.x + 2100 - reach) / NIDX_CELL) | 0), x1 = Math.min(NIDX_W - 1, ((s.x + 2100 + reach) / NIDX_CELL) | 0);
  const z0 = Math.max(0, ((s.z + 2100 - reach) / NIDX_CELL) | 0), z1 = Math.min(NIDX_W - 1, ((s.z + 2100 + reach) / NIDX_CELL) | 0);
  for (let cz = z0; cz <= z1; cz++) for (let cx = x0; cx <= x1; cx++) {
    const k = cz * NIDX_W + cx; (NIDX[k] || (NIDX[k] = [])).push(s);
  }
}
function nislesNear(x, z) {
  const cx = ((x + 2100) / NIDX_CELL) | 0, cz = ((z + 2100) / NIDX_CELL) | 0;
  if (cx < 0 || cz < 0 || cx >= NIDX_W || cz >= NIDX_W) return NIDX_EMPTY;
  return NIDX[cz * NIDX_W + cx] || NIDX_EMPTY;
}
const NI_DEST = {}, NI_MSG = {};   // 渡口坐标 / 到达播报(由 NI_CONTENT 框架填充)
for (const s of NISLES) if (s.key !== 'trs') SAVE_FIELDS.push('nq_' + s.key);   // 各岛故事线存档位(金银岛用 treasure)
function capMask(x, z, ax, az, bx, bz, r0, r1) {
  const abx = bx - ax, abz = bz - az;
  const t = clamp(((x - ax) * abx + (z - az) * abz) / (abx * abx + abz * abz), 0, 1);
  const d = Math.hypot(x - (ax + abx * t), z - (az + abz * t));
  return (1 - d / (r0 + (r1 - r0) * t)) * 2.2;
}
function islandMask(x, z) {
  let m = -9;
  if (x > -540 && x < 850 && z > -400 && z < 540) {   // 🐋 鲸形主岛包围盒(盒外 9 组 capMask 全免)
    m = (1 - Math.sqrt(((x + 120) / 380) ** 2 + ((z + 20) / 400) ** 2)) * 2.2;          // 鲸头与前身
    m = Math.max(m, (1 - Math.sqrt(((x - 190) / 280) ** 2 + ((z + 60) / 250) ** 2)) * 2.2); // 后身
    m = Math.max(m, capMask(x, z, -80, 150, 170, 255, 175, 150));   // 腹部(南)
    m = Math.max(m, capMask(x, z, 430, -70, 640, -15, 75, 42));     // 尾柄
    m = Math.max(m, capMask(x, z, 640, -15, 765, -140, 45, 16));    // 尾鳍北叶
    m = Math.max(m, capMask(x, z, 640, -15, 765, 105, 45, 16));     // 尾鳍南叶
    m = Math.max(m, capMask(x, z, 260, -200, 345, -310, 90, 60));   // 背鳍雪山连脊
    m = Math.max(m, capMask(x, z, -80, 330, -190, 455, 55, 22));    // 胸鳍
    m = Math.max(m, capMask(x, z, -390, -95, -390, 55, 92, 92));    // 钝圆的鲸头吻部
  }
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
  m = Math.max(m, (1 - Math.hypot(x - UNJ.x, z - UNJ.z) / UNJ.r) * 2.2);  // 未竟之都(人工岛)
  for (const s of nislesNear(x, z)) { if (s.key === 'gunkan' || s.key === 'fogjail' || s.key === 'atl' || s.key === 'wg') continue; m = Math.max(m, (1 - Math.hypot(x - s.x, z - s.z) / s.r) * (s.mask || 1.8)); }  // 海洋文学带(空间索引)
  { const lx = x - 1520, lz = z - 460;   // 🗾 端岛:真实海岸线多边形(© OSM),军舰形轮廓
    if (Math.abs(lx) < 78 && Math.abs(lz) < 92) {
      let inn = false, dmin = 1e9;
      const PC = OSM_GUNKAN_COAST;
      for (let i = 0, jj = PC.length - 1; i < PC.length; jj = i++) {
        const xi = PC[i][0], zi = PC[i][1], xj = PC[jj][0], zj = PC[jj][1];
        if ((zi > lz) !== (zj > lz) && lx < (xj - xi) * (lz - zi) / (zj - zi) + xi) inn = !inn;
        const ax = lx - xi, az = lz - zi, bx = xj - xi, bz = zj - zi;
        const t9 = Math.max(0, Math.min(1, (ax * bx + az * bz) / (bx * bx + bz * bz || 1)));
        const d9 = Math.hypot(ax - bx * t9, az - bz * t9);
        if (d9 < dmin) dmin = d9;
      }
      m = Math.max(m, inn ? Math.min(1, (dmin + 8) / 26) * 2.2 : (1 - dmin / 12) * 1.2);
    }
  }
  { const lx = x + 1500, lz = z - 1050;   // 🗾 Alcatraz:真实轮廓(© OSM),The Rock
    if (Math.abs(lx) < 126 && Math.abs(lz) < 112) {
      let inn = false, dmin = 1e9;
      const PC = OSM_FOGJAIL_COAST;
      for (let i = 0, jj = PC.length - 1; i < PC.length; jj = i++) {
        const xi = PC[i][0], zi = PC[i][1], xj = PC[jj][0], zj = PC[jj][1];
        if ((zi > lz) !== (zj > lz) && lx < (xj - xi) * (lz - zi) / (zj - zi) + xi) inn = !inn;
        const ax = lx - xi, az = lz - zi, bx = xj - xi, bz = zj - zi;
        const t9 = Math.max(0, Math.min(1, (ax * bx + az * bz) / (bx * bx + bz * bz || 1)));
        const d9 = Math.hypot(ax - bx * t9, az - bz * t9);
        if (d9 < dmin) dmin = d9;
      }
      m = Math.max(m, inn ? Math.min(1, (dmin + 8) / 24) * 2.4 : (1 - dmin / 12) * 1.2);
    }
  }
  { const lx = x - 540, lz = z - 850;   // 🗾 圣托里尼:Thera 月牙真轮廓(© OSM),中央即沉没的破火山口
    if (Math.abs(lx) < 100 && Math.abs(lz) < 132) {
      let inn = false, dmin = 1e9;
      const PC = OSM_ATL_COAST;
      for (let i = 0, jj = PC.length - 1; i < PC.length; jj = i++) {
        const xi = PC[i][0], zi = PC[i][1], xj = PC[jj][0], zj = PC[jj][1];
        if ((zi > lz) !== (zj > lz) && lx < (xj - xi) * (lz - zi) / (zj - zi) + xi) inn = !inn;
        const ax = lx - xi, az = lz - zi, bx = xj - xi, bz = zj - zi;
        const t9 = Math.max(0, Math.min(1, (ax * bx + az * bz) / (bx * bx + bz * bz || 1)));
        const d9 = Math.hypot(ax - bx * t9, az - bz * t9);
        if (d9 < dmin) dmin = d9;
      }
      m = Math.max(m, inn ? Math.min(1, (dmin + 7) / 20) * 2.3 : (1 - dmin / 10) * 1.1);
      const ex9 = (lx + 22) / 42, ez9 = (lz + 6) / 64;   // 破火山口潟湖:中央凹陷强制为海
      if (ex9 * ex9 + ez9 * ez9 < 1) m = Math.min(m, -.6);
    }
  }
  { const lx = x - 1620, lz = z + 60;   // 🗾 雾港:真实港湾水岸(© OSM),北缘即真实岸线
    if (Math.abs(lx) < 105 && Math.abs(lz) < 105) {
      let inn = false, dmin = 1e9;
      const PC = OSM_WG_COAST;
      for (let i = 0, jj = PC.length - 1; i < PC.length; jj = i++) {
        const xi = PC[i][0], zi = PC[i][1], xj = PC[jj][0], zj = PC[jj][1];
        if ((zi > lz) !== (zj > lz) && lx < (xj - xi) * (lz - zi) / (zj - zi) + xi) inn = !inn;
        const ax = lx - xi, az = lz - zi, bx = xj - xi, bz = zj - zi;
        const t9 = Math.max(0, Math.min(1, (ax * bx + az * bz) / (bx * bx + bz * bz || 1)));
        const d9 = Math.hypot(ax - bx * t9, az - bz * t9);
        if (d9 < dmin) dmin = d9;
      }
      m = Math.max(m, inn ? Math.min(1, (dmin + 8) / 26) * 2.2 : (1 - dmin / 12) * 1.2);
    }
  }
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
  let h = fall > 0 ? -9 + fall * (13 + warpFbm(x * .009, z * .009) * 14) : -9;   // 开阔海面免算域扭曲噪声
  const md = Math.hypot(x - 340, z + 320);            // 东北雪山(背鳍)
  // 脊状多重分形:山坡刻出山脊线,峰高仍封顶 55,不影响营地整平
  if (md < 200) h += smooth01(clamp(1 - md / 200, 0, 1)) ** 2 * 55 * (.7 + .3 * ridged(x * .028, z * .028, 4));   // 雪山外免算脊状分形
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
  q(UNJ.x, UNJ.z, UNJ.r * .96, 6, .97);                                                      // 未竟之都:整岛白石平台
  q(UNJ.x, UNJ.z + UNJ.r + 18, 15, 2.2, .95);                                                // 未竟之都渡口浅滩
  for (const s of nislesNear(x, z)) {                                                        // 海洋文学带地形(空间索引)
    if (s.key === 'atl') { q(594, 846, 62, 7); q(502, 928, 56, 7); q(548, 762, 42, 6); q(s.dock[0], s.dock[1], 13, 2.2, .95); continue; }   // 月牙:基座沿弧,不填潟湖
    if (s.key === 'wg') { q(1615, -95, 62, 6); q(1568, -72, 46, 6); q(1672, -102, 46, 6); q(s.dock[0], s.dock[1], 13, 2.2, .95); continue; }   // 雾港:基座居陆侧,不填港湾
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
  { id: 'mask',    icon: '🤿', name: '深潜面罩', en: 'Deep Mask', slot: '面部', price: 35, desc: '再生药膜循环供氧,深渊海沟的入场券。', effect: '气瓶容量翻倍——想摸到迷宫最深处的"星球之脐",没它下不去', brand: null },
  { id: 'bike',    icon: '🚲', name: '折叠自行车', en: 'Folding Bike', slot: '座驾', price: 60, desc: '车架轻得像一句口哨,后座能驮一整天的好心情。', effect: '陆上按 R 骑行/下车,速度约两倍(入水自动下车)', brand: null },
  { id: 'boat',    icon: '⛵', name: '燕鸥号小帆船', en: 'Tern Dinghy', slot: '座驾', price: 160, desc: '一片帆、一支舵、一颗想去任何岛的心。', effect: '岸边或水中按 R 扬帆/收帆,海上三倍速,可驶抵任意海岸(搁浅即上岸)', brand: null },
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
      ? `<button class="gBtn" data-gbuy="${g.id}">买 ${gearPrice(g)}${EVENT === 'fair' ? '(九折)' : ''} SB</button>`
      : `<button class="gBtn" disabled>装备行有售 · ${gearPrice(g)} SB</button>`;
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
    if (!g || !spendSB(gearPrice(g))) return;
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
    try { RAWLS.removeItem(`w1001.p_${id}.cards`); RAWLS.removeItem(`w1001.p_${id}.aff`); } catch (e) {}
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
    try { const cd9 = JSON.parse(PSTORE.getItem('w1001.cards') || '[]'); if (cd9.length) data.cards = JSON.stringify(cd9.slice(-3)); } catch (e) {}
    document.getElementById('accCode').value = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    toast('📤 存档码已生成,请复制保存');
  });
  cardBody.querySelector('[data-accimport]')?.addEventListener('click', () => {
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(document.getElementById('accCode').value.trim()))));
      SAVE_FIELDS.forEach(f => { if (data[f] != null) PSTORE.setItem('w1001.' + f, data[f]); });
      if (data.cards) try { JSON.parse(data.cards); PSTORE.setItem('w1001.cards', data.cards); } catch (e) {}
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
    <div class="pFoot">天气:${WEATHER === 'rain' ? '全域有雨,渔汛正旺,出门带蓑衣' : WEATHER === 'storm' ? '风暴!鲸航半数航班延误,航海请三思' : WEATHER === 'fog' ? '大雾,能见度低,塞壬海域尤请谨慎' : '晴,傍晚有物理正确的晚霞'},夜间星空营业,灯塔照常旋转 ·
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
  { key: 'unj', icon: '🏛️', name: '未竟之都', en: 'The Unfinished Capital', open: true, desc: '人类共同的首都 · 永远停在"即将完成" · 所有隧道的汇点' },
  { key: 'sirinfo', icon: '🧜‍♀️', name: '塞壬海域', en: 'The Sirens', open: false, desc: '巴格达与侏罗纪之间的危险水道,备好蜂蜡耳塞', note: '无航线,凭勇气' },
  { key: 'thy', icon: '🌸', name: '桃花源 · ???', en: 'Peach Blossom Spring', open: false, desc: '寻向所志,遂迷,不复得路——此地无航线', note: '有缘自遇' },
  { key: 'xiyou', icon: '🐒', name: '西游记', en: 'Journey to the West', open: false, desc: '花果山(在建)' },
];
function ferryCard() {
  return `<div class="cardHead" style="background:#141826">⛵ 多元宇宙渡口 · Multiverse Ferry</div>
    <div class="cardTitle" style="padding-top:16px"><h3>要渡去哪个世界?</h3><div class="en">卡戎:"船票免费,记忆自理。"</div></div>
    <div style="padding:4px 20px 18px">
      <div class="gRow"><div class="gi">🐋</div><div class="gInfo"><b>收藏之岛(主世界)</b><div class="gDesc">鲸背上的一千零一收藏</div></div><button class="gBtn" data-goworld="main">返回</button></div>
      <div style="font-size:11.5px;color:#8a7c62;padding:2px 2px 8px">✈️ 设有机场的岛已改乘「鲸航」——请移步就近机场购票;渡口只渡没有跑道的世界。</div>
      ${WORLDS.filter(w => !AIR_KEYS.has(w.key)).map(w => `<div class="gRow"><div class="gi">${w.icon}</div>
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
const SAVE_V = '3';
try { if (PSTORE.getItem('w1001.savev') !== SAVE_V) { /* v3:stamps 改存 PASSPORT 索引(载入时自动迁移旧名单) */ PSTORE.setItem('w1001.savev', SAVE_V); } } catch (e) {}
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
  gardener: { icon: '🤖', color: '#5d6e5d', title: '苔藓园丁', en: 'The Moss Gardener', hint: '它在等谁',
    desc: '一具比城还老的机器人,肩头长满青苔,一只白鸽在它锁骨的凹陷里筑了巢。城里的人走光之后,它守着这几块石碑,日复一日给花浇水。它不说话——制造它的语言早已失传——但它看见你时,眼睛里的灯亮了一格。' },
  skytree: { icon: '🌳', color: '#4f7d46', title: '抱城巨树', en: 'The Great Tree', hint: '根须托着城',
    desc: '没有人种过它。有一年它自己从磁石的裂缝里长出来,根须一寸寸抱住整座城的底盘——勒皮他人吵了三百年:是砍掉它,还是感谢它。后来他们发现,城的倾角比巨树出现之前更稳了。争论就此结束。' },
  chime1:  { icon: '🎐', color: '#4a8a6a', title: '春铃', en: 'Spring Chime', hint: '摇响它',
    desc: '铃舌是一枚桃木片。摇响时,风里有远处桃花源的消息。塔身刻着小字:四铃齐鸣,勒皮他人便肯放下手里的几何,听一支完整的曲子。' },
  chime2:  { icon: '🎐', color: '#4a7a9a', title: '夏铃', en: 'Summer Chime', hint: '摇响它',
    desc: '铃身刻着一场骤雨。摇响时,像把整个雨季倒了出来——云海在脚下翻出白浪。' },
  chime3:  { icon: '🎐', color: '#9a7a4a', title: '秋铃', en: 'Autumn Chime', hint: '摇响它',
    desc: '铃内封着一枚落叶,不知是哪一年的。摇响时,云海也跟着黄了一瞬。' },
  chime4:  { icon: '🎐', color: '#6a7a9a', title: '冬铃', en: 'Winter Chime', hint: '摇响它',
    desc: '铃口结着一圈不化的霜。摇响时,声音比别的铃慢半拍——像雪落进云里。' },
  skyback: { icon: '🕊️', color: '#2c4a6a', title: '云鹏哨站', en: 'Roc Roost', hint: '乘风归海',
    desc: '哨站石台上刻着一行小字:"鹏程万里,想家时喊一声。"云海在脚下翻涌,大鹏总在你需要它的时候出现。' },
  lodestone: { icon: '🔮', color: '#3a6a8a', title: '飞岛磁石', en: 'The Lodestone', hint: '勒皮他之心',
    desc: '《格列佛游记》第三卷:飞岛勒皮他靠一块巨大的天然磁石悬浮与移动。岛上的人一只眼看内心,一只眼看星空,痴迷音乐与数学,连面包都切成几何形。此刻那块磁石就在你脚下发着光,托着整座城,像托着一个不肯落地的念头。' },
  eden:    { icon: '🌸', color: '#4a8a5a', title: '山巅 · 地上乐园', en: 'Earthly Paradise', hint: '登临绝顶',
    desc: '七层已尽,眼前豁然:一片神圣的森林,忘川(勒忒)与欢河(欧诺埃)在花间流淌。玛蒂尔达在对岸采花微笑。饮忘川之水,忘却罪的记忆;饮欢河之水,重拾行善的欢愉。贝雅特丽齐正乘光而来。(登顶奖励)' },
  // —— 老岛加厚:楚门 / 中土 / 霍格沃茨 / 大观园 / 南塔开特 / 爱丽丝 / 花果山 / 一千零一夜 ——
  truseahaven: { icon: '🎬', color: '#4a6a8a', title: '桃源镇布景街', en: 'Seahaven Set', hint: '整条街都是剧组',
    desc: '整条街都是布景:邻居按剧本遛狗,"车祸"按时刻表发生,广告靠太太的对白硬性植入。第 10909 天,楚门倒车绕了街区一圈,看见所有人的动线都绕着他转——字面意义上的。' },
  truboat: { icon: '⛵', color: '#3a5a7a', title: '圣玛丽亚号', en: 'The Santa Maria', hint: '他最怕水',
    desc: '制片人从小给他编排了一场"父亲溺亡",让他怕水、不敢离岛。可最后,楚门正是驾着这条小帆船冲向人造风暴——"你想阻止我,除非杀了我。"船头挺过巨浪的那一刻,天堂岛的天空撞出了一个门框。' },
  midgreen: { icon: '🍺', color: '#3a6a2a', title: '绿龙酒馆', en: 'The Green Dragon', hint: '夏尔的麦芽酒',
    desc: '霍比屯的老酒馆:麦芽酒一品脱,八卦免费续杯。佛罗多在这里最后一次以"普通霍比特人"的身份举杯——那晚没人知道,他口袋里装着整个中土的命运。' },
  midparty: { icon: '🎆', color: '#8a6a2a', title: '比尔博的告别宴', en: 'The Long-Expected Party', hint: '一百一十一岁',
    desc: '一百一十一岁生日,半个夏尔来吃席,甘道夫的烟火扎成巨龙掠过树梢。演讲讲到一半,比尔博戴上戒指,"嘭"地当众消失——留下满场目瞪口呆,和一枚从此改姓巴金斯的戒指。' },
  hogmirror: { icon: '🪞', color: '#6a5a8a', title: '厄里斯魔镜', en: 'The Mirror of Erised', hint: '别照太久',
    desc: '哈利在镜中看见从未谋面的父母,罗恩看见自己捧起奖杯。镜框刻着倒写的铭文——"我显示的不是你的脸,而是你心底最深的渴望。"邓布利多把它搬走前说:沉溺于虚幻的梦想而忘记生活,是毫无益处的。' },
  hogwillow: { icon: '🌳', color: '#5a6a3a', title: '打人柳', en: 'The Whomping Willow', hint: '一棵会还手的树',
    desc: '罗恩家的飞车撞上过它——断的是车,树没事。树根下藏着通往尖叫棚屋的密道:当年种下这棵暴脾气的树,本就是为了守住一个狼人少年的秘密。' },
  dgyhouse: { icon: '🏮', color: '#8c2f4e', title: '怡红院', en: 'Happy Red Court', hint: '怡红快绿',
    desc: '宝玉的住处,院里一株海棠、一株芭蕉,匾曰"怡红快绿"。晴雯在这里撕过扇子,麝月在这里补过雀金裘——后来抄检大观园,风暴也从这里的箱笼开始。' },
  dgynun: { icon: '🍵', color: '#6a7a6a', title: '栊翠庵', en: 'Green Lattice Nunnery', hint: '梅花雪水茶',
    desc: '妙玉的庵堂。五年前收的梅花雪,埋在鬼脸青瓮里,今日开瓮煮茶:"一杯为品,二杯即是解渴的蠢物。"刘姥姥用过的成窑杯她嫌腌臜要砸,宝玉讨了来,转手送了姥姥。' },
  mobpulpit: { icon: '⛪', color: '#3a4a5a', title: '船头讲坛', en: "Father Mapple's Pulpit", hint: '爬绳梯上去的讲坛',
    desc: '小教堂的讲坛做成船头模样,梅普尔神父沿绳梯攀上去讲约拿与鲸:"如果我们服从上帝,就必须违抗自己。"四壁嵌满死于海上的水手铭牌——出海的人,启程前都来这里读一遍。' },
  mobcoffin: { icon: '⚰️', color: '#4a3a2e', title: '魁魁格的棺材', en: "Queequeg's Coffin", hint: '最后浮起的东西',
    desc: '标枪手魁魁格病重,让木匠照他的尺寸打了口棺材,又亲手刻满家乡的花纹。病好后,棺材改作储物箱。裴廓德号沉没那天,漩涡里唯一浮起的,正是这口棺材——以实玛利抱着它活了下来,才有了这本书。' },
  alccroquet: { icon: '🦩', color: '#b03a4e', title: '王后的槌球场', en: 'The Queen\'s Croquet', hint: '槌是火烈鸟',
    desc: '槌是活火烈鸟,球是活刺猬,球门是弯腰的扑克士兵——规则只有一条:王后必须赢。"砍掉他的头!"平均三分钟喊一次。刽子手私下嘀咕:光有头没有身子的,叫我从哪儿砍起?' },
  alctears: { icon: '💧', color: '#4a7a9a', title: '眼泪池', en: 'The Pool of Tears', hint: '自己哭出来的海',
    desc: '爱丽丝三米高时哭出的眼泪,积成了这个池塘;等她缩小到十厘米,差点被自己的眼泪淹死。老鼠、渡渡鸟都在这里游过泳——上岸后开了一场"会议式赛跑"来弄干身子:没有起点,没有终点,人人有奖。' },
  hgsstone: { icon: '🪨', color: '#8a7a5a', title: '娲皇遗石', en: 'The Birth Stone', hint: '石头里蹦出来的',
    desc: '山顶那块仙石,受日月精华既久,某日"哗啦"崩出一个石猴,目运两道金光,直射斗府。玉帝垂帘下望,道:"下方之物,乃天地精华所生,不足为异。"——后来的五百年里,他大概常常想起这句话。' },
  hgsflag: { icon: '🚩', color: '#c8a12a', title: '齐天大圣旗', en: 'The Great Sage Banner', hint: '皇帝轮流做',
    desc: '"皇帝轮流做,明年到我家!"猴王竖起杏黄大旗,自封齐天大圣。天庭先封他弼马温哄他,再请他管蟠桃园——让猴子管蟠桃园!这份人事安排,神仙也得背锅。' },
  anhcave: { icon: '🚪', color: '#8a6a3a', title: '芝麻开门', en: 'Open Sesame', hint: '记好口令',
    desc: '四十大盗的藏宝洞。"芝麻,开门!"石门轰然而开,金币淌成河。阿里巴巴的哥哥进洞后忘了口令,对着石门喊"大麦开门?小米开门?"……有些门,进去容易,出来要命。' },
  anhsinbad: { icon: '⚓', color: '#4a6a8a', title: '辛巴达的码头', en: "Sindbad's Wharf", hint: '七次出海',
    desc: '七次出海,七次倾家荡产又满载而归:把鲸背当海岛、抱着巨鸟的脚上天、磁石山吸散大船、海老人骑上脖颈……辛巴达说:"我每次发誓再不出海——可海一涨潮,誓言就退了。"' },
  // —— 老岛加厚二批:山海经/侏罗纪/B-612/赤壁/兰若寺/梁山泊/风车/伊夫堡/绝望岛/体育/炼狱山/塞壬/桃花源/海底两万里 ——
  shjjingwei: { icon: '🐦', color: '#8c4a3a', title: '精卫石堆', en: 'Jingwei', hint: '衔石填海处',
    desc: '炎帝的小女儿女娃,游于东海,溺而不返,化为文首、白喙、赤足之鸟,名曰精卫。它衔西山的木石,要填平东海——一只鸟对一片海的战争,打了几千年,还没停。' },
  shjbuzhou: { icon: '⛰️', color: '#5a5248', title: '不周山残柱', en: 'Mount Buzhou', hint: '天柱折断处',
    desc: '共工怒触不周山,天柱折,地维绝——天倾西北,故日月星辰移焉;地不满东南,故百川水潦归焉。眼前这半截石柱,据说就是那场脾气留下的遗迹。' },
  juramber: { icon: '🦟', color: '#b8862e', title: '琥珀里的蚊子', en: 'The Amber', hint: '一切的起点',
    desc: '一只吸饱恐龙血的蚊子,困在琥珀里六千五百万年。科学家从它肚里抽出 DNA,用青蛙基因补齐空缺——马尔科姆当时就警告:补丁打在基因上,窟窿会开在别处。' },
  jurchaos: { icon: '🦋', color: '#4a5a3a', title: '混沌理论', en: 'Chaos Theory', hint: '一滴水的路径',
    desc: '马尔科姆博士的即兴演示:一滴水从手背滑落,两次路径绝不相同——蝴蝶效应。"你们的科学家太专注于能不能,忘了想一想该不该。"公园崩溃那晚,他赢了辩论,伤了条腿。' },
  b612sunset: { icon: '🌇', color: '#c26a3a', title: '四十四次日落', en: 'Forty-Four Sunsets', hint: '把椅子挪几步',
    desc: '在 B-612 上,只要把椅子挪几步,一天能看四十四次日落。"你知道的——人难过的时候,就会爱上日落。""那看四十四次的那天,你很难过吗?"小王子没有回答。' },
  b612snake: { icon: '🐍', color: '#b8a12a', title: '金蛇的沙地', en: 'The Snake', hint: '回家的办法',
    desc: '"我碰到谁,就能把谁送回他来的地方。"金色的蛇在沙地上说。小王子最后接受了它的帮助——身体太重,带不回他的星星去。他倒下时轻得像一棵树,连声音都没有。' },
  cbilianhuan: { icon: '⛓️', color: '#6a4a2a', title: '连环船锁', en: 'The Chained Fleet', hint: '锁在一起的船',
    desc: '庞统献计:大船小船首尾相连,铁环锁死,北军在船上如履平地——曹操大喜。他没细想:锁在一起的船,着起火来,也一起烧。' },
  cbihuarong: { icon: '🐎', color: '#5a6a4a', title: '华容道口', en: 'Huarong Trail', hint: '第三次笑',
    desc: '败走华容,曹操三次大笑"周瑜诸葛亮不过如此"——笑一次,伏兵出一队。最后一队是关羽。曹操把旧恩摆出来,关云长长叹一声拨马让路,放走了此后几十年的天下三分。' },
  lrsledger: { icon: '📖', color: '#4a5a6a', title: '宁采臣的行囊', en: "Ning's Satchel", hint: '不受金,不受色',
    desc: '穷书生夜宿兰若,小倩把金子放上他窗台,他扔了出去:"非义之财,污吾橐。"姥姥说这书生是呆子——呆子命硬,鬼都害不动。兰若寺的故事,从一个不开窍的人开始。' },
  lrssword: { icon: '🗡️', color: '#5a5a6a', title: '燕赤霞的剑匣', en: 'The Sword Case', hint: '匣中有白光',
    desc: '剑客把飞剑养在旧皮匣里。夜半妖风起,匣中铮然一声,一道白光绕寺三匝,妖邪皆避。"我不是道士,"燕赤霞说,"只是个不肯下山的侠客。"' },
  lspstele: { icon: '🗿', color: '#6a5a3a', title: '忠义堂石碣', en: 'The Stone Tablet', hint: '天书排座次',
    desc: '石碣从地下掘出,上镌天书:三十六天罡、七十二地煞,一百单八将排定座次。有人说是天意,有人说是宋江吴用连夜刻的——天意这东西,常常需要人手帮忙。' },
  lspwine: { icon: '🍶', color: '#8a5a2a', title: '大碗酒阵', en: 'Bowls of Wine', hint: '十八碗过冈',
    desc: '大碗筛酒,大块切肉。景阳冈的十八碗是武松的胆,浔阳楼的一壶是宋江的反诗——梁山的事,一半是官府逼的,一半是酒后应下的。' },
  fcydulci: { icon: '🧣', color: '#b06a8a', title: '杜尔西内娅的手帕', en: 'Dulcinea', hint: '查无此人的爱情',
    desc: '骑士的意中人,托波索的杜尔西内娅——其实是邻村农家姑娘,八成没跟他说过话。桑丘说:"大人,她在筛麦子。"骑士说:"那是宫殿里的金麦。"爱情最坚固的形态,是查无此人。' },
  fcybooks: { icon: '🔥', color: '#8c3a2a', title: '焚书的灰堆', en: 'The Burned Library', hint: '烧书治不了病',
    desc: '神父和理发师烧了骑士的藏书,把书房砌进墙里,骗他说是魔法师搬走的。他们以为烧了书就治了病——骑士只是换了个理由,继续出发。' },
  yfbabbe: { icon: '🕯️', color: '#5a4a3a', title: '法利亚的凿洞', en: "The Abbé's Tunnel", hint: '凿错方向的自由',
    desc: '长老用鱼骨针和旧烛台凿了三年,凿进的却是唐泰斯的牢房——方位算错了。"上帝的安排,"他后来说,"我要凿的是墙,凿通的是一个学生。"语言、科学、历史,连同宝藏,倾囊相授。' },
  yfblist: { icon: '📜', color: '#3a3a44', title: '伯爵的清单', en: "The Count's List", hint: '三个名字',
    desc: '复仇清单三个名字:费尔南、唐格拉尔、维尔福。二十三年后一一兑现,分毫不差。可最后一页写的却是他学到的最后一课:人类的全部智慧,就在两个词里——等待,和希望。' },
  rbxcalendar: { icon: '🪵', color: '#7a6242', title: '日历柱', en: 'The Calendar Post', hint: '一天一道刻痕',
    desc: '一根方柱:每天一道刻痕,每七天一道长痕,每月再加一道。二十八年两个月零十九天——他刻着刻着,把绝望刻成了秩序。' },
  rbxwheat: { icon: '🌾', color: '#b8962e', title: '第一片麦田', en: 'The First Wheat', hint: '倒出来的神迹',
    desc: '抖空的鸡饲料袋里带着几粒麦子,雨后竟发了芽。鲁滨逊起初以为是神迹,后来想起是自己随手倒的——"可把它种下去、收上来、再种下去的,是我。"第一炉面包出炉那天,这个硬汉哭了。' },
  sptbusby: { icon: '🕯️', color: '#8c2a2a', title: '慕尼黑纪念钟', en: 'The Munich Clock', hint: '1958.2.6',
    desc: '1958 年慕尼黑空难,八名"巴斯比之子"长眠。十年后,幸存的博比·查尔顿在温布利捧起欧洲冠军杯,看台上有人举着牌子:"这是为了他们。"红魔的红,从那天起多了一层含义。' },
  sptclass92: { icon: '👦', color: '#4a5a8a', title: '92 班荣誉墙', en: 'The Class of 92', hint: '一群孩子',
    desc: '吉格斯、斯科尔斯、贝克汉姆、内维尔兄弟、巴特——同一间更衣室长大的孩子。名宿断言:"靠一群孩子,你们赢不了任何东西。"那个赛季,孩子们拿了双冠王。' },
  purvirgil: { icon: '🏛️', color: '#5a5a6a', title: '维吉尔止步处', en: "Virgil's Farewell", hint: '智慧送到这里',
    desc: '维吉尔引但丁穿过地狱、登完七层,在乐园门口停住:"我以智慧带你至此。再往上,需要恩典。"异教的诗人不能入天堂——他转身下山的背影,是全诗最温柔的一处伤心。' },
  purangel: { icon: '👼', color: '#c8b87a', title: '七个 P 的门槛', en: 'The Seven P\'s', hint: '额头上的罪',
    desc: '进山门时,天使以剑尖在但丁额上刻下七个 P(Peccatum,罪)。每登完一层,翅膀轻拂,拭去一个。最后一个 P 消失的时候,他觉得身体轻得——要飞起来。' },
  sirmast: { icon: '🪢', color: '#6a5a4a', title: '桅杆绳结', en: 'The Mast', hint: '想听歌就绑紧',
    desc: '奥德修斯的办法流传至今:想听歌又想活命,就把自己绑上桅杆、给全船人耳朵灌蜡。"无论我怎么哀求都别松绑——加倍绑紧。"好奇心可以有,代价要先付。' },
  sirbones: { icon: '🦴', color: '#8a8478', title: '白骨滩', en: 'The Bone Shore', hint: '最温柔的杀法',
    desc: '礁缝里的白骨不是被吃剩的——塞壬不吃人。她们只是唱,唱到你忘了掌舵、忘了吃饭、忘了自己是谁。船碎了,人坐在礁石上听到饿死。世上最温柔的杀法。' },
  thywine: { icon: '🍶', color: '#c26a7a', title: '桃花酿人家', en: 'Peach Blossom Wine', hint: '设酒杀鸡作食',
    desc: '村人轮流请渔人吃饭,家家的酒都是自酿的桃花酿。"问今是何世,乃不知有汉,无论魏晋。"酒至半酣,渔人差点也忘了。' },
  thystele: { icon: '🪦', color: '#6a7a6a', title: '无问津碑', en: 'The Last Seeker', hint: '后遂无问津者',
    desc: '南阳刘子骥,高尚士也,闻之,欣然规往。未果,寻病终。后遂无问津者——碑上只刻这一句。有人读出警告,有人读出遗憾,还有人说:碑,是村里人自己立的。' },
  nemorgan: { icon: '🎹', color: '#2a3a4a', title: '海底管风琴', en: 'The Organ', hint: '只对海倾诉',
    desc: '鹦鹉螺号的客厅里有一架管风琴。深夜,尼摩船长独自弹奏,琴声混着海流拍打船壳的闷响——一个与人类世界断交的人,只肯对海倾诉。' },
  nemflag: { icon: '🏴', color: '#1c1c24', title: '南极的黑旗', en: 'The Black Flag', hint: '绣着 N 的旗',
    desc: '1868 年 3 月 21 日,尼摩把一面绣着 N 的黑旗插上南极点:"我不命令任何人,也不服从任何人。"比人类真正抵达南极,早了四十多年——当然,在小说里。' },
  // —— 未竟之都(世界交流中心遗址,1913 安徒生 & 埃布拉尔真实计划)——
  unjport: { icon: '🏳️', color: '#7a8490', title: '和平港', en: 'The Harbour of Peace', hint: '褪色的万国旗',
    desc: '码头广播还在循环:"欢迎来到人类共同的首都。"旗杆一排排立着,旗都褪成了灰白。泊位上停着各岛来的船——木船、黑帆、科研艇——都是来看它的。没有一艘,是来住下的。' },
  unjplaza: { icon: '🗺️', color: '#8a94a0', title: '万国广场', en: 'Plaza of Nations', hint: '刻着世界地图的地面',
    desc: '地面刻着整幅世界地图与经纬线,大得让任何人都感到自己渺小。中央喷泉干涸多年——夜里池底的积水会映出星空,这是全城唯一如期完工的"倒影工程"。(集齐蓝图并重启塔灯后,可在此召开无人会议)' },
  unjtemple: { icon: '🏛️', color: '#9a9488', title: '艺术与科学神殿', en: 'Temple of Arts & Sciences', hint: '一半艺术,一半科学',
    desc: '一半是艺术馆,一半是科学馆,共用同一道山墙——设计者相信这两样东西本是一体。馆里立着"未完成的人类群像":一百个基座,只立起了十七尊。' },
  unjtower: { icon: '🗼', color: '#b0b4bc', title: '进步之塔', en: 'The Tower of Progress', hint: '断在一半的高度',
    desc: '原设计三百二十米,通体白石,顶端一盏"照向全人类的灯"。它停在了一半的高度,脚手架还挂在断口上,像一句没说完的话。(集齐四张蓝图可重启塔灯)' },
  unjcourt: { icon: '⚖️', color: '#6a7080', title: '国际法庭', en: 'The World Court', hint: '从未开庭',
    desc: '审判席上堆着未签署的和平条约,墙上刻着一百种语言的"正义"。这里从未开过一次庭——不是没有纠纷,是没有人承认它的管辖权。' },
  unjstadium: { icon: '🏟️', color: '#7a8a6a', title: '万国运动场', en: 'The World Stadium', hint: '长满野花的跑道',
    desc: '跑道开裂,野花从看台缝里长出来,火炬台是冷的。设计者相信:人类第一场共同的仪式,应该是一场比赛,而不是一场战争。这里一场比赛也没办过——但守夜人每晚都来"点"一次火。' },
  unjruin: { icon: '🏗️', color: '#8a8478', title: '未完成区', en: 'The Unfinished Quarter', hint: '永远的施工中',
    desc: '无头的雕像、通向半空的桥、只建了一半的柱廊。散落的图纸被海风钉在脚手架上。这里不是废墟——废墟是完成后的死;这里是没有完成的生,永远停在"即将"。' },
  unjb1: { icon: '📐', color: '#4a6a8a', title: '蓝图 · 神殿卷', en: 'Blueprint I', hint: '拾取蓝图(1/4)',
    desc: '艺术与科学神殿的原始图纸:穹顶下要挂一座"人类知识总目"的青铜浑天仪。图角有一行小字:第 1913 号修改稿。' },
  unjb2: { icon: '📐', color: '#4a6a8a', title: '蓝图 · 法典卷', en: 'Blueprint II', hint: '拾取蓝图(2/4)',
    desc: '国际法庭的图纸:旁听席设三千座,"任何人可入内旁听任何案件"。边缘被雨水洇过,像一页哭过的纸。' },
  unjb3: { icon: '📐', color: '#4a6a8a', title: '蓝图 · 竞技卷', en: 'Blueprint III', hint: '拾取蓝图(3/4)',
    desc: '万国运动场图纸:跑道按马拉松的梦想丈量,火炬设计为"永不熄灭"。背面有人用铅笔写:如果人类必须竞争,让他们在这里竞争。' },
  unjb4: { icon: '📐', color: '#4a6a8a', title: '蓝图 · 塔基卷', en: 'Blueprint IV', hint: '拾取蓝图(4/4)',
    desc: '进步之塔的地基图:塔心预留一根中空导管,直通地下交流网——设计者要让塔灯的电,来自所有隧道的汇流。图纸最下方写着:待全体人类到齐后点亮。' },
  unjtorch: { icon: '🔥', color: '#a85a2a', title: '冷火炬', en: 'The Cold Torch', hint: '守夜人的念想',
    desc: '火炬台是冷的,炬身却被摸得发亮——守夜人每晚来"点"一次,点的是习惯,也是念想。基座刻着一行小字:圣火不熄,直到最后一个人退场。下面有人用铅笔补了一句:可惜第一个人还没进场。(夜里可以帮他真点一次)' },
  unjtop: { icon: '🌆', color: '#8fa8c8', title: '断口平台', en: 'The Broken Summit', hint: '塔停下的地方',
    desc: '沿脚手架边的螺旋坡道爬到塔的断口——这里本该继续向上两百多米。往下看,大道、广场、神殿、法庭,全城的几何一览无余;往远看是海,和海那头四十几座各过各的日子的岛。风很大,像谁在这里叹了一百年的气。' },
  unjn1: { icon: '📮', color: '#7a6a4a', title: '退回的邀请函', en: 'Returned Invitations', hint: '记者的档案 1/3',
    desc: '港务仓库的木箱里堆着几十捆烫金邀请函,收件人是各国君主与议会——绝大多数原封退回,邮戳盖着"查无此意愿"。雕塑家写了一千封信,回信不到十封。第一箱上贴着他的手迹:继续寄。' },
  unjn2: { icon: '📠', color: '#6a7080', title: '电报底稿', en: 'The Telegram Drafts', hint: '记者的档案 2/3',
    desc: '法庭档案柜里的一沓电报底稿,日期停在 1914 年夏天:"资金撤回""银行观望""欧洲情势不明,建都事宜恕难再议"。最后一封只有半句:战争恐怕——后面没有了。' },
  unjn3: { icon: '📋', color: '#8a8478', title: '最后一次工地会议记录', en: 'The Final Site Meeting', hint: '记者的档案 3/3',
    desc: '未完成区捡到的会议记录:出席四人,议题三项——石料欠款、工人遣散、塔顶灯罩是否先付定金。末尾是主持人发言:"诸位,今天先散会。城是给后人建的,后人会来接着开。"此后再无下一页。' },
  unjnews: { icon: '🗞️', color: '#4a4a44', title: '记者的打字机', en: "The Reporter's Typewriter", hint: '最后一篇报道',
    desc: '旧时代记者的行军桌上,一台打字机压着空白稿纸,色带早就干了。她要的线索有三样:港口的邀请函、法庭的电报底稿、工地的会议记录——集齐了,这篇拖了一百年的报道就能发稿。' },
  unjlobby: { icon: '🗣️', color: '#7a6a9a', title: '翻译回廊', en: 'The Hall of Tongues', hint: '三百间翻译间',
    desc: '一间挨一间的格子间,门上的语言名牌从阿非利卡语一直排到祖鲁语,整整三百间。只有 17 号的椅子被坐得发亮——其余二百九十九间,连灰尘都还是崭新的。回廊深处立着三块「误译碑」:一句话在三百种语言里绕了一百年,回来时已经面目全非。' },
  unjw1: { icon: '🫛', color: '#5a7a4a', title: '误译碑 · 之一', en: 'Mistranslation I', hint: '差一个字母的世界',
    desc: '碑上刻着一句话的漂流史:出发时字字千钧,辗转三十种语言后,抵达的却是——「请给豌豆一个机会」。修复系统需要原文。想想:什么词,和豌豆只差一个字母?' },
  unjw2: { icon: '📝', color: '#7a6a4a', title: '误译碑 · 之二', en: 'Mistranslation II', hint: '绕地球一圈的宣言',
    desc: '这句宣言本该刻上万国广场的地面,绕地球一圈回来,成了——「我们都是错别字」。翻译员当年在页边批注:"接近了。但世界要的不是这句。"修复系统需要原文。' },
  unjw3: { icon: '🏠', color: '#8a5a4a', title: '误译碑 · 之三', en: 'Mistranslation III', hint: '掉了一个字母的词',
    desc: '设计师想把这个词刻在城门上,让每个登岛的人第一眼看见。可它在第一百次转译时掉了最后一个字母,成了「hom」——一个没写完的词,一座没建完的城。修复系统需要原文。' },
  unjlang: { icon: '💡', color: '#9a8ac8', title: '17 号翻译间', en: 'Booth No.17', hint: '全楼唯一用过的一间',
    desc: '三百间里唯一被用过的翻译间——万国翻译员四十年都坐在这里。桌上有三枚修复插销,对应回廊里的三块误译碑。全部归位时,三百间的灯会一起亮:那将是这座城说过的最长的一句话。' },
  unjkao: { icon: '📚', color: '#7a6248', title: '考据学会的长桌', en: 'The Intertext Society', hint: '会员:一人',
    desc: '和平港边一张堆满卡片和线绳的长桌——「群岛考据学会」,全部会员:一人。他坚信这五十三座岛是同一本书的五十三页,证据就藏在各岛的只言片语里。长桌上摊着六份未完成的考据,每一份都需要两处岛屿的见闻互证。' },
  // —— 船只 encounter:海上四艘传奇 ——
  ghostship: { icon: '🐺', color: '#2a2e36', title: '幽灵号', en: 'The Ghost', hint: '海狼的猎场',
    desc: '一艘漆黑的捕猎帆船,船长"海狼"拉森一手掌舵、一手读勃朗宁。"人生是发酵的酵母,大鱼吃小鱼,只为保持自己的游动。"落水的文弱书生凡·卫登被他捞起,从"少爷手"被锤炼成真正的水手——杰克·伦敦把尼采装进了一条船。' },
  wehere: { icon: '🎣', color: '#5a4a32', title: '"我们在这儿"号', en: "The We're Here", hint: '大浅滩的渔船',
    desc: '富家少爷哈维从邮轮跌进大西洋,被这条纽芬兰渔船捞起。船长不信他爸是百万富翁,只给他一份月薪十块半的水手活。三个月的鳕鱼、绳结与守夜之后——少年把"谢谢"和"值得"都学会了。《怒海余生》,吉卜林。' },
  grantbottle: { icon: '🍾', color: '#3a6a5a', title: '瓶中信', en: 'The Message in the Bottle', hint: '37°11′',
    desc: '鲨鱼肚里剖出的香槟瓶,三张被海水泡烂的纸:英语、法语、德语各一份,拼出半句坐标——"37°11′……格兰特船长"。邓肯号为这半句话沿着三十七度纬线绕了地球一整圈。一条纬线,用忠诚画成。' },
  fogg80: { icon: '🎩', color: '#4a4a5a', title: '福克先生的邮轮', en: 'Around the World', hint: '八十天,一分不多',
    desc: '"我用两万英镑打赌:八十天,环绕地球一周。"福克先生带着仆人路路通,火车、邮轮、大象、雪橇轮番上阵,自以为迟到了五分钟——却赢在一个没算到的地方:一路向东,他多赚了一整天。' },
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
  if (k === 'unjb1' || k === 'unjb2' || k === 'unjb3' || k === 'unjb4') { const bi = k.slice(-1);
    btn = PSTORE.getItem('w1001.' + k) === '1'
      ? '<span style="color:#8a7c62;font-size:13px">这张蓝图已收入行囊。</span>'
      : `<button class="again" data-unjbp="${bi}">📐 收起这张蓝图</button>`; }
  if (k === 'unjtower') { const bp = [1, 2, 3, 4].filter(i => PSTORE.getItem('w1001.unjb' + i) === '1').length;
    btn = PSTORE.getItem('w1001.unjlit') === '1' ? '<span style="color:#8a7c62;font-size:13px">塔灯已重新亮起——半座塔,一整颗心。</span>'
      : (bp >= 4 ? '<button class="again" data-unjlight>🗼 接通地下汇流,重启塔灯</button>' : `<span style="color:#8a7c62;font-size:13px">(蓝图 ${bp}/4——散落在神殿、法庭、运动场与塔基)</span>`); }
  if (k === 'unjplaza') { const end = PSTORE.getItem('w1001.unjend');
    btn = end ? '<span style="color:#8a7c62;font-size:13px">会议已散。命运已定:' + ['', '修复之城', '纪念之墟', '旅人花园'][+end] + '。</span>'
      : (PSTORE.getItem('w1001.unjlit') === '1' ? '<button class="again" data-unjmeet>🕊️ 启动投影,召开无人会议</button>'
        : '<span style="color:#8a7c62;font-size:13px">(塔灯亮起之日,投影系统方能启动)</span>'); }
  if (k === 'unjtorch') btn = '<button class="again" data-unjgames>🔥 帮守夜人点燃圣火</button>';
  if (k === 'unjtop') btn = PSTORE.getItem('w1001.unjtop') === '1'
    ? '<span style="color:#8a7c62;font-size:13px">你在断口的风里站过了。塔记得每一个爬上来的人。</span>'
    : '<button class="again" data-unjtop>🌆 在断口的风里站一会儿</button>';
  if (k === 'unjn1' || k === 'unjn2' || k === 'unjn3') { const ni2 = k.slice(-1);
    btn = PSTORE.getItem('w1001.' + k) === '1' ? '<span style="color:#8a7c62;font-size:13px">这份档案已抄录——记得带给旧时代记者。</span>'
      : `<button class="again" data-unjn="${ni2}">🗂️ 抄录这份档案</button>`; }
  if (k === 'unjnews') { const na = [1, 2, 3].filter(i => PSTORE.getItem('w1001.unjn' + i) === '1').length;
    btn = PSTORE.getItem('w1001.unjnews') === '1' ? '<span style="color:#8a7c62;font-size:13px">报道已发。全世界的读者:你,和风。</span>'
      : (na >= 3 ? '<button class="again" data-unjnews>🗞️ 换上新色带,替她把报道打出来</button>' : `<span style="color:#8a7c62;font-size:13px">(档案 ${na}/3——港口仓库、法庭档案柜、未完成区)</span>`); }
  if (k === 'unjw1' || k === 'unjw2' || k === 'unjw3') { const wi = k.slice(-1);
    const CHOICES = { 1: [['和平', 1], ['豌豆汤', 0], ['安静', 0]], 2: [['我们都是完人', 0], ['我们都是人', 1], ['我们都是名人', 0]], 3: [['火腿', 0], ['旅馆', 0], ['家', 1]] };
    btn = PSTORE.getItem('w1001.' + k) === '1'
      ? '<span style="color:#8a7c62;font-size:13px">碑文已修复,插销亮着柔光。</span>'
      : CHOICES[wi].map(([t, ok]) => `<button class="again" style="display:block;width:100%;margin:6px 0" data-unjw="${wi}" data-ok="${ok}">「${t}」</button>`).join(''); }
  if (k === 'unjlang') { const nw = [1, 2, 3].filter(i => PSTORE.getItem('w1001.unjw' + i) === '1').length;
    btn = PSTORE.getItem('w1001.unjlang') === '1' ? '<span style="color:#8a7c62;font-size:13px">三百盏灯都亮着。这座城,终于把那句话说完了。</span>'
      : (nw >= 3 ? '<button class="again" data-unjlang>💡 按下总闸,让三百间一起开口</button>' : `<span style="color:#8a7c62;font-size:13px">(修复插销 ${nw}/3——先去回廊修好三块误译碑)</span>`); }
  if (k === 'unjkao') {
    const KAO = [
      ['凿壁的邻居', ['nq_gunkan', '去废矿海城乘罐笼下井'], ['d_heart', '潜入迷宫正中见「潮汐之心」']],
      ['被请离的客人', ['nq_gala', '去进化群岛画雀喙图谱'], ['nq_mor', '去莫罗博士岛随兽人诵律法']],
      ['等了一百年的那句话', ['nq_soco', '去真名植物岛听龙血树的真名'], ['unjlang', '修复本岛翻译回廊(三块误译碑+总闸)']],
      ['两个不肯走的人', ['nq_kilda', '去风暴孤岛寄出邮件船'], ['flotsam5', '去绝望岛收齐 5 箱漂流物资']],
      ['不可至之地', ['nq_sanxian', '去三仙岛驾舟追一次蜃楼'], ['taofound', '寻见桃花源(仿佛若有光……)']],
      ['城市与描述', ['nq_venezia', '去看不见的水城,向可汗描述群岛'], ['unjend', '在未竟之都的无人会议作出抉择']],
    ];
    const kaoHas = f => f === 'flotsam5' ? (PSTORE.getItem('w1001.flotsam') || '').split(',').filter(Boolean).length >= 5 : f === 'unjend' ? !!PSTORE.getItem('w1001.unjend') : PSTORE.getItem('w1001.' + f) === '1';
    if (PSTORE.getItem('w1001.kaodone') === '1') btn = '<span style="color:#8a7c62;font-size:13px">《群岛互文考》已装订付印。印数 2 册:他一册,你一册。</span>';
    else btn = KAO.map((K2, i2) => {
      if (PSTORE.getItem('w1001.kao' + (i2 + 1)) === '1') return `<div style="font-size:13px;color:#2c7a4b;margin:6px 0">✅ 考据${i2 + 1}「${K2[0]}」已录入</div>`;
      if (kaoHas(K2[1][0]) && kaoHas(K2[2][0])) return `<button class="again" data-kao="${i2 + 1}" style="display:block;width:100%;margin:6px 0">📎 提交考据:${K2[0]}</button>`;
      const miss = [K2[1], K2[2]].filter(p2 => !kaoHas(p2[0])).map(p2 => p2[1]).join(';');
      return `<div style="font-size:12px;color:#8a7c62;margin:6px 0;line-height:1.5">⏳ 「${K2[0]}」尚缺见闻:${miss}</div>`;
    }).join('') + ([1, 2, 3, 4, 5, 6].every(i2 => PSTORE.getItem('w1001.kao' + i2) === '1') ? '<button class="again" data-kaodone style="display:block;width:100%;margin:8px 0">📚 装订《群岛互文考》</button>' : '');
  }
  if (k === 'treasuredig') btn = PSTORE.getItem('w1001.treasure') === '1'
    ? '<span style="color:#8a7c62;font-size:13px">坑已挖开,弗林特的黄金归你——空气里还飘着一点朗姆酒味。</span>'
    : '<button class="again" data-treasure>⛏️ 照着藏宝图,挖!</button>';
  if (k === 'marlin') btn = PSTORE.getItem('w1001.marlin') === '1'
    ? '<span style="color:#8a7c62;font-size:13px">船边只剩一副雪白的巨大骨架。老人睡了,梦见狮子。</span>'
    : '<button class="again" data-marlin>🦈 抄起鱼叉,和鲨鱼拼了!</button>';
  if (k === 'peng') btn = '<button class="again" data-peng>🕊️ 乘大鹏,扶摇直上九万里</button> <button class="again" data-pengsky style="margin-top:8px">🏯 乘大鹏,直上天空之城</button>';
  if (k === 'skyback') btn = '<button class="again" data-skyback>🕊️ 呼唤大鹏,乘风归海</button>';
  if (k === 'gardener') btn = PSTORE.getItem('w1001.skyflower') === '1'
    ? '<span style="color:#8a7c62;font-size:13px">石碑前多了一朵花。园丁对你微微躬身,又转回它的花去。</span>'
    : '<button class="again" data-flower>🌼 摘一朵花,放在石碑前</button>';
  if (k === 'lodestone') btn = '<button class="again" data-spell>🗣️ 低声念出那个词……</button>';
  if (/^chime[1-4]$/.test(k)) {
    const ci = k[5], SEA9 = '春夏秋冬';
    btn = PSTORE.getItem('w1001.skyc' + ci) === '1'
      ? '<span style="color:#8a7c62;font-size:13px">这枚铃已响过——余音还挂在风里。</span>'
      : `<button class="again" data-chime="${ci}">🎐 摇响${SEA9[ci - 1]}铃</button>`;
  }
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
  ['pur', '⛰️ 炼狱山'], ['unj', '🏛️ 未竟之都'],
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
  cardBody.querySelectorAll('[data-goworld]').forEach(b => b.addEventListener('click', () => ferryGo(b.dataset.goworld)));
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
  cardBody.querySelectorAll('[data-unjbp]').forEach(b => b.addEventListener('click', () => {
    const i = b.dataset.unjbp; if (PSTORE.getItem('w1001.unjb' + i) === '1') return;
    PSTORE.setItem('w1001.unjb' + i, '1'); earnSB(8);
    const got = [1, 2, 3, 4].filter(j => PSTORE.getItem('w1001.unjb' + j) === '1').length;
    closeModals(); toast(`📐 蓝图收起(${got}/4)· ⚡+8` + (got === 4 ? ' —— 去进步之塔,重启那盏灯' : '')); blip(700);
  }));
  cardBody.querySelector('[data-unjlight]')?.addEventListener('click', () => {
    if (PSTORE.getItem('w1001.unjlit') === '1') return;
    PSTORE.setItem('w1001.unjlit', '1'); unjTowerOn = true;
    earnSB(30); stars++; saveQuest(); updateQuestHUD(); closeModals();
    toast('🗼 汇流接通——断口上,那盏"照向全人类的灯"重新亮起。⚡+30 · ⭐+1'); blip(523); setTimeout(() => blip(784), 200);
  });
  cardBody.querySelector('[data-unjmeet]')?.addEventListener('click', () => unjMeeting());
  cardBody.querySelectorAll('[data-unjn]').forEach(b => b.addEventListener('click', () => {
    const i = b.dataset.unjn; if (PSTORE.getItem('w1001.unjn' + i) === '1') return;
    PSTORE.setItem('w1001.unjn' + i, '1'); earnSB(6);
    const got = [1, 2, 3].filter(j => PSTORE.getItem('w1001.unjn' + j) === '1').length;
    toast(got >= 3 ? '🗂️ 三份档案集齐了 · ⚡+6——去找旧时代记者的打字机!' : `🗂️ 档案已抄录(${got}/3)· ⚡+6`); blip(700); closeModals();
  }));
  cardBody.querySelector('[data-unjtop]')?.addEventListener('click', () => {
    if (PSTORE.getItem('w1001.unjtop') === '1') return;
    PSTORE.setItem('w1001.unjtop', '1'); earnSB(15);
    toast('🌆 断口平台 · ⚡+15——三百二十米的梦,你替它到了一半。'); blip(760); closeModals();
  });
  cardBody.querySelector('[data-unjgames]')?.addEventListener('click', () => { closeModals(); startUnjGames(); });
  cardBody.querySelector('[data-unjnews]')?.addEventListener('click', () => showUnjNews());
  cardBody.querySelectorAll('[data-unjw]').forEach(b => b.addEventListener('click', () => {
    const wi = b.dataset.unjw;
    if (b.dataset.ok !== '1') {
      const jokes = { 1: '❌ 系统提示:全城食堂的菜单被改成了豌豆汤。再想想。', 2: '❌ 翻译员的批注浮现:"完人?名人?世界要的不是这句。"', 3: '❌ 系统提示:城门上总不能刻火腿。再想想。' };
      toast(jokes[wi]); blip(220); return;
    }
    PSTORE.setItem('w1001.unjw' + wi, '1'); earnSB(8);
    const fixed = { 1: '请给和平一个机会', 2: '我们都是人', 3: '家' };
    const got = [1, 2, 3].filter(i => PSTORE.getItem('w1001.unjw' + i) === '1').length;
    toast(`✅ 插销归位(${got}/3)· ⚡+8——碑文重新亮起:「${fixed[wi]}」`); blip(760); closeModals();
  }));
  cardBody.querySelector('[data-unjlang]')?.addEventListener('click', () => {
    if (PSTORE.getItem('w1001.unjlang') === '1') return;
    PSTORE.setItem('w1001.unjlang', '1'); earnSB(30); stars++; saveQuest(); updateQuestHUD();
    if (unjLangLight) unjLangLight.intensity = 22;
    toast('💡 三百间翻译间的灯同时亮起!有些话绕了一百年,终于被听懂 · ⚡+30 · ⭐+1 · 新称号「通天塔修补匠」'); blip(900); closeModals();
  });
  cardBody.querySelectorAll('[data-kao]').forEach(b => b.addEventListener('click', () => {
    const i = b.dataset.kao; if (PSTORE.getItem('w1001.kao' + i) === '1') return;
    PSTORE.setItem('w1001.kao' + i, '1'); earnSB(12);
    const FINDS = {
      1: '📎 两张证词对上了:矿工听见的凿壁声,是迷宫在生长——海底隧道不是天然的,「邻居」一直都在。',
      2: '📎 育种棚记录册上"我来替时间赶路"的笔迹,与莫罗岛的实验日志如出一辙——他被请离之后,去西北那座岛把名字改成了"博士"。',
      3: '📎 名师说"知其真名方可相守";三百盏灯亮起那晚说的是同一件事——语言的尽头不是理解,是相守。',
      4: '📎 守望者躲进石仓留了下来,鲁滨逊拼了命想回去——离开与留下,原来是同一种忠诚。',
      5: '📎 蓬莱近之则隐,桃花源不在任何海图上——一个拒绝抵达,一个拒绝被找。可你两处都到过:不可至之地,只对「寻」关闭,对「遇」敞开。',
      6: '📎 马可描述的城因讲述而活,安徒生画的城因无人来住而死——城市从来不是石头造的,是被讲述建成的。',
    };
    toast(FINDS[i] + ' ⚡+12'); blip(760); closeModals();
  }));
  cardBody.querySelector('[data-kaodone]')?.addEventListener('click', () => showKaoEssay());
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
  cardBody.querySelector('[data-pengsky]')?.addEventListener('click', () => {
    const first9 = PSTORE.getItem('w1001.skycity') !== '1';
    if (first9) { PSTORE.setItem('w1001.skycity', '1'); earnSB(30); stars++; saveQuest(); updateQuestHUD(); }
    flight = { sky: 1, t: 0, dur: 24, from: [player.position.x, player.position.z], to: [SKY.x, SKY.z + 40],
      y0: player.position.y, y1: SKY.y, msg: '🏯 大鹏收翼,落在云鹏哨站——欢迎来到勒皮他。' };
    closeModals();
    toast('🏯 大鹏振翅,直上云端!' + (first9 ? '(首访 ⚡+30 · ⭐+1)' : ''));
    blip(523); setTimeout(() => blip(659), 130); setTimeout(() => blip(880), 260);
  });
  cardBody.querySelector('[data-skyback]')?.addEventListener('click', () => {
    flight = { sky: 1, t: 0, dur: 24, from: [player.position.x, player.position.z], to: [PENG_X + 6, PENG_Z + 6],
      y0: player.position.y, y1: Math.max(height(PENG_X + 6, PENG_Z + 6), 0), msg: '🕊️ 大鹏俯冲而下,轻轻把你放回栖石旁。' };
    closeModals();
    toast('🕊️ 纵身一跃——大鹏接住了你,乘风归海!');
    blip(880); setTimeout(() => blip(659), 130); setTimeout(() => blip(523), 260);
  });
  cardBody.querySelector('[data-flower]')?.addEventListener('click', () => {
    if (PSTORE.getItem('w1001.skyflower') === '1') return;
    PSTORE.setItem('w1001.skyflower', '1'); earnSB(15);
    closeModals();
    toast('🌼 机器人看着那朵花,看了很久。锈蚀的指节轻轻碰了碰你的袖口。⚡+15');
    blip(392); setTimeout(() => blip(523), 180);
  });
  cardBody.querySelector('[data-spell]')?.addEventListener('click', () => {
    spellT9 = 3;
    if (PSTORE.getItem('w1001.skyspell') !== '1') { PSTORE.setItem('w1001.skyspell', '1'); earnSB(5); }
    closeModals();
    toast('🔮 你低声念出那个词——磁石骤然大亮,全城轻轻一颤,又稳稳浮住。它记得这个词,但它选择了原谅。');
    blip(196); setTimeout(() => blip(147), 200); setTimeout(() => blip(98), 420);
  });
  cardBody.querySelector('[data-chime]')?.addEventListener('click', ev => {
    const ci = +ev.currentTarget.dataset.chime;
    if (PSTORE.getItem('w1001.skyc' + ci) === '1') return;
    PSTORE.setItem('w1001.skyc' + ci, '1');
    const fq9 = [523, 659, 784, 1047][ci - 1];
    blip(fq9); setTimeout(() => blip(fq9 * 1.25), 140); setTimeout(() => blip(fq9 * 1.5), 280);
    closeModals();
    const n9 = [1, 2, 3, 4].filter(i => PSTORE.getItem('w1001.skyc' + i) === '1').length;
    if (n9 === 4 && PSTORE.getItem('w1001.skychime') !== '1') {
      PSTORE.setItem('w1001.skychime', '1'); earnSB(40); stars++; saveQuest(); updateQuestHUD();
      toast('🎐 四季齐鸣!勒皮他的乐师们停下手中的几何,静静听完了整支曲子。⚡+40 · ⭐+1');
    } else toast('🎐 ' + '春夏秋冬'[ci - 1] + '铃响起,清音散入云海(' + n9 + '/4)');
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
    { id: 'abysser', name: '🕳️ 深渊潜者', got: PSTORE.getItem('w1001.abyss') === '1', note: '触及星球之脐' },
    { id: 'unjer', name: '🏛️ 未竟之都的见证者', got: !!PSTORE.getItem('w1001.unjend'), note: '为人类之都做出抉择' },
    { id: 'unjnews', name: '🗞️ 迟到百年的头版', got: PSTORE.getItem('w1001.unjnews') === '1', note: '发出未竟之都的最后一篇报道' },
    { id: 'unjlang', name: '🗣️ 通天塔修补匠', got: PSTORE.getItem('w1001.unjlang') === '1', note: '修复万国翻译系统' },
    { id: 'combo', name: '🧭 组合群岛勘察员', got: COMBO_KEYS.every(k => PSTORE.getItem('w1001.nq_' + k) === '1'), note: `走完全部 ${COMBO_KEYS.length} 座组合岛的故事线` },
    { id: 'kao', name: '📚 群岛考据学家', got: PSTORE.getItem('w1001.kaodone') === '1', note: '装订《群岛互文考》' },
    { id: 'passall', name: '🌍 环球旅行家', got: PSTORE.getItem('w1001.passall') === '1', note: '护照盖满全部岛屿' },
    { id: 'honor1', name: '🥇 鲸背赞助人', got: PSTORE.getItem('w1001.honor1') === '1', note: '基金会荣誉(300 ⚡)' },
    { id: 'honor2', name: '🎗️ 灯塔守护者', got: PSTORE.getItem('w1001.honor2') === '1', note: '基金会荣誉(800 ⚡)' },
    { id: 'fundstone', name: '❤️ 群岛基石', got: PSTORE.getItem('w1001.fundstone') === '1', note: '累计捐赠 2000 ⚡' },
    { id: 'foodie', name: '🍜 环球食客', got: PSTORE.getItem('w1001.foodie') === '1', note: '尝遍九道地方味' },
    { id: 'wc100', name: '🌏 1001 世界的居民', got: PSTORE.getItem('w1001.wc100') === '1', note: '群岛完成度 100%' },
    { id: 'babel',  name: '📖 巴别读者',   got: PSTORE.getItem('w1001.babel') === '1', note: '满月夜入海底巴别海窟' },
    { id: 'skeleton', name: '🕸️ 世界骨架 · 见证者', got: PSTORE.getItem('w1001.skeleton') === '1', note: '窥破星球真正的结构' },
    { id: 'crusoe', name: '🏝️ 荒岛求生者', got: f.flot,    note: '集齐五箱漂流物资' },
    { id: 'connois', name: '🎨 鉴赏大家', got: Object.keys(CATS).some(c => (seen[c] || []).length >= (D[c] ? D[c].length : 1e9)), note: '完整收录任一馆藏' },
    { id: 'skywalk', name: '🏯 云上行者', got: PSTORE.getItem('w1001.skycity') === '1' && PSTORE.getItem('w1001.skychime') === '1', note: '登临天空之城,摇响四季风铃' },
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
  if (skel) {   // 世界骨架之后:第五、六章在未竟之都收束
    if (PSTORE.getItem('w1001.unjend')) return { st: '终章 · 主线已通关', tip: '你看穿了世界的骨架,也替那座未完成的人类之都做出了抉择。剩下的旅程,是把每座岛的故事都走一遍——看下方各馆藏进度。', done: true };
    const bps = [1, 2, 3, 4].filter(i => PSTORE.getItem('w1001.unjb' + i) === '1').length;
    if (PSTORE.getItem('w1001.unjlit') === '1') return { st: '第六章 · 无人会议', tip: '塔灯已重燃。回到万国广场的会议厅,听幻影代表们吵完最后一架——然后,替全人类做一个小小的决定。' };
    if (bps > 0) return { st: `第五章 · 未竟之都 · 蓝图 ${bps}/4`, tip: '在神殿、法庭、运动场、塔基各找一张蓝图,集齐后去塔底重燃「人类之灯」。(持蓝图按 V/📐,可以看这座城本该的样子)' };
    return { st: '第五章 · 未竟之都', tip: '你已看穿骨架——但迷宫的每条隧道,最终都通向正中的「潮汐之心」。从那里的蓝洞浮上去:一座为全人类而建、却从未完成的首都在等你。(东滩渡口也有直达船)' };
  }
  if (caved || clues > 0) return { st: `第四章 · 世界骨架 · 线索 ${clues}/3`, tip: '海底迷宫并非天然。潜入深处集齐三线索:🫀 潮汐之心(迷宫正中)· 🖼️ 海底壁画(某条死路尽头)· 📖 巴别海窟(满月夜穿过潮汐门)。' };
  if (hasRope) return { st: '第三章 · 潜入海底', tip: '带上导绳,从主岛西岸「牛首回廊」海蚀洞、或各岛蓝洞潜入海底隧道迷宫,顺着发光导绳穿行到别的岛。' };
  if (seenAny) return { st: '第二章 · 扬帆出海', tip: '去东滩渡口坐船,或按 M 在海图上点岛直航——五十八座岛任你逛(每岛藏着一条故事线)。顺路到千岛装备行买一条「导绳」——那是海底迷宫的钥匙。' };
  return { st: '第一章 · 初来乍到', tip: '在收藏之岛四处走走:走近按 E 看藏品、和 NPC 说话、做支线,攒算力币 ⚡。' };
}
function worldCompletion() {   // 🌏 九维聚合完成度(wc100 称号自身不计入,避免循环)
  const nqTotal = NISLES.length - 1;
  const nqDone = NISLES.filter(s9 => s9.key !== 'trs' && PSTORE.getItem('w1001.nq_' + s9.key) === '1').length;
  const tl = titleList().filter(t9 => t9.id !== 'wc100');
  let cards9 = 0; try { cards9 = JSON.parse(PSTORE.getItem('w1001.cards') || '[]').length; } catch (e) {}
  const parts = [
    ['🛂 环球护照', stamps.size, PASSPORT.length, .2],
    ['📜 岛屿故事线', nqDone, nqTotal, .2],
    ['🎖️ 称号', tl.filter(t9 => t9.got).length, tl.length, .15],
    ['🧭 主线', mainQuest().done ? 1 : 0, 1, .1],
    ['✨ 星座', constSeen.size, Math.max(constDirs.length, 1), .1],
    ['🏛️ 馆藏里程碑', mileGot.size, Object.keys(CATS).length * 3, .1],
    ['🍜 食单', eaten.size, 9, .05],
    ['💌 明信片', Math.min(cards9, 12), 12, .05],
    ['🏠 宅邸', (PSTORE.getItem('w1001.home') === '1' ? 1 : 0) + (+(PSTORE.getItem('w1001.homelv') || 0) > 0 ? +(PSTORE.getItem('w1001.homelv') || 0) : 0), 3, .05],
  ];
  let p = 0; for (const [, a9, b9, w9] of parts) p += w9 * Math.min(a9 / b9, 1);
  return { p: Math.min(p, 1), parts };
}
function fireworks() {   // 🎇 屏幕烟花(DOM,零 3D 风险)
  for (let i = 0; i < 18; i++) {
    const sp = document.createElement('div');
    sp.textContent = ['🎆', '🎇', '✨'][i % 3];
    const a9 = Math.random() * Math.PI * 2, r9 = 120 + Math.random() * 170;
    sp.style.cssText = 'position:fixed;left:50%;top:45%;font-size:' + (18 + Math.random() * 18) + 'px;z-index:60;pointer-events:none;transition:all 1.6s cubic-bezier(.2,.7,.3,1);opacity:1';
    document.body.appendChild(sp);
    requestAnimationFrame(() => { sp.style.transform = 'translate(' + (Math.cos(a9) * r9) + 'px,' + (Math.sin(a9) * r9 - 60) + 'px)'; sp.style.opacity = '0'; });
    setTimeout(() => sp.remove(), 1900);
  }
  blip(660); setTimeout(() => blip(880), 200); setTimeout(() => blip(990), 400);
}
let journalTab = 'over';   // 图鉴当前标签页
function openJournal() {
  const list = $('journalList');
  const mq = mainQuest();
  const evHtml = EVENT === 'none' ? '' : `<div class="qBox" style="border:1px dashed rgba(255,215,106,.5)"><div class="qTitle"><span>${EVENTS[EVENT].icon} 今日事件 · ${EVENTS[EVENT].name}</span><span>限今日</span></div><div style="font-size:12.5px;color:#d8ceb0;padding:2px 2px 4px">${EVENTS[EVENT].note}</div></div>`;
  const dqHtml = (DQ && DQ.length) ? `<div class="qBox"><div class="qTitle"><span>🤝 今日居民委托</span><span>${DQ.filter(q => q.s === 2).length}/${DQ.length}</span></div>${DQ.map(q => `<div class="qRow${q.s === 2 ? ' ok' : ''}"><span>${q.s === 2 ? '✅' : '❗'} ${q.n}</span><span class="qn">${q.t === 'food' ? (q.s === 1 ? '🥡 已备货,去交付' : '想吃 ' + ((FOODS.find(f => f[0] === q.f) || [])[1] || '')) : (q.s === 2 ? '已收到' : '想收一张明信片')}</span></div>`).join('')}</div>` : '';
  const wc9 = worldCompletion(); const pct9 = Math.floor(wc9.p * 100);
  if (wc9.p >= 1 && PSTORE.getItem('w1001.wc100') !== '1') {
    PSTORE.setItem('w1001.wc100', '1'); stars++; saveQuest(); updateQuestHUD(); fireworks();
    setTimeout(() => toast('🎇 群岛完成度 100%!终极称号「1001 世界的居民」——这个世界,从此也是你的作品'), 900);
  }
  const wcHtml = `<div class="qBox" style="border:1px solid rgba(255,215,106,.45)"><div class="qTitle"><span>🌏 群岛完成度</span><span>${pct9}%</span></div>
    <div style="height:10px;background:rgba(255,255,255,.08);border-radius:6px;overflow:hidden;margin:4px 0 8px"><div style="height:100%;width:${pct9}%;background:linear-gradient(90deg,#d9a62e,#ffd76a);border-radius:6px"></div></div>
    ${pct9 >= 75 && pct9 < 100 ? '<div style="font-size:12px;color:#d8ceb0;margin-bottom:4px">距离圆满:' + wc9.parts.filter(x9 => x9[1] < x9[2]).map(x9 => x9[0] + ' ' + Math.min(x9[1], x9[2]) + '/' + x9[2]).join(' · ') + '</div>' : ''}
    ${pct9 >= 100 ? '<div style="font-size:12.5px;color:#ffd76a">🎇 圆满。你是「1001 世界的居民」</div>' : ''}</div>`;
  const mHtml = wcHtml + dqHtml + evHtml + `<div class="qBox" style="border:1px solid rgba(120,200,255,.4);background:rgba(60,140,220,.09)"><div class="qTitle"><span>🧭 主线 · 追查海底真相</span><span>${mq.done ? '✅ 通关' : ''}</span></div>
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
    ['🏛️ 未竟之都(五章主线)', PSTORE.getItem('w1001.unjend') ? '✅ ' + ['', '修复之城', '纪念之墟', '旅人花园'][+PSTORE.getItem('w1001.unjend')] : (PSTORE.getItem('w1001.unjlit') === '1' ? '🕊️ 去广场开会' : `⏳ 蓝图 ${[1, 2, 3, 4].filter(i => PSTORE.getItem('w1001.unjb' + i) === '1').length}/4`)],
    ['🔥 幻影运动会(未竟之都)', PSTORE.getItem('w1001.unjgames') === '1' ? '✅ 圣火亮过一夜' : '⏳ 夜里帮守夜人点火炬'],
    ['🗞️ 最后一篇报道(未竟之都)', PSTORE.getItem('w1001.unjnews') === '1' ? '✅ 已发稿' : `⏳ 档案 ${[1, 2, 3].filter(i => PSTORE.getItem('w1001.unjn' + i) === '1').length}/3`],
    ['🗣️ 语言迷宫(未竟之都)', PSTORE.getItem('w1001.unjlang') === '1' ? '✅ 三百灯齐亮' : `⏳ 误译碑 ${[1, 2, 3].filter(i => PSTORE.getItem('w1001.unjw' + i) === '1').length}/3`],
    [`🧭 组合群岛(${COMBO_KEYS.length} 座融合岛)`, (() => { const n = COMBO_KEYS.filter(k => PSTORE.getItem('w1001.nq_' + k) === '1').length; return n >= COMBO_KEYS.length ? '✅ 勘察完毕' : `⏳ ${n}/${COMBO_KEYS.length}`; })()],
    ['🍜 群岛食单(九道地方味)', PSTORE.getItem('w1001.foodie') === '1' ? '✅ 环球食客' : `⏳ ${(PSTORE.getItem('w1001.eaten') || '').split(',').filter(Boolean).length}/9`],
    ['🏠 旅人小屋(主岛东滩)', PSTORE.getItem('w1001.home') === '1' ? '✅ 已置业' : '⏳ 地契 200 ⚡'],
    ['📚 群岛互文考(考据学会)', PSTORE.getItem('w1001.kaodone') === '1' ? '✅ 已付印' : `⏳ 考据 ${[1, 2, 3, 4, 5, 6].filter(i => PSTORE.getItem('w1001.kao' + i) === '1').length}/6`],
    ['🕳️ 星球之脐(深渊海沟)', PSTORE.getItem('w1001.abyss') === '1' ? '✅ 已触及' : '⏳ 戴深潜面罩下竖井'],
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
  const passHtml = (() => {   // 🛂 环球护照页
    const n = stamps.size, total = PASSPORT.length;
    const mile = PSTORE.getItem('w1001.passall') === '1' ? '🌍 环球旅行家' : PSTORE.getItem('w1001.pass30') === '1' ? '下一站:全部盖满' : PSTORE.getItem('w1001.pass10') === '1' ? '下一枚里程碑:30 岛' : '首个里程碑:10 岛';
    return `<div class="qBox"><div class="qTitle"><span>🛂 环球护照</span><span>${n}/${total} · ${mile}</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:4px 6px;font-size:11px;padding:4px 2px;line-height:1.7">
      ${PASSPORT.map(([nm2, ic2]) => { const got = stamps.has(nm2); const shortNm = nm2.split(' · ').pop();
        return `<div style="${got ? '' : 'opacity:.32;filter:grayscale(1)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${nm2}">${ic2} ${shortNm}</div>`; }).join('')}
      </div></div>`;
  })();
  const collHtml = Object.keys(CATS).map(k => {
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
  let cards9 = []; try { cards9 = JSON.parse(PSTORE.getItem('w1001.cards') || '[]'); } catch (e) {}
  const cardsHtml = (cards9.length ? '' : '<div style="color:#93a07f;font-size:13px;padding:12px 4px">集邮册还空着——按 P 进照片模式,再按 C(或点 📸)拍下第一张明信片。</div>')
    + `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">${cards9.map((cd, i9) => `
      <div style="background:#fff;padding:5px 5px 7px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.25)">
        <img src="${cd.d}" style="width:100%;border-radius:3px;display:block">
        <div style="font-size:11px;color:#3a3226;padding:5px 2px 3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(cd.nm)}</div>
        <div style="display:flex;gap:5px">${cd.sent ? '<span style="font-size:10.5px;color:#2c7a4b;padding:3px 2px">✅ 已寄出</span>' : `<button class="gBtn" data-sendc="${i9}" style="padding:3px 9px;font-size:11px">寄出</button>`}
        <a class="gBtn off" style="padding:3px 9px;font-size:11px;text-decoration:none" href="${cd.d}" download="postcard-${i9 + 1}.jpg">下载</a></div>
      </div>`).reverse().join('')}</div>`;
  const J_TABS = [['over', '🧭 总览'], ['log', '📜 日志'], ['pass', '🛂 护照'], ['cards', '💌 集邮册'], ['title', '🎖️ 称号'], ['star', '✨ 星图'], ['coll', '🏛️ 馆藏']];
  const tabBar = `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px;position:sticky;top:0;z-index:2;padding:4px 0;background:inherit">${J_TABS.map(([id2, nm2]) => `<button data-jtab="${id2}" class="gBtn${journalTab === id2 ? '' : ' off'}" style="padding:6px 13px;font-size:12.5px">${nm2}</button>`).join('')}</div>`;
  const J_CONTENT = { over: mHtml + qHtml, log: logHtml, pass: passHtml, cards: cardsHtml, title: titleHtml, star: chartHtml, coll: collHtml };
  list.innerHTML = tabBar + (J_CONTENT[journalTab] || '');
  $('journal').classList.remove('hidden'); modalOpen = true;
  const sc9 = list.querySelector('#starChart'); if (sc9) drawStarChart(sc9);
  list.querySelector('#btnRotate')?.addEventListener('click', rotateExhibits);
  list.querySelectorAll('[data-eqtitle]').forEach(b => b.addEventListener('click', () => equipTitle(b.dataset.eqtitle)));
  list.querySelectorAll('[data-jtab]').forEach(b => b.addEventListener('click', () => { journalTab = b.dataset.jtab; openJournal(); blip(600); }));
  list.querySelectorAll('[data-sendc]').forEach(b => b.addEventListener('click', () => {
    const i9 = +b.dataset.sendc;
    let cs9 = []; try { cs9 = JSON.parse(PSTORE.getItem('w1001.cards') || '[]'); } catch (e) {}
    if (!cs9[i9] || cs9[i9].sent) return;
    cs9[i9].sent = 1; PSTORE.setItem('w1001.cards', JSON.stringify(cs9));
    const who = nearNpc ? nearNpc.name : '海风';
    if (nearNpc) { affAdd(nearNpc.name, 2);
      const dqc = (DQ || []).find(q => q.t === 'card' && q.n === nearNpc.name && q.s < 2);
      if (dqc) { dqc.s = 2; saveDQ(); earnSB(10); setTimeout(() => toast('🤝 委托完成!' + nearNpc.name + ' 把明信片贴在了墙上 · ⚡+10'), 900); }
    }
    toast('💌 已寄出。' + who + ' 回信:「' + PC_REPLIES[(i9 + cs9[i9].nm.length) % PC_REPLIES.length] + '」'); blip(700);
    openJournal();
  }));
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
    <b>3. 出海远行</b>——六十一座岛铺成一颗按真实经纬布局的「文学地球」:名著长成的岛、现实与文学融合的组合群岛(加拉帕戈斯×博物学、威尼斯×卡尔维诺……),还有从未竟之都出发的群岛考据学。每座岛都藏着一条故事线,<b>按 J 打开图鉴看「航海日志」</b>逐一点亮;<b>按 M 看航海图、N 转地球仪——点岛即可直航</b>。<br><br>
    <b>4. 出行九式</b>——步行、游泳、潜水之外:装备行有 <b>🚲 折叠自行车</b>(60⚡,按 R 上下车)与 <b>⛵ 燕鸥号帆船</b>(160⚡,任何海岸都是码头);十九座设有机场的岛之间可乘 <b>✈️ 鲸航</b> 付费飞行(全按现实设台:复活节岛马塔维里、圣托里尼、帕果帕果……中土和霍格沃茨依旧婉拒跑道;楚门的机场是布景,航班永远取消);机场可达的岛不再停靠渡口;主岛另有大鹏环游与开往霍格沃茨的列车;青丘的百年轨车到站按 E 可搭一程。每踏上一座新岛,<b>🛂 环球护照</b>自动盖章——盖满全部岛屿,便是「环球旅行家」。<br><br>
    <b>5. 安顿下来(衣食住)</b>——集市街的 <b>👘 千帆裁缝铺</b>置办披风与帽子(买过随时免费换穿);九座岛各有一个 <b>🍜 小吃摊</b>,地方味自带增益(左上角出徽章倒计时),吃遍九道得称号「环球食客」;攒够 200⚡ 到<b>主岛东滩</b>买下那块挂牌空地,🏠 小屋即时落成——门牌、明信片墙、小憩床,⋯菜单一键回家,住下后还能扩阁楼、修花园。<br><br>
    <b>6. 和居民混熟</b>——全岛 209 位居民人人可聊(交谈 +1 ❤,寄明信片 +2);混熟了有私房话,交情够深会收到小礼物。夜里大多数人睡了,守夜人和灯塔管理员例外。每天还有两位居民发出 🤝 <b>委托</b>(带一份吃食/寄一张明信片,+10⚡)——按 J 在总览页查看。<br><br>
    <b>7. 抬头与起飞</b>——夜里按 <b>K</b> 观星,认全 88 星座;主岛栖石上有一只大鹏,按 <b>E</b> 乘它扶摇直上环游诸岛,或直上<b>天空之城勒皮他</b>——云端有云端的配乐。<br><br>
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
    else if (WEATHER === 'storm') toast('⛈️ 今日风暴!半数航班延误,帆船颠簸,蜃楼隐没——适合窝在酒馆听故事');
    else if (WEATHER === 'fog') toast('🌫️ 今日大雾,能见度低,塞壬海域尤请谨慎');
    if (EVENT !== 'none') setTimeout(() => toast(EVENTS[EVENT].icon + ' 今日事件:' + EVENTS[EVENT].name + '——' + EVENTS[EVENT].note), 4200);
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
    if (RAINY) {
      const src4 = actx.createBufferSource(); src4.buffer = buf; src4.loop = true;
      const hp3 = actx.createBiquadFilter(); hp3.type = 'highpass'; hp3.frequency.value = WEATHER === 'storm' ? 900 : 1400;
      const rg = actx.createGain(); rg.gain.value = WEATHER === 'storm' ? .055 : .028;
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
/* 🌫️ 高度雾:全局改雾着色器——低处浓、高处清(山顶与天空之城在雾线之上)。
   用 position 而非 transformed:所有内置着色器(网格/点/水面)都有该属性,不炸自定义 shader。 */
THREE.ShaderChunk.fog_pars_vertex = THREE.ShaderChunk.fog_pars_vertex.replace(
  'varying float vFogDepth;', 'varying float vFogDepth;\n\tvarying float vFogY9;');
THREE.ShaderChunk.fog_vertex = THREE.ShaderChunk.fog_vertex.replace(
  'vFogDepth = - mvPosition.z;', 'vFogDepth = - mvPosition.z;\n\tvFogY9 = ( modelMatrix * vec4( position, 1.0 ) ).y;');
THREE.ShaderChunk.fog_pars_fragment = THREE.ShaderChunk.fog_pars_fragment.replace(
  'varying float vFogDepth;', 'varying float vFogDepth;\n\tvarying float vFogY9;');
THREE.ShaderChunk.fog_fragment = THREE.ShaderChunk.fog_fragment.replace(
  'float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );',
  'float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );\n\tfogFactor = clamp( fogFactor * ( 0.42 + 0.78 * exp( - max( vFogY9, 0.0 ) * 0.016 ) ), 0.0, 1.0 );');
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .68;
if (!MOBILE) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd4ee);
scene.fog = new THREE.Fog(0x9fd4ee, 320, 1850);
const camera = new THREE.PerspectiveCamera(58, 1, .1, 2400);
let composer = null, bokehPass = null, gtaoPass = null, gradePass9 = null, quality = 2;   // 画质:2 高(GTAO)/1 中/0 低(无后期)
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
    /* 🐛 GTAO 的深度/法线预渲染把 Sprite/粒子当实心方块 → AO 把云乘成黑砖。
       修法:AO 阶段临时隐藏 Sprite/Points/透明不写深度的网格(它们本不该参与遮蔽),美术合成不受影响。 */
    const gtaoR9 = gtaoPass.render.bind(gtaoPass);
    gtaoPass.render = function (...a9) {
      const hid9 = [];
      scene.traverse(o => { if (o.visible && (o.isSprite || o.isPoints || (o.isMesh && o.material && o.material.transparent && !o.material.depthWrite))) { o.visible = false; hid9.push(o); } });
      gtaoR9(...a9);
      for (const o of hid9) o.visible = true;
    };
    composer.addPass(gtaoPass);
  } catch (e) {}
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .25, .55, .85));
  try { bokehPass = new BokehPass(scene, camera, { focus: 18, aperture: .0006, maxblur: .008 }); bokehPass.enabled = false; composer.addPass(bokehPass); } catch (e) {}   // 景深:仅照片模式
  gradePass9 = new ShaderPass({   // 🎨 时段色彩分级 + 暗角(黄昏橙金/夜蓝调/白日微暖)
    uniforms: { tDiffuse: { value: null }, uTint: { value: new THREE.Color(1, 1, 1) }, uSat: { value: 1.04 }, uVig: { value: .26 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }',
    fragmentShader: [
      'varying vec2 vUv; uniform sampler2D tDiffuse; uniform vec3 uTint; uniform float uSat; uniform float uVig;',
      'void main(){',
      '  vec4 c = texture2D( tDiffuse, vUv );',
      '  c.rgb *= uTint;',
      '  float l = dot( c.rgb, vec3( .2126, .7152, .0722 ) );',
      '  c.rgb = mix( vec3( l ), c.rgb, uSat );',
      '  float d = distance( vUv, vec2( .5 ) );',
      '  c.rgb *= 1.0 - uVig * smoothstep( .38, .74, d );',
      '  gl_FragColor = c;',
      '}',
    ].join('\n'),
  });
  composer.addPass(gradePass9);
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
  sc.left = -260; sc.right = 260; sc.top = 260; sc.bottom = -260; sc.near = 10; sc.far = 900;   // 阴影覆盖扩展(中景建筑也落影)
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
/* 🌇 IBL:把物理天空烘成环境贴图喂给全部 Standard 材质(天光漫射+反射,昼夜随烘随变) */
let pmrem9 = null, envRT9 = null, envScene9 = null, lastEnvDA9 = -9;
function bakeEnv9() {
  if (MOBILE) return;
  if (!pmrem9) pmrem9 = new THREE.PMREMGenerator(renderer);
  if (!envScene9) envScene9 = new THREE.Scene();
  const old9 = envRT9;
  envScene9.add(sky);                      // 借走天空烘一帧
  envRT9 = pmrem9.fromScene(envScene9);
  scene.add(sky);                          // 归还
  scene.environment = envRT9.texture;
  if (old9) old9.dispose();
}
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
  const hx = (location.hash.match(/weather=(\w+)/) || [])[1];   // #weather=storm 调试
  if (['clear', 'rain', 'fog', 'storm'].includes(hx)) return hx;
  const r0 = mulberry32([...new Date().toISOString().slice(0, 10)].reduce((a, c2) => (a * 37 + c2.charCodeAt(0)) | 0, 3))();
  return r0 < .55 ? 'clear' : (r0 < .78 ? 'rain' : (r0 < .9 ? 'fog' : 'storm'));
})();
const RAINY = WEATHER === 'rain' || WEATHER === 'storm';
/* ===== 🎪 今日世界事件(与天气同为"每日一签") ===== */
const EVENTS = {
  none:   { icon: '', name: '', note: '' },
  fair:   { icon: '🎪', name: '集市日', note: '千岛装备行全场九折!' },
  meteor: { icon: '🌠', name: '流星雨夜', note: '入夜后流星频落——按 K 开观星模式,找个暗处躺好' },
  whales: { icon: '🐋', name: '鲸群洄游', note: '一支鲸群正路过主岛外海,海上留意喷泉水柱' },
  kites:  { icon: '🎏', name: '风筝日', note: '孩子们把风筝放上了主岛的天空' },
};
const EVENT = (() => {
  const hx = (location.hash.match(/event=(\w+)/) || [])[1];
  if (EVENTS[hx]) return hx;
  const r0 = mulberry32([...new Date().toISOString().slice(0, 10)].reduce((a, c2) => (a * 41 + c2.charCodeAt(0)) | 0, 7))();
  return r0 < .4 ? 'none' : r0 < .55 ? 'fair' : r0 < .7 ? 'meteor' : r0 < .85 ? 'whales' : 'kites';
})();
const gearPrice = g9 => EVENT === 'fair' ? Math.max(1, Math.round(g9.price * .9)) : g9.price;
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
const CLOUDU9 = { t: { value: 0 }, a: { value: .13 } };   // 🌥️ 云影 uniforms(时间/强度)
let rainPts = null;
if (RAINY) {
  const N4 = WEATHER === 'storm' ? 900 : 480, arr2 = new Float32Array(N4 * 3);
  const rr2 = mulberry32(44);
  for (let i = 0; i < N4; i++) {
    arr2[i * 3] = (rr2() - .5) * 110;
    arr2[i * 3 + 1] = rr2() * 60;
    arr2[i * 3 + 2] = (rr2() - .5) * 110;
  }
  const g4 = new THREE.BufferGeometry();
  g4.setAttribute('position', new THREE.BufferAttribute(arr2, 3));
  const SNOWY9 = (new Date().getMonth() + 1) % 12 < 3;   // 12/1/2 月:雨落成雪
  rainPts = new THREE.Points(g4, new THREE.PointsMaterial({
    color: SNOWY9 ? 0xf4f8fc : 0x9ab8d8,
    size: SNOWY9 ? 2.2 : (WEATHER === 'storm' ? 1.9 : 1.5),
    transparent: true,
    opacity: SNOWY9 ? .9 : (WEATHER === 'storm' ? .75 : .55),
    sizeAttenuation: false }));
  rainPts.userData.fall = SNOWY9 ? 14 : 55;
  rainPts.userData.snow = SNOWY9;
  scene.add(rainPts);
} else {   // 🌸🍂 晴日季节粒子:春飘花瓣,秋落黄叶(复用雨粒子更新循环)
  const M9 = new Date().getMonth() + 1, SEA9 = M9 >= 3 && M9 <= 5 ? 'spring' : (M9 >= 9 && M9 <= 11 ? 'autumn' : null);
  if (SEA9) {
    const N4 = 240, arr2 = new Float32Array(N4 * 3), rr2 = mulberry32(45);
    for (let i = 0; i < N4; i++) { arr2[i * 3] = (rr2() - .5) * 110; arr2[i * 3 + 1] = rr2() * 60; arr2[i * 3 + 2] = (rr2() - .5) * 110; }
    const g4 = new THREE.BufferGeometry(); g4.setAttribute('position', new THREE.BufferAttribute(arr2, 3));
    rainPts = new THREE.Points(g4, new THREE.PointsMaterial({
      color: SEA9 === 'spring' ? 0xf2b8c6 : 0xc8903a, size: 2, transparent: true, opacity: .72, sizeAttenuation: false }));
    rainPts.userData.fall = SEA9 === 'spring' ? 3.2 : 4.6;
    rainPts.userData.snow = true;   // 借雪花的横飘
    scene.add(rainPts);
  }
}
/* 🌊 岸线泡沫(声明;扫描在全部岛屿建成后进行——height 需含 NI 群岛) */
let foamPts = null;
/* 🌈 彩虹(雨天白日,远海一道七色弧) */
let rainbow9 = null;
if (WEATHER === 'rain') {
  rainbow9 = new THREE.Group();
  [0xff4a4a, 0xff9a3a, 0xf2d24a, 0x5ac25a, 0x4a9ae6, 0x5a5ae6, 0x9a5ae6].forEach((c9, i9) => {
    rainbow9.add(new THREE.Mesh(new THREE.TorusGeometry(300 - i9 * 4.5, 2.1, 5, 56, Math.PI),
      new THREE.MeshBasicMaterial({ color: c9, transparent: true, opacity: .15, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
  });
  rainbow9.position.set(-520, -128, -880); rainbow9.visible = false;
  scene.add(rainbow9);
}
/* 🌌 极光(冬季夜空,北天三幅绿幕缓摆) */
let aurora9 = null;
if ((new Date().getMonth() + 1) % 12 < 3) {
  aurora9 = new THREE.Group();
  const cvA9 = document.createElement('canvas'); cvA9.width = 64; cvA9.height = 256;
  const cA9 = cvA9.getContext('2d'), grA9 = cA9.createLinearGradient(0, 256, 0, 0);
  grA9.addColorStop(0, 'rgba(96,255,176,.9)'); grA9.addColorStop(.45, 'rgba(80,220,200,.4)'); grA9.addColorStop(1, 'rgba(120,140,255,0)');
  cA9.fillStyle = grA9; cA9.fillRect(0, 0, 64, 256);
  const texA9 = new THREE.CanvasTexture(cvA9);
  for (let i = 0; i < 3; i++) {
    const mA9 = new THREE.MeshBasicMaterial({ map: texA9, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
    const pl9 = new THREE.Mesh(new THREE.PlaneGeometry(620 + i * 140, 240, 24, 1), mA9);
    pl9.position.set(-500 + i * 520, 330 + i * 24, -1550 - i * 60);
    pl9.rotation.z = (i - 1) * .1;
    aurora9.add(pl9);
  }
  scene.add(aurora9);
}
let ambT9 = 6;   // 🔊 环境声调度
function chirp9() {   // 鸟鸣:2-3 声上滑短哨
  try {
    const n9 = 2 + (Math.random() * 2 | 0), t0 = actx.currentTime;
    for (let i = 0; i < n9; i++) {
      const o9 = actx.createOscillator(), g9 = actx.createGain(), f0 = 2200 + Math.random() * 1400;
      o9.type = 'sine';
      o9.frequency.setValueAtTime(f0, t0 + i * .22);
      o9.frequency.exponentialRampToValueAtTime(f0 * 1.5, t0 + i * .22 + .09);
      g9.gain.setValueAtTime(.0001, t0 + i * .22);
      g9.gain.exponentialRampToValueAtTime(.028, t0 + i * .22 + .02);
      g9.gain.exponentialRampToValueAtTime(.001, t0 + i * .22 + .13);
      o9.connect(g9).connect(actx.destination); o9.start(t0 + i * .22); o9.stop(t0 + i * .22 + .16);
    }
  } catch (e) {}
}
function cricket9() {   // 虫鸣:高频脉冲串
  try {
    const t0 = actx.currentTime, n9 = 4 + (Math.random() * 3 | 0);
    for (let i = 0; i < n9; i++) {
      const o9 = actx.createOscillator(), g9 = actx.createGain();
      o9.type = 'square'; o9.frequency.value = 3600 + Math.random() * 500;
      g9.gain.setValueAtTime(.0001, t0 + i * .07);
      g9.gain.exponentialRampToValueAtTime(.009, t0 + i * .07 + .012);
      g9.gain.exponentialRampToValueAtTime(.0005, t0 + i * .07 + .05);
      o9.connect(g9).connect(actx.destination); o9.start(t0 + i * .07); o9.stop(t0 + i * .07 + .06);
    }
  } catch (e) {}
}
let boltT9 = 9, boltV9 = 0;   // ⛈️ 闪电计时/亮度
function thunder9() {
  try { if (!actx) return;
    for (const [f0, d0, g0] of [[52, 1.6, .14], [38, 2.6, .11]]) {
      const o9 = actx.createOscillator(), gn9 = actx.createGain();
      o9.type = 'triangle'; o9.frequency.value = f0;
      gn9.gain.setValueAtTime(.0001, actx.currentTime + .06);
      gn9.gain.exponentialRampToValueAtTime(g0, actx.currentTime + .2);
      gn9.gain.exponentialRampToValueAtTime(.001, actx.currentTime + d0);
      o9.connect(gn9).connect(actx.destination); o9.start(actx.currentTime + .06); o9.stop(actx.currentTime + d0 + .1);
    }
  } catch (e) {}
}
if (WEATHER === 'fog') { scene.fog.near = 110; scene.fog.far = 520; }
if (WEATHER === 'storm') { scene.fog.near = 100; scene.fog.far = 680; }
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
  const wxMul = WEATHER === 'storm' ? .38 : WEATHER === 'rain' ? .55 : (WEATHER === 'fog' ? .75 : 1);
  sun.intensity = (.06 + 2.7 * da) * wxMul;
  hemi.intensity = (.16 + .62 * da) * (WEATHER === 'clear' ? 1 : .85);
  if (WEATHER === 'rain') skyCol.lerp(new THREE.Color(0x6a7480), .4);
  if (WEATHER === 'storm') skyCol.lerp(new THREE.Color(0x424a56), .62);
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
  if (!MOBILE && Math.abs(da - lastEnvDA9) > .14) { lastEnvDA9 = da; bakeEnv9(); }   // 🌇 环境贴图随昼夜重烘
  if (fireLight) fireLight.intensity = (1 - da) * 55 + Math.sin(t * 9) * 5 * (1 - da);
  if (lantern) lantern.intensity = (1 - da) * 16;   // 夜间提灯
  if (lightLamp) lightLamp.intensity = (1 - da) * 90;   // 灯塔
  for (const L2 of nightLamps) L2.intensity = (1 - da) * L2.userData.pow;   // 各岛夜灯
  if (gradePass9) {   // 🎨 分级随时段:黄昏推橙金降蓝,夜里降饱和加暗角
    gradePass9.uniforms.uTint.value.setRGB(1 + dusk * .10 + da * .02, 1 + dusk * .02, 1 - dusk * .08 + (1 - da) * .06);
    gradePass9.uniforms.uSat.value = 1.04 + dusk * .08 - (1 - da) * .12;
    gradePass9.uniforms.uVig.value = .26 + (1 - da) * .10;
  }
  const wOp9 = clamp((1 - da) * 1.2, 0, 1) * .92;   // 🪟 夜窗灯
  for (const m9 of WINMATS9) { m9.opacity = wOp9; m9.visible = wOp9 > .03; }
  if (rainbow9) rainbow9.visible = da > .55;   // 🌈 雨天白日见虹
  if (aurora9) aurora9.children.forEach((p9, i9) => { p9.material.opacity = (1 - da) * (.2 + Math.sin(t * .13 + i9 * 2.1) * .08); p9.rotation.z = (i9 - 1) * .1 + Math.sin(t * .05 + i9) * .04; });   // 🌌 冬夜极光缓摆
  CLOUDU9.a.value = (WEATHER === 'clear' ? 1 : .35) * da * .15;   // 🌥️ 云影日间才显
  if (beacon) { beacon.material.opacity = (1 - da) * .32; beacon.rotation.y = t * .9; }
  return da;
}

/* --- 地形网格(地表 3.0:8×8 分块视锥剔除 + 全局高度场缓存 + 解析法线无缝) --- */
const TER = 4000, SEG = MOBILE ? 240 : 400, TCH = 8, TSEG = SEG / TCH;
let HTG = null;   // 全局高度场晶格(建面时填充,供 heightMesh/植被 O(1) 采样)
const TCHUNKS = [];   // 地形块 LOD 档案(CDLOD 思想:远块换低细分索引,裙边防裂缝)
/* 视觉着地高度:直接查高度场晶格(原为每次 4 次 height() 解析计算) */
function heightMesh(x, z) {
  const st = TER / SEG, hx = (x + TER / 2) / st, hz = (z + TER / 2) / st;
  const ix = Math.floor(hx), iz = Math.floor(hz), fx = hx - ix, fz = hz - iz;
  if (!HTG || ix < 0 || iz < 0 || ix >= SEG || iz >= SEG) {
    const x0 = ix * st - TER / 2, z0 = iz * st - TER / 2;
    const h00 = height(x0, z0), h10 = height(x0 + st, z0), h01 = height(x0, z0 + st), h11 = height(x0 + st, z0 + st);
    return h00 * (1 - fx) * (1 - fz) + h10 * fx * (1 - fz) + h01 * (1 - fx) * fz + h11 * fx * fz;
  }
  const W9 = SEG + 1, b9 = iz * W9 + ix;
  const h00 = HTG[b9], h10 = HTG[b9 + 1], h01 = HTG[b9 + W9], h11 = HTG[b9 + W9 + 1];
  return h00 * (1 - fx) * (1 - fz) + h10 * fx * (1 - fz) + h01 * (1 - fx) * fz + h11 * fx * fz;
}
{
  const ST9 = TER / SEG, W = SEG + 1, VN9 = W * W;
  const colors = [];
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
  const SEASON9 = (m9 => m9 >= 3 && m9 <= 5 ? 'spring' : m9 >= 6 && m9 <= 8 ? 'summer' : m9 >= 9 && m9 <= 11 ? 'autumn' : 'winter')(new Date().getMonth() + 1);
  if (SEASON9 === 'autumn') { cGrass1.offsetHSL(-.08, .04, -.01); cGrass2.offsetHSL(-.08, .04, -.01); cGrassDry.offsetHSL(-.05, .05, 0); }   // 秋:草色转琥珀
  const cWet9 = new THREE.Color(0xbfa478), cFoam9 = new THREE.Color(0xf2efe6), cDeep9 = new THREE.Color(0x2e5f6e), cBloom9 = new THREE.Color(0xf2b8c6);
  // 第一遍:每晶格点只算一次 height(),存全局高度场;坡度/曲率从邻居取
  const HT = new Float32Array(VN9);
  for (let i = 0; i < VN9; i++) HT[i] = height((i % W) * ST9 - TER / 2, ((i / W) | 0) * ST9 - TER / 2);
  HTG = HT;
  for (let i = 0; i < VN9; i++) {
    const x = (i % W) * ST9 - TER / 2, z = ((i / W) | 0) * ST9 - TER / 2, h = HT[i];
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
    } else if (Math.hypot(x - UNJ.x, z - UNJ.z) < 112 && h > 1) {   // 未竟之都:白石铺地
      c = fbm(x * .12, z * .12) > .5 ? new THREE.Color(0xd8d4c8) : new THREE.Color(0xc9c4b6);
    } else if (h < -2) {
      c = cSea.clone().lerp(cDeep9, smooth01(clamp((-h - 2) / 15, 0, 1)));   // 浅滩→深海渐变
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
      // 岸线水感:湿沙带 + 浪沫白线
      if (h < 1.6) c.lerp(cWet9, (1 - clamp(h / 1.6, 0, 1)) * .55);
      const fj9 = Math.abs(h - .22 + (gj - .5) * .3);
      if (fj9 < .16) c.lerp(cFoam9, (1 - fj9 / .16) * (.35 + gj * .45));
      // 泥土小路
      const pd = pathDist(x, z);
      if (pd < 4.2) c = cPath.clone();
      else if (pd < 7.5) c.lerp(cPath, (7.5 - pd) / 3.3 * .5);
      // 鲸嘴线 / 眼圈
      if (h > -1 && mouthDist(x, z) < 5) c.lerp(cMouth, .8);
      else if (h > 0 && Math.abs(Math.hypot(x - WHALE_EYE.x, z - WHALE_EYE.z) - WHALE_EYE.r) < 5) c.lerp(cMouth, .8);
      // 🍂 地表换季:冬雪线 33→13 全岛披白;春撒樱色噪点
      if (SEASON9 === 'winter') { c.lerp(cSnow, smooth01(clamp((h - 13 + jit * 2) / 7, 0, 1)) * .9); if (h > 1.2) c.offsetHSL(0, -.14, .03); }
      else if (SEASON9 === 'spring' && h > 1.5 && h < 20 && fbm(x * .13 + 7, z * .13) > .8) c.lerp(cBloom9, .45);
      // 🛤️ 每岛小径:码头 → 岛心(走空间索引,近岛才算)
      if (h > .6) for (const s9 of nislesNear(x, z)) {
        const abx9 = s9.x - s9.dock[0], abz9 = s9.z - s9.dock[1];
        const t9 = clamp(((x - s9.dock[0]) * abx9 + (z - s9.dock[1]) * abz9) / (abx9 * abx9 + abz9 * abz9), 0, 1);
        const pdx9 = x - (s9.dock[0] + abx9 * t9), pdz9 = z - (s9.dock[1] + abz9 * t9);
        const pd9 = pdx9 * pdx9 + pdz9 * pdz9;
        if (pd9 < 5.76) { c.lerp(cPath, .8); break; }
        else if (pd9 < 25) { c.lerp(cPath, (5 - Math.sqrt(pd9)) / 2.6 * .45); break; }
      }
    }
    colors.push(c.r, c.g, c.b);
  }
  // 解析法线:全局中央差分(分块边界零接缝,免 computeVertexNormals)
  const NRM = new Float32Array(VN9 * 3);
  for (let i = 0; i < VN9; i++) {
    const gx9 = i % W, gz9 = (i / W) | 0;
    const hL = HT[gz9 * W + Math.max(gx9 - 1, 0)], hR = HT[gz9 * W + Math.min(gx9 + 1, W - 1)];
    const hB = HT[Math.max(gz9 - 1, 0) * W + gx9], hF = HT[Math.min(gz9 + 1, W - 1) * W + gx9];
    const nx9 = hL - hR, ny9 = 2 * ST9, nz9 = hB - hF, nl9 = Math.hypot(nx9, ny9, nz9);
    NRM[i * 3] = nx9 / nl9; NRM[i * 3 + 1] = ny9 / nl9; NRM[i * 3 + 2] = nz9 / nl9;
  }
  const terrainMat = MOBILE
    ? new THREE.MeshLambertMaterial({ vertexColors: true })
    : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: RAINY ? .58 : .96, metalness: 0 });   // 🌧️ 雨天湿地面微反光
  if (!MOBILE) terrainMat.onBeforeCompile = sh9 => {   // 🌥️ 云影:两层滚动噪声乘在地表(世界在呼吸)
    sh9.uniforms.uCldT9 = CLOUDU9.t; sh9.uniforms.uCldA9 = CLOUDU9.a;
    sh9.vertexShader = sh9.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vWXZ9;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWXZ9 = ( modelMatrix * vec4( position, 1.0 ) ).xz;');
    sh9.fragmentShader = sh9.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vWXZ9;\nuniform float uCldT9;\nuniform float uCldA9;')
      .replace('#include <dithering_fragment>',
        'float cs9 = sin( vWXZ9.x * .008 + uCldT9 * .021 + sin( vWXZ9.y * .011 + uCldT9 * .016 ) * 1.7 ) * sin( vWXZ9.y * .007 - uCldT9 * .014 + sin( vWXZ9.x * .009 ) * 1.3 );\n' +
        'gl_FragColor.rgb *= 1.0 - smoothstep( .25, .9, cs9 ) * uCldA9;\n#include <dithering_fragment>');
  };
  const w2 = TSEG + 1, GRIDN = w2 * w2;
  for (let chz = 0; chz < TCH; chz++) for (let chx = 0; chx < TCH; chx++) {   // 8×8 分块 + 三档 LOD(1/2/5 细分步长)
    // 顶点 = 网格 w2×w2 + 周边裙边(下压 3m,防 LOD 接缝裂缝)
    const perim = [];
    for (let vx = 0; vx <= TSEG; vx++) perim.push(0 * w2 + vx, TSEG * w2 + vx);
    for (let vz = 1; vz < TSEG; vz++) perim.push(vz * w2, vz * w2 + TSEG);
    const skirtOf = new Int32Array(GRIDN).fill(-1);
    perim.forEach((gi9, k9) => { skirtOf[gi9] = GRIDN + k9; });
    const TOT9 = GRIDN + perim.length;
    const cpos = new Float32Array(TOT9 * 3), ccol = new Float32Array(TOT9 * 3), cnrm = new Float32Array(TOT9 * 3);
    for (let vz = 0; vz <= TSEG; vz++) for (let vx = 0; vx <= TSEG; vx++) {
      const gi = (chz * TSEG + vz) * W + (chx * TSEG + vx), li = vz * w2 + vx;
      cpos[li * 3] = (gi % W) * ST9 - TER / 2; cpos[li * 3 + 1] = HT[gi]; cpos[li * 3 + 2] = ((gi / W) | 0) * ST9 - TER / 2;
      ccol[li * 3] = colors[gi * 3]; ccol[li * 3 + 1] = colors[gi * 3 + 1]; ccol[li * 3 + 2] = colors[gi * 3 + 2];
      cnrm[li * 3] = NRM[gi * 3]; cnrm[li * 3 + 1] = NRM[gi * 3 + 1]; cnrm[li * 3 + 2] = NRM[gi * 3 + 2];
    }
    perim.forEach((gi9, k9) => {   // 裙边顶点:同位下压
      const s3 = (GRIDN + k9) * 3, t3 = gi9 * 3;
      cpos[s3] = cpos[t3]; cpos[s3 + 1] = cpos[t3 + 1] - 3; cpos[s3 + 2] = cpos[t3 + 2];
      ccol[s3] = ccol[t3]; ccol[s3 + 1] = ccol[t3 + 1]; ccol[s3 + 2] = ccol[t3 + 2];
      cnrm[s3] = 0; cnrm[s3 + 1] = 1; cnrm[s3 + 2] = 0;
    });
    const posA = new THREE.BufferAttribute(cpos, 3), colA = new THREE.BufferAttribute(ccol, 3), nrmA = new THREE.BufferAttribute(cnrm, 3);
    const mkLOD = s9 => {
      const idx = [];
      for (let vz = 0; vz < TSEG; vz += s9) for (let vx = 0; vx < TSEG; vx += s9) {
        const a9 = vz * w2 + vx, b9 = a9 + s9, c9 = a9 + s9 * w2, d9 = c9 + s9;
        idx.push(a9, c9, b9, b9, c9, d9);
      }
      const edge9 = (ga, gb) => { const sa = skirtOf[ga], sb = skirtOf[gb]; idx.push(ga, sa, gb, gb, sa, sb, gb, sa, ga, sb, sa, gb); };   // 双面裙边
      for (let vx = 0; vx < TSEG; vx += s9) { edge9(vx, vx + s9); edge9(TSEG * w2 + vx, TSEG * w2 + vx + s9); }
      for (let vz = 0; vz < TSEG; vz += s9) { edge9(vz * w2, (vz + s9) * w2); edge9(vz * w2 + TSEG, (vz + s9) * w2 + TSEG); }
      const gg9 = new THREE.BufferGeometry();
      gg9.setAttribute('position', posA); gg9.setAttribute('color', colA); gg9.setAttribute('normal', nrmA);
      gg9.setIndex(idx); gg9.computeBoundingSphere();
      return gg9;
    };
    const lods = [mkLOD(1), mkLOD(2), mkLOD(5)];
    const mch = new THREE.Mesh(lods[0], terrainMat);
    mch.receiveShadow = true; mch.castShadow = !MOBILE;
    mch.userData.ter9 = true; mch.userData.lods = lods; mch.userData.lod = 0;
    mch.userData.ccx = (chx + .5) * TSEG * ST9 - TER / 2; mch.userData.ccz = (chz + .5) * TSEG * ST9 - TER / 2;
    scene.add(mch); TCHUNKS.push(mch);
  }
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
  for (let i = 0; i < 7; i++) blob(28 + i * 24, 84, 32, .78);        // 底部一排(平底)
  for (let i = 0; i < 5; i++) blob(42 + i * 29, 64, 40, .74);        // 中层
  blob(66, 50, 30, .66); blob(108, 44, 37, .72); blob(150, 52, 28, .66);   // 顶部鼓包
  const cloudTex = new THREE.CanvasTexture(cc);
  const NC = MOBILE ? 18 : 30;
  for (let i = 0; i < NC; i++) {
    const grp = new THREE.Group();
    const tp = rnd();   // 云型:<.5 积云(少而大) / <.82 层云(扁平铺展) / 其余 卷云(高·稀薄)
    let puffs, size, spX, spY, spZ, alt, op, flat;
    if (tp < .5) { puffs = 5 + (rnd() * 3 | 0); size = 88 + rnd() * 46; spX = size * 1.05; spY = size * .24; spZ = size * .8; alt = 265 + rnd() * 100; op = .92; flat = .62; }
    else if (tp < .82) { puffs = 6 + (rnd() * 3 | 0); size = 110 + rnd() * 40; spX = size * 1.8; spY = size * .12; spZ = size * 1.2; alt = 235 + rnd() * 60; op = .82; flat = .42; }
    else { puffs = 4 + (rnd() * 3 | 0); size = 62 + rnd() * 26; spX = size * 2.8; spY = size * .16; spZ = size * .5; alt = 390 + rnd() * 90; op = .5; flat = .42; }
    for (let j = 0; j < puffs; j++) {
      const py = (rnd() - .5) * spY, shade = py < 0 ? .8 : 1;   // 底部略压暗 → 体积感
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: op, depthWrite: false, fog: false, color: new THREE.Color(shade, shade, shade) }));
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
  const item = (cat === 'lore' || cat === 'gate' || cat === 'dive' || cat === 'air' || cat === 'fund' || cat === 'food' || cat === 'tailor' || cat === 'home' || ['bar', 'sign', 'news', 'shop', 'ferry', 'door', 'camera', 'lamp', 'ring', 'crater', 'hole', 'eye', 'train', 'castle', 'hoops', 'hut', 'inn', 'chowder', 'doubloon', 'stadium', 'pitch', 'scalper'].includes(type)) ? null : pickers[cat]();
  const s = Object.assign({ x, z, y: height(x, z), r: 6.5, cat, type, item }, extra || {});
  spots.push(s); return s;
}
/* PBR:桌面用 Standard(粗糙度/金属度),手机用便宜的 Lambert */
const LAMC = new Map();   // 材质按色缓存:同色共享一份(状态切换/内存大降;严禁对 lam 材质做逐对象改动)
const lam = c => {
  let m9 = LAMC.get(c);
  if (!m9) { m9 = MOBILE ? new THREE.MeshLambertMaterial({ color: c }) : new THREE.MeshStandardMaterial({ color: c, roughness: .88, metalness: 0, envMapIntensity: .25 }); LAMC.set(c, m9); }
  return m9;
};
const lamOwn = c => MOBILE ? new THREE.MeshLambertMaterial({ color: c }) : new THREE.MeshStandardMaterial({ color: c, roughness: .88, metalness: 0, envMapIntensity: .25 });   // 独享材质:会被 updateVisual 改色的网格专用
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
/* 🪟 夜窗灯:暖黄自发光窗片,夜里亮、白天灭(材质集中登记,昼夜统一调) */
const WINMATS9 = [];
const winMat9 = () => {
  const m9 = new THREE.MeshBasicMaterial({ color: 0xffc46a, transparent: true, opacity: 0, side: THREE.DoubleSide });
  m9.visible = false; WINMATS9.push(m9); return m9;
};
const GEOC = new Map();   // 同尺寸几何体共享(禁止对 box/cyl 的 geometry 做原地变换)
const geoc = (k, mk) => { let g = GEOC.get(k); if (!g) { g = mk(); GEOC.set(k, g); } return g; };
const box = (w, h, d, mat) => new THREE.Mesh(geoc('b' + w + ',' + h + ',' + d, () => new THREE.BoxGeometry(w, h, d)), mat);
const cyl = (rT, rB, h, mat, seg = 10) => new THREE.Mesh(geoc('c' + rT + ',' + rB + ',' + h + ',' + seg, () => new THREE.CylinderGeometry(rT, rB, h, seg)), mat);
const sphg = (...a) => geoc('s' + a.join(','), () => new THREE.SphereGeometry(...a));
const cong = (...a) => geoc('k' + a.join(','), () => new THREE.ConeGeometry(...a));

/* ===== 🏗️ 统一建筑系统:makeBldg(spec) —— 墙/顶/门/窗/台阶/烟囱/碰撞一次装配 =====
   spec: { x, z, w, d, floors, style, roof?, door?('S'|'N'|'E'|'W'), chimney?, wall?/trim?/roofC? 覆盖 }
   全部走 lam()+geoc() → 自动进静态合并;窗光进全球队列(建后并成 1 网格);烟囱注册炊烟。 */
const BSTYLES = {
  whaler:   { wall: 0xd8d2c2, trim: 0x5a6a7a, roofC: 0x5a4636, roof: 'gable' },
  jiangnan: { wall: 0xf0ead8, trim: 0x6a6a6e, roofC: 0x34343c, roof: 'pagoda' },
  venetian: { wall: 0xc8907a, trim: 0xf0e8da, roofC: 0x8a5a4a, roof: 'flat' },
  desert:   { wall: 0xe2cb96, trim: 0xb89868, roofC: 0xd0b888, roof: 'flat' },
  stone:    { wall: 0xa8a296, trim: 0x7a746a, roofC: 0x6a665e, roof: 'cone' },
  nordic:   { wall: 0xa04a38, trim: 0xe8e0d0, roofC: 0x3a4a38, roof: 'gable' },
};
const WQUEUE9 = [], CHIM9 = [];
const gableGeo9 = (w9, d9, rh9) => geoc('gbl' + w9 + ',' + d9 + ',' + rh9, () => {
  const s9 = new THREE.Shape();
  s9.moveTo(-d9 / 2, 0); s9.lineTo(d9 / 2, 0); s9.lineTo(0, rh9); s9.closePath();
  const gg9 = new THREE.ExtrudeGeometry(s9, { depth: w9, bevelEnabled: false });
  gg9.rotateY(Math.PI / 2); gg9.translate(-w9 / 2, 0, 0);
  return gg9;
});
function makeBldg(spec) {
  const st9 = Object.assign({}, BSTYLES[spec.style] || BSTYLES.whaler, spec);
  const w9 = spec.w || 8, d9 = spec.d || 6, fl9 = spec.floors || 1, bh9 = fl9 * 3 + 1;
  const x9 = spec.x, z9 = spec.z, gy9 = spec.y != null ? spec.y : Math.max(height(x9, z9), .2);
  const add9 = m9 => { m9.position.y += gy9; scene.add(m9); return m9; };
  const bd9 = box(w9, bh9, d9, lam(st9.wall)); bd9.position.set(x9, bh9 / 2, z9); add9(bd9);
  const sk9 = box(w9 + .5, .5, d9 + .5, lam(st9.trim)); sk9.position.set(x9, .25, z9); add9(sk9);
  const rf9 = st9.roof, rc9 = lam(st9.roofC);
  if (rf9 === 'gable') {
    const rh9 = +(1.6 + w9 * .1).toFixed(1);
    const rg9 = new THREE.Mesh(gableGeo9(w9 + 1.4, d9 + 1.4, rh9), rc9); rg9.position.set(x9, bh9 - .05, z9); add9(rg9);
  } else if (rf9 === 'cone') {
    const ch9 = 2.2 + w9 * .12;
    const cg9 = new THREE.Mesh(cong(+(Math.hypot(w9, d9) * .62).toFixed(1), +ch9.toFixed(1), 4), rc9);
    cg9.rotation.y = Math.PI / 4; cg9.position.set(x9, bh9 + ch9 / 2 - .1, z9); add9(cg9);
  } else if (rf9 === 'pagoda') {
    const ov9 = box(w9 + 2.4, .45, d9 + 2.4, rc9); ov9.position.set(x9, bh9 + .2, z9); add9(ov9);
    const rg9 = box(w9 * .62, 1.1, d9 * .5, rc9); rg9.position.set(x9, bh9 + .95, z9); add9(rg9);
    for (const [sx9, sz9] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const ev9 = new THREE.Mesh(cong(.5, 1.1, 4), rc9);
      ev9.position.set(x9 + sx9 * (w9 / 2 + 1), bh9 + .6, z9 + sz9 * (d9 / 2 + 1)); add9(ev9);
    }
  } else {
    const ov9 = box(w9 + .9, .4, d9 + .9, rc9); ov9.position.set(x9, bh9 + .15, z9); add9(ov9);
    const up9 = box(2.2, 1.3, 2.2, lam(st9.wall)); up9.position.set(x9 - w9 / 4, bh9 + .85, z9 - d9 / 4); add9(up9);
  }
  const dd9 = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0] }[spec.door || 'S'];
  const dp9 = new THREE.Mesh(geoc('pl1.4,2.2', () => new THREE.PlaneGeometry(1.4, 2.2)), lam(0x3a2e22));
  dp9.position.set(x9 + dd9[0] * (w9 / 2 + .06), 1.35, z9 + dd9[1] * (d9 / 2 + .06));
  dp9.rotation.y = Math.atan2(dd9[0], dd9[1]); add9(dp9);
  const st29 = box(2, .35, 1.1, lam(st9.trim));
  st29.position.set(x9 + dd9[0] * (w9 / 2 + .5), .17, z9 + dd9[1] * (d9 / 2 + .5)); add9(st29);
  const wf9 = lam(0x30302c);
  for (const [ux9, uz9] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    const hor9 = ux9 === 0, span9 = hor9 ? w9 : d9, n9 = Math.max(1, Math.round(span9 / 4.2));
    const isDoor9 = ux9 === dd9[0] && uz9 === dd9[1];
    for (let f9 = 0; f9 < fl9; f9++) for (let i9 = 0; i9 < n9; i9++) {
      if (isDoor9 && f9 === 0 && Math.abs(i9 - (n9 - 1) / 2) < .6) continue;   // 让开门
      const off9 = (i9 + .5) / n9 * span9 - span9 / 2;
      const px9 = x9 + (hor9 ? off9 : ux9 * (w9 / 2 + .06));
      const pz9 = z9 + (hor9 ? uz9 * (d9 / 2 + .06) : off9);
      const ry9 = Math.atan2(ux9, uz9);
      const fq9 = new THREE.Mesh(geoc('pl.95,1.2', () => new THREE.PlaneGeometry(.95, 1.2)), wf9);
      fq9.position.set(px9, gy9 + 2 + f9 * 3, pz9); fq9.rotation.y = ry9; scene.add(fq9);
      const gq9 = new THREE.PlaneGeometry(.85, 1.1);
      gq9.rotateY(ry9); gq9.translate(px9 + ux9 * .05, gy9 + 2 + f9 * 3, pz9 + uz9 * .05);
      WQUEUE9.push(gq9);
    }
  }
  if (spec.chimney !== false && (rf9 === 'gable' || rf9 === 'pagoda')) {
    const ct9 = bh9 + (rf9 === 'gable' ? 1.2 + w9 * .05 : 1.5);
    const ch9 = box(.9, 2.2, .9, rc9); ch9.position.set(x9 - w9 / 4, ct9, z9 - d9 / 4); add9(ch9);
    CHIM9.push([x9 - w9 / 4, gy9 + ct9 + 1.2, z9 - d9 / 4]);
  }
  boxObs.push({ x1: x9 - w9 / 2, z1: z9 - d9 / 2, x2: x9 + w9 / 2, z2: z9 + d9 / 2 });
  return { x: x9, z: z9, y: gy9, w: w9, d: d9, h: bh9 };
}
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
    { // 🪟 背墙外侧夜窗
      const wgs9 = [], nW9 = Math.max(2, Math.round(o.w / 9));
      for (let i9 = 0; i9 < nW9; i9++) {
        const wq9 = new THREE.PlaneGeometry(1.3, 1.6);
        wq9.translate(-o.w / 2 + (i9 + .5) * (o.w / nW9), 3.8, -o.d / 2 - .02);
        wgs9.push(wq9);
      }
      grp.add(new THREE.Mesh(mergeGeometries(wgs9), winMat9()));
    }
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
  const tv = Math.round((hash2(x, z) - .5) * 4) * .03;   // 色相量化 5 档:视觉无差,材质缓存收敛
  const g1 = new THREE.Color(0x4f9448).offsetHSL(tv, 0, tv * .3);
  const g2 = new THREE.Color(0x5fae52).offsetHSL(tv, 0, tv * .3);
  const g3 = new THREE.Color(0x3e7a3a).offsetHSL(tv, 0, tv * .3);
  const c0 = new THREE.Mesh(new THREE.IcosahedronGeometry(3.7 * scale, 0), lam(g3.getHex())); c0.position.y = 5.4 * scale; c0.scale.y = .82; grp.add(c0);
  const c1 = new THREE.Mesh(new THREE.IcosahedronGeometry(3.2 * scale, 0), lam(g1.getHex())); c1.position.set(-.8 * scale, 6.9 * scale, .5 * scale); grp.add(c1);
  const c2 = new THREE.Mesh(new THREE.IcosahedronGeometry(2.3 * scale, 0), lam(g2.getHex())); c2.position.set(1.4 * scale, 8.1 * scale, .6 * scale); grp.add(c2);
  let bird = null;
  if (birdCol) {
    bird = new THREE.Group();
    const bm9 = lamOwn(birdCol);   // 换批会改色 → 独享材质
    const body = new THREE.Mesh(new THREE.SphereGeometry(.55, 8, 6), bm9); bird.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.34, 8, 6), bm9); head.position.set(.5, .35, 0); bird.add(head);
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
    const fbm9 = lamOwn(hashCol(s.item.id));   // 换批会改色 → 独享材质
    for (let f = 0; f < 5; f++) {
      const fm = new THREE.Mesh(new THREE.SphereGeometry(.42, 7, 5), fbm9);
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
    const fish = box(1, .5, .3, lamOwn(FISH_COLOR[s.item.cat] || '#4a90d9'));   // 换批会改色 → 独享材质(且免合并)
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
        sh.uniforms.uGust = { value: 1 };
        sh.vertexShader = 'uniform float uTime;\nuniform float uGust;\n' + sh.vertexShader.replace('#include <begin_vertex>',
          `#include <begin_vertex>
           #ifdef USE_INSTANCING
             vec3 iP = instanceMatrix[3].xyz;
           #else
             vec3 iP = vec3(0.0);
           #endif
           float wv = sin(uTime * 1.15 + iP.x * .14 + iP.z * .1 + ${ph.toFixed(2)}) * .17 * uGust;
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
    const hand = new THREE.Mesh(sphg(.13, 6, 5), lam(skin)); hand.position.y = -.82 * tall; sh.add(hand);
    g.add(sh); limbs[s < 0 ? 'armL' : 'armR'] = sh;
  }
  const head = new THREE.Mesh(sphg(.48, 12, 9), lam(skin)); head.position.y = 2.28 * tall; g.add(head);
  for (const s of [-1, 1]) { const eye = new THREE.Mesh(sphg(.075, 6, 5), lam(0x222222)); eye.position.set(.16 * s, 2.33 * tall, .42); g.add(eye); }
  const nose = new THREE.Mesh(sphg(.06, 5, 4), lam(0xe0b088)); nose.position.set(0, 2.24 * tall, .47); g.add(nose);
  if (opts.hat === 'cone') { const h = new THREE.Mesh(cong(.55, .74, 8), lam(hatCol)); h.position.y = 2.92 * tall; g.add(h); }
  else { const h = new THREE.Mesh(sphg(.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), lam(hatCol)); h.position.y = 2.44 * tall; g.add(h); }
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
/* ===== 👥 NPC 增强:作息 · 情境台词 · 好感度 ===== */
const NIGHT_OWLS = ['守夜人', '灯塔管理员', '缄默修士', '守台老道', '不肯说名字的方士', '吟游诗人', '老看守', '守钟老人'];
const npcSleeping = n => curDA < .32 && !NIGHT_OWLS.includes(n.name) && !n.night;
function npcCtxLine() {
  if (WEATHER === 'storm') return '⛈️ 这鬼天气,你居然还在外面跑。';
  if (WEATHER === 'rain') return '🌧️ 好雨。听屋顶,多热闹。';
  if (WEATHER === 'fog') return '🌫️ 雾这么大,走路当心。';
  if (EVENT === 'fair') return '🎪 今天集市日,装备行全场九折——别说我没提醒你。';
  if (EVENT === 'meteor' && curDA < .35) return '🌠 今晚有流星雨,记得抬头。';
  if (EVENT === 'whales') return '🐋 外海有鲸群路过,看见水柱了吗?';
  if (EVENT === 'kites') return '🎏 看见天上的风筝了吗?孩子们放了一早上。';
  if (curDA < .35) return '🌙 这么晚还不歇着?';
  return '';
}
let AFF = {};
try { AFF = JSON.parse(PSTORE.getItem('w1001.aff') || '{}'); } catch (e) {}
const affOf = nm => (AFF[nm] && AFF[nm].n) || 0;
function affAdd(nm, k) { const a = AFF[nm] = AFF[nm] || { n: 0 }; a.n = Math.min(99, a.n + k); PSTORE.setItem('w1001.aff', JSON.stringify(AFF)); return a; }
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
const AUTHORS = [   // home = 迁居主题岛坐标(不设则留主岛作家角);首句为岛屿专属台词
  { name: '鲁迅', body: 0x2c3e50, lines: ['其实地上本没有路,走的人多了,也便成了路。', '愿中国青年都摆脱冷气,只是向上走。'] },
  { name: '海明威', body: 0x784212, home: [162, 858], lines: ['我在这港口守到第八十四天,还没等到那条大鱼——但今天海况不错。', '人可以被毁灭,但不能被打败。', '这个世界如此美好,值得人们为它奋斗。'] },
  { name: '加西亚·马尔克斯', body: 0xb03a2e, home: [1376, 956], lines: ['蜃楼散了不必可惜——马孔多也是一阵风就没了,可我们都记得它。', '过去都是假的,回忆是一条没有归途的路。', '生命中所有的灿烂,终要用寂寞偿还。'] },
  { name: '卡夫卡', body: 0x1b2631, home: [318, 642], lines: ['一座永远造不完的城,比造好的城诚实——它至少不撒谎。', '一本书,必须是劈开我们内心冰海的斧头。', '在你与世界的斗争中,请站在世界这边。'] },
  { name: '加缪', body: 0x21618c, home: [-698, -394], lines: ['守灯人把灯点亮,又任它熄灭,日复一日。我看见西西弗——他是幸福的。', '在隆冬,我终于知道,我身上有一个不可战胜的夏天。', '登上顶峰的斗争,本身足以充实人的心灵。'] },
  { name: '圣埃克苏佩里', body: 0xca6f1e, home: [1110, 344], lines: ['我认得这颗小星球——上面住着一朵玫瑰和三座火山。我只是回来看看她。', '真正重要的东西,用眼睛是看不见的。', '所有的大人,都曾经是小孩。'] },
];
{
  const wps = Object.entries(TRAVEL3D).filter(([k]) => k !== 'plaza').map(([, v]) => v);
  AUTHORS.forEach((a, i) => addNpc(a.home ? {
    x: a.home[0], z: a.home[1], name: a.name, body: a.body, hat: 0xf5efdc, opts: { hat: 'cone' },
    lines: a.lines, wander: true, wps: [[a.home[0], a.home[1]], [a.home[0] + 9, a.home[1] + 5], [a.home[0] - 6, a.home[1] + 9]],
  } : {
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
  // 布景街(两片只有正面的假立面)+ 圣玛丽亚号
  {
    const fx = cx - 30, fz = cz + 42, fh2 = height(fx, fz);
    for (let i = 0; i < 2; i++) {
      const face = box(7, 6, .4, lam([0xe8d8c0, 0xd0e0e8][i])); face.position.set(fx + i * 8, fh2 + 3, fz); scene.add(face);
      const prop = cyl(.14, .16, 6.4, M.woodDark); prop.rotation.x = .5; prop.position.set(fx + i * 8, fh2 + 2.6, fz - 2.4); scene.add(prop);   // 背后的支撑杆(穿帮处)
      cirObs.push({ x: fx + i * 8, z: fz, r: 3.6 });
    }
    addSpot(fx + 4, fz + 5, 'lore', 'truseahaven', { r: 7 });
    addSpot(648, 582, 'lore', 'truboat', { r: 9, y: .6 });   // 圣玛丽亚号船体在后面的船只块生成(boats TDZ)
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
  addNpc({ x: cx - 26, z: cz + 48, name: '西尔维娅', body: 0xc26a7a, hat: 0x8c3a4e, opts: { tall: .95 },
    lines: ['楚门!他们在骗你!这一切都是假的!', '我只来得及喊一句"天空是布景"——就被他们拖走了。', '后来他真的走出去了。那天我在电视机前,哭得像个孩子。'] });
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
  addSpot(-224, -646, 'lore', 'midparty', { r: 7 });   // 比尔博的告别宴(宴会树下)
  {   // 绿龙酒馆(绿门圆窗小屋)
    const gx2 = -252, gz2 = -672, gh2 = height(gx2, gz2);
    makeBldg({ x: gx2, z: gz2, w: 7, d: 5.4, style: 'nordic', wall: 0xc8b088, roofC: 0x4a6a2e });   // 🏗️ 统一建筑
    const mug = cyl(.35, .3, .5, M.gold, 10); mug.position.set(gx2 + 2.4, gh2 + 2.9, gz2 + 2.8); scene.add(mug);
    addSpot(gx2, gz2 + 5, 'lore', 'midgreen', { r: 7 });
  }
  addNpc({ x: -218, z: -658, name: '比尔博', body: 0x8a6a3a, hat: 0x6a4a26, opts: { tall: .72 },
    lines: ['我的一百一十一岁生日,过得比谁都热闹。', '那枚戒指……我本想留着的。是甘道夫劝我放了手。', '路从家门口延伸,一直向前——这句我写进书里了。'] });
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
  {   // 厄里斯魔镜(城堡侧的闲置教室外)+ 打人柳
    const mx2 = 668, mz2 = -574, mh2 = height(mx2, mz2);
    const mfr = box(2.6, 3.6, .3, M.gold); mfr.position.set(mx2, mh2 + 1.9, mz2); scene.add(mfr);
    const mgl = box(2, 3, .12, new THREE.MeshPhongMaterial({ color: 0xbfd8e8, shininess: 120 })); mgl.position.set(mx2, mh2 + 1.9, mz2 + .18); scene.add(mgl);
    cirObs.push({ x: mx2, z: mz2, r: 1.6 });
    addSpot(mx2, mz2 + 3, 'lore', 'hogmirror', { r: 6 });
    const wx2 = 626, wz2 = -586, wh2 = height(wx2, wz2);
    const wtr = cyl(1.4, 1.9, 6, M.woodDark, 8); wtr.position.set(wx2, wh2 + 3, wz2); scene.add(wtr); cirObs.push({ x: wx2, z: wz2, r: 2.6 });
    for (let i = 0; i < 5; i++) { const br2 = cyl(.22, .3, 4.6, M.woodDark, 6); br2.rotation.set((rnd() - .3) * 1.6, i * 1.26, .6 + rnd() * .5); br2.position.set(wx2 + Math.cos(i * 1.26) * 1.6, wh2 + 6, wz2 + Math.sin(i * 1.26) * 1.6); scene.add(br2); }
    addSpot(wx2, wz2 + 4.4, 'lore', 'hogwillow', { r: 7 });
  }
  // —— 原著 NPC ——
  addNpc({ x: 684, z: -578, name: '哈利', body: 0x2a2a30, hat: 0x1c1c20,
    lines: ['我是……就是哈利。', '呼神护卫!!(一道银光掠过)', '是霍格沃茨,把我变成今天的我。'] });
  addNpc({ x: 694, z: -576, name: '赫敏', body: 0x6b3a5a, hat: 0x8a5a3a,
    lines: ['是"漂浮咒"!Wing-GAR-dium Levi-O-sa,O 要读长音!', '我在《霍格沃茨:一段校史》里读到过。', '打败黑魔王靠的是书本和聪明——还有勇气。'] });
  addNpc({ x: 676, z: -570, name: '罗恩', body: 0xb03a2e, hat: 0xd97c3a,
    lines: ['梅林的胡子!', '要不……我们先吃点东西?', '她是真的可怕(小声):我说赫敏。'] });
  addNpc({ x: 690, z: -602, name: '邓布利多', body: 0x4a3a6a, hat: 0x8a7ab0, opts: { hat: 'cone', tall: 1.15, cane: true },
    lines: ['幸福,属于那些在黑暗中仍记得点灯的人。', '决定我们成为什么样的人的,不是能力,而是选择。', '对聪明绝顶的头脑而言,死亡不过是下一场伟大的冒险。'] });
  addNpc({ x: 664, z: -570, name: '卢娜', body: 0xbfd0e8, hat: 0xe8d8a0, opts: { tall: .9 },
    lines: ['你也看得见夜骐?那说明……哦,没什么。', '我爸的《唱唱反调》登过弯角鼾兽的独家新闻。', '别担心丢东西。最后都会回来的——只是方式往往出人意料。'] });
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
    {   // 水手教堂:船头讲坛 + 魁魁格的棺材
      const chX = ix - 26, chZ = iz - 14, chH = height(chX, chZ);
      const chapel = box(8, 5.4, 6.4, lam(0xd8d4c8)); chapel.position.set(chX, chH + 2.7, chZ); scene.add(chapel); cirObs.push({ x: chX, z: chZ, r: 5 });
      const spire = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.2, 6), lam(0x4a4a52)); spire.position.set(chX, chH + 7, chZ); scene.add(spire);
      const bow = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.8, 5), M.woodDark); bow.rotation.x = Math.PI / 2.6; bow.position.set(chX, chH + 2.4, chZ + 4.6); scene.add(bow);   // 船头讲坛探出墙外
      addSpot(chX, chZ + 6.4, 'lore', 'mobpulpit', { r: 7 });
      const cof = box(2.4, .9, 1, lam(0x5a4632)); cof.position.set(ix + 12, ih + .5, iz - 4); scene.add(cof);
      for (let i = 0; i < 3; i++) { const carv = box(.06, .5, .5, M.gold); carv.position.set(ix + 11 + i * .9, ih + .95, iz - 4); scene.add(carv); }
      addSpot(ix + 12, iz - 1.6, 'lore', 'mobcoffin', { r: 6 });
    }
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
  addNpc({ x: 96, z: 782, name: '梅普尔神父', body: 0x3a3a44, hat: 0x2a2a32, opts: { tall: 1.1, cane: true },
    lines: ['约拿逃避他的使命,鲸,就来找他了。', '如果我们服从上帝,就必须违抗我们自己。', '这些铭牌上的名字,都听过我布道。海,记得他们每一个。'] });
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
  { const bkH = height(cx3 - 60, cz3 - 20); const clk = cyl(1.1, 1.1, .3, lam(0xe6e2d8), 16); clk.rotation.x = Math.PI / 2; clk.position.set(cx3 - 60, bkH + 3, cz3 - 20); scene.add(clk);
    const clp = cyl(.16, .2, 3, M.stone); clp.position.set(cx3 - 60, bkH + 1.5, cz3 - 20); scene.add(clp); }
  addSpot(cx3 - 60, cz3 - 16, 'lore', 'sptbusby', { r: 7 });   // 慕尼黑纪念钟
  { const wlH = height(cx3 + 58, cz3 + 34); const wall6 = box(4.4, 2.6, .5, lam(0x8c2a2a)); wall6.position.set(cx3 + 58, wlH + 1.3, cz3 + 34); scene.add(wall6);
    for (let i = 0; i < 6; i++) { const ph6 = box(.6, .8, .06, lam(0xe6e2d8)); ph6.position.set(cx3 + 56.4 + (i % 3) * 1.6, wlH + 1.4 + Math.floor(i / 3) * 1, cz3 + 33.7); scene.add(ph6); } }
  addSpot(cx3 + 58, cz3 + 38, 'lore', 'sptclass92', { r: 7 });   // 92 班荣誉墙
  addNpc({ x: cx3 - 56, z: cz3 - 14, name: '博比爵士', body: 0x8c2a2a, hat: 0x6a1e1e, opts: { tall: 1.0, cane: true },
    lines: ['足球是最简单的游戏——把它踢好,最难。', '慕尼黑之后,活着的人,替走了的人踢。', '孩子,先学会摔倒,再学会射门。'] });
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
  {   // 精卫石堆 + 不周山残柱
    const jh = height(-560, -1052);
    for (let i = 0; i < 6; i++) { const peb = new THREE.Mesh(new THREE.DodecahedronGeometry(.3 + (i % 3) * .14), M.stone); peb.position.set(-560 + Math.cos(i * 2.2) * 1.2, jh + .25 + i * .12, -1052 + Math.sin(i * 2.2) * 1.2); scene.add(peb); }
    const jw = new THREE.Mesh(new THREE.SphereGeometry(.34, 7, 6), lam(0xd8d4c8)); jw.position.set(-560, jh + 1.6, -1052); scene.add(jw);   // 白喙鸟
    addSpot(-560, -1048, 'lore', 'shjjingwei', { r: 7 });
    const bzH = height(-478, -968);
    const bzC = cyl(1.6, 2.2, 7, M.stone, 8); bzC.rotation.z = .16; bzC.position.set(-478, bzH + 3.4, -968); scene.add(bzC); cirObs.push({ x: -478, z: -968, r: 2.4 });
    addSpot(-478, -963, 'lore', 'shjbuzhou', { r: 7 });
    addNpc({ x: -554, z: -1044, name: '精卫', body: 0xd8d4c8, hat: 0xc23a2a, opts: { tall: .78 },
      lines: ['我叫女娃。也有人,叫我精卫。', '西山的石子:一颗,一颗,又一颗。', '海问我何时休。我说——海干之日。'] });
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
    makeBldg({ x: hx, z: hz, w: 7, d: 5.5, style: 'jiangnan', wall: 0xe8dcc0 });   // 🏗️ 统一建筑
  });
  // 良田
  for (let i = 0; i < 4; i++) {
    const fx = gx - 30 + i * 16, fz = gz + 34;
    const field = box(13, .3, 9, lam(i % 2 ? 0x8fbc5a : 0x7aa84c)); field.position.set(fx, height(fx, fz) + .2, fz); scene.add(field);
  }
  addSpot(gx, gz + 34, 'lore', 'taofield', { r: 10 });
  addSpot(gx + 26, gz - 26, 'lore', 'thywine', { r: 7 });   // 桃花酿人家
  { const sh6 = height(gx - 32, gz + 44); const stele6 = box(1.2, 2, .3, M.stone); stele6.position.set(gx - 32, sh6 + 1, gz + 44); scene.add(stele6); }
  addSpot(gx - 32, gz + 47, 'lore', 'thystele', { r: 6 });   // 无问津碑
  addNpc({ x: gx + 22, z: gz - 20, name: '老村长', body: 0x8a7a5a, hat: 0x6a5a40, opts: { tall: 1.0, cane: true },
    lines: ['客从何处来?坐,吃茶。', '外面……又换了几个朝代了?罢了,不听也罢。', '出去之后,莫向外人道也。'] });
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
    {   // 芝麻开门(裂缝石门)+ 辛巴达的码头
      const sx4 = gx - 38, sz4 = gz - 22, sh5 = height(sx4, sz4);
      for (const s of [-1, 1]) { const slab2 = box(2.6, 5, 1.4, M.stone); slab2.rotation.y = s * .18; slab2.position.set(sx4 + s * 1.7, sh5 + 2.5, sz4); scene.add(slab2); }
      cirObs.push({ x: sx4, z: sz4, r: 3 });
      const gold2 = box(1.2, .3, .8, M.gold); gold2.position.set(sx4, sh5 + .2, sz4 + 1.6); scene.add(gold2);
      addSpot(sx4, sz4 + 4, 'lore', 'anhcave', { r: 7 });
      const dkX = gx + 34, dkZ = gz + 28, dkH = height(dkX, dkZ);
      for (let i = 0; i < 3; i++) { const pil2 = cyl(.2, .24, 2.2, M.woodDark); pil2.position.set(dkX + i * 2.2, dkH + 1.1, dkZ); scene.add(pil2); }
      const bale = box(1.6, 1, 1.2, lam(0xb08a4a)); bale.position.set(dkX + 1, dkH + .5, dkZ - 2); scene.add(bale);
      addSpot(dkX + 2, dkZ + 3, 'lore', 'anhsinbad', { r: 7 });
    }
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
  addNpc({ x: gx + 30, z: gz + 24, name: '辛巴达', body: 0x2a6a8a, hat: 0xd9b26a, opts: { tall: 1.04 },
    lines: ['第七次回来我才明白:故事,比货物值钱。', '磁石山会吸走船上每一根铁钉——我亲眼看着大船散成木片。', '你也是漂泊的人?来,讲讲你的岛,我拿一段航海故事跟你换。'] });
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
  addSpot(gx - 28, gz - 24, 'lore', 'nemorgan', { r: 7 });   // 海底管风琴(客厅方向)
  { const fh6 = height(gx + 28, gz + 28); const fpole6 = cyl(.1, .12, 4.6, M.woodDark); fpole6.position.set(gx + 28, fh6 + 2.3, gz + 28); scene.add(fpole6);
    const bf6 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4), new THREE.MeshLambertMaterial({ color: 0x16161e, side: THREE.DoubleSide })); bf6.position.set(gx + 29.1, fh6 + 4, gz + 28); scene.add(bf6); }
  addSpot(gx + 28, gz + 31, 'lore', 'nemflag', { r: 6 });   // 南极黑旗(复制品)
  addNpc({ x: gx - 20, z: gz - 16, name: '阿龙纳斯教授', body: 0x5a6a7a, hat: 0x3e4a56, opts: { tall: 1.02 },
    lines: ['我是来研究"海怪"的——结果住进了海怪的肚子里。', '尼德·兰天天想逃,康塞尔天天做分类,我天天记笔记。', '《海底两万里》——就是那本笔记。'] });
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
  {   // 四十四次日落的椅子 + 金蛇的沙地
    const chH = height(gx + 12, gz - 14);
    const chair = box(.9, .14, .9, M.wood); chair.position.set(gx + 12, chH + .6, gz - 14); scene.add(chair);
    const chBk = box(.9, 1, .12, M.wood); chBk.position.set(gx + 12, chH + 1.15, gz - 14.4); scene.add(chBk);
    addSpot(gx + 12, gz - 11, 'lore', 'b612sunset', { r: 6 });
    const snH = height(gx - 16, gz + 14);
    const snake6 = new THREE.Mesh(new THREE.TorusGeometry(.8, .12, 6, 14, 4.4), M.gold); snake6.rotation.x = -Math.PI / 2; snake6.position.set(gx - 16, snH + .18, gz + 14); scene.add(snake6);
    addSpot(gx - 16, gz + 17, 'lore', 'b612snake', { r: 6 });
  }
  addNpc({ x: gx + 10, z: gz - 18, name: '飞行员', body: 0x8a6a3a, hat: 0x5a4426, opts: { tall: 1.02 },
    lines: ['我六岁画的蟒蛇吞象,大人们都说:是顶帽子。', '"请你,给我画一只羊。"——我们就是这样认识的。', '如果有人路过撒哈拉,看见一个金发的小人……请立刻写信告诉我:他回来了。'] });
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
    {   // 琥珀展柱 + 混沌演示台
      const amH = height(gx + 22, gz + 32);
      const amP = cyl(.5, .6, 1.6, M.stone, 8); amP.position.set(gx + 22, amH + .8, gz + 32); scene.add(amP);
      const amB = new THREE.Mesh(new THREE.SphereGeometry(.5, 9, 7), new THREE.MeshPhongMaterial({ color: 0xd8a02a, transparent: true, opacity: .82, shininess: 90 })); amB.position.set(gx + 22, amH + 1.9, gz + 32); scene.add(amB);
      addSpot(gx + 22, gz + 35, 'lore', 'juramber', { r: 6 });
      addSpot(gx - 24, gz - 34, 'lore', 'jurchaos', { r: 7 });
    }
    addNpc({ x: gx - 20, z: gz - 28, name: '马尔科姆博士', body: 0x1c1c22, hat: 0x111116, opts: { tall: 1.06 },
      lines: ['混沌理论。简单说:会出事的,一定出事。', '生命,自会找到出路。', '他们只想着"能不能",从没人停下来想想"该不该"。'] });
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
  {   // 娲皇遗石(裂开的仙石)+ 齐天大圣旗
    const wx4 = gx - 20, wz4 = gz - 44, wh4 = height(wx4, wz4);
    const st1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6), M.stone); st1.position.set(wx4 - 1, wh4 + 1.6, wz4); st1.rotation.z = .3; scene.add(st1);
    const st2 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2), M.stone); st2.position.set(wx4 + 1.8, wh4 + 1.3, wz4 + .6); st2.rotation.z = -.4; scene.add(st2);
    cirObs.push({ x: wx4, z: wz4, r: 3.2 });
    addSpot(wx4, wz4 + 4.4, 'lore', 'hgsstone', { r: 7 });
    const fx4 = gx + 28, fz4 = gz - 20, fh4 = height(fx4, fz4);
    const fp4 = cyl(.16, .2, 8, M.woodDark); fp4.position.set(fx4, fh4 + 4, fz4); scene.add(fp4);
    const fbn = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.2), new THREE.MeshLambertMaterial({ color: 0xe8c12a, side: THREE.DoubleSide })); fbn.position.set(fx4 + 1.8, fh4 + 6.8, fz4); scene.add(fbn);
    addSpot(fx4, fz4 + 3.6, 'lore', 'hgsflag', { r: 7 });
  }
  addNpc({ x: gx + 24, z: gz - 14, name: '通背猿猴', body: 0x9a6a3a, hat: 0x6a4a26, opts: { wide: 1.1, tall: .8 },
    lines: ['大王!俺探得东海龙宫,有件定海神针!', '大王去学艺那些年,俺们天天在这儿守着。', '天兵天将来过两回——都被大王打回去啦!'] });
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
  {   // 王后的槌球场(弯腰士兵球门)+ 眼泪池
    const qx2 = gx + 30, qz2 = gz - 26, qh2 = height(qx2, qz2);
    for (let i = 0; i < 2; i++) { const arch = new THREE.Mesh(new THREE.TorusGeometry(1.2, .18, 8, 14, Math.PI), lam(0xc23a3a)); arch.position.set(qx2 + i * 5, qh2 + .1, qz2); scene.add(arch); const hb = box(.5, .5, .5, lam(0xe6e2d8)); hb.position.set(qx2 + i * 5 - 1.2, qh2 + .3, qz2); scene.add(hb); }
    const fl2 = new THREE.Mesh(new THREE.SphereGeometry(.4, 8, 6), lam(0xe86a8a)); fl2.position.set(qx2 + 2.4, qh2 + 1.2, qz2 + 1.4); scene.add(fl2);
    const fneck = cyl(.08, .08, 1, lam(0xe86a8a)); fneck.rotation.z = .5; fneck.position.set(qx2 + 2.1, qh2 + .7, qz2 + 1.4); scene.add(fneck);   // 火烈鸟槌
    addSpot(qx2 + 2, qz2 + 4, 'lore', 'alccroquet', { r: 8 });
    const tp2 = new THREE.Mesh(new THREE.CircleGeometry(4.4, 20), new THREE.MeshPhongMaterial({ color: 0x5aa0c8, transparent: true, opacity: .8 })); tp2.rotation.x = -Math.PI / 2; tp2.position.set(gx - 34, height(gx - 34, gz + 26) + .2, gz + 26); scene.add(tp2);
    addSpot(gx - 34, gz + 30, 'lore', 'alctears', { r: 7 });
  }
  addNpc({ x: gx + 34, z: gz - 20, name: '红桃王后', body: 0xc0392b, hat: 0xf2d13c, opts: { wide: 1.4 },
    lines: ['砍掉他的头!!', '规则?我,就是规则!', '你会槌球吗?会?那开赛——输了砍头!'] });
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
    { const lkH = height(gx + 24, gz + 42); for (let i = 0; i < 3; i++) { const ring6 = new THREE.Mesh(new THREE.TorusGeometry(.5, .12, 6, 12), lam(0x4a4a52)); ring6.position.set(gx + 24 + i * 1.3, lkH + .5, gz + 42); ring6.rotation.y = i; scene.add(ring6); } }
    addSpot(gx + 24, gz + 45, 'lore', 'cbilianhuan', { r: 7 });   // 连环船锁
    addSpot(gx - 32, gz - 38, 'lore', 'cbihuarong', { r: 8 });    // 华容道口
    addNpc({ x: gx - 12, z: gz + 14, name: '周瑜', body: 0xb03a3a, hat: 0x8c2424, opts: { tall: 1.05 },
      lines: ['既生瑜……不,今日风紧,不提这个。', '万事俱备,只欠东风。', '谈笑间——樯橹灰飞烟灭。'] });
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
    { const bgH = height(gx + 30, gz - 22); const satch = box(1, .5, .7, lam(0x4a5a6a)); satch.position.set(gx + 30, bgH + .35, gz - 22); scene.add(satch); }
    addSpot(gx + 30, gz - 19, 'lore', 'lrsledger', { r: 6 });   // 宁采臣的行囊
    { const swH = height(gx - 32, gz + 16); const case6 = box(1.6, .5, .6, lam(0x3a3a44)); case6.position.set(gx - 32, swH + .35, gz + 16); scene.add(case6);
      const gl6 = new THREE.PointLight(0xbfd8ff, .7, 12, 2); gl6.position.set(gx - 32, swH + 1, gz + 16); scene.add(gl6); }
    addSpot(gx - 32, gz + 19, 'lore', 'lrssword', { r: 6 });   // 燕赤霞的剑匣
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
  { const stH = height(gx + 44, gz - 30); const stl6 = box(1.6, 2.6, .4, M.stone); stl6.rotation.z = .05; stl6.position.set(gx + 44, stH + 1.3, gz - 30); scene.add(stl6); }
  addSpot(gx + 44, gz - 26, 'lore', 'lspstele', { r: 6 });   // 忠义堂石碣
  { const bwH = height(gx - 22, gz + 44); for (let i = 0; i < 3; i++) { const bowl6 = cyl(.4, .28, .32, lam(0xd8c8a0), 10); bowl6.position.set(gx - 22 + i * 1.1, bwH + .5, gz + 44); scene.add(bowl6); } }
  addSpot(gx - 22, gz + 47, 'lore', 'lspwine', { r: 6 });    // 大碗酒阵
  addNpc({ x: gx + 40, z: gz - 20, name: '武松', body: 0x5a4632, hat: 0x3a2e20, opts: { tall: 1.1, wide: 1.15 },
    lines: ['十八碗过冈。那只大虫——运气不好,撞见了我。', '我这双拳头,只打该打的。', '哥哥们叫我行者。行者:走路的人。'] });
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
  { const mH = Math.max(height(SIR.x - 42, SIR.z + 30), 0); const mast6 = cyl(.16, .2, 5, M.woodDark); mast6.position.set(SIR.x - 42, mH + 2.5, SIR.z + 30); scene.add(mast6);
    for (let i = 0; i < 3; i++) { const rp6 = new THREE.Mesh(new THREE.TorusGeometry(.34, .07, 6, 10), lam(0xd8c8a0)); rp6.position.set(SIR.x - 42, mH + 1.2 + i * .8, SIR.z + 30); scene.add(rp6); } }
  addSpot(SIR.x - 42, SIR.z + 34, 'lore', 'sirmast', { r: 7, y: 1 });   // 桅杆绳结
  { const bH = Math.max(height(SIR.x + 36, SIR.z - 34), 0); for (let i = 0; i < 5; i++) { const bone6 = cyl(.08, .1, .9, M.white, 5); bone6.rotation.z = Math.PI / 2 + i; bone6.position.set(SIR.x + 36 + Math.cos(i * 2.4) * 1.4, bH + .2, SIR.z - 34 + Math.sin(i * 2.4) * 1.4); scene.add(bone6); } }
  addSpot(SIR.x + 36, SIR.z - 30, 'lore', 'sirbones', { r: 7, y: 1 });  // 白骨滩
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
  addSpot(gx + 34, gz - 34, 'lore', 'fcydulci', { r: 7 });   // 杜尔西内娅(筛麦子的姑娘家)
  { const ashH = height(gx - 44, gz + 30); const ash6 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), lam(0x2a2420)); ash6.scale.y = .4; ash6.position.set(gx - 44, ashH + .4, gz + 30); scene.add(ash6);
    const bk6 = box(.7, .12, .5, lam(0x8c3a2a)); bk6.rotation.z = .3; bk6.position.set(gx - 43, ashH + .9, gz + 30); scene.add(bk6); }
  addSpot(gx - 44, gz + 33, 'lore', 'fcybooks', { r: 6 });   // 焚书的灰堆
  addNpc({ x: gx + 38, z: gz - 30, name: '杜尔西内娅', body: 0xb08858, hat: 0x8a6a3a, opts: { tall: .96 },
    lines: ['筛麦子呢,别挡光。', '那个瘦骑士?又替我"决斗"去了?老天。', '不过说真的……被人那样念着,也,也不算坏。'] });
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
  addSpot(gx + 12, gz + 10, 'lore', 'yfbabbe', { r: 6 });   // 法利亚的凿洞(隔壁牢房)
  addSpot(gx - 4, gz + 22, 'lore', 'yfblist', { r: 6 });    // 伯爵的清单
  addNpc({ x: gx + 14, z: gz + 14, name: '法利亚长老', body: 0x9a9088, hat: 0x7a7268, opts: { tall: 1.02, cane: true },
    lines: ['我算错了方位——却挖对了人生。', '知识,是唯一越狱成功的东西。', '孩子:基督山岛,黑岩之下。替我看看外面的海。'] });
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
  { const clH = height(gx - 26, gz - 18); const post6 = box(.5, 3.2, .5, M.woodDark); post6.position.set(gx - 26, clH + 1.6, gz - 18); scene.add(post6);
    for (let i = 0; i < 6; i++) { const notch = box(.56, .05, .08, lam(0xd8c8a0)); notch.position.set(gx - 26, clH + .6 + i * .42, gz - 17.75); scene.add(notch); } }
  addSpot(gx - 26, gz - 14, 'lore', 'rbxcalendar', { r: 6 });   // 日历柱
  { const whH = height(gx + 20, gz - 30); for (let i = 0; i < 8; i++) { const stalk = cyl(.04, .05, 1 + (i % 3) * .2, lam(0xc8a83a), 4); stalk.position.set(gx + 20 + (i % 4) * .8, whH + .55, gz - 30 + Math.floor(i / 4) * .9); scene.add(stalk); } }
  addSpot(gx + 20, gz - 27, 'lore', 'rbxwheat', { r: 6 });      // 第一片麦田
  addNpc({ x: gx - 20, z: gz - 12, name: '星期五', body: 0x6a4a2a, hat: 0x4a3420, opts: { tall: .96 },
    lines: ['你救我命——星期五,你的。', '主人教我说话、穿衣、开枪。我教主人:椰子树怎么下来快。', '"爸爸"这个词,是我教主人的族语。'] });
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
  {   // 怡红院(红柱月门小院)
    const yx = gx + 34, yz = gz - 26, yh = height(yx, yz);
    for (const s of [-1, 1]) { const rc = cyl(.24, .28, 3.6, lam(0x8c2f24)); rc.position.set(yx + s * 2.2, yh + 1.8, yz); scene.add(rc); }
    const moon = new THREE.Mesh(new THREE.TorusGeometry(2.2, .3, 8, 20), lam(0xe6e2d8)); moon.position.set(yx, yh + 2.4, yz); scene.add(moon);
    const ban = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 6), lam(0xe86a8a)); ban.position.set(yx - 3.4, yh + 2.2, yz - 2); scene.add(ban);   // 海棠
    const bj = cyl(.16, .2, 2.8, lam(0x3a8a4a)); bj.position.set(yx + 3.4, yh + 1.4, yz - 2); scene.add(bj);   // 芭蕉
    addSpot(yx, yz + 3.4, 'lore', 'dgyhouse', { r: 7 });
  }
  {   // 栊翠庵(灰瓦小庵 + 一株红梅)
    const nx = gx - 40, nz = gz - 24, nh = height(nx, nz);
    const an = box(5, 3.4, 4, lam(0x8a8a82)); an.position.set(nx, nh + 1.7, nz); scene.add(an); cirObs.push({ x: nx, z: nz, r: 3.4 });
    const anr = new THREE.Mesh(new THREE.ConeGeometry(4, 2, 4), lam(0x4a4a46)); anr.rotation.y = .78; anr.position.set(nx, nh + 4.3, nz); scene.add(anr);
    const mei = cyl(.14, .18, 2.6, M.woodDark); mei.position.set(nx + 3.4, nh + 1.3, nz + 2); scene.add(mei);
    const meiB = new THREE.Mesh(new THREE.SphereGeometry(.9, 7, 6), lam(0xe85a7a)); meiB.position.set(nx + 3.6, nh + 3, nz + 2); scene.add(meiB);
    addSpot(nx, nz + 3.6, 'lore', 'dgynun', { r: 7 });
  }
  addNpc({ x: gx - 36, z: gz - 18, name: '妙玉', body: 0x9aa8a0, hat: 0x6a7a72, opts: { tall: .98 },
    lines: ['槛外人妙玉,恭肃遥叩。', '这是五年前梅花上收的雪,埋在地下——你,尝得出么?', '太高人愈妒,过洁世同嫌……他们背后怎么说我,我知道。'] });
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
  addSpot(gx - 24, gz + 72, 'lore', 'purangel', { r: 7 });   // 七个 P 的门槛(山门旁)
  addSpot(gx + 20, gz - 6, 'lore', 'purvirgil', { r: 7 });   // 维吉尔止步处(近山巅)
  addNpc({ x: gx + 24, z: gz - 2, name: '维吉尔', body: 0x6a6a7a, hat: 0xd9d5c8, opts: { tall: 1.08, cane: true },
    lines: ['我以智慧带你至此。再往上,需要恩典。', '走你的路,让人们去说吧。', '恐惧,最败坏人心。'] });
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
/* ===== 🏯 天空之城 · 勒皮他(飞岛,乘大鹏抵达)===== */
const SKY = { x: -550, z: 200, r: 55, y: 210 };
let skyGroup = null, skyDetail = null, skyCrystal = null, skyFall = null, skyFallV = null, skyClouds = null, skyDoves = null, spellT9 = 0;
{
  const g9 = new THREE.Group(); g9.position.set(SKY.x, SKY.y, SKY.z);
  // 基座:倒锥浮岩 + 草顶盘
  const rock9 = new THREE.Mesh(new THREE.CylinderGeometry(SKY.r, 6, 48, 12), lam(0x71604c)); rock9.position.y = -24.5; g9.add(rock9);
  const turf9 = new THREE.Mesh(new THREE.CylinderGeometry(SKY.r, SKY.r - 2.5, 4, 24), lam(0x5d8a4e)); turf9.position.y = -2; g9.add(turf9);
  // 悬浮磁石(勒皮他靠它飞行)
  skyCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(5, 0), new THREE.MeshBasicMaterial({ color: 0x69e6ff, transparent: true, opacity: .85, fog: false }));
  skyCrystal.position.y = -54; g9.add(skyCrystal);
  // 细节层(远处隐藏)
  const d9 = new THREE.Group(); skyDetail = d9; g9.add(d9);
  const drum9 = cyl(9, 10, 7, lam(0xd8d2c4), 14); drum9.position.set(0, 3.5, -8); d9.add(drum9);
  const dome9 = new THREE.Mesh(new THREE.SphereGeometry(9, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), lam(0x4a7a9a)); dome9.position.set(0, 7, -8); d9.add(dome9);
  for (let i = 0; i < 4; i++) {   // 四座风塔(各挂一枚季节风铃)
    const a9 = i * Math.PI / 2 + Math.PI / 4, tx9 = Math.cos(a9) * 34, tz9 = Math.sin(a9) * 34;
    const tw9 = cyl(2.4, 3, 14, lam(0xcfc8b8), 8); tw9.position.set(tx9, 7, tz9); d9.add(tw9);
    const rf9 = new THREE.Mesh(new THREE.ConeGeometry(3.4, 5, 8), lam(0x8a5a3a)); rf9.position.set(tx9, 16.5, tz9); d9.add(rf9);
    const ux9 = -Math.cos(a9), uz9 = -Math.sin(a9);   // 朝城心一侧挂铃
    const arm9 = cyl(.12, .12, 2.2, lam(0x6a5a48)); arm9.rotation.z = Math.PI / 2; arm9.rotation.y = -a9;
    arm9.position.set(tx9 + ux9 * 3.2, 5.6, tz9 + uz9 * 3.2); d9.add(arm9);
    const CB9 = [0x6fae5c, 0x4a90c2, 0xc2924a, 0xbfd4e6][i];
    for (let j = 0; j < 3; j++) {
      const sl9 = box(.18, 1.4 - j * .25, .06, lam(CB9));
      sl9.position.set(tx9 + ux9 * (2.4 + j * .8), 4.6, tz9 + uz9 * (2.4 + j * .8)); d9.add(sl9);
    }
    addSpot(SKY.x + tx9 + ux9 * 3, SKY.z + tz9 + uz9 * 3, 'lore', 'chime' + (i + 1), { r: 5.5, y: SKY.y });
  }
  for (let i = 0; i < 12; i++) {   // 环形矮墙
    const a9 = i * Math.PI / 6, wl9 = box(12, 1.4, 1, lam(0xbfb8a8));
    wl9.position.set(Math.cos(a9) * (SKY.r - 3.5), .7, Math.sin(a9) * (SKY.r - 3.5)); wl9.rotation.y = -a9 + Math.PI / 2; d9.add(wl9);
  }
  const rs9 = mulberry32(612);
  for (let i = 0; i < 8; i++) {   // 云端果园
    const a9 = rs9() * Math.PI * 2, rr9 = 14 + rs9() * 24, tx9 = Math.cos(a9) * rr9, tz9 = Math.sin(a9) * rr9;
    if (Math.hypot(tx9, tz9 + 8) < 14 || Math.hypot(tx9, tz9 - 40) < 10) continue;   // 避开穹顶与鹏台
    const tk9 = cyl(.5, .7, 3.4, lam(0x6a4a30)); tk9.position.set(tx9, 1.7, tz9); d9.add(tk9);
    const cn9 = new THREE.Mesh(new THREE.ConeGeometry(2.6, 5.5, 7), lam(0x6fae5c)); cn9.position.set(tx9, 5.8, tz9); d9.add(cn9);
  }
  const pad9 = cyl(6, 7, 1.2, M.stone, 10); pad9.position.set(0, .6, 40); d9.add(pad9);   // 云鹏哨站着陆台
  const pole9 = cyl(.18, .18, 7, lam(0x8a7a5c)); pole9.position.set(4.5, 3.5, 44); d9.add(pole9);
  const flag9 = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.4), new THREE.MeshLambertMaterial({ color: 0x69c6e6, side: THREE.DoubleSide }));
  flag9.position.set(5.9, 6, 44); d9.add(flag9);
  skyClouds = new THREE.Group();   // 云环:五团扁云绕城缓转
  const cm9 = new THREE.MeshLambertMaterial({ color: 0xf2f5f8, transparent: true, opacity: .72 });
  for (let i = 0; i < 5; i++) {
    const a9 = i / 5 * Math.PI * 2, cl9 = new THREE.Mesh(new THREE.SphereGeometry(9 + (i % 2) * 4, 8, 6), cm9);
    cl9.scale.set(1.6, .34, 1); cl9.position.set(Math.cos(a9) * 82, -26 - (i % 3) * 7, Math.sin(a9) * 82);
    skyClouds.add(cl9);
  }
  g9.add(skyClouds);
  // 🌳 抱城巨树(西北角,根须抱住台缘)
  const trk9 = cyl(1.2, 2.4, 24, lam(0x5a4632), 8); trk9.position.set(-18, 12, 12); d9.add(trk9);
  for (let i = 0; i < 5; i++) {   // 根须
    const a9 = i / 5 * Math.PI * 2 + .4, rt9 = cyl(.3, .55, 7, lam(0x4e3c2a), 6);
    rt9.position.set(-18 + Math.cos(a9) * 2.6, 2.6, 12 + Math.sin(a9) * 2.6);
    rt9.rotation.z = Math.cos(a9) * .5; rt9.rotation.x = -Math.sin(a9) * .5; d9.add(rt9);
  }
  for (const [cx9, cy9, cz9, cr9, cc9] of [[-18, 26, 12, 7.5, 0x4f7d46], [-13, 23, 15, 5, 0x6fae5c], [-22, 22.5, 8, 5.5, 0x5d9450], [-18, 30.5, 12, 4.5, 0x6fae5c]]) {
    const cp9 = new THREE.Mesh(new THREE.SphereGeometry(cr9, 9, 7), lam(cc9)); cp9.position.set(cx9, cy9, cz9); cp9.scale.y = .8; d9.add(cp9);
  }
  // 🤖 苔藓园丁(墓园一角,吉卜力式守墓机器人)
  const rob9 = new THREE.Group();
  const rbB9 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.9, 3.6, 10), lam(0x7a8a7a)); rbB9.position.y = 2.6; rob9.add(rbB9);
  const rbH9 = new THREE.Mesh(new THREE.SphereGeometry(1.05, 10, 8), lam(0x8a9a8a)); rbH9.position.y = 5.1; rob9.add(rbH9);
  for (const s9 of [-1, 1]) {
    const eye9 = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .1, 8), new THREE.MeshBasicMaterial({ color: 0xffd27a, fog: false }));
    eye9.rotation.x = Math.PI / 2; eye9.position.set(s9 * .42, 5.15, .95); rob9.add(eye9);
    const arm9 = cyl(.34, .42, 4.4, lam(0x74846f)); arm9.position.set(s9 * 1.9, 2.5, 0); arm9.rotation.z = s9 * .16; rob9.add(arm9);
  }
  const mg9 = lam(0x5d8a4e);
  for (const [mx9, my9, mz9, mr9] of [[0, 4.4, .8, .4], [-1.1, 3.4, .6, .5], [.9, 1.5, .8, .42], [.2, 6, 0, .36]]) {
    const mo9 = new THREE.Mesh(new THREE.SphereGeometry(mr9, 6, 5), mg9); mo9.position.set(mx9, my9, mz9); mo9.scale.y = .5; rob9.add(mo9);
  }
  const dvS9 = new THREE.Mesh(new THREE.SphereGeometry(.24, 6, 5), lam(0xf2efe6));   // 锁骨上的白鸽
  dvS9.scale.set(1, .85, 1.4); dvS9.position.set(-.9, 4.6, .9); rob9.add(dvS9);
  rob9.position.set(21, 0, -20); rob9.rotation.y = -.8; d9.add(rob9);
  // 墓园:三块石碑 + 花
  for (const [gx9, gz9, gr9] of [[25, -24, .2], [27.5, -21, -.15], [24, -27.5, .1]]) {
    const st9 = box(1.1, 1.7, .38, lam(0x8a8578)); st9.position.set(gx9, .85, gz9); st9.rotation.z = gr9; d9.add(st9);
    const fl9 = new THREE.Mesh(new THREE.ConeGeometry(.22, .5, 5), lam([0xc86a7a, 0xd8b04a, 0x7a8ac8][(gx9 | 0) % 3]));
    fl9.position.set(gx9 + .5, .35, gz9 + .7); d9.add(fl9);
  }
  // 🕊️ 鸽群(绕巨树盘旋)
  skyDoves = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const dv9 = new THREE.Group();
    const db9 = new THREE.Mesh(new THREE.SphereGeometry(.3, 6, 5), lam(0xf2efe6)); db9.scale.set(1, .8, 1.5); dv9.add(db9);
    const dw9 = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .45), new THREE.MeshLambertMaterial({ color: 0xe8e4d8, side: THREE.DoubleSide }));
    dw9.position.y = .15; dv9.add(dw9);
    const a9 = i / 5 * Math.PI * 2;
    dv9.position.set(Math.cos(a9) * 10, (i % 2) * 1.8, Math.sin(a9) * 10); dv9.rotation.y = -a9;
    skyDoves.add(dv9);
  }
  skyDoves.position.set(-18, 25, 12); d9.add(skyDoves);
  cirObs.push({ x: SKY.x - 18, z: SKY.z + 12, r: 2.8, bot: 190 });   // 巨树干
  cirObs.push({ x: SKY.x + 21, z: SKY.z - 20, r: 2.4, bot: 190 });   // 园丁
  addSpot(SKY.x + 21, SKY.z - 23, 'lore', 'gardener', { r: 7, y: SKY.y });
  addSpot(SKY.x - 18, SKY.z + 17, 'lore', 'skytree', { r: 7, y: SKY.y });
  // 边缘瀑布(东缘泻入云海)
  const FN9 = 130, fp9 = new Float32Array(FN9 * 3); skyFallV = new Float32Array(FN9);
  const rf6 = mulberry32(319);
  for (let i = 0; i < FN9; i++) { const a9 = -.5 + rf6(); fp9[i * 3] = Math.cos(a9) * (SKY.r - 2); fp9[i * 3 + 1] = -rf6() * 85; fp9[i * 3 + 2] = Math.sin(a9) * (SKY.r - 2); skyFallV[i] = 12 + rf6() * 16; }
  const fg9 = new THREE.BufferGeometry(); fg9.setAttribute('position', new THREE.BufferAttribute(fp9, 3));
  skyFall = new THREE.Points(fg9, new THREE.PointsMaterial({ color: 0xbfe9ff, size: .9, transparent: true, opacity: .55, depthWrite: false }));
  skyFall.frustumCulled = false; g9.add(skyFall);
  scene.add(g9); skyGroup = g9;
  // 碰撞(bot:低于 190 的泳者放行)
  cirObs.push({ x: SKY.x, z: SKY.z - 8, r: 10.8, bot: 190 });
  for (let i = 0; i < 4; i++) { const a9 = i * Math.PI / 2 + Math.PI / 4; cirObs.push({ x: SKY.x + Math.cos(a9) * 34, z: SKY.z + Math.sin(a9) * 34, r: 3.4, bot: 190 }); }
  addSpot(SKY.x, SKY.z + 40, 'lore', 'skyback', { r: 8, y: SKY.y });
  addSpot(SKY.x, SKY.z - 8, 'lore', 'lodestone', { r: 9, y: SKY.y });
  addNpc({ x: SKY.x - 16, z: SKY.z + 14, y: SKY.y, name: '云端乐师', body: 0x3a6a8a, hat: 0xd8d2c4, opts: { hat: 'cone' },
    lines: ['嘘——听,球面的音乐。勒皮他人用琴弦丈量星星。', '四座风塔上挂着春夏秋冬四枚风铃——把它们都摇响,你就听懂勒皮他了。', '我们的乐器都按几何定音:琴是等边三角,鼓是正圆。', '下界的人说我们心不在焉——他们不懂,我们只是在听别的东西。'] });
  addNpc({ x: SKY.x + 14, z: SKY.z + 6, y: SKY.y, name: '飞岛几何学家', body: 0x6a5a8a, hat: 0x4a3a6a,
    lines: ['这座岛靠一块巨大的磁石悬浮——格列佛先生当年也问过同样的问题。', '那位园丁比这座城还老。它只记得两件事:照顾花,和等一个人回来。', '面包我们切成圆锥、圆柱、平行四边形——味道会更几何一些。', '别走到边缘去。掉下去的话,你会先算出落体时间,再后悔。'] });
  cirObs[cirObs.length - 1].bot = 190; cirObs[cirObs.length - 2].bot = 190;   // 两位 NPC 的障碍同样放行海面
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
  { c: UNJ, name: '未竟之都', icon: '🏛️', theme: 'capital' },
];
/* ===== 海洋文学带:数据驱动内容(每岛一份 lore/npcs/build)===== */
const NI_CONTENT = makeNIContent({ THREE, height, box, cyl, lam, M, scene, cirObs, nightLamps, rnd, makeBoat, winMat9, mergeGeometries, makeBldg });
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
  for (const n of (c.npcs || [])) addNpc(Object.assign({
    topics: n.topics || [
      { q: '跟我说说这座岛?', a: (c.desc || '').replace('组合岛:', '这儿嘛——') + '。你眼里看到的,和我们过出来的,凑一块才算全貌。' },
      NI_QUESTS[s.key] ? { q: '这里有什么要紧事?', a: '要紧事只有一件——' + NI_QUESTS[s.key].btn.replace(/^\S+\s*/, '') + '。岛在等一个肯动手的人。' }
        : { q: '住在这儿感觉如何?', a: '海风免费,故事管够,还要什么?' },
    ],
  }, n, { x: gx + n.dx, z: gz + n.dz }));
  for (const [dx, dz, tp] of (c.spots || [])) addSpot(gx + dx, gz + dz, 'lore', tp, { r: 6 });
  const dk = height(s.dock[0], s.dock[1]);
  const plk = box(5, .5, 9, M.wood); plk.position.set(s.dock[0], dk + .9, s.dock[1]); scene.add(plk);
  addSpot(s.dock[0], s.dock[1], 'ferry', 'ferry', { r: 8 });
  const sgn = makeSign(c.name, 6.5, '#1e2430', '#dfe8f0'); const sgz = gz + (gz > 0 ? -s.r * .6 : s.r * .6);
  sgn.position.set(gx + 10, height(gx + 10, sgz) + 4, sgz); scene.add(sgn);
}
/* 启动页「岛屿一览」:由九馆 CATS + WORLDS + 海上传奇自动生成,与游戏数据同步 */
{
  const el = document.getElementById('isleList');
  if (el) {
    const row = (i, n, d) => `<div class="iRow"><span>${i}</span><b>${esc(n)}</b><i>${esc(d)}</i></div>`;
    let h = '<div class="iHd">🐋 收藏之岛(主岛九大馆)</div>';
    h += Object.values(CATS).map(c => row(c.icon, c.name, `${c.tot} ${c.unit}的完整收藏`)).join('');
    const isCombo = w2 => (w2.desc || '').startsWith('组合岛');
    h += '<div class="iHd">⛵ 渡口通往的世界(文学与传奇之岛)</div>';
    h += WORLDS.filter(w2 => w2.key !== 'xiyou' && !isCombo(w2)).map(w2 => row(w2.icon, w2.name, w2.desc || w2.note || '')).join('');
    h += '<div class="iHd">🧭 组合群岛(现实地貌 × 文学主题的原创融合)</div>';
    h += WORLDS.filter(isCombo).map(w2 => row(w2.icon, w2.name, (w2.desc || '').replace('组合岛:', ''))).join('');
    h += '<div class="iHd">🌊 海上另有传奇</div>';
    h += [['🐺', '幽灵号', '海狼拉森的黑帆猎船(北海)'], ['🎣', '"我们在这儿"号', '《怒海余生》的纽芬兰渔船(东北渔场)'],
      ['🎩', '福克先生的邮轮', '八十天环游地球(东海)'], ['🍾', '格兰特船长的瓶中信', '37°11′——在南海漂着'],
      ['🕊️', '大鹏', '主岛栖石,乘之扶摇环游诸岛'], ['🤿', '海底隧道迷宫', '蓝洞潜入,串联 33 座岛的世界骨架'], ['🏯', '天空之城', '勒皮他飞岛,乘大鹏直上云端']]
      .map(([i, n, d]) => row(i, n, d)).join('');
    el.innerHTML = h;
  }
}
/* ===== 🛂 环球护照:踏上一座岛,自动盖一枚章 ===== */
const PASSPORT = [
  ['收藏之岛', '🐋'], ['灯塔屿', '🗼'], ['楚门的世界', '📺'], ['中土', '💍'],
  ['霍格沃茨', '⚡'], ['南塔开特', '🐳'], ['体育岛', '⚽'],
  ...ISLES.map(z2 => [z2.name, z2.icon]),
];
const stamps = new Set((() => {   // 兼容旧名单格式,新格式为 PASSPORT 索引(存档码更短)
  const raw = PSTORE.getItem('w1001.stamps') || '';
  if (!raw) return [];
  if (/^[0-9,]+$/.test(raw)) return raw.split(',').map(i9 => (PASSPORT[+i9] || [])[0]).filter(Boolean);
  return raw.split('|').filter(Boolean);
})());
function saveStamps() { PSTORE.setItem('w1001.stamps', [...stamps].map(nm9 => PASSPORT.findIndex(p9 => p9[0] === nm9)).filter(i9 => i9 >= 0).join(',')); }
saveStamps();   // 旧格式即时迁移
function addStamp(nm) {
  if (stamps.has(nm)) return;
  stamps.add(nm);
  saveStamps();
  const n = stamps.size, total = PASSPORT.length;
  toast(`🛂 环球护照 · 新盖章「${nm}」(${n}/${total})`); blip(700);
  if (n >= 10 && PSTORE.getItem('w1001.pass10') !== '1') { PSTORE.setItem('w1001.pass10', '1'); earnSB(20); setTimeout(() => toast('🛂 十岛达成 · ⚡+20——护照第一页,盖满了'), 1800); }
  if (n >= 30 && PSTORE.getItem('w1001.pass30') !== '1') { PSTORE.setItem('w1001.pass30', '1'); earnSB(50); stars++; saveQuest(); updateQuestHUD(); setTimeout(() => toast('🛂 三十岛达成 · ⚡+50 · ⭐+1——半个星球已在你脚下'), 1800); }
  if (n >= total && PSTORE.getItem('w1001.passall') !== '1') { PSTORE.setItem('w1001.passall', '1'); earnSB(120); stars++; saveQuest(); updateQuestHUD(); setTimeout(() => toast('🌍 全岛盖章!⚡+120 · ⭐+1 · 新称号「环球旅行家」——这颗星球,没有你没到过的岸'), 1800); }
}
let stampT = 0;
/* 🎪 事件景物 */
let evMeteors = null, evWhales = null, evKites = null, evT = 0;
if (EVENT === 'meteor') {
  evMeteors = [];
  for (let i = 0; i < 3; i++) {
    const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(-26, -9, 0)]),
      new THREE.LineBasicMaterial({ color: 0xeaf2ff, transparent: true, opacity: 0, fog: false }));
    scene.add(ln); evMeteors.push(ln);
  }
}
if (EVENT === 'whales') {
  evWhales = new THREE.Group();
  for (let i = 0; i < 3; i++) { const hump = new THREE.Mesh(new THREE.SphereGeometry(5 - i, 10, 8, 0, 6.283, 0, Math.PI / 2), lam(0x3e4a56));
    hump.scale.y = .5; hump.userData.off = i * 26; evWhales.add(hump); }
  scene.add(evWhales);
}
if (EVENT === 'kites') {
  evKites = new THREE.Group();
  const kc = [0xd94f6b, 0x2e86ab, 0xe8c12a, 0x2c7a4b];
  for (let i = 0; i < 4; i++) { const kite = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6),
      new THREE.MeshBasicMaterial({ color: kc[i], side: THREE.DoubleSide, fog: false }));
    kite.rotation.z = Math.PI / 4; kite.userData.ph = i * 1.7; kite.position.set(-60 + i * 44, 0, -140 - (i % 2) * 60); evKites.add(kite); }
  scene.add(evKites);
}
/* ===== ✈️ 鲸航 QJ:12 座机场(仅"现实上说得通"的岛设跑道) ===== */

const AIR_KEYS = new Set(AIRPORTS.filter(a => !a[4] && a[0] !== 'main').map(a => a[0]));   // 可通航的岛(渡口下架名单)
for (const [k3, nm3, ax, az] of AIRPORTS) {
  const ah3 = Math.max(height(ax, az), .4);
  const run = box(5, .25, 34, lam(0x565c64)); run.position.set(ax, ah3 + .3, az); scene.add(run);
  for (let i = 0; i < 5; i++) { const st4 = box(.5, .06, 2.2, lam(0xe8e4d8)); st4.position.set(ax, ah3 + .46, az - 12 + i * 6); scene.add(st4); }
  const hutA = box(3, 2.4, 2.4, lam(0xdfe3e8)); hutA.position.set(ax + 4.6, ah3 + 1.2, az + 8); scene.add(hutA); cirObs.push({ x: ax + 4.6, z: az + 8, r: 2 });
  const roofA = box(3.4, .3, 2.8, lam(0x3a6a9a)); roofA.position.set(ax + 4.6, ah3 + 2.55, az + 8); scene.add(roofA);
  const poleW = cyl(.06, .08, 3.6, M.woodDark, 5); poleW.position.set(ax + 4.6, ah3 + 4.3, az + 5.6); scene.add(poleW);
  const sock = new THREE.Mesh(new THREE.ConeGeometry(.28, 1.1, 6), lam(0xe8863c)); sock.rotation.z = Math.PI / 2; sock.position.set(ax + 5.2, ah3 + 5.6, az + 5.6); scene.add(sock);
  addSpot(ax + 4.6, az + 5.2, 'air', 'airport', { r: 8, airKey: k3 });
}
function openAirCounter(fromKey) {
  const from = AIRPORTS.find(a => a[0] === fromKey); if (!from) return;
  const fake9 = !!from[4];
  const rows = AIRPORTS.filter(a => a[0] !== fromKey && !a[4]).map((a, i) => {
    const d = Math.round(Math.hypot(a[2] - from[2], a[3] - from[3]));
    const delayed = fake9 || (WEATHER === 'storm' && (i + new Date().getDate()) % 2 === 0);   // ⛈️ 风暴天半数延误;楚门的航班永远起不飞
    return { a, d, price: Math.max(5, Math.round(d / 80)), fno: 'QJ-' + (101 + i * 8), delayed };
  }).sort((x, y) => x.d - y.d);
  cardBody.innerHTML = `<div class="cardHead" style="background:#24303e">✈️ ${esc(from[1])}</div>
    <div class="cardDesc" style="font-size:12.5px;line-height:1.7;padding:12px 20px 4px">鲸航 QJ · ${fake9 ? '很抱歉,今天的航班全部取消了。明天也是。后天大概也是。(售票员冲你露出电视广告般的微笑)' : WEATHER === 'storm' ? '⛈️ 风暴过境,半数航班延误,请改期或改乘帆船(勇者)。' : '今日航班全部准点。'}航线仅覆盖设有机场的 ${AIRPORTS.length} 座岛——巫师们、麻瓜科技禁令、还有大多数古典海岛,都婉拒了跑道。买不到机票的地方,才是船和自行车的浪漫。</div>
    <div style="padding:4px 16px 16px">${rows.map(r5 => `<div class="gRow"><div class="gi">✈️</div><div class="gInfo"><b>${esc(r5.a[1])}</b><div class="gDesc">${r5.fno} · 直线 ${r5.d} 米 · 飞行片刻</div></div>${r5.delayed ? (fake9 ? '<button class="gBtn" disabled>已取消</button>' : '<button class="gBtn" disabled>⛈️ 延误</button>') : `<button class="gBtn" data-fly="${r5.a[0]}" data-price="${r5.price}" ${sb < r5.price ? 'disabled' : ''}>${r5.price} ⚡</button>`}</div>`).join('')}</div>`;
  modal.classList.remove('hidden'); modalOpen = true;
  cardBody.querySelectorAll('[data-fly]').forEach(b2 => b2.addEventListener('click', () => {
    const dest = AIRPORTS.find(a => a[0] === b2.dataset.fly); if (!dest) return;
    if (!spendSB(+b2.dataset.price)) return;
    vehicle = 0; bikeGrp.visible = boatGrp.visible = false;
    closeModals(); blip(660);
    toast('🛫 登机、滑跑、离地——舷窗外,群岛缩成了一张海图');
    setTimeout(() => {
      player.position.set(dest[2] + 2.5, Math.max(height(dest[2] + 2.5, dest[3] + 2), 0) + 1.2, dest[3] + 2); vy = 0;
      toast('🛬 ' + dest[1] + ' 到了 · 感谢乘坐鲸航'); blip(720);
    }, 1000);
  }));
}
/* 三仙岛蜃楼:蓬莱、方丈——远望可见,近之则隐(loop 里按距离渐隐) */
const mirages = [];
for (const [mx, mz, s] of [[1640, 1080, 1], [1240, 1240, .78]]) {
  const g = new THREE.Group(); const mats = [];
  const mm2 = op => { const m2 = new THREE.MeshBasicMaterial({ color: 0xbfd8e8, transparent: true, opacity: op, fog: false, depthWrite: false }); m2.userData.base = op; mats.push(m2); return m2; };
  const hill = new THREE.Mesh(new THREE.ConeGeometry(52 * s, 40 * s, 9), mm2(.32)); hill.position.y = 8; g.add(hill);
  const pk2 = new THREE.Mesh(new THREE.ConeGeometry(20 * s, 26 * s, 7), mm2(.28)); pk2.position.set(16 * s, 26 * s, 8 * s); g.add(pk2);
  for (let i = 0; i < 3; i++) { const pag = new THREE.Mesh(new THREE.BoxGeometry(6 * s, 4 * s, 6 * s), mm2(.3)); pag.position.set(-8 * s + i * 3, 22 * s + i * 5, -4 * s); g.add(pag);
    const pr2 = new THREE.Mesh(new THREE.ConeGeometry(5 * s, 3 * s, 4), mm2(.3)); pr2.rotation.y = .78; pr2.position.set(-8 * s + i * 3, 25 * s + i * 5, -4 * s); g.add(pr2); }
  g.position.set(mx, 0, mz); g.userData.mats = mats; scene.add(g); mirages.push(g);
}
{   // 海市船队:两千年前出海求药的船队,还在海上——追之则散
  const g = new THREE.Group(); const mats = [];
  const mm3 = op => { const m3 = new THREE.MeshBasicMaterial({ color: 0xcfe0e8, transparent: true, opacity: op, fog: false, depthWrite: false }); m3.userData.base = op; mats.push(m3); return m3; };
  for (let i = 0; i < 5; i++) {
    const ship = new THREE.Group(); const s2 = .8 + (i % 3) * .25;
    const hull2 = new THREE.Mesh(new THREE.BoxGeometry(11 * s2, 2.4 * s2, 3.4 * s2), mm3(.3)); hull2.position.y = 2; ship.add(hull2);
    const deck2 = new THREE.Mesh(new THREE.BoxGeometry(5 * s2, 2.6 * s2, 2.6 * s2), mm3(.26)); deck2.position.set(-1.5 * s2, 4.4, 0); ship.add(deck2);
    for (const mxo of [-3.4, .5, 3.6]) { const mast2 = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, 7.5 * s2, 5), mm3(.3)); mast2.position.set(mxo * s2, 6.4, 0); ship.add(mast2);
      const sail2 = new THREE.Mesh(new THREE.PlaneGeometry(2.8 * s2, 4.4 * s2), mm3(.24)); sail2.position.set(mxo * s2, 7 * s2 > 5 ? 6.8 : 6.2, .1); ship.add(sail2); }
    const a0 = i / 5 * Math.PI * 2, rr = 42 + (i % 2) * 22;
    ship.position.set(Math.cos(a0) * rr, 0, Math.sin(a0) * rr);
    ship.rotation.y = -a0 - Math.PI / 2;
    g.add(ship);
  }
  g.position.set(1600, 0, 1180); g.userData.mats = mats; g.userData.orbit = .016;
  scene.add(g); mirages.push(g);
}
/* 海洋文学带故事线 NI_QUESTS → w-config.js(纯数据模块,顶部 import) *//* 海洋文学带故事线 NI_QUESTS → w-config.js(纯数据模块,顶部 import) */
const NIQ_BY_LORE = {}, NIQ_BY_FLAG = {};
for (const k in NI_QUESTS) { const q = Object.assign({ flag: 'nq_' + k, key: k }, NI_QUESTS[k]); NIQ_BY_LORE[q.lore] = q; NIQ_BY_FLAG[q.flag] = q; }
/* ===== 海底隧道迷宫 · 洞穴潜水(导绳=关键装备)===== */
/* 迷宫拓扑/分区/门/发现点/出入口 → w-maze.js(纯数据模块,顶部 import) */
let diving = false, diveEntry = 0, diveAir = 100, nearPortal = -1, diveLight = null;
let mazeWhale = null, tidalHeart = null, sonarRing = null, sonarT = 0, sonarCD = 0, airChamberT = 0, gateHintT = 0, diveZone = 0;
let causticLight = null, causticTex = null;
let abyssLight = null, MAZE_FLOW = null, MAZE_DIST = null, RAPIDS = new Set(), flowPts = null, nearEdge = 0;
/* 👣 沙滩脚印 / ⛵ 船尾迹 / 🫧 潜水气泡(小对象池) */
const steps9 = [], stepGeo9 = new THREE.CircleGeometry(.17, 6), stepMat9 = new THREE.MeshBasicMaterial({ color: 0x7a6a4e, transparent: true, opacity: .4, depthWrite: false });
let stepT9 = 0, stepSide9 = 1;
const wakes9 = [], wakeGeo9 = new THREE.CircleGeometry(.5, 8), wakeMat9 = new THREE.MeshBasicMaterial({ color: 0xeef6f4, transparent: true, opacity: .3, depthWrite: false });
let wakeT9 = 0;
let bubPts9 = null, bubY09 = null, bubI9 = 0, smokePts9 = null, smokeSeed9 = null;
{
  const NB9 = 48, ba9 = new Float32Array(NB9 * 3).fill(-999); bubY09 = new Float32Array(NB9);
  const bg9 = new THREE.BufferGeometry(); bg9.setAttribute('position', new THREE.BufferAttribute(ba9, 3));
  bubPts9 = new THREE.Points(bg9, new THREE.PointsMaterial({ color: 0xcfeefc, size: 1.4, transparent: true, opacity: .55, sizeAttenuation: false, depthWrite: false }));
  bubPts9.frustumCulled = false; bubPts9.visible = false; scene.add(bubPts9);
}
let babelBook = null, babelDust = null;
const babelLamps = [];
const jellies = [];
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
    if (i === 14) continue;   // 巴别海窟自带六壁书房,不套岩壁球(否则挡死无限回廊)
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
  /* 巴别海窟(满月门后):博尔赫斯式六边形图书馆——
     五层书架·三十二册书脊 / 名为"灯"的球形果实 / 门厅螺旋梯 / 两侧无限回廊(逐级缩小变暗的错觉) */
  { const n = MAZE_NODES[14], hex = new THREE.Group(); hex.position.set(n[0], n[1], n[2]);
    hex.add(new THREE.Mesh(new THREE.SphereGeometry(54, 18, 12), new THREE.MeshBasicMaterial({ color: 0x05080f, side: THREE.BackSide, fog: false })));   // 密闭外壳:封住天空透光,让无限回廊没入黑暗
    // 书脊贴图:深底上三十二道随机高矮/色相的窄书脊
    const bcv = document.createElement('canvas'); bcv.width = 256; bcv.height = 48; const bx2 = bcv.getContext('2d');
    bx2.fillStyle = '#10141c'; bx2.fillRect(0, 0, 256, 48);
    const r7 = mulberry32(1001);
    for (let i = 0; i < 32; i++) { const bw2 = 5 + r7() * 3, x = i * 8 + 1, h2 = 30 + r7() * 14;
      bx2.fillStyle = `hsl(${(r7() * 360) | 0},${35 + r7() * 30}%,${34 + r7() * 22}%)`; bx2.fillRect(x, 48 - h2, bw2, h2);
      bx2.fillStyle = 'rgba(255,220,150,.5)'; bx2.fillRect(x, 48 - h2 + 3, bw2, 1); }
    const spineTex = new THREE.CanvasTexture(bcv);
    const woodM = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: .8 });
    // 主室:六壁(±X 两面留门),每壁五层书架
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * 6.283, doorway = (i === 0 || i === 3);
      const wx5 = Math.cos(a) * 8, wz5 = Math.sin(a) * 8, ry = -a + Math.PI / 2;
      if (doorway) {   // 门框:两柱一楣,门外是"无限"
        for (const s of [-1, 1]) { const post = box(1.2, 12, .8, woodM); post.position.set(wx5 + Math.sin(a) * s * 3.4, 0, wz5 - Math.cos(a) * s * 3.4); post.rotation.y = ry; hex.add(post); }
        const lintel = box(8.2, 1.4, .8, woodM); lintel.position.set(wx5, 5.3, wz5); lintel.rotation.y = ry; hex.add(lintel);
        continue;
      }
      const wall = box(9, 12, .6, new THREE.MeshStandardMaterial({ color: 0x161c28, roughness: 1 })); wall.position.set(wx5, 0, wz5); wall.rotation.y = ry; hex.add(wall);
      for (let s = 0; s < 5; s++) {
        const sy = -4.6 + s * 2.15;
        const board = box(7.4, .22, .9, woodM); board.position.set(Math.cos(a) * 7.3, sy, Math.sin(a) * 7.3); board.rotation.y = ry; hex.add(board);
        const spines = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.6), new THREE.MeshBasicMaterial({ map: spineTex, fog: false }));
        spines.position.set(Math.cos(a) * 7.62, sy + 1, Math.sin(a) * 7.62); spines.rotation.y = ry + Math.PI; hex.add(spines);
      }
    }
    // 地面/穹顶:六角磨石地 + 暗顶
    const flr = new THREE.Mesh(new THREE.CircleGeometry(8.4, 6), new THREE.MeshPhongMaterial({ color: 0x1a2230, shininess: 80 })); flr.rotation.x = -Math.PI / 2; flr.rotation.z = Math.PI / 6; flr.position.y = -6; hex.add(flr);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(5.6, .08, 6, 6), new THREE.MeshBasicMaterial({ color: 0x8a6a2a, fog: false })); rim.rotation.x = Math.PI / 2; rim.rotation.z = Math.PI / 6; rim.position.y = -5.9; hex.add(rim);
    const ceil2 = new THREE.Mesh(new THREE.CircleGeometry(8.4, 6), new THREE.MeshStandardMaterial({ color: 0x0c1016, roughness: 1 })); ceil2.rotation.x = Math.PI / 2; ceil2.rotation.z = Math.PI / 6; ceil2.position.y = 6; hex.add(ceil2);
    // 名为"灯"的球形果实:每室横放两枚,暖光呼吸
    for (const s of [-1, 1]) {
      const wire = cyl(.03, .03, 2.2, woodM, 4); wire.position.set(s * 3.2, 4.9, 0); hex.add(wire);
      const fruit = new THREE.Mesh(new THREE.SphereGeometry(.55, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffe0a8, fog: false })); fruit.position.set(s * 3.2, 3.6, 0); hex.add(fruit);
      const fl3 = new THREE.PointLight(0xffd9a0, 1.1, 26, 2); fl3.position.set(s * 3.2, 3.6, 0); hex.add(fl3);
      babelLamps.push({ mesh: fruit, light: fl3, ph: s });
    }
    // 门厅螺旋梯(-Z 侧):深不见底、高不见顶
    { const sc = new THREE.Group(); sc.position.set(0, 0, 5.2);
      const col2 = cyl(.34, .34, 12.4, woodM, 8); sc.add(col2);
      for (let k = 0; k < 18; k++) { const st = box(2.1, .16, .8, woodM); const aa = k * .62; st.position.set(Math.cos(aa) * 1.25, -5.8 + k * .68, Math.sin(aa) * 1.25); st.rotation.y = -aa; sc.add(st); }
      hex.add(sc); }
    // 中央「总目之书」:悬浮翻开的书,缓缓旋转
    { babelBook = new THREE.Group();
      for (const s of [-1, 1]) { const page = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.05), new THREE.MeshBasicMaterial({ color: 0xf5ecd2, fog: false, side: THREE.DoubleSide })); page.rotation.z = s * .42; page.rotation.x = -.2; page.position.x = s * .68; babelBook.add(page); }
      const spine2 = box(.14, .1, 1.05, M.gold); babelBook.add(spine2);
      const halo = new THREE.PointLight(0xfff2cc, 1.3, 18, 2); halo.position.y = .6; babelBook.add(halo);
      babelBook.position.y = -.6; hex.add(babelBook); }
    // 两侧「无限回廊」:逐级缩小、变暗的六边形门洞,消失在雾里
    for (const dir of [-1, 1]) for (let k = 1; k <= 4; k++) {
      const s2 = Math.pow(.78, k), dim = Math.pow(.62, k), dx6 = dir * (10.5 + k * 8.2 * s2);
      const fm = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x2a2018).multiplyScalar(dim), roughness: .9 });
      for (const s of [-1, 1]) { const p2 = box(1.1 * s2, 11.6 * s2, .7 * s2, fm); p2.position.set(dx6, 0, s * 3.4 * s2); hex.add(p2); }
      const l2 = box(.7 * s2, 1.3 * s2, 7.6 * s2, fm); l2.position.set(dx6, 5.1 * s2, 0); hex.add(l2);
      for (const s of [-1, 1]) { const strip = new THREE.Mesh(new THREE.PlaneGeometry(6.4 * s2, .5 * s2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xc8a86a).multiplyScalar(dim), fog: false })); strip.rotation.y = Math.PI / 2; strip.position.set(dx6 + dir * 3.6 * s2, s * 1.6 * s2, 0); hex.add(strip); }
      const dot = new THREE.Mesh(new THREE.SphereGeometry(.32 * s2, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffe0a8).multiplyScalar(Math.max(dim, .18)), fog: false })); dot.position.set(dx6, 3.4 * s2, 0); hex.add(dot);
    }
    // 金色微尘:字母在暗处漂浮
    { const DN = 70, dp = new Float32Array(DN * 3), r8 = mulberry32(888);
      for (let i = 0; i < DN; i++) { dp[i * 3] = (r8() - .5) * 13; dp[i * 3 + 1] = (r8() - .5) * 10; dp[i * 3 + 2] = (r8() - .5) * 13; }
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
      babelDust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xd8b86a, size: .14, transparent: true, opacity: .75, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      hex.add(babelDust); }
    diveGroup.add(hex); }
  /* 深渊竖井:星球之脐(暗色巨缆没入地核 + 幽蓝搏动) */
  { const n = MAZE_NODES[43];
    const cable = cyl(1.6, 2.2, 34, new THREE.MeshStandardMaterial({ color: 0x141820, roughness: .8, metalness: .3 }), 10);
    cable.position.set(n[0], n[1] - 17, n[2]); diveGroup.add(cable);
    for (let i = 0; i < 4; i++) { const vein = cyl(.16, .16, 30, new THREE.MeshBasicMaterial({ color: 0x3a7a9a, fog: false }), 5); vein.position.set(n[0] + Math.cos(i * 1.57) * 1.9, n[1] - 15, n[2] + Math.sin(i * 1.57) * 1.9); diveGroup.add(vein); }
    abyssLight = new THREE.PointLight(0x3a9ab8, 1.2, 50, 2); abyssLight.position.set(n[0], n[1] - 4, n[2]); diveGroup.add(abyssLight); }
  { // 🚇 隧道静态合并:管体/洞窟按分区材质各并为一(潜水 draw call 大降)
    const gset9 = new Set(gateMeshes);
    const byM9 = new Map();
    for (const o of [...diveGroup.children]) {
      if (!o.isMesh || gset9.has(o) || o.name || o.children.length) continue;
      if (!(o.geometry.type === 'CylinderGeometry' || o.geometry.type === 'SphereGeometry')) continue;
      if (!zoneMats.includes(o.material)) continue;
      let l9 = byM9.get(o.material); if (!l9) { l9 = []; byM9.set(o.material, l9); }
      l9.push(o);
    }
    let rm9 = 0;
    for (const [mt9, list9] of byM9) {
      if (list9.length < 4) continue;
      const geos9 = list9.map(o => { o.updateWorldMatrix(true, false); return o.geometry.clone().applyMatrix4(o.matrixWorld).toNonIndexed(); });
      let mg9 = null; try { mg9 = mergeGeometries(geos9, false); } catch (e) {}
      if (!mg9) continue;
      mg9.computeBoundingSphere();
      list9.forEach(o => diveGroup.remove(o));
      diveGroup.add(new THREE.Mesh(mg9, mt9));
      rm9 += list9.length;
    }
    console.log('🚇 隧道合并:', rm9, '个网格 →', byM9.size, '个分区体');
  }
  { // 🌅 蓝洞神光柱:每个出口竖井一束天光(潜水时的 god rays)
    const sg9 = [];
    for (const p9 of MAZE_PORTALS) {
      const n9 = MAZE_NODES[p9.n];
      const h9 = -n9[1] + 2;
      const c9 = new THREE.CylinderGeometry(TUBE_R * .5, TUBE_R * .85, h9, 8, 1, true);
      c9.translate(n9[0], n9[1] + h9 / 2, n9[2]);
      sg9.push(c9.toNonIndexed());
    }
    let mg9 = null; try { mg9 = mergeGeometries(sg9, false); } catch (e) {}
    if (mg9) {
      const shaft9 = new THREE.Mesh(mg9, new THREE.MeshBasicMaterial({ color: 0x9adcff, transparent: true, opacity: .07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      shaft9.frustumCulled = false;
      diveGroup.add(shaft9);
    }
  }
  { // ⚓ 新发现道具:31 商队残箱(沉船墓地) / 39 鲸骨珍珠(鲸骨王朝)
    const n31 = MAZE_NODES[31];
    const crate9 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.3, 1.5), new THREE.MeshLambertMaterial({ color: 0x5e4a30 }));
    crate9.rotation.y = .6; crate9.position.set(n31[0] + 3, n31[1] - TUBE_R + 1, n31[2] - 2); diveGroup.add(crate9);
    for (let k9 = 0; k9 < 3; k9++) { const coin9 = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .06, 8), new THREE.MeshBasicMaterial({ color: 0xd9b64a, fog: false })); coin9.position.set(n31[0] + 1.6 + k9 * .8, n31[1] - TUBE_R + .5, n31[2] - .6 + k9 * .5); diveGroup.add(coin9); }
    const n39 = MAZE_NODES[39];
    const shell9 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x9a8f7c }));
    shell9.position.set(n39[0] - 3, n39[1] - TUBE_R + .6, n39[2] + 2); diveGroup.add(shell9);
    const pearl9 = new THREE.Mesh(new THREE.SphereGeometry(.55, 10, 8), new THREE.MeshBasicMaterial({ color: 0xf2ecdc, fog: false }));
    pearl9.position.set(n39[0] - 3, n39[1] - TUBE_R + 1.3, n39[2] + 2); diveGroup.add(pearl9);
  }
  /* 海流:每条隧道的流向 = 指向"更接近出口"的一端(BFS 距最近蓝洞) */
  MAZE_FLOW = (() => {
    const adj = {}; MAZE_EDGES.forEach(([a, b]) => { (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a); });
    const dist = new Array(MAZE_NODES.length).fill(1e9), q = [];
    for (const p of MAZE_PORTALS) { dist[p.n] = 0; q.push(p.n); }
    while (q.length) { const n = q.shift(); for (const m of (adj[n] || [])) if (dist[m] > dist[n] + 1) { dist[m] = dist[n] + 1; q.push(m); } }
    MAZE_DIST = dist;   // 各节点距最近出口的跳数(调试/后续玩法可用)
    return MAZE_EDGES.map(([a, b]) => dist[b] < dist[a] ? 1 : (dist[a] < dist[b] ? -1 : 0));
  })();
  /* 🌊 急流管:最长的有向隧道(至多 6 条),水推增强、流光加密加速 */
  RAPIDS = new Set(MAZE_EDGES
    .map(([a, b], ei) => [ei, MAZE_FLOW[ei] ? Math.hypot(MAZE_NODES[b][0] - MAZE_NODES[a][0], MAZE_NODES[b][1] - MAZE_NODES[a][1], MAZE_NODES[b][2] - MAZE_NODES[a][2]) : 0])
    .filter(p9 => p9[1] > 0)
    .sort((p9, q9) => q9[1] - p9[1]).slice(0, 6).map(p9 => p9[0]));
  /* 🧭 出口岛名牌:52 个蓝洞各自悬浮目的地名称(迷宫真正的痛点是认出口,不是找出口) */
  {
    const texCache9 = new Map();
    const mkTex9 = txt9 => {
      let m9 = texCache9.get(txt9);
      if (m9) return m9;
      const cv9 = document.createElement('canvas'); cv9.width = 256; cv9.height = 64;
      const c9 = cv9.getContext('2d');
      c9.fillStyle = 'rgba(6,20,26,.78)'; c9.fillRect(0, 0, 256, 64);
      c9.strokeStyle = '#5ff0ff'; c9.lineWidth = 4; c9.strokeRect(3, 3, 250, 58);
      c9.fillStyle = '#aef6ff'; c9.font = 'bold 26px sans-serif'; c9.textAlign = 'center';
      c9.fillText('▲ ' + txt9, 128, 42);
      const tex9 = new THREE.CanvasTexture(cv9); tex9.colorSpace = THREE.SRGBColorSpace;
      m9 = new THREE.SpriteMaterial({ map: tex9, transparent: true, fog: false, depthWrite: false });
      texCache9.set(txt9, m9);
      return m9;
    };
    for (const p9 of MAZE_PORTALS) {
      const n9 = MAZE_NODES[p9.n];
      const sp9 = new THREE.Sprite(mkTex9(p9.isle));   // isle 字段即中文岛名
      sp9.position.set(n9[0], n9[1] + TUBE_R + 4.5, n9[2]);
      sp9.scale.set(12, 3, 1);
      diveGroup.add(sp9);
    }
  }
  /* 海流粒子:顺流漂动的微光(第三重指引:跟着水流走=朝出口走) */
  { const FN2 = MOBILE ? 120 : 240;
    const fg2 = new THREE.BufferGeometry(); fg2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FN2 * 3), 3));
    flowPts = new THREE.Points(fg2, new THREE.PointsMaterial({ color: 0x9adcde, size: .55, transparent: true, opacity: .65, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    flowPts.frustumCulled = false;
    const fe = new Uint16Array(FN2), ft = new Float32Array(FN2), fo = new Float32Array(FN2 * 2), r6 = mulberry32(777);
    const RAP9 = [...RAPIDS];
    for (let i = 0; i < FN2; i++) { fe[i] = (i % 3 === 0 && RAP9.length) ? RAP9[(r6() * RAP9.length) | 0] : (r6() * MAZE_EDGES.length) | 0; ft[i] = r6(); fo[i * 2] = (r6() - .5) * 6; fo[i * 2 + 1] = (r6() - .5) * 6; }
    flowPts.userData = { FN2, fe, ft, fo };
    diveGroup.add(flowPts); }
  /* 深海生物:珊瑚回廊的水母 + 星象水道的浮游荧光 */
  for (const ni of [3, 12, 26, 36]) { const n = MAZE_NODES[ni], jf = new THREE.Group();
    const bell = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8, 0, 6.283, 0, Math.PI / 2), new THREE.MeshPhongMaterial({ color: 0xc8a0e8, transparent: true, opacity: .45, side: THREE.DoubleSide })); jf.add(bell);
    for (let i = 0; i < 4; i++) { const tt = cyl(.03, .03, 1.6, new THREE.MeshBasicMaterial({ color: 0xb08ad0, transparent: true, opacity: .5 }), 4); tt.position.set(Math.cos(i * 1.57) * .4, -.9, Math.sin(i * 1.57) * .4); jf.add(tt); }
    jf.position.set(n[0] + 3, n[1] + 2, n[2] - 2); jf.userData = { by: n[1] + 2, ph: ni }; diveGroup.add(jf); jellies.push(jf); }
  { const pts2 = []; MAZE_EDGES.forEach(([a, b]) => { if (NODE_ZONE[a] !== 2 && NODE_ZONE[b] !== 2) return; const A = MAZE_NODES[a], B = MAZE_NODES[b];
      for (let k = 0; k < 8; k++) { const tt2 = Math.random(); pts2.push(A[0] + (B[0] - A[0]) * tt2 + (Math.random() - .5) * 7, A[1] + (B[1] - A[1]) * tt2 + (Math.random() - .5) * 5, A[2] + (B[2] - A[2]) * tt2 + (Math.random() - .5) * 7); } });
    const pg2 = new THREE.BufferGeometry(); pg2.setAttribute('position', new THREE.Float32BufferAttribute(pts2, 3));
    diveGroup.add(new THREE.Points(pg2, new THREE.PointsMaterial({ color: 0x6a9aff, size: .32, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }))); }
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
  for (let ei = 0; ei < MAZE_EDGES.length; ei++) {
    const [a, b] = MAZE_EDGES[ei];
    const A = MAZE_NODES[a], B = MAZE_NODES[b];
    const abx = B[0] - A[0], aby = B[1] - A[1], abz = B[2] - A[2];
    const L2 = abx * abx + aby * aby + abz * abz;
    let tt = ((px - A[0]) * abx + (py - A[1]) * aby + (pz - A[2]) * abz) / (L2 || 1);
    tt = tt < 0 ? 0 : tt > 1 ? 1 : tt;
    const qx = A[0] + abx * tt, qy = A[1] + aby * tt, qz = A[2] + abz * tt;
    const d = Math.hypot(px - qx, py - qy, pz - qz);
    if (d < best) { best = d; cx = qx; cy = qy; cz = qz; nearEdge = ei; }
  }
  const n14b = MAZE_NODES[14];
  const R = (Math.hypot(px - n14b[0], py - n14b[1], pz - n14b[2]) < 10) ? 7.4 : TUBE_R - 1.3;   // 巴别书房内活动范围放宽
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
  diving = true; diveEntry = pi; diveAir = gearOn('mask') ? 200 : 100; modalOpen = false;
  vehicle = 0; bikeGrp.visible = boatGrp.visible = false;
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
/* 未竟之都:无人会议(主线终章) */
/* 幻影运动会:夜里点燃冷火炬,幽蓝的选手绕场跑完他们等了一百年的比赛 */
let unjGamesT = 0, unjGamesGrp = null, unjFlame = null;
function startUnjGames() {
  if (curDA >= .35 && !location.hash.includes('night')) { toast('🔥 守夜人摇头:白天点不出那种光。等夜幕降临再来。'); return; }
  const sx = UNJ.x + 52, sz = UNJ.z + 52;
  if (!unjGamesGrp) {
    unjGamesGrp = new THREE.Group();
    const gm = new THREE.MeshBasicMaterial({ color: 0x9fd8e8, transparent: true, opacity: .3, fog: false, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 8; i++) { const r = new THREE.Group();
      const body2 = cyl(.32, .38, 1.5, gm, 8); body2.position.y = 1.1; r.add(body2);
      const head2 = new THREE.Mesh(new THREE.SphereGeometry(.3, 8, 6), gm); head2.position.y = 2.15; r.add(head2);
      r.userData = { a0: i / 8 * Math.PI * 2, sp: .55 + (i % 4) * .12 }; unjGamesGrp.add(r); }
    unjFlame = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3, 9), new THREE.MeshBasicMaterial({ color: 0xffb45a, transparent: true, opacity: .85, fog: false, blending: THREE.AdditiveBlending, depthWrite: false }));
    unjFlame.position.set(sx, 15.4, sz - 14); unjGamesGrp.add(unjFlame);
    const fl3 = new THREE.PointLight(0xffa04a, 0, 90, 2); fl3.position.set(sx, 15.5, sz - 14); unjGamesGrp.add(fl3); unjGamesGrp.userData.light = fl3;
    scene.add(unjGamesGrp);
  }
  unjGamesT = 75; unjGamesGrp.visible = true; unjGamesGrp.userData.light.intensity = 30;
  toast('🔥 圣火腾起!幽蓝的身影从看台涌上跑道——这场比赛,他们等了一百年。'); blip(880);
  if (PSTORE.getItem('w1001.unjgames') !== '1') {
    PSTORE.setItem('w1001.unjgames', '1'); earnSB(25); stars++; saveQuest(); updateQuestHUD();
    setTimeout(() => toast('🏟️ 幻影运动会 · ⚡+25 ⭐+1——没有观众,守夜人在鼓掌,风也在。'), 2600);
  }
}
/* 群岛考据线终章:四份考据 → 装订《群岛互文考》 */
function showKaoEssay() {
  cardBody.innerHTML = `<div class="paper"><div class="pMast">群岛互文考</div>
    <div class="pSub">群岛考据学会 · 会刊创刊号(亦为终刊号)</div>
    <div class="pHead">这不是群岛,是一本被海水打散的书</div>
    <div class="pBody">考据四则,兹录其要:矿工五十年前听见的凿壁声,与迷宫正中的搏动同源——隧道不是天然的,是有人在写(考据一);进化群岛被请离的那位客人,后来在西北的岛上自称博士——一页的反派,原是另一页的伏笔(考据二);真名石与三百盏灯说的是同一句话:语言的尽头不是理解,是相守(考据三);石仓里留下的人与荒岛上想回去的人,忠于的都是同一件事——自己选定的生活(考据四);蜃楼近之则隐,桃源不载于图,却都容留过不抱目的的人——「不可至」,是最古老的邀请函(考据五);被说了五十五遍的城至今灯火通明,画了一千张图纸的城只剩海风——城市是被讲述建成的(考据六)。<br><br>
    结论:五十六座岛互为注脚。所谓幻想地球,是一本被海水打散的书;而每一位旅人,都是它的装订线。</div>
    <div class="pFoot">主编:群岛考据学会(会员一人)· 特约校对:一位旅人 · 藏于未竟之都和平港</div></div>
    <div style="padding:12px 20px 16px"><button class="again" data-kaoclose style="width:100%">📚 签名装订</button></div>`;
  modal.classList.remove('hidden'); modalOpen = true;
  cardBody.querySelector('[data-kaoclose]')?.addEventListener('click', () => closeModals());
  if (PSTORE.getItem('w1001.kaodone') !== '1') {
    PSTORE.setItem('w1001.kaodone', '1'); earnSB(30); stars++; saveQuest(); updateQuestHUD();
    toast('📚 《群岛互文考》装订完成 · ⚡+30 · ⭐+1 · 新称号「群岛考据学家」'); blip(900);
  }
}
/* 记者调查线终章:三份档案 → 替她把最后一篇报道打出来 *//* 记者调查线终章:三份档案 → 替她把最后一篇报道打出来 */
function showUnjNews() {
  cardBody.innerHTML = `<div class="paper"><div class="pMast">世界报</div>
    <div class="pSub">LE JOURNAL DU MONDE · 终刊号 · 迟到一百余年</div>
    <div class="pHead">未竟之都:一座城市的讣告,或情书</div>
    <div class="pBody">本报记者踏勘港口、法庭与工地,查得三证:数十箱原封退回的烫金邀请函(邮戳:查无此意愿);一沓停在 1914 年夏天的电报底稿(最后半句是"战争恐怕——");以及最后一次工地会议记录("城是给后人建的,后人会来接着开")。<br><br>
    于是真相并不复杂:杀死这座城的不是资本,不是战争,甚至不是虚荣——是"全人类"这个收件人,当年查无此址。<br><br>
    但本报仍需更正一处旧闻:它没有失败。每条海底隧道至今通向它的广场,每个旅人仍在它的断塔下抬头。一座城市若能让路过的人想把它建完——它就还在施工中。</div>
    <div class="pFoot">主笔:旧时代记者 × 一位旅人 · 印数:2 份(她一份,你一份)· 全世界的读者:你,和风</div></div>
    <div style="padding:12px 20px 16px"><button class="again" data-signoff style="width:100%">🗞️ 签下你的名字,发稿</button></div>`;
  modal.classList.remove('hidden'); modalOpen = true;
  cardBody.querySelector('[data-signoff]')?.addEventListener('click', () => closeModals());
  if (PSTORE.getItem('w1001.unjnews') !== '1') {
    PSTORE.setItem('w1001.unjnews', '1'); earnSB(30); stars++; saveQuest(); updateQuestHUD();
    toast('🗞️ 最后一篇报道已发 · ⚡+30 ⭐+1 · 新称号「迟到百年的头版」'); blip(900);
  }
}
function unjMeeting() {
  cardBody.innerHTML = `<div class="cardHead" style="background:#3a4456">🕊️ 无人会议 · The Congress of Nobody</div>
    <div class="cardMedia"><div class="paperRoll">🗣️</div></div>
    <div class="cardTitle"><h3>投影亮起,幻影入座</h3><div class="en">Plaza of Nations</div></div>
    <div class="cardDesc">干涸的喷泉喷出光,空座位上坐满半透明的"代表"。争论开始:<br><br>
    <b>科学馆代表:</b>"给我们十年,战争将变成一个技术问题。"<br>
    <b>艺术馆代表:</b>"你们的技术上一次带来的,是毒气。"<br>
    <b>小岛代表:</b>"谁有资格代表人类?这间屋子里,连一个渔民都没有。"<br>
    <b>翻译员(轻声):</b>"诸位说的其实是同一个词:害怕。"<br><br>
    光影转向你——这座城的命运,由在场唯一的真人决定。</div>
    <div style="text-align:center;padding:0 0 16px;display:flex;flex-direction:column;gap:8px;align-items:center">
      <button class="again" data-unjend="1">🔧 修复城市——让它成为各岛的交通中心</button>
      <button class="again" data-unjend="2">🏚️ 保持废墟——作为乌托邦失败的纪念馆</button>
      <button class="again" data-unjend="3">🌿 改为开放花园——不再代表人类,只收集旅人的故事</button>
    </div>`;
  modal.classList.remove('hidden'); modalOpen = true;
  cardBody.querySelectorAll('[data-unjend]').forEach(b => b.addEventListener('click', () => {
    const c = b.dataset.unjend; PSTORE.setItem('w1001.unjend', c);
    earnSB(40); stars++; saveQuest(); updateQuestHUD(); closeModals();
    toast(['', '🔧 起重机重新转动。也许有一天,它会真的完工。', '🏚️ 就让它这样立着——作为对一切宏大之物的提醒。', '🌿 喷泉重新喷水了。从今天起,这里只收集旅人的故事——包括你的。'][+c] + ' ⚡+40 · ⭐+1');
    if (c === '3') unjFountainOn = true;
    blip(523); setTimeout(() => blip(659), 150); setTimeout(() => blip(784), 320);
  }));
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
    if (farD2 > 78400) {   // 280 米外整体隐身(省 draw call),走近再现身
      if (n.g.visible) { n.g.visible = false; n.bub.classList.add('hidden'); n.talk = false; }
      continue;
    }
    if (!n.g.visible && !n.night && !n.day) n.g.visible = true;
    if (n.night || n.day) {   // 昼夜限定 NPC(兰若寺)
      const show = n.night ? curDA < .35 : curDA >= .35;
      n.g.visible = show;
      if (!show) { n.bub.classList.add('hidden'); n.talk = false; continue; }
    }
    const p = n.g.position;
    const zzz = npcSleeping(n);
    if (!zzz && n.path) {   // 🚶 沿真实街道散步(OSM 路网)
      const P9 = n.path, ln = P9.ln, tgt = ln[P9.i];
      const tx = P9.ox + tgt[0], tz = P9.oz + tgt[1];
      const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
      if (d < 1.3) { P9.i += P9.dir; if (P9.i >= ln.length || P9.i < 0) { P9.dir *= -1; P9.i += P9.dir * 2; if (P9.i < 0) P9.i = 0; if (P9.i >= ln.length) P9.i = ln.length - 1; } }
      else { const sp9 = 4.2 * dt; p.x += dx / d * sp9; p.z += dz / d * sp9; n.g.rotation.y = Math.atan2(dx, dz); n.phase += dt * 8; }
      p.y = Math.max(heightMesh(p.x, p.z), 0);
    } else if (!zzz && n.wander) {
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
      p.y = Math.max(heightMesh(p.x, p.z), 0);
    } else { n.phase += dt * 2.2; }
    const moving9 = !zzz && ((n.wander && n.wp) || n.path);
    n.g.children[0].scale.y = 1 + Math.sin(n.phase) * (moving9 ? .05 : (zzz ? .012 : .02));
    animLimbs(n.g, zzz ? (n.phase += dt * .9) : n.phase, moving9 ? .5 : (zzz ? .02 : .06));
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
        n.bub.innerHTML = `<b>${n.name}</b>:${zzz ? "💤 …(鼾声)" : (dqFor(n.name) ? "❗ " : "") + n.lines[n.idx]}`;
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
    const h = heightMesh(x, z);
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
  if (!mctx || mm.style.display === 'none') return;   // 常驻小地图已撤(M/N 唤出大图)
  if (!mmBase) buildMinimapBase();
  mctx.drawImage(mmBase, 0, 0);
  const W2X = x => (x / 3950 + .5) * mm.width, W2Y = z => (.5 - z / 3850) * mm.height;   // 北朝上
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
  mctx.fillStyle = '#bfe9ff';   // 天空之城
  mctx.beginPath(); mctx.arc(W2X(SKY.x), W2Y(SKY.z), 2.6, 0, 7); mctx.fill();
  if (mobyWhale && mobyWhale.position.y > -2.5) {   // 浮出的白鲸
    mctx.fillStyle = '#ffffff';
    mctx.beginPath(); mctx.arc(W2X(mobyWhale.position.x), W2Y(mobyWhale.position.z), 2.2, 0, 7); mctx.fill();
  }
  // 玩家朝向箭头
  const px = W2X(player.position.x), py = W2Y(player.position.z);
  mctx.save(); mctx.translate(px, py); mctx.scale(1, -1); mctx.rotate(-camYaw);   // 随地图翻转镜像
  mctx.fillStyle = '#fff';
  mctx.beginPath(); mctx.moveTo(0, -5); mctx.lineTo(3.4, 4); mctx.lineTo(-3.4, 4); mctx.closePath(); mctx.fill();
  mctx.restore();
}

/* --- 世界地图(M) --- */
const bigmapEl = $('bigmap'), bigCv = $('bigmapCv'), bigCtx = bigCv ? bigCv.getContext('2d') : null;
let bigBase = null;
const MAP_LABELS = [
  ['收藏之岛', 0, -60], ['灯塔屿', IS2.x, IS2.z], ['楚门的世界', TRU.x, TRU.z], ['中土', MID.x, MID.z],
  ['霍格沃茨', HOG.x, HOG.z], ['南塔开特', MOB.x, MOB.z], ['体育岛', SPT.x, SPT.z], ['天空之城', SKY.x, SKY.z], ['山海经', SHJ.x, SHJ.z],
  ['一千零一夜', ANH.x, ANH.z], ['鹦鹉螺锚地', NEM.x, NEM.z], ['B-612', B612.x, B612.z], ['侏罗纪公园', JUR.x, JUR.z],
  ['花果山', HGS.x, HGS.z], ['爱丽丝仙境', ALC.x, ALC.z], ['赤壁', CBI.x, CBI.z], ['兰若寺', LRS.x, LRS.z],
  ['梁山泊', LSP.x, LSP.z], ['风车原野', FCY.x, FCY.z], ['伊夫堡', YFB.x, YFB.z], ['绝望岛', RBX.x, RBX.z],
  ['大观园', DGY.x, DGY.z], ['炼狱山', PUR.x, PUR.z], ['未竟之都', UNJ.x, UNJ.z], ['塞壬海域⚠', SIR.x, SIR.z],
  ...NISLES.map(s => [NI_CONTENT[s.key].name, s.x, s.z]),
];
function renderBigMap() {
  if (!bigCtx) return;
  const W3 = bigCv.width, H3 = bigCv.height, SC2 = 4000;
  const BX = x => (x / SC2 + .5) * W3, BY = z => (.5 - z / (SC2 * H3 / W3)) * H3;   // 北朝上
  if (!bigBase) {
    bigBase = document.createElement('canvas'); bigBase.width = W3; bigBase.height = H3;
    const c = bigBase.getContext('2d');
    const img = c.createImageData(W3, H3);
    for (let py = 0; py < H3; py += 2) for (let px = 0; px < W3; px += 2) {
      const x = (px / W3 - .5) * SC2, z = (.5 - py / H3) * (SC2 * H3 / W3);
      const h = heightMesh(x, z);
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
    c.strokeStyle = 'rgba(160,200,230,.06)'; c.lineWidth = 1;   // 经纬细网
    for (let gx2 = 0; gx2 <= W3; gx2 += W3 / 8) { c.beginPath(); c.moveTo(gx2, 0); c.lineTo(gx2, H3); c.stroke(); }
    for (let gy2 = 0; gy2 <= H3; gy2 += H3 / 8) { c.beginPath(); c.moveTo(0, gy2); c.lineTo(W3, gy2); c.stroke(); }
    { c.save(); c.translate(64, H3 - 74); c.globalAlpha = .85;   // 罗盘玫瑰
      c.strokeStyle = 'rgba(220,230,240,.5)'; c.lineWidth = 1.4;
      c.beginPath(); c.arc(0, 0, 30, 0, 7); c.stroke();
      c.beginPath(); c.arc(0, 0, 22, 0, 7); c.stroke();
      for (let i = 0; i < 4; i++) { c.save(); c.rotate(i * Math.PI / 2);
        c.fillStyle = i === 0 ? '#ffd76a' : 'rgba(240,240,230,.85)';
        c.beginPath(); c.moveTo(0, -29); c.lineTo(5, -5); c.lineTo(-5, -5); c.closePath(); c.fill(); c.restore(); }
      for (let i = 0; i < 4; i++) { c.save(); c.rotate(i * Math.PI / 2 + Math.PI / 4);
        c.fillStyle = 'rgba(220,226,232,.45)';
        c.beginPath(); c.moveTo(0, -19); c.lineTo(3.4, -4); c.lineTo(-3.4, -4); c.closePath(); c.fill(); c.restore(); }
      c.font = 'bold 12px sans-serif'; c.textAlign = 'center';
      c.fillStyle = '#ffd76a'; c.fillText('N', 0, -38);
      c.fillStyle = 'rgba(240,240,230,.7)'; c.fillText('S', 0, 48); c.fillText('E', 42, 4); c.fillText('W', -42, 4);
      c.restore(); }
    { const vg = c.createRadialGradient(W3 / 2, H3 / 2, H3 * .42, W3 / 2, H3 / 2, H3 * .8);   // 暗角
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(2,8,16,.42)');
      c.fillStyle = vg; c.fillRect(0, 0, W3, H3); }
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
/* 直航(渡口卡与海图点选共用):k=世界键 */
function ferryGo(k) {
    const dests = { truman: [694, 624], lotr: [-150, -558], hp: [588, -492], mainstation: [146, -84], mob: [120, 702], sport: [-688, 122],
      shj: [SHJ.x, SHJ.z + 112], anh: [ANH.x, ANH.z - 106], nem: [NEM.x, NEM.z - 70], b612: [B612.x, B612.z - 48], jur: [JUR.x, JUR.z - 120],
      hgs: [HGS.x, HGS.z + 118], alc: [ALC.x, ALC.z + 102], cbi: [CBI.x, CBI.z + 110], lrs: [LRS.x, LRS.z + 92], lsp: [LSP.x + 118, LSP.z],
      fcy: [FCY.x, FCY.z - 112], yfb: [YFB.x, YFB.z - 88], rbx: [RBX.x, RBX.z - 96], dgy: [DGY.x, DGY.z + 102],
      pur: [PUR.x, PUR.z + PUR.r + 18], unj: [UNJ.x, UNJ.z + UNJ.r + 14], main: [372, 12] };
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
      : k === 'unj' ? '🏛️ 未竟之都到了。广播还在循环:"欢迎来到人类共同的首都。"——港口空无一人'
      : (NI_MSG[k] || '🐋 回到收藏之岛(主世界)'));
}
function mapKey(globe) {   // M=平面 N=地球仪:关→开对应视图;开→同视图关/异视图切
  if (!bigmapEl) return;
  const open = !bigmapEl.classList.contains('hidden');
  if (!open) { if (globeOn !== globe) setGlobe(globe); syncMapTitle(); toggleBigMap(); return; }
  if (globeOn === globe) toggleBigMap();
  else { setGlobe(globe); syncMapTitle(); }
}
function syncMapTitle() {
  const t2 = document.getElementById('mapTitle');
  if (t2) t2.textContent = globeOn ? '🌐 幻想地球仪' : '🗺️ 多元宇宙海图';
}
function toggleBigMap() {
  if (!bigmapEl) return;
  const opening = bigmapEl.classList.contains('hidden');
  if (opening) { renderBigMap(); bigmapEl.classList.remove('hidden'); modalOpen = true; syncMapTitle(); if (globeOn) startGlobe(); }
  else { bigmapEl.classList.add('hidden'); modalOpen = false; cancelAnimationFrame(globeRAF); }
}
/* --- 🌐 地球仪视图:海图烘焙图贴球(A 方案)--- */
let globeOn = PSTORE.getItem('w1001.mapmode') !== 'flat', globeInit = false, globeR = null, globeScene = null, globeCam = null, globeGrp = null, globeCv = null, globeMk = null, globeRAF = 0, globeDrag = null;
const globeRot = { x: -.3, y: -Math.PI / 2 };
let globeDist = 3.4;
function initGlobe() {
  globeCv = document.createElement('canvas');
  globeCv.style.cssText = 'max-width:86vw;max-height:72vh;border-radius:10px;display:none;touch-action:none;cursor:grab;background:radial-gradient(ellipse at 42% 36%, #0c1a30 0%, #050b18 55%, #020509 100%)';
  bigCv.parentElement.insertBefore(globeCv, bigCv.nextSibling);
  globeR = new THREE.WebGLRenderer({ canvas: globeCv, antialias: true, alpha: true });
  globeR.setSize(760, 700, false);
  globeCam = new THREE.PerspectiveCamera(38, 760 / 700, .1, 60);
  globeScene = new THREE.Scene();
  const tex = new THREE.CanvasTexture(bigBase); tex.colorSpace = THREE.SRGBColorSpace;
  globeGrp = new THREE.Group();
  const gSphere = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshBasicMaterial({ map: tex }));
  globeGrp.add(gSphere); globeGrp.userData.sphere = gSphere;
  globeGrp.add(new THREE.Mesh(new THREE.SphereGeometry(1.002, 24, 16), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, wireframe: true, transparent: true, opacity: .06 })));   // 经纬网
  globeGrp.add(new THREE.Mesh(new THREE.SphereGeometry(1.06, 32, 24), new THREE.MeshBasicMaterial({ color: 0x6fb8ff, transparent: true, opacity: .1, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })));   // 大气辉光
  globeMk = new THREE.Mesh(new THREE.SphereGeometry(.02, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd76a }));
  globeGrp.add(globeMk);
  const COMBO_COLS = { gala: 0x6ac08a, moai: 0x8fa8e8, fogjail: 0x8a929a, kilda: 0xb8c4d0, gunkan: 0x6a7684, soco: 0xc05a4a, skell: 0xd8d2c2, mada: 0x8ac06a, helena: 0xb0a8c8, komodo: 0xc8a04a, sanxian: 0x9fc8e8, shixia: 0xd8ccb0, taozhen: 0xf0b8c8, venezia: 0x6ab0c8, saga: 0xbfe8f0, atl: 0x9ab0c0, aeol: 0xd0e8a0, tusi: 0xc09a6a, qq: 0xf0a05a, wg: 0x9fb8d8 };
  for (const s2 of NISLES) {   // 十六座组合岛:迷宫浮标同色的星点
    const c2 = COMBO_COLS[s2.key]; if (!c2) continue;
    const d2 = new THREE.Mesh(new THREE.SphereGeometry(.013, 8, 6), new THREE.MeshBasicMaterial({ color: c2 }));
    d2.position.copy(globeVec(s2.x, s2.z)).multiplyScalar(1.008); globeGrp.add(d2);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(.022, 8, 6), new THREE.MeshBasicMaterial({ color: c2, transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.position.copy(d2.position); globeGrp.add(halo);
  }
  globeScene.add(globeGrp);
  { const pts = [];   // 星幕
    for (let i = 0; i < 260; i++) { const a = Math.random() * 6.283, b = Math.acos(Math.random() * 2 - 1), rr = 20; pts.push(rr * Math.sin(b) * Math.cos(a), rr * Math.cos(b), rr * Math.sin(b) * Math.sin(a)); }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    globeScene.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xcfe0ff, size: .07, transparent: true, opacity: .8, fog: false }))); }
  globeCv.addEventListener('pointerdown', e => { e.preventDefault(); globeDrag = { x: e.clientX, y: e.clientY }; globeCv.setPointerCapture(e.pointerId); globeCv.style.cursor = 'grabbing'; });
  globeCv.addEventListener('pointermove', e => {
    if (!globeDrag) return;
    globeRot.y += (e.clientX - globeDrag.x) * .006;
    globeRot.x = Math.max(-1.2, Math.min(1.2, globeRot.x + (e.clientY - globeDrag.y) * .006));
    globeDrag = { x: e.clientX, y: e.clientY };
  });
  for (const ev of ['pointerup', 'pointercancel']) globeCv.addEventListener(ev, () => { globeDrag = null; globeCv.style.cursor = 'grab'; });
  globeCv.addEventListener('wheel', e => { e.preventDefault(); globeDist = Math.max(2.2, Math.min(6, globeDist + e.deltaY * .002)); }, { passive: false });
  let gDown = null;
  globeCv.addEventListener('pointerdown', e => { gDown = [e.clientX, e.clientY]; });
  globeCv.addEventListener('pointerup', e => {
    if (!gDown || Math.hypot(e.clientX - gDown[0], e.clientY - gDown[1]) > 6) { gDown = null; return; }
    gDown = null;
    const r2 = globeCv.getBoundingClientRect();
    const nd = new THREE.Vector2(((e.clientX - r2.left) / r2.width) * 2 - 1, -((e.clientY - r2.top) / r2.height) * 2 + 1);
    const rc = new THREE.Raycaster(); rc.setFromCamera(nd, globeCam);
    const hit = rc.intersectObject(globeGrp.userData.sphere)[0];
    if (!hit || !hit.uv) return;
    mapPick((hit.uv.x - .5) * 4000, (hit.uv.y - .5) * 4000);
  });
}
function globeVec(wx, wz) {   // 世界坐标 → 单位球面(与 SphereGeometry UV 同式)
  const u = wx / 4000 + .5, v = wz / 4000 + .5, th = (1 - v) * Math.PI, ph = u * Math.PI * 2;
  return new THREE.Vector3(-Math.cos(ph) * Math.sin(th), Math.cos(th), Math.sin(ph) * Math.sin(th));
}
let arcLine = null, arcDot = null, arcT = -1, arcPending = null;
function startArc(entry) {   // 直航大圆弧:起点=玩家,终点=目的岛
  const a = globeVec(player.position.x, player.position.z), b = globeVec(entry[2], entry[3]);
  const om = Math.acos(Math.min(1, Math.max(-1, a.dot(b)))) || .0001, pts = [];
  for (let i = 0; i <= 48; i++) {
    const t2 = i / 48;
    const p2 = a.clone().multiplyScalar(Math.sin((1 - t2) * om) / Math.sin(om)).add(b.clone().multiplyScalar(Math.sin(t2 * om) / Math.sin(om)));
    pts.push(p2.normalize().multiplyScalar(1.018 + Math.sin(t2 * Math.PI) * .07));   // 弧线离面一点,中段更高
  }
  if (arcLine) globeGrp.remove(arcLine);
  arcLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xffd76a, transparent: true, opacity: .95 }));
  arcLine.geometry.setDrawRange(0, 0); arcLine.userData.pts = pts; globeGrp.add(arcLine);
  if (!arcDot) { arcDot = new THREE.Mesh(new THREE.SphereGeometry(.017, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff2cc })); globeGrp.add(arcDot); }
  arcDot.visible = true; arcT = 0;
  arcPending = entry[0];
}
function globeTick() {
  if (!globeDrag && arcT < 0) globeRot.y += .0016;   // 闲置缓转(航迹播放时不转)
  if (arcT >= 0 && arcLine) {
    arcT += .014;
    const k = Math.min(48, Math.floor(arcT * 48));
    arcLine.geometry.setDrawRange(0, k + 1);
    arcDot.position.copy(arcLine.userData.pts[k]);
    if (arcT >= 1.25) {   // 弧画完稍作停留 → 启航
      globeGrp.remove(arcLine); arcLine = null; arcDot.visible = false; arcT = -1;
      const k2 = arcPending; arcPending = null;
      toggleBigMap(); ferryGo(k2);
      return;
    }
  }
  globeGrp.rotation.set(globeRot.x, globeRot.y, 0);
  globeCam.position.set(0, 0, globeDist);
  globeR.render(globeScene, globeCam);
}
function globeFrame() {
  if (!globeOn || bigmapEl.classList.contains('hidden')) return;
  globeTick();
  globeRAF = requestAnimationFrame(globeFrame);
}
function startGlobe() {
  renderBigMap();   // 确保 bigBase 已烘焙(纹理源)
  if (!globeInit) { globeInit = true; initGlobe(); }
  globeMk.position.copy(globeVec(player.position.x, player.position.z)).multiplyScalar(1.012);
  bigCv.style.display = 'none'; globeCv.style.display = '';
  const b0 = document.getElementById('btnGlobe'); if (b0) b0.textContent = '🗺️ 平面海图';
  cancelAnimationFrame(globeRAF); globeFrame();
}
function setGlobe(on) {
  globeOn = on;
  PSTORE.setItem('w1001.mapmode', on ? 'globe' : 'flat');
  if (on) startGlobe();
  else { cancelAnimationFrame(globeRAF); if (globeCv) globeCv.style.display = 'none'; bigCv.style.display = ''; }
  const b = document.getElementById('btnGlobe'); if (b) b.textContent = on ? '🗺️ 平面海图' : '🌐 地球仪';
  syncMapTitle();
}
document.getElementById('btnGlobe')?.addEventListener('click', () => setGlobe(!globeOn));
/* ===== 💌 明信片:照片模式里按 C / 点 📸 拍摄,帧末从渲染画布取图合成 ===== */
let pcPending = false;
const btnSnap = document.createElement('button');
btnSnap.textContent = '📸 明信片 (C)';
btnSnap.style.cssText = 'display:none;position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:30;border:none;border-radius:999px;padding:10px 22px;background:rgba(16,34,52,.85);color:#ffd76a;font-size:14px;touch-action:manipulation';
document.body.appendChild(btnSnap);
btnSnap.addEventListener('click', () => { pcPending = true; });
const PC_REPLIES = [
  '收到了。窗外的海,和你拍的这一片,是同一片。',
  '照片钉在墙上了。原来我住的地方,在别人眼里这么好看。',
  '风把邮票都吹卷了边,可画面一点没皱。谢谢你路过这里。',
  '我把它读了两遍:一遍看风景,一遍找你站的位置。',
  '下次别只寄照片——把讲这张照片的那顿茶也留下来。',
  '收到明信片的人有个特权:可以假装自己也去过了。',
];
/* ===== 🍜 群岛食单:八道地方味,吃出一个称号 ===== */


const eaten = new Set((PSTORE.getItem('w1001.eaten') || '').split(',').filter(Boolean));
if (eaten.size >= 9 && PSTORE.getItem('w1001.foodie') !== '1') { PSTORE.setItem('w1001.foodie', '1'); stars++; saveQuest(); updateQuestHUD(); }   // 自愈:老档补发环球食客
const BUFF = { run: 0, ride: 0 };
const buffBar = document.createElement('div');
buffBar.style.cssText = 'position:fixed;left:14px;top:118px;z-index:26;display:flex;flex-direction:column;gap:4px;align-items:flex-start;pointer-events:none;font:600 12px system-ui;color:#fff';
document.body.appendChild(buffBar);
let buffSyncT = 0, buffShown = '';
function syncBuffs(dt) {
  buffSyncT -= dt; if (buffSyncT > 0) return; buffSyncT = .5;
  const rows = [];
  if (chowderT > 0) rows.push('🏊 游泳提速 ' + Math.ceil(chowderT) + 's');
  if (BUFF.run > 0) rows.push('🏃 奔跑 +12% ' + Math.ceil(BUFF.run) + 's');
  if (BUFF.ride > 0) rows.push('🚲 骑行 +15% ' + Math.ceil(BUFF.ride) + 's');
  const key = rows.join('|');
  if (key === buffShown) return; buffShown = key;
  buffBar.innerHTML = rows.map(r => '<span style="background:rgba(20,30,44,.58);padding:3px 11px;border-radius:20px">' + r + '</span>').join('');
}
function openFood(fid) {
  const F = FOODS.find(f => f[0] === fid); if (!F) return;
  const had = eaten.has(fid);
  cardBody.innerHTML = `<div class="cardHead" style="background:#5a4a2e">${F[2]} 小吃摊 · ${esc(F[1])}</div>
    <div class="cardMedia"><div class="paperRoll">${F[2]}</div></div>
    <div class="cardDesc">${esc(F[4])}<br><span style="color:#2c7a4b;font-size:12.5px">功效:${F[6]}</span>${had ? '<br><span style="color:#8a7c62;font-size:12px">✅ 已录入食单(' + eaten.size + '/9)</span>' : ''}</div>
    <div style="text-align:center;padding:0 0 16px"><button class="again" data-eat="${fid}" ${sb < F[3] ? 'disabled' : ''}>来一份 · ${F[3]} ⚡</button></div>`;
  modal.classList.remove('hidden'); modalOpen = true;
  cardBody.querySelector('[data-eat]')?.addEventListener('click', () => {
    if (!spendSB(F[3])) return;
    if (F[5] === 'swim') chowderT = 180; else BUFF[F[5]] = 180;
    if (!eaten.has(fid)) {
      eaten.add(fid); PSTORE.setItem('w1001.eaten', [...eaten].join(','));
      if (eaten.size >= 9 && PSTORE.getItem('w1001.foodie') !== '1') { PSTORE.setItem('w1001.foodie', '1'); stars++; saveQuest(); updateQuestHUD(); setTimeout(() => toast('🍜 九道地方味集齐!新称号「环球食客」+⭐——胃比护照先环游了世界'), 1500); }
      else toast(F[2] + ' 好吃!食单收录(' + eaten.size + '/9)· ' + F[6]);
    } else toast(F[2] + ' 熟悉的味道 · ' + F[6]);
    const dq9 = (DQ || []).find(q => q.t === 'food' && q.f === fid && q.s === 0);
    if (dq9) { dq9.s = 1; saveDQ(); setTimeout(() => toast('🥡 多打包了一份——给 ' + dq9.n + ' 带去'), 1400); }
    blip(700); closeModals();
  });
}
for (const [fid, fx9, fz9] of FOOD_SPOTS) {
  const fh9 = Math.max(height(fx9, fz9), .3);
  const stl = box(2.6, .9, 1.8, lam(0x6a4a2e)); stl.position.set(fx9, fh9 + .8, fz9); scene.add(stl); cirObs.push({ x: fx9, z: fz9, r: 1.6 });
  const aw = box(3, .16, 2.2, lam(0xc0492b)); aw.position.set(fx9, fh9 + 2.5, fz9); scene.add(aw);
  for (const ox of [-1.3, 1.3]) { const pp = cyl(.07, .09, 2.2, M.woodDark, 5); pp.position.set(fx9 + ox, fh9 + 1.5, fz9); scene.add(pp); }
  addSpot(fx9, fz9 + 2, 'food', 'food', { r: 6, fid });
}
/* ===== 👘 裁缝铺:披风 · 帽子 · 围巾(玩家换装) ===== */


let WD = { capes: [], hats: [], scarf: 0, eq: { c: -1, h: -1, s: 0 } };
try { const w0 = JSON.parse(PSTORE.getItem('w1001.wardrobe') || 'null'); if (w0 && w0.eq) WD = w0; } catch (e) {}
const saveWD = () => PSTORE.setItem('w1001.wardrobe', JSON.stringify(WD));
const fitGrp = new THREE.Group(); fitGrp.name = 'outfit';   // 玩家在下方才创建,届时挂载
function applyOutfit() {
  while (fitGrp.children.length) fitGrp.remove(fitGrp.children[0]);
  if (WD.eq.c >= 0) { const cape = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.5), new THREE.MeshLambertMaterial({ color: CAPES[WD.eq.c][1], side: THREE.DoubleSide }));
    cape.position.set(0, 1.55, -.42); cape.rotation.x = .12; fitGrp.add(cape); }
  if (WD.eq.h >= 0) { const st = HATS[WD.eq.h][2];
    if (st === 'straw') { const b1 = cyl(.62, .62, .07, lam(HATS[0][1]), 12); b1.position.y = 2.62; fitGrp.add(b1); const c1 = cyl(.3, .34, .22, lam(HATS[0][1]), 10); c1.position.y = 2.74; fitGrp.add(c1); }
    else if (st === 'top') { const b2 = cyl(.44, .44, .06, lam(HATS[1][1]), 12); b2.position.y = 2.6; fitGrp.add(b2); const c2 = cyl(.3, .3, .42, lam(HATS[1][1]), 10); c2.position.y = 2.84; fitGrp.add(c2); }
    else { const hd = new THREE.Mesh(new THREE.ConeGeometry(.42, .62, 8), lam(HATS[2][1])); hd.position.y = 2.78; hd.rotation.x = .16; fitGrp.add(hd); } }
  if (WD.eq.s) { const sc = new THREE.Mesh(new THREE.TorusGeometry(.34, .1, 6, 12), lam(0xd9a62e)); sc.rotation.x = Math.PI / 2; sc.position.y = 2.18; fitGrp.add(sc); }
}
function openTailor() {
  const row9 = (nm, price, owned, worn, act) => `<div class="gRow"><div class="gi">👘</div><div class="gInfo"><b>${nm}</b></div>${worn ? '<span style="color:#2c7a4b;font-size:12px">✅ 穿着</span>' : owned ? `<button class="gBtn" ${act}>穿上</button>` : `<button class="gBtn" ${act} ${sb < price ? 'disabled' : ''}>${price} ⚡</button>`}</div>`;
  cardBody.innerHTML = `<div class="cardHead" style="background:#4a3a5a">👘 千帆裁缝铺 · The Sailmaker Tailor</div>
    <div class="cardDesc" style="font-size:12.5px;padding:12px 20px 4px">"帆布做披风,最懂风。"——买过即入衣橱,随时免费换穿。<button class="gBtn off" data-naked style="float:right;padding:4px 10px;font-size:11px">全部脱下</button></div>
    <div style="padding:4px 16px 16px">
      ${CAPES.map((c9, i9) => row9('披风 · ' + c9[0], 30, WD.capes.includes(i9), WD.eq.c === i9, `data-cape="${i9}"`)).join('')}
      ${HATS.map((h9, i9) => row9(h9[0], 25, WD.hats.includes(i9), WD.eq.h === i9, `data-hat="${i9}"`)).join('')}
      ${row9('暮金围巾', 15, WD.scarf > 0, WD.eq.s === 1, 'data-scarf')}
    </div>`;
  modal.classList.remove('hidden'); modalOpen = true;
  const buyEq = (owned, price, doEq) => { if (!owned && !spendSB(price)) return false; doEq(); saveWD(); applyOutfit(); blip(700); openTailor(); return true; };
  cardBody.querySelectorAll('[data-cape]').forEach(b9 => b9.addEventListener('click', () => { const i9 = +b9.dataset.cape; buyEq(WD.capes.includes(i9), 30, () => { if (!WD.capes.includes(i9)) WD.capes.push(i9); WD.eq.c = i9; }); }));
  cardBody.querySelectorAll('[data-hat]').forEach(b9 => b9.addEventListener('click', () => { const i9 = +b9.dataset.hat; buyEq(WD.hats.includes(i9), 25, () => { if (!WD.hats.includes(i9)) WD.hats.push(i9); WD.eq.h = i9; }); }));
  cardBody.querySelector('[data-naked]')?.addEventListener('click', () => { WD.eq = { c: -1, h: -1, s: 0 }; saveWD(); applyOutfit(); openTailor(); });
  cardBody.querySelector('[data-scarf]')?.addEventListener('click', () => { buyEq(WD.scarf > 0, 15, () => { WD.scarf = 1; WD.eq.s = 1; }); });
}
{ const tx9 = 52, tz9 = 236, th9 = height(tx9, tz9);
  const cnt9 = box(3.4, 1, 1.9, lam(0x4a3a5a)); cnt9.position.set(tx9, th9 + .9, tz9); scene.add(cnt9); cirObs.push({ x: tx9, z: tz9, r: 2 });
  const rf9 = box(4, .22, 2.5, lam(0x6a5a7c)); rf9.position.set(tx9, th9 + 3.2, tz9); scene.add(rf9);
  for (const ox of [-1.6, 1.6]) { const pp9 = cyl(.09, .11, 2.8, M.woodDark, 5); pp9.position.set(tx9 + ox, th9 + 1.8, tz9); scene.add(pp9); }
  addSpot(tx9, tz9 + 2.2, 'tailor', 'tailor', { r: 6 });
}
/* ===== 🏠 旅人小屋:置业 · 小憩 · 明信片墙 ===== */
const HOME_POS = [468, -96];
let homeBuilt = false, atticBuilt = false, gardenBuilt = false, mailGlow = null;
const homeLv = () => +(PSTORE.getItem('w1001.homelv') || 0);
function buildAttic() {
  if (atticBuilt) return; atticBuilt = true;
  const [hx9, hz9] = HOME_POS, hh9 = height(hx9, hz9);
  const dm9 = box(2.4, 1.7, 2, lam(0xa8845a)); dm9.position.set(hx9 - 1.5, hh9 + 4.7, hz9 + 1.1); scene.add(dm9);
  const dr9 = new THREE.Mesh(cong(1.9, 1.3, 4), lam(0x8c3b2e)); dr9.rotation.y = Math.PI / 4; dr9.position.set(hx9 - 1.5, hh9 + 6.1, hz9 + 1.1); scene.add(dr9);
  const dw9 = box(.9, .9, .12, lam(0xffe9b0)); dw9.position.set(hx9 - 1.5, hh9 + 4.8, hz9 + 2.12); scene.add(dw9);
}
function buildGarden() {
  if (gardenBuilt) return; gardenBuilt = true;
  const [hx9, hz9] = HOME_POS, hh9 = height(hx9, hz9);
  for (let i9 = 0; i9 < 9; i9++) {   // 门前栅栏
    const px9 = hx9 - 6 + i9 * 1.5;
    const pk9 = box(.16, 1, .1, lam(0xe8e0d0)); pk9.position.set(px9, height(px9, hz9 + 5.6) + .5, hz9 + 5.6); scene.add(pk9);
  }
  const rl9 = box(12.2, .12, .1, lam(0xe8e0d0)); rl9.position.set(hx9, hh9 + .78, hz9 + 5.6); scene.add(rl9);
  const FL9 = [0xe86a6a, 0xf0c04a, 0xb07ae8, 0xff9ec6];
  for (let i9 = 0; i9 < 8; i9++) {   // 花圃
    const fx9 = hx9 - 5 + (i9 % 4) * 3.2, fz9 = hz9 + 4 - Math.floor(i9 / 4) * .9;
    const st9 = cyl(.04, .04, .5, lam(0x3a6a2e), 5); st9.position.set(fx9, height(fx9, fz9) + .25, fz9); scene.add(st9);
    const bl9 = new THREE.Mesh(sphg(.2, 6, 5), lam(FL9[i9 % 4])); bl9.position.set(fx9, height(fx9, fz9) + .56, fz9); scene.add(bl9);
  }
  const gl9 = new THREE.PointLight(0xffc9d0, 0, 40, 2); gl9.position.set(hx9 - 4, hh9 + 2.4, hz9 + 4.6); gl9.userData.pow = 12; nightLamps.push(gl9); scene.add(gl9);
}
function buildHome() {
  if (homeBuilt) return; homeBuilt = true;
  const [hx9, hz9] = HOME_POS, hh9 = height(hx9, hz9);
  const hus9 = box(7, 3.6, 5.4, lam(0xa8845a)); hus9.position.set(hx9, hh9 + 1.8, hz9); scene.add(hus9); cirObs.push({ x: hx9, z: hz9, r: 4.4 });
  const rf99 = new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.6, 4), lam(0x8c3b2e)); rf99.rotation.y = Math.PI / 4; rf99.position.set(hx9, hh9 + 4.9, hz9); scene.add(rf99);
  const dr9 = box(1.1, 2, .16, lam(0x5e4023)); dr9.position.set(hx9, hh9 + 1, hz9 + 2.75); scene.add(dr9);
  for (const ox of [-2.2, 2.2]) { const wn9 = box(1, 1, .12, lam(0xbfe3ee)); wn9.position.set(hx9 + ox, hh9 + 2.1, hz9 + 2.72); scene.add(wn9); }
  const ch9 = box(.8, 1.6, .8, lam(0x6a5a52)); ch9.position.set(hx9 + 2.2, hh9 + 5.4, hz9 - 1); scene.add(ch9);
  const hl9 = new THREE.PointLight(0xffd9a0, 0, 60, 2); hl9.position.set(hx9, hh9 + 3.2, hz9 + 3.4); hl9.userData.pow = 18; nightLamps.push(hl9); scene.add(hl9);
  const mbP9 = cyl(.09, .11, 1.4, M.woodDark, 5); mbP9.position.set(hx9 + 4.6, hh9 + .7, hz9 + 3.2); scene.add(mbP9);   // 📮 信箱
  const mbB9 = box(1, .8, .7, lam(0xc0492b)); mbB9.position.set(hx9 + 4.6, hh9 + 1.7, hz9 + 3.2); scene.add(mbB9);
  const mbS9 = box(.7, .08, .1, lam(0x3a2a1a)); mbS9.position.set(hx9 + 4.6, hh9 + 1.78, hz9 + 3.56); scene.add(mbS9);
  mailGlow = new THREE.Mesh(sphg(.14, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd76a })); mailGlow.position.set(hx9 + 4.6, hh9 + 2.28, hz9 + 3.2); mailGlow.visible = false; scene.add(mailGlow);
  const sg9 = makeSign('🏠 旅人小屋', 5, '#4a3626', '#f0e0c0'); sg9.position.set(hx9 + 5, hh9 + 2.6, hz9 + 2); scene.add(sg9);
}
function openHome() {
  if (PSTORE.getItem('w1001.home') !== '1') {
    cardBody.innerHTML = `<div class="cardHead" style="background:#4a3626">🏠 无主小屋 · For Sale</div>
      <div class="cardMedia"><div class="paperRoll">🏠</div></div>
      <div class="cardDesc">主岛东滩一块带地基的空地,面朝日出,背靠机场——渔夫说这里"风都拐着弯吹"。地契在镇公所压了十年,等一个想停下来的旅人。</div>
      <div style="text-align:center;padding:0 0 16px"><button class="again" data-buyhome ${sb < 200 ? 'disabled' : ''}>购下地契 · 200 ⚡</button></div>`;
    modal.classList.remove('hidden'); modalOpen = true;
    cardBody.querySelector('[data-buyhome]')?.addEventListener('click', () => {
      if (!spendSB(200)) return;
      PSTORE.setItem('w1001.home', '1'); buildHome();
      toast('🏠 地契到手,小屋落成!——群岛再大,现在有一盏灯专门为你亮'); blip(760); closeModals();
    });
    return;
  }
  let cards9 = []; try { cards9 = JSON.parse(PSTORE.getItem('w1001.cards') || '[]'); } catch (e) {}
  const lv9 = homeLv();
  const wall9 = cards9.slice(-(lv9 >= 1 ? 6 : 3)).reverse().map(c9 => `<img src="${c9.d}" style="width:31%;border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,.3)">`).join(' ');
  const upg9 = lv9 < 1 ? `<button class="gBtn" data-upghome="1" ${sb < 400 ? 'disabled' : ''}>🔨 扩建阁楼 · 400 ⚡(明信片墙 3→6 张)</button>`
    : lv9 < 2 ? `<button class="gBtn" data-upghome="2" ${sb < 800 ? 'disabled' : ''}>🌷 修个花园 · 800 ⚡(小憩 5→8 分钟)</button>`
    : '<span style="font-size:12px;color:#8a7c62">🏡 满级宅邸——阁楼、花园,一样不缺</span>';
  cardBody.innerHTML = `<div class="cardHead" style="background:#4a3626">🏠 旅人小屋 · Home</div>
    <div class="cardDesc" style="font-size:12.5px;line-height:1.8;padding:12px 20px 6px">门牌:${({ spring: '🌸', summer: '🎐', autumn: '🍁', winter: '❄️' })[SEASON]} 今日 ${WEATHER === 'storm' ? '⛈️ 风暴' : WEATHER === 'rain' ? '🌧️ 雨' : WEATHER === 'fog' ? '🌫️ 雾' : '☀️ 晴'}${EVENT !== 'none' ? ' · ' + EVENTS[EVENT].icon + EVENTS[EVENT].name : ''} · 护照 ${stamps.size}/${PASSPORT.length} 章<br>${wall9 ? '明信片墙:<br>' + wall9 : '明信片墙还空着——照片模式(P)按 C 拍一张。'}</div>
    <div style="text-align:center;padding:4px 0 6px"><button class="again" data-nap>🛏️ 小憩片刻(恢复全部食物功效)</button></div>
    <div style="text-align:center;padding:0 0 6px"><button class="gBtn" data-mail>📮 信箱${unreadMail() ? '(未读 ' + unreadMail() + ')' : ''}</button></div>
    <div style="text-align:center;padding:0 0 16px">${upg9}</div>`;
  modal.classList.remove('hidden'); modalOpen = true;
  cardBody.querySelector('[data-nap]')?.addEventListener('click', () => {
    const nt9 = homeLv() >= 2 ? 480 : 300;
    chowderT = nt9; BUFF.run = nt9; BUFF.ride = nt9; diveAir = gearOn('mask') ? 200 : 100;
    toast(`🛏️ 在自己的床上眯了一觉——浑身是劲(全功效 ${nt9 / 60} 分钟)`); blip(720); closeModals();
  });
  cardBody.querySelector('[data-mail]')?.addEventListener('click', openMail);
  cardBody.querySelector('[data-upghome]')?.addEventListener('click', ev9 => {
    const lv0 = +ev9.currentTarget.dataset.upghome;
    if (!spendSB(lv0 === 1 ? 400 : 800)) return;
    PSTORE.setItem('w1001.homelv', String(lv0));
    if (lv0 === 1) { buildAttic(); toast('🔨 阁楼起好了!天窗朝着日出——明信片墙宽敞了一倍'); }
    else { buildGarden(); toast('🌷 花园修好了!栅栏、花圃、一盏粉灯——夜里回家有花香'); }
    blip(760); openHome();
  });
}
if (PSTORE.getItem('w1001.home') === '1') { buildHome(); if (homeLv() >= 1) buildAttic(); if (homeLv() >= 2) buildGarden(); }
else { const sg0 = makeSign('🏠 空地出售', 5, '#5a4a36', '#e8d8b0'); sg0.position.set(HOME_POS[0], height(HOME_POS[0], HOME_POS[1]) + 2.6, HOME_POS[1] + 3); scene.add(sg0); }
/* ===== 📮 家书:好感 ≥6 的居民会往信箱寄信(每日至多两封) ===== */
const MAIL_DATE = new Date().toLocaleDateString('zh-CN');


function letterFor(nm9, seed9) {
  const c9 = LETTER_TXT[nm9];
  if (c9) return c9[seed9 % c9.length];
  return LETTER_TPL[(seed9 + nm9.length) % LETTER_TPL.length].split('{n}').join(nm9);
}
function unreadMail() { try { return JSON.parse(PSTORE.getItem('w1001.mail') || '[]').filter(m9 => !m9.r).length; } catch (e) { return 0; } }
function syncMailGlow() { if (mailGlow) mailGlow.visible = unreadMail() > 0; }
(function mailInit() {
  let mail9 = []; try { mail9 = JSON.parse(PSTORE.getItem('w1001.mail') || '[]'); } catch (e) {}
  if (PSTORE.getItem('w1001.maildate') !== MAIL_DATE) {
    PSTORE.setItem('w1001.maildate', MAIL_DATE);
    const friends = Object.keys(AFF).filter(k9 => (AFF[k9] || {}).n >= 6);
    if (friends.length) {
      const seed9 = Math.floor(Date.now() / 864e5);
      const pick9 = new Set([friends[seed9 % friends.length]]);
      if (friends.length > 1 && seed9 % 3 !== 0) pick9.add(friends[(seed9 * 13 + 7) % friends.length]);
      for (const nm9 of pick9) mail9.push({ n: nm9, d: MAIL_DATE, t: letterFor(nm9, seed9), r: 0 });
      while (mail9.length > 30) mail9.shift();
      PSTORE.setItem('w1001.mail', JSON.stringify(mail9));
    }
  }
  syncMailGlow();
  if (PSTORE.getItem('w1001.home') === '1' && unreadMail()) setTimeout(() => toast('📮 家里的信箱有 ' + unreadMail() + ' 封未读来信'), 7000);
})();
function openMail() {
  let mail9 = []; try { mail9 = JSON.parse(PSTORE.getItem('w1001.mail') || '[]'); } catch (e) {}
  const rows9 = mail9.slice().reverse().map((m9, i9) => {
    const idx9 = mail9.length - 1 - i9;
    return `<div class="qRow" data-mailrow="${idx9}" style="cursor:pointer;flex-direction:column;align-items:flex-start"><span>${m9.r ? '📖' : '✉️'} <b>${esc(m9.n)}</b> <span style="color:#8a7c62;font-size:11px">${esc(m9.d)}</span></span>${m9.r ? `<span style="font-size:12.5px;color:#c4bda8;line-height:1.75;padding:4px 0 2px">${esc(m9.t)}</span>` : '<span style="font-size:11px;color:#8a7c62">(点开阅读)</span>'}</div>`;
  }).join('');
  cardBody.innerHTML = `<div class="cardHead" style="background:#4a3626">📮 旅人信箱</div>
    <div style="padding:10px 16px 10px">${rows9 || '<div style="color:#8a7c62;font-size:12.5px;padding:8px 2px">还没有来信——和居民交情到 ❤❤(好感 6)后,他们会开始给你写信。</div>'}</div>
    <div style="text-align:center;padding:0 0 14px"><button class="gBtn off" data-mailback>← 回小屋</button></div>`;
  modal.classList.remove('hidden'); modalOpen = true;
  cardBody.querySelectorAll('[data-mailrow]').forEach(r9 => r9.addEventListener('click', () => {
    const m9 = mail9[+r9.dataset.mailrow];
    if (m9 && !m9.r) { m9.r = 1; PSTORE.setItem('w1001.mail', JSON.stringify(mail9)); syncMailGlow(); blip(600); }
    openMail();
  }));
  cardBody.querySelector('[data-mailback]')?.addEventListener('click', openHome);
}
/* ===== 🚪 登门回访:好感 ≥9 的老友,隔三差五等在你家门口 ===== */
let visitGift9 = null;
(function visitInit() {
  try {
    if (PSTORE.getItem('w1001.home') !== '1') return;
    const today9 = new Date().toLocaleDateString('zh-CN');
    if (PSTORE.getItem('w1001.visitdate') === today9) return;
    const cand9 = Object.keys(AFF).filter(k9 => (AFF[k9] || {}).n >= 9);
    if (!cand9.length) return;
    const seed9 = Math.floor(Date.now() / 864e5);
    if (seed9 % 3 === 0) return;   // 三天约两访
    PSTORE.setItem('w1001.visitdate', today9);
    const nm9 = cand9[seed9 % cand9.length];
    visitGift9 = nm9;
    addNpc({ x: HOME_POS[0] - 5, z: HOME_POS[1] + 6, name: nm9, body: 0x8a6a4a, hat: 0x6a5a44, lines: [
      '路过,顺便来看看你——好房子!比信里写的还像样。',
      '门口那个信箱是我见过最神气的。我的信,你都收到了吧?',
      '不多留了。下回你到我那儿,我也站在门口等你。',
    ] });
    setTimeout(() => toast('🚪 ' + nm9 + ' 在你家门口等你——回家看看吧'), 9000);
  } catch (e) {}
})();
/* ===== 🍂 四季流转:按真实月份 ===== */
const SEASON = (m9 => m9 >= 3 && m9 <= 5 ? 'spring' : m9 >= 6 && m9 <= 8 ? 'summer' : m9 >= 9 && m9 <= 11 ? 'autumn' : 'winter')(new Date().getMonth() + 1);
let seasonPts = null;
(function seasonInit() {
  const CFG = { spring: [0xffb7c5, .5, 1.1], summer: [0xfff3d6, .32, -.5], autumn: [0xd98a3e, .5, 1.4], winter: [0xffffff, .42, 2.2] }[SEASON];
  const N9 = 90, arr9 = new Float32Array(N9 * 3);
  for (let i9 = 0; i9 < N9; i9++) { arr9[i9 * 3] = (Math.random() - .5) * 46; arr9[i9 * 3 + 1] = Math.random() * 22; arr9[i9 * 3 + 2] = (Math.random() - .5) * 46; }
  const gg9 = new THREE.BufferGeometry(); gg9.setAttribute('position', new THREE.Float32BufferAttribute(arr9, 3));
  seasonPts = new THREE.Points(gg9, new THREE.PointsMaterial({ color: CFG[0], size: CFG[1], transparent: true, opacity: .8, sizeAttenuation: true, depthWrite: false }));
  seasonPts.userData.fall = CFG[2];
  scene.add(seasonPts);
})();
function seasonTick(dt, t) {
  if (!seasonPts) return;
  const a9 = seasonPts.geometry.attributes.position.array, fall9 = seasonPts.userData.fall;
  for (let i9 = 0; i9 < a9.length; i9 += 3) {
    a9[i9 + 1] -= fall9 * dt; a9[i9] += Math.sin(t * .8 + i9) * dt * .7;
    if (a9[i9 + 1] < 0 || a9[i9 + 1] > 24) { a9[i9 + 1] = fall9 > 0 ? 20 + Math.random() * 4 : Math.random() * 3; a9[i9] = (Math.random() - .5) * 46; a9[i9 + 2] = (Math.random() - .5) * 46; }
  }
  seasonPts.geometry.attributes.position.needsUpdate = true;
  seasonPts.position.set(player.position.x, Math.max(player.position.y - 2, 0), player.position.z);
}
addSpot(HOME_POS[0], HOME_POS[1] + 4, 'home', 'home', { r: 7 });
/* ===== ❤️ 群岛基金会:捐赠与荣誉(算力币的花处) ===== */
function openFund() {
  const total = parseInt(PSTORE.getItem('w1001.donated') || '0', 10) || 0;
  const h1 = PSTORE.getItem('w1001.honor1') === '1', h2 = PSTORE.getItem('w1001.honor2') === '1';
  cardBody.innerHTML = `<div class="cardHead" style="background:#5a2e3a">❤️ 群岛基金会 · The Archipelago Trust</div>
    <div class="cardDesc" style="font-size:12.5px;line-height:1.7;padding:12px 20px 4px">"每一枚算力币,都会变成某座岛上的一块石阶、一盏灯、一笔修缮费。"——基金会成立于未竟之都熄灯那年,宗旨只有一条:让这些岛屿比诗活得久。<br>累计捐赠:<b style="color:#ffd76a">${total} ⚡</b>${total >= 500 ? ' · 🕊️ 你的名字已刻上和平港铜牌' : ''}${total >= 2000 ? ' · ❤️ 称号「群岛基石」已授予' : ''}</div>
    <div style="padding:6px 16px 4px">${[50, 200, 500].map(n9 => `<button class="gBtn" data-donate="${n9}" style="margin:4px 6px 4px 0" ${sb < n9 ? 'disabled' : ''}>捐 ${n9} ⚡</button>`).join('')}</div>
    <div style="padding:2px 16px 16px">
      <div class="gRow"><div class="gi">🥇</div><div class="gInfo"><b>鲸背赞助人</b><div class="gDesc">佩戴式荣誉称号 · 永久</div></div>${h1 ? '<span style="color:#2c7a4b;font-size:12px">✅ 已授予</span>' : `<button class="gBtn" data-honor="1" ${sb < 300 ? 'disabled' : ''}>300 ⚡</button>`}</div>
      <div class="gRow"><div class="gi">🎗️</div><div class="gInfo"><b>灯塔守护者</b><div class="gDesc">佩戴式荣誉称号 · 永久 · 附赠灯塔屿铜牌刻名</div></div>${h2 ? '<span style="color:#2c7a4b;font-size:12px">✅ 已授予</span>' : `<button class="gBtn" data-honor="2" ${sb < 800 ? 'disabled' : ''}>800 ⚡</button>`}</div>
    </div>`;
  modal.classList.remove('hidden'); modalOpen = true;
  cardBody.querySelectorAll('[data-donate]').forEach(b9 => b9.addEventListener('click', () => {
    const n9 = +b9.dataset.donate; if (!spendSB(n9)) return;
    const t9 = (parseInt(PSTORE.getItem('w1001.donated') || '0', 10) || 0) + n9;
    PSTORE.setItem('w1001.donated', String(t9));
    if (t9 >= 2000 && PSTORE.getItem('w1001.fundstone') !== '1') { PSTORE.setItem('w1001.fundstone', '1'); stars++; saveQuest(); updateQuestHUD(); toast('❤️ 累计 2000 ⚡!新称号「群岛基石」+⭐——基金会全体(一人)起立鼓掌'); }
    else if (t9 >= 500 && t9 - n9 < 500) toast('🕊️ 累计 500 ⚡——你的名字已刻上和平港的铜牌(第 ' + (100 + t9 % 400) + ' 位)');
    else toast('❤️ 谢谢。这笔钱会变成某座岛上的一盏灯(累计 ' + t9 + ' ⚡)');
    blip(720); openFund();
  }));
  cardBody.querySelectorAll('[data-honor]').forEach(b9 => b9.addEventListener('click', () => {
    const i9 = b9.dataset.honor, price9 = i9 === '1' ? 300 : 800;
    if (PSTORE.getItem('w1001.honor' + i9) === '1' || !spendSB(price9)) return;
    PSTORE.setItem('w1001.honor' + i9, '1');
    toast(i9 === '1' ? '🥇 「鲸背赞助人」已授予——图鉴称号页可佩戴' : '🎗️ 「灯塔守护者」已授予——灯塔今晚为你多转三圈'); blip(760); openFund();
  }));
}
function makePostcard() {
  try {
    const src = renderer.domElement;
    const cw = 480, ch = 320, cnv = document.createElement('canvas'); cnv.width = cw; cnv.height = ch;
    const c = cnv.getContext('2d');
    c.fillStyle = '#f7f3e8'; c.fillRect(0, 0, cw, ch);
    const m9 = 14, tw = cw - m9 * 2, th = ch - 72;
    let sw = src.width, sh = src.height;
    if (sw / sh > tw / th) sw = sh * tw / th; else sh = sw * th / tw;
    c.drawImage(src, (src.width - sw) / 2, (src.height - sh) / 2, sw, sh, m9, m9, tw, th);
    const nm = $('zoneName').textContent;
    c.fillStyle = '#3a3226'; c.font = 'bold 17px Georgia, "Noto Serif SC", serif'; c.textAlign = 'left';
    c.fillText(nm, m9 + 2, ch - 30);
    c.font = '12px Georgia, serif'; c.fillStyle = '#8a7c62';
    c.fillText('1001 世界 · ' + new Date().toLocaleDateString('zh-CN'), m9 + 2, ch - 12);
    c.fillStyle = '#fff'; c.fillRect(cw - 66, m9 + 5, 46, 56);
    c.strokeStyle = '#b9ae98'; c.setLineDash([3, 3]); c.strokeRect(cw - 66, m9 + 5, 46, 56); c.setLineDash([]);
    c.font = '26px serif'; c.textAlign = 'center'; c.fillText($('zoneIcon').textContent, cw - 43, m9 + 43);
    c.font = '9px serif'; c.fillStyle = '#8a7c62'; c.fillText('QJ POST', cw - 43, m9 + 56);
    const data = cnv.toDataURL('image/jpeg', .62);
    let cards9 = []; try { cards9 = JSON.parse(PSTORE.getItem('w1001.cards') || '[]'); } catch (e) {}
    cards9.push({ d: data, nm, ts: Date.now(), sent: 0 });
    while (cards9.length > 24) cards9.shift();
    PSTORE.setItem('w1001.cards', JSON.stringify(cards9));
    toast('💌 明信片已收入集邮册(' + cards9.length + '/24)——图鉴 💌 页可寄出或下载'); blip(760);
  } catch (e) { toast('📸 拍摄失败:' + e.message); }
}
/* --- ⛵ 海图点选直航:平面图反演坐标 / 球面 uv 拾取,金环高亮 + 确认条 --- */
let FERRY_IDX = null, mapSel = null, goBar = null;
function buildFerryIdx() {
  FERRY_IDX = [
    ['main', '收藏之岛', 0, -60], ['truman', '楚门的世界', TRU.x, TRU.z], ['lotr', '中土', MID.x, MID.z],
    ['hp', '霍格沃茨', HOG.x, HOG.z], ['mob', '南塔开特', MOB.x, MOB.z], ['sport', '体育岛', SPT.x, SPT.z],
    ['shj', '山海经', SHJ.x, SHJ.z], ['anh', '一千零一夜', ANH.x, ANH.z], ['nem', '鹦鹉螺锚地', NEM.x, NEM.z],
    ['b612', 'B-612', B612.x, B612.z], ['jur', '侏罗纪公园', JUR.x, JUR.z], ['hgs', '花果山', HGS.x, HGS.z],
    ['alc', '爱丽丝仙境', ALC.x, ALC.z], ['cbi', '赤壁', CBI.x, CBI.z], ['lrs', '兰若寺', LRS.x, LRS.z],
    ['lsp', '梁山泊', LSP.x, LSP.z], ['fcy', '风车原野', FCY.x, FCY.z], ['yfb', '伊夫堡', YFB.x, YFB.z],
    ['rbx', '绝望岛', RBX.x, RBX.z], ['dgy', '大观园', DGY.x, DGY.z], ['pur', '炼狱山', PUR.x, PUR.z],
    ['unj', '未竟之都', UNJ.x, UNJ.z],
    ...NISLES.map(s2 => [s2.key, NI_CONTENT[s2.key] ? NI_CONTENT[s2.key].name : s2.key, s2.x, s2.z]),
  ];
}
function initGoBar() {
  goBar = document.createElement('div');
  goBar.style.cssText = 'display:none;position:absolute;left:50%;bottom:22px;transform:translateX(-50%);z-index:5;background:rgba(16,28,20,.92);border:1px solid rgba(255,215,106,.5);border-radius:999px;padding:8px 10px 8px 18px;color:#f0ead6;font-size:14px;white-space:nowrap;align-items:center;gap:10px';
  goBar.innerHTML = '<span id="goBarTxt"></span> <button id="goBarGo" class="gBtn" style="margin-left:10px">⛵ 直航</button><button id="goBarNo" class="gBtn off" style="margin-left:6px">取消</button>';
  bigCv.parentElement.style.position = 'relative';
  bigCv.parentElement.appendChild(goBar);
  goBar.querySelector('#goBarGo').addEventListener('click', () => {
    if (!mapSel) return;
    if (diving) { toast('🤿 潜水中不能叫船——先浮上去'); return; }
    const sel = mapSel; goBar.style.display = 'none'; mapSel = null;
    if (globeOn && globeCv && globeCv.style.display !== 'none') startArc(sel);   // 🌐 先画大圆弧,再启航
    else { toggleBigMap(); ferryGo(sel[0]); }
  });
  goBar.querySelector('#goBarNo').addEventListener('click', () => { goBar.style.display = 'none'; mapSel = null; renderBigMap(); });
}
function mapPick(wx, wz) {
  if (!FERRY_IDX) buildFerryIdx();
  if (!goBar) initGoBar();
  let best = 1e9, hit = null;
  for (const e of FERRY_IDX) { const d = Math.hypot(wx - e[2], wz - e[3]); if (d < best) { best = d; hit = e; } }
  if (!hit || best > 170) { goBar.style.display = 'none'; mapSel = null; renderBigMap(); return; }
  mapSel = hit;
  goBar.querySelector('#goBarTxt').textContent = '直航去「' + hit[1] + '」?';
  goBar.style.display = 'flex';
  if (bigCv.style.display !== 'none') {   // 平面图:金环高亮
    renderBigMap();
    const W3 = bigCv.width, H3 = bigCv.height, SC2 = 4000;
    const bx = (hit[2] / SC2 + .5) * W3, by = (.5 - hit[3] / (SC2 * H3 / W3)) * H3;
    bigCtx.strokeStyle = '#ffd76a'; bigCtx.lineWidth = 3;
    bigCtx.beginPath(); bigCtx.arc(bx, by, 16, 0, 7); bigCtx.stroke();
  }
  blip(600);
}
if (bigCv) bigCv.addEventListener('click', e => {
  const r2 = bigCv.getBoundingClientRect();
  const px = (e.clientX - r2.left) / r2.width * bigCv.width, py = (e.clientY - r2.top) / r2.height * bigCv.height;
  const SC2 = 4000, W3 = bigCv.width, H3 = bigCv.height;
  mapPick((px / W3 - .5) * SC2, (.5 - py / H3) * (SC2 * H3 / W3));
});
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
CP_MARKS.push({ x: UNJ.x, z: UNJ.z, col: '#e8e4da' });
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
/* 进步之塔螺旋坡道 + 断口平台(可拾级登顶,cirObs 的 top 字段放行高处) */
function unjTowerHeight(x, z) {
  const dx = x - UNJ.x, dz = z - (UNJ.z - 64), d = Math.hypot(dx, dz);
  if (d > 12) return null;
  if (d < 6.2) return 32.06;                                  // 二层塔顶(断口平台)
  let a = Math.atan2(dz, dx); if (a < 0) a += Math.PI * 2;
  if (Math.abs(a - Math.PI * 1.86) < .3 && d < 11.4) return 32.03;   // 尽头连桥
  if (a > Math.PI * 1.78 || d < 9.2) return null;
  const i = Math.min(33, Math.floor(a / (Math.PI * 1.78) * 34));     // 与坡道台阶同一公式
  return 6.5 + (i + .5) / 34 * 25.5 + .18;
}
/* 天空之城平台(悬空地面) */
function skyHeight(x, z) {
  return Math.hypot(x - SKY.x, z - SKY.z) < SKY.r - 2 ? SKY.y : null;
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
/* —— 船只 encounter:海上四艘传奇(游到近旁按 E)—— */
{
  makeBoat(0xf5efdc, .85).userData = { anchor: [648, 582] };   // 圣玛丽亚号(楚门)
  // 幽灵号(海狼,北海):漆黑帆船
  const gsB = makeBoat(0x22262c, 1.7); gsB.userData = { anchor: [-350, -1480] };
  addSpot(-350, -1480, 'lore', 'ghostship', { r: 12, y: .6 });
  // "我们在这儿"号(怒海余生,东北渔场):矮帆渔船 + 晾鳕鱼架
  const whB = makeBoat(0x8a6a3a, 1.05); whB.userData = { anchor: [950, -780] };
  addSpot(950, -780, 'lore', 'wehere', { r: 11, y: .6 });
  // 福克先生的邮轮(环游地球八十天,东海):蒸汽船
  {
    const fg = new THREE.Group();
    const hull2 = box(16, 2.6, 5, lam(0x2a3038)); hull2.position.y = 1; fg.add(hull2);
    const deck2 = box(10, 1.8, 3.6, lam(0xe6e2d8)); deck2.position.y = 3.1; fg.add(deck2);
    const fun = cyl(.8, 1, 3.4, lam(0xc0392b)); fun.position.set(-2, 5.4, 0); fg.add(fun);
    const fun2 = cyl(.8, 1, 3.4, lam(0xc0392b)); fun2.position.set(2.6, 5.4, 0); fg.add(fun2);
    fg.position.set(1480, .4, 60); fg.rotation.y = .8; scene.add(fg); boats.push(fg); fg.userData = { anchor: [1480, 60] };
    addSpot(1480, 60, 'lore', 'fogg80', { r: 13, y: .6 });
  }
  // 格兰特船长的瓶中信(南海漂浮,一次性支线)
  const gbX = 420, gbZ = 980;
  const gbtl = cyl(.3, .42, 1.1, new THREE.MeshPhongMaterial({ color: 0x6ab89a, transparent: true, opacity: .75 }));
  gbtl.rotation.z = 1.25; gbtl.position.set(gbX, .5, gbZ); scene.add(gbtl);
  const gring = new THREE.Mesh(new THREE.TorusGeometry(1.6, .12, 8, 18), new THREE.MeshBasicMaterial({ color: 0x8fe0c0, transparent: true, opacity: .5 }));
  gring.rotation.x = Math.PI / 2; gring.position.set(gbX, .4, gbZ); scene.add(gring);
  addSpot(gbX, gbZ, 'lore', 'grantbottle', { r: 10, y: .6 });
}
/* ================= 未竟之都:世界交流中心遗址(白石几何岛) ================= */
let unjTowerOn = PSTORE.getItem('w1001.unjlit') === '1', unjFountainOn = PSTORE.getItem('w1001.unjend') === '3';
let unjPhantomT = 0, unjTowerLight = null, unjTowerBulb = null, unjFountainMesh = null, unjPhantom = null;
let unjLangLight = null;
{
  const gx = UNJ.x, gz = UNJ.z, G = 6;
  const marble = MOBILE ? new THREE.MeshLambertMaterial({ color: 0xe8e4da }) : new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: .55 });
  const marbleDim = lam(0xc8c4b8);
  const colAt = (x, z, h = 7, r = .8) => { const c = cyl(r, r * 1.15, h, marble, 10); c.position.set(x, G + h / 2, z); scene.add(c); return c; };
  const ave = box(10, .3, 150, marble); ave.position.set(gx, G + .12, gz + 15); scene.add(ave);   // 中央大道
  { const hz = gz + 96;   // —— 和平港:石岸、褪色万国旗、各岛来船 ——
    const quay = box(60, 1.2, 10, marbleDim); quay.position.set(gx, G - .2, hz); scene.add(quay);
    for (let i = 0; i < 6; i++) { const px = gx - 25 + i * 10;
      const pole = cyl(.09, .12, 7, marble, 6); pole.position.set(px, G + 3.5, hz + 3.4); scene.add(pole);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1), new THREE.MeshLambertMaterial({ color: 0xb8b4aa, side: THREE.DoubleSide })); fl.position.set(px + .85, G + 6.3, hz + 3.4); scene.add(fl); }
    [[0xf5efdc, -34, 116], [0x22262c, -16, 120], [0x8fb6c8, 6, 118], [0xd94f6b, 24, 121], [null, 38, 116]].forEach(([c, ox, oz], i) => { makeBoat(c, .8 + (i % 3) * .15).userData = { anchor: [gx + ox, gz + oz] }; });
    addSpot(gx - 8, hz, 'lore', 'unjport', { r: 8 });
    for (let i = 0; i < 3; i++) { const cr = box(1.6, 1.2, 1.2, lam(0x8a7a5a)); cr.position.set(gx + 20 + i * 2, G + .6, hz - 3); scene.add(cr); }   // 港务仓库的邀请函箱
    addSpot(gx + 22, hz - 3, 'lore', 'unjn1', { r: 5 });
    const kdx = gx - 22, kdz = hz - 5;   // 考据学会:长桌+卡片+线绳
    const ktab = box(4.2, .9, 1.6, lam(0x6a5640)); ktab.position.set(kdx, G + .45, kdz); scene.add(ktab); cirObs.push({ x: kdx, z: kdz, r: 2.2 });
    for (let i = 0; i < 5; i++) { const card2 = box(.5, .04, .34, lam(0xf0ecd8)); card2.position.set(kdx - 1.6 + i * .8, G + .93, kdz + (i % 2) * .4 - .2); card2.rotation.y = (i % 3) * .5; scene.add(card2); }
    addSpot(kdx, kdz + 3, 'lore', 'unjkao', { r: 7 });
  }
  { const disc = new THREE.Mesh(new THREE.CircleGeometry(26, 36), MOBILE ? new THREE.MeshLambertMaterial({ color: 0xdfdbd0 }) : new THREE.MeshPhongMaterial({ color: 0xdfdbd0, shininess: 40 }));   // —— 万国广场 ——
    disc.rotation.x = -Math.PI / 2; disc.position.set(gx, G + .15, gz); scene.add(disc);
    for (const r of [10, 18, 25]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(r, .12, 6, 48), lam(0x8a94a0)); ring.rotation.x = Math.PI / 2; ring.position.set(gx, G + .22, gz); scene.add(ring); }
    const basin = new THREE.Mesh(new THREE.TorusGeometry(4.2, .8, 8, 24), marbleDim); basin.rotation.x = Math.PI / 2; basin.position.set(gx, G + .7, gz); scene.add(basin); cirObs.push({ x: gx, z: gz, r: 5.2 });
    const ped = cyl(.9, 1.2, 2.4, marble, 8); ped.position.set(gx, G + 1.2, gz); scene.add(ped);
    unjFountainMesh = new THREE.Mesh(new THREE.ConeGeometry(1.6, 5, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0x9fd8e8, transparent: true, opacity: .5, fog: false }));
    unjFountainMesh.position.set(gx, G + 4.6, gz); unjFountainMesh.visible = unjFountainOn; scene.add(unjFountainMesh);
    addSpot(gx + 8, gz + 8, 'lore', 'unjplaza', { r: 9 });
  }
  { const tx = gx - 62, tz = gz - 6;   // —— 艺术与科学神殿(西) ——
    const base2 = box(30, 2, 18, marbleDim); base2.position.set(tx, G + 1, tz); scene.add(base2); cirObs.push({ x: tx, z: tz, r: 12 });
    for (let i = 0; i < 6; i++) colAt(tx - 10 + i * 4, tz + 8.4, 8, .7);
    const roof2 = box(32, 1.6, 20, marble); roof2.position.set(tx, G + 10.6, tz); scene.add(roof2);
    const ped2 = new THREE.Mesh(new THREE.ConeGeometry(13, 4, 3), marble); ped2.rotation.y = Math.PI / 6; ped2.scale.z = .28; ped2.position.set(tx, G + 13.4, tz + 8); scene.add(ped2);
    addSpot(tx, tz + 14, 'lore', 'unjtemple', { r: 9 });
    addSpot(tx - 8, tz + 12, 'lore', 'unjb1', { r: 5 });
  }
  { const cx = gx + 62, cz2 = gz - 6;   // —— 国际法庭(东) ——
    const hall = box(20, 12, 16, marbleDim); hall.position.set(cx, G + 6, cz2); scene.add(hall); cirObs.push({ x: cx, z: cz2, r: 11 });
    for (let i = 0; i < 4; i++) colAt(cx - 6 + i * 4, cz2 + 8.8, 10, .75);
    const steps2 = box(20, 1, 5, marble); steps2.position.set(cx, G + .5, cz2 + 10.5); scene.add(steps2);
    addSpot(cx, cz2 + 14, 'lore', 'unjcourt', { r: 8 });
    addSpot(cx + 9, cz2 + 12, 'lore', 'unjb2', { r: 5 });
    const cab = box(1.2, 2.2, .8, lam(0x4e5460)); cab.position.set(cx - 9, G + 1.1, cz2 + 11); scene.add(cab);   // 档案柜
    addSpot(cx - 9, cz2 + 12, 'lore', 'unjn2', { r: 5 });
  }
  { const sx = gx + 52, sz = gz + 52;   // —— 万国运动场(东南) ——
    for (let i = 0; i < 8; i++) { const a = Math.PI * .1 + i / 8 * Math.PI * .8; const st = box(9, 2.4 + (i % 2), 3, marbleDim); st.position.set(sx + Math.cos(a) * 16, G + 1.2, sz + Math.sin(a) * 16); st.rotation.y = -a + Math.PI / 2; scene.add(st); }
    const torch = cyl(.5, .9, 7, marbleDim, 8); torch.position.set(sx, G + 3.5, sz - 14); scene.add(torch);
    const bowl2 = cyl(1.4, .9, 1, lam(0x4a4640), 10); bowl2.position.set(sx, G + 7.4, sz - 14); scene.add(bowl2);
    addSpot(sx, sz, 'lore', 'unjstadium', { r: 9 });
    addSpot(sx - 8, sz - 10, 'lore', 'unjb3', { r: 5 });
    addSpot(sx + 2, sz - 12, 'lore', 'unjtorch', { r: 6 });
  }
  { const tx = gx, tz = gz - 64;   // —— 进步之塔(北,断顶 + 脚手架) ——
    const t1 = cyl(7, 8.5, 14, marble, 12); t1.position.set(tx, G + 7, tz); scene.add(t1); cirObs.push({ x: tx, z: tz, r: 9, top: 31 });
    const t2 = cyl(5.2, 6.4, 12, marble, 12); t2.position.set(tx, G + 20, tz); scene.add(t2);
    for (let i = 0; i < 5; i++) { const jag = box(2.2, 3 + (i % 3), 2.2, marbleDim); const a = i * 1.3; jag.position.set(tx + Math.cos(a) * 3.6, G + 27.5, tz + Math.sin(a) * 3.6); jag.rotation.y = a; scene.add(jag); }
    for (let i = 0; i < 4; i++) { const sc = box(.18, 26, .18, lam(0x6a5a42)); sc.position.set(tx + 8.6, G + 13, tz - 5 + i * 3.4); scene.add(sc); }
    for (let i = 0; i < 5; i++) { const sb2 = box(.14, .14, 12, lam(0x6a5a42)); sb2.position.set(tx + 8.6, G + 4 + i * 5.4, tz); scene.add(sb2); }
    unjTowerLight = new THREE.PointLight(0xfff2cc, 0, 220, 1.8); unjTowerLight.position.set(tx, G + 30, tz); scene.add(unjTowerLight);
    unjTowerBulb = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff2cc, transparent: true, opacity: .9, fog: false })); unjTowerBulb.position.set(tx, G + 29.5, tz); unjTowerBulb.visible = unjTowerOn; scene.add(unjTowerBulb);
    addSpot(tx, tz + 12, 'lore', 'unjtower', { r: 9 });
    addSpot(tx - 9, tz + 9, 'lore', 'unjb4', { r: 5 });
    for (let i = 0; i < 34; i++) {   // 螺旋坡道:贴着脚手架绕塔 0.89 圈,登上断口(物理见 unjTowerHeight)
      const a = (i + .5) / 34 * Math.PI * 1.78;
      const st2 = box(3.2, .35, 2.2, marbleDim);
      st2.position.set(tx + Math.cos(a) * 10.6, 6.5 + (i + .5) / 34 * 25.5, tz + Math.sin(a) * 10.6);
      st2.rotation.y = -(a + Math.PI / 2); scene.add(st2);
    }
    { const ab = Math.PI * 1.86; const br2 = box(6.2, .35, 3, marbleDim);   // 坡道尽头连桥 → 二层塔顶断口
      br2.position.set(tx + Math.cos(ab) * 8.2, 31.85, tz + Math.sin(ab) * 8.2); br2.rotation.y = -ab; scene.add(br2); }
    addSpot(tx, tz + 2, 'lore', 'unjtop', { r: 6, y: 32.5 });
  }
  { const rx = gx + 42, rz = gz - 44;   // —— 未完成区(东北) ——
    for (let i = 0; i < 5; i++) colAt(rx - 8 + i * 4, rz, 5 + (i % 3) * 2, .7);
    const arch = box(10, 1, 1.4, marbleDim); arch.rotation.z = .12; arch.position.set(rx - 4, G + 8.2, rz); scene.add(arch);
    const plinth = box(2.4, 1.6, 2.4, marbleDim); plinth.position.set(rx + 10, G + .8, rz + 6); scene.add(plinth);
    const torso = cyl(.9, 1.1, 2.6, marble, 8); torso.position.set(rx + 10, G + 2.9, rz + 6); scene.add(torso);
    const mast = box(.5, 16, .5, lam(0x8a5a2a)); mast.position.set(rx - 2, G + 8, rz - 10); scene.add(mast);
    const jib = box(12, .4, .4, lam(0x8a5a2a)); jib.position.set(rx + 3, G + 15, rz - 10); scene.add(jib);
    const cable = cyl(.04, .04, 6, lam(0x2a2a2a), 4); cable.position.set(rx + 8.6, G + 12, rz - 10); scene.add(cable);
    for (let i = 0; i < 5; i++) { const paper = new THREE.Mesh(new THREE.PlaneGeometry(.8, 1.1), new THREE.MeshLambertMaterial({ color: 0xf0ecd8, side: THREE.DoubleSide })); paper.rotation.x = -Math.PI / 2; paper.rotation.z = i * 1.2; paper.position.set(rx - 6 + i * 3, G + .2, rz + 8 + (i % 2) * 2); scene.add(paper); }
    addSpot(rx, rz + 8, 'lore', 'unjruin', { r: 8 });
    addSpot(rx - 6, rz + 11, 'lore', 'unjn3', { r: 5 });
    const desk = box(1.8, .9, 1, lam(0x5a4a36)); desk.position.set(gx + 49, G + .45, gz - 34); scene.add(desk);   // 记者的行军桌
    const tw = box(.7, .4, .5, lam(0x2e2e2a)); tw.position.set(gx + 49, G + 1.1, gz - 34); scene.add(tw);
    addSpot(gx + 49, gz - 33, 'lore', 'unjnews', { r: 6 });
  }
  { const kx = 350, kz = 592;   // —— 地下交流网入口(白石亭罩蓝洞) ——
    for (const [sx2, sz2] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) colAt(kx + sx2, kz + sz2, 6, .5);
    const kroof = box(9, .8, 9, marble); kroof.position.set(kx, G + 6.6, kz); scene.add(kroof);
    const ksign = makeSign('地下交流网 · 万国隧道', 7, '#2a3040', '#c8d8e8'); ksign.position.set(kx + 7, G + 4.2, kz + 5); scene.add(ksign);
  }
  { const dz = gz + UNJ.r + 12; const dk = height(gx, dz);   // —— 渡口 + 岛名牌 ——
    const plank = box(5, .5, 9, M.wood); plank.position.set(gx, dk + .9, dz); scene.add(plank);
    addSpot(gx, dz - 3, 'ferry', 'ferry', { r: 8 });
    const isign = makeSign('未竟之都', 8, '#e8e4da', '#3a4456'); isign.position.set(gx + 12, G + 4.4, gz + 104); scene.add(isign); }
  addNpc({ x: gx - 6, z: gz + 14, name: '规划师的影子', body: 0x9aa4b0, hat: 0x7a8490, opts: { tall: 1.06, cane: true },
    lines: ['我们不是要建一座城市——我们是要给人类,建一个共同的房间。', '每条大道通向塔;每条隧道,通向世界。', '图纸都画完了。人,没有来。'] });
  addNpc({ x: gx + 10, z: gz - 4, name: '万国翻译员', body: 0x8a6a9a, hat: 0x6a4a7a, opts: { tall: .98 },
    lines: ['这里备了三百个翻译间。用过的,只有一个。', '误解从来不是语言问题,是利益问题——这句话,我翻译了四十年。', '我可以替你翻译任何语言。除了沉默。'],
    topics: [{ q: '翻译回廊里那三块碑是什么?', a: '误译碑。三句最要紧的话,在三百种语言里绕了一百年,回来时全变了形。去广场西南的回廊,把它们修回来——修好了,来 17 号间找我按总闸。那三百盏灯,我想看四十年了。' }] });
  addNpc({ x: gx + 46, z: gz - 38, name: '旧时代记者', body: 0x5a5a52, hat: 0x3e3e38,
    lines: ['我在查这座城为什么失败。线索指向资本、战争、虚荣——和太干净的理想。', '雕塑家先生给各国君主写了一千封信。回信,不到十封。', '每个"为了人类",我都想追问一句:具体是哪些人?'],
    topics: [{ q: '你还缺什么线索?', a: '三样:港口仓库那批没人拆的邀请函、法庭档案柜里的电报底稿、未完成区散落的最后一次工地会议记录。都抄来给我——我桌上那台打字机,还欠这座城一篇报道。' }] });
  addNpc({ x: gx - 24, z: gz + 89, name: '群岛考据学家', body: 0x7a6248, hat: 0x5a4834, opts: { tall: 1.02 },
    lines: ['五十六座岛,五十六页——这不是群岛,是一本被海水打散的书。', '我做考据四十年,最好的注脚都不在书里,在船票上。', '你去过的地方比我多。长桌上那四份考据,帮我补完可好?'] });
  addNpc({ x: gx + 52, z: gz + 40, name: '守夜人', body: 0x6a5a42, hat: 0x4a3e2c, opts: { wide: 1.15 },
    lines: ['圣火二十年前就该点了。我每晚来点一次——点的是习惯,也是念想。', '这座场没办过一场比赛。但跑道,是按马拉松的梦想量的。', '要跑一圈吗?没有观众——风会给你鼓掌。'] });
  { const cx0 = gx - 48, cz0 = gz + 46;   // —— 翻译回廊(西南):3×4 格子间 + 三块误译碑 + 17 号间 ——
    for (let r2 = 0; r2 < 3; r2++) for (let c2 = 0; c2 < 4; c2++) {
      const bx3 = cx0 - 12 + c2 * 8, bz3 = cz0 - 8 + r2 * 8;
      for (const [ox, oz] of [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]]) { const col2 = cyl(.32, .38, 3.6, marbleDim, 7); col2.position.set(bx3 + ox, G + 1.8, bz3 + oz); scene.add(col2); }
      const roof3 = box(6.6, .4, 6.6, marble); roof3.position.set(bx3, G + 3.9, bz3); scene.add(roof3);
    }
    const stela = (sx3, sz3) => { const st3 = box(1.7, 2.8, .5, lam(0x3a4048)); st3.position.set(sx3, G + 1.4, sz3); st3.rotation.y = .2; scene.add(st3); cirObs.push({ x: sx3, z: sz3, r: 1.2 }); };
    stela(cx0 - 8, cz0 - 8); stela(cx0 + 6, cz0 + 6); stela(cx0 - 10, cz0 + 8);
    const desk17 = box(2.2, 1, 1.2, lam(0x5a4a36)); desk17.position.set(cx0, G + .5, cz0); scene.add(desk17);
    unjLangLight = new THREE.PointLight(0xc8b8ff, PSTORE.getItem('w1001.unjlang') === '1' ? 22 : 0, 90, 1.8);
    unjLangLight.position.set(cx0, G + 8, cz0); scene.add(unjLangLight);
    addSpot(cx0 + 14, cz0 - 12, 'lore', 'unjlobby', { r: 8 });
    addSpot(cx0 - 8, cz0 - 8, 'lore', 'unjw1', { r: 5 });
    addSpot(cx0 + 6, cz0 + 6, 'lore', 'unjw2', { r: 5 });
    addSpot(cx0 - 10, cz0 + 8, 'lore', 'unjw3', { r: 5 });
    addSpot(cx0, cz0, 'lore', 'unjlang', { r: 5 });
  }
  { unjPhantom = new THREE.Group(); unjPhantom.visible = false;   // —— 蓝图幻影(V):塔的补全 + 喷泉水 + 万国旗升起 ——  { unjPhantom = new THREE.Group(); unjPhantom.visible = false;   // —— 蓝图幻影(V):塔的补全 + 喷泉水 + 万国旗升起 ——
    const gm = new THREE.MeshBasicMaterial({ color: 0x9fd8e8, transparent: true, opacity: .22, fog: false });
    const g1 = cyl(4.2, 5.2, 22, gm, 12); g1.position.set(gx, G + 39, gz - 64); unjPhantom.add(g1);
    const g2 = new THREE.Mesh(new THREE.ConeGeometry(3, 9, 10), gm.clone()); g2.material.opacity = .26; g2.position.set(gx, G + 54, gz - 64); unjPhantom.add(g2);
    const gOrb = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff2cc, transparent: true, opacity: .55, fog: false })); gOrb.position.set(gx, G + 59, gz - 64); unjPhantom.add(gOrb);
    const gWater = new THREE.Mesh(new THREE.ConeGeometry(2, 7, 10, 1, true), gm.clone()); gWater.material.opacity = .4; gWater.position.set(gx, G + 5.4, gz); unjPhantom.add(gWater);
    const cols2 = [0xd94f6b, 0x2e86ab, 0xe8c12a, 0x2c7a4b, 0x8a4ab0, 0xe8963c];
    for (let i = 0; i < 6; i++) { const fl2 = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1), new THREE.MeshBasicMaterial({ color: cols2[i], transparent: true, opacity: .5, fog: false, side: THREE.DoubleSide })); fl2.position.set(gx - 25 + i * 10 + .85, G + 6.3, gz + 99.4); unjPhantom.add(fl2); }
    scene.add(unjPhantom);
  }
}
/* 喷水孔的水雾(周期性喷发) */
const spray = new THREE.Mesh(new THREE.ConeGeometry(2.2, 7, 9),
  new THREE.MeshBasicMaterial({ color: 0xeafaff, transparent: true, opacity: 0, depthWrite: false }));
spray.position.set(WHALE_BLOW.x, 3, WHALE_BLOW.z);
scene.add(spray);

/* --- ❤️ 群岛基金会亭(装备行隔壁) --- */
{
  const fx9 = 38, fz9 = 232, fh9 = height(fx9, fz9);
  const cnt = box(3.6, 1, 2, lam(0x6a3a46)); cnt.position.set(fx9, fh9 + .9, fz9); scene.add(cnt); cirObs.push({ x: fx9, z: fz9, r: 2.2 });
  for (const ox of [-1.5, 1.5]) { const pp = cyl(.1, .12, 3, M.woodDark, 5); pp.position.set(fx9 + ox, fh9 + 1.9, fz9); scene.add(pp); }
  const rf9 = box(4.2, .24, 2.6, lam(0x8a4a5a)); rf9.position.set(fx9, fh9 + 3.4, fz9); scene.add(rf9);
  const hs9 = makeSign('❤️ 群岛基金会', 5.5, '#4a2630', '#f0c8d0'); hs9.position.set(fx9 + 3.6, fh9 + 2.6, fz9 + 1); scene.add(hs9);
  addSpot(fx9, fz9 + 2.5, 'fund', 'fund', { r: 6 });
}
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
player.add(fitGrp); applyOutfit();   // 👘 衣橱挂载
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
  const GN = MOBILE ? 1000 : 3400, R = MOBILE ? 30 : 48;   // F:近景草加密
  const bladeGeo = new THREE.ConeGeometry(.055, .62, 3);   // 细小草叶(更像草,不像圆锥)
  bladeGeo.translate(0, .31, 0);   // 基部落到 y=0,便于自底摇摆
  grassMat = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: false });
  grassMat.onBeforeCompile = sh => {
    sh.uniforms.uTime = { value: 0 };
    sh.uniforms.uAmp = { value: WEATHER === 'storm' ? .38 : RAINY ? .24 : .16 };   // 风力:暴风草伏,雨天草劲
    sh.uniforms.uGust = { value: 1 };   // 阵风包络(主循环逐帧驱动)
    sh.vertexShader = 'uniform float uTime;\nuniform float uAmp;\nuniform float uGust;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      `#include <begin_vertex>
       #ifdef USE_INSTANCING
         vec3 iP = instanceMatrix[3].xyz;
       #else
         vec3 iP = vec3(0.0);
       #endif
       float wv = sin(uTime * 1.5 + iP.x * .28 + iP.z * .19) * uAmp * uGust * transformed.y;
       transformed.x += wv; transformed.z += wv * .55;`);
    grassMat.userData.shader = sh;
  };
  grassBlades = new THREE.InstancedMesh(bladeGeo, grassMat, GN);
  grassBlades.frustumCulled = false;
  scene.add(grassBlades);
  grassBlades.userData = { GN, R, rnd: mulberry32(303) };
  const gc = [new THREE.Color(0x5aa048), new THREE.Color(0x6cb556), new THREE.Color(0x4c8c40), new THREE.Color(0x7fb85e)];
  { const t9 = { spring: [.02, .06, .03], autumn: [-.09, .03, -.02], winter: [-.04, -.32, .1] }[SEASON]; if (t9) gc.forEach(c9 => c9.offsetHSL(t9[0], t9[1], t9[2])); }   // 草叶随季
  for (let i = 0; i < GN; i++) grassBlades.setColorAt(i, gc[i % 4]);
  // 野花:草丛间零星点缀(实例化,随草一起重铺)
  const FN = MOBILE ? 140 : 460;
  flowerInst = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.26, 0), new THREE.MeshLambertMaterial({ vertexColors: false }), FN);
  flowerInst.frustumCulled = false;
  scene.add(flowerInst);
  flowerInst.userData = { FN, R, rnd: mulberry32(717) };
  const fc = [new THREE.Color(0xe8b4c8), new THREE.Color(0xffd76a), new THREE.Color(0xffffff), new THREE.Color(0xd94f6b), new THREE.Color(0x9a7fd6)];
  for (let i = 0; i < FN; i++) flowerInst.setColorAt(i, fc[i % 5]);
  // 碎石:地表零星石块(随草一起重铺)
  const KN = MOBILE ? 70 : 210;
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
  { x: 350, z: 620, r: 125 },     // 未竟之都(白石之城)
];
function grassOK(x, z) { for (const g of NO_GRASS) if ((x - g.x) ** 2 + (z - g.z) ** 2 < g.r * g.r) return false; return true; }
function redistributeGrass(cx, cz) {
  grassCx = cx; grassCz = cz;
  const u = grassBlades.userData, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
  for (let i = 0; i < u.GN; i++) {
    const a = u.rnd() * 6.2832, rr = Math.sqrt(u.rnd()) * u.R;
    const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr, h = heightMesh(x, z);
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
      const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr, h = heightMesh(x, z);
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
      const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr, h = heightMesh(x, z);
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
    const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr, h = heightMesh(x, z);
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
    const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr, h = heightMesh(x, z);
    b[i * 3] = x; b[i * 3 + 2] = z;
    b[i * 3 + 1] = (h > 1.6 && h < 15) ? h + 1.8 : -999;   // 低洼草地才起雾
  }
}
/* 🗾 OSM 真实街区 · 硬编码老岛四处 */
{
  const C9 = { THREE, height, scene, cirObs, winMat9, mergeGeometries };
  osmCity(C9, OSM_MOBT, MOB.x - 24, MOB.z, 34, [lam(0xb8a88c), lam(0x9a8a6e)]);     // 南塔开特镇(捕鲸港)
  osmCity(C9, OSM_TRUMAN, TRU.x + 30, TRU.z, 32, [lam(0xf0e8da), lam(0xe6d8c4)]);   // Seaside(楚门的世界取景地)
  osmCity(C9, OSM_DGYT, DGY.x - 28, DGY.z, -32, [lam(0x9a5a4a), lam(0x8a8478)]);    // 北京大观园
  { const lkm = new THREE.MeshPhongMaterial({ color: 0x2e6a72, shininess: 90, transparent: true, opacity: .88, side: THREE.DoubleSide });   // 沁芳湖真实水形 © OSM
    for (const ring of OSM_DGY_WATER) {
      const sh9 = new THREE.Shape(); ring.forEach(([px9, pz9], i9) => i9 ? sh9.lineTo(px9, -pz9) : sh9.moveTo(px9, -pz9));
      const gg9 = new THREE.ShapeGeometry(sh9); gg9.rotateX(-Math.PI / 2);
      gg9.translate(DGY.x - 28, Math.max(height(DGY.x - 28, DGY.z - 32), .3) + .22, DGY.z - 32);
      scene.add(new THREE.Mesh(gg9, lkm));
    } }
  osmCity(C9, OSM_SPTT, SPT.x + 64, SPT.z, -40, [lam(0xc03a3a), lam(0x8a8a92)]);    // 老特拉福德(梦剧场原型)
  osmRoads(C9, OSM_ROADS.TRUMAN, TRU.x + 30, TRU.z, 32, new THREE.MeshLambertMaterial({ color: 0xd8cfc0, side: THREE.DoubleSide }), 1.8, .12);   // Seaside 放射街网
  osmRoads(C9, OSM_ROADS.MOBT, MOB.x - 24, MOB.z, 34, new THREE.MeshLambertMaterial({ color: 0xa89878, side: THREE.DoubleSide }), 1.7, .12);   // 南塔开特鹅卵石街
  { const pts9 = OSM_PIERS_MOB.flat ? OSM_PIERS_MOB : [];   // 南塔开特码头栈桥(伸进海里)
    osmRoads(C9, OSM_PIERS_MOB, MOB.x - 24, MOB.z, 34, new THREE.MeshLambertMaterial({ color: 0x7a5a36, side: THREE.DoubleSide }), 2.4, .55); }
  { const bx0 = -1685, bz0 = 940, intl = lam(0xc0492b);   // 🌉 金门大桥主跨(© OSM 中线,真实走向,装饰)
    const DK = 21, pts9 = OSM_GGB;
    const pos9 = [];
    for (let i = 0; i < pts9.length - 1; i++) {
      const [x1, z1] = pts9[i], [x2, z2] = pts9[i + 1];
      const dx = x2 - x1, dz = z2 - z1, L = Math.hypot(dx, dz) || 1, nx = -dz / L * 3.2, nz = dx / L * 3.2;
      pos9.push(bx0 + x1 + nx, DK, bz0 + z1 + nz, bx0 + x1 - nx, DK, bz0 + z1 - nz, bx0 + x2 + nx, DK, bz0 + z2 + nz,
                bx0 + x1 - nx, DK, bz0 + z1 - nz, bx0 + x2 - nx, DK, bz0 + z2 - nz, bx0 + x2 + nx, DK, bz0 + z2 + nz);
    }
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(pos9, 3)); dg.computeVertexNormals();
    scene.add(new THREE.Mesh(dg, new THREE.MeshLambertMaterial({ color: 0xc0492b, side: THREE.DoubleSide })));
    const lerp9 = t9 => { const n9 = (pts9.length - 1) * t9, i9 = Math.min(pts9.length - 2, Math.floor(n9)), f9 = n9 - i9;
      return [bx0 + pts9[i9][0] + (pts9[i9 + 1][0] - pts9[i9][0]) * f9, bz0 + pts9[i9][1] + (pts9[i9 + 1][1] - pts9[i9][1]) * f9]; };
    const tw9 = [];
    for (const tt of [.3, .7]) { const [tx9, tz9] = lerp9(tt); tw9.push([tx9, tz9]);
      for (const sgn of [-1, 1]) { const py9 = cyl(1.1, 1.6, 74, intl, 8); py9.position.set(tx9 + sgn * 3.4, 37, tz9); scene.add(py9); }
      const cross9 = box(9.4, 1.6, 1.6, intl); cross9.position.set(tx9, 66, tz9); scene.add(cross9); }
    for (const sgn of [-1, 1]) { const cps = [];   // 主缆:锚-塔-塔-锚 悬垂
      for (let i = 0; i <= 30; i++) { const t9 = i / 30; const [cx9, cz9] = lerp9(t9);
        const dt9 = Math.min(Math.abs(t9 - .3), Math.abs(t9 - .7));
        const cy9 = 70 - Math.min(dt9 / .3, 1) ** 2 * 46;
        cps.push(new THREE.Vector3(cx9 + sgn * 3.4, cy9, cz9)); }
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cps), 40, .5, 5), intl)); }
  }
}
/* 🚶 ① 沿真实街道散步的居民(OSM 路网) */
function addWalkers(lines9, ox, oz, defs) {
  defs.forEach((d9, i9) => {
    const ln = lines9[(i9 * 7 + 3) % lines9.length];
    if (!ln || ln.length < 2) return;
    addNpc({ x: ox + ln[0][0], z: oz + ln[0][1], name: d9[0], body: d9[1], hat: d9[2], wander: false, lines: d9[3] });
    allNpcs[allNpcs.length - 1].path = { ln, ox, oz, i: 0, dir: 1 };
  });
}
addWalkers(OSM_ROADS.TRUMAN, TRU.x + 30, TRU.z + 32, [
  ['遛狗的邻居', 0xd88a5a, 0xf0e8da, ['以防没看见你:下午好、晚上好、晚安!', '这镇子完美得有点过分,你说呢?', '我家狗冲着 3 号路灯又叫了一早上。没什么,自言自语。']],
  ['骑行俱乐部会长', 0x5a8ad0, 0xe8e0cc, ['Seaside 的街道是弧形的——绕一圈,烦恼就甩掉了。', '这里每条街都通向海。设计师是懂浪漫的。', '你也有折叠车?品味不错!']],
  ['送报童', 0x8a6a3a, 0xd0c8b0, ['号外号外——今天没有号外。这里从来没有坏消息。', '每天同一时刻、同样的路线。有人管这叫完美。', '你是新搬来的?这里的人……都很守时。']],
  ['浇花的太太', 0xc06a8a, 0xf0e8da, ['我的天竺葵开得比画还美。', '下午好!晚上也好!', '街上今天有点不一样……哦,是你呀。']],
], );
addWalkers(OSM_ROADS.MOBT, MOB.x - 24, MOB.z + 34, [
  ['退休捕鲸手', 0x4a5a6a, 0x32404c, ['这条街我走了六十年:码头到教堂,九百步。', '现在的年轻人管鲸叫朋友。也好,也好。', '闻到没有?鹅卵石缝里还有鲸油灯的味道。']],
  ['船具店老板娘', 0x8a5a46, 0x6a4434, ['缆绳、帆布、罗盘,外加听不腻的港口八卦。', '亚哈?嘘——别在这条街提这个名字。', '南塔开特的鹅卵石,硌脚,但踩着踏实。']],
  ['灯塔学徒', 0x5a7a8a, 0x46606c, ['我在攒钱买我自己的灯。灯塔的那种灯。', '街尽头能看见三座浮标,我都给取了名字。', '师傅说:守灯先守心。我还在琢磨。']],
]);
{ const HLN = NISLES.find(s9 => s9.key === 'helena');
  addWalkers(OSM_ROADS.HELENA, HLN.x + 30, HLN.z + 28, [
    ['山谷邮差', 0x6a5a42, 0x4c3f2e, ['全岛的信,山脚到山顶,一天两趟。', '他在世那几年信最多——全欧洲都想看他一眼。', '詹姆斯敦就一条主街,谁也躲不开谁。']],
    ['卖亚麻的姑娘', 0x8a7a9a, 0x6a5c7a, ['岛上的亚麻,是大西洋的风织的。', '游客都问:他真住过这里?真的。', '街这么窄,故事却这么长。']],
    ['守钟老人', 0x5a6a5a, 0x42503f, ['教堂的钟慢五分钟。岛上时间,不必着急。', '涨潮时钟声传得远——你信吗?', '我给钟上了五十年发条,它比我守时。']],
  ]); }
/* 🎪 ⑦ 事件人群(每日事件限定) */
if (EVENT === 'fair') for (let i9 = 0; i9 < 5; i9++) addNpc({ x: 18 + (i9 % 3) * 6, z: 208 + Math.floor(i9 / 3) * 7, name: '赶集的旅人' + '甲乙丙丁戊'[i9], body: [0xc06a5a, 0x5a8a6a, 0xd9a62e, 0x6a6ad0, 0x8a5a8a][i9], lines: ['九折!整个群岛就今天!', '我从隔壁岛坐了两小时船来赶集。', '导绳买了吗?潜迷宫全靠它。'] });
if (EVENT === 'whales') for (let i9 = 0; i9 < 2; i9++) addNpc({ x: 446 + i9 * 9, z: -38, name: '观鲸客' + '甲乙'[i9], body: 0x4a7a9a, lines: ['嘘——看水柱!十点钟方向!', '我数到第七头了!它们朝北去。', '这辈子值了。'] });
if (EVENT === 'kites') for (let i9 = 0; i9 < 2; i9++) addNpc({ x: -44 + i9 * 88, z: -152, name: '放风筝的孩子' + '大小'[i9], faceUp: true, body: 0xd97a4a, lines: ['线!线不够长了!', '我的是红色那只!比云还高!', '爸爸说:风筝上天,烦恼落地。'] });
/* 👘 ⑥ 外观配饰:按名字哈希发围巾/背包/手杖(约四成) */
{ const H9 = s9 => { let h9 = 0; for (const c9 of (s9 || '')) h9 = (h9 * 31 + c9.charCodeAt(0)) | 0; return Math.abs(h9); };
  for (const n of allNpcs) {
    const t9 = (n.opts && n.opts.tall) || 1, w9 = (n.opts && n.opts.wide) || 1, hs9 = H9(n.name);
    if (hs9 % 10 < 3) { const sc9 = new THREE.Mesh(new THREE.TorusGeometry(.36 * w9, .09, 6, 12), lam([0xc0492b, 0x2c7a4b, 0xd9a62e, 0x4a6ab0][hs9 % 4])); sc9.rotation.x = Math.PI / 2; sc9.position.y = 2.02 * t9; n.g.add(sc9); }
    else if (hs9 % 10 < 5) { const bp9 = box(.52 * w9, .64, .26, lam([0x6a5a3a, 0x4a5a6a, 0x7a4a4a][hs9 % 3])); bp9.position.set(0, 1.52 * t9, -.52 * w9); n.g.add(bp9); }
    else if (hs9 % 10 === 5 && !(n.opts && n.opts.cane)) { const st9 = cyl(.045, .055, 1.9, M.woodDark, 5); st9.position.set(.56 * w9, .95, .12); st9.rotation.z = .1; n.g.add(st9); }
  }
}
/* ===== 🧱 障碍空间索引:玩家推离从全扫改查表(40m 网格,cirObs 数量变化自动重建) ===== */
let OIDX = null, OIDX_N = -1;
const OCELL = 40, OW = 106;
function obstNear(x, z) {
  if (!OIDX || OIDX_N !== cirObs.length) {
    OIDX = new Array(OW * OW).fill(null); OIDX_N = cirObs.length;
    for (const o of cirObs) {
      const pad = o.r + 3;
      const x0 = Math.max(0, ((o.x + 2120 - pad) / OCELL) | 0), x1 = Math.min(OW - 1, ((o.x + 2120 + pad) / OCELL) | 0);
      const z0 = Math.max(0, ((o.z + 2120 - pad) / OCELL) | 0), z1 = Math.min(OW - 1, ((o.z + 2120 + pad) / OCELL) | 0);
      for (let cz = z0; cz <= z1; cz++) for (let cx = x0; cx <= x1; cx++) { const k = cz * OW + cx; (OIDX[k] || (OIDX[k] = [])).push(o); }
    }
  }
  const cx = ((x + 2120) / OCELL) | 0, cz = ((z + 2120) / OCELL) | 0;
  if (cx < 0 || cz < 0 || cx >= OW || cz >= OW) return NIDX_EMPTY;
  return OIDX[cz * OW + cx] || NIDX_EMPTY;
}
/* ===== 🚋 青丘轨车:广场站 ⇄ 海岸站(70° 净空走廊,可搭乘) ===== */
const TRAM_A = [1764.1, 251.3], TRAM_B = [1781.9, 300.1];
const TRAM_LEN = Math.hypot(TRAM_B[0] - TRAM_A[0], TRAM_B[1] - TRAM_A[1]);
let qqTram = null, tramPos = 0, tramDir = 1, tramWait = 4, tramRiding = false;
function tramStep(dt) {
  zoneAudioTick(dt);
  if (!qqTram) { qqTram = scene.getObjectByName('qqTram'); if (!qqTram) return; qqTram.rotation.y = Math.atan2(-(TRAM_B[1] - TRAM_A[1]), TRAM_B[0] - TRAM_A[0]); }
  if (tramWait > 0) tramWait -= dt;
  else {
    tramPos += tramDir * dt * 4.2 / TRAM_LEN;
    const bell9 = () => { blip(820); setTimeout(() => blip(660), 170); };
    const alight9 = msg9 => { tramRiding = false; player.position.set(qqTram.position.x + 2.6, qqTram.position.y + 1, qqTram.position.z); toast(msg9); };
    if (tramPos >= 1) { tramPos = 1; tramDir = -1; tramWait = 6; bell9(); if (tramRiding) alight9('🚋 海岸站到了——雾笛就在前面'); }
    else if (tramPos <= 0) { tramPos = 0; tramDir = 1; tramWait = 6; bell9(); if (tramRiding) alight9('🚋 圆枢广场站到了'); }
  }
  const tx9 = TRAM_A[0] + (TRAM_B[0] - TRAM_A[0]) * tramPos, tz9 = TRAM_A[1] + (TRAM_B[1] - TRAM_A[1]) * tramPos;
  qqTram.position.set(tx9, Math.max(heightMesh(tx9, tz9), .3) + .12, tz9);
  if (tramRiding) { player.position.set(tx9, qqTram.position.y + 1.1, tz9); vy = 0; }
}
/* 🌫️ 雾笛:每次踏入青丘,低鸣一声(D) */
let lastZone9 = '', zoneChk9 = 0;
function foghorn() {
  try { if (!actx) return;
    const o9 = actx.createOscillator(), g9 = actx.createGain();
    o9.type = 'sine'; o9.frequency.value = 98;
    g9.gain.setValueAtTime(.0001, actx.currentTime);
    g9.gain.exponentialRampToValueAtTime(.16, actx.currentTime + .25);
    g9.gain.exponentialRampToValueAtTime(.001, actx.currentTime + 1.6);
    o9.connect(g9).connect(actx.destination); o9.start(); o9.stop(actx.currentTime + 1.7);
  } catch (e) {}
}
function zoneAudioTick(dt) {
  zoneChk9 -= dt; if (zoneChk9 > 0) return; zoneChk9 = .5;
  const zn9 = $('zoneName').textContent;
  if (zn9 !== lastZone9) { if ((zn9 === '青丘' || zn9 === '雾港') && lastZone9) foghorn(); lastZone9 = zn9; }
}
/* ===== 🤝 居民每日委托:每天两单,串起食单·明信片·好感(C) ===== */

const DQ_DATE = new Date().toLocaleDateString('zh-CN');
let DQ = null;
try { const d0 = JSON.parse(PSTORE.getItem('w1001.dq') || 'null'); if (d0 && d0.d === DQ_DATE) DQ = d0.q; } catch (e) {}
const saveDQ = () => { try { PSTORE.setItem('w1001.dq', JSON.stringify({ d: DQ_DATE, q: DQ })); } catch (e) {} };
const dqFor = nm9 => (DQ || []).find(q => q.n === nm9 && q.s < 2);
(function dqInit() {
  if (DQ) return;
  const pool = allNpcs.filter(n => n.name && !n.night && !n.day && !/赶集|观鲸|放风筝/.test(n.name));
  if (pool.length < 6) { DQ = []; return; }
  const seed = Math.floor(Date.now() / 864e5);
  const n1 = pool[(seed * 7919) % pool.length];
  let n2 = pool[(seed * 7919 + 131) % pool.length];
  if (n2 === n1) n2 = pool[(seed * 7919 + 262) % pool.length];
  DQ = [
    { n: n1.name, t: 'food', f: DQ_FOODS[seed % DQ_FOODS.length], s: 0 },
    { n: n2.name, t: 'card', s: 0 },
  ];
  saveDQ();
})();
/* ===== 💡 灯光治理:场景 110 盏点光是帧率头号杀手 ===== */
const ALL_LIGHTS = [];
scene.traverse(o => { if (o.isPointLight) ALL_LIGHTS.push(o); });
if (typeof lightLamp !== 'undefined' && lightLamp) lightLamp.userData.farVis = 700;   // 灯塔照得远
if (unjTowerLight) unjTowerLight.userData.farVis = 900;                               // 人类之灯全城可见
if (typeof fireLight !== 'undefined' && fireLight) fireLight.userData.farVis = 400;
for (const L9 of [diveLight, causticLight, abyssLight]) if (L9) L9.userData.noCull = true;   // 潜水灯组自有开关
const _lw = new THREE.Vector3();
function cullLights() {
  const cand = [];
  for (const L9 of ALL_LIGHTS) {
    if (L9.userData.noCull) continue;
    if (L9.intensity <= .03) { L9.visible = false; continue; }
    L9.getWorldPosition(_lw);   // 灯可能嵌在 Group 里,必须取世界坐标
    const fv = L9.userData.farVis || 250;
    const d2 = (player.position.x - _lw.x) ** 2 + (player.position.z - _lw.z) ** 2;
    if (d2 >= fv * fv) { L9.visible = false; continue; }
    cand.push([d2, L9]);
  }
  cand.sort((a2, b2) => a2[0] - b2[0]);
  const MAXL = MOBILE ? 8 : 16;   // 最近 N 盏硬上限,着色成本有界
  for (let i = 0; i < cand.length; i++) cand[i][1].visible = i < MAXL;
}
cullLights();
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
/* ===== 🚲⛵ 座驾:折叠自行车 + 燕鸥号帆船(R 键 / 宫格「座驾」) ===== */
let vehicle = 0;   // 0 步行 1 自行车 2 帆船
const bikeGrp = new THREE.Group(); bikeGrp.name = 'bike'; bikeGrp.visible = false;
{
  const frame = lam(0x2e6a9a), dark = lam(0x22262c);
  for (const oz of [-.56, .56]) { const wh = new THREE.Mesh(new THREE.TorusGeometry(.34, .055, 8, 16), dark); wh.position.set(0, .35, oz); wh.rotation.y = Math.PI / 2; bikeGrp.add(wh); }
  const bar = cyl(.045, .045, 1.05, frame, 6); bar.rotation.x = Math.PI / 2; bar.position.set(0, .62, 0); bikeGrp.add(bar);
  const seatP = cyl(.04, .04, .5, frame, 6); seatP.position.set(0, .82, -.28); bikeGrp.add(seatP);
  const seat = box(.26, .07, .34, dark); seat.position.set(0, 1.06, -.3); bikeGrp.add(seat);
  const handP = cyl(.04, .04, .55, frame, 6); handP.rotation.x = .3; handP.position.set(0, .86, .5); bikeGrp.add(handP);
  const hand = cyl(.035, .035, .5, dark, 6); hand.rotation.z = Math.PI / 2; hand.position.set(0, 1.1, .56); bikeGrp.add(hand);
}
player.add(bikeGrp);
const boatGrp = new THREE.Group(); boatGrp.name = 'boat'; boatGrp.visible = false;
{
  const wood = lam(0x8a5a32), woodD = lam(0x6a4424);
  const hull = box(1.5, .5, 3.6, wood); hull.position.set(0, .28, 0); boatGrp.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(.72, 1.1, 4), wood); bow.rotation.x = Math.PI / 2; bow.rotation.z = Math.PI / 4; bow.position.set(0, .3, 2.3); boatGrp.add(bow);
  for (const sx4 of [-.72, .72]) { const gun = box(.12, .22, 3.6, woodD); gun.position.set(sx4, .58, 0); boatGrp.add(gun); }
  const mast = cyl(.06, .08, 3, woodD, 6); mast.position.set(0, 1.9, .7); boatGrp.add(mast);
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2), new THREE.MeshLambertMaterial({ color: 0xf2eee0, side: THREE.DoubleSide }));
  sail.position.set(.02, 2.1, .02); sail.rotation.y = .18; boatGrp.add(sail);
  const boom = cyl(.04, .04, 1.4, woodD, 5); boom.rotation.x = Math.PI / 2; boom.position.set(0, 1.15, -.05); boatGrp.add(boom);
}
player.add(boatGrp);
function toggleVehicle() {
  if (diving || flight) { toast('现在不是换座驾的时候'); return; }
  if (vehicle) {
    toast(vehicle === 1 ? '🚲 下车,改用十一路' : '⛵ 收帆'); blip(500);
    vehicle = 0; bikeGrp.visible = boatGrp.visible = false; return;
  }
  const h = height(player.position.x, player.position.z);
  if ((swimming || h < 1.2) && gear.owned.includes('boat')) { vehicle = 2; boatGrp.visible = true; toast('⛵ 燕鸥号扬帆!任何一座岛的岸,都是码头'); blip(680); return; }
  if (!swimming && h >= .5 && gear.owned.includes('bike')) { vehicle = 1; bikeGrp.visible = true; toast('🚲 骑上自行车(再按 R 下车,Shift 冲刺)'); blip(680); return; }
  if (!gear.owned.includes('bike') && !gear.owned.includes('boat')) toast('🛒 座驾在千岛装备行有售:🚲 折叠自行车 60 ⚡ / ⛵ 燕鸥号帆船 160 ⚡');
  else toast(swimming || h < 1.2 ? '这里下水——帆船需在装备行购得' : '这里是陆地——自行车需在装备行购得');
}
let joy = { on: false, vx: 0, vy: 0 }, photoMode = false;
/* 键盘/触屏共用的功能开关(P 照片 · F 滤镜 · K 观星 · V 蓝图幻影) */
function togglePhoto() {
  photoMode = !photoMode;
  for (const id of ['hud', 'minimap', 'compass', 'hint']) $(id).style.visibility = photoMode ? 'hidden' : '';
  if (bokehPass) bokehPass.enabled = photoMode;   // 景深仅照片模式
  btnSnap.style.display = photoMode ? '' : 'none';
  if (!photoMode) { renderer.domElement.style.filter = ''; photoFilter = 0; toast('已退出照片模式'); }
  else toast(isTouch ? '📷 照片模式:景深虚化开启(🎞️ 换滤镜,再点 📷 退出)' : '📷 照片模式:景深虚化开启(F 切换滤镜,P 退出)');
  syncMobMenu();
}
function nextFilter() {
  photoFilter = (photoFilter + 1) % PHOTO_FILTERS.length;
  renderer.domElement.style.filter = PHOTO_FILTERS[photoFilter][1];
  toast('🎞️ 滤镜:' + PHOTO_FILTERS[photoFilter][0]);
}
function toggleStarGaze() {
  starGaze = !starGaze;
  toast(starGaze ? (curDA >= .32 ? '🔭 观星模式已开(夜幕降临后仰望星空)' : '🔭 观星模式:仰望星空,星座之名浮现') : '观星模式已关');
}
function tryPhantom() {
  if (Math.hypot(player.position.x - UNJ.x, player.position.z - UNJ.z) > 175) return;
  const bp = [1, 2, 3, 4].filter(i => PSTORE.getItem('w1001.unjb' + i) === '1').length;
  if (!bp) { toast('📐 手里还没有蓝图——去神殿、法庭、运动场和塔基找找'); return; }
  unjPhantomT = 6; toast('📐 蓝图幻影:这座城本该的样子……几秒后,又只剩海风。'); blip(880);
}
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'escape') { closeModals(); return; }
  if (k === 'j') { modalOpen && !$('journal').classList.contains('hidden') ? closeModals() : openJournal(); return; }
  if (k === 'h') { $('intro').classList.remove('hidden'); return; }
  if (k === 'p') { togglePhoto(); return; }
  if (k === 'f' && photoMode) { nextFilter(); return; }
  if (k === 'c' && photoMode) { pcPending = true; return; }   // 💌 拍明信片
  if (k === 'm') { mapKey(false); return; }
  if (k === 'n') { mapKey(true); return; }
  if (k === 'g' && !MOBILE) { quality = (quality + 2) % 3; applyQuality(); toast('🖥️ 画质:' + ['低(最流畅)', '中', '高(GTAO 环境光遮蔽)'][quality]); return; }
  if (k === 'v') { tryPhantom(); return; }   // 蓝图幻影(未竟之都)
  if (k === 'q' && diving) { fireSonar(); return; }   // 声呐探路
  if (k === 'r' && !modalOpen) { toggleVehicle(); return; }   // 🚲⛵ 座驾
  if (k === 'k') { toggleStarGaze(); return; }   // 观星模式:夜间显示星座名
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
  if (nearSpot && nearSpot.cat === 'air') { openAirCounter(nearSpot.airKey); return; }
  if (nearSpot && nearSpot.cat === 'fund') { openFund(); return; }
  if (nearSpot && nearSpot.cat === 'food') { openFood(nearSpot.fid); return; }
  if (nearSpot && nearSpot.cat === 'tailor') { openTailor(); return; }
  if (nearSpot && nearSpot.cat === 'home') { openHome(); return; }
  if (!nearSpot && qqTram && Math.hypot(player.position.x - qqTram.position.x, player.position.z - qqTram.position.z) < 5.5) {
    if (!tramRiding) { tramRiding = true; toast('🚋 上车!一百年,就跑这一条线'); blip(700); }
    else { tramRiding = false; player.position.x += 2.6; toast('🚋 你跳下了轨车'); }
    return;
  }
  if (nearSpot && nearSpot.cat === 'dive') { enterDive(nearSpot.portal); return; }
  if (nearSpot) { openCard(nearSpot); return; }
  if (nearFspot) { startCast(nearFspot); return; }
  if (nearNpc) talkTo(nearNpc);
}
/* --- NPC 文字对话:走近按 E,选话题、听应答 --- */
function talkTo(npc) {
  talkNpc = npc; npc._t = 0;
  if (npcSleeping(npc)) { npc._asleep = true; npc._ctx = ''; renderTalk('……(平稳的鼾声。' + npc.name + '睡得正香,梦里像是在讨价还价。)'); return; }
  npc._asleep = false; npc._ctx = npcCtxLine();
  if (visitGift9 === npc.name) { visitGift9 = null; earnSB(15); setTimeout(() => toast('🎁 ' + npc.name + ' 带了乔迁贺礼 · ⚡+15——"住得像样,就常回来。"'), 800); }
  const dq0 = dqFor(npc.name);
  if (dq0 && dq0.t === 'food' && dq0.s === 1) { dq0.s = 2; saveDQ(); earnSB(10); affAdd(npc.name, 2); setTimeout(() => toast('🤝 委托完成!' + npc.name + ' 接过还热乎的吃食 · ⚡+10 ❤+2'), 500); }
  const a9 = affAdd(npc.name, 1);
  if (a9.n >= 6 && !a9.g) { a9.g = 1; PSTORE.setItem('w1001.aff', JSON.stringify(AFF)); earnSB(6); setTimeout(() => toast('🎁 ' + npc.name + ' 塞给你一件小玩意 · ⚡+6——"拿着,老朋友的规矩。"'), 600); }
  renderTalk(npc.lines[0] || '(……)'); blip(520);
}
function renderTalk(text) {
  const npc = talkNpc; if (!npc) return;
  const topics = npc._asleep ? [] : (npc.topics || [{ q: '这一带有什么值得看的?', a: '把腿借给好奇心——往人多处走有故事,往没人处走有风景。两头都别空手回来。' }])
    .concat(affOf(npc.name) >= 3 ? [{ q: '(闲聊几句)', a: '跟你说话很自在。这片海我看腻了——可每次你来,都像有船进港。' }] : []);
  cardBody.innerHTML = `<div class="cardHead" style="background:#3a4a6a">💬 与 ${esc(npc.name)} 交谈 <span style="color:#ff9db0;font-size:13px">${"❤".repeat(Math.min(5, Math.ceil(affOf(npc.name) / 3)))}</span></div>${npc._ctx ? `<div style="font-size:12px;color:#8a94a8;padding:10px 20px 0;font-style:italic">“${esc(npc._ctx)}”</div>` : ""}
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

const isTouch = matchMedia('(pointer: coarse)').matches || location.hash.includes('touch');
if (isTouch) $('btnAct').classList.remove('hidden');
/* 移动端快捷菜单:⋯ 展开 海图/观星/照片(+滤镜)/蓝图幻影;潜水时收起、改出 📡 声呐钮 */
let mobMenuOpen = false, mobBtns = {};
function syncMobMenu() {
  if (!mobBtns.wrap) return;
  mobBtns.wrap.style.display = diving ? 'none' : 'flex';
  mobBtns.pane.style.display = mobMenuOpen ? 'grid' : 'none';
  mobBtns.filter.style.display = photoMode ? '' : 'none';
  mobBtns.phantom.style.display = Math.hypot(player.position.x - UNJ.x, player.position.z - UNJ.z) < 175 ? '' : 'none';
  if (mobBtns.home) mobBtns.home.style.display = PSTORE.getItem('w1001.home') === '1' ? '' : 'none';
  mobBtns.sonar.style.display = diving ? '' : 'none';
}
if (isTouch) {
  const mk = (sym, title) => { const b = document.createElement('button'); b.textContent = sym; b.title = title;
    Object.assign(b.style, { width: '54px', height: '54px', borderRadius: '50%', border: '2px solid rgba(255,255,255,.4)', background: 'rgba(16,34,52,.82)', fontSize: '23px', touchAction: 'manipulation', flex: 'none' }); return b; };
  const mkItem = (sym, label) => {   // 宫格项:图标 + 小字标签
    const b = document.createElement('button'); b.title = label;
    b.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:3px;width:58px;padding:8px 0 6px;border:none;border-radius:12px;background:rgba(255,255,255,.07);color:#dfe8f0;font-size:22px;line-height:1;touch-action:manipulation';
    b.innerHTML = sym + '<span style="font-size:10px;letter-spacing:1px;color:#aecbdd">' + label + '</span>';
    return b;
  };
  const wrap = document.createElement('div'); wrap.id = 'mobMenu';
  Object.assign(wrap.style, { position: 'fixed', right: '24px', bottom: '188px', zIndex: '31', display: 'flex', flexDirection: 'row-reverse', gap: '10px', alignItems: 'flex-end' });
  const tog = mk('⋯', '更多功能');
  const pane = document.createElement('div');
  pane.style.cssText = 'display:none;grid-template-columns:repeat(3,58px);gap:8px;padding:10px;background:rgba(8,20,32,.9);border:1px solid rgba(140,200,255,.2);border-radius:16px;backdrop-filter:blur(5px);box-shadow:0 10px 34px rgba(0,0,0,.5);transform-origin:bottom right;animation:mobPop .16s ease-out';
  { const st3 = document.createElement('style'); st3.textContent = '@keyframes mobPop{from{transform:scale(.9);opacity:0}}'; document.head.appendChild(st3); }
  const bMap = mkItem('🗺️', '海图'), bGlb = mkItem('🌐', '地球仪'), bVeh = mkItem('🚲', '座驾'), bStar = mkItem('🔭', '观星'), bPhoto = mkItem('📷', '照片'), bFilm = mkItem('🎞️', '滤镜'), bPh = mkItem('📐', '幻影'), bHome = mkItem('🏠', '回家');
  pane.append(bMap, bGlb, bVeh, bHome, bStar, bPhoto, bFilm, bPh);
  wrap.append(tog, pane); document.body.appendChild(wrap);
  const bSonar = mk('📡', '声呐探路');
  Object.assign(bSonar.style, { position: 'fixed', right: '100px', bottom: '258px', zIndex: '30', display: 'none' });
  document.body.appendChild(bSonar);
  mobBtns = { wrap, pane, filter: bFilm, phantom: bPh, sonar: bSonar, home: bHome };
  bSonar.addEventListener('click', () => fireSonar());
  tog.addEventListener('click', () => { mobMenuOpen = !mobMenuOpen; syncMobMenu(); blip(640); });
  bMap.addEventListener('click', () => { mobMenuOpen = false; syncMobMenu(); mapKey(false); });
  bGlb.addEventListener('click', () => { mobMenuOpen = false; syncMobMenu(); mapKey(true); });
  bVeh.addEventListener('click', () => { mobMenuOpen = false; syncMobMenu(); toggleVehicle(); });
  bHome.addEventListener('click', () => { mobMenuOpen = false; syncMobMenu(); if (PSTORE.getItem('w1001.home') !== '1') { toast('🏠 先去主岛东滩把那块空地买下来(200 ⚡)'); return; } player.position.set(HOME_POS[0], height(HOME_POS[0], HOME_POS[1]) + 1, HOME_POS[1] + 6); vy = 0; toast('🏠 到家了'); blip(600); });
  bStar.addEventListener('click', () => { mobMenuOpen = false; syncMobMenu(); toggleStarGaze(); });
  bPhoto.addEventListener('click', togglePhoto);
  bFilm.addEventListener('click', nextFilter);
  bPh.addEventListener('click', () => { mobMenuOpen = false; syncMobMenu(); tryPhantom(); });
  setInterval(syncMobMenu, 1000);
  syncMobMenu();
}
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
addEventListener('wheel', e => { camDist = clamp(camDist * (1 + e.deltaY * .001), 7, 120); }, { passive: true });   // 最远 120:全岛鸟瞰

/* ---------- 主循环 ---------- */
const HINTS = { painting: '欣赏这幅画', shelf: '翻翻这架书', tree: '观察这只鸟', bed: '看看这株植物', bar: '来一杯!', keg: '看看这桶酒', table: '看看桌上的酒', tank: '看看水里', crate: '翻翻唱片', stand: '听听这份录音', tent: '参观营地', board: '查看路线', sign: '查看路牌', news: '报亭 · 今日两刊', shop: '逛逛装备行', ferry: '多元宇宙渡口', door: '推开天空之门', camera: '看看那是什么', lamp: '检查坠落物', ring: '看看基座上的东西', crater: '末日火山口', hole: '敲敲圆门', eye: '仰望黑塔(别看太久)', train: '霍格沃茨特快', castle: '城堡大门 · 分院帽', hoops: '魁地奇球场', hut: '拜访海格小屋', inn: '喷水鲸客栈', chowder: '来碗杂烩汤(4 SB)', doubloon: '桅杆上的金币', stadium: '梦剧场 · 德比日', pitch: '场边观战', scalper: '这位朋友鬼鬼祟祟', gate: '沉睡的星门', bluehole: '🤿 潜入海底蓝洞', airport: '✈️ 航空柜台 · 购票飞行', fund: '❤️ 群岛基金会 · 捐赠与荣誉', food: '🍜 小吃摊 · 尝一口地方味', tailor: '👘 裁缝铺 · 披风与帽子', home: '🏠 旅人小屋' };
for (const k in LORE) HINTS[k] = LORE[k].hint;
const clock = new THREE.Clock();
const v3 = new THREE.Vector3();
let saveT = 0, whaleT = 20, coldT = 0, lastTint = 0x3b6ea5, chowderT = 0, lastScoreMin = -1;
let flight = null, roarT = 14, sirenT = 2;
let bucketT = 0, npcFrame = 0, fpsN = 0, fpsT = 0, prScale = MOBILE ? 1.5 : 1.75;
const PR_MAX = prScale;
let farMode = false;   // 🔭 远景模式:拉远看全岛时自动降载
const setPR = () => { renderer.setPixelRatio(Math.min(devicePixelRatio || 1, prScale * (farMode ? .8 : 1))); if (composer) composer.setSize(innerWidth, innerHeight); };
function syncFarView() {
  const far9 = camDist > 60;
  if (far9 === farMode) return;
  farMode = far9;
  setPR();
  if (gtaoPass) gtaoPass.enabled = !far9 && quality >= 2;
}
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
    /* 海流:粒子顺流漂 + 对玩家的轻推(跟着水流走=朝出口走) */
    if (flowPts && MAZE_FLOW) {
      const u2 = flowPts.userData, arr2 = flowPts.geometry.attributes.position.array;
      for (let i = 0; i < u2.FN2; i++) {
        const ei2 = u2.fe[i], fl2 = MAZE_FLOW[ei2] || 1;
        const [a2, b2] = MAZE_EDGES[ei2], A2 = MAZE_NODES[a2], B2 = MAZE_NODES[b2];
        u2.ft[i] += dt * (RAPIDS.has(ei2) ? .2 : .06) * fl2; if (u2.ft[i] > 1) u2.ft[i] = 0; else if (u2.ft[i] < 0) u2.ft[i] = 1;
        const tt3 = u2.ft[i];
        arr2[i * 3] = A2[0] + (B2[0] - A2[0]) * tt3 + Math.sin(t * .8 + i) * .8 + u2.fo[i * 2] * .4;
        arr2[i * 3 + 1] = A2[1] + (B2[1] - A2[1]) * tt3 + Math.cos(t * .7 + i) * .6;
        arr2[i * 3 + 2] = A2[2] + (B2[2] - A2[2]) * tt3 + u2.fo[i * 2 + 1] * .4;
      }
      flowPts.geometry.attributes.position.needsUpdate = true;
      const fdir = MAZE_FLOW[nearEdge];
      if (fdir) { const [a3, b3] = MAZE_EDGES[nearEdge], A3 = MAZE_NODES[a3], B3 = MAZE_NODES[b3];
        const dl = Math.hypot(B3[0] - A3[0], B3[1] - A3[1], B3[2] - A3[2]) || 1, pw = (RAPIDS.has(nearEdge) ? 1.6 : .45) * fdir * dt / dl;
        player.position.x += (B3[0] - A3[0]) * pw; player.position.y += (B3[1] - A3[1]) * pw; player.position.z += (B3[2] - A3[2]) * pw; }
    }
    for (const jf of jellies) { jf.position.y = jf.userData.by + Math.sin(t * .9 + jf.userData.ph) * 1.4; const ps = 1 + Math.sin(t * 2.2 + jf.userData.ph) * .18; jf.children[0].scale.set(ps, 1, ps); }
    if (abyssLight) abyssLight.intensity = 1 + Math.sin(t * 1.1) * .6;
    if (babelBook) { babelBook.rotation.y = t * .35; babelBook.position.y = -.6 + Math.sin(t * .8) * .35; }
    for (const bl of babelLamps) { const br2 = 1 + Math.sin(t * 1.4 + bl.ph * 2) * .18; bl.light.intensity = 1.1 * br2; bl.mesh.scale.setScalar(.9 + br2 * .12); }
    if (babelDust) babelDust.rotation.y = t * .04;
    // 气瓶(气室内回充)
    let inAir = false;
    for (const ni of AIR_NODES) { const n = MAZE_NODES[ni]; if (Math.hypot(player.position.x - n[0], player.position.y - n[1], player.position.z - n[2]) < TUBE_R + 3) { inAir = true; break; } }
    diveAir = inAir ? Math.min(gearOn('mask') ? 200 : 100, diveAir + dt * 28) : diveAir - dt * 1.4;
    if (inAir && airChamberT <= 0) { airChamberT = 6; toast('🫧 气室——氧气回满,喘口气再走'); }
    airChamberT -= dt;
    const fill = $('diveAirFill'); if (fill) { fill.style.width = Math.max(0, diveAir / (gearOn('mask') ? 2 : 1)) + '%'; fill.style.background = diveAir < 25 ? '#ff5a4a' : 'linear-gradient(90deg,#2ad0ff,#7affd0)'; }
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
    if (dh) dh.textContent = nearPortal >= 0
      ? (isTouch ? `⬆️ 点 👀 从「${MAZE_PORTALS[nearPortal].isle}」的蓝洞浮出水面` : `⬆️ 按 E 从「${MAZE_PORTALS[nearPortal].isle}」的蓝洞浮出水面`)
      : (isTouch ? `${ZONES[diveZone].name} · ⬆️⬇️钮浮潜 · 📡 声呐 · 找浮标点 👀 出水` : `${ZONES[diveZone].name} · 空格上浮 Shift下潜 · Q 声呐 · 找浮标按 E 出水`);
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
      const sp = (vehicle === 2 ? (keys.shift ? 40 : 33)
        : swimming ? (gearOn('swim') ? 7.5 : (chowderT > 0 ? 5.5 : 3.2))
        : vehicle === 1 ? (keys.shift ? 35 : 29) * (BUFF.ride > 0 ? 1.15 : 1)
        : (keys.shift ? (gearOn('boots') ? 26 : 22) : 14) * (BUFF.run > 0 ? 1.12 : 1)) * dt;
      let dx = (fx * -mz + rx * mx) * sp, dz = (fz * -mz + rz * mx) * sp;
      player.position.x += dx; player.position.z += dz;
      faceYaw = Math.atan2(dx, dz);
      walkPhase += dt * 10; pMoving = true;
    }
    // 边界
    // 世界边界:方形 ±1960(地形网格为 ±2000 方格,四角亦可驻岛)
    player.position.x = Math.max(-1960, Math.min(1960, player.position.x));
    player.position.z = Math.max(-1960, Math.min(1960, player.position.z));
    // 障碍推离
    const pr = .9;
    for (const o of obstNear(player.position.x, player.position.z)) {
      if (o.top && player.position.y > o.top) continue;   // 高处放行(如进步之塔断口平台)
      if (o.bot && player.position.y < o.bot) continue;   // 低处放行(如天空之城下方海面)
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
  let gh = heightMesh(player.position.x, player.position.z);   // 视觉网格采样,贴合脚下三角面
  let bh = null;
  if (!diving) {
    bh = bridgeHeight(player.position.x, player.position.z);
    if (bh != null && player.position.y > bh - 1.6) gh = Math.max(gh, bh);
    const ph2 = pierHeight(player.position.x, player.position.z);
    if (ph2 != null && player.position.y > ph2 - 1.4) gh = Math.max(gh, ph2);
    const sth = stadiumHeight(player.position.x, player.position.z);
    if (sth != null && player.position.y > sth - 2.4) gh = Math.max(gh, sth);
    const uth = unjTowerHeight(player.position.x, player.position.z);
    if (uth != null && player.position.y > uth - 2.4) gh = Math.max(gh, uth);
    const skh = skyHeight(player.position.x, player.position.z);
    if (skh != null && player.position.y > skh - 2.4) gh = Math.max(gh, skh);
    if (vehicle === 2) {   // ⛵ 帆船:浮于水面,不入泳姿
      swimming = false; vy = 0; grounded = true;
      player.position.y += ((tideY + .62) - player.position.y) * Math.min(1, dt * 8);
      player.rotation.x += (0 - player.rotation.x) * Math.min(1, dt * 8);
      const rk9 = WEATHER === 'storm' ? 2.8 : 1;   // 风暴颠簸
      boatGrp.rotation.z = Math.sin(t * (WEATHER === 'storm' ? 2.6 : 1.7)) * .04 * rk9; boatGrp.rotation.x = Math.sin(t * 1.3 + 1) * .03 * rk9;
      if (gh > .8) { vehicle = 0; boatGrp.visible = false; toast('⛵ 船底擦沙——搁浅收帆,上岸!'); blip(520); }
    } else {
    swimming = gh < -.6;
    if (swimming) {
      if (vehicle === 1) { vehicle = 0; bikeGrp.visible = false; toast('🚲 自行车不会游泳——下车!'); }
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
    const gust9 = Math.max(.3, .74 + .26 * Math.sin(t * .21) + .16 * Math.sin(t * 1.13 + 2) + (WEATHER === 'storm' ? .4 * Math.sin(t * 3.1) : 0));   // 🌬️ 分层阵风
    if (grassMat.userData.shader) { grassMat.userData.shader.uniforms.uTime.value = t; grassMat.userData.shader.uniforms.uGust.value = gust9; }
    for (const m of treeWindMats) if (m.userData.shader) { m.userData.shader.uniforms.uTime.value = t; m.userData.shader.uniforms.uGust.value = gust9; }   // 树冠风摆
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
  if (unjTowerLight) { unjTowerLight.intensity = unjTowerOn ? 46 + Math.sin(t * 2.2) * 6 : 0; unjTowerBulb.visible = unjTowerOn; }
  if (unjFountainMesh) unjFountainMesh.visible = unjFountainOn || unjPhantomT > 0;
  if (unjPhantom) { if (unjPhantomT > 0) { unjPhantomT -= dt; unjPhantom.visible = true; } else unjPhantom.visible = false; }
  if (unjGamesT > 0) {   // 幻影运动会:选手绕场 + 圣火摇曳,尾声 6 秒渐隐
    unjGamesT -= dt;
    const sx9 = UNJ.x + 52, sz9 = UNJ.z + 52;
    for (const r of unjGamesGrp.children) {
      if (!r.userData.sp) continue;
      const a9 = r.userData.a0 + t * r.userData.sp;
      const rx9 = sx9 + Math.cos(a9) * 11.5, rz9 = sz9 + Math.sin(a9) * 8.5;
      r.position.set(rx9, height(rx9, rz9) + .1, rz9); r.rotation.y = -a9;
    }
    const fade = unjGamesT > 6 ? 1 : Math.max(0, unjGamesT / 6);
    unjFlame.scale.y = 1 + Math.sin(t * 9) * .15; unjFlame.material.opacity = .85 * fade;
    unjGamesGrp.userData.light.intensity = 30 * fade;
    if (unjGamesT <= 0) { unjGamesGrp.visible = false; toast('…比赛结束了。跑道空了,火炬又冷了。守夜人朝你脱帽。'); }
  }
  for (let mi = 0; mi < mirages.length; mi++) {   // 蜃楼:近之则隐
    const mg = mirages[mi];
    const md = Math.hypot(player.position.x - mg.position.x, player.position.z - mg.position.z);
    const mv = Math.min(1, Math.max(0, (md - 190) / 260)) * (curDA >= .3 ? 1 : .25) * (WEATHER === 'storm' ? .1 : RAINY ? .45 : 1);   // 夜里更淡,雨雾隐没
    mg.visible = mv > .03;
    if (mg.visible) { for (const m2 of mg.userData.mats) m2.opacity = m2.userData.base * mv; mg.position.y = Math.sin(t * .4 + mi * 2.1) * 1.5; }
    if (mg.visible && mg.userData.orbit) mg.rotation.y += dt * mg.userData.orbit;   // 海市船队环行
  }
  evT += dt;   // 🎪 事件景物
  if (evMeteors && curDA < .35) for (let i = 0; i < evMeteors.length; i++) {   // 流星:夜间每隔几秒划一道
    const m9 = evMeteors[i], ph9 = (evT * .22 + i * .37) % 1;
    if (ph9 < .12) { if (m9.material.opacity === 0) m9.position.set(player.position.x - 120 + ((evT * 7 + i * 131) % 240), 150 + i * 22, player.position.z - 180);
      m9.material.opacity = Math.sin(ph9 / .12 * Math.PI) * .9; m9.position.x += dt * 60; m9.position.y -= dt * 20; }
    else m9.material.opacity = 0;
  }
  if (evWhales) for (const h9 of evWhales.children) {   // 鲸群:主岛外海列队洄游
    const a9 = evT * .05 + h9.userData.off * .04;
    h9.position.set(Math.cos(a9) * 760, Math.sin(evT * .9 + h9.userData.off) * 2.4 - 2.2, Math.sin(a9) * 760);
  }
  if (evKites) for (const k9 of evKites.children) {   // 风筝:主岛上空摇曳
    k9.position.y = 46 + Math.sin(evT * .7 + k9.userData.ph) * 5;
    k9.rotation.y = Math.sin(evT * .5 + k9.userData.ph) * .5;
  }
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
    f.position.set(fx, Math.max(heightMesh(fx, fz), 0) + 2.2 + Math.sin(t * 1.3 + u.ph) * .5, fz);
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
  /* 👣⛵🫧🌊 微痕迹与泡沫 */
  if (!MOBILE) {
    if (foamPts) { foamPts.material.opacity = .26 + Math.sin(t * 1.1) * .1; foamPts.position.y = tideY * .8; }
    CLOUDU9.t.value = t;
    if (grounded && pMoving && !diving && vehicle === 0) {   // 👣 沙滩脚印
      stepT9 -= dt;
      const hh9 = player.position.y;
      if (stepT9 <= 0 && hh9 > .2 && hh9 < 1.9) {
        stepT9 = .34; stepSide9 = -stepSide9;
        const fp9 = new THREE.Mesh(stepGeo9, stepMat9);
        fp9.rotation.x = -Math.PI / 2; fp9.scale.set(.8, 1.3, 1); fp9.rotation.z = -faceYaw;
        fp9.position.set(player.position.x - Math.sin(faceYaw) * .2 + Math.cos(faceYaw) * .28 * stepSide9, Math.max(heightMesh(player.position.x, player.position.z), 0) + .05, player.position.z - Math.cos(faceYaw) * .2 - Math.sin(faceYaw) * .28 * stepSide9);
        scene.add(fp9); steps9.push({ m: fp9, life: 7 });
        if (steps9.length > 22) { const o9 = steps9.shift(); scene.remove(o9.m); }
      }
    }
    for (let i9 = steps9.length - 1; i9 >= 0; i9--) { const s9 = steps9[i9]; s9.life -= dt; if (s9.life < 0) { scene.remove(s9.m); steps9.splice(i9, 1); } else if (s9.life < 2) s9.m.scale.setScalar(Math.max(.01, s9.life / 2)); }
    if (vehicle === 2 && pMoving) {   // ⛵ 船尾迹
      wakeT9 -= dt;
      if (wakeT9 <= 0) {
        wakeT9 = .22;
        const wk9 = new THREE.Mesh(wakeGeo9, wakeMat9);
        wk9.rotation.x = -Math.PI / 2;
        wk9.position.set(player.position.x - Math.sin(faceYaw) * 2.6, tideY + .22, player.position.z - Math.cos(faceYaw) * 2.6);
        scene.add(wk9); wakes9.push({ m: wk9, life: 2.6 });
        if (wakes9.length > 14) { const o9 = wakes9.shift(); scene.remove(o9.m); }
      }
    }
    for (let i9 = wakes9.length - 1; i9 >= 0; i9--) { const w9 = wakes9[i9]; w9.life -= dt; if (w9.life < 0) { scene.remove(w9.m); wakes9.splice(i9, 1); } else { w9.m.scale.setScalar(1 + (2.6 - w9.life) * 1.4); } }
    if (smokePts9) {   // 🏭 炊烟:缓升回卷,晨昏夜更浓
      const sp9 = smokePts9.geometry.attributes.position;
      for (let i9 = 0; i9 < sp9.count; i9++) {
        const c9 = CHIM9[i9 % CHIM9.length];
        let y9 = sp9.getY(i9) + dt * (.7 + (i9 % 3) * .25);
        if (y9 > c9[1] + 5) y9 = c9[1];
        sp9.setY(i9, y9);
        sp9.setX(i9, c9[0] + Math.sin(y9 * .8 + smokeSeed9[i9]) * .5);
      }
      sp9.needsUpdate = true;
      smokePts9.material.opacity = .1 + (1 - curDA) * .22;
    }
    bubPts9.visible = diving;
    if (diving) {   // 🫧 潜水气泡
      const bp9 = bubPts9.geometry.attributes.position;
      if (pMoving && Math.random() < dt * 9) {
        bubI9 = (bubI9 + 1) % bp9.count;
        bp9.setXYZ(bubI9, player.position.x + (Math.random() - .5) * .8, player.position.y + .6, player.position.z + (Math.random() - .5) * .8);
        bubY09[bubI9] = player.position.y + .6;
      }
      for (let i9 = 0; i9 < bp9.count; i9++) { const y9 = bp9.getY(i9); if (y9 > -900) { bp9.setY(i9, y9 + 3 * dt); if (y9 - bubY09[i9] > 7) bp9.setY(i9, -999); } }
      bp9.needsUpdate = true;
    }
  }
  if (rainPts) {
    rainPts.position.copy(player.position);
    const rp3 = rainPts.geometry.attributes.position, ru9 = rainPts.userData;
    for (let i = 0; i < rp3.count; i++) {
      let y3 = rp3.getY(i) - ru9.fall * dt;
      if (y3 < -4) y3 = 55;
      rp3.setY(i, y3);
      if (ru9.snow) rp3.setX(i, rp3.getX(i) + Math.sin(y3 * .4 + i) * 2.4 * dt);   // 雪花横飘
    }
    rp3.needsUpdate = true;
  }
  if (WEATHER === 'storm') {   // ⛈️ 闪电与远雷
    boltT9 -= dt;
    if (boltT9 <= 0) { boltT9 = 7 + Math.random() * 15; boltV9 = 1; thunder9(); }
    if (boltV9 > .01) { hemi.intensity *= 1 + boltV9 * 2.4; sun.intensity *= 1 + boltV9 * 1.2; boltV9 *= Math.exp(-dt * 7); }
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
    const wTar = clamp((player.position.y - 14) / 34, 0, 1) * .05 + (WEATHER === 'rain' ? .012 : 0) + (WEATHER === 'storm' ? .045 : 0);
    windGain.gain.value += (wTar - windGain.gain.value) * Math.min(1, dt * 3);
  }
  /* 蘑菇缩放恢复 */
  if (scaleT > 0) {
    scaleT -= dt;
    if (scaleT <= 0) { player.scale.setScalar(1); toast('🍄 药效退了,你恢复了原本的大小'); }
  }
  /* 海浪声强度 */
  if (waveGain) {
    const target = clamp(1 - Math.abs(gh) / 7, 0, 1) * .05 * (swimming ? 1.8 : 1) + (WEATHER === 'storm' ? .018 : 0);
    waveGain.gain.value += (target - waveGain.gain.value) * Math.min(1, dt * 3);
  }
  ambT9 -= dt;   // 🔊 环境声分层:白日林间鸟鸣 / 夜晚草地虫鸣
  if (ambT9 <= 0) {
    ambT9 = 4 + Math.random() * 9;
    if (actx && !RAINY && gh > 2 && gh < 24 && !swimming) {
      if (curDA > .45) chirp9();
      else if (curDA < .3) cricket9();
    }
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
  if (flight && flight.sky) {   // 🏯 大鹏直航:侧向弧线爬升/俯冲(上天空之城/归海通用)
    flight.t += dt;
    const k2 = Math.min(1, flight.t / flight.dur), e2 = k2 * k2 * (3 - 2 * k2);
    const fx2 = flight.from[0] + (flight.to[0] - flight.from[0]) * e2;
    const fz2 = flight.from[1] + (flight.to[1] - flight.from[1]) * e2;
    const ddx9 = flight.to[0] - flight.from[0], ddz9 = flight.to[1] - flight.from[1], dl9 = Math.hypot(ddx9, ddz9) || 1;
    const sw9 = Math.sin(k2 * Math.PI) * dl9 * .18;
    const px9 = fx2 - ddz9 / dl9 * sw9, pz9 = fz2 + ddx9 / dl9 * sw9;
    const fy2 = flight.y0 + (flight.y1 - flight.y0) * e2 + Math.sin(k2 * Math.PI) * 26;
    if (flight.lx != null) { const mvx = px9 - flight.lx, mvz = pz9 - flight.lz; if (mvx * mvx + mvz * mvz > 1e-6) faceYaw = Math.atan2(mvx, mvz); }
    flight.lx = px9; flight.lz = pz9;
    player.position.set(px9, fy2, pz9); vy = 0;
    if (pengBird) { pengBird.visible = true; pengBird.position.set(px9, fy2 - 2.3, pz9); pengBird.rotation.y = faceYaw; }
    if (k2 >= 1) {
      player.position.set(flight.to[0], flight.y1 + .06, flight.to[1]);
      toast(flight.msg); blip(659); flight = null;
      if (pengBird) { pengBird.position.set(PENG_X, height(PENG_X, PENG_Z) + 2.4, PENG_Z); pengBird.rotation.y = 2.2; }
    }
  } else if (flight && flight.orbit) {   // 大鹏环游:从栖石螺旋升空,环岛一周,再螺旋落回
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
  if (pengWings) { const fl = (flight && (flight.orbit || flight.sky)) ? Math.sin(t * 6) * .55 : Math.sin(t * 1.1) * .16;
    for (const { w: wg, s } of pengWings) wg.rotation.z = s * fl; }
  if (skyFall) {   // 🏯 天空之城:瀑布循环 + 磁石呼吸 + 细节层距离开关
    const pd9 = Math.hypot(player.position.x - SKY.x, player.position.z - SKY.z);
    skyDetail.visible = pd9 < 900; skyFall.visible = pd9 < 1100;
    if (skyFall.visible) {
      const fa9 = skyFall.geometry.attributes.position.array;
      for (let i = 0; i < skyFallV.length; i++) { fa9[i * 3 + 1] -= skyFallV[i] * dt; if (fa9[i * 3 + 1] < -95) fa9[i * 3 + 1] = 0; }
      skyFall.geometry.attributes.position.needsUpdate = true;
      skyCrystal.rotation.y = t * .6; skyCrystal.position.y = -54 + Math.sin(t * .8) * 1.4;
      skyCrystal.material.opacity = .7 + Math.sin(t * 2.2) * .2;
      if (skyClouds) skyClouds.rotation.y = t * .018;
      if (skyDoves) { skyDoves.rotation.y = t * .45; skyDoves.position.y = 25 + Math.sin(t * .9) * 1.3; }
      if (spellT9 > 0) {   // 🗣️ 咒语:磁石大亮 + 全城轻颤
        spellT9 = Math.max(0, spellT9 - dt);
        const k9 = spellT9 / 3;
        skyCrystal.scale.setScalar(1 + k9 * 1.2);
        skyCrystal.material.opacity = Math.min(1, .7 + k9 * .3);
        skyGroup.position.y = SKY.y + Math.sin(t * 40) * k9 * .8;
        if (spellT9 === 0) { skyGroup.position.y = SKY.y; skyCrystal.scale.setScalar(1); }
      }
    }
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
    fireflies.material.opacity = (RAINY ? 0 : nite) * (.55 + Math.sin(t * 3) * .45);   // 雨天休演
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
      if (d2 < nb && Math.abs(n.g.position.y - player.position.y) < 12) { nb = d2; nearNpc = n; }
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
  const onSky9 = player.position.y > 140 && Math.hypot(player.position.x - SKY.x, player.position.z - SKY.z) < SKY.r + 60;
  const mz2 = onSky9 ? 'sky' : (swimming ? 'fish' : (onMordor ? 'mordor' : (onMid ? 'shire' : (onHog ? 'hogwarts' : (onMob ? 'mobydick' : (onSpt ? 'stadium' : (isl ? isl.theme : (onTruman ? 'truman' : (hereKey || 'street')))))))));
  if (mz2 !== musicZone) { musicZone = mz2; melIdx = 3; }
  const onIsle2 = Math.hypot(player.position.x - IS2.x, player.position.z - IS2.z) < IS2.r + 10;
  const onBridge = !swimming && bh != null && Math.abs(player.position.y - bh) < 3;
  $('zoneIcon').textContent = onSky9 ? '🏯' : swimming ? '🌊' : (onMordor ? '🌋' : (onMid ? '💍' : (onHog ? '⚡' : (onMob ? '🐳' : (onSpt ? '⚽' : (isl ? isl.icon : (onTruman ? '📺' : (hereKey ? CATS[hereKey].icon : (onBridge ? '🌉' : (onIsle2 ? '🗼' : '🧭'))))))))));
  $('zoneName').textContent = onSky9 ? '天空之城 · 勒皮他' : swimming ? '大海' : (onMordor ? '中土 · 魔多' : (onMid ? '中土 · 夏尔' : (onHog ? '霍格沃茨' : (onMob ? '南塔开特 · 捕鲸港' : (onSpt ? '体育岛 · 梦剧场' : (isl ? isl.name : (onTruman ? '楚门的世界 · 桃源岛' : (hereKey ? CATS[hereKey].name : (onBridge ? '跨海大桥' : (onIsle2 ? '灯塔屿' : '鲸背旷野'))))))))));
  if (BUFF.run > 0) BUFF.run -= dt;
  if (BUFF.ride > 0) BUFF.ride -= dt;
  syncBuffs(dt);
  tramStep(dt);   // 🚋 轨车 + 雾笛
  seasonTick(dt, t);   // 🍂 四季粒子
  syncFarView();   // 🔭 远景降载
  stampT -= dt;   // 🛂 护照盖章(1s 节流)
  if (stampT <= 0) {
    stampT = 1;
    const nm5 = swimming ? null
      : isl ? isl.name
      : (onMid || onMordor) ? '中土' : onHog ? '霍格沃茨' : onMob ? '南塔开特' : onSpt ? '体育岛' : onTruman ? '楚门的世界' : onIsle2 ? '灯塔屿'
      : (Math.hypot(player.position.x, player.position.z) < 500 && !diving) ? '收藏之岛' : null;
    if (nm5) addStamp(nm5);
  }

  /* 岛屿分桶显隐(0.5s 节流) */
  bucketT -= dt;
  if (bucketT <= 0) {
    bucketT = .5;
    for (const b of BUCKETS) b.g.visible = ((player.position.x - b.x) ** 2 + (player.position.z - b.z) ** 2) < 1210000;   // 1100²
    cullLights();   // 💡 灯光同频剔除
    for (const ch of TCHUNKS) {   // 🏔️ 地形 LOD 换档(近满档,中 1/4,远 1/25 三角形)
      const d9 = Math.hypot(ch.userData.ccx - player.position.x, ch.userData.ccz - player.position.z);
      const l9 = d9 < 480 ? 0 : d9 < 1050 ? 1 : 2;
      if (ch.userData.lod !== l9) { ch.userData.lod = l9; ch.geometry = ch.userData.lods[l9]; }
    }
  }
  /* 动态画质:帧率过低自动降像素比,恢复后升回 */
  fpsN++; fpsT += dt;
  if (fpsT >= 2.5) {
    const fps = fpsN / fpsT; fpsN = 0; fpsT = 0;
    if (location.hash.includes('perf')) {   // 📊 #perf 性能 HUD(真机验收用)
      if (!window.__perfEl9) { const pe = document.createElement('div'); pe.style.cssText = 'position:fixed;right:12px;top:64px;z-index:60;font:600 12px monospace;color:#9fe8b0;background:rgba(10,16,12,.68);padding:5px 10px;border-radius:8px;pointer-events:none'; document.body.appendChild(pe); window.__perfEl9 = pe; }
      const ri9 = renderer.info.render;
      window.__perfEl9.textContent = fps.toFixed(0) + ' fps · ' + ri9.calls + ' calls · ' + (ri9.triangles / 1000).toFixed(0) + 'k△ · LOD ' + TCHUNKS.filter(c9 => c9.userData.lod === 0).length + '/' + TCHUNKS.filter(c9 => c9.userData.lod === 1).length + '/' + TCHUNKS.filter(c9 => c9.userData.lod === 2).length;
    }
    if (fps < 20 && quality > 0 && prScale <= .85) { quality--; applyQuality(); toast('🖥️ 帧率偏低,已自动降到' + ['低画质', '中画质'][quality] + '(G 键可手动调)'); }   // 先降像素比,仍卡再降画质档
    if (fps < 27 && prScale > .85) {
      prScale = Math.max(.85, prScale - .25);
      setPR();
    } else if (fps > 55 && prScale < PR_MAX) {
      prScale = Math.min(PR_MAX, prScale + .25);
      setPR();
    }
  }
  if (composer && quality > 0) composer.render(); else renderer.render(scene, camera);
  if (pcPending) { pcPending = false; makePostcard(); }
}
/* ---------- 岛屿分桶距离显隐(性能:远岛整组不渲染) ---------- */
const BUCKETS = [
  { x: 0, z: 0 }, { x: IS2.x, z: IS2.z }, { x: TRU.x, z: TRU.z }, { x: MID.x, z: MID.z },
  { x: HOG.x, z: HOG.z }, { x: MOB.x, z: MOB.z }, { x: SPT.x, z: SPT.z }, { x: SHJ.x, z: SHJ.z },
  { x: THY.x, z: THY.z }, { x: ANH.x, z: ANH.z }, { x: NEM.x, z: NEM.z }, { x: B612.x, z: B612.z },
  { x: JUR.x, z: JUR.z }, { x: HGS.x, z: HGS.z }, { x: ALC.x, z: ALC.z }, { x: CBI.x, z: CBI.z },
  { x: LRS.x, z: LRS.z }, { x: LSP.x, z: LSP.z }, { x: FCY.x, z: FCY.z }, { x: YFB.x, z: YFB.z },
  { x: MCD.x, z: MCD.z }, { x: RBX.x, z: RBX.z }, { x: DGY.x, z: DGY.z }, { x: SIR.x, z: SIR.z },
  { x: PUR.x, z: PUR.z }, { x: UNJ.x, z: UNJ.z },
  ...NISLES.map(s => ({ x: s.x, z: s.z })),
].map(b => Object.assign(b, { g: new THREE.Group() }));
{
  const excl = new Set([player, blob, sky, starField, moonMesh, moonGlow, moonLight, moonLight.target, sun, sun.target, hemi, mobySpout, meteor, fireflies, pengBird]);
  clouds.forEach(c => excl.add(c));
  for (const o of [...scene.children]) {
    if (excl.has(o) || o.isInstancedMesh || o.isPoints) continue;
    if (o.userData && o.userData.ter9) continue;   // 地形块自带视锥剔除,不入分桶
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
/* 🧱 建筑静态合并:每桶按材质合并 Box/Cyl/Cone/挤出 静态网格(draw call 大降) */
{
  const dynSet = new Set();
  const addDyn = arr => { try { for (const o of arr || []) { if (o && o.traverse) o.traverse(x9 => dynSet.add(x9)); else if (o) dynSet.add(o); } } catch (e) {} };
  addDyn(typeof boats !== 'undefined' ? boats : null);
  addDyn(typeof mirages !== 'undefined' ? mirages : null);
  try { addDyn(windmillBlades); } catch (e) {}
  try { addDyn(cbFlags); } catch (e) {}
  try { for (const s9 of shards) if (s9 && s9.m) dynSet.add(s9.m); } catch (e) {}
  try { if (babelBook) babelBook.traverse(x9 => dynSet.add(x9)); } catch (e) {}
  try { if (babelDust) dynSet.add(babelDust); } catch (e) {}
  try { if (tidalHeart) tidalHeart.traverse(x9 => dynSet.add(x9)); } catch (e) {}
  const OKGEO = new Set(['BoxGeometry', 'CylinderGeometry', 'ConeGeometry', 'ExtrudeGeometry', 'ShapeGeometry']);
  let rm9 = 0, ad9 = 0;
  for (const b of BUCKETS) {
    const byMat = new Map();
    for (const o of [...b.g.children]) {
      if (!o.isMesh || o.name || o.children.length || dynSet.has(o)) continue;
      if (!o.geometry || !OKGEO.has(o.geometry.type)) continue;
      const mt = o.material;
      if (!mt || Array.isArray(mt) || mt.transparent || !(mt.isMeshLambertMaterial || mt.isMeshStandardMaterial)) continue;
      if (mt.userData && mt.userData.shader) continue;   // 风摆等注入着色器的材质不合并
      if (o.userData && Object.keys(o.userData).length) continue;
      let l9 = byMat.get(mt); if (!l9) { l9 = []; byMat.set(mt, l9); }
      l9.push(o);
    }
    for (const [mt, list] of byMat) {
      if (list.length < 4) continue;
      const geos = list.map(o => { o.updateWorldMatrix(true, false); return o.geometry.clone().applyMatrix4(o.matrixWorld).toNonIndexed(); });
      let merged = null;
      try { merged = mergeGeometries(geos, false); } catch (e) {}
      if (!merged) continue;
      merged.computeBoundingSphere();
      const mm = new THREE.Mesh(merged, mt);
      mm.castShadow = !MOBILE; mm.receiveShadow = true;
      list.forEach(o => b.g.remove(o));
      b.g.add(mm);
      rm9 += list.length; ad9++;
    }
  }
  console.log('🧱 静态合并:', rm9, '个网格 →', ad9, '个合并体');
}
/* 🏗️ 统一建筑收尾:窗光并成 1 网格 + 炊烟粒子 */
if (WQUEUE9.length) {
  scene.add(new THREE.Mesh(mergeGeometries(WQUEUE9, false), winMat9()));
  console.log('🏗️ makeBldg:', WQUEUE9.length, '片夜窗(1 网格)/', CHIM9.length, '座烟囱');
}
if (!MOBILE && CHIM9.length) {
  const NS9 = CHIM9.length * 3, sa9 = new Float32Array(NS9 * 3);
  smokeSeed9 = new Float32Array(NS9);
  for (let i9 = 0; i9 < NS9; i9++) { const c9 = CHIM9[i9 % CHIM9.length]; sa9[i9 * 3] = c9[0]; sa9[i9 * 3 + 1] = c9[1] + (i9 / NS9) * 4; sa9[i9 * 3 + 2] = c9[2]; smokeSeed9[i9] = i9 * 1.37 % 6; }
  const sg9 = new THREE.BufferGeometry(); sg9.setAttribute('position', new THREE.BufferAttribute(sa9, 3));
  smokePts9 = new THREE.Points(sg9, new THREE.PointsMaterial({ color: 0xd8dade, size: 1.5, transparent: true, opacity: .25, depthWrite: false }));
  smokePts9.frustumCulled = false; scene.add(smokePts9);
}
/* 🌊 岸线泡沫:世界建成后沿全部海岸撒点(含 NI 群岛),单 Points */
if (!MOBILE) {
  const rf9 = mulberry32(202), pts9 = [];
  outer9: for (let gx9 = -1900; gx9 < 1900; gx9 += 7)
    for (let gz9 = -1900; gz9 < 1900; gz9 += 7) {
      const h9 = height(gx9 + rf9() * 4, gz9 + rf9() * 4);
      if (h9 > -1.15 && h9 < .6 && rf9() < .85) {
        pts9.push(gx9 + rf9() * 6 - 3, .16, gz9 + rf9() * 6 - 3);
        if (pts9.length > 10500) break outer9;
      }
    }
  const cvF9 = document.createElement('canvas'); cvF9.width = cvF9.height = 32;
  const cF9 = cvF9.getContext('2d'), gr9 = cF9.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr9.addColorStop(0, 'rgba(255,255,255,.95)'); gr9.addColorStop(.6, 'rgba(255,255,255,.4)'); gr9.addColorStop(1, 'rgba(255,255,255,0)');
  cF9.fillStyle = gr9; cF9.fillRect(0, 0, 32, 32);
  const fgF9 = new THREE.BufferGeometry(); fgF9.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts9), 3));
  foamPts = new THREE.Points(fgF9, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(cvF9), color: 0xf4f8f6, size: 2.4, transparent: true, opacity: .34, depthWrite: false }));
  scene.add(foamPts);
  console.log('🌊 岸线泡沫:', pts9.length / 3 | 0, '点');
}
/* 阴影开关(桌面):不透明网格投/受阴影,天空与水面除外;顺路定 IBL 环境强度 */
if (!MOBILE) {
  const envSeen9 = new Set();
  scene.traverse(o => {
    if (o.isMesh && o.material && !o.material.transparent) { o.castShadow = true; o.receiveShadow = true; }
    if (o.isMesh && o.material && o.material.isMeshStandardMaterial && !envSeen9.has(o.material)) { envSeen9.add(o.material); o.material.envMapIntensity = o.material.vertexColors ? (RAINY ? .32 : .12) : .25; }   // 顶点色地表弱反射(雨天湿面反光加倍),道具建筑中等
  });
  sky.castShadow = sky.receiveShadow = false;
  if (oceanWater) { oceanWater.castShadow = false; oceanWater.receiveShadow = false; }
}
loop();

window.__w3d = { player, spots, TRAVEL3D, openCard, openJournal, seen, height, camera, scene, allNpcs, shards, collectShard, boats, bridgeHeight, islandMask, spendSB, earnSB, sb: () => sb, paperHTML, fishing, startCast, catchFish, FSPOTS, pierHeight, GEAR, gear, gearOn, openBag, parsePantheon, pantheonHTML, openPantheon, openAccount, profileList, PROFILE_ID: () => PROFILE_ID, talkTo, constDirs, updateStarGaze, setGaze: v => { starGaze = v; }, skyLabels, constSeen, recognizeConst, openJournal, titleList,
  enterDive, surfaceDive, clampToMaze, MAZE_PORTALS, MAZE_NODES, MAZE_EDGES, AIR_NODES, DISC, GATES, gateOpen, fireSonar, diving: () => diving, diveAir: () => diveAir, setAir: v => { diveAir = v; }, gear, GEAR,
  usingGLTF: () => usingGLTF, playerRobot: () => playerRobot, playerActs: () => Object.keys(playerActions), playerAct: () => playerAct,
  quality: () => quality, setQuality: q => { quality = q; applyQuality(); }, gtaoEnabled: () => gtaoPass ? gtaoPass.enabled : null, bakeEnv9, makeBldg,
  maybeRevealSkeleton, showSkeletonCard, startUnjGames, showUnjNews, unjTowerHeight, globeTick, globeArc: () => ({ t: arcT, pending: arcPending }), addStamp, stamps, PASSPORT, AIRPORTS, openAirCounter, toggleVehicle, vehicle: () => vehicle,
  weather: () => WEATHER, event: () => EVENT, openFund, affOf, affAdd, npcCtxLine, openFood, openTailor, openHome, applyOutfit, WD: () => WD, BUFF, eaten, SEASON, worldCompletion, fireworks, openMail, unreadMail, tramInfo: () => ({ pos: +tramPos.toFixed(3), dir: tramDir, wait: +tramWait.toFixed(1), riding: tramRiding, found: !!qqTram }), tramStep, tramBoard: v9 => { tramRiding = v9; }, dqState: () => DQ, foghorn, snapNow: () => { if (composer && quality > 0) composer.render(); else renderer.render(scene, camera); makePostcard(); }, gearPrice, cullLights, renderInfo: () => { renderer.render(scene, camera); const r9 = renderer.info.render; return { calls: r9.calls, triangles: r9.triangles, lightsVisible: ALL_LIGHTS.filter(l => l.visible).length, lightsTotal: ALL_LIGHTS.length }; } };
