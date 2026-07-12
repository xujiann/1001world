/* ============================================================
   w-data2.js — 纯数据包(F 模块化第三阶段,自 game3d.js 外迁)
   分类馆 / 分区 / 事件 / 建筑风格 / 夜班表 / 作家 / 小聚点 / 鱼价 / 提示语
   ============================================================ */
const D = window.WORLD_DATA;

export const CATS = {
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

export const ZONES3D = [
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

export const EVENTS = {
  none:   { icon: '', name: '', note: '' },
  fair:   { icon: '🎪', name: '集市日', note: '千岛装备行全场九折!' },
  meteor: { icon: '🌠', name: '流星雨夜', note: '入夜后流星频落——按 K 开观星模式,找个暗处躺好' },
  whales: { icon: '🐋', name: '鲸群洄游', note: '一支鲸群正路过主岛外海,海上留意喷泉水柱' },
  kites:  { icon: '🎏', name: '风筝日', note: '孩子们把风筝放上了主岛的天空' },
  snowman:  { icon: '⛄', name: '雪人日', note: '广场上出现了三只雪人——不知是谁夜里堆的' },
  fireshow: { icon: '🎆', name: '夏夜烟花大会', note: '入夜后海湾上空烟花连放,找个高处看' },
  lantfest: { icon: '🏮', name: '秋灯节', note: '夜里广场会放起一盏盏孔明灯,替旅人捎愿' },
};

export const BSTYLES = {
  whaler:   { wall: 0xd8d2c2, trim: 0x5a6a7a, roofC: 0x5a4636, roof: 'gable' },
  jiangnan: { wall: 0xf0ead8, trim: 0x6a6a6e, roofC: 0x34343c, roof: 'pagoda' },
  venetian: { wall: 0xc8907a, trim: 0xf0e8da, roofC: 0x8a5a4a, roof: 'flat' },
  desert:   { wall: 0xe2cb96, trim: 0xb89868, roofC: 0xd0b888, roof: 'flat' },
  stone:    { wall: 0xa8a296, trim: 0x7a746a, roofC: 0x6a665e, roof: 'cone' },
  nordic:   { wall: 0xa04a38, trim: 0xe8e0d0, roofC: 0x3a4a38, roof: 'gable' },
};

export const NIGHT_OWLS = ['守夜人', '灯塔管理员', '缄默修士', '守台老道', '不肯说名字的方士', '吟游诗人', '老看守', '守钟老人'];

export const AUTHORS = [   // home = 迁居主题岛坐标(不设则留主岛作家角);首句为岛屿专属台词
  { name: '鲁迅', body: 0x2c3e50, lines: ['其实地上本没有路,走的人多了,也便成了路。', '愿中国青年都摆脱冷气,只是向上走。'] },
  { name: '海明威', body: 0x784212, home: [162, 858], lines: ['我在这港口守到第八十四天,还没等到那条大鱼——但今天海况不错。', '人可以被毁灭,但不能被打败。', '这个世界如此美好,值得人们为它奋斗。'] },
  { name: '加西亚·马尔克斯', body: 0xb03a2e, home: [1376, 956], lines: ['蜃楼散了不必可惜——马孔多也是一阵风就没了,可我们都记得它。', '过去都是假的,回忆是一条没有归途的路。', '生命中所有的灿烂,终要用寂寞偿还。'] },
  { name: '卡夫卡', body: 0x1b2631, home: [318, 642], lines: ['一座永远造不完的城,比造好的城诚实——它至少不撒谎。', '一本书,必须是劈开我们内心冰海的斧头。', '在你与世界的斗争中,请站在世界这边。'] },
  { name: '加缪', body: 0x21618c, home: [-698, -394], lines: ['守灯人把灯点亮,又任它熄灭,日复一日。我看见西西弗——他是幸福的。', '在隆冬,我终于知道,我身上有一个不可战胜的夏天。', '登上顶峰的斗争,本身足以充实人的心灵。'] },
  { name: '圣埃克苏佩里', body: 0xca6f1e, home: [1110, 344], lines: ['我认得这颗小星球——上面住着一朵玫瑰和三座火山。我只是回来看看她。', '真正重要的东西,用眼睛是看不见的。', '所有的大人,都曾经是小孩。'] },
];

export const EVE_SPOTS9 = [[0, -12], [9, -18], [-9, -15], [15, -8], [-4, -24]];

export const FISH_PRICE = { deep: 9, rare: 9, pelagic: 7, special: 6, reef: 5 };

export const HINTS = { painting: '欣赏这幅画', shelf: '翻翻这架书', tree: '观察这只鸟', bed: '看看这株植物', bar: '来一杯!', keg: '看看这桶酒', table: '看看桌上的酒', tank: '看看水里', crate: '翻翻唱片', stand: '听听这份录音', tent: '参观营地', board: '查看路线', sign: '查看路牌', news: '报亭 · 今日两刊', shop: '逛逛装备行', ferry: '多元宇宙渡口', door: '推开天空之门', camera: '看看那是什么', lamp: '检查坠落物', ring: '看看基座上的东西', crater: '末日火山口', hole: '敲敲圆门', eye: '仰望黑塔(别看太久)', train: '霍格沃茨特快', castle: '城堡大门 · 分院帽', hoops: '魁地奇球场', hut: '拜访海格小屋', inn: '喷水鲸客栈', chowder: '来碗杂烩汤(4 SB)', doubloon: '桅杆上的金币', stadium: '梦剧场 · 德比日', pitch: '场边观战', scalper: '这位朋友鬼鬼祟祟', gate: '沉睡的星门', bluehole: '🤿 潜入海底蓝洞', airport: '✈️ 航空柜台 · 购票飞行', fund: '❤️ 群岛基金会 · 捐赠与荣誉', food: '🍜 小吃摊 · 尝一口地方味', tailor: '👘 裁缝铺 · 披风与帽子', home: '🏠 旅人小屋' };
