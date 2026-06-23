"""
全ブログ画像を最大1200pxにリサイズ（超高解像度画像の圧縮）
"""
from PIL import Image
import os, sys

IMG_DIR = r"C:\Users\silva\Desktop\New_HP_PJ\masakiyo-denki\public\images\blog"
MAX_SIZE = 1200
QUALITY = 85
MIN_BYTES = 300_000  # 300KB以上のみ処理

count = 0
for fname in sorted(os.listdir(IMG_DIR)):
    if not fname.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
        continue

    fpath = os.path.join(IMG_DIR, fname)
    if os.path.getsize(fpath) < MIN_BYTES:
        continue

    try:
        img = Image.open(fpath)
        w, h = img.size

        if w <= MAX_SIZE and h <= MAX_SIZE:
            img.close()
            continue

        # リサイズ
        img.thumbnail((MAX_SIZE, MAX_SIZE), Image.LANCZOS)
        nw, nh = img.size

        # JPEGで保存（元ファイルを上書き、PNG→JPG変換も実施）
        base = os.path.splitext(fname)[0]
        out_path = os.path.join(IMG_DIR, base + ".jpg")

        if img.mode in ('RGBA', 'P', 'LA'):
            bg = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            bg.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = bg
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        img.save(out_path, 'JPEG', quality=QUALITY, optimize=True)

        # 元がPNGで拡張子が変わった場合は削除
        if fpath != out_path and os.path.exists(fpath):
            os.remove(fpath)

        new_kb = os.path.getsize(out_path) // 1024
        old_kb = os.path.getsize(fpath) // 1024 if fpath == out_path else "→deleted"
        print(f"  {fname}: {w}x{h} → {nw}x{nh} ({new_kb}KB)")
        count += 1

    except Exception as e:
        print(f"  ERROR {fname}: {e}")

print(f"\n完了: {count}枚リサイズ")
