/**
 * ページ重量と未参照アセットの検査
 *
 * 1) 各ページが参照する自サイト資産の合計サイズを出し、重いページを特定する
 * 2) 本番に配信されるのに1ページからも参照されていない画像を列挙する
 *    （git追跡済みのものだけを数える。未追跡ファイルはCloudflareのビルドに含まれず、
 *     ローカルのdistにしか無いため本番の実態とズレる）
 *
 * 使い方:
 *   npx astro build && node scripts/audit-weight.mjs
 *
 * 注意: PDF等のダウンロードリンクは <a href> であってページ読み込み時には取得されない。
 *       合計には含まれるが「初期表示が重い」とは限らないので、内訳を見て判断すること。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const DIST = 'dist';
const ASSET_RE = /\.(?:jpe?g|png|svg|webp|gif|css|js|woff2?|pdf)$/i;
const IMAGE_RE = /\.(?:jpe?g|png|svg|webp|gif|pdf)$/i;

if (!fs.existsSync(DIST)) {
  console.error('dist/ がありません。先に `npx astro build` を実行してください。');
  process.exit(1);
}

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) files.push(p);
  }
})(DIST);

const sizeOf = (u) => {
  try {
    const s = fs.statSync(path.join(DIST, decodeURIComponent(u.replace(/[?#].*$/, ''))));
    return s.isFile() ? s.size : 0;
  } catch {
    return 0;
  }
};

const referenced = new Set();
const rows = [];

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const page = '/' + path.relative(DIST, f).split(path.sep).join('/').replace(/index\.html$/, '');
  const seen = new Set();
  let assets = 0;
  const heavy = [];

  for (const m of html.matchAll(/(?:href|src|content)="(\/[^"]+)"/g)) {
    const u = decodeURIComponent(m[1]);
    if (IMAGE_RE.test(u)) referenced.add(u);
    if (!ASSET_RE.test(u) || seen.has(u)) continue;
    seen.add(u);
    const s = sizeOf(u);
    assets += s;
    if (s > 150 * 1024) heavy.push(`${Math.round(s / 1024)}KB ${u.split('/').pop()}`);
  }
  for (const m of html.matchAll(/masakiyo-denki\.com(\/[^"' )]+)/gi)) {
    if (IMAGE_RE.test(m[1])) referenced.add(decodeURIComponent(m[1]));
  }

  const htmlSize = fs.statSync(f).size;
  rows.push({ page, htmlKb: Math.round(htmlSize / 1024), totalKb: Math.round((assets + htmlSize) / 1024), heavy });
}

rows.sort((a, b) => b.totalKb - a.totalKb);
console.log('=== 重いページ TOP12（HTML＋参照資産）===');
for (const r of rows.slice(0, 12)) {
  console.log(`  ${String(r.totalKb).padStart(5)}KB  (html ${r.htmlKb}KB)  ${r.page}`);
  if (r.heavy.length) console.log('           重い資産: ' + r.heavy.join(', '));
}

// 本番に配信されるが未参照の画像（git追跡済みのみ）
let tracked;
try {
  tracked = new Set(
    execSync('git ls-files public', { maxBuffer: 1e8 })
      .toString().split('\n').filter(Boolean)
      .map((f) => '/' + f.replace(/^public\//, ''))
  );
} catch {
  console.log('\n（git が使えないため未参照アセットの検査はスキップ）');
  process.exit(0);
}

const orphans = [...tracked]
  .filter((u) => IMAGE_RE.test(u) && !referenced.has(u))
  .map((u) => ({ u, kb: fs.existsSync('public' + u) ? Math.round(fs.statSync('public' + u).size / 1024) : 0 }))
  .sort((a, b) => b.kb - a.kb);

const totalMb = Math.round(orphans.reduce((s, o) => s + o.kb, 0) / 1024 * 10) / 10;
console.log(`\n=== 本番に配信されるが1ページからも参照されない画像 ===`);
console.log(`  ${orphans.length}件 / 合計 ${totalMb}MB  ※削除しない方針で確定済み（active-project-notes.md参照）`);
orphans.slice(0, 15).forEach((o) => console.log(`  ${String(o.kb).padStart(6)}KB  ${o.u}`));
