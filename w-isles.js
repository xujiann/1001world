/* ============================================================
   w-isles.js — 十七座「接入迷宫的老岛」内容包(NI_CONTENT)
   纯数据 + build(gx,gz) 场景函数;不直接 import three,
   由 game3d.js 上下文注入(THREE/height/box/cyl/lam/M/scene/
   cirObs/nightLamps/rnd/makeBoat)。新增岛屿只需在此加数据。
   ============================================================ */
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { OSM_GUNKAN } from './w-osm.js?v=1';
export function makeNIContent(C) {
  const { THREE, height, box, cyl, lam, M, scene, cirObs, nightLamps, rnd, makeBoat } = C;
  return {
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
      mystballoon: { icon: '🎈', color: '#8a4a3a', title: '气球残骸', en: 'The Balloon', hint: '一切从坠落开始',
        desc: '1865 年 3 月,五名北军战俘乘气球从里士满围城中出逃,风暴把他们刮了七千英里,扔在这座无名岛上。瘪掉的球皮和吊篮还堆在滩头——他们一无所有,除了口袋里一粒麦子、一根火柴,和一颗工程师的头脑。' },
      mystbottle: { icon: '🍾', color: '#3a6a7a', title: '漂流瓶', en: 'The Bottle', hint: '海上来信',
        desc: '浪头送来一只玻璃瓶,里面一张字条:"达抱岛,西经 153°——遇难者艾尔通。"于是他们造船出海去救人。救回来的,是一个在孤独里退化成野人的罪人。文明可以重建——人,也可以。' },
    },
    spots: [[-2, -4, 'mystvolcano'], [16, -10, 'mystforge'], [-20, 16, 'mystnemo'], [24, 20, 'mystballoon'], [-30, -18, 'mystbottle']],
    npcs: [
      { dx: -14, dz: 12, name: '史密斯工程师', body: 0x5a6a7a, hat: 0x3a4a5a, opts: { tall: 1.05 },
        lines: ['给我一座火山,我能还你一个文明。', '知识,是一个人身上抢不走的行李。', '别灰心,潘克洛夫——荒岛只是尚未开化的家。'] },
      { dx: 16, dz: -6, name: '潘克洛夫', body: 0x8a5a2a, hat: 0x6a4420, opts: { wide: 1.2 },
        lines: ['只要史密斯先生在,魔鬼来了我也不怕!', '这岛上什么都能造,就是造不出烟草……', '一根火柴!你敢信?我们的家业是从一根火柴开始的。'] },
      { dx: 26, dz: 14, name: '赫伯特', body: 0x4a8a5a, hat: 0x2e6a40, opts: { tall: .78 },
        lines: ['这株植物能退热——书上读过,今天亲手采到了!', '潘克洛夫要给我烤乳猪,可我想先给它做个标本。', '史密斯先生说:观察,是科学家的第一件工具。'] },
      { dx: -8, dz: -20, name: '记者史佩莱', body: 0x6a6a5a, hat: 0x4a4a3e, opts: { tall: 1.02 },
        lines: ['《纽约先驱报》战地记者——现在,是这座岛的史官。', '记下来:第四年,我们有了电报、风磨和一座羊圈。', '新闻的要义是准确。所以我如实写:这座岛,有位看不见的守护者。'] },
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
      const bx = gx + 24, bz = gz + 20, bhh = height(bx, bz);   // 气球残骸:瘪球皮 + 吊篮
      const canopy2 = new THREE.Mesh(new THREE.SphereGeometry(3.4, 10, 7), lam(0x9a5a3a)); canopy2.scale.set(1, .32, 1); canopy2.position.set(bx, bhh + .7, bz); scene.add(canopy2);
      const basket = box(2, 1.3, 2, M.woodDark); basket.position.set(bx + 4, bhh + .65, bz + 1); scene.add(basket);
      const btl = cyl(.25, .35, .9, new THREE.MeshPhongMaterial({ color: 0x7ab8a0, transparent: true, opacity: .7 })); btl.rotation.z = 1.2; btl.position.set(gx - 30, height(gx - 30, gz - 18) + .35, gz - 18); scene.add(btl);   // 漂流瓶
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
      bengunn: { icon: '🧀', color: '#7a6a4a', title: '本·葛恩的山洞', en: "Ben Gunn's Cave", hint: '被弃者的家',
        desc: '"三年!三年没尝过一口奶酪!"——被同伙丢在岛上的本·葛恩就住在这个山洞里,靠山羊、浆果和牡蛎活了下来。他疯疯癫癫,却干成了全书最聪明的一件事:早就把宝藏挖走,搬进了这个洞。' },
      applebarrel: { icon: '🍎', color: '#8c3a2a', title: '苹果桶', en: 'The Apple Barrel', hint: '桶里听来的密谋',
        desc: '伊斯帕尼奥拉号上那只苹果桶的复制品。当年吉姆爬进桶底摸最后一只苹果,却听见西尔弗在桶外压低嗓音策反水手——一只苹果桶,救了全船正直人的命。' },
    },
    spots: [[10, 14, 'pirateflag'], [-18, -12, 'skullrock'], [0, -2, 'treasuredig'], [28, -24, 'bengunn'], [-26, 18, 'applebarrel']],
    npcs: [
      { dx: 8, dz: 12, name: '高个约翰·西尔弗', body: 0x4a5a3a, hat: 0x2e2a24, opts: { tall: 1.06, cane: true },
        lines: ['呦嗬嗬,还有一瓶朗姆酒!', '我这条腿,是在英国海军里丢的——霍金斯,做海盗要趁早。', '死人不咬人。可我偏偏留着你这小鬼的命,你说怪不怪?'] },
      { dx: -6, dz: 8, name: '吉姆·霍金斯', body: 0x9c640c, hat: 0x7d5109, opts: { tall: .74 },
        lines: ['我从苹果桶里,听见了他们全部的密谋。', '西尔弗又坏又好,我到现在也没想明白。', '八个里亚尔!八个里亚尔!——那是弗林特船长的鹦鹉在叫。'] },
      { dx: 26, dz: -20, name: '本·葛恩', body: 0x8a7a4a, hat: 0x5a4a2a, opts: { wide: .85, tall: .92 },
        lines: ['你……你身上带奶酪了吗?哪怕一小块,烤过的最好!', '别信西尔弗,信本·葛恩——本·葛恩现在是好人了。', '宝藏?嘿嘿……你猜,它还在不在坑里?'] },
    ],
    build: (gx, gz) => {
      const sx = gx + 10, sz = gz + 14, sh = height(sx, sz);
      for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; const post = cyl(.2, .24, 2.6, M.woodDark); post.position.set(sx + Math.cos(a) * 6, sh + 1.3, sz + Math.sin(a) * 6); scene.add(post); }
      const kx = gx - 18, kz = gz - 12, kh = height(kx, kz);
      const skull = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 8), M.stone); skull.position.set(kx, kh + 1.6, kz); scene.add(skull); cirObs.push({ x: kx, z: kz, r: 2.4 });
      for (const ox of [-3.2, 3.2]) { const boat = box(2, .5, 5, lam(0x7a4a26)); boat.position.set(gx + ox + 4, height(gx + 4, gz - 20) + .6, gz - 20); scene.add(boat); }
      for (const [tx, tz] of [[-3, -4], [3, -5], [0, 1]]) { const t = gx + tx * 2, u = gz + tz * 2, th = height(t, u); const tr = cyl(.5, .7, 5, M.wood); tr.position.set(t, th + 2.5, u); scene.add(tr); const cn = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 6), lam(0x4a7a3a)); cn.position.set(t, th + 6, u); scene.add(cn); }
      const xg = new THREE.Group(); for (const r of [-1, 1]) { const b = box(2.6, .12, .4, lam(0x8c2f2f)); b.rotation.y = r * .78; xg.add(b); } xg.position.set(gx, height(gx, gz) + .2, gz); scene.add(xg);
      const cx2 = gx + 28, cz2 = gz - 22, ch2 = height(cx2, cz2);   // 本·葛恩山洞 + 苹果桶
      const cave2 = new THREE.Mesh(new THREE.SphereGeometry(3.6, 10, 8, 0, 6.283, 0, Math.PI / 2.2), new THREE.MeshLambertMaterial({ color: 0x5a5044, side: THREE.DoubleSide })); cave2.position.set(cx2, ch2, cz2); scene.add(cave2); cirObs.push({ x: cx2, z: cz2, r: 3 });
      const brl = cyl(1, .85, 1.7, M.wood, 12); brl.position.set(gx - 26, height(gx - 26, gz + 18) + .85, gz + 18); scene.add(brl);
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
      chrgramo: { icon: '📀', color: '#3a3040', title: '留声机《天鹅之歌》', en: 'The Gramophone', hint: '宣判的声音',
        desc: '晚餐后,留声机忽然开口,逐一念出十位客人隐藏的罪:"爱德华·塞顿,你谋杀了……"唱片标签上写着《天鹅之歌》。没有欧文先生——声音来自这台机器,判决来自一只看不见的手。' },
      chrcliff: { icon: '🔭', color: '#4a5a68', title: '眺望崖', en: 'The Watch Point', hint: '船不会来',
        desc: '客人们轮流站在这里眺望大海,盼一艘船。暴风雨天,海面空无一物;晴天,渔船也绕着走——村里人早接了嘱咐:岛上的信号,一概不理。"我们出不去了。"最先说出这句话的人,反而最镇定。' },
    },
    spots: [[0, 3, 'tensoldiers'], [0, -8, 'chrmansion'], [16, 12, 'chrgramo'], [-24, -18, 'chrcliff']],
    npcs: [
      { dx: -8, dz: -2, name: '沃格雷夫法官', body: 0x3a3a44, hat: 0x2a2a30, opts: { tall: 1.04 },
        lines: ['我审了一辈子案子。有些人,法律碰不到——但正义可以。', '别慌。恐惧,才是这座岛真正的凶手。', '童谣不会说谎。下一个,该轮到谁了?'] },
      { dx: 7, dz: 4, name: '维拉', body: 0x8c6a9a, hat: 0x6a4a78, opts: { tall: .96 },
        lines: ['我没有……那个孩子是自己游出去的,不是我!', '每念完一句童谣,就有人再也醒不来。', '我数过了,瓷兵又少了一个。是谁?是谁干的?'] },
      { dx: 14, dz: 10, name: '隆巴德', body: 0x4a5a3a, hat: 0x33402a, opts: { tall: 1.05 },
        lines: ['我带了左轮枪——在这种岛上,这叫常识。', '十个小瓷兵,现在少了几个?你数学好吗?', '维拉小姐,如果最后只剩我们两个……你猜枪会在谁手里?'] },
    ],
    build: (gx, gz) => {
      const mx = gx, mz = gz - 8, mh = height(mx, mz);
      const manor = box(16, 7, 11, lam(0xe6e2d8)); manor.position.set(mx, mh + 3.5, mz); scene.add(manor); cirObs.push({ x: mx, z: mz, r: 8 });
      const roof = box(17, .6, 12, lam(0x4a4650)); roof.position.set(mx, mh + 7.3, mz); scene.add(roof);
      for (const ox of [-5, 0, 5]) { const win = box(1.6, 2, .2, new THREE.MeshBasicMaterial({ color: 0x2a2a34 })); win.position.set(mx + ox, mh + 3.4, mz + 5.6); scene.add(win); }
      const tx = gx, tz = gz + 3, th2 = height(tx, tz);
      const tbl = cyl(2.2, 2.2, .3, lam(0x5a4636), 16); tbl.position.set(tx, th2 + 1.2, tz); scene.add(tbl);
      for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; const sol = cyl(.14, .18, .7, lam(0xe0dccc)); sol.position.set(tx + Math.cos(a) * 1.4, th2 + 1.7, tz + Math.sin(a) * 1.4); scene.add(sol); }
      const px2 = gx + 16, pz2 = gz + 12, ph3 = height(px2, pz2);   // 留声机:箱体 + 大喇叭
      const gbox = box(1.4, 1, 1.4, M.woodDark); gbox.position.set(px2, ph3 + .9, pz2); scene.add(gbox);
      const horn = new THREE.Mesh(new THREE.ConeGeometry(.9, 1.6, 10, 1, true), M.gold); horn.rotation.z = 1.1; horn.position.set(px2 + .8, ph3 + 2, pz2); scene.add(horn);
      const wpole = cyl(.1, .12, 3.2, M.woodDark); wpole.position.set(gx - 24, height(gx - 24, gz - 18) + 1.6, gz - 18); scene.add(wpole);   // 眺望杆
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
      caliban: { icon: '🪵', color: '#5a4a34', title: '卡列班的柴堆', en: "Caliban's Logs", hint: '这岛是他的',
        desc: '"这岛是我的,是我妈妈西考拉克斯传给我的!"半人半兽的卡列班一边搬柴一边咒骂。他丑陋、粗野,却说得出全剧最美的台词:"这岛上充满了各种声音和悦耳的乐曲,使人听了愉快,不会伤害人。"' },
      tmpwreck: { icon: '⛵', color: '#3a4a5a', title: '那不勒斯王船', en: "The King's Ship", hint: '一场假海难',
        desc: '阿隆佐国王的船,被普洛斯彼罗的风暴"撕碎"在礁石上——其实一根缆绳都没断,水手们在舱底沉睡。魔法造出的海难:只淹没骄傲,不淹死人。' },
    },
    spots: [[0, 2, 'prospero'], [12, -8, 'ariel'], [-16, -14, 'caliban'], [22, -24, 'tmpwreck']],
    npcs: [
      { dx: -3, dz: 4, name: '普洛斯彼罗', body: 0x4a3a6a, hat: 0x2e2450, opts: { tall: 1.08, cane: true },
        lines: ['我们本是造梦的材料,短短一生,前后都环绕在睡眠里。', '稀有的德性,比之报复,是更高贵的行为。', '爱丽儿,把风暴收了吧——我要的不是他们的命,是他们的悔。'] },
      { dx: 6, dz: 6, name: '米兰达', body: 0xd8c4e0, hat: 0xb89ac8, opts: { tall: .98 },
        lines: ['啊,新奇的世界,竟有这样出色的人物!', '父亲,您施法的时候,总是这样温柔又可怕。', '我从没见过男人——除了你,和那个梦里的青年。'] },
      { dx: -18, dz: -10, name: '卡列班', body: 0x5a6a3a, hat: 0x3a4a26, opts: { wide: 1.35, tall: .85 },
        lines: ['这岛是我的!你们全是强盗!', '别打我……我给你捡榛子,给你指清泉在哪儿。', '这岛上充满了声音,使人听了愉快,不会伤害人。'] },
      { dx: 14, dz: 8, name: '费迪南德', body: 0x8a6ab0, hat: 0xd9b26a, opts: { tall: 1.02 },
        lines: ['为了米兰达,搬一万根木头也是甜的。', '父王还活着?那这场风暴……究竟是什么?', '她叫米兰达——"奇迹"的意思。名副其实。'] },
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
      const lx2 = gx - 16, lz2 = gz - 14, lh3 = height(lx2, lz2);   // 卡列班的柴堆
      for (let i = 0; i < 5; i++) { const log = cyl(.22, .26, 2.6, M.woodDark); log.rotation.z = Math.PI / 2; log.rotation.y = i * .55; log.position.set(lx2, lh3 + .25 + Math.floor(i / 3) * .45, lz2); scene.add(log); }
      const mast2 = cyl(.16, .2, 6, M.woodDark); mast2.rotation.z = .9; mast2.position.set(gx + 24, height(gx + 22, gz - 24) + 1.8, gz - 26); scene.add(mast2);   // 王船断桅
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
      morpuma: { icon: '🐆', color: '#6a4a2a', title: '断链之地', en: "The Puma's Revenge", hint: '造物主死于造物',
        desc: '那头被绑上手术台的美洲狮挣断了锁链。莫罗提枪追进林子——人们找到他时,他和它同归于尽。造物主死于自己的造物,"痛苦之屋"的门,从此再没人敢开。' },
      morboat: { icon: '🛶', color: '#4a5a6a', title: '普伦狄克的小船', en: "Prendick's Boat", hint: '逃离之后',
        desc: '叙述者普伦狄克最后乘这条小船逃离了岛。回到伦敦,他再也无法直视人群:"我总觉得他们的脸,随时会开始退化。"有些岛,人离开了,岛却跟了一辈子。' },
    },
    spots: [[0, 6, 'morlaw'], [-12, -8, 'morhouse'], [20, -18, 'morpuma'], [-26, 16, 'morboat']],
    npcs: [
      { dx: -10, dz: -4, name: '莫罗博士', body: 0xe0dcd2, hat: 0xc8c4ba, opts: { tall: 1.08 },
        lines: ['我研究的是生命可塑的极限。', '痛苦?再过一两百年,人类会觉得那不值一提。', '这些造物一犯错,就得回痛苦之屋——律法必须刻进血里。'] },
      { dx: 8, dz: 6, name: '念律法者', body: 0x6a5a4a, hat: 0x4a3a2a, opts: { tall: .9, wide: 1.2 },
        lines: ['不许四脚爬行——我们,不是人吗?', '他的是造物之手,他的是伤人之手,他的是治愈之手。', '入夜了……律法,越来越难念下去了。'] },
      { dx: -18, dz: -14, name: '蒙哥马利', body: 0x7a6a5a, hat: 0x5a4a3a, opts: { tall: 1.0 },
        lines: ['喝一杯?这岛上只有酒精能让人维持"人形"。', '我在伦敦救过莫罗的命,如今替他看管这些……作品。', '别叫它们怪物。它们管我叫"拿鞭子的人"。'] },
    ],
    build: (gx, gz) => {
      const lx = gx - 12, lz = gz - 8, lh = height(lx, lz);
      const lab = box(11, 5, 8, lam(0x9a9a8a)); lab.position.set(lx, lh + 2.5, lz); scene.add(lab); cirObs.push({ x: lx, z: lz, r: 6 });
      const labr = box(12, .5, 9, lam(0x6a6a5a)); labr.position.set(lx, lh + 5.2, lz); scene.add(labr);
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, r = 16; const post = cyl(.16, .2, 2.4, M.woodDark); const fx = gx + Math.cos(a) * r, fz = gz + Math.sin(a) * r; post.position.set(fx, height(fx, fz) + 1.2, fz); scene.add(post); }
      for (const [hx, hz] of [[10, 8], [14, -2], [6, 12]]) { const hut = cyl(2, 2.4, 2.6, lam(0x7a5a3a), 6); const u = gx + hx, v = gz + hz, hh = height(u, v); hut.position.set(u, hh + 1.3, v); scene.add(hut); const top = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.6, 6), lam(0x5a4028)); top.position.set(u, hh + 3.4, v); scene.add(top); }
      const px3 = gx + 20, pz3 = gz - 18, ph4 = height(px3, pz3);   // 断链桩
      const stake = cyl(.24, .3, 1.8, M.woodDark); stake.position.set(px3, ph4 + .9, pz3); scene.add(stake);
      for (let i = 0; i < 4; i++) { const link = new THREE.Mesh(new THREE.TorusGeometry(.22, .07, 6, 10), lam(0x4a4a50)); link.position.set(px3 + .3 + i * .34, ph4 + .25, pz3 + i * .1); link.rotation.set(1.2, i, 0); scene.add(link); }
      const pboat = box(1.8, .5, 4.6, lam(0x5a6a72)); pboat.rotation.z = 2.9; pboat.position.set(gx - 26, height(gx - 26, gz + 16) + .6, gz + 16); scene.add(pboat);   // 翻扣的小船
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
      dolrontu: { icon: '🐕', color: '#7a6a52', title: '朗图', en: 'Rontu', hint: '仇人变家人',
        desc: '野狗首领朗图咬死了卡拉娜的弟弟。她造好弓箭要复仇,却在它中箭倒下时救了它、给它取名"朗图"——狐狸眼睛的意思。此后的岁月里,岛上第一次有了会回应她说话的声音。仇与亲之间,只隔一次心软。' },
      dolship: { icon: '⛵', color: '#c8d4de', title: '白帆船', en: 'The White Sail', hint: '十八年后的那艘船',
        desc: '十八年后,一艘白帆船真的来了。卡拉娜穿上鸬鹚羽毛裙、带着朗图之子登船,最后望了一眼海豚环游的岛。历史上真实的她——"圣尼古拉斯岛的失落女人"——1853 年被接走,十八个月后去世,世上再无人听得懂她的语言。' },
    },
    spots: [[0, 4, 'karana'], [14, -10, 'otterbay'], [-18, -16, 'dolrontu'], [26, 14, 'dolship']],
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
      const dx2 = gx - 18, dz3 = gz - 16, dh2 = height(dx2, dz3);   // 朗图(灰黄野犬)
      const dogB = new THREE.Mesh(new THREE.SphereGeometry(.55, 8, 6), lam(0x8a7a58)); dogB.scale.set(1, .8, 1.7); dogB.position.set(dx2, dh2 + .55, dz3); scene.add(dogB);
      const dogH = new THREE.Mesh(new THREE.SphereGeometry(.32, 7, 6), lam(0x9a8a64)); dogH.position.set(dx2, dh2 + .95, dz3 + .85); scene.add(dogH);
      for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(.1, .28, 5), lam(0x7a6a4a)); ear.position.set(dx2 + s * .18, dh2 + 1.2, dz3 + .8); scene.add(ear); }
      makeBoat(0xf5efdc, .9).userData = { anchor: [gx + 34, gz + 22] };   // 白帆船泊在湾外
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
      flylord: { icon: '🪰', color: '#5a3a2a', title: '蝇王(猪头桩)', en: 'Lord of the Flies', hint: '献给"野兽"的祭品',
        desc: '猎手们把猪头插上削尖的木桩,献给传说中的"野兽"。苍蝇云集,猪头咧着嘴——西蒙在幻觉里听见它开口:"我就是野兽。想不到吧?野兽是杀不死的,因为它就在你们心里。"《蝇王》之名,由此而来。' },
      flyglasses: { icon: '👓', color: '#4a5a6a', title: '猪崽子的眼镜', en: "Piggy's Specs", hint: '全岛唯一的火种',
        desc: '全岛唯一的火种不是火柴,是猪崽子的近视眼镜。谁抢到眼镜,谁就垄断了火——文明的工具,成了权力的筹码。镜片先碎了一块,又被整副抢走;猪崽子从此半盲,直到那块从天而降的岩石。' },
    },
    spots: [[0, 4, 'flyconch'], [-2, -8, 'flybeast'], [22, -20, 'flylord'], [-22, 14, 'flyglasses']],
    npcs: [
      { dx: -4, dz: 6, name: '拉尔夫', body: 0xd9c34a, hat: 0xb8a030, opts: { tall: .8 },
        lines: ['我们得有规矩!拿着海螺才能说话。', '火堆不能灭——那是我们唯一能回家的办法。', '我在哭,为童年的终结,为人心的黑暗。'] },
      { dx: 5, dz: 5, name: '猪崽子', body: 0xc86a6a, hat: 0x9a4a4a, opts: { wide: 1.3, tall: .78 },
        lines: ['我的眼镜!没了它我什么都看不见——火也生不起来。', '到底是做人好,还是做打猎的野人好?', '拉尔夫,他们把海螺当回事的时候,一切还都好好的。'] },
      { dx: 20, dz: -16, name: '杰克', body: 0xb03a2a, hat: 0x7a1a10, opts: { tall: .82 },
        lines: ['宰了野猪哟!割了喉咙哟!放了血哟!', '规矩?我们不要规矩!我们是猎手!', '脸上涂了彩,你就不再是你了——什么都敢干。'] },
      { dx: -12, dz: -18, name: '西蒙', body: 0x6a8a9a, hat: 0x4a6a7a, opts: { tall: .72 },
        lines: ['野兽……也许,只是我们自己。', '我想说来着,可他们都在喊,没人听。', '山顶那个"野兽"我去看过了——那只是个挂在树上的飞行员,死了。'] },
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
      const sx3 = gx + 22, sz3 = gz - 20, sh4 = height(sx3, sz3);   // 蝇王猪头桩
      const spk = cyl(.09, .13, 2.8, M.woodDark); spk.position.set(sx3, sh4 + 1.4, sz3); scene.add(spk);
      const phead = new THREE.Mesh(new THREE.SphereGeometry(.55, 9, 7), lam(0xd8a0a0)); phead.scale.set(1, .9, 1.15); phead.position.set(sx3, sh4 + 3, sz3); scene.add(phead);
      for (const s of [-1, 1]) { const lens = new THREE.Mesh(new THREE.TorusGeometry(.28, .05, 6, 12), lam(0x3a3a3a)); lens.rotation.x = Math.PI / 2; lens.position.set(gx - 22 + s * .32, height(gx - 22, gz + 14) + .5, gz + 14); scene.add(lens); }   // 眼镜
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
      utodine: { icon: '🍲', color: '#7a6a4a', title: '公共食堂', en: 'The Common Hall', hint: '钟声一响,同桌吃饭',
        desc: '乌托邦人三十户一堂,钟声一响同桌吃饭,饭前读一段劝善短文。愿意自己开火也不禁止——只是没人愿意:"自己做,既费事,又难吃。"共同生活的黏合剂,常常就是一锅热汤。' },
      utofarm: { icon: '🌾', color: '#8a8a3a', title: '轮耕农庄', en: 'The Rotation Farm', hint: '人人两年农活',
        desc: '城里人轮流下乡务农两年:没人能一辈子躲开锄头,也没人一辈子被锄头拴住。莫尔借拉斐尔之口说:劳动不该是一部分人的诅咒,和另一部分人的装饰。' },
    },
    spots: [[0, 4, 'utocity'], [14, -8, 'utogold'], [-22, 16, 'utodine'], [24, 18, 'utofarm']],
    npcs: [
      { dx: -4, dz: 6, name: '拉斐尔', body: 0x5a7a8a, hat: 0x3a5a6a, opts: { tall: 1.05, cane: true },
        lines: ['我周游过那座岛。那里没有钱,却什么都不缺。', '哪里有私有财产,哪里就难有公正与繁荣。', '完美的制度,代价是每个人都长得一样。你愿意吗?'] },
      { dx: 8, dz: 8, name: '乌托邦市民', body: 0x8a9aa8, hat: 0x6a7a88,
        lines: ['我们每天劳作六小时,其余时间读书、听讲、种花。', '黄金?我家的夜壶就是金的。', '门不必上锁——十年之后,这房子就是别家的了。'] },
      { dx: -20, dz: 20, name: '托马斯·莫尔', body: 0x2a2a34, hat: 0x1a1a24, opts: { tall: 1.04, cane: true },
        lines: ['我只是把船医拉斐尔的见闻记下来——信不信,由读者。', '"乌托邦",希腊语的意思是:乌有之乡。', '全书最要紧的一句,我放在结尾:与其说我期望,不如说我愿望。'] },
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
      const tx3 = gx - 22, tz3 = gz + 16, th3 = height(tx3, tz3);   // 公共食堂长桌
      const ltbl = box(7, .3, 1.6, M.wood); ltbl.position.set(tx3, th3 + 1.1, tz3); scene.add(ltbl);
      for (const s of [-1, 1]) { const bench = box(7, .22, .6, M.woodDark); bench.position.set(tx3, th3 + .6, tz3 + s * 1.3); scene.add(bench); }
      for (let i = 0; i < 4; i++) { const row = box(6, .25, 1.1, lam(0x7a8a3a)); row.position.set(gx + 24, height(gx + 24, gz + 18) + .2, gz + 14 + i * 2.4); scene.add(row); }   // 农田畦
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
      huxscare: { icon: '🎎', color: '#8a7a4a', title: '会点头的稻草人', en: 'The Scarecrows', hint: '拉线在孩子手里',
        desc: '帕拉的稻田里,稻草人做成神像的模样,拉线握在赶鸟的孩子手里——孩子们一边驱雀,一边操纵"神"点头微笑。老拉贾的设计:让孩子从小亲手知道,神像会点头,是因为有人在拉线。' },
      huxbook: { icon: '📔', color: '#4a6a5a', title: '《旧拉贾笔记》', en: 'Notes on What Is What', hint: '事事分明',
        desc: '薄薄一册《事事分明》,帕拉人人都读:"我是此时此地的注脚。""轻轻地走,孩子——用心,不用力。"威尔一路读一路脸红:他前半生所有的抓取,恰是书里说的"用力"。' },
    },
    spots: [[0, 4, 'mynah'], [12, -6, 'moksha'], [24, 16, 'huxscare'], [-20, -14, 'huxbook']],
    npcs: [
      { dx: -3, dz: 6, name: '苏珊娜医生', body: 0xd8c4d0, hat: 0x9a7a9a, opts: { tall: 1.0 },
        lines: ['注意,此时此地——这是我们全部的功课。', '我们既不否认痛苦,也不沉溺其中;我们只是看着它。', '你从哪个焦虑的世界来?在这里,先学会呼吸。'] },
      { dx: 7, dz: 5, name: '威尔', body: 0x6a7a6a, hat: 0x4a5a4a,
        lines: ['我原是来搞石油生意的,却在这里第一次学会活着。', '那只鸟说得对:注意。我半辈子都没真正"注意"过。', '也许这样温柔的乌托邦,终究挡不住外面的坦克……但今天,还有今天。'] },
      { dx: -16, dz: 12, name: '穆鲁根', body: 0x8a4a6a, hat: 0xd9b26a, opts: { tall: .88 },
        lines: ['摩托车!石油!军队!外面的世界那才叫真实!', '冥想?八哥?我受够了这个岛的"此时此地"。', '等我继位……帕拉就该"现代化"了。你说是不是?'] },
    ],
    build: (gx, gz) => {
      const px = gx, pz = gz + 4, ph = height(px, pz);
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; const col = cyl(.2, .24, 3.4, lam(0xc8a878)); col.position.set(px + Math.cos(a) * 4, ph + 1.7, pz + Math.sin(a) * 4); scene.add(col); }
      const roof = new THREE.Mesh(new THREE.ConeGeometry(5.4, 2.6, 6), lam(0xa86a4a)); roof.position.set(px, ph + 4.8, pz); scene.add(roof);
      const pond = new THREE.Mesh(new THREE.CircleGeometry(4, 20), new THREE.MeshPhongMaterial({ color: 0x4a8ab0, transparent: true, opacity: .82 })); pond.rotation.x = -Math.PI / 2; pond.position.set(gx + 12, height(gx + 12, gz + 8) + .2, gz + 8); scene.add(pond);
      for (const [tx, tz] of [[-12, -6], [10, -8], [14, 6]]) { const u = gx + tx, v = gz + tz, th = height(u, v); const tr = cyl(.3, .4, 4, M.wood); tr.position.set(u, th + 2, v); scene.add(tr); const cn = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 6), lam(0x4a8a5a)); cn.position.set(u, th + 5, v); scene.add(cn); const bird = new THREE.Mesh(new THREE.SphereGeometry(.3, 6, 5), lam(0x2a2a2a)); bird.position.set(u, th + 6.4, v); scene.add(bird); }
      const scX = gx + 24, scZ = gz + 16, scH = height(scX, scZ);   // 神像稻草人
      const scP = cyl(.12, .14, 3, M.woodDark); scP.position.set(scX, scH + 1.5, scZ); scene.add(scP);
      const scA = box(2, .18, .18, M.woodDark); scA.position.set(scX, scH + 2.4, scZ); scene.add(scA);
      const scHd = new THREE.Mesh(new THREE.SphereGeometry(.42, 8, 6), M.gold); scHd.position.set(scX, scH + 3.2, scZ); scene.add(scHd);
      const bkP = cyl(.6, .7, .9, M.stone, 8); bkP.position.set(gx - 20, height(gx - 20, gz - 14) + .45, gz - 14); scene.add(bkP);   // 笔记石座
      const bk2 = box(.9, .16, .7, lam(0x4a6a5a)); bk2.position.set(gx - 20, height(gx - 20, gz - 14) + 1, gz - 14); scene.add(bk2);
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
      gulrope: { icon: '🤸', color: '#6a8a4a', title: '绳上舞蹈', en: 'Rope-Dancing', hint: '选官不考文章,考走绳',
        desc: '利立浦特选官不看文章,看走绳:谁在御前的绳索上跳得最高、落得最稳,谁得高位。财政大臣弗林奈浦是全国第一——能在一根麻绳上连翻三个筋斗。讽刺不在小人国,在写它的人间。' },
      gulfire: { icon: '🔥', color: '#8c5a2a', title: '皇宫火灾旧址', en: 'The Palace Fire', hint: '救火有功,方式有罪',
        desc: '皇后寝宫失火,顶针大的水桶杯水车薪。格列佛急中生智,用了一个"非常规手段"把火浇灭——救驾有功,却犯下"在御苑便溺"的死罪,弹劾书连夜写就。宫廷的逻辑,古今如一。' },
    },
    spots: [[0, 3, 'lilliput'], [16, -10, 'laputa'], [-20, 12, 'gulrope'], [-8, -18, 'gulfire']],
    npcs: [
      { dx: -6, dz: 6, name: '利立浦特皇帝', body: 0xc23a3a, hat: 0xf2d13c, opts: { tall: .4 },
        lines: ['宇宙的欢乐、万民的恐怖——朕,欢迎你这座"人山"。', '敲鸡蛋,必须从小头敲!此乃祖制!', '你救驾有功……但你在御花园撒尿,该当何罪?'] },
      { dx: 8, dz: 7, name: '拉普达学者', body: 0x8a8a9a, hat: 0x5a5a6a, opts: { tall: 1.02 },
        lines: ['请稍候……(仆人拍了他一下)……哦,你说什么?', '我正从这根黄瓜里,提取封存的阳光。', '实用之学?粗鄙!我们只研究纯粹而无用的真理。'] },
      { dx: -18, dz: 14, name: '财政大臣弗林奈浦', body: 0x8a6a2a, hat: 0xd9b26a, opts: { tall: .42 },
        lines: ['本大臣的绳上筋斗,全国无人能及!', '那个"人山"每天吃掉一千七百份口粮,国库要空了!', '在陛下面前,我永远跳得最高——字面意义上的。'] },
    ],
    build: (gx, gz) => {
      for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { const u = gx - 16 + c * 6, v = gz - 8 + r * 6, hh = height(u, v); const h2 = box(1.6, 1.2, 1.4, lam([0xd8b088, 0xc8a878, 0xe0c498][(r + c) % 3])); h2.position.set(u, hh + .6, v); scene.add(h2); const rf = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1, 4), lam(0x9a4a3a)); rf.rotation.y = .78; rf.position.set(u, hh + 1.7, v); scene.add(rf); }
      const palace = box(3, 2.4, 2.6, lam(0xe8d8b0)); palace.position.set(gx, height(gx, gz) + 1.2, gz); scene.add(palace);
      const lx = gx + 16, lz = gz - 10, lh = height(lx, lz) + 28;
      const disc = cyl(9, 7, 2.4, M.stone, 16); disc.position.set(lx, lh, lz); scene.add(disc);
      const ltop = new THREE.Mesh(new THREE.SphereGeometry(3, 12, 8), lam(0x8a8a9a)); ltop.position.set(lx, lh + 2.4, lz); scene.add(ltop);
      const lens = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8), new THREE.MeshBasicMaterial({ color: 0xbfd0e0 })); lens.position.set(lx, lh - 2, lz); scene.add(lens);
      const rx3 = gx - 20, rz3 = gz + 12, rh3 = height(rx3, rz3);   // 御前走绳
      for (const s of [-1, 1]) { const post2 = cyl(.1, .12, 1.4, M.woodDark); post2.position.set(rx3 + s * 2.4, rh3 + .7, rz3); scene.add(post2); }
      const rope2 = cyl(.03, .03, 4.8, lam(0xd8c8a0), 5); rope2.rotation.z = Math.PI / 2; rope2.position.set(rx3, rh3 + 1.3, rz3); scene.add(rope2);
      const burnt = box(2.6, 1.8, 2.2, lam(0x2a2420)); burnt.position.set(gx - 8, height(gx - 8, gz - 18) + .9, gz - 18); scene.add(burnt);   // 焦黑的寝宫一角
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
      nvlcroc: { icon: '🐊', color: '#3a6a3a', title: '滴答鳄鱼', en: 'Tick-Tock Croc', hint: '听,滴答声',
        desc: '那条吞了闹钟的鳄鱼,一路滴答着追胡克船长——它尝过船长一只手的味道,惦记着剩下的部分。胡克一听见滴答就腿软。可总有一天,钟会停的……' },
      nvlwendy: { icon: '🏠', color: '#8a5a6a', title: '温迪的小屋', en: 'The Wendy House', hint: '为讲故事的人盖的房',
        desc: '温迪中箭坠落,孩子们就地用树枝给她盖了座小房子:窗是画的,烟囱是一顶礼帽。"要不要给她装个门环?""要!"——梦幻岛的第一栋房子,是为一位讲故事的人盖的。' },
    },
    spots: [[0, 4, 'lostchildren'], [16, -8, 'mermaidlagoon'], [-20, -12, 'nvlcroc'], [-14, 16, 'nvlwendy']],
    npcs: [
      { dx: -4, dz: 6, name: '长不大的少年', body: 0x3a7a3a, hat: 0x2a5a2a, opts: { tall: .82 },
        lines: ['死亡,将是一场了不起的大冒险!', '你只要想着快乐的事,就能飞起来。', '我不想长大,永远都不想——来,和我们一起吧?'] },
      { dx: 7, dz: 5, name: '钩子船长', body: 0x8c2f4e, hat: 0x2a2a2a, opts: { tall: 1.06, cane: true },
        lines: ['听……那滴答声。那条吞了我一只手的鳄鱼,又来了。', '好风度!那才是最要紧的。', '总有一天,我要让那个会飞的臭小子付出代价。'] },
      { dx: -12, dz: 18, name: '温迪', body: 0x7a9ab8, hat: 0x5a7a98, opts: { tall: .9 },
        lines: ['好了孩子们,睡前故事时间到了。', '彼得,那叫顶针,不是吻。……哦,随你吧。', '妈妈会永远开着窗等我们。我得回家了——你呢?'] },
    ],
    build: (gx, gz) => {
      const tx = gx, tz = gz + 4, th = height(tx, tz);
      const trunk = cyl(2.2, 2.8, 7, M.wood, 10); trunk.position.set(tx, th + 3.5, tz); scene.add(trunk); cirObs.push({ x: tx, z: tz, r: 2.8 });
      const cano = new THREE.Mesh(new THREE.SphereGeometry(5, 12, 9), lam(0x3a7a3a)); cano.position.set(tx, th + 8.5, tz); scene.add(cano);
      const lag = new THREE.Mesh(new THREE.CircleGeometry(6, 22), new THREE.MeshPhongMaterial({ color: 0x2a9ab0, transparent: true, opacity: .82 })); lag.rotation.x = -Math.PI / 2; lag.position.set(gx + 16, height(gx + 16, gz - 8) + .2, gz - 8); scene.add(lag);
      const ship = makeBoat(0x8c2f4e, .9); ship.userData = { anchor: [gx + 20, gz + 16] };
      for (const [rx, rz] of [[13, -12], [19, -5]]) { const rock = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 6), M.stone); const u = gx + rx, v = gz + rz; rock.position.set(u, height(u, v) + .8, v); scene.add(rock); }
      const cx3 = gx - 20, cz3 = gz - 12, ch3 = height(cx3, cz3);   // 滴答鳄鱼
      const cbody = new THREE.Mesh(new THREE.SphereGeometry(.8, 9, 7), lam(0x3a7a3a)); cbody.scale.set(1, .6, 2.6); cbody.position.set(cx3, ch3 + .5, cz3); scene.add(cbody);
      const cjaw = new THREE.Mesh(new THREE.ConeGeometry(.4, 1.6, 6), lam(0x2e6a2e)); cjaw.rotation.x = Math.PI / 2; cjaw.position.set(cx3, ch3 + .5, cz3 + 2.6); scene.add(cjaw);
      const wx3 = gx - 14, wz3 = gz + 16, wh3 = height(wx3, wz3);   // 温迪小屋(树枝屋+礼帽烟囱)
      const whut = box(2.6, 2, 2.2, lam(0x7a6a4a)); whut.position.set(wx3, wh3 + 1, wz3); scene.add(whut);
      const wroof = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.2, 4), lam(0x4a8a5a)); wroof.rotation.y = .78; wroof.position.set(wx3, wh3 + 2.6, wz3); scene.add(wroof);
      const whb = cyl(.28, .3, .5, lam(0x2a2a2a)); whb.position.set(wx3 + .7, wh3 + 3.3, wz3); scene.add(whb);   // 礼帽
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
      corcandle: { icon: '🕯️', color: '#8a8a4a', title: '蜡烛果树', en: 'The Candlenut Tree', hint: '把夜晚赢回来',
        desc: '彼得金的大发现:蜡烛果串在椰壳纤维上,点着了就是一支蜡烛。三个少年靠它把夜晚从黑暗里赢了回来——巴兰坦写给少年们的信条:知识加上双手,就是文明。' },
      corcave2: { icon: '💎', color: '#4a7a9a', title: '钻石洞', en: 'The Diamond Cave', hint: '水下才有入口',
        desc: '拉尔夫潜水时发现的岩洞:钟乳倒悬,水光如钻。后来它救了三人的命——被海盗追捕时,他们从水下潜进洞里,海盗把全岛翻了个遍,也想不到脚下别有洞天。' },
    },
    spots: [[0, 4, 'coralreef'], [-12, -6, 'coralboys'], [16, 18, 'corcandle'], [-22, 12, 'corcave2']],
    npcs: [
      { dx: -4, dz: 6, name: '彼得金', body: 0xe0a83a, hat: 0xb88420, opts: { tall: .8 },
        lines: ['又是烤鱼!不过说真的,我一辈子没这么快活过。', '拉尔夫潜水,杰克啥都会,我嘛——负责逗大家笑。', '海盗要是敢来,咱们就用椰子砸他个落花流水!'] },
      { dx: 10, dz: 12, name: '杰克·马丁', body: 0x2a6a8a, hat: 0x1a4a68, opts: { tall: 1.02 },
        lines: ['我十八岁,是这儿的队长——按年龄,也按厨艺。', '造筏、生火、认星象……学校没教的,这座岛全教了。', '遇事别慌。慌,才是荒岛上唯一的猛兽。'] },
      { dx: -8, dz: 14, name: '拉尔夫·洛弗', body: 0x6a8a5a, hat: 0x4a6a3e, opts: { tall: .9 },
        lines: ['我在写日记——就算我们回不去,故事也回得去。', '杰克说我潜水像海豚。其实我只是……终于不怕水了。', '彼得金又在逗鹦鹉。有他在,荒岛跟度假一样。'] },
    ],
    build: (gx, gz) => {
      const lag = new THREE.Mesh(new THREE.CircleGeometry(8, 24), new THREE.MeshPhongMaterial({ color: 0x2ab0c0, transparent: true, opacity: .8 })); lag.rotation.x = -Math.PI / 2; lag.position.set(gx, height(gx, gz) + .2, gz); scene.add(lag);
      for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; const cor = new THREE.Mesh(new THREE.ConeGeometry(.8, 1.6, 5), lam([0xe86a8a, 0xd94040, 0xe0a040, 0x8a4ab0][i % 4])); const u = gx + Math.cos(a) * 9.5, v = gz + Math.sin(a) * 9.5; cor.position.set(u, height(u, v) + .8, v); scene.add(cor); }
      for (const [tx, tz] of [[-12, -6], [12, -8], [10, 8], [-10, 8]]) { const u = gx + tx, v = gz + tz, th = height(u, v); const tr = cyl(.28, .4, 5.5, M.wood); tr.rotation.z = (rnd() - .5) * .3; tr.position.set(u, th + 2.7, v); scene.add(tr); const fr = new THREE.Mesh(new THREE.SphereGeometry(2, 7, 5), lam(0x4a9a4a)); fr.scale.set(1.4, .7, 1.4); fr.position.set(u, th + 5.6, v); scene.add(fr); }
      const raft = box(3, .4, 4, M.woodDark); raft.position.set(gx + 11, height(gx + 11, gz + 10) + .5, gz + 10); scene.add(raft);
      const cnX = gx + 16, cnZ = gz + 18, cnH = height(cnX, cnZ);   // 蜡烛果树(挂着发光果串)
      const cnT = cyl(.26, .36, 4.6, M.wood); cnT.position.set(cnX, cnH + 2.3, cnZ); scene.add(cnT);
      const cnC = new THREE.Mesh(new THREE.SphereGeometry(1.9, 8, 6), lam(0x5a9a4a)); cnC.scale.set(1.3, .8, 1.3); cnC.position.set(cnX, cnH + 5, cnZ); scene.add(cnC);
      for (let i = 0; i < 4; i++) { const nut = new THREE.Mesh(new THREE.SphereGeometry(.16, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffe08a })); nut.position.set(cnX + Math.cos(i * 1.6) * 1.2, cnH + 3.6 - i * .3, cnZ + Math.sin(i * 1.6) * 1.2); scene.add(nut); }
      const cvM = new THREE.Mesh(new THREE.SphereGeometry(2.8, 10, 8, 0, 6.283, 0, Math.PI / 2.3), new THREE.MeshLambertMaterial({ color: 0x3a5a6a, side: THREE.DoubleSide })); cvM.position.set(gx - 22, height(gx - 22, gz + 12), gz + 12); scene.add(cvM);   // 钻石洞口
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
      typfeast: { icon: '🔥', color: '#8a5a2a', title: '宴会石台', en: 'The Feast Ti', hint: '飨宴,还是……?',
        desc: '山谷尽头的巨石台,火塘彻夜不熄。泰皮人在这里烤野猪、捣波伊——可某个深夜,汤莫瞥见台上一只盖着的木盆,盆沿露出的东西让他血液凝固。是他看错了,还是传闻是真的?他不敢问,也不敢再看。' },
      typkory: { icon: '🛖', color: '#6a5a3a', title: '科里-科里的家', en: "Kory-Kory's Hut", hint: '忠仆与背夫',
        desc: '汤莫伤了腿,泰皮人便派科里-科里寸步不离地照顾他:背他下河洗澡、替他生火捣食、在宴会上给他抢最好的一块。这份周到让人温暖,也让人发凉——他们待他像贵客,还是像……养着的什么?' },
    },
    spots: [[0, 4, 'typeevalley'], [14, -8, 'typeetabu'], [22, 16, 'typfeast'], [-18, -14, 'typkory']],
    npcs: [
      { dx: -4, dz: 6, name: '汤莫', body: 0x6a7a8a, hat: 0x4a5a6a, opts: { tall: 1.0 },
        lines: ['他们待我这样好……可我总在数,盛宴的日子是不是快到了。', '在这山谷里,没人为明天发愁——这倒把我这个文明人衬得可笑。', '法亚薇替我求了情,他们才允我去海边。船,快来吧。'] },
      { dx: 7, dz: 5, name: '法亚薇', body: 0xd8a86a, hat: 0x8a5a2a, opts: { tall: .95 },
        lines: ['你为什么总望着海?海那边,有比这里更好的地方吗?', '别怕文身师……不过,你要真留下,就得像我们一样。', '(她替你拨开独木舟的禁忌绳)——去吧,趁潮水正好。'] },
      { dx: 20, dz: 12, name: '科里-科里', body: 0x7a4a2a, hat: 0x5a3620, opts: { wide: 1.25 },
        lines: ['来,趴我背上——你的腿还没好,河边我背你去。', '波伊要这样捣,火要这样生。看好了,客人。', '(他忽然收起笑)宴会石台那边……今晚你别过去。'] },
    ],
    build: (gx, gz) => {
      for (const [hx, hz] of [[-6, 6], [6, 8], [10, -2], [-10, -4]]) { const u = gx + hx, v = gz + hz, hh = height(u, v); for (const px of [-1.5, 1.5]) for (const pz of [-1.5, 1.5]) { const stilt = cyl(.12, .14, 2, M.woodDark); stilt.position.set(u + px, hh + 1, v + pz); scene.add(stilt); } const flr = box(4, .3, 4, M.wood); flr.position.set(u, hh + 2, v); scene.add(flr); const rf = new THREE.Mesh(new THREE.ConeGeometry(3.2, 2.2, 4), lam(0x6a5a3a)); rf.rotation.y = .78; rf.position.set(u, hh + 3.4, v); scene.add(rf); }
      for (const [tx, tz] of [[0, 0], [3, -3]]) { const u = gx + tx, v = gz + tz + 12, th = height(u, v); const tiki = box(1, 3.4, 1, lam(0x5a4030)); tiki.position.set(u, th + 1.7, v); scene.add(tiki); const face = new THREE.Mesh(new THREE.SphereGeometry(.7, 6, 5), lam(0x8a6a4a)); face.position.set(u, th + 3.4, v); scene.add(face); }
      for (const [tx, tz] of [[-14, 4], [13, 6], [8, -12]]) { const u = gx + tx, v = gz + tz, th = height(u, v); const tr = cyl(.3, .42, 6, M.wood); tr.position.set(u, th + 3, v); scene.add(tr); const fr = new THREE.Mesh(new THREE.SphereGeometry(2.2, 7, 5), lam(0x3a8a3a)); fr.scale.set(1.4, .7, 1.4); fr.position.set(u, th + 6.2, v); scene.add(fr); }
      const ftX = gx + 22, ftZ = gz + 16, ftH = height(ftX, ftZ);   // 宴会石台 + 火塘
      const slab = box(6, 1.2, 4.4, M.stone); slab.position.set(ftX, ftH + .6, ftZ); scene.add(slab); cirObs.push({ x: ftX, z: ftZ, r: 3.4 });
      const fpit = new THREE.Mesh(new THREE.ConeGeometry(.5, 1.4, 6), new THREE.MeshBasicMaterial({ color: 0xff7a2a })); fpit.position.set(ftX + 1.6, ftH + 1.9, ftZ); scene.add(fpit);
      const bowl = cyl(.7, .5, .5, M.woodDark, 10); bowl.position.set(ftX - 1.6, ftH + 1.45, ftZ + .8); scene.add(bowl);   // 盖着的木盆……
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
      tahata: { icon: '🌺', color: '#c26a8a', title: '爱塔的家', en: "Ata's Home", hint: '陪到最后的人',
        desc: '土著姑娘爱塔嫁给了斯特里克兰,在山谷深处陪他画画、生子、采果。麻风病来了,佣人跑光了,她留下:"你是我的男人,我是你的女人。你去哪儿,我去哪儿。"全书里唯一没被他伤害的爱,是不求回应的那种。' },
      tahdoctor: { icon: '🩺', color: '#5a7a8a', title: '库特拉医生的山路', en: "Dr. Coutras' Path", hint: '最后的见证者',
        desc: '库特拉医生沿这条山路出诊,推开木屋的门,呆立当场——四壁从地到顶画满了壁画:伊甸园、果树、亚当与夏娃。"那是伟大的、肉欲的、充满激情的美。"而作画的人已经瞎了一年。他遵嘱守到画者死去,又亲眼看着遗嘱执行:一把火,全烧了。' },
    },
    spots: [[0, 4, 'studio'], [14, -6, 'sixpence'], [-20, 14, 'tahata'], [22, 12, 'tahdoctor']],
    npcs: [
      { dx: -3, dz: 6, name: '斯特里克兰', body: 0x8a4a2a, hat: 0x5a2a18, opts: { tall: 1.08 },
        lines: ['我必须画画。就像溺水的人必须挣扎。', '我不需要爱情,我没有时间——爱情是种软弱。', '美是艺术家用灵魂的痛苦,从世界的混沌里换来的东西。'] },
      { dx: 8, dz: 6, name: '蒂阿瑞', body: 0xd86a8a, hat: 0xb84a6a, opts: { wide: 1.2, tall: .98 },
        lines: ['那个怪人,一文不名,却把我的旅店住成了传奇。', '爱塔跟了他,伺候他画画,直到他烂了、瞎了、死了。', '他叫人把满屋的画都烧了。天哪,那可是……那可是神迹啊。'] },
      { dx: -18, dz: 16, name: '爱塔', body: 0xa86a4a, hat: 0xc2185b, opts: { tall: .95 },
        lines: ['你是我的男人,我是你的女人——你去哪儿,我去哪儿。', '别劝我下山。佣人跑了,我不走。', '他不说爱。可他画里那棵果树,是照着我家门口那棵画的。'] },
      { dx: 24, dz: 10, name: '库特拉医生', body: 0xe8e2d4, hat: 0x8a8478, opts: { wide: 1.3 },
        lines: ['我这辈子看过无数病人,只在那间木屋里看见过神迹。', '他瞎了一年,还在画。你能想象吗?凭记忆,凭手指。', '烧掉是他的遗嘱。艺术家完成了,剩下的他不在乎。'] },
    ],
    build: (gx, gz) => {
      const hx = gx, hz = gz + 4, hh = height(hx, hz);
      const hut = box(8, 4, 6, lam(0xc8a878)); hut.position.set(hx, hh + 2, hz); scene.add(hut); cirObs.push({ x: hx, z: hz, r: 4.5 });
      const rf = new THREE.Mesh(new THREE.ConeGeometry(6, 2.4, 4), lam(0x7a6a3a)); rf.rotation.y = Math.PI / 4; rf.position.set(hx, hh + 5, hz); scene.add(rf);
      for (const [ox, col] of [[-3.9, 0xe0a020], [0, 0xc23a3a], [3.9, 0x2a7a5a]]) { const mural = box(.15, 3, 5.4, lam(col)); mural.position.set(hx - 4.05, hh + 2, hz); scene.add(mural); const m2 = box(5.4, 3, .15, lam([0xd94080, 0x4a8ac0, 0xe0b040][(ox + 4) % 3 | 0])); m2.position.set(hx, hh + 2, hz + 3.05); scene.add(m2); break; }
      const easel = cyl(.1, .12, 3, M.woodDark); easel.position.set(gx + 10, height(gx + 10, gz - 4) + 1.5, gz - 4); scene.add(easel);
      const canvas = box(.1, 2, 1.6, lam(0xe0d0a0)); canvas.position.set(gx + 10.2, height(gx + 10, gz - 4) + 2.2, gz - 4); scene.add(canvas);
      for (const [tx, tz] of [[-12, 6], [12, 8], [10, -12]]) { const u = gx + tx, v = gz + tz, th = height(u, v); const tr = cyl(.28, .4, 6, M.wood); tr.position.set(u, th + 3, v); scene.add(tr); const fr = new THREE.Mesh(new THREE.SphereGeometry(2.2, 7, 5), lam(0x4a9a4a)); fr.scale.set(1.4, .7, 1.4); fr.position.set(u, th + 6.2, v); scene.add(fr); }
      const ax4 = gx - 20, az4 = gz + 14, ah4 = height(ax4, az4);   // 爱塔的山谷小屋
      const ahut = box(4.4, 2.8, 3.6, lam(0xb08858)); ahut.position.set(ax4, ah4 + 1.4, az4); scene.add(ahut);
      const ahr = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.8, 4), lam(0x6a5a3a)); ahr.rotation.y = .78; ahr.position.set(ax4, ah4 + 3.6, az4); scene.add(ahr);
      for (let i = 0; i < 5; i++) { const stn = new THREE.Mesh(new THREE.SphereGeometry(.3, 6, 5), M.stone); stn.position.set(gx + 22 + (i - 2) * 1.6, height(gx + 22, gz + 12) + .25, gz + 12 + Math.sin(i * 2) * .8); scene.add(stn); }   // 医生山路的石阶
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
      dawpool: { icon: '🥇', color: '#b8962e', title: '金水潭', en: 'Deathwater', hint: '碰到什么,什么变金',
        desc: '潭水清得发亮,潭底躺着一尊纯金的人像——那是个下水的倒霉蛋。凡碰到这水的,都变成金子。卡斯宾和爱德蒙当场为"归谁所有"红了眼,险些拔剑——阿斯兰一现身,两人却想不起刚才吵了什么。这潭的名字,雷佩契普起的:死亡之水。' },
      dawstar: { icon: '⭐', color: '#c8b87a', title: '拉曼杜的石桌', en: "Ramandu's Table", hint: '退休的星辰',
        desc: '白发老人拉曼杜曾是天上的一颗星,如今在世界边缘休养:每天清晨,鸟儿衔来一枚火浆果放进他嘴里,他便一天天变年轻——直到重新升上夜空。"在你们的世界,星星是一团燃烧的气体。""孩子,即使在你们的世界,那也只是星星的材料,不是星星本身。"' },
    },
    spots: [[0, 4, 'dragonisle'], [16, -8, 'worldsend'], [-22, 14, 'dawpool'], [26, 10, 'dawstar']],
    npcs: [
      { dx: -4, dz: 6, name: '卡斯宾王', body: 0x2a6a8a, hat: 0xd9b24a, opts: { tall: 1.05 },
        lines: ['我们向东航行,去寻找父王放逐的七位爵爷。', '只要"黎明踏浪号"还浮着,我们就一直向着日出开。', '雷佩契普,你这只勇敢的老鼠,比许多骑士都更像骑士。'] },
      { dx: 8, dz: 6, name: '雷佩契普', body: 0x8a5a3a, hat: 0xc23a3a, opts: { tall: .5 },
        lines: ['我这一生,只为抵达世界的尽头,阿斯兰的国度。', '当我还在摇篮里,一位女预言者就为我唱了那支歌。', '恐惧?一只有尊严的老鼠,是不认得这个词的。'] },
      { dx: -16, dz: 10, name: '尤斯塔斯', body: 0x8a8a5a, hat: 0x6a6a40, opts: { tall: .8 },
        lines: ['我当过一条龙。说来话长,但……那治好了我。', '阿斯兰的爪子撕龙皮的时候,疼极了——可撕掉的是从前的我。', '日记我还在写,不过再也不写"全船人都对不起我"了。'] },
      { dx: 28, dz: 8, name: '拉曼杜', body: 0xe8e4d8, hat: 0xd8d4c8, opts: { tall: 1.12, cane: true },
        lines: ['我是一颗休养中的星。每天一枚火浆果,我就年轻一岁。', '等我重新年轻如初生,就会再次升上夜空,加入群星之舞。', '要解除石桌上三位沉睡的王,须航行到世界尽头,留下一人不返。'] },
    ],
    build: (gx, gz) => {
      const ship = makeBoat(0x6a2a9a, 1.5); ship.userData = { anchor: [gx + 2, gz + 4] };
      const dragonHead = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3, 6), M.gold); dragonHead.rotation.x = Math.PI / 2; dragonHead.position.set(gx + 12, height(gx + 2, gz + 4) + 4, gz + 4); scene.add(dragonHead);
      const dx2 = gx - 12, dz2 = gz - 8, dh = height(dx2, dz2);
      const dragon = new THREE.Mesh(new THREE.SphereGeometry(2, 10, 8), lam(0x7a3a2a)); dragon.scale.set(1, .8, 2); dragon.position.set(dx2, dh + 1.6, dz2); scene.add(dragon); cirObs.push({ x: dx2, z: dz2, r: 2.6 });
      for (const wg of [-1, 1]) { const wing = new THREE.Mesh(new THREE.ConeGeometry(1.6, 4, 3), lam(0x5a2a1a)); wing.rotation.z = wg * 1.2; wing.position.set(dx2 + wg * 2.6, dh + 2.6, dz2); scene.add(wing); }
      const lily = new THREE.Mesh(new THREE.CircleGeometry(9, 24), new THREE.MeshPhongMaterial({ color: 0xd0eaff, transparent: true, opacity: .7 })); lily.rotation.x = -Math.PI / 2; lily.position.set(gx + 18, height(gx + 18, gz - 8) + .3, gz - 8); scene.add(lily);
      for (let i = 0; i < 8; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(.6, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })); p.rotation.x = -Math.PI / 2; p.position.set(gx + 18 + (rnd() - .5) * 14, height(gx + 18, gz - 8) + .35, gz - 8 + (rnd() - .5) * 14); scene.add(p); }
      const gpX = gx - 22, gpZ = gz + 14, gpH = height(gpX, gpZ);   // 金水潭 + 潭底金人
      const gpool = new THREE.Mesh(new THREE.CircleGeometry(3.4, 20), new THREE.MeshPhongMaterial({ color: 0xd8b83a, transparent: true, opacity: .78, shininess: 100 })); gpool.rotation.x = -Math.PI / 2; gpool.position.set(gpX, gpH + .2, gpZ); scene.add(gpool);
      const gman = new THREE.Mesh(new THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(.3, 1, 4, 8) : new THREE.CylinderGeometry(.3, .3, 1.4, 8), M.gold); gman.rotation.z = 1.4; gman.position.set(gpX + .6, gpH + .32, gpZ - .4); scene.add(gman);
      const stX = gx + 26, stZ = gz + 8, stH = height(stX, stZ);   // 拉曼杜的石桌
      const stT = cyl(2.6, 2.8, .5, M.stone, 14); stT.position.set(stX, stH + 1.1, stZ); scene.add(stT);
      const fberry = new THREE.Mesh(new THREE.SphereGeometry(.2, 7, 6), new THREE.MeshBasicMaterial({ color: 0xff6a3a })); fberry.position.set(stX, stH + 1.55, stZ); scene.add(fberry);
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
      raingramo: { icon: '🎷', color: '#7a5a8a', title: '楼上的留声机', en: 'The Ragtime Records', hint: '彻夜的爵士',
        desc: '汤普森小姐的房间彻夜放着拉格泰姆,楼板底下,戴维森牧师的祷告一声高过一声——两种声音在木板房里对峙,像两种人生观在扳手腕。雨声,是唯一的裁判。' },
      raindoc: { icon: '🩺', color: '#4a6a5a', title: '麦克费尔的诊台', en: "Dr. Macphail's Bench", hint: '理性的旁观者',
        desc: '麦克费尔医生什么都看在眼里:牧师的狂热、太太们的窃语、那姑娘由泼辣到崩溃的每一步。他劝过、拦过、怀疑过,却终究只是旁观。最后在海滩认尸的是他——直到那一刻,他才明白发生了什么,毛姆才让读者也明白。' },
    },
    spots: [[0, 4, 'rainhotel'], [12, -8, 'missionary'], [-16, 14, 'raingramo'], [20, 12, 'raindoc']],
    npcs: [
      { dx: -4, dz: 6, name: '戴维森牧师', body: 0x2a2a34, hat: 0x1a1a22, opts: { tall: 1.08 },
        lines: ['这座岛上遍地是罪。我来,是要把光带给他们。', '那个女人的灵魂,我一定要把它从火里夺回来。', '(他望着汤普森小姐的窗,眼神里有种他自己也不懂的东西……)'] },
      { dx: 7, dz: 5, name: '汤普森小姐', body: 0x9a3a5a, hat: 0x6a2a3a, opts: { tall: .98 },
        lines: ['凭什么?我碍着谁了?这该死的雨,这该死的岛!', '好啊,牧师,你要救我,那就来救啊。', '(结局那句)——男人!你们这些猪猡,全都一个样!'] },
      { dx: 18, dz: 14, name: '麦克费尔医生', body: 0x5a6a72, hat: 0x3e4a52, opts: { wide: 1.15 },
        lines: ['我是医生,不是法官。可这岛上人人都想当法官。', '戴维森太太说那音乐"伤风败俗"。我倒觉得,挺好听。', '这雨下得人发疯。有些疯,朝外;有些疯……朝内。'] },
    ],
    build: (gx, gz) => {
      const hx = gx, hz = gz + 4, hh = height(hx, hz);
      const hotel = box(12, 6, 8, lam(0x8a8478)); hotel.position.set(hx, hh + 3, hz); scene.add(hotel); cirObs.push({ x: hx, z: hz, r: 6.5 });
      const ver = box(14, .3, 3, M.wood); ver.position.set(hx, hh + .3, hz + 5.5); scene.add(ver);
      const rf = box(13, .5, 9, lam(0x4a4a52)); rf.position.set(hx, hh + 6.3, hz); scene.add(rf);
      for (const px of [-5, -1.5, 1.5, 5]) { const post = cyl(.14, .14, 6, M.woodDark); post.position.set(hx + px, hh + 3, hz + 5.5); scene.add(post); }
      for (let i = 0; i < 8; i++) { const pud = new THREE.Mesh(new THREE.CircleGeometry(.8 + rnd(), 10), new THREE.MeshPhongMaterial({ color: 0x5a6a7a, transparent: true, opacity: .6 })); pud.rotation.x = -Math.PI / 2; const u = gx + (rnd() - .5) * 40, v = gz + (rnd() - .5) * 40, ph = height(u, v); if (ph > 2) { pud.position.set(u, ph + .1, v); scene.add(pud); } }
      const g2x = gx - 16, g2z = gz + 14, g2h = height(g2x, g2z);   // 留声机(高脚)
      const g2s = cyl(.14, .18, 1.1, M.woodDark); g2s.position.set(g2x, g2h + .55, g2z); scene.add(g2s);
      const g2b = box(1.1, .8, 1.1, M.wood); g2b.position.set(g2x, g2h + 1.5, g2z); scene.add(g2b);
      const g2horn = new THREE.Mesh(new THREE.ConeGeometry(.7, 1.3, 10, 1, true), M.gold); g2horn.rotation.z = 1; g2horn.position.set(g2x + .7, g2h + 2.4, g2z); scene.add(g2horn);
      const dben = box(2.6, .4, 1, M.woodDark); dben.position.set(gx + 20, height(gx + 20, gz + 12) + .8, gz + 12); scene.add(dben);   // 医生的长凳
      const dumb = new THREE.Mesh(new THREE.ConeGeometry(1.2, .3, 10, 1, true), lam(0x2a3440)); dumb.position.set(gx + 20, height(gx + 20, gz + 12) + 2.6, gz + 12); scene.add(dumb);   // 一把伞
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
      shucave: { icon: '🕳️', color: '#3a4048', title: '崖壁洞穴', en: 'The Cliff Cave', hint: '洞里的"真相"',
        desc: '风暴夜,泰迪攀下崖壁,在洞里遇见一个自称"真瑞秋"的女医生:"这岛在做脑叶实验,没人能以正常人身份离开。"她说的每一件事都严丝合缝——可她是真的存在,还是他需要她存在?这个洞,是全书最深的一层迷宫。' },
      shustorm: { icon: '🌀', color: '#4a5560', title: '风暴墓园', en: 'The Cemetery', hint: '飓风夜的藏身处',
        desc: '飓风撕过海面,泰迪和查克躲进墓园的地窖。墓碑在风里像牙齿一样咬合。就是在这一夜,他"想起"了越来越多的事——记忆这东西,越是抓紧,越像握不住的沙。' },
    },
    spots: [[0, 4, 'shuward'], [-2, -10, 'shulighthouse'], [-22, 14, 'shucave'], [18, 16, 'shustorm']],
    npcs: [
      { dx: -4, dz: 6, name: '泰迪', body: 0x4a5560, hat: 0x2a3038, opts: { tall: 1.05 },
        lines: ['我是联邦执法官,我来调查一名失踪的病人。', '这座岛不对劲……每个人都在对我撒谎。', '要像怪物一样活着,还是像好人一样死去?——我选后者。'] },
      { dx: 8, dz: 6, name: '考利医生', body: 0xd8d2c8, hat: 0xb0a898, opts: { tall: 1.02 },
        lines: ['我们试过所有办法。这场"角色扮演",是最后的希望。', '你构建了一个精巧的故事,好让自己不必面对真相。', '想想吧:这四天,到底是谁,在追查谁?'] },
      { dx: 14, dz: 12, name: '查克', body: 0x6a5a4a, hat: 0x4a3e32, opts: { tall: 1.0 },
        lines: ['头儿,我的枪套总是解不利索——你就没起过疑心?', '放松点。烟?哦对,你的火柴总是划不着。', '(他望着你,眼神忽然很像一位医生)——我们该收工了,对吧?'] },
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
      const cvX = gx - 22, cvZ = gz + 14, cvH = height(cvX, cvZ);   // 崖壁洞穴
      const shcv = new THREE.Mesh(new THREE.SphereGeometry(2.6, 10, 8, 0, 6.283, 0, Math.PI / 2.3), new THREE.MeshLambertMaterial({ color: 0x2e343c, side: THREE.DoubleSide })); shcv.position.set(cvX, cvH, cvZ); scene.add(shcv);
      for (let i = 0; i < 6; i++) { const gr = box(.8, 1.2 + (i % 3) * .3, .18, M.stone); gr.position.set(gx + 15 + (i % 3) * 2.2, height(gx + 15, gz + 16) + .6, gz + 14 + Math.floor(i / 3) * 2.4); gr.rotation.z = (i % 2 ? .06 : -.08); scene.add(gr); }   // 风暴墓园碑群
    },
  },

  /* ================= 岛屿组合第一批:现实地貌 × 文学主题 ================= */
  gala: {
    name: '进化群岛', en: 'The Evolving Isles', icon: '🐢', theme: 'gala',
    desc: '组合岛:加拉帕戈斯的火山生态 × 博物学家的目光',
    ferryMsg: '🐢 进化群岛到了。请轻声——这里的每一只动物,都比你的家谱古老',
    lore: {
      galacrater: { icon: '🌋', color: '#5a4636', title: '熔岩龟原', en: 'The Tortoise Lava Field', hint: '与巨龟同龄的石头',
        desc: '黑色熔岩一直流进海里,凝成了今天的滩。几只巨龟在上面走,每一步要想很久——它们有的比岛上任何一块凉下来的石头都老。守护员说:在这里,"慢",是一种资历。' },
      galastation: { icon: '🔭', color: '#3a6a5a', title: '观察站', en: 'The Observation Post', hint: '一张吊床和一架望远镜',
        desc: '木屋、吊床、一架黄铜望远镜,桌上摊着写了一半的笔记:"它们不怕人。不是因为勇敢,是因为这里从来没有值得怕的东西。"落款没有名字,只画了一只雀。' },
      galafinch: { icon: '🐦', color: '#8a6a3a', title: '十三种喙', en: 'Thirteen Beaks', hint: '同一种雀,十三把钥匙',
        desc: '谷地里落着十三群雀,喙形各不相同:有的粗如钳,有的细如针,有的弯成钩。老博物学家说,它们的祖先是同一群——被十三座岛各自磨了一万年。"造物无需奇迹,时间就是奇迹。"' },
      galaiguana: { icon: '🦎', color: '#3a4a4a', title: '海鬣蜥礁', en: 'The Marine Iguana Reef', hint: '会潜水的蜥蜴',
        desc: '一排黑色的海鬣蜥趴在黑色的礁石上晒太阳,朝海的方向打喷嚏——那是在排盐。全世界只有这里的蜥蜴学会了下海吃海藻。第一个见到它们的人写道:"丑得像黑暗里的小鬼。"它们不在乎。' },
      galalab: { icon: '⚗️', color: '#6a5a6a', title: '废弃的育种棚', en: 'The Abandoned Breeding Shed', hint: '有人想替时间赶路',
        desc: '半塌的棚子,生锈的铁笼,一本发霉的记录册:"第 41 代,仍不稳定。进化太慢了,我来替它赶路。"最后一页只有守护员补的一行字:"他被请离了这座岛。时间不接受代办。"(西北海上,据说有一座岛走得更远……)' },
    },
    spots: [[6, 20, 'galacrater'], [-18, -8, 'galastation'], [22, -14, 'galafinch'], [-26, 18, 'galaiguana'], [30, 8, 'galalab']],
    npcs: [
      { dx: -14, dz: -12, name: '老博物学家', body: 0x5a6a52, hat: 0x3e4a38, opts: { tall: 1.04 },
        lines: ['我随船来了五周,住下来三十年——船先走的。', '别问"这是什么鸟"。问:"它为什么长成这样?"', '物种不是被造好的,是被海风、饥饿和一万年,慢慢商量出来的。'] },
      { dx: 18, dz: 16, name: '生态守护员', body: 0x3a6a5a, hat: 0x2a4a40, opts: { wide: 1.08 },
        lines: ['规矩只有一条:看,别碰。', '巨龟走得慢?它们赶的路,以万年计。', '西北海上有座岛,有人想当上帝。我们只想当读者。'] },
    ],
    build: (gx, gz) => {
      const tort = (tx, tz, s) => { const th = height(tx, tz);   // 巨龟:壳半球+头
        const sh = new THREE.Mesh(new THREE.SphereGeometry(1.6 * s, 10, 8, 0, 6.283, 0, Math.PI / 2), lam(0x4a4636)); sh.position.set(tx, th + .3, tz); sh.scale.y = .62; scene.add(sh);
        const hd = cyl(.28 * s, .34 * s, 1 * s, lam(0x5a5644), 6); hd.rotation.z = 1.2; hd.position.set(tx + 1.5 * s, th + .55, tz); scene.add(hd); cirObs.push({ x: tx, z: tz, r: 1.7 * s }); };
      tort(gx + 4, gz + 22, 1.2); tort(gx + 12, gz + 26, .9); tort(gx - 2, gz + 30, 1);
      for (let i = 0; i < 6; i++) { const ix = gx - 26 + (i % 3) * 3, iz = gz + 16 + Math.floor(i / 3) * 3;   // 海鬣蜥:黑礁上的小黑蜥
        const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4), lam(0x2e3236)); rk.position.set(ix, height(ix, iz) + .5, iz); rk.rotation.set(rnd() * 3, rnd() * 3, 0); scene.add(rk);
        const ig = box(1.1, .25, .3, lam(0x22262a)); ig.position.set(ix, height(ix, iz) + 1.3, iz); ig.rotation.y = rnd() * 6.28; scene.add(ig); }
      const sx = gx - 18, sz = gz - 8, sh2 = height(sx, sz);   // 观察站木屋+望远镜
      const hut = box(6, 3.4, 5, lam(0x6a5a42)); hut.position.set(sx, sh2 + 1.7, sz); scene.add(hut); cirObs.push({ x: sx, z: sz, r: 3.6 });
      const tri = cyl(.1, .14, 2.6, M.woodDark, 5); tri.position.set(sx + 4.4, sh2 + 1.3, sz + 1); scene.add(tri);
      const scope = cyl(.16, .2, 1.6, lam(0xb08d4a), 8); scope.rotation.z = .7; scope.position.set(sx + 4.4, sh2 + 2.8, sz + 1); scene.add(scope);
      const bx2 = gx + 30, bz2 = gz + 8, bh2 = height(bx2, bz2);   // 废棚:塌了半边
      const shed = box(5, 2.6, 4, lam(0x5a525a)); shed.position.set(bx2, bh2 + 1.3, bz2); shed.rotation.z = .1; scene.add(shed);
      const cage = box(1.4, 1.4, 1.4, lam(0x3a3e42)); cage.position.set(bx2 + 3.4, bh2 + .7, bz2 + 1); scene.add(cage);
      for (let i = 0; i < 4; i++) { const cac = cyl(.4, .5, 2.6 + (i % 2), lam(0x4a7a4a), 7); const cx2 = gx - 6 + i * 7, cz3 = gz - 24;   // 仙人掌
        cac.position.set(cx2, height(cx2, cz3) + 1.4, cz3); scene.add(cac); }
      const g = new THREE.PointLight(0xffd08a, 0, 120, 2); g.position.set(sx, sh2 + 4, sz); g.userData.pow = 20; nightLamps.push(g); scene.add(g);
    },
  },
  moai: {
    name: '星历仙岛', en: 'The Star-Calendar Isle', icon: '🗿', theme: 'moai',
    desc: '组合岛:复活节岛的巨像 × 蓬莱仙山的凝望',
    ferryMsg: '🗿 星历仙岛到了。七尊石像已经等了一千年——等的未必是你,但你来了',
    lore: {
      moairow: { icon: '🗿', color: '#6a6a62', title: '七贤台', en: 'The Seven Watchers', hint: '背海而立的巨像',
        desc: '七尊巨石像在石台上一字排开,一律背对大海,面朝岛内——雕它们的人说,祖先要看护的是活人,不是浪。它们的眼窝早空了,可你站在视线里,还是会不自觉地站直一点。' },
      moaiquarry: { icon: '⛏️', color: '#5a5248', title: '半成的巨像', en: 'The Unfinished Giant', hint: '停在一半的凿痕',
        desc: '采石场里躺着一尊没凿完的巨像,脸已成形,背还长在山体里。凿子就扔在旁边,像工匠只是去吃了顿饭。没有人知道那天发生了什么——只知道从那以后,再没有石像站起来。' },
      moaidan: { icon: '⚱️', color: '#8a6a3a', title: '海客的丹炉', en: 'The Alchemist Furnace', hint: '两千年的炉火',
        desc: '一尊三足青铜炉蹲在石台边,炉膛里的灰还是温的。传说有位方士替皇帝出海找不死药,船队到了这里就没再走。药炼没炼成没人知道——但炉边石头上刻着一行小字:"药不在海上。"' },
      moaigaze: { icon: '🌌', color: '#3a4266', title: '凝望之谜', en: 'Who Gazes at Whom', hint: '夜里顺着视线望去',
        desc: '守像人说,七尊石像的头顶各悬一粒星珠,夜里连成天上的勺子。可若顺着他们的视线望去,七道目光交于夜空同一点——那里,什么星都没有。是星历?是航标?还是一句没人听懂的遗言?' },
      moaicrane: { icon: '🦩', color: '#c8ccc8', title: '鹤栖石', en: 'The Crane Rock', hint: '仙山的信使',
        desc: '两只白鹤常年栖在坡顶的青石上,不怕人,也不理人。方士说它们是蓬莱来的信使,守像人说它们只是两只鹤。你看着它们单腿立在暮色里——忽然觉得,两种说法讲的是同一件事。' },
    },
    spots: [[0, 28, 'moairow'], [26, 20, 'moaiquarry'], [-16, 4, 'moaidan'], [8, 38, 'moaigaze'], [-8, -26, 'moaicrane']],
    npcs: [
      { dx: 10, dz: -2, name: '守像人', body: 0x6a5a4a, hat: 0x4a3e32, opts: { wide: 1.1 },
        lines: ['他们不是看你。他们是替看不见的人,看着你。', '每尊像立起来,要一百人拉一年。值不值?你去问立像的人——哦,他们都成灰了。', '夜里来。夜里,他们头顶的星会亮。'] },
      { dx: -14, dz: 10, name: '不肯说名字的方士', body: 0x8a8494, hat: 0x6a6478, opts: { tall: 1.05, cane: true },
        lines: ['两千年前我替皇帝找不死药。船停在这里,就没再走。', '这些石像比我早到几百年——他们也在找,也没找到。', '后来我懂了:蓬莱不可至。凝望,即是抵达。'] },
    ],
    build: (gx, gz) => {
      const ahx = gx, ahz = gz + 34, ah = height(ahx, ahz);   // 七贤台:南岸石台+七尊巨像(背海、面朝岛内)
      const plat = box(30, 1.6, 6, lam(0x5a564e)); plat.position.set(ahx, ah + .8, ahz); scene.add(plat);
      for (let i = 0; i < 7; i++) { const mx = ahx - 12 + i * 4;
        const body2 = box(2.1, 5 + (i % 3) * .4, 1.5, lam(0x6a665e)); body2.position.set(mx, ah + 4.1, ahz); scene.add(body2);
        const head = box(1.6, 2.3, 1.3, lam(0x74706a)); head.position.set(mx, ah + 7.8 + (i % 3) * .4, ahz - .12); head.rotation.x = .06; scene.add(head);
        const nose = box(.34, 1.1, .3, lam(0x7a766e)); nose.position.set(mx, ah + 7.7 + (i % 3) * .4, ahz - .8); scene.add(nose);
        const dip = [[0, 0], [1.2, .5], [2.2, .2], [3.2, .6], [4.4, .4], [5.2, 1.1], [6.4, 1.4]][i];   // 头顶星珠:连成北斗
        const orb = new THREE.Mesh(new THREE.SphereGeometry(.3, 8, 6), new THREE.MeshBasicMaterial({ color: 0xaFd8ff, transparent: true, opacity: .5, fog: false, blending: THREE.AdditiveBlending, depthWrite: false }));
        orb.position.set(mx - 1.2 + dip[0] * .4, ah + 10.6 + dip[1], ahz); scene.add(orb); }
      cirObs.push({ x: ahx, z: ahz, r: 15 });
      const qx = gx + 26, qz = gz + 20, qh = height(qx, qz);   // 采石场:躺倒的半成像
      const lay = box(6.5, 1.6, 2.2, lam(0x625e56)); lay.position.set(qx, qh + .8, qz); lay.rotation.y = .6; lay.rotation.z = .06; scene.add(lay);
      const lhd = box(2, 1.5, 1.8, lam(0x6e6a62)); lhd.position.set(qx + 3.4, qh + .9, qz + 2.2); lhd.rotation.y = .6; scene.add(lhd);
      const dx2 = gx - 16, dz2 = gz + 4, dh2 = height(dx2, dz2);   // 丹炉:三足青铜+炉火
      const cald = cyl(1.3, 1, 1.8, lam(0x6a5a30), 10); cald.position.set(dx2, dh2 + 1.6, dz2); scene.add(cald); cirObs.push({ x: dx2, z: dz2, r: 1.6 });
      for (let i = 0; i < 3; i++) { const leg = cyl(.14, .18, 1.2, lam(0x584a28), 6); const a = i * 2.09; leg.position.set(dx2 + Math.cos(a) * .9, dh2 + .6, dz2 + Math.sin(a) * .9); scene.add(leg); }
      const ember = new THREE.PointLight(0xff8a3a, 0, 60, 2); ember.position.set(dx2, dh2 + 2.2, dz2); ember.userData.pow = 16; nightLamps.push(ember); scene.add(ember);
      const crx = gx - 8, crz = gz - 26, crh = height(crx, crz);   // 鹤栖石:青石+两只白鹤
      const bld = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2), lam(0x5a6a66)); bld.position.set(crx, crh + 1, crz); scene.add(bld); cirObs.push({ x: crx, z: crz, r: 2.2 });
      for (const [ox, oz] of [[-.6, .4], [.9, -.3]]) {
        const cb = new THREE.Mesh(new THREE.SphereGeometry(.42, 8, 6), lam(0xf0eee8)); cb.scale.set(1.25, .9, .8); cb.position.set(crx + ox, crh + 3.4, crz + oz); scene.add(cb);
        const neck = cyl(.06, .07, .9, lam(0xf0eee8), 5); neck.rotation.z = .5; neck.position.set(crx + ox + .45, crh + 3.9, crz + oz); scene.add(neck);
        const leg2 = cyl(.03, .03, 1.2, lam(0x3a3632), 4); leg2.position.set(crx + ox, crh + 2.6, crz + oz); scene.add(leg2); }
    },
  },
  fogjail: {
    name: '雾中牢岛', en: 'The Fog Penitentiary', icon: '🔦', theme: 'fogjail',
    desc: '组合岛:恶魔岛的铁窗 × 禁闭岛的迷雾',
    ferryMsg: '🔦 雾中牢岛到了。灯塔的光扫过来——你是来调查的,还是被调查的?',
    lore: {
      fogcell: { icon: '🛏️', color: '#4a4e56', title: 'D 区 14 号牢房', en: 'Cell 14, Block D', hint: '被子叠得太整齐了',
        desc: '牢门敞着,被子叠成豆腐块,墙上用指甲刻满"正"字——数到第 4383 天停了。枕头底下压着半张纸:"你数过自己的日子吗?数过的话,你和我,谁在里面?"' },
      fogfile: { icon: '🗂️', color: '#5a5244', title: '档案室', en: 'The Records Room', hint: '三份 14 号档案',
        desc: '铁皮柜里翻出三份关于 14 号的卷宗:一份写"越狱成功,下落不明";一份写"游泳溺亡,遗体未获";一份盖着红章——"查无此人"。三份档案的经办签名,笔迹一模一样。' },
      foglight: { icon: '🗼', color: '#8a8478', title: '灯塔', en: 'The Lighthouse', hint: '塔顶只有一面镜子',
        desc: '西海岸最老的灯塔,一晚一晚替海雾数着船。你爬到塔顶,发现灯室里没有灯——只有一面很旧的镜子,对着你。光,是从你身后来的。' },
      fogyard: { icon: '⛓️', color: '#3e4248', title: '放风场', en: 'The Exercise Yard', hint: '规章第一条',
        desc: '空荡荡的水泥场,篮筐锈成了褐色。墙上的规章还认得出第一条:"你有权保持沉默。"底下有人用石子补了一行:"你确定你行使过吗?还是说,沉默的这些年,都算?"' },
      fogescape: { icon: '🛶', color: '#5a4a3a', title: '雨衣筏残片', en: 'The Raincoat Raft', hint: '1962 年 6 月的夜',
        desc: '礁石缝里卡着几块缝在一起的雨衣胶布——有人用五十件雨衣做了一只筏子,趁雾划了出去。官方说他们淹死了。可每年 6 月,监狱长办公室都会收到一张没有署名的明信片。' },
    },
    spots: [[-6, -10, 'fogcell'], [10, 2, 'fogfile'], [24, -20, 'foglight'], [-20, 12, 'fogyard'], [-2, 30, 'fogescape']],
    npcs: [
      { dx: 4, dz: 14, name: '老看守', body: 0x4a505a, hat: 0x32363e, opts: { wide: 1.12 },
        lines: ['监狱早关了,我看守的是"关过人"这件事。', '我数过:进来 14 个,出去 13 个。少的那个……我记不清是谁了。', '雾大的晚上别靠近灯塔。不是危险——是你会想留下。'] },
      { dx: 22, dz: -14, name: '灯塔管理员', body: 0x6a6a62, hat: 0x4e4e46, opts: { tall: 1.03 },
        lines: ['灯我擦了三十年。你问哪盏?……你上去过?', '这岛上每个人都觉得别人才是囚犯。包括我。包括你。', '光扫过去的时候别回头——回头的人,档案里都多了一页。'] },
    ],
    build: (gx, gz) => {
      const mx = gx - 4, mz = gz - 8, mh = height(mx, mz);   // 监狱主楼:混凝土+铁窗
      const main = box(16, 8, 9, lam(0x707068)); main.position.set(mx, mh + 4, mz); scene.add(main); cirObs.push({ x: mx, z: mz, r: 9 });
      const wing = box(8, 6, 7, lam(0x686860)); wing.position.set(mx - 11, mh + 3, mz + 2); scene.add(wing); cirObs.push({ x: mx - 11, z: mz + 2, r: 5 });
      for (let i = 0; i < 6; i++) { const bar = box(.9, 1.3, .12, lam(0x22262c)); bar.position.set(mx - 6.5 + i * 2.6, mh + 5.4, mz + 4.56); scene.add(bar); }
      const lx = gx + 24, lz = gz - 20, lh = height(lx, lz);   // 灯塔:白身红顶
      const lt = cyl(1.4, 2, 12, lam(0xe8e4da), 10); lt.position.set(lx, lh + 6, lz); scene.add(lt); cirObs.push({ x: lx, z: lz, r: 2.2 });
      const cap = cyl(1.7, 1.7, 1.6, lam(0xa03a2e), 10); cap.position.set(lx, lh + 12.8, lz); scene.add(cap);
      const beam = new THREE.PointLight(0xfff2cc, 0, 260, 1.6); beam.position.set(lx, lh + 12.5, lz); beam.userData.pow = 34; nightLamps.push(beam); scene.add(beam);
      const wx = gx - 20, wz = gz + 12, wh = height(wx, wz);   // 放风场:围栏水泥场
      const yard = box(14, .3, 12, lam(0x7a7a72)); yard.position.set(wx, wh + .2, wz); scene.add(yard);
      for (let i = 0; i < 8; i++) { const p = cyl(.08, .08, 2.6, lam(0x3a3e44), 5); p.position.set(wx - 7 + (i % 4) * 4.66, wh + 1.3, wz + (i < 4 ? -6 : 6)); scene.add(p); }
      const tx = gx + 8, tz = gz + 20, th = height(tx, tz);   // 瞭望塔
      for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const lg = cyl(.14, .16, 6, M.woodDark, 5); lg.position.set(tx + ox, th + 3, tz + oz); scene.add(lg); }
      const cab = box(3, 2, 3, lam(0x5a5a52)); cab.position.set(tx, th + 6.8, tz); scene.add(cab); cirObs.push({ x: tx, z: tz, r: 1.8 });
      for (let i = 0; i < 5; i++) { const fog2 = new THREE.Mesh(new THREE.PlaneGeometry(22, 14),   // 低雾片
        new THREE.MeshBasicMaterial({ color: 0xcdd4da, transparent: true, opacity: .1, depthWrite: false, side: THREE.DoubleSide }));
        const fx2 = gx - 30 + rnd() * 60, fz2 = gz - 30 + rnd() * 60;
        fog2.rotation.x = -Math.PI / 2; fog2.position.set(fx2, height(fx2, fz2) + 2.2 + rnd() * 1.5, fz2); scene.add(fog2); }
    },
  },
  kilda: {
    name: '风暴孤岛', en: 'The Last Evacuation', icon: '🌬️', theme: 'kilda',
    desc: '组合岛:圣基尔达的孤绝 × 鲁滨逊的守望',
    ferryMsg: '🌬️ 风暴孤岛到了。两千年的炊烟在 1930 年熄了——只剩风、海鸟,和一个不肯走的人',
    lore: {
      kildastreet: { icon: '🏚️', color: '#5a5a52', title: '主街', en: 'The Street', hint: '十六户人家的一排石屋',
        desc: '全岛唯一的一条街:十六座石屋肩并肩弯成一道弧,一半已经没了屋顶。1930 年 8 月 29 日清晨,最后三十六个人在各家壁炉上放了一把燕麦、一本翻开的圣经,锁上门,上了船。钥匙,都留在了锁眼里。' },
      kildacleit: { icon: '🪨', color: '#6a6458', title: '石仓群', en: 'The Cleitean', hint: '一千四百座石冢',
        desc: '满山坡都是乌龟壳一样的小石屋——储鸟肉、储蛋、储泥炭的"石仓",全岛一千四百多座。没有灰浆,全靠石头咬石头,两千年不倒。风从缝里过,像有人在很轻地吹口哨。' },
      kildacliff: { icon: '🐦', color: '#4a5a6a', title: '千鸟崖', en: 'The Fowler Cliffs', hint: '不列颠最高的海崖',
        desc: '四百米的绝壁直插进浪里,几万只海鸟贴着崖面盘旋,叫声盖过风。岛民曾赤脚缒绳下崖掏蛋捕鸟——男孩的成人礼,是单脚立在崖顶那块探空的"少年石"上。悬崖不原谅失误,所以这里没人失误。' },
      kildamail: { icon: '📮', color: '#8a6a4a', title: '圣基尔达邮件船', en: 'The St Kilda Mailboat', hint: '木盒+浮囊,寄给全世界',
        desc: '岛民的邮政:把信装进掏空的木盒,拴上一只羊皮浮囊,扔进海里,潮流会把它带去苏格兰——十有三四,真能送到。滩头正躺着一只没寄出的:里面是最后一批居民的信。要替他们寄出去吗?' },
      kildahearth: { icon: '🔥', color: '#4a4238', title: '最后的炉灶', en: 'The Last Hearth', hint: '烧了两千年的火',
        desc: '岛上的火种从不熄灭——邻里之间借火续火,一续两千年。撤离那天早上,每家都任炉火自己烧完。这座灶的灰,是全岛最后凉下来的。守望者每天来看一眼,说不是想点燃它,"是想陪陪它"。' },
    },
    spots: [[-4, 2, 'kildastreet'], [16, -14, 'kildacleit'], [4, -30, 'kildacliff'], [-8, 34, 'kildamail'], [8, 4, 'kildahearth']],
    npcs: [
      { dx: -12, dz: 8, name: '不肯走的守望者', body: 0x5a5248, hat: 0x3e3830, opts: { wide: 1.1 },
        lines: ['全岛撤走那天,我躲进了石仓。船开远了我才出来——从此岛是我的,我也是岛的。', '你问我孤独吗?城市里的人才是漂流者,我可是在家。', '海鸟三万,石屋十六,风一种——这份家当,够我守一辈子。'] },
      { dx: 10, dz: -10, name: '海鸟学者', body: 0x4a5a6a, hat: 0x36424e, opts: { tall: 1.02 },
        lines: ['我来数塘鹅,一数数了九年。数清的那天,大概就舍不得走了。', '暴风鹱认得他——守望者一上崖,鸟群就让出一条道。', '人走了,鸟回来了。你说这算失去,还是归还?'] },
    ],
    build: (gx, gz) => {
      for (let i = 0; i < 6; i++) {   // 主街:弧形一排石屋,半数无顶
        const a = -0.5 + i * .2, sx = gx - 6 + Math.cos(a) * 18, sz = gz + 2 + Math.sin(a) * 18, sh2 = height(sx, sz);
        const hs = box(4.6, 2.6, 3.6, lam(0x6a665c)); hs.position.set(sx, sh2 + 1.3, sz); hs.rotation.y = -a; scene.add(hs); cirObs.push({ x: sx, z: sz, r: 2.8 });
        if (i % 2) { const rf = box(5, .3, 4.2, lam(0x4a4640)); rf.rotation.z = .5; rf.rotation.y = -a; rf.position.set(sx, sh2 + 3.1, sz); scene.add(rf); } }
      for (let i = 0; i < 9; i++) {   // 石仓群:满坡小石冢
        const cx2 = gx + 8 + (i % 3) * 7 + rnd() * 3, cz3 = gz - 22 + Math.floor(i / 3) * 7 + rnd() * 3;
        const cl = new THREE.Mesh(new THREE.SphereGeometry(1.3, 8, 6, 0, 6.283, 0, Math.PI / 2), lam(0x5e5a50)); cl.scale.y = .75; cl.position.set(cx2, height(cx2, cz3) + .2, cz3); scene.add(cl); }
      { const pts = []; const cx3 = gx + 4, cz4 = gz - 30, ch4 = height(cx3, cz4);   // 千鸟崖:鸟群点云
        for (let i = 0; i < 90; i++) pts.push(cx3 - 14 + rnd() * 28, ch4 + 6 + rnd() * 14, cz4 - 10 + rnd() * 16);
        const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xf2f2ee, size: .5, transparent: true, opacity: .85 }))); }
      const mbx = gx - 8, mbz = gz + 34, mbh = Math.max(height(mbx, mbz), .1);   // 邮件船:木盒+浮囊
      const mb = box(1.2, .6, .8, lam(0x8a6a42)); mb.position.set(mbx, mbh + .5, mbz); scene.add(mb);
      const blad = new THREE.Mesh(new THREE.SphereGeometry(.45, 8, 6), lam(0xc8b490)); blad.position.set(mbx + 1, mbh + .6, mbz); scene.add(blad);
      const hx2 = gx + 8, hz2 = gz + 4, hh2 = height(hx2, hz2);   // 最后的炉灶:石圈冷灰
      for (let i = 0; i < 7; i++) { const st = new THREE.Mesh(new THREE.DodecahedronGeometry(.4), M.stone); const a = i / 7 * 6.28; st.position.set(hx2 + Math.cos(a) * 1.1, hh2 + .3, hz2 + Math.sin(a) * 1.1); scene.add(st); }
      const wl = new THREE.PointLight(0xffc888, 0, 90, 2); wl.position.set(gx - 12, height(gx - 12, gz + 8) + 3, gz + 8); wl.userData.pow = 18; nightLamps.push(wl); scene.add(wl);   // 守望者的窗灯
    },
  },

  gunkan: {
    name: '废矿海城', en: 'The Concrete Ship', icon: '🏭', theme: 'gunkan',
    desc: '组合岛:军舰岛的混凝土森林 × 海底两万里的深处',
    ferryMsg: '🏭 废矿海城到了。五千人在这六公顷上活过——如今只有海浪替他们关窗',
    lore: {
      gunkwall: { icon: '🌊', color: '#4a545e', title: '防波堤', en: 'The Seawall', hint: '像一艘搁浅的军舰',
        desc: '从海上望,整座岛就是一艘抛锚的灰色军舰——混凝土堤坝围出的轮廓骗过了不止一艘真军舰。堤上挡了百年台风的墙皮剥落处,露出一行小孩的粉笔字:"浪再大,我们楼里见。"' },
      gunkflats: { icon: '🏢', color: '#5a6068', title: '九层公寓', en: 'Building No.30', hint: '钢筋混凝土的祖母',
        desc: '1916 年落成,钢筋混凝土高层的老祖母。巅峰时全岛每公顷五千人,挤过全世界任何地方——走廊晾衣绳还拴在锈栏杆上,某扇窗台摆着一只碗,像随时有人回来吃饭。' },
      gunkschool: { icon: '🏫', color: '#6a7078', title: '天台操场', en: 'The Rooftop School', hint: '看不见一棵树的童年',
        desc: '楼顶围着铁丝网的小操场——全岛没有土,孩子们在混凝土上跑圈长大。留存的毕业作文里,有个孩子写的题目是:《我想踩一次泥土》。老师批语:会的。' },
      gunkshaft: { icon: '⛏️', color: '#3e444c', title: '竖井口', en: 'The Shaft', hint: '海底之下,还有一座城',
        desc: '罐笼井直落海面之下六百米——矿工在海底挖了几十年的煤,巷道网比岛上的楼道还密。老矿工都说,挖到最深处能听见"邻居"的动静:海的另一侧,好像也有谁在凿壁。' },
      gunkkey: { icon: '🔑', color: '#6a5a42', title: '钥匙板', en: 'The Key Board', hint: '1974 年 4 月',
        desc: '关矿的通告贴出后,全岛三个月撤空。传达室的钥匙板上挂满钥匙,每一把都端端正正写着门牌号——没人带走家门钥匙,好像只是集体出了趟远门。' },
    },
    spots: [[-6, 34, 'gunkwall'], [4, -6, 'gunkflats'], [14, 6, 'gunkschool'], [-16, -12, 'gunkshaft'], [22, -18, 'gunkkey']],
    npcs: [
      { dx: -10, dz: 14, name: '回来的老矿工', body: 0x4a4e56, hat: 0x33363c, opts: { wide: 1.12 },
        lines: ['我在这楼里出生,在井下成年。撤岛那年我二十三。', '五十年了,我带着孙子的照片回来——给老邻居们看看。', '井下六百米不黑,心里没底才黑。'] },
      { dx: 16, dz: -22, name: '废墟摄影师', body: 0x5a5a52, hat: 0x3e3e38, opts: { tall: 1.03 },
        lines: ['我拍的不是废墟,是刚刚离开的人。', '你看那窗台的碗、那把伞、那块黑板——他们没走远。', '混凝土会记事,比胶片久。'] },
    ],
    build: (gx, gz) => {
      { const geos = [];   // 端岛 55 栋真实建筑轮廓(© OpenStreetMap contributors)挤出,合并=1 次绘制
        for (const [bh9, bcx, bcz, brr, pts9] of OSM_GUNKAN) {
          const sh9 = new THREE.Shape();
          pts9.forEach(([px9, pz9], i9) => i9 ? sh9.lineTo(px9, -pz9) : sh9.moveTo(px9, -pz9));
          const gg = new THREE.ExtrudeGeometry(sh9, { depth: bh9, bevelEnabled: false });
          gg.rotateX(-Math.PI / 2);
          const base9 = Math.max(height(gx + bcx, gz - 8 + bcz) - .3, .2);
          gg.translate(gx, base9, gz - 8);
          geos.push(gg);
          cirObs.push({ x: gx + bcx, z: gz - 8 + bcz, r: Math.min(brr * .8, 8) });
        }
        scene.add(new THREE.Mesh(mergeGeometries(geos), lam(0x6d7278))); }
      for (let i = 0; i < 5; i++) { const a = -.5 + i * .25;   // 防波堤弧
        const sw = box(12, 2.6, 2.4, lam(0x757b82)); sw.position.set(gx - 4 + Math.cos(a) * 34, height(gx, gz + 34) + 1, gz + 20 + Math.sin(a) * 22); sw.rotation.y = -a; scene.add(sw); }
      const kx = gx - 16, kz = gz - 12, kh = height(kx, kz);   // 矿井架:四腿+天轮
      for (const [ox, oz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) { const lg = box(.3, 11, .3, lam(0x4a3e34)); lg.position.set(kx + ox * (1 - .04), kh + 5.5, kz + oz); lg.rotation.z = ox * .04; scene.add(lg); }
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(1.4, .2, 6, 14), lam(0x3a3e44)); wheel.position.set(kx, kh + 11.6, kz); scene.add(wheel); cirObs.push({ x: kx, z: kz, r: 2.6 });
      const cable = cyl(.05, .05, 10.6, lam(0x22262a), 4); cable.position.set(kx, kh + 6, kz); scene.add(cable);

      for (const [ox, oz] of [[-4, -6], [18, -20]]) { const wl = new THREE.PointLight(0xffe2a8, 0, 70, 2); wl.position.set(gx + ox, height(gx + ox, gz + oz) + 6, gz + oz); wl.userData.pow = 14; nightLamps.push(wl); scene.add(wl); }
    },
  },
  soco: {
    name: '真名植物岛', en: 'The Isle of True Names', icon: '🌳', theme: 'soco',
    desc: '组合岛:索科特拉的异形植物 × 地海的真名法术',
    ferryMsg: '🌳 真名植物岛到了。这里的树长得不像地球——因为它们记得更早的名字',
    lore: {
      socodragon: { icon: '🌳', color: '#8c3a2a', title: '龙血树王', en: 'The Elder Dragon Tree', hint: '千年的伞,龙的血',
        desc: '树冠撑成一把千年的伞,枝杈密得雨落不到根。割开树皮,渗出的树脂红得像血——古代商人拿它当"龙血"卖遍地中海,染过小提琴,也入过药。树不解释,树只是继续红。' },
      socobottle: { icon: '🌸', color: '#b06a7a', title: '瓶子树坡', en: 'The Bottle Trees', hint: '沙漠玫瑰',
        desc: '满坡的树把树干鼓成瓶肚,里面存着整个旱季的水;最旱的时候,反而开出满树粉花。旅人叫它沙漠玫瑰。采香人说:攒够了苦水,才开得起花——这话他是对着树说的,像在说自己。' },
      sococave: { icon: '🪨', color: '#7a7062', title: '风化岩洞', en: 'The Trader Cave', hint: '五种文字的到此一游',
        desc: '海风把石灰岩掏成了洞。洞壁上刻着希腊文、南阿拉伯文、婆罗米文、埃塞俄比亚文和一种没人认得的字——两千年间的水手都在这躲过风,顺手留名。最深处那行没人认得的,刻得最深。' },
      socoincense: { icon: '🕯️', color: '#a8863a', title: '乳香台', en: 'The Frankincense Altar', hint: '两千年的一缕烟',
        desc: '石台上的乳香树脂在炭火上冒烟冒了两千年,买家从罗马排到长安。烟很直,风都绕着走。采香人守着火,说他家干这行八十代:"香是树的话。烧它,是替树把话说完。"' },
      soconame: { icon: '🗿', color: '#4a5a66', title: '真名石', en: 'The Naming Stone', hint: '万物皆有更老的名字',
        desc: '一块青石立在龙血树王的影子里,面上无字。缄默的名师说,万物出生前都领过一个真名——石头听得见,人多半忘了怎么听。把耳朵贴上去,等风穿过树冠的那一刻……' },
    },
    spots: [[0, 4, 'socodragon'], [20, 18, 'socobottle'], [-24, 12, 'sococave'], [16, -16, 'socoincense'], [-6, -8, 'soconame']],
    npcs: [
      { dx: 12, dz: -12, name: '采香人', body: 0x8a6a3a, hat: 0x6a5028, opts: { wide: 1.06 },
        lines: ['我家割乳香割了八十代。树认得我家的刀。', '割三刀,歇一年——跟树讲道理,树才跟你讲收成。', '香是树的话。烧它,是替树把话说完。'] },
      { dx: -12, dz: -4, name: '缄默的名师', body: 0x4a5a6a, hat: 0x36424e, opts: { tall: 1.06, cane: true },
        lines: ['……', '名字不是标签,是绳子——系着你,也系着它。', '知其真名,是为了相守,不是为了驱使。这一课,大多数法师毕不了业。'] },
    ],
    build: (gx, gz) => {
      const dtree = (tx, tz, s) => { const th = height(tx, tz);   // 龙血树:伞形树冠
        const trunk = cyl(.5 * s, .9 * s, 4 * s, lam(0x8a7458), 7); trunk.position.set(tx, th + 2 * s, tz); scene.add(trunk); cirObs.push({ x: tx, z: tz, r: 1 * s });
        const can = new THREE.Mesh(new THREE.SphereGeometry(3.4 * s, 10, 7, 0, 6.283, 0, Math.PI / 2.6), lam(0x3a6e46)); can.scale.y = .5; can.position.set(tx, th + 4 * s, tz); scene.add(can); };
      dtree(gx, gz + 4, 1.7); dtree(gx - 10, gz + 14, 1.1); dtree(gx + 12, gz + 10, 1.2); dtree(gx - 4, gz + 24, 1);
      for (let i = 0; i < 3; i++) { const bx2 = gx + 16 + i * 5, bz2 = gz + 16 + (i % 2) * 5, bh2 = height(bx2, bz2);   // 瓶子树
        const bt = cyl(.5, 1.5, 3.4, lam(0x9a8a72), 8); bt.position.set(bx2, bh2 + 1.7, bz2); scene.add(bt);
        const tuft = new THREE.Mesh(new THREE.SphereGeometry(.8, 7, 5), lam(0xc88a9a)); tuft.position.set(bx2, bh2 + 3.8, bz2); scene.add(tuft); }
      const cvx = gx - 24, cvz = gz + 12, cvh = height(cvx, cvz);   // 风化岩洞
      const cave = new THREE.Mesh(new THREE.SphereGeometry(4.2, 12, 8, 0, 6.283, 0, Math.PI / 2.3), new THREE.MeshLambertMaterial({ color: 0x8a8072, side: THREE.DoubleSide }));
      cave.scale.y = .72; cave.position.set(cvx, cvh, cvz); scene.add(cave);
      const ax2 = gx + 16, az2 = gz - 16, ah2 = height(ax2, az2);   // 乳香台:石台+一缕直烟
      const alt = cyl(1.3, 1.6, 1.2, M.stone, 9); alt.position.set(ax2, ah2 + .6, az2); scene.add(alt);
      const smoke = cyl(.16, .05, 5, new THREE.MeshBasicMaterial({ color: 0xcfd4d8, transparent: true, opacity: .35, depthWrite: false }), 6);
      smoke.position.set(ax2, ah2 + 3.8, az2); scene.add(smoke);
      const ember2 = new THREE.PointLight(0xff9a4a, 0, 50, 2); ember2.position.set(ax2, ah2 + 1.6, az2); ember2.userData.pow = 12; nightLamps.push(ember2); scene.add(ember2);
      const ns = box(1.6, 2.6, .7, lam(0x4a5a66)); ns.position.set(gx - 6, height(gx - 6, gz - 8) + 1.3, gz - 8); ns.rotation.y = .3; scene.add(ns); cirObs.push({ x: gx - 6, z: gz - 8, r: 1.2 });   // 真名石
    },
  },
  skell: {
    name: '静默之岩', en: 'The Silent Rock', icon: '🕯️', theme: 'skell',
    desc: '组合岛:斯凯利格的海上修道院 × 瓦尔登湖的简朴',
    ferryMsg: '🕯️ 静默之岩到了。上山六百级,请把话留在山脚',
    lore: {
      skellsteps: { icon: '🪜', color: '#6a6a62', title: '六百级石阶', en: 'The Six Hundred Steps', hint: '没有栏杆的朝圣路',
        desc: '一千四百年前的修士徒手在岩壁上凿出六百级台阶,没有栏杆,一侧是海。石阶被脚掌磨出了凹——每一级的凹,都是同一个动作重复了一千四百年。上山的人不聊天:喘,就是这条路的祷词。' },
      skellcell: { icon: '🛖', color: '#7a7468', title: '蜂巢石屋', en: 'The Beehive Cells', hint: '干石头咬干石头',
        desc: '六座蜂巢形石屋蹲在崖顶平台上,不用一撮灰浆,全靠石头咬石头,层层收拢成穹顶——雨水一滴渗不进,一站一千四百年。屋里一张石床、一个壁龛。修士的全部家当,比你此刻背包里的还少。' },
      skellgarden: { icon: '🌱', color: '#4a7a4a', title: '巴掌菜园', en: 'The Terrace Garden', hint: '种豆得豆',
        desc: '崖顶背风处一小片梯田,土是一篮一篮从山下背上来的。种豆、萝卜和一点药草——湖畔来客看见豆田眼睛就亮了:"我在瓦尔登也种豆。锄豆的时候,豆也在锄我。"' },
      skellbook: { icon: '📜', color: '#8a7452', title: '写字石桌', en: 'The Scriptorium Stone', hint: '风是最老的读者',
        desc: '一方被磨平的石桌,风口处压着镇石。修士们在这里抄了几个世纪的书——羊皮上一笔一画,窗外浪碎千堆。桌角有两行不同年代的刻字,竟是同一句话:"简单些,再简单些。"' },
      skellbird: { icon: '🐧', color: '#3a4a5a', title: '海鹦崖', en: 'The Puffin Ledges', hint: '穿僧袍的小鸟',
        desc: '崖缝里住满海鹦——白胸黑背橙嘴,像一群穿僧袍的小胖修士。它们不怕人,歪头看你,看完继续叼鱼。湖畔来客记道:"此地飞鸟着装,比波士顿的绅士更得体。"' },
    },
    spots: [[-8, 30, 'skellsteps'], [2, -2, 'skellcell'], [14, 6, 'skellgarden'], [-10, 2, 'skellbook'], [-2, -24, 'skellbird']],
    npcs: [
      { dx: 8, dz: -8, name: '缄默修士', body: 0x5a5248, hat: 0x3e382e, opts: { wide: 1.02 },
        lines: ['(他向你点头,指了指海,又指了指天。)', '(他在石板上写:话省下来,就成了别的东西。)', '(他递给你一杯接的雨水。很甜。)'] },
      { dx: -12, dz: 14, name: '湖畔来客', body: 0x4a6a52, hat: 0x35503c, opts: { tall: 1.04 },
        lines: ['我的湖结冰了,我来看看海。', '大多数人过着平静的绝望生活——这岛上的人不是。他们过的是平静的平静生活。', '我到林中去,是因为我希望谨慎地生活。他们到岩上来,大概也是。'] },
    ],
    build: (gx, gz) => {
      const cellAt = (cx2, cz2, s) => { const chh = height(cx2, cz2);   // 蜂巢石屋:叠涩穹顶
        const dome = new THREE.Mesh(new THREE.SphereGeometry(1.9 * s, 10, 8, 0, 6.283, 0, Math.PI / 2.1), lam(0x736d60)); dome.scale.y = 1.15; dome.position.set(cx2, chh + .2, cz2); scene.add(dome); cirObs.push({ x: cx2, z: cz2, r: 1.9 * s });
        const door = box(.8 * s, 1.1 * s, .3, lam(0x2a2620)); door.position.set(cx2, chh + .7, cz2 + 1.8 * s); scene.add(door); };
      cellAt(gx + 2, gz - 2, 1.1); cellAt(gx + 7, gz - 6, 1); cellAt(gx - 3, gz - 8, .95); cellAt(gx + 3, gz - 12, 1); cellAt(gx - 6, gz - 14, .9); cellAt(gx + 9, gz - 14, .85);
      for (let i = 0; i < 12; i++) { const t = i / 12;   // 六百级石阶(示意 12 级,沿南坡蜿蜒)
        const stx = gx - 8 + Math.sin(t * 2.4) * 6, stz = gz + 34 - t * 30;
        const st = box(2.4, .5, 1.4, M.stone); st.position.set(stx, height(stx, stz) + .3, stz); st.rotation.y = Math.cos(t * 2.4) * .4; scene.add(st); }
      const gx2 = gx + 14, gz2 = gz + 6, gh2 = height(gx2, gz2);   // 巴掌菜园:梯田+豆架
      const bed = box(6, .4, 4, lam(0x4a6a3a)); bed.position.set(gx2, gh2 + .25, gz2); scene.add(bed);
      for (let i = 0; i < 4; i++) { const pole = cyl(.05, .05, 1.8, M.woodDark, 4); pole.position.set(gx2 - 2 + i * 1.4, gh2 + 1.2, gz2); scene.add(pole); }
      const tbl = box(2.2, .3, 1.4, M.stone); tbl.position.set(gx - 10, height(gx - 10, gz + 2) + 1, gz + 2); scene.add(tbl);   // 写字石桌
      const legT = box(.5, 1, .5, M.stone); legT.position.set(gx - 10, height(gx - 10, gz + 2) + .5, gz + 2); scene.add(legT);
      { const pts = []; const bx3 = gx - 2, bz3 = gz - 26, bh3 = height(bx3, bz3);   // 海鹦崖:鸟点云
        for (let i = 0; i < 60; i++) pts.push(bx3 - 12 + rnd() * 24, bh3 + 2 + rnd() * 10, bz3 - 8 + rnd() * 12);
        const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xf0eee6, size: .45, transparent: true, opacity: .9 }))); }
      const cross = box(.3, 2.2, .3, M.stone), arm = box(1.3, .3, .3, M.stone);   // 山顶石十字
      const chx = gx, chz = gz - 4, chh2 = height(chx, chz);
      cross.position.set(chx, chh2 + 3.4, chz - 3); arm.position.set(chx, chh2 + 3.9, chz - 3); scene.add(cross); scene.add(arm);
      const cl = new THREE.PointLight(0xffe8c0, 0, 60, 2); cl.position.set(gx + 2, height(gx + 2, gz - 2) + 3, gz - 2); cl.userData.pow = 12; nightLamps.push(cl); scene.add(cl);   // 石屋烛光
    },
  },

  mada: {
    name: '方舟大陆岛', en: 'The Ark Continent', icon: '🐒', theme: 'mada',
    desc: '组合岛:马达加斯加的第八大陆 × 提前出发的方舟',
    ferryMsg: '🐒 方舟大陆岛到了。这艘船八千万年前就解缆了——乘客们至今没换船',
    lore: {
      madaark: { icon: '📜', color: '#6a5a3a', title: '搁浅的龙骨', en: 'The Ark Keel', hint: '一艘提前出发的方舟',
        desc: '滩头半埋着一排巨大的木肋,像哪艘老船的龙骨——守林人说是波浪堆的,老树医说是方舟的。八千万年前这块大陆从冈瓦纳解缆,像一艘提前出发的方舟:船上的乘客从此走了另一条路,狐猴代替了猴子,猴面包树代替了森林。' },
      madabaobab: { icon: '🌳', color: '#a8763a', title: '猴面包树大道', en: 'The Avenue of Baobabs', hint: '倒栽的巨树',
        desc: '两排两千岁的巨树夹出一条土路,树干粗得像谷仓,顶上一小撮枝叶——传说神嫌它太骄傲,把它头朝下重栽了一遍。黄昏时整条大道燃成金红,连赶路的人都会停下来,把影子借给它。' },
      madalemur: { icon: '🐒', color: '#8a8a92', title: '环尾谷', en: 'The Ring-tail Valley', hint: '世界上最幸运的木筏',
        desc: '几十只环尾狐猴在谷地列队晒太阳,肚皮朝天,像一排做早操的小老头。它们的祖先当年抱着浮木漂过海峡——科学家管那叫"木筏假说",老树医管那叫"它们也有它们的方舟"。' },
      madadance: { icon: '💃', color: '#c8c4ba', title: '跳舞的西法卡', en: 'The Dancing Sifaka', hint: '横着走的白衣舞者',
        desc: '白毛西法卡狐猴过空地从不爬行——双脚横跳,双臂高举,像一排赶去上课的芭蕾学生。守林人说它们不是在跳舞,是树太少了不得不下地;可它们跳得那么高兴,你宁愿相信是在跳舞。' },
      madanight: { icon: '🌙', color: '#4a4a5a', title: '指猴之夜', en: 'The Aye-aye Hour', hint: '被误解的手指',
        desc: '夜里出没的指猴长着一根细长的中指,敲树听虫,像给树把脉。旧俗说见者不祥,曾经见一只杀一只——保护站的牌子只写了一行:"它那根手指,是用来敲树的,不是用来指你的。"' },
    },
    spots: [[-10, 38, 'madaark'], [4, 2, 'madabaobab'], [-24, -10, 'madalemur'], [22, -16, 'madadance'], [18, 20, 'madanight']],
    npcs: [
      { dx: -8, dz: 18, name: '守林向导', body: 0x6a5a3a, hat: 0x4c3f28, opts: { wide: 1.06 },
        lines: ['这里的规矩叫"法迪"——有的树不能指,有的谷不能唱歌。别问为什么,树比我们老。', '全世界的狐猴都在这一艘"船"上。船票,是不打扰。', '你脚下这条路,黄昏时值得再走一遍。'] },
      { dx: 14, dz: -8, name: '老树医', body: 0x4a6a4a, hat: 0x35503a, opts: { tall: 1.05, cane: true },
        lines: ['我给那棵猴面包树看了四十年病。它两千岁,我算它的晚辈。', '它们把整个雨季存在肚子里——你们管这叫囤积,树管这叫记性好。', '方舟没有沉,年轻人。它只是还在航行。'] },
    ],
    build: (gx, gz) => {
      for (let i = 0; i < 6; i++) {   // 猴面包树大道:两排巨树
        const bx2 = gx - 10 + (i % 3) * 14, bz2 = gz - 4 + (i < 3 ? -7 : 7), bh2 = height(bx2, bz2);
        const trunk = cyl(1.2, 2, 9, lam(0xa8825a), 9); trunk.position.set(bx2, bh2 + 4.5, bz2); scene.add(trunk); cirObs.push({ x: bx2, z: bz2, r: 2.2 });
        for (let k = 0; k < 4; k++) { const br = cyl(.14, .2, 2.2, lam(0x8a6a48), 5); const a = k * 1.57 + i;
          br.position.set(bx2 + Math.cos(a) * 1.1, bh2 + 9.6, bz2 + Math.sin(a) * 1.1); br.rotation.z = Math.cos(a) * .9; br.rotation.x = Math.sin(a) * .9; scene.add(br); }
        const tuft = new THREE.Mesh(new THREE.SphereGeometry(1.7, 8, 6), lam(0x5a7a3a)); tuft.scale.y = .5; tuft.position.set(bx2, bh2 + 10.2, bz2); scene.add(tuft); }
      const lemur = (lx, lz, up) => { const lh2 = height(lx, lz);   // 环尾狐猴:灰身黑白环尾
        const bd = new THREE.Mesh(new THREE.SphereGeometry(.34, 8, 6), lam(0x9a9aa2)); bd.position.set(lx, lh2 + .5, lz); scene.add(bd);
        const hd = new THREE.Mesh(new THREE.SphereGeometry(.2, 7, 5), lam(0xd8d8dc)); hd.position.set(lx, lh2 + .88, lz + .12); scene.add(hd);
        const tl = cyl(.06, .08, 1.1, lam(0x2e2e34), 5); tl.rotation.x = up ? -.5 : .9; tl.position.set(lx, lh2 + .8, lz - .35); scene.add(tl); };
      for (let i = 0; i < 7; i++) lemur(gx - 26 + (i % 4) * 2.2, gz - 12 + Math.floor(i / 4) * 2.4, i % 2);
      for (let i = 0; i < 3; i++) { const sx3 = gx + 20 + i * 2.6, sz3 = gz - 16, sh4 = height(sx3, sz3);   // 西法卡:白衣横跳
        const sb2 = new THREE.Mesh(new THREE.SphereGeometry(.4, 8, 6), lam(0xe8e6de)); sb2.scale.y = 1.4; sb2.position.set(sx3, sh4 + 1 + (i % 2) * .5, sz3); scene.add(sb2);
        const arm2 = cyl(.05, .05, .9, lam(0xe8e6de), 4); arm2.rotation.z = 2.6; arm2.position.set(sx3 + .3, sh4 + 1.6 + (i % 2) * .5, sz3); scene.add(arm2); }
      for (let i = 0; i < 5; i++) { const rib = box(.5, 4 + (i % 2), .6, lam(0x6a5236));   // 搁浅的龙骨
        rib.position.set(gx - 16 + i * 3, height(gx - 16 + i * 3, gz + 38) + 1.4, gz + 38); rib.rotation.z = .5 - (i % 3) * .18; scene.add(rib); }
      const st = box(5, 3, 4, lam(0x5a6a4a)); st.position.set(gx + 17, height(gx + 17, gz + 20) + 1.5, gz + 20); scene.add(st); cirObs.push({ x: gx + 17, z: gz + 20, r: 3 });   // 保护站
      const g2 = new THREE.PointLight(0xffd89a, 0, 90, 2); g2.position.set(gx + 17, height(gx + 17, gz + 20) + 4, gz + 20); g2.userData.pow = 16; nightLamps.push(g2); scene.add(g2);
    },
  },
  helena: {
    name: '风中庄园', en: 'The Windward Estate', icon: '👑', theme: 'helena',
    desc: '组合岛:圣赫勒拿的流放岁月 × 李尔王的荒野',
    ferryMsg: '👑 风中庄园到了。退了位的王都会来这里坐坐——有的带着地图,有的只带着风',
    lore: {
      helwood: { icon: '🏠', color: '#5a6a5a', title: '长木庄园', en: 'Longwood House', hint: '风从不敲门',
        desc: '一栋孤零零的长条平房,绿窗板被海风拍得褪了色。风从不敲门就进来,掀他的地图,吹他的蜡烛。他曾指挥过六十万人,如今指挥不动一扇窗——庄园里的钟停在某个清晨五点四十九分,再没人舍得拨动。' },
      helgarden: { icon: '🥀', color: '#7a6a4a', title: '皇帝的菜园', en: "The Emperor's Garden", hint: '人生最后一场战役',
        desc: '他人生最后的战役,是和海风抢一畦豌豆:挖沟、筑墙、引水,清晨五点亲自浇园。卫兵在日志里写:"他指挥花草,像指挥军团。"这一仗他打赢了——豌豆熟了两季,他没能等到第三季。' },
      helwalk: { icon: '👣', color: '#6a6a62', title: '散步的路', en: 'The Daily Walk', hint: '每天同一条路',
        desc: '一条被踩得发白的小路,通向能望海的转角。他每天走到那儿站定,望很久——望的是海,还是海那头?哨兵的日志写了几百遍同一句:"下午四时,他又在看海。"最后一页补了半句:"今天没有。"' },
      hellear: { icon: '👑', color: '#4a4252', title: '荒野王座', en: 'The Heath Throne', hint: '退位者的尺度',
        desc: '山脊上立着一把风化的木椅,面朝大西洋,不知是谁搬上来的。弄人说,退了位的王都会来坐坐:有位带着丢掉的国土的地图,有位只带着三个女儿的名字。风雨大的夜里,椅子上像总坐着人——在跟风对喊。' },
      helstar: { icon: '🔭', color: '#3a4266', title: '观星台', en: 'The Star Terrace', hint: '星星不认得皇冠',
        desc: '流放者夜里在这认星。他说军校学过的星图,到了南半球全不作数——得从头学,像重新做人。日记里有一句:"星星不认得皇冠。这是它们最大的美德,也是我最大的安慰。"' },
    },
    spots: [[0, 0, 'helwood'], [12, 12, 'helgarden'], [-18, 22, 'helwalk'], [-6, -22, 'hellear'], [16, -14, 'helstar']],
    npcs: [
      { dx: 8, dz: 4, name: '守庄园的老仆', body: 0x5a5a62, hat: 0x42424a, opts: { wide: 1.04 },
        lines: ['钟停在他走的那一刻。我每天还是擦两遍。', '他最后的日子总说同一句:"下辈子,做个种地的。"', '床、地图、望远镜,都按原样摆着——他随时可能回来查岗。'] },
      { dx: -10, dz: -16, name: '弄人', body: 0x8a4a5a, hat: 0xa8862a, opts: { tall: .82 },
        lines: ['我给两位国王当过差:一位丢了国土,一位丢了整块大陆。', '笑话讲给谁听都一样苦——所以我讲给风听,风笑得最响。', '孩子,王冠这东西,戴上去要两个人,摘下来只要一阵风。'] },
    ],
    build: (gx, gz) => {
      const wh2 = height(gx, gz);   // 长木庄园:长条平房+绿窗板
      const house = box(16, 4, 7, lam(0xcac2b0)); house.position.set(gx, wh2 + 2, gz); scene.add(house); cirObs.push({ x: gx, z: gz, r: 9 });
      const roof2 = box(17, 1, 8, lam(0x4a4a44)); roof2.position.set(gx, wh2 + 4.5, gz); scene.add(roof2);
      for (let i = 0; i < 5; i++) { const sh5 = box(1, 1.4, .15, lam(0x3a5e42)); sh5.position.set(gx - 6 + i * 3, wh2 + 2.2, gz + 3.6); scene.add(sh5); }
      const gx3 = gx + 12, gz3 = gz + 12, gh3 = height(gx3, gz3);   // 菜园:畦垄+矮墙
      for (let i = 0; i < 3; i++) { const bed = box(5, .4, 1.6, lam(0x4a6a38)); bed.position.set(gx3, gh3 + .25, gz3 - 2.4 + i * 2.4); scene.add(bed); }
      for (const [ox, oz, w2] of [[-3, 0, .5], [3, 0, .5]]) { const wall = box(w2, 1, 7, M.stone); wall.position.set(gx3 + ox, gh3 + .5, gz3); scene.add(wall); }
      const chx = gx - 6, chz = gz - 22, chh = height(chx, chz);   // 荒野王座:山脊孤椅
      const seat = box(1.2, .18, 1, M.woodDark); seat.position.set(chx, chh + .8, chz); scene.add(seat);
      const back = box(1.2, 1.3, .16, M.woodDark); back.position.set(chx, chh + 1.5, chz - .45); scene.add(back);
      for (const [ox, oz] of [[-.5, -.35], [.5, -.35], [-.5, .35], [.5, .35]]) { const lg2 = box(.14, .8, .14, M.woodDark); lg2.position.set(chx + ox, chh + .4, chz + oz); scene.add(lg2); }
      const tx2 = gx + 16, tz2 = gz - 14, th2 = height(tx2, tz2);   // 观星台:石台+铜管
      const ped2 = cyl(.9, 1.1, 1.2, M.stone, 8); ped2.position.set(tx2, th2 + .6, tz2); scene.add(ped2);
      const tube2 = cyl(.14, .18, 1.7, lam(0xb08d4a), 8); tube2.rotation.z = .8; tube2.position.set(tx2, th2 + 1.7, tz2); scene.add(tube2);
      const path = box(1.6, .12, 26, lam(0xc0b8a4)); path.position.set(gx - 14, height(gx - 14, gz + 12) + .1, gz + 12); path.rotation.y = .5; scene.add(path);   // 散步的路
      const wl2 = new THREE.PointLight(0xffe2b0, 0, 80, 2); wl2.position.set(gx, wh2 + 5.5, gz); wl2.userData.pow = 16; nightLamps.push(wl2); scene.add(wl2);
    },
  },
  komodo: {
    name: '龙蜥荒原', en: 'The Dragon Heath', icon: '🐉', theme: 'komodo',
    desc: '组合岛:科莫多的巨蜥草原 × 贝奥武甫的屠龙诗',
    ferryMsg: '🐉 龙蜥荒原到了。放心,龙一天要晒足八小时太阳,现在多半没空理你',
    lore: {
      komdragon: { icon: '🐉', color: '#6a6a3a', title: '巨蜥王', en: 'The Dragon King', hint: '现实里的最后一条龙',
        desc: '三米长的"龙"趴在草坡上晒太阳,分叉的舌头一吐一收,尝着空气里的消息。屠龙诗里它守着黄金喷着火;现实里它守着体温——一天晒不足八小时,连走路的力气都没有。传说与真相之间,隔着一个太阳。' },
      komsaga: { icon: '🪨', color: '#5a5a66', title: '贝奥武甫石', en: 'The Beowulf Stone', hint: '龙没读过它的差评',
        desc: '一块北方来的符文石,刻着老英雄屠龙的最后一战:他杀死了龙,自己也死于龙毒。不知谁把它千里迢迢立在这,像要提醒龙"你们的名声很坏"。龙没读过。龙翻了个身,继续晒。' },
      komsavanna: { icon: '🌾', color: '#a8923a', title: '干金草原', en: 'The Golden Savanna', hint: '干渴的金色',
        desc: '旱季把整面山坡烤成金黄,鹿群在枯草间竖着耳朵吃草——它们知道草丛里趴着什么,但草总要吃。守林员说这里的规则简单得残酷:跑得快的活到雨季,晒得够的活过今天。' },
      komstation: { icon: '🏕️', color: '#4a6a5a', title: '护林站', en: 'The Ranger Post', hint: '我们不救公主,我们救龙',
        desc: '木屋门口钉着块手写牌:"本站不提供屠龙服务。"护林员每天巡山数龙,给每条都起了名字——最老的那条叫"爷爷",三米一,四十斤重的鹿一口吞一半。牌子背面还有一行小字:"它们比诗老,让它们比诗活得久。"' },
      komreef: { icon: '🏖️', color: '#c88a9a', title: '粉沙湾', en: 'The Pink Beach', hint: '龙的后花园',
        desc: '红珊瑚磨成的粉沙,把整个海湾染成淡淡的胭脂色——凶名在外的荒原背后,藏着全星球最温柔的一片滩。偶尔有巨蜥慢吞吞横穿沙滩去游泳:是的,龙会游泳,而且姿势意外地优雅。' },
    },
    spots: [[2, 6, 'komdragon'], [-18, -8, 'komsaga'], [16, -18, 'komsavanna'], [-8, 22, 'komstation'], [10, 34, 'komreef']],
    npcs: [
      { dx: -12, dz: 26, name: '老护林员', body: 0x4a6a5a, hat: 0x35503f, opts: { wide: 1.1 },
        lines: ['贝奥武甫要是生在今天,会失业的。', '数龙三十年:六条在晒,四条在睡,一条走两步又躺下了——一切正常。', '游客总问龙危不危险。危险。所以看,别摸;敬,别拜。'] },
      { dx: 14, dz: 10, name: '来写诗的人', body: 0x6a5a6a, hat: 0x4e424e, opts: { tall: 1.02 },
        lines: ['我来写一首屠龙诗。写到第三天,改成了一首晒太阳诗。', '史诗里漏了一句:龙的一生,大部分时候只是想暖和一点。', '英雄需要怪物,怪物不需要英雄——你看它睡得多好。'] },
    ],
    build: (gx, gz) => {
      const drag = (dx2, dz2, s, a) => { const dh3 = height(dx2, dz2);   // 巨蜥:低伏长身+尾+头
        const bd2 = box(2.6 * s, .55 * s, .9 * s, lam(0x6a6444)); bd2.position.set(dx2, dh3 + .35, dz2); bd2.rotation.y = a; scene.add(bd2);
        const tl2 = new THREE.Mesh(new THREE.ConeGeometry(.3 * s, 2.4 * s, 6), lam(0x605a3e)); tl2.rotation.z = Math.PI / 2; tl2.rotation.y = a; tl2.position.set(dx2 - Math.cos(a) * 2.4 * s, dh3 + .3, dz2 + Math.sin(a) * 2.4 * s); scene.add(tl2);
        const hd2 = box(.8 * s, .4 * s, .5 * s, lam(0x74704e)); hd2.position.set(dx2 + Math.cos(a) * 1.6 * s, dh3 + .38, dz2 - Math.sin(a) * 1.6 * s); hd2.rotation.y = a; scene.add(hd2);
        for (const sgn of [-1, 1]) for (const fx of [-.8, .8]) { const leg3 = box(.18 * s, .4 * s, .18 * s, lam(0x605a3e)); leg3.position.set(dx2 + Math.cos(a) * fx * s - Math.sin(a) * sgn * .55 * s, dh3 + .18, dz2 + Math.sin(a) * fx * s + Math.cos(a) * sgn * .55 * s); scene.add(leg3); }
        cirObs.push({ x: dx2, z: dz2, r: 1.6 * s }); };
      drag(gx + 2, gz + 8, 1.3, .4); drag(gx + 10, gz + 2, 1, 2.2); drag(gx - 6, gz + 14, .9, 1.1); drag(gx + 18, gz - 20, 1.1, 3.5); drag(gx + 6, gz + 36, .8, 5.2);
      const rs = box(1.4, 3.2, .7, lam(0x5a5a66)); rs.position.set(gx - 18, height(gx - 18, gz - 8) + 1.6, gz - 8); rs.rotation.y = .4; scene.add(rs); cirObs.push({ x: gx - 18, z: gz - 8, r: 1.2 });   // 符文石
      for (let i = 0; i < 4; i++) { const rn = box(.5, .1, .06, lam(0x8a8a96)); rn.position.set(gx - 18 + Math.sin(i) * .3, height(gx - 18, gz - 8) + 1 + i * .6, gz - 7.6); rn.rotation.y = .4; rn.rotation.z = (i % 2) * .5; scene.add(rn); }
      for (let i = 0; i < 6; i++) { const dt = cyl(.12, .18, 3 + (i % 3), lam(0x8a7a5a), 5);   // 旱季枯树
        const tx3 = gx + 10 + (i % 3) * 8, tz3 = gz - 14 - Math.floor(i / 3) * 8; dt.position.set(tx3, height(tx3, tz3) + 1.6, tz3); dt.rotation.z = (i % 2 ? .16 : -.12); scene.add(dt);
        const db = cyl(.05, .07, 1.6, lam(0x7a6a4c), 4); db.rotation.z = 1.1; db.position.set(tx3 + .6, height(tx3, tz3) + 2.8, tz3); scene.add(db); }
      const hut2 = box(5, 3, 4, lam(0x4a6a5a)); hut2.position.set(gx - 8, height(gx - 8, gz + 22) + 1.5, gz + 22); scene.add(hut2); cirObs.push({ x: gx - 8, z: gz + 22, r: 3 });   // 护林站
      const sign2 = box(1.6, 1, .1, lam(0xd8d0b8)); sign2.position.set(gx - 5, height(gx - 5, gz + 24) + 1.2, gz + 24); scene.add(sign2);
      for (let i = 0; i < 8; i++) { const pk = new THREE.Mesh(new THREE.CircleGeometry(1.6 + rnd() * 1.4, 9), new THREE.MeshLambertMaterial({ color: 0xe8c0c8 }));   // 粉沙湾
        const px2 = gx + 6 + rnd() * 14, pz2 = gz + 30 + rnd() * 10; pk.rotation.x = -Math.PI / 2; pk.position.set(px2, Math.max(height(px2, pz2), .1) + .06, pz2); scene.add(pk); }
      const g3 = new THREE.PointLight(0xffd8a0, 0, 70, 2); g3.position.set(gx - 8, height(gx - 8, gz + 22) + 4, gz + 22); g3.userData.pow = 14; nightLamps.push(g3); scene.add(g3);
    },
  },

  sanxian: {
    name: '三仙岛', en: 'The Three Immortal Isles', icon: '🏮', theme: 'sanxian',
    desc: '组合岛:蓬莱三山的传说 × 永远只能接近的蜃楼',
    ferryMsg: '🏮 三仙岛到了——确切说,是瀛洲。蓬莱和方丈在海上,看得见,追不上',
    lore: {
      sxying: { icon: '⛰️', color: '#6a8a8a', title: '瀛洲', en: 'Yingzhou', hint: '留给人的那座仙山',
        desc: '海上三仙山:蓬莱、方丈、瀛洲。你脚下这座是瀛洲——最小、最矮、最不出名的那个。守台老道说,仙人大约都去了另外两座;所以这一座,留给了人。人间烟火气,也算一种仙。' },
      sxwangtai: { icon: '🕯️', color: '#8a6a4a', title: '望仙台', en: 'The Gazing Terrace', hint: '两千年的名单',
        desc: '石台朝海,一炉香终年不断。栏杆上刻满历代求仙者的名字:始皇帝来过,汉武帝来过,更多的是没名字的渔夫和书生。最新的一个名字是用指甲刻的,只刻了一半——大概是船到了,人急着上船。' },
      sxlou: { icon: '🌫️', color: '#8fb8d8', title: '蜃楼', en: 'The Mirage', hint: '近之则隐',
        desc: '天气好的时候,海上看得见另外两座仙山:楼台historic重叠,仙鹤往来,近了——就没了。驾舟去追,它退;停桨,它也停。老道说这不是幻觉,是规矩:仙山对人只开放"望"这一种抵达。' },
      sxdan: { icon: '⚱️', color: '#7a5a3a', title: '断药炉', en: 'The Cold Furnace', hint: '三千炉之后',
        desc: '半山一尊裂了口的大药炉,据说炼了三千炉不死药,每一炉都差最后一味——"不老"本身。炉底的灰里埋着一张字条,像是最后那位炼丹人留的方子:少思,少欲,多看海。落款:药成。' },
      sxhe: { icon: '🦩', color: '#c8ccc8', title: '鹤信', en: 'The Crane Post', hint: '仙人的回信',
        desc: '两只白鹤栖在望仙台的檐角,腿上绑着小小的信筒——都是空的。老道解释:凡人的心愿由鹤带去仙山,仙人的回信从不写字。"空着回来,就是回答。你再琢磨琢磨。"' },      sxhe: { icon: '🦩', color: '#c8ccc8', title: '鹤信', en: 'The Crane Post', hint: '仙人的回信',
        desc: '两只白鹤栖在望仙台的檐角,腿上绑着小小的信筒——都是空的。老道解释:凡人的心愿由鹤带去仙山,仙人的回信从不写字。"空着回来,就是回答。你再琢磨琢磨。"' },
      sxfleet: { icon: '⛵', color: '#8fa8c0', title: '海市船队', en: 'The Mirage Fleet', hint: '两千年没靠岸的帆影',
        desc: '起雾的清晨,东北海面会驶来一支船队:楼船高耸,帆影如林,绕着一片空海缓缓兜圈——正是两千年前奉旨出海求药的那支船队。他们一直没有回来,也一直没有走远。老道说,他们找到了比不死药更好的东西:永远在路上。追之则散,如蜃楼。' },
    },
    spots: [[0, 4, 'sxying'], [-8, 30, 'sxwangtai'], [-14, 36, 'sxlou'], [14, -12, 'sxdan'], [-2, 26, 'sxhe'], [30, -22, 'sxfleet']],
    npcs: [
      { dx: -4, dz: 22, name: '守台老道', body: 0x6a7a8a, hat: 0x4a5a6a, opts: { tall: 1.04, cane: true },
        lines: ['蓬莱方丈,望得见,追不上——追上的那座,都改叫瀛洲了。', '香火我看了六十年:求长生的少了,求平安的多了。这是进步。', '仙山不度人。海度。'],
        topics: [{ q: '蓬莱真的存在吗?', a: '你问错了。该问:凝望存在吗?两千年里每一双望向海平线的眼睛,都是它存在的证据。石头会碎,凝望不会。' }] },
      { dx: 10, dz: -8, name: '刻名的旅人', body: 0x8a7a5a, hat: 0x6a5c42,
        lines: ['我爷爷的名字在栏杆东数第三根,我爸的在第七根。我来补我的。', '我们家三代都没等到仙山靠岸——但三代都看过它。值了。', '你也刻一个?刻浅点,给后来的人留地方。'] },
    ],
    build: (gx, gz) => {
      const tx = gx - 8, tz = gz + 30, th = height(tx, tz);   // 望仙台:石台+香炉+刻名栏杆
      const plat = box(12, 1.4, 8, M.stone); plat.position.set(tx, th + .7, tz); scene.add(plat);
      const cens = cyl(.8, 1, 1.4, lam(0x5a5040), 9); cens.position.set(tx, th + 2.1, tz + 1); scene.add(cens); cirObs.push({ x: tx, z: tz + 1, r: 1.1 });
      const smoke2 = cyl(.12, .04, 3.4, new THREE.MeshBasicMaterial({ color: 0xd8dce0, transparent: true, opacity: .3, depthWrite: false }), 6);
      smoke2.position.set(tx, th + 4.4, tz + 1); scene.add(smoke2);
      for (let i = 0; i < 8; i++) { const rail = cyl(.12, .14, 1.2, lam(0x8a7a62), 6); rail.position.set(tx - 5 + i * 1.45, th + 1.9, tz - 3.6); scene.add(rail); }
      for (const [ox, oz] of [[-4.4, -3], [4.6, -2.6]]) {   // 檐角双鹤
        const cb2 = new THREE.Mesh(new THREE.SphereGeometry(.4, 8, 6), lam(0xf0eee8)); cb2.scale.set(1.25, .9, .8); cb2.position.set(tx + ox, th + 2.6, tz + oz); scene.add(cb2);
        const nk2 = cyl(.05, .06, .8, lam(0xf0eee8), 4); nk2.rotation.z = .5; nk2.position.set(tx + ox + .4, th + 3.1, tz + oz); scene.add(nk2); }
      const dx3 = gx + 14, dz3 = gz - 12, dh4 = height(dx3, dz3);   // 断药炉:裂口大炉
      const fur = cyl(2, 2.6, 3.6, lam(0x5a4a38), 10); fur.position.set(dx3, dh4 + 1.8, dz3); scene.add(fur); cirObs.push({ x: dx3, z: dz3, r: 2.8 });
      const crack = box(.3, 2.6, .5, lam(0x2a2420)); crack.position.set(dx3 + 2.2, dh4 + 1.6, dz3 + .6); crack.rotation.z = .2; scene.add(crack);
      const lid = cyl(2.2, 2.2, .4, lam(0x4a3e30), 10); lid.rotation.z = .5; lid.position.set(dx3 + 3.4, dh4 + .4, dz3 - 2); scene.add(lid);
      const lant = new THREE.PointLight(0xff9a5a, 0, 100, 2); lant.position.set(tx, th + 3.6, tz); lant.userData.pow = 20; nightLamps.push(lant); scene.add(lant);   // 台上灯笼
    },
  },
  shixia: {
    name: '石刻武学岛', en: 'The Carved Cliff', icon: '⚔️', theme: 'shixia',
    desc: '组合岛:侠客石窟的武学之谜 × 文本的读法',
    ferryMsg: '⚔️ 石刻武学岛到了。上面的高人一人守一窟,一坐几十年——送饭僧除外',
    lore: {
      xkcave: { icon: '🕳️', color: '#5a5248', title: '二十四窟', en: 'The 24 Grottoes', hint: '一人认一窟',
        desc: '崖壁上凿着二十四座石窟,壁上刻满蝌蚪样的古字和练功的人形图谱。数十年来,来岛的高手一人认一窟,面壁参详,一坐就是半生。窟外石地上,站桩的脚掌磨出了两个坑。' },
      xkbei: { icon: '🪨', color: '#6a6a5e', title: '无名碑', en: 'The Nameless Stele', hint: '一行字,三种读法',
        desc: '窟前立着一块无名碑,就一行字。白首剑客说那是剑诀,他练到第七十三式;老学究说分明是古经异文,剑客糟蹋斯文;送饭僧说他不识字,只觉得笔画像下山的路。三个人守着同一行字,谁也说服不了谁——都五十年了。' },
      xkfan: { icon: '🍚', color: '#8a7a5a', title: '送饭的山路', en: "The Cook's Path", hint: '最自在的人',
        desc: '一条被扁担压出来的小路,从灶房通向二十四窟。送饭僧每日两趟,风雨不误,从不进窟,也从不看碑。高人们越练越瘦,只有他红光满面——岛上活得最自在的,是唯一不参武学的人。' },
      xkkeng: { icon: '👣', color: '#5e5a50', title: '站桩坑', en: 'The Standing Pits', hint: '三十年,两个坑',
        desc: '每座窟前的青石地上都有两个脚形的凹坑,深的能没过脚踝——那是一个人站桩三十年站出来的。守窟人说,坑最深的那位至今没悟出碑文;但他扎马步的功夫,已经天下无双。修行常常修出的,是本来没打算修的东西。' },
      xklast: { icon: '📖', color: '#4a4256', title: '最后一窟', en: 'The Last Grotto', hint: '谁都解不开的那窟',
        desc: '第二十四窟,谁都解不开。壁上的蝌蚪文密得像游动的鱼群,历代高人在这窟里耗白了头。传说真正看懂它的人会突然大笑,当天离岛,再没回来过——没人知道他们看懂了什么,只知道他们走时都很轻快。' },
    },
    spots: [[0, 6, 'xkcave'], [-14, 12, 'xkbei'], [16, 18, 'xkfan'], [10, -4, 'xkkeng'], [-6, -16, 'xklast']],
    npcs: [
      { dx: -12, dz: 16, name: '白首剑客', body: 0x5a5a66, hat: 0x44444e, opts: { tall: 1.05 },
        lines: ['碑上那行字是剑诀。我练到第七十三式了——还差最后一式收势。', '五十年前我上岛时,想的是十天半月参透就走。', '老学究懂什么!笔画的锋回转折,分明是腕上功夫!'] },
      { dx: -8, dz: 20, name: '老学究', body: 0x6a5a48, hat: 0x504434, opts: { wide: 1.04 },
        lines: ['那是上古经文异体,句读全在气口——剑客糟蹋斯文!', '我注了三十卷,越注越觉得,它像是在注我。', '文本自己不说话。说话的从来是读它的人——这一点,老朽最近才服气。'] },
      { dx: 14, dz: 22, name: '送饭僧', body: 0x8a6a42, hat: 0x6a5230, opts: { wide: 1.14 },
        lines: ['我不识字。我只负责饭熟、汤热、准时。', '他们参碑,我看他们——三十年了,就我还回家吃年夜饭。', '要我说啊,那壁上的字,像下山的路。可惜没人肯下山。'] },
    ],
    build: (gx, gz) => {
      for (let i = 0; i < 8; i++) {   // 崖壁石窟一排(示意八窟)
        const a = -.9 + i * .26, cx3 = gx + Math.cos(a) * 26, cz4 = gz - 4 + Math.sin(a) * 26, chh3 = height(cx3, cz4);
        const mouth = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 8, 0, 6.283, 0, Math.PI / 2.2), new THREE.MeshLambertMaterial({ color: 0x3a362e, side: THREE.DoubleSide }));
        mouth.position.set(cx3, chh3, cz4); scene.add(mouth);
        if (i % 3 === 0) { const pit = box(.4, .08, .7, lam(0x2e2a24)); pit.position.set(cx3, chh3 + .06, cz4 + 2.6); scene.add(pit); } }
      const bei = box(1.8, 3, .6, lam(0x6a665c)); bei.position.set(gx - 14, height(gx - 14, gz + 11) + 1.5, gz + 11); scene.add(bei); cirObs.push({ x: gx - 14, z: gz + 11, r: 1.3 });   // 无名碑
      for (let i = 0; i < 3; i++) { const gl3 = box(.9, .12, .08, lam(0x8a867a)); gl3.position.set(gx - 14, height(gx - 14, gz + 11) + 1 + i * .7, gz + 11.34); gl3.rotation.z = (i % 2) * .4 - .2; scene.add(gl3); }
      const path2 = box(1.4, .1, 22, lam(0xb0a890)); path2.position.set(gx + 14, height(gx + 14, gz + 10) + .08, gz + 10); path2.rotation.y = .3; scene.add(path2);   // 送饭山路
      const pot = cyl(.7, .9, .9, lam(0x3e3a34), 9); pot.position.set(gx + 17, height(gx + 17, gz + 19) + .5, gz + 19); scene.add(pot);   // 灶房大锅
      const stove = box(3, 1.6, 2.4, M.stone); stove.position.set(gx + 18.5, height(gx + 18.5, gz + 20) + .8, gz + 20); scene.add(stove); cirObs.push({ x: gx + 18.5, z: gz + 20, r: 2 });
      const g4 = new THREE.PointLight(0xffb46a, 0, 80, 2); g4.position.set(gx + 18, height(gx + 18, gz + 20) + 3, gz + 20); g4.userData.pow = 15; nightLamps.push(g4); scene.add(g4);
    },
  },
  taozhen: {
    name: '桃阵岛', en: 'The Peach Maze', icon: '🌸', theme: 'taozhen',
    desc: '组合岛:桃花八阵的奇门 × 音律的钥匙',
    ferryMsg: '🌸 桃阵岛到了。桃林按奇门排布——进去容易,出来要会听',
    lore: {
      tzlin: { icon: '🌸', color: '#d88a9a', title: '桃花八阵', en: 'The Peach Octagon', hint: '花瓣落地即阵图',
        desc: '满岛桃树按奇门遁甲排布,生休伤杜、景死惊开,外人进得来,出不去。采药童子透露过一句:别看树,看地上——花瓣落下来不是乱落的,风替岛主扫出来的纹路,就是阵图。' },
      tzbell: { icon: '🔔', color: '#a8863a', title: '五音石钟', en: 'The Five Tone Bells', hint: '宫商角徵羽',
        desc: '阵眼处悬着五口石钟,分别应宫、商、角、徵、羽。依次敲对,桃枝会自己让路;敲错一声,方才的路就全换一遍。石钟内壁刻着一行小字:"急什么。音准了,路就直了。"' },
      tzting: { icon: '🏯', color: '#8a5a4a', title: '半山亭', en: 'The Half-Hill Pavilion', hint: '琴声即号令',
        desc: '岛主终日在亭中抚琴,极少见客。琴声就是全岛的号令:一曲《平沙》,潮退暗道开;一曲《广陵》,满林桃花同时落。有人问他为何不设门锁,他头也不抬:"阵不是用来困人的,是用来让人自己走回去的。"' },
      tzdao: { icon: '🌊', color: '#5a7a8a', title: '潮汐暗道', en: 'The Tide Tunnel', hint: '退潮才露的门',
        desc: '岛北的礁石间藏着一道石门,涨潮时没在水下,退潮才露出半张脸。门楣上刻着两个字:"来去"。据说这是全岛唯一不设阵的路——岛主留的:真心要走的人,不必会奇门,等一次退潮就够了。' },
      tztao: { icon: '🍑', color: '#e89aaa', title: '千年桃', en: 'The Elder Peach', hint: '阵眼的老树',
        desc: '阵眼正中一棵千年老桃,粗过三人合抱,花开时像半空炸开一朵粉云。传说吃过它果子的人不辨方向——不是中毒,是从此走到哪都像在家,便不想认路了。采药童子说岛主年年只摘两枚:自己一枚,留给"该来的人"一枚。' },
    },
    spots: [[0, 20, 'tzlin'], [2, 0, 'tzbell'], [-16, -12, 'tzting'], [8, -34, 'tzdao'], [-4, 6, 'tztao']],
    npcs: [
      { dx: -14, dz: -10, name: '岛主', body: 0x4a5a5a, hat: 0x36444a, opts: { tall: 1.06, cane: true },
        lines: ['(琴声未停,他抬了抬下巴,算是见礼。)', '阵不是用来困人的,是用来让人自己走回去的。', '会听的,自然会走。不会听的——多住几日,岛上桃子管够。'] },
      { dx: 8, dz: 6, name: '采药童子', body: 0x6a9a5a, hat: 0x4e7a40, opts: { tall: .8 },
        lines: ['别看树!看地上的花瓣——风是替师父扫阵图的。', '五口钟我闭眼都敲得对。诀窍?饿的时候想着饭堂的方向。', '师父说今年那枚桃子还没送出去。你要不要试试运气?'] },
    ],
    build: (gx, gz) => {
      const peach = (px3, pz3, s) => { const ph5 = height(px3, pz3);   // 桃树:褐干粉冠
        const tr = cyl(.22 * s, .3 * s, 2.2 * s, lam(0x6a4a36), 6); tr.position.set(px3, ph5 + 1.1 * s, pz3); scene.add(tr);
        const cn = new THREE.Mesh(new THREE.SphereGeometry(1.5 * s, 9, 7), lam(0xe8a8bc)); cn.scale.y = .8; cn.position.set(px3, ph5 + 2.6 * s, pz3); scene.add(cn); };
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; peach(gx + Math.cos(a) * 18, gz + 4 + Math.sin(a) * 18, 1 + (i % 3) * .15); }   // 外八卦
      for (let i = 0; i < 4; i++) { const a = i / 4 * 6.283 + .78; peach(gx + Math.cos(a) * 9, gz + 4 + Math.sin(a) * 9, .9); }             // 内四象
      peach(gx - 4, gz + 6, 1.9);   // 千年桃(阵眼)
      const fx3 = gx + 2, fz3 = gz, fh4 = height(fx3, fz3);   // 五音石钟:横梁悬钟
      for (const [ox, oz] of [[-3.4, 0], [3.4, 0]]) { const po = cyl(.16, .2, 3.2, M.woodDark, 6); po.position.set(fx3 + ox, fh4 + 1.6, fz3); scene.add(po); }
      const beam2 = box(7.4, .3, .3, M.woodDark); beam2.position.set(fx3, fh4 + 3.2, fz3); scene.add(beam2);
      for (let i = 0; i < 5; i++) { const bell2 = cyl(.34, .46, .7, M.stone, 8); bell2.position.set(fx3 - 2.6 + i * 1.3, fh4 + 2.5, fz3); scene.add(bell2); }
      const px4 = gx - 16, pz4 = gz - 12, ph6 = height(px4, pz4);   // 半山亭:四柱攒尖
      for (const [ox, oz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) { const c4 = cyl(.2, .24, 3, lam(0x8a4a3a), 7); c4.position.set(px4 + ox, ph6 + 1.5, pz4 + oz); scene.add(c4); }
      const proof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 1.8, 4), lam(0x6a3a30)); proof.rotation.y = .78; proof.position.set(px4, ph6 + 3.9, pz4); scene.add(proof); cirObs.push({ x: px4, z: pz4, r: 2.6 });
      const gate2 = box(3.4, 3, .8, M.stone); gate2.position.set(gx + 8, Math.max(height(gx + 8, gz - 34), .2) + 1.2, gz - 34); scene.add(gate2);   // 潮汐暗道石门
      const hole2 = box(1.6, 2, .9, lam(0x1e2226)); hole2.position.set(gx + 8, Math.max(height(gx + 8, gz - 34), .2) + .9, gz - 34); scene.add(hole2);
      const g5 = new THREE.PointLight(0xff9aae, 0, 90, 2); g5.position.set(px4, ph6 + 4.5, pz4); g5.userData.pow = 18; nightLamps.push(g5); scene.add(g5);
    },
  },

  venezia: {
    name: '看不见的水城', en: 'The Invisible City', icon: '🛶', theme: 'venezia',
    desc: '组合岛:威尼斯的水巷 × 卡尔维诺的五十五种描述',
    ferryMsg: '🛶 看不见的水城到了。这里的街道是水做的——每个来过的人,描述的都不是同一座城',
    lore: {
      vzcanal: { icon: '🛶', color: '#4a7a8a', title: '大水巷', en: 'The Grand Canal', hint: '街道是水做的',
        desc: '这座城不修路,修水:门槛直接泡在浪里,台阶往水下多凿三级——给退潮时的客人用。撑船人说,在这里迷路的方式和别处不同:别处是走错了街,这里是"跟错了倒影"。' },
      vzbridge: { icon: '🌉', color: '#8a7a5a', title: '一百零一桥', en: 'The Hundred Bridges', hint: '桥比街多的城',
        desc: '城里桥比街多。最老的一座没有栏杆——老人们说那是故意的:过桥的人得专心,专心的人不胡思乱想。桥洞里刻着一行小字:"你数过第几座了?数桥的人,永远数不到自己脚下这座。"' },
      vzmarco: { icon: '📜', color: '#a8863a', title: '说书人的座位', en: "The Storyteller's Bench", hint: '五十五种描述',
        desc: '码头石凳上,说书的旅人日复一日向看不见的可汗汇报他走过的城市:轻的城、连绵的城、死者的城、天空的城……五十五座讲完,可汗发现他说的一直是同一座——他的故乡。石凳扶手被摩挲得发亮,像一枚旧印章。' },
      vzmask: { icon: '🎭', color: '#8a5a7a', title: '面具铺', en: 'The Mask Shop', hint: '人人露出真面目',
        desc: '铺子里挂满面具:月亮脸、乌鸦嘴、镀金的太阳。掌柜的从不问你要哪张,只看你一眼,取一张递过来——十有八九,正是你不敢承认想要的那张。他说这城的规矩:人人戴面具,于是人人露出了真面目。' },
      vzflood: { icon: '📏', color: '#5a7a8a', title: '水位刻度', en: 'The Flood Marks', hint: '慢慢启程的城',
        desc: '墙根一排刻度,记着历年大水的高度,最上面那道快齐人肩了。城每年往下沉一点,居民不修堤,只把家往楼上搬一层。撑船人耸耸肩:"它不是在沉没——它是在慢慢启程。"' },
    },
    spots: [[0, 10, 'vzcanal'], [-16, -2, 'vzbridge'], [12, 26, 'vzmarco'], [16, -12, 'vzmask'], [-8, 22, 'vzflood']],
    npcs: [
      { dx: 8, dz: 22, name: '说书的旅人', body: 0x8a6a3a, hat: 0x6a5028, opts: { tall: 1.02 },
        lines: ['我向可汗描述过五十五座城市。他后来发现,说的都是我的故乡。', '城市不肯说自己的过去,只把它写在街角、栏杆和旗杆上,像手相。', '你也走过不少岛吧?坐下说说——说着说着,你就知道自己的故乡长什么样了。'] },
      { dx: -6, dz: 6, name: '撑船人', body: 0x3a5a6a, hat: 0x2a4450, opts: { wide: 1.05 },
        lines: ['上船不要问去哪。水认得路。', '涨潮送你出门,退潮接你回家——这城的时刻表是月亮排的。', '桥底下别说愿望,回声会替你改词。'] },
    ],
    build: (gx, gz) => {
      const cols = [0xc86a5a, 0xd8a05a, 0x8aa06a, 0x6a8ab0, 0xb07a8a, 0xd8c08a];
      for (let i = 0; i < 8; i++) {   // 两排彩色窄楼夹一条水巷
        const side = i < 4 ? -1 : 1, bx2 = gx - 10 + (i % 4) * 7, bz2 = gz + 8 + side * 5.5, H2 = 5 + (i % 3) * 1.5, bh2 = height(bx2, bz2);
        const hs2 = box(5.4, H2, 4, lam(cols[i % 6])); hs2.position.set(bx2, bh2 + H2 / 2, bz2); scene.add(hs2); cirObs.push({ x: bx2, z: bz2, r: 3.2 });
        for (let w2 = 0; w2 < 2; w2++) { const win2 = box(.8, 1.1, .12, lam(0x2e3440)); win2.position.set(bx2 - 1.2 + w2 * 2.4, bh2 + H2 - 1.6, bz2 - side * 2.06); scene.add(win2); } }
      const canal = box(30, .25, 4.6, new THREE.MeshPhongMaterial({ color: 0x2a5a6a, shininess: 80, transparent: true, opacity: .85 }));
      canal.position.set(gx, height(gx, gz + 8) + .32, gz + 8); scene.add(canal);   // 水巷
      for (let i = 0; i < 3; i++) {   // 三座小拱桥
        const brx = gx - 9 + i * 9, brh = height(brx, gz + 8);
        const arch2 = box(2.2, .3, 6.4, lam(0xb0a890)); arch2.position.set(brx, brh + 1.5, gz + 8); scene.add(arch2);
        for (const so of [-2.6, 2.6]) { const ramp2 = box(2.2, .28, 1.8, lam(0xb0a890)); ramp2.position.set(brx, brh + 1, gz + 8 + so); ramp2.rotation.x = so > 0 ? .5 : -.5; scene.add(ramp2); } }
      for (let i = 0; i < 3; i++) {   // 贡多拉:黑舟翘首
        const gnx = gx - 12 + i * 10, gnh = height(gnx, gz + 8);
        const gon = box(3.6, .5, .9, lam(0x1e2226)); gon.position.set(gnx + 2, gnh + .8, gz + 8); scene.add(gon);
        const prow = box(.5, 1, .2, lam(0x1e2226)); prow.rotation.z = .5; prow.position.set(gnx + 3.8, gnh + 1.2, gz + 8); scene.add(prow); }
      const cmp = box(3, 14, 3, lam(0xa85a48)); cmp.position.set(gx + 18, height(gx + 18, gz - 10) + 7, gz - 10); scene.add(cmp); cirObs.push({ x: gx + 18, z: gz - 10, r: 2.4 });   // 钟楼
      const spire = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3.4, 4), lam(0x3a6a5a)); spire.rotation.y = .78; spire.position.set(gx + 18, height(gx + 18, gz - 10) + 15.6, gz - 10); scene.add(spire);
      const stall2 = box(3.6, 2.6, 2.6, lam(0x6a4a6a)); stall2.position.set(gx + 15, height(gx + 15, gz - 13) + 1.3, gz - 13); scene.add(stall2);   // 面具铺
      const wl3 = new THREE.PointLight(0xffd8a0, 0, 90, 2); wl3.position.set(gx, height(gx, gz + 8) + 5, gz + 8); wl3.userData.pow = 20; nightLamps.push(wl3); scene.add(wl3);
    },
  },
  saga: {
    name: '冰火萨迦岛', en: 'The Saga Isle', icon: '❄️', theme: 'saga',
    desc: '组合岛:冰岛的冰川与火山 × 埃达史诗的预言',
    ferryMsg: '❄️ 冰火萨迦岛到了。冰川和火山一墙之隔——诗人说,世界就是这么造出来的',
    lore: {
      sggeyser: { icon: '⛲', color: '#8fb8c8', title: '间歇泉', en: 'The Geyser', hint: '大地在换气',
        desc: '一汪幽蓝的圆池,每隔一炷香猛地喷起十几米的白水柱,又安静下去。向导说别用"喷发"这么凶的词——"那是大地在换气。你屏住呼吸听,喷完那一下,整座岛都松了口气。"' },
      sglava: { icon: '🌋', color: '#8c3a1a', title: '熔岩裂缝', en: 'The Lava Rift', hint: '一墙之隔的冰与火',
        desc: '黑色的熔岩原上裂着一道细缝,深处透出橘红的光,像大地没合拢的伤口。十步之外就是冰川的白舌头——冰与火在这里只隔一堵石墙。埃达里说,世界正是从冰与火的相遇处诞生的;这里像是留了个火种,以备重来一次。' },
      sgrune: { icon: '🪨', color: '#5a5a66', title: '预言石', en: 'The Prophecy Stone', hint: '末日诗的最后一句',
        desc: '一块爬满地衣的符文石,刻着女先知的预言:狼吞日,蛇搅海,诸神赴死,大地沉没——最后一行字最小,得蹲下才看得清:"而后大地将再度从海中升起,绿意盎然,瀑布下有鹰掠过。"末日预言的最后一句,是希望。' },
      sgskald: { icon: '🔥', color: '#a86a2a', title: '吟游诗人的火堆', en: "The Skald's Fire", hint: '萨迦是围着火讲的',
        desc: '石圈里一堆终年不熄的火,几段原木当座。萨迦从来不是读的,是围着火听的——风越大,讲得越好。诗人的规矩:讲死亡时添一根柴,讲出生时也添一根。"火分不清悲喜,火只管把夜撑住。"' },
      sgaurora: { icon: '🌌', color: '#3a6a5a', title: '极光崖', en: 'The Aurora Cliff', hint: '渡鸦在替谁翻书',
        desc: '晴朗的冬夜,崖顶上空会垂下绿色的光帘,慢慢卷动,像一页页翻过。向导的祖母说那是奥丁的两只渡鸦在替他翻阅世界;向导自己念过书,知道那是太阳风——"可我每次看,还是先想起祖母的说法。知识管白天,故事管夜里。"' },
    },
    spots: [[-12, 18, 'sggeyser'], [16, -8, 'sglava'], [-4, -2, 'sgrune'], [6, 14, 'sgskald'], [-6, -26, 'sgaurora']],
    npcs: [
      { dx: 10, dz: 16, name: '吟游诗人', body: 0x5a4a3a, hat: 0x42362a, opts: { tall: 1.04 },
        lines: ['萨迦的第一句永远是名字——人没了,名字还得有人念。', '我唱过一百遍诸神黄昏。听众最安静的,永远是最后那句绿意盎然。', '坐。风这么大,正是讲故事的好天气。'],
        topics: [{ q: '为什么末日诗的结尾是希望?', a: '因为唱诗的人都活过冬天。真正挨过长夜的人不敢把结尾写死——他们知道,春天不是修辞,是经验。' }] },
      { dx: -14, dz: 14, name: '冰川向导', body: 0x4a6a7a, hat: 0x365060, opts: { wide: 1.08 },
        lines: ['冰川每年退一点。我的工作迟早会变成"指着照片讲从前"。', '间歇泉要等,极光要碰——这岛教人的第一课是:急不来。', '踩我踩过的地方。冰的脾气,我认得。'] },
    ],
    build: (gx, gz) => {
      const gyx = gx - 12, gyz = gz + 18, gyh = height(gyx, gyz);   // 间歇泉:池+白水柱
      const pool2 = new THREE.Mesh(new THREE.CircleGeometry(2.6, 14), new THREE.MeshPhongMaterial({ color: 0x4a9ab0, shininess: 90 })); pool2.rotation.x = -Math.PI / 2; pool2.position.set(gyx, gyh + .15, gyz); scene.add(pool2);
      const jet = cyl(.5, 1.1, 12, new THREE.MeshBasicMaterial({ color: 0xeaf6fa, transparent: true, opacity: .55, depthWrite: false }), 8); jet.position.set(gyx, gyh + 6, gyz); scene.add(jet);
      const lvx = gx + 16, lvz = gz - 8, lvh = height(lvx, lvz);   // 熔岩裂缝:黑岩+橘光
      for (let i = 0; i < 6; i++) { const bk = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6 + (i % 3) * .5), lam(0x26242a)); bk.position.set(lvx - 6 + i * 2.4, lvh + .7, lvz + (i % 2) * 2); bk.rotation.set(i, i * 2, 0); scene.add(bk); }
      const rift = box(9, .3, .9, new THREE.MeshBasicMaterial({ color: 0xff6a2a, fog: false })); rift.position.set(lvx, lvh + .2, lvz + 1); scene.add(rift);
      const lglow = new THREE.PointLight(0xff5a1a, 1.2, 30, 2); lglow.position.set(lvx, lvh + 1.5, lvz + 1); scene.add(lglow);
      for (let i = 0; i < 4; i++) { const ice = box(2.4, 1.6 + (i % 2), 2, new THREE.MeshPhongMaterial({ color: 0xd8ecf4, transparent: true, opacity: .8, shininess: 100 }));   // 冰川舌
        ice.position.set(lvx - 2 + i * 2.2, lvh + .8, lvz - 6); ice.rotation.y = i; scene.add(ice); }
      const rs2 = box(1.5, 3, .7, lam(0x5a5a66)); rs2.position.set(gx - 4, height(gx - 4, gz - 2) + 1.5, gz - 2); rs2.rotation.y = .3; scene.add(rs2); cirObs.push({ x: gx - 4, z: gz - 2, r: 1.2 });   // 预言石
      const fx4 = gx + 6, fz4 = gz + 14, fh5 = height(fx4, fz4);   // 火堆+原木座
      const fire2 = new THREE.Mesh(new THREE.ConeGeometry(.8, 1.6, 7), new THREE.MeshBasicMaterial({ color: 0xffa04a, transparent: true, opacity: .85, fog: false })); fire2.position.set(fx4, fh5 + .9, fz4); scene.add(fire2);
      for (let i = 0; i < 3; i++) { const log2 = cyl(.3, .3, 2.6, M.woodDark, 6); const a2 = i * 2.09; log2.rotation.z = Math.PI / 2; log2.rotation.y = a2; log2.position.set(fx4 + Math.cos(a2) * 2.2, fh5 + .3, fz4 + Math.sin(a2) * 2.2); scene.add(log2); }
      const fglow = new THREE.PointLight(0xff9a4a, 0, 80, 2); fglow.position.set(fx4, fh5 + 2, fz4); fglow.userData.pow = 22; nightLamps.push(fglow); scene.add(fglow);
    },
  },
  atl: {
    name: '沉环之岛', en: 'The Sunken Ring', icon: '🌀', theme: 'atl',
    desc: '组合岛:圣托里尼的月牙崖城 × 柏拉图的亚特兰蒂斯',
    ferryMsg: '🌀 沉环之岛到了。白屋蓝顶在崖上,三道环在湾底——哲学家两千年前就写好了说明书',
    lore: {
      atcliff: { icon: '🏘️', color: '#5a7ab0', title: '白蓝崖城', en: 'The White Cliff Town', hint: '悬在火山口上的家',
        desc: '一排雪白的方屋沿崖顶铺开,圆顶蓝得和海分不清。整座镇子悬在古火山口的边缘上——脚下就是当年塌陷的巨湾。住在"末日现场"的人反而最从容:他们把墙刷得最白,把门漆得最蓝,像跟大海讲和了。' },
      atplato: { icon: '📐', color: '#8a7a4a', title: '哲学家的尺子', en: "The Philosopher's Measure", hint: '对不上的数字',
        desc: '崖顶石桌上钉着一页抄本:环城三道水、三道墙,宫殿居中,金银为饰——哲学家言之凿凿,说得像去过。两千年来无数人拿着尺子来量,数字从没对上过。可黄昏退潮时从崖顶往湾里看……你自己看吧。' },
      atruin: { icon: '🏛️', color: '#6a8a9a', title: '沉没的柱廊', en: 'The Drowned Colonnade', hint: '湾底的影子',
        desc: '湾里露出几截白石柱子,涨潮时只剩柱头,退潮时能看见断裂的拱和铺地的残纹。渔民从不把船系在柱子上——"人家的城门口,懂点礼数。"没人说得清它沉了多少年:久到海把它当成了自己的。' },
      atbell: { icon: '🔔', color: '#4a5a6a', title: '沉钟', en: 'The Sunken Bell', hint: '涨潮夜的声音',
        desc: '涨大潮的夜里,湾底会传来沉沉的钟声,一下,又一下。学者说是洋流撞响了沉在水下的铜钟;酿酒师说是浮标撞礁;守夜的老狗什么也不说,只是每次都朝着海,竖起耳朵。' },
      atvine: { icon: '🍇', color: '#7a5a8a', title: '火山葡萄园', en: 'The Basket Vines', hint: '末日土壤上的甜',
        desc: '葡萄藤不搭架,盘成一圈圈贴地的篮子——挡风,也兜露水。火山灰的地里长出的葡萄小而极甜,酿的酒带一点烟味。酿酒师倒了一杯:"尝尝。末日和甜,可以出自同一片土。"' },
    },
    spots: [[0, -4, 'atcliff'], [-14, 8, 'atplato'], [6, 30, 'atruin'], [18, 24, 'atbell'], [16, -14, 'atvine']],
    npcs: [
      { dx: 10, dz: -8, name: '老酿酒师', body: 0x6a4a5a, hat: 0x503846, opts: { wide: 1.1 },
        lines: ['我的葡萄长在两千年前的火山灰里——年份?你说的是哪一层的年份?', '游客来找亚特兰蒂斯,住两晚,最后都在找我的酒窖。', '大海拿走了半座岛,还回来的是甜。这买卖,我们认了。'],
        topics: [{ q: '你相信亚特兰蒂斯吗?', a: '我信我的葡萄。它们的根扎在两千年前的灰里,酿出的酒带着那场末日的烟味——你说,这算不算喝到了亚特兰蒂斯?' }] },
      { dx: -12, dz: 10, name: '寻找沉城的学者', body: 0x4a5a7a, hat: 0x384660, opts: { tall: 1.05 },
        lines: ['我找了四十年。同行都说我找错了地方——他们说得可能都对。', '柏拉图写的若不是实录,就是预言。两样我都接受。', '我不怕找不到。我怕的是找到以后,没有东西可找了。'] },
    ],
    build: (gx, gz) => {
      for (let i = 0; i < 6; i++) {   // 崖顶白屋蓝顶
        const wx2 = gx - 12 + i * 5, wz2 = gz - 4 - (i % 2) * 4, wh3 = height(wx2, wz2);
        const cube = box(3.6, 3, 3.6, lam(0xf2f0ea)); cube.position.set(wx2, wh3 + 1.5, wz2); scene.add(cube); cirObs.push({ x: wx2, z: wz2, r: 2.4 });
        if (i % 2) { const dome2 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 10, 8, 0, 6.283, 0, Math.PI / 2), lam(0x2a6ab0)); dome2.position.set(wx2, wh3 + 3, wz2); scene.add(dome2); } }
      { const wmx = gx + 14, wmz = gz - 18, wmh = height(wmx, wmz);   // 风车
        const tower2 = cyl(1.2, 1.6, 5, lam(0xf2f0ea), 9); tower2.position.set(wmx, wmh + 2.5, wmz); scene.add(tower2); cirObs.push({ x: wmx, z: wmz, r: 1.6 });
        for (let i = 0; i < 6; i++) { const bl = box(.24, 2.6, .06, lam(0xd8d4c8)); const a2 = i / 6 * 6.283; bl.position.set(wmx + Math.sin(a2) * 1.1, wmh + 5.4 + Math.cos(a2) * 1.1, wmz + 1.5); bl.rotation.z = -a2; scene.add(bl); } }
      for (let i = 0; i < 5; i++) {   // 湾底沉柱(半没于水)
        const px5 = gx + 2 + i * 5, pz5 = gz + 32 + (i % 2) * 4;
        const col5 = cyl(.7, .8, 3 + (i % 3), lam(0xdcd8cc), 9); col5.position.set(px5, .4 + (i % 3) * .5, pz5); col5.rotation.z = (i % 2) * .18 - .09; scene.add(col5); }
      const arch3 = box(4.6, .8, 1, lam(0xd0ccc0)); arch3.position.set(gx + 9, 1.6, gz + 34); arch3.rotation.z = .12; scene.add(arch3);   // 断拱
      for (let i = 0; i < 6; i++) { const ring2 = new THREE.Mesh(new THREE.TorusGeometry(.9, .18, 6, 12), lam(0x4a6a3a));   // 篮圈葡萄藤
        const vx2 = gx + 14 + (i % 3) * 3, vz2 = gz - 12 - Math.floor(i / 3) * 3; ring2.rotation.x = Math.PI / 2; ring2.position.set(vx2, height(vx2, vz2) + .3, vz2); scene.add(ring2); }
      const bell3 = cyl(.6, .8, 1, lam(0x6a5a30), 9); bell3.position.set(gx + 18, .2, gz + 26); scene.add(bell3);   // 沉钟(潮间带)
      const wl4 = new THREE.PointLight(0xffe2b0, 0, 90, 2); wl4.position.set(gx - 2, height(gx - 2, gz - 6) + 4.5, gz - 6); wl4.userData.pow = 18; nightLamps.push(wl4); scene.add(wl4);
    },
  },
  aeol: {
    name: '风袋岛', en: 'The Isle of Winds', icon: '💨', theme: 'aeol',
    desc: '组合岛:埃奥利群岛的长明火山 × 奥德赛的风神皮袋',
    ferryMsg: '💨 风袋岛到了。进港帆自己垂下——这里的风,归一位老人管',
    lore: {
      aeolbag: { icon: '💨', color: '#8fa8c8', title: '风神的皮袋', en: 'The Bag of Winds', hint: '装着全世界的逆风',
        desc: '凉棚下拴着一只鼓胀的牛皮大袋,袋口九道银线。当年风神把逆风全数收进袋里送给奥德修斯,只留顺风送他回家——船员当是金子,在故乡的灯火已可望见时拆开了它。一袋逆风,把十年吹回了原点。' },
      aeolstrom: { icon: '🌋', color: '#8c3a1a', title: '长明火山', en: 'The Lighthouse Volcano', hint: '两千年没熄过的灯',
        desc: '岛心的火山每隔一炷香喷一小口红光,两千年来从不失约——水手们叫它"地中海的灯塔"。守灯渔妇说得更准:"灯塔要人点。它不用。它自己想着航海的人。"' },
      aeolharbor: { icon: '⚓', color: '#4a6a8a', title: '无风港', en: 'The Windless Harbour', hint: '帆到这里自动垂下',
        desc: '全世界只有这座港不需要收帆——船一过防波堤,风就停在堤外,帆布软软垂下,像被谁轻轻按了一下肩。风神的规矩:港里只留说话的风量。' },
      aeolvane: { icon: '🗿', color: '#6a6a62', title: '风向石林', en: 'The Vane Stones', hint: '石头指着今天的风',
        desc: '坡上立着一片天然石柱,每根顶端都磨出了斜面。岛民不看天气预报——清晨看哪根石柱的斜面挂了露水,就知道今天该往哪个方向出海。石头比云诚实。' },
    },
    spots: [[0, 6, 'aeolbag'], [4, -20, 'aeolstrom'], [-8, 34, 'aeolharbor'], [18, 12, 'aeolvane']],
    npcs: [
      { dx: -6, dz: 10, name: '风神', body: 0x8fa8c8, hat: 0x6a84a8, opts: { tall: 1.08, cane: true },
        lines: ['袋子别碰。里面是全世界没吹完的逆风。', '奥德修斯?好孩子,就是带的船员不行。', '退休了。现在只管这一座岛的风——和偶尔,替谁把顺风多留一天。'] },
      { dx: 10, dz: -4, name: '守灯渔妇', body: 0x8a5a46, hat: 0x6a4434, opts: { wide: 1.08 },
        lines: ['火山两千年没迟到过。人做不到的守时,山替我们做了。', '我男人出海那些年,我夜夜看它喷一口红——像谁在替我数着他回家的日子。', '风袋岛的孩子第一课:对风要有礼貌。'] },
    ],
    build: (gx, gz) => {
      const bx9 = gx, bz9 = gz + 6, bh9 = height(bx9, bz9);   // 风神皮袋:鼓胀牛皮+银口
      const bag = new THREE.Mesh(new THREE.SphereGeometry(2, 12, 10), lam(0x8a6a42)); bag.scale.set(1, 1.25, .9); bag.position.set(bx9, bh9 + 2.2, bz9); scene.add(bag); cirObs.push({ x: bx9, z: bz9, r: 2.2 });
      const tie = cyl(.5, .7, .8, lam(0xc8ccd4), 8); tie.position.set(bx9, bh9 + 4.3, bz9); scene.add(tie);
      const vx9 = gx + 4, vz9 = gz - 20, vh9 = height(vx9, vz9);   // 长明火山口红光
      const glow9 = new THREE.Mesh(new THREE.ConeGeometry(2.6, 3, 9), new THREE.MeshBasicMaterial({ color: 0xff6a2a, transparent: true, opacity: .5, fog: false })); glow9.position.set(vx9, vh9 + 9, vz9); scene.add(glow9);
      const el9 = new THREE.PointLight(0xff5a1a, 0, 160, 2); el9.position.set(vx9, vh9 + 10, vz9); el9.userData.pow = 30; el9.userData.farVis = 500; nightLamps.push(el9); scene.add(el9);
      for (let i = 0; i < 6; i++) { const st9 = cyl(.5, .7, 3 + (i % 3), lam(0x6e6a62), 6);   // 风向石林
        st9.position.set(gx + 14 + (i % 3) * 4, height(gx + 14, gz + 10) + 1.6, gz + 8 + Math.floor(i / 3) * 4); st9.rotation.z = .12; scene.add(st9); }
      const quay9 = box(20, 1, 5, M.stone); quay9.position.set(gx - 8, Math.max(height(gx - 8, gz + 36), .2) + .5, gz + 36); scene.add(quay9);   // 无风港石堤
    },
  },
  tusi: {
    name: '讲故事人之岛', en: 'Tusitala', icon: '🖋️', theme: 'tusi',
    desc: '组合岛:萨摩亚的瓦伊利马 × 《金银岛》作者的归宿',
    ferryMsg: '🖋️ 讲故事人之岛到了。萨摩亚人叫他图西塔拉——讲故事的人。他葬在山顶,面朝海',
    lore: {
      tusihouse: { icon: '🏡', color: '#8a6a4a', title: '瓦伊利马宅', en: 'Vailima', hint: '大凉台上的书房',
        desc: '一栋带宽大凉台的木屋。他人生最后四年住在这里:写作、种地、给部族调解纠纷。酋长们送他一个名字——图西塔拉,讲故事的人。比起"作家",他更喜欢这个头衔。' },
      tusipath: { icon: '👣', color: '#6a7a5a', title: '哀恸之路', en: 'The Road of Loving Hearts', hint: '部族亲手修的路',
        desc: '通往山顶的路,是萨摩亚人自发为他修的——为感谢他为部族的仗义执言。修路那天酋长立了牌:"暴雨可以冲垮它,我们会一直修。要让图西塔拉上山的路,永远好走。"' },
      tusigrave: { icon: '⛰️', color: '#5a5a52', title: '山顶之墓', en: 'The Grave on Vaea', hint: '海望得见,星压得低',
        desc: '他四十四岁死在削土豆的黄昏,六十位酋长连夜挥刀开路,把他抬上了山顶。石棺上刻着他自己写好的墓志——去读读吧,顺着那条路。' },
      tusistory: { icon: '🖋️', color: '#8a7452', title: '讲故事的凉台', en: 'The Storytelling Veranda', hint: '孩子们围坐过的地方',
        desc: '每到傍晚,凉台阶前坐满部族的孩子。他讲海盗、讲藏宝图、讲独腿的西尔弗——孩子们不知道那本书叫《金银岛》,只知道图西塔拉的海里,什么都有。' },
    },
    spots: [[0, 4, 'tusihouse'], [-6, -14, 'tusipath'], [2, -26, 'tusigrave'], [8, 8, 'tusistory']],
    npcs: [
      { dx: -10, dz: 8, name: '老酋长', body: 0x6a4a32, hat: 0x4c3624, opts: { wide: 1.15 },
        lines: ['他替我们坐过牢的朋友说话,我们替他修一条路。这买卖,萨摩亚不亏。', '白人管他叫作家。我们叫他图西塔拉——会讲故事的,才配埋在山顶。', '那条路每年雨季都冲坏。每年,我们都修。'] },
      { dx: 12, dz: -2, name: '听故事长大的孩子', body: 0x8a6a4a, hat: 0x6a5238, opts: { tall: .8 },
        lines: ['我爷爷小时候坐在凉台最前排。他说图西塔拉讲到海盗时,眼睛比火把亮。', '山顶风大。可他说过,他就想葬在听得见海的地方。', '你去过金银岛吗?真的?——他要是知道有人真的去了,该多高兴。'] },
    ],
    build: (gx, gz) => {
      const hx9 = gx, hz9 = gz + 4, hh9 = height(hx9, hz9);   // 瓦伊利马:木屋+宽凉台
      const hus = box(8, 4, 6, lam(0xa8845a)); hus.position.set(hx9, hh9 + 2, hz9); scene.add(hus); cirObs.push({ x: hx9, z: hz9, r: 5 });
      const vera = box(12, .4, 9, lam(0x8a6a44)); vera.position.set(hx9, hh9 + .5, hz9); scene.add(vera);
      for (const [ox, oz] of [[-5.4, -4], [5.4, -4], [-5.4, 4], [5.4, 4]]) { const pp9 = cyl(.14, .16, 3.4, M.woodDark, 5); pp9.position.set(hx9 + ox, hh9 + 2, hz9 + oz); scene.add(pp9); }
      const rf99 = box(13, .5, 10, lam(0x6a4a32)); rf99.position.set(hx9, hh9 + 4.4, hz9); scene.add(rf99);
      for (let i = 0; i < 8; i++) { const t9 = i / 8;   // 哀恸之路:上山石阶
        const px9 = gx - 5 + Math.sin(t9 * 2) * 4, pz9 = gz - 8 - t9 * 16;
        const stp = box(2.2, .4, 1.3, M.stone); stp.position.set(px9, height(px9, pz9) + .25, pz9); scene.add(stp); }
      const gvx = gx + 2, gvz = gz - 26, gvh = height(gvx, gvz);   // 山顶石棺
      const ped9 = box(3.6, .8, 2.4, M.stone); ped9.position.set(gvx, gvh + .5, gvz); scene.add(ped9);
      const cof = box(2.8, .9, 1.6, lam(0xd8d4c8)); cof.position.set(gvx, gvh + 1.35, gvz); scene.add(cof); cirObs.push({ x: gvx, z: gvz, r: 2.2 });
      for (let i = 0; i < 4; i++) { const fr9 = cyl(.2, .28, 2.6, lam(0x6a4a36), 6);   // 鸡蛋花树
        const fx99 = gx + 10 + (i % 2) * 5, fz99 = gz + 12 + Math.floor(i / 2) * 5;
        fr9.position.set(fx99, height(fx99, fz99) + 1.3, fz99); scene.add(fr9);
        const bl9 = new THREE.Mesh(new THREE.SphereGeometry(1.3, 8, 6), lam(0xe8c8d0)); bl9.scale.y = .7; bl9.position.set(fx99, height(fx99, fz99) + 3, fz99); scene.add(bl9); }
      const wl9 = new THREE.PointLight(0xffd8a0, 0, 90, 2); wl9.position.set(hx9, hh9 + 5.4, hz9); wl9.userData.pow = 18; nightLamps.push(wl9); scene.add(wl9);
    },
  },
};
}
