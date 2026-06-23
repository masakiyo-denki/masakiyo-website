"""
文字化けした2つのMDファイルをWixから再取得して修正
"""
import requests, re, os

BLOG_DIR = r"C:\Users\silva\Desktop\New_HP_PJ\masakiyo-denki\src\content\blog"
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

TARGETS = [
    {
        "slug": "all-denka-fair-2019",
        "url": "https://www.masakiyo-denki.com/post/オール電化フェア-開催",
        "heroImage": "/images/blog/blog-all-denka-fair-2019.jpg",
        "body_images": ["/images/blog/blog-all-denka-fair-2019-body-1.png"],
        "date": "2019-09-22",
    },
    {
        "slug": "shonene-hojo-2025",
        "url": "https://www.masakiyo-denki.com/post/令和7年度（2025年度）熊本市省エネルギー機器等導入推進事業補助金のお知らせ",
        "heroImage": "/images/blog/blog-shonene-hojo-2025.jpg",
        "body_images": [],
        "date": "2025-04-01",
    },
]

for t in TARGETS:
    slug = t["slug"]
    print(f"\n処理中: {slug}")

    try:
        r = requests.get(t["url"], timeout=20, headers=HEADERS)
        html = r.text
    except Exception as e:
        print(f"  FETCH ERROR: {e}")
        continue

    # タイトル
    title_m = re.search(r'<h1[^>]*>([^<]+)</h1>', html)
    title = title_m.group(1).strip() if title_m else slug

    # og:description
    desc_m = re.search(r'name=["\']description["\'][^>]*content=["\']([^"\']+)', html)
    if not desc_m:
        desc_m = re.search(r'content=["\']([^"\']{10,200})["\'][^>]*name=["\']description["\']', html)
    description = desc_m.group(1).strip() if desc_m else ""

    # 本文テキスト（p タグから抽出）
    paras = re.findall(r'<p[^>]*class="[^"]*font_8[^"]*"[^>]*>(.*?)</p>', html, re.DOTALL)
    body_lines = []
    for p in paras:
        text = re.sub(r'<[^>]+>', '', p).strip()
        if text and len(text) > 3:
            body_lines.append(text)

    body_text = '\n\n'.join(body_lines) if body_lines else "詳細はお問い合わせください。"

    # MDを組み立て
    hero_line = f'heroImage: "{t["heroImage"]}"' if t["heroImage"] else ""
    frontmatter = f'''---
title: "{title}"
date: {t["date"]}
description: "{description[:120]}"
{hero_line}
---

{body_text}'''

    if t["body_images"]:
        frontmatter += '\n\n<!-- body-images -->\n'
        for img in t["body_images"]:
            frontmatter += f'\n![]({img})\n'

    md_path = os.path.join(BLOG_DIR, f"{slug}.md")
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(frontmatter)

    print(f"  タイトル: {title}")
    print(f"  本文: {len(body_lines)}段落")
    print(f"  保存完了: {slug}.md")
