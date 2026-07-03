/* 1001 世界 · 数据生成器
   从各 1001 姊妹项目抽取真实数据，生成 world-data.js 供游戏使用。
   运行: node _gen.mjs
*/
import fs from 'node:fs';
import vm from 'node:vm';

const SRC = {
  art:       'C:/Users/drxuj/OneDrive/claude/1001art/data.js',
  plants:    'C:/Users/drxuj/Claude/Projects/1001plants/plants.js',
  birds:     'C:/Users/drxuj/Claude/Projects/1001birds/birds.js',
  beers:     'C:/Users/drxuj/OneDrive/claude/1001craft/beers.js',
  fish:      'C:/Users/drxuj/OneDrive/claude/1001fish/fish.js',
  jazz:      'C:/Users/drxuj/Claude/Projects/1001jazz/data.js',
  classical: 'C:/Users/drxuj/Claude/Projects/1001classical/data.js',
  outdoor:   'C:/Users/drxuj/OneDrive/claude/1001outdoor/sports.js',
};

function load(p) {
  const w = {};
  vm.runInNewContext(fs.readFileSync(p, 'utf8'), { window: w });
  return w;
}
const pick = (w, pred) => Object.values(w).find(v => Array.isArray(v) && v.length > 10 && pred(v[0]));

// 均匀抽样 n 个（保持原有顺序 = 保持时代/分类分布）
function sample(arr, n) {
  if (arr.length <= n) return arr;
  const out = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * arr.length / n)]);
  return out;
}
// 描述截断：尽量在句号处收尾
function trim(s, max = 120) {
  if (!s) return '';
  s = s.replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const p = Math.max(cut.lastIndexOf('。'), cut.lastIndexOf('.'), cut.lastIndexOf('！'));
  return p > 40 ? cut.slice(0, p + 1) : cut + '…';
}

/* ---------- 抽取各数据集 ---------- */
const wArt = load(SRC.art);
const artAll = pick(wArt, x => x.title && x.artist && x.thumb);
const artReal = artAll.filter(x => x.img && x.thumb);
const art = sample(artReal, 72).map(x => ({
  id: x.id, title: x.title, title_en: x.title_en, artist: x.artist, artist_en: x.artist_en,
  year: x.year, era: x.era, loc: x.location, thumb: x.thumb,
}));

const wPl = load(SRC.plants);
const plAll = pick(wPl, x => x.sci && x.family_zh);
const plants = sample(plAll.filter(x => x.thumb), 84).map(x => ({
  id: x.id, zh: x.zh, en: x.en, sci: x.sci, family: x.family_zh, order: x.order_zh,
  iucn: x.iucn, desc: trim(x.desc_zh, 110), thumb: x.thumb,
}));

const wBd = load(SRC.birds);
const bdAll = pick(wBd, x => x.sci && x.group);
const birds = bdAll.map(x => ({
  id: x.id, zh: x.zh, en: x.en, sci: x.sci, group: x.group, realm: x.realm,
  iucn: x.iucn_zh || x.iucn, desc: trim(x.desc_zh, 110), file: x.file,
}));

const wBe = load(SRC.beers);
const beAll = wBe.BEER_DATA;
const beers = beAll.map(x => ({
  id: x.id, name: x.name, name_en: x.name_en, brewery: x.brewery, brewery_en: x.brewery_en,
  cat: x.cat, style: x.style, style_en: x.style_en, abv: x.abv, origin: x.origin, desc: x.desc,
}));

const wFi = load(SRC.fish);
const fiAll = wFi.FISH_DATA;
const fish = sample(fiAll, 120).map(x => ({
  id: x.id, name: x.name, name_en: x.name_en, sci: x.sci, family: x.family,
  cat: x.cat, habitat: x.habitat, size: x.size,
}));

const wJz = load(SRC.jazz);
const jzAll = wJz.ALBUMS;
const jazz = sample(jzAll, 60).map(x => ({
  id: x.id, title: x.title, artist: x.artist, year: x.year, label: x.label,
  era: x.era, reason: trim(x.reason, 110),
}));

const wCl = load(SRC.classical);
const clAll = wCl.ALBUMS;
const classical = sample(clAll, 60).map(x => ({
  id: x.id, title: x.title, zh: x.zh, artist: x.artist, perf: x.perf, year: x.year,
  label: x.label, era: x.era, reason: trim(x.reason, 110),
}));

const wOd = load(SRC.outdoor);
const odAll = wOd.SPORT_DATA;
const outdoor = odAll.map(x => ({
  id: x.id, name: x.name, name_en: x.name_en, cat: x.cat, disc: x.disc,
  gear: x.gear, diff: x.diff, terrain: x.terrain, desc: x.desc,
}));
console.log('outdoor cats:', [...new Set(odAll.map(x => x.cat))].join(','));
console.log('fish cats:',    [...new Set(fiAll.map(x => x.cat))].join(','));
console.log('beer cats:',    [...new Set(beAll.map(x => x.cat))].join(','));

