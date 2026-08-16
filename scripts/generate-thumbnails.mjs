/**
 * ブログ一覧（/blog）のサムネイル生成
 *
 * 一覧のサムネは 176x112（PC）／最大 343px 幅（モバイル）でしか表示されないのに、
 * 元画像は最大1600px幅ある。そのまま配信すると一覧ページだけで12MB超になるため、
 * 480px幅のサムネを別途生成して一覧ではそちらを参照する。
 *
 * - 出力先: public/images/thumb/... （元のパス構造をミラーする）
 * - blog/index.astro は thumb が無ければ元画像にフォールバックするので、
 *   記事を追加してこのスクリプトを流し忘れても表示は壊れない
 *
 * 使い方: node scripts/generate-thumbnails.mjs
 * 記事を追加・heroImageを差し替えたら実行して、生成物ごとコミットすること。
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const WIDTH = 480;
const QUALITY = 78;
const BLOG_DIR = 'src/content/blog';
const PUBLIC = 'public';
const OUT_ROOT = path.join(PUBLIC, 'images', 'thumb');

/** frontmatter から heroImage / image を拾う */
function collectSources() {
  const set = new Set();
  for (const f of fs.readdirSync(BLOG_DIR)) {
    if (!f.endsWith('.md')) continue;
    // BOM付き・CRLFのままだと ^---$ が一致せず frontmatter を取り出せないので正規化する
    const text = fs.readFileSync(path.join(BLOG_DIR, f), 'utf8')
      .replace(/^﻿/, '')
      .replace(/\r\n/g, '\n');
    const fm = text.split(/^---$/m)[1];
    if (!fm) continue;
    for (const m of fm.matchAll(/^(?:heroImage|image):\s*["']?(\/[^"'\s]+)["']?\s*$/gm)) {
      set.add(m[1]);
    }
  }
  return [...set];
}

/** /images/blog/foo.png -> public/images/thumb/blog/foo.jpg */
export function thumbPathFor(src) {
  const rel = src.replace(/^\/images\//, '').replace(/\.[^.]+$/, '.jpg');
  return path.join(OUT_ROOT, rel);
}

const sources = collectSources();
let made = 0, skipped = 0, missing = 0, before = 0, after = 0;

for (const src of sources) {
  const input = path.join(PUBLIC, src.replace(/^\//, ''));
  if (!fs.existsSync(input)) { console.warn('  [元画像なし] ' + src); missing++; continue; }
  // GIF はアニメーションが失われるため対象外
  if (/\.gif$/i.test(src)) { skipped++; continue; }

  const out = thumbPathFor(src);
  const inStat = fs.statSync(input);
  if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= inStat.mtimeMs) { skipped++; continue; }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  const buf = fs.readFileSync(input);
  const meta = await sharp(buf).metadata();
  const data = await sharp(buf)
    .resize({ width: Math.min(meta.width, WIDTH), withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toBuffer();
  fs.writeFileSync(out, data);
  before += inStat.size; after += data.length; made++;
}

const mb = (n) => Math.round(n / 1048576 * 10) / 10 + 'MB';
console.log(`サムネイル生成: ${made}件 (スキップ ${skipped} / 元画像なし ${missing})`);
if (made) console.log(`  ${mb(before)} → ${mb(after)}`);
