/**
 * サイト全体のリンク切れ検査
 *
 * ビルド成果物（dist/）の全HTMLから href/src の内部リンクを集め、
 * 実体が存在するかを照合する。アンカー（#id）の飛び先も検証する。
 *
 * 使い方:
 *   npx astro build && node scripts/audit-links.mjs
 *
 * 期待結果: 「リンク切れ: 0 種」
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

const bad = new Map();
const anchors = new Map();
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

process.exit(bad.size ? 1 : 0);
