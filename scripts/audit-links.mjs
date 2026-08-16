/**
 * サイト全体のリンク検査
 *
 * ビルド成果物（dist/）の全HTMLから href/src の内部リンクを集めて検査する。
 *   1) リンク切れ    … 飛び先の実体が dist に無いもの
 *   2) アンカー切れ  … #id の飛び先に該当 id が無いもの
 *   3) 孤立ページ    … どこからも張られていないページ（被リンク0）
 *
 * 3) を入れてある理由: 1) は「張ったリンクが切れていないか」しか見ないため、
 * 「張るべきリンクが無い」ケースを取りこぼす。実際に /case-housing が
 * どこからもリンクされないまま公開されていた（2026-08-16に発見・解消）。
 *
 * 使い方:
 *   npx astro build && node scripts/audit-links.mjs
 *
 * 期待結果: リンク切れ0 / アンカー切れ0 / 孤立は /404.html のみ
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
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

/** dist 上に実体（ファイル / ディレクトリ内index.html / .html）があるか */
const exists = (u) => {
  const q = decodeURIComponent(u.replace(/[?#].*$/, ''));
  return (
    fs.existsSync(path.join(DIST, q)) ||
    fs.existsSync(path.join(DIST, q, 'index.html')) ||
    fs.existsSync(path.join(DIST, q.replace(/\/$/, '') + '.html'))
  );
};

const pageOf = (f) =>
  '/' + path.relative(DIST, f).split(path.sep).join('/').replace(/index\.html$/, '');

/** ページURLを末尾スラッシュ付きに正規化して被リンク集計のキーにする */
const norm = (u) => {
  let p = u.replace(/[?#].*$/, '');
  if (!p.endsWith('/')) p += '/';
  return p === '//' ? '/' : p;
};

const bad = new Map();
const anchors = new Map();
const inbound = new Map(files.map((f) => [norm(pageOf(f)), new Set()]));
let total = 0;

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const page = pageOf(f);

  for (const m of html.matchAll(/(?:href|src)="([^"]*)"/g)) {
    const u = m[1];
    if (!u.startsWith('/') || u.startsWith('//')) continue;
    total++;
    if (!exists(u)) {
      if (!bad.has(u)) bad.set(u, new Set());
      bad.get(u).add(page);
    }
    // 自ページへのリンクは被リンクに数えない
    const target = norm(decodeURIComponent(u));
    if (inbound.has(target) && target !== norm(page)) inbound.get(target).add(page);
  }

  for (const m of html.matchAll(/href="(\/[^"#]*)#([^"]+)"/g)) {
    const key = m[1] + '#' + m[2];
    if (!anchors.has(key)) anchors.set(key, new Set());
    anchors.get(key).add(page);
  }
}

console.log('HTMLページ数:', files.length);
console.log('内部リンク総数:', total);
console.log('リンク切れ:', bad.size, '種');
[...bad.entries()]
  .sort((a, b) => b[1].size - a[1].size)
  .forEach(([u, s]) =>
    console.log(`  ${u}  ← ${s.size}ページ (${[...s].slice(0, 3).join(', ')})`)
  );

console.log('\n--- アンカー付きリンクの検証 ---');
for (const [key, from] of anchors) {
  const [p, frag] = key.split('#');
  const target = path.join(DIST, p.replace(/\/$/, ''), 'index.html');
  if (!fs.existsSync(target)) {
    console.log('  [対象ページ無し] ' + key);
    continue;
  }
  if (!fs.readFileSync(target, 'utf8').includes(`id="${frag}"`)) {
    console.log(`  [id無し] ${key}  ← ${[...from].slice(0, 2).join(', ')}`);
  }
}

// --- 孤立ページ・被リンクの薄いページ ---
// /404.html はどこからも張られないのが正常なので除外する（norm() 後の形で比較）
const IGNORE = new Set(['/404.html/', '/404/']);
const ranked = [...inbound.entries()]
  .filter(([p]) => !IGNORE.has(p))
  .map(([p, s]) => ({ p, n: s.size, from: [...s] }))
  .sort((a, b) => a.n - b.n);

const orphans = ranked.filter((r) => r.n === 0);
console.log('\n--- 孤立ページ（被リンク0）---');
if (orphans.length === 0) {
  console.log('  なし');
} else {
  orphans.forEach((r) => console.log('  ' + r.p));
  console.log('  ※ サイト内のどこからも辿り着けません。導線を張るか、意図的なら理由を記録してください');
}

console.log('\n--- 被リンクが少ないページ TOP8（記事は一覧から1本が正常）---');
ranked.slice(0, 8).forEach((r) =>
  console.log(`  ${String(r.n).padStart(3)}本  ${r.p}${r.n && r.n <= 3 ? '   ← ' + r.from.join(', ') : ''}`)
);

process.exit(bad.size || orphans.length ? 1 : 0);
