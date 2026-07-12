/* ============================================================
   w-cards.js — 报纸与万神殿渲染(F 模块化第四阶段,自 game3d.js 外迁)
   依赖注入:{ D, esc, todayStr, mulberry32, WEATHER, shards() getter }
   ============================================================ */
export function makeCards({ D, esc, todayStr, mulberry32, WEATHER, shards }) {
  function paperHTML() {
    const ds = todayStr();
    const r = mulberry32([...ds].reduce((a, c) => (a * 33 + c.charCodeAt(0)) | 0, 5));
    const pick = arr => arr[Math.floor(r() * arr.length)];
    const art = pick(D.art), beer = pick(D.beers), bird = pick(D.birds), book = pick(D.books),
          alb = pick(D.jazz), plant = pick(D.plants), sport = pick(D.outdoor);
    const issue = Math.floor((Date.now() - new Date('2026-01-01').getTime()) / 86400000);
    const shardLeft = 24 - shards().length;
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
  
  return { paperHTML, parsePantheon, pantheonHTML, pantheonFallback };
}
