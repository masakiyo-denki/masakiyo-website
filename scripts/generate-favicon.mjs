/**
 * favicon.svg（自社Mロゴ）から マルチサイズ .ico を生成する。
 *
 * Googleの検索結果用ファビコンは「48pxの倍数の正方形」が要件。
 * 現行の favicon.ico は Astro テンプレート既定のロゴ（32x32）のままだった。
 *
 * ICO は Vista 以降 PNG を内包できるので、PNG を詰めた ICO を組み立てる。
 */
import fs from 'node:fs';
import sharp from 'sharp';

const SIZES = [48, 96, 144];           // すべて48の倍数
const SRC = 'public/favicon.svg';
const OUT = 'public/favicon.ico';

const svg = fs.readFileSync(SRC);

// SVGは余白なしのMロゴなので、正方形に収めつつ白背景を敷く
const pngs = [];
for (const s of SIZES) {
  const buf = await sharp(svg, { density: 384 })
    .resize(s, s, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
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

const ico = Buffer.concat([header, entries, ...pngs.map(p => p.buf)]);
fs.writeFileSync(OUT, ico);
console.log(`favicon.ico を生成: ${SIZES.join(' / ')}px の3サイズ内包  ${Math.round(ico.length / 1024)}KB`);
