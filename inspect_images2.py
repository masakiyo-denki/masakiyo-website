import requests, re

url = 'https://www.masakiyo-denki.com/post/%E6%96%B0%E3%83%BB%E3%83%91%E3%83%8A%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B9%E3%82%BF%E3%83%BC%E3%83%88%E3%81%AE%E3%81%8A%E7%9F%A5%E3%82%89%E3%81%9B'
r = requests.get(url, timeout=20, headers={'User-Agent': 'Mozilla/5.0'})
html = r.text

# ページ内で「related」「あわせて」「関連」が出現する位置を探す
related_pos = len(html)
for kw in ['related', 'あわせて', 'Related Post', 'recentPost', 'relatedPost']:
    pos = html.find(kw)
    if pos > 0 and pos < related_pos:
        related_pos = pos

print(f'ページ全体長: {len(html)}')
print(f'関連記事セクション開始推定位置: {related_pos}')

EXCLUDE = {
    '947e062e26ee4ab69fb6ada4b5a87ea8',
    '7fe08b5af0ef434e8549f7b4956ed75a',
    'e825e4cccb084c988ad2f501c0fdfdd6',
    'c273e89646414c9a8e15aef8cb83efa0',
    '7a8f8cddc6384225aa85817896011e11',
    '3bc0891c5fac4d6b8323c8216bf1fb94',
}

og_hash = ''
og = re.search(r'og:image[^>]*content="([^"]+)"', html)
if og:
    m2 = re.search(r'16b3e3_([a-f0-9]{32})', og.group(1))
    if m2: og_hash = m2.group(1)

all_imgs = list(re.finditer(r'16b3e3_([a-f0-9]{32})~mv2', html))
seen = set()
print('\n各画像の出現位置:')
for m in all_imgs:
    h = m.group(1)
    if h in EXCLUDE or h in seen: continue
    seen.add(h)
    pos = m.start()
    in_body = pos < related_pos
    print(f'  {h[:16]}... pos={pos} in_body={in_body} is_og={h==og_hash}')

# og:image以外でrelated_posより前に出現するハッシュ = 本文内画像
body_imgs = []
seen2 = set()
for m in all_imgs:
    h = m.group(1)
    if h in EXCLUDE or h in seen2 or h == og_hash: continue
    seen2.add(h)
    if m.start() < related_pos:
        body_imgs.append(h)

print(f'\n本文内追加画像: {body_imgs}')