/* ---------- 千夜图书馆 · 64 本经典（手工整理） ---------- */
const books = [
  {id:1, zh:'红楼梦', en:'Dream of the Red Chamber', author:'曹雪芹', year:'1791', desc:'大观园里的兴衰聚散，中国古典小说的巅峰，一部“把美毁灭给人看”的百科全书。'},
  {id:2, zh:'西游记', en:'Journey to the West', author:'吴承恩', year:'1592', desc:'猴王护送唐僧西天取经，九九八十一难，东方最伟大的奇幻冒险。'},
  {id:3, zh:'三国演义', en:'Romance of the Three Kingdoms', author:'罗贯中', year:'14 世纪', desc:'天下大势，分久必合合久必分——权谋与忠义的英雄史诗。'},
  {id:4, zh:'水浒传', en:'Water Margin', author:'施耐庵', year:'14 世纪', desc:'一百零八好汉逼上梁山，市井江湖的侠义悲歌。'},
  {id:5, zh:'聊斋志异', en:'Strange Tales from a Chinese Studio', author:'蒲松龄', year:'1740', desc:'狐鬼花妖比人更有情，五百篇文言短篇的志怪宇宙。'},
  {id:6, zh:'呐喊', en:'Call to Arms', author:'鲁迅', year:'1923', desc:'从《狂人日记》到《阿Q正传》，现代中国文学从这声呐喊开始。'},
  {id:7, zh:'边城', en:'Border Town', author:'沈从文', year:'1934', desc:'湘西渡口的翠翠与爱情，中文里最温柔干净的牧歌。'},
  {id:8, zh:'骆驼祥子', en:'Rickshaw Boy', author:'老舍', year:'1937', desc:'一个北平车夫的三起三落，个人奋斗在时代碾压下的悲剧。'},
  {id:9, zh:'围城', en:'Fortress Besieged', author:'钱锺书', year:'1947', desc:'城外的人想进去，城里的人想出来——最机智刻薄的中国讽刺小说。'},
  {id:10, zh:'活着', en:'To Live', author:'余华', year:'1993', desc:'福贵接连失去所有亲人，却依然活着。关于苦难与生命力的中国寓言。'},
  {id:11, zh:'平凡的世界', en:'Ordinary World', author:'路遥', year:'1986', desc:'黄土高原上两兄弟的十年奋斗，一代中国人的精神史。'},
  {id:12, zh:'白鹿原', en:'White Deer Plain', author:'陈忠实', year:'1993', desc:'白鹿两家五十年恩怨，关中平原上的民族秘史。'},
  {id:13, zh:'三体', en:'The Three-Body Problem', author:'刘慈欣', year:'2008', desc:'黑暗森林、降维打击——把中国科幻推向世界的宇宙社会学史诗。'},
  {id:14, zh:'源氏物语', en:'The Tale of Genji', author:'紫式部', year:'约 1008', desc:'平安朝的光源氏与他爱过的女子们，世界上第一部长篇小说。'},
  {id:15, zh:'雪国', en:'Snow Country', author:'川端康成', year:'1948', desc:'穿过县境长长的隧道便是雪国——徒劳之美的极致。'},
  {id:16, zh:'挪威的森林', en:'Norwegian Wood', author:'村上春树', year:'1987', desc:'青春、丧失与爱，一代人心中的成长圣经。'},
  {id:17, zh:'海边的卡夫卡', en:'Kafka on the Shore', author:'村上春树', year:'2002', desc:'十五岁少年离家出走，猫会说话，命运像沙尘暴一样袭来。'},
  {id:18, zh:'堂吉诃德', en:'Don Quixote', author:'塞万提斯', year:'1605', desc:'骑士小说读多了的乡绅冲向风车——第一部现代小说，也是最悲伤的喜剧。'},
  {id:19, zh:'哈姆雷特', en:'Hamlet', author:'莎士比亚', year:'1601', desc:'生存还是毁灭。复仇王子的犹疑，西方文学最深的独白。'},
  {id:20, zh:'傲慢与偏见', en:'Pride and Prejudice', author:'简·奥斯汀', year:'1813', desc:'伊丽莎白与达西的相互误解与相互成全，英语世界最完美的爱情喜剧。'},
  {id:21, zh:'简·爱', en:'Jane Eyre', author:'夏洛蒂·勃朗特', year:'1847', desc:'贫穷、低微、不美，但我们的灵魂是平等的。'},
  {id:22, zh:'呼啸山庄', en:'Wuthering Heights', author:'艾米莉·勃朗特', year:'1847', desc:'荒原上超越生死的爱与复仇，英国文学最狂暴的心。'},
  {id:23, zh:'远大前程', en:'Great Expectations', author:'狄更斯', year:'1861', desc:'孤儿皮普的“远大前程”与幻灭，狄更斯最完整的杰作。'},
  {id:24, zh:'双城记', en:'A Tale of Two Cities', author:'狄更斯', year:'1859', desc:'这是最好的时代，也是最坏的时代——大革命中的牺牲与救赎。'},
  {id:25, zh:'罪与罚', en:'Crime and Punishment', author:'陀思妥耶夫斯基', year:'1866', desc:'穷大学生杀死放贷老妇之后，良心开始审判。'},
  {id:26, zh:'卡拉马佐夫兄弟', en:'The Brothers Karamazov', author:'陀思妥耶夫斯基', year:'1880', desc:'弑父案背后，信仰、自由与恶的终极辩论。'},
  {id:27, zh:'战争与和平', en:'War and Peace', author:'列夫·托尔斯泰', year:'1869', desc:'拿破仑战争中四大家族的命运，小说所能容纳的极限。'},
  {id:28, zh:'安娜·卡列尼娜', en:'Anna Karenina', author:'列夫·托尔斯泰', year:'1877', desc:'幸福的家庭都是相似的——一场婚外之爱的社会悲剧。'},
  {id:29, zh:'包法利夫人', en:'Madame Bovary', author:'福楼拜', year:'1857', desc:'爱玛死于浪漫幻想与外省的无聊，现代小说技艺的起点。'},
  {id:30, zh:'悲惨世界', en:'Les Misérables', author:'雨果', year:'1862', desc:'冉阿让的救赎之路，横跨半个世纪的人道主义大教堂。'},
  {id:31, zh:'基督山伯爵', en:'The Count of Monte Cristo', author:'大仲马', year:'1846', desc:'等待和希望——史上最痛快的复仇故事。'},
  {id:32, zh:'追忆似水年华', en:'In Search of Lost Time', author:'普鲁斯特', year:'1913–27', desc:'一块玛德莱娜点心唤起整个逝去的世界，七卷本的记忆圣殿。'},
  {id:33, zh:'尤利西斯', en:'Ulysses', author:'乔伊斯', year:'1922', desc:'都柏林一天十八小时，意识流小说的珠穆朗玛。'},
  {id:34, zh:'审判', en:'The Trial', author:'卡夫卡', year:'1925', desc:'约瑟夫·K 莫名被捕，无处申诉——现代人的噩梦预言。'},
  {id:35, zh:'变形记', en:'The Metamorphosis', author:'卡夫卡', year:'1915', desc:'一天早晨，格里高尔发现自己变成了一只巨大的甲虫。'},
  {id:36, zh:'了不起的盖茨比', en:'The Great Gatsby', author:'菲茨杰拉德', year:'1925', desc:'绿灯、香槟与幻灭，爵士时代的美国梦挽歌。'},
  {id:37, zh:'杀死一只知更鸟', en:'To Kill a Mockingbird', author:'哈珀·李', year:'1960', desc:'透过小女孩的眼睛看偏见与勇气，美国的良心之书。'},
  {id:38, zh:'一九八四', en:'Nineteen Eighty-Four', author:'乔治·奥威尔', year:'1949', desc:'老大哥在看着你——关于极权的终极警告。'},
  {id:39, zh:'美丽新世界', en:'Brave New World', author:'赫胥黎', year:'1932', desc:'用快乐奴役人类的乌托邦，与《1984》互为镜像。'},
  {id:40, zh:'第二十二条军规', en:'Catch-22', author:'约瑟夫·海勒', year:'1961', desc:'想停飞就证明你疯了，但申请停飞恰恰证明你没疯。黑色幽默的巅峰。'},
  {id:41, zh:'麦田里的守望者', en:'The Catcher in the Rye', author:'塞林格', year:'1951', desc:'霍尔顿游荡纽约的三天，一代代少年的心事代言人。'},
  {id:42, zh:'洛丽塔', en:'Lolita', author:'纳博科夫', year:'1955', desc:'我生命之光，我欲念之火——最危险题材写出的最华丽文体。'},
  {id:43, zh:'百年孤独', en:'One Hundred Years of Solitude', author:'加西亚·马尔克斯', year:'1967', desc:'布恩迪亚家族七代人的宿命轮回，魔幻现实主义的开山圣典。'},
  {id:44, zh:'霍乱时期的爱情', en:'Love in the Time of Cholera', author:'加西亚·马尔克斯', year:'1985', desc:'等待了五十三年七个月零十一天的爱情。'},
  {id:45, zh:'老人与海', en:'The Old Man and the Sea', author:'海明威', year:'1952', desc:'人可以被毁灭，但不能被打败。'},
  {id:46, zh:'白鲸', en:'Moby-Dick', author:'麦尔维尔', year:'1851', desc:'亚哈船长与白鲸的偏执对决，美国文学的深渊之书。'},
  {id:47, zh:'哈克贝利·费恩历险记', en:'Adventures of Huckleberry Finn', author:'马克·吐温', year:'1884', desc:'木筏顺密西西比河而下，美国文学由此开始（海明威语）。'},
  {id:48, zh:'愤怒的葡萄', en:'The Grapes of Wrath', author:'斯坦贝克', year:'1939', desc:'大萧条中举家西迁的流民史诗。'},
  {id:49, zh:'宠儿', en:'Beloved', author:'托妮·莫里森', year:'1987', desc:'被杀死的女婴回来了——奴隶制创伤的招魂之作。'},
  {id:50, zh:'午夜之子', en:"Midnight's Children", author:'萨尔曼·鲁西迪', year:'1981', desc:'与印度独立同时出生的孩子们，布克奖中的布克奖。'},
  {id:51, zh:'长日将尽', en:'The Remains of the Day', author:'石黑一雄', year:'1989', desc:'英国管家回望一生的克制与错过。'},
  {id:52, zh:'局外人', en:'The Stranger', author:'加缪', year:'1942', desc:'今天，妈妈死了。也可能是昨天——荒诞哲学的小说宣言。'},
  {id:53, zh:'鼠疫', en:'The Plague', author:'加缪', year:'1947', desc:'封城之下的奥兰，人如何在灾难中保持体面与抵抗。'},
  {id:54, zh:'悉达多', en:'Siddhartha', author:'黑塞', year:'1922', desc:'一个婆罗门之子的求道之旅，河水会告诉你一切。'},
  {id:55, zh:'不能承受的生命之轻', en:'The Unbearable Lightness of Being', author:'米兰·昆德拉', year:'1984', desc:'轻与重、灵与肉，布拉格之春下的爱情与哲思。'},
  {id:56, zh:'玫瑰的名字', en:'The Name of the Rose', author:'翁贝托·埃科', year:'1980', desc:'中世纪修道院连环命案，一座会杀人的图书馆。'},
  {id:57, zh:'看不见的城市', en:'Invisible Cities', author:'卡尔维诺', year:'1972', desc:'马可·波罗向忽必烈讲述五十五座幻想之城。'},
  {id:58, zh:'小径分岔的花园', en:'Ficciones', author:'博尔赫斯', year:'1944', desc:'迷宫、镜子与无限图书馆，短篇小说的形而上学。'},
  {id:59, zh:'佩德罗·巴拉莫', en:'Pedro Páramo', author:'胡安·鲁尔福', year:'1955', desc:'整个村庄都是亡魂——马尔克斯倒背如流的一本薄书。'},
  {id:60, zh:'小王子', en:'The Little Prince', author:'圣埃克苏佩里', year:'1943', desc:'真正重要的东西，用眼睛是看不见的。'},
  {id:61, zh:'爱丽丝漫游奇境', en:"Alice's Adventures in Wonderland", author:'刘易斯·卡罗尔', year:'1865', desc:'掉进兔子洞，逻辑与胡话的奇境。'},
  {id:62, zh:'鲁滨逊漂流记', en:'Robinson Crusoe', author:'笛福', year:'1719', desc:'荒岛二十八年，英国小说的开端。'},
  {id:63, zh:'弗兰肯斯坦', en:'Frankenstein', author:'玛丽·雪莱', year:'1818', desc:'科学家造人反被造物追问——第一部科幻小说。'},
  {id:64, zh:'魔戒', en:'The Lord of the Rings', author:'托尔金', year:'1954', desc:'一枚戒指统御一切，现代奇幻的源头巨著。'},
];

/* ---------- 输出 ---------- */
const totals = {
  art: artReal.length, plants: plAll.length, birds: bdAll.length, beers: beAll.length,
  fish: fiAll.length, jazz: jzAll.length, classical: clAll.length, outdoor: odAll.length,
  books: 1001,
};
const data = { totals, art, plants, birds, beers, fish, jazz, classical, outdoor, books };
let out = '/* 1001 世界 · 游戏数据（由 _gen.mjs 自动生成，勿手改） */\nwindow.WORLD_DATA = {\n';
for (const [k, v] of Object.entries(data)) {
  if (Array.isArray(v)) {
    out += `${k}: [\n${v.map(o => JSON.stringify(o)).join(',\n')}\n],\n`;
  } else {
    out += `${k}: ${JSON.stringify(v)},\n`;
  }
}
out += '};\n';
fs.writeFileSync(new URL('./world-data.js', import.meta.url), out, 'utf8');
console.log('world-data.js written.',
  Object.entries(data).filter(([,v])=>Array.isArray(v)).map(([k,v])=>`${k}:${v.length}`).join(' '),
  `(${Math.round(out.length/1024)} KB)`);
