/**
 * ファビコンを正規ロゴから生成する。
 *
 * ★元画像は必ず public/images/logo.jpg（正規ロゴ）を使うこと。
 *   public/favicon.svg は「Mの出来損ない」に見える手描きの粗い近似で、
 *   会社ロゴではない。過去に2度、これを元にファビコンを作って事故になっている。
 *   そのため favicon.svg はリポジトリから削除済み。復活させないこと。
 *
 * Googleの検索結果用ファビコンは「48pxの倍数の正方形」が要件のため 48/96/144 を内包する。
 * ICO は Vista 以降 PNG を内包できるので、PNG を詰めた ICO を組み立てる。
 */
import fs from 'node:fs';
import sharp from 'sharp';

const SIZES = [48, 96, 144];
const SRC = 'public/images/logo.jpg';   // 正規ロゴ。favicon.svg を使ってはいけない
const OUT = 'public/favicon.ico';

const src = fs.readFileSync(SRC);
const meta = await sharp(src).metadata();

// ロゴは横長（800x524）。正方形の中央に、上下を白で埋めて配置する（案A：ロゴ全体）
const side = Math.round(Math.max(meta.width, meta.height) * 1.06);

// sharp は composite より先に resize を適用するため、正方形化と縮小は分けて行う
const square = await sharp({
  create: { width: side, height: side, channels: 3, background: { r: 255, g: 255, b: 255 } },
})
  .composite([{ input: src, gravity: 'center' }])
  .png()
  .toBuffer();

const pngs = [];
for (const s of SIZES) {
  const buf = await sharp(square)
    .resize(s, s, { kernel: 'lanczos3' })
    .png({ compressionLevel: 9 })
    .toBuffer();
  pngs.push({ size: s, buf });
}

const count = pngs.length;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);      // reserved
header.writeUInt16LE(1, 2);      // type = icon
header.writeUInt16LE(count, 4);  // image count

const entries = Buffer.alloc(16 * count);
let offset = 6 + 16 * count;
pngs.forEach((p, i) => {
  const o = i * 16;
  entries.writeUInt8(p.size >= 256 ? 0 : p.size, o + 0);  // width
  entries.writeUInt8(p.size >= 256 ? 0 : p.size, o + 1);  // height
  entries.writeUInt8(0, o + 2);          // palette
  entries.writeUInt8(0, o + 3);          // reserved
  entries.writeUInt16LE(1, o + 4);       // color planes
  entries.writeUInt16LE(32, o + 6);      // bits per pixel
  entries.writeUInt32LE(p.buf.length, o + 8);
  entries.writeUInt32LE(offset, o + 12);
  offset += p.buf.length;
});

fs.writeFileSync(OUT, Buffer.concat([header, entries, ...pngs.map((p) => p.buf)]));
console.log(`favicon.ico を生成: ${SIZES.join(' / ')}px  元画像=${SRC}`);
