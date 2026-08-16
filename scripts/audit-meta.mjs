/**
 * メタデータの整合性検査
 *
 * ビルド成果物（dist/）の全ページから title / description / canonical / h1 を抽出し、
 * 欠落・重複・長さ超過を検出する。SEO上の地味だが効く不整合を機械的に潰すためのもの。
 *
 * 使い方:
 *   npx astro build && node scripts/audit-meta.mjs
 *
 * 期待結果: title重複0 / description欠落・重複0 / canonical欠落・重複0 / h1異常0
 * ※ description が空文字（""）だと content 空のmetaが出るので「欠落」として検出される
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const SITE = 'https://www.masakiyo-denki.com';
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

const pick = (h, re) => {
  const m = h.match(re);
  return m ? m[1].trim() : null;
};

const rows = files.map((f) => {
  const h = fs.readFileSync(f, 'utf8');
  return {
    page: '/' + path.relative(DIST, f).split(path.sep).join('/').replace(/index\.html$/, ''),
    title: pick(h, /<title>([^<]*)<\/title>/),
    desc: pick(h, /<meta name="description" content="([^"]*)"/),
    canon: pick(h, /<link rel="canonical" href="([^"]*)"/),
    h1: (h.match(/<h1[\s>]/g) || []).length,
  };
});

const dup = (key) => {
  const m = new Map();
  for (const r of rows) {
    const v = r[key];
    if (!v) continue;
    if (!m.has(v)) m.set(v, []);
    m.get(v).push(r.page);
  }
  return [...m.entries()].filter(([, v]) => v.length > 1);
};

const section = (label, lines) => {
  console.log(`\n=== ${label} ===`);
  lines.forEach((l) => console.log('  ' + l));
};

console.log('総ページ数:', rows.length);
section('title 重複', dup('title').map(([v, p]) => `"${v.slice(0, 50)}" × ${p.length}: ${p.slice(0, 4).join(', ')}`));
section('description 欠落', rows.filter((r) => !r.desc).map((r) => r.page));
section('description 重複', dup('desc').map(([v, p]) => `"${v.slice(0, 45)}..." × ${p.length}: ${p.slice(0, 4).join(', ')}`));
section('canonical 欠落', rows.filter((r) => !r.canon).map((r) => r.page));
section('canonical 重複（別ページが同一canonicalを指す）', dup('canon').map(([v, p]) => `${v} × ${p.length}: ${p.join(', ')}`));
section('h1 が 1個でないページ', rows.filter((r) => r.h1 !== 1).map((r) => `h1=${r.h1}  ${r.page}`));
section('title が長い（60字超）', rows.filter((r) => r.title && r.title.length > 60)
  .sort((a, b) => b.title.length - a.title.length).slice(0, 8).map((r) => `${r.title.length}字  ${r.page}`));

const norm = (s) => s.replace(/\/$/, '') || '/';
section('canonical が自ページURLと不一致', rows
  .filter((r) => r.canon && norm(r.canon) !== norm(SITE + (r.page === '/' ? '/' : r.page)))
  .map((r) => `${r.page}  →  ${r.canon}`));
