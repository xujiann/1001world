/* ============================================================
   w-isles.js — 十七座「接入迷宫的老岛」内容包(NI_CONTENT)
   纯数据 + build(gx,gz) 场景函数;不直接 import three,
   由 game3d.js 上下文注入(THREE/height/box/cyl/lam/M/scene/
   cirObs/nightLamps/rnd/makeBoat)。新增岛屿只需在此加数据。
   ============================================================ */
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
};
}
