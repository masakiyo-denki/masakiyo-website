import requests, re

url = 'https://www.masakiyo-denki.com/post/%E6%96%B0%E3%83%BB%E3%83%91%E3%83%8A%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B9%E3%82%BF%E3%83%BC%E3%83%88%E3%81%AE%E3%81%8A%E7%9F%A5%E3%82%89%E3%81%9B'
r = requests.get(url, timeout=20, headers={'User-Agent': 'Mozilla/5.0'})
html = r.text

EXCLUDE = {
    '947e062e26ee4ab69fb6ada4b5a87ea8',
    '7fe08b5af0ef434e8549f7b4956ed75a',
    'e825e4cccb084c988ad2f501c0fdfdd6',
    'c273e89646414c9a8e15aef8cb83efa0',
    '7a8f8cddc6384225aa85817896011e11',
    '3bc0891c5fac4d6b8323c8216bf1fb94',
}

# og:image
og = re.search(r'og:image[^>]*content="([^"]+)"', html)
if not og:
    og = re.search(r'content="([^"]+)"[^>]*og:image', html)
og_hash = ''
if og:
    m2 = re.search(r'16b3e3_([a-f0-9]{32})', og.group(1))
    if m2:
        og_hash = m2.group(1)
        print('og:image hash:', og_hash)

# 全画像ハッシュ
all_imgs = list(re.finditer(r'16b3e3_([a-f0-9]{32})~mv2\.(\w+)', html))
seen = set()
print('\n全画像ハッシュ（重複除く）:')
for m in all_imgs:
    h, ext = m.group(1), m.group(2)
    if h in EXCLUDE or h in seen:
        continue
    seen.add(h)
    start = max(0, m.start() - 100)
    ctx = html[start:m.end() + 30]
    print(f'  {h}.{ext}')
    # w_xxx h_xxx を探す
    sizes = re.findall(r'[wh]_\d+', ctx)
    print(f'    sizes: {sizes}')
    print(f'    is_og: {h == og_hash}')
