"""
1. 汎用プレースホルダー画像（全て同一MD5）が設定されたheroImageをMDから削除
2. 旧命名（-1.jpg/-2.jpg、-body-なし）の不要なbody-imageファイルを削除
"""
import os, re, hashlib

BLOG_DIR = r"C:\Users\silva\Desktop\New_HP_PJ\masakiyo-denki\src\content\blog"
IMG_DIR  = r"C:\Users\silva\Desktop\New_HP_PJ\masakiyo-denki\public\images\blog"

# 汎用プレースホルダー画像のMD5
GENERIC_MD5 = "D24FA92824CF7D167BA335B62FCDCA52"

def file_md5(path):
    try:
        with open(path, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest().upper()
    except:
        return None


# STEP 1: 汎用heroImageをMDから削除
print("STEP 1: 汎用heroImageをMDから削除...")
removed_hero = []
for fname in os.listdir(BLOG_DIR):
    if not fname.endswith('.md'):
        continue
    slug = fname[:-3]
    md_path = os.path.join(BLOG_DIR, fname)
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    m = re.search(r'^heroImage:\s*"(/images/blog/[^"]+)"', content, re.MULTILINE)
    if not m:
        continue

    img_ref = m.group(1)  # e.g. /images/blog/blog-gw-2024.jpg
    img_filename = img_ref.lstrip('/')
    img_path = os.path.join(r"C:\Users\silva\Desktop\New_HP_PJ\masakiyo-denki\public", img_filename)

    if file_md5(img_path) == GENERIC_MD5:
        # heroImageを削除
        new_content = re.sub(r'^heroImage:.*\n', '', content, flags=re.MULTILINE)
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        removed_hero.append(slug)
        print(f"  [{slug}] heroImage削除: {img_ref}")

print(f"  計 {len(removed_hero)} 記事のheroImageを削除\n")


# STEP 2: 旧命名の不要なbody-imageファイルを削除
# パターン: blog-{slug}-N.ext (Nは数字) かつ -body- を含まない
print("STEP 2: 旧命名の不要なbody-imageファイルを削除...")
deleted = []
for fname in os.listdir(IMG_DIR):
    # -body- が含まれない、かつ末尾が -N.ext の形式（N = 数字）
    if '-body-' in fname:
        continue
    m = re.match(r'^(blog-.+)-(\d+)\.(jpg|jpeg|png|gif|webp)$', fname, re.IGNORECASE)
    if not m:
        continue

    # まだMDで参照されているか確認
    img_ref = f"/images/blog/{fname}"
    referenced = False
    for md_file in os.listdir(BLOG_DIR):
        if not md_file.endswith('.md'):
            continue
        md_path = os.path.join(BLOG_DIR, md_file)
        with open(md_path, 'r', encoding='utf-8') as f:
            if img_ref in f.read():
                referenced = True
                break

    if not referenced:
        fpath = os.path.join(IMG_DIR, fname)
        os.remove(fpath)
        deleted.append(fname)
        print(f"  削除: {fname}")

print(f"  計 {len(deleted)} ファイル削除\n")

# STEP 3: 汎用プレースホルダー画像ファイル自体を削除
print("STEP 3: 汎用プレースホルダー画像ファイルを削除...")
for fname in os.listdir(IMG_DIR):
    fpath = os.path.join(IMG_DIR, fname)
    if os.path.isfile(fpath) and file_md5(fpath) == GENERIC_MD5:
        # まだMDで参照されているか確認
        img_ref = f"/images/blog/{fname}"
        referenced = any(
            img_ref in open(os.path.join(BLOG_DIR, md), 'r', encoding='utf-8').read()
            for md in os.listdir(BLOG_DIR) if md.endswith('.md')
        )
        if not referenced:
            os.remove(fpath)
            print(f"  削除: {fname}")

print("\n完了")
