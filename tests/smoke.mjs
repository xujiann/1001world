/* ============================================================
   🚨 冒烟测试:每次 push 自动跑,专治「语法检查过了、浏览器一开却白屏」那类事故
   (本项目真出过:ghostShip9 重名 → node --check 全过,浏览器 SyntaxError 白屏)

   本地跑:  npx playwright install --with-deps chromium && node tests/smoke.mjs
   CI:      .github/workflows/smoke.yml
   ============================================================ */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PORT = 8899;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const fail = [];
const ok = [];
const check = (cond, label, detail) => (cond ? ok : fail).push(label + (detail != null ? ` (${detail})` : ''));

await new Promise(r => server.listen(PORT, r));
console.log(`▶ 静态服务 http://localhost:${PORT}`);

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage();

const consoleErrors = [];
const pageErrors = [];
let fatal = null;   // 页面抛异常 → 立刻失败,不必空等 90s
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
page.on('pageerror', e => { const s = String(e).slice(0, 300); pageErrors.push(s); if (!fatal) fatal = s.split('\n')[0]; });

// CI 不得污染真实遥测 / 不得创建匿名账号
await page.route('**://*.supabase.co/**', r => r.abort());

const expectVer = (fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/game3d\.js\?v=(\d+)/) || [])[1];

let W = null;
try {
  await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  // 世界构建是同步的重活,给足时间(线上 ~11s,CI 机器更慢);但页面一抛异常就立刻失败
  await Promise.race([
    page.waitForFunction(() => window.__w3d && window.__w3d.scene, null, { timeout: 90000 }),
    new Promise((_, rej) => {
      const iv = setInterval(() => { if (fatal) { clearInterval(iv); rej(new Error('页面抛出异常 → ' + fatal)); } }, 200);
      setTimeout(() => clearInterval(iv), 92000).unref?.();
    }),
  ]);
  W = await page.evaluate(() => {
    const w = window.__w3d;
    let meshes = 0, instanced = 0;
    w.scene.traverse(o => { if (o.isMesh) meshes++; if (o.isInstancedMesh) instanced++; });
    return {
      ver: window.__ver9,
      meshes, instanced,
      spots: (w.spots || []).length,
      npcs: (w.allNpcs || []).length,
      shards: (w.shards || []).length,
      titles: w.titleList ? w.titleList().length : 0,
      cats: Object.keys(w.seen || {}).length,
      hasHeight: typeof w.height === 'function',
      hasPlayer: !!w.player,
    };
  });
} catch (e) {
  fail.push('世界未能就绪:' + String(e).split('\n')[0].slice(0, 160));
  // 关键:构建失败时把真正的原因打出来,否则只看到「超时」无从下手
  for (const p of pageErrors.slice(0, 3)) fail.push('页面异常 → ' + p);
  for (const c of consoleErrors.slice(0, 3)) fail.push('console 错误 → ' + c);
}

if (W) {
  check(pageErrors.length === 0, '无未捕获异常', pageErrors.join(' | ') || undefined);
  check(consoleErrors.length === 0, '无 console 错误', consoleErrors.join(' | ') || undefined);
  check(String(W.ver) === String(expectVer), `版本号自洽 (index.html=${expectVer})`, `游戏内=${W.ver}`);
  check(W.hasPlayer, '玩家已创建');
  check(W.hasHeight, '地形函数在位');
  check(W.meshes > 7000, '场景网格充足', W.meshes);
  check(W.instanced > 0, '实例化景物在位', W.instanced);
  check(W.spots > 200, '互动点充足', W.spots);
  check(W.npcs > 150, 'NPC 充足', W.npcs);
  check(W.shards >= 0, '星之碎片系统在位', W.shards);
  check(W.titles > 20, '称号系统在位', W.titles);
  check(W.cats >= 8, '藏品分类齐全', W.cats);
}

await browser.close();
server.close();

console.log('\n──── 冒烟测试结果 ────');
for (const o of ok) console.log('  ✅ ' + o);
for (const f of fail) console.log('  ❌ ' + f);
console.log(`\n${ok.length} 通过 / ${fail.length} 失败`);
process.exit(fail.length ? 1 : 0);
