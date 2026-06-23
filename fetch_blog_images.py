"""
旧サイト全ブログ記事のog:imageを取得してダウンロードし、
MDファイルのfrontmatterにheroImageを追加する
"""
import requests, re, os, time

BLOG_DIR = r"C:\Users\silva\Desktop\New_HP_PJ\masakiyo-denki\src\content\blog"
IMG_DIR  = r"C:\Users\silva\Desktop\New_HP_PJ\masakiyo-denki\public\images\blog"
os.makedirs(IMG_DIR, exist_ok=True)

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

# サイトロゴのハッシュ（除外）
LOGO_HASH = "947e062e26ee4ab69fb6ada4b5a87ea8"

# URL → MDスラグ のマッピング
ARTICLES = [
    ("https://www.masakiyo-denki.com/post/秋のグランメッセフェア-開催",         "aki-granmesse-2019"),
    ("https://www.masakiyo-denki.com/post/エアコンキャッシュバックキャンペーン",  "aircon-cashback-2022"),
    ("https://www.masakiyo-denki.com/post/新年のご挨拶",                        "shinnen-2024"),
    ("https://www.masakiyo-denki.com/post/プレゼントに最適！携帯次亜塩素酸除菌スプレー", "jiaenso-spray-2021"),
    ("https://www.masakiyo-denki.com/post/_open",                              "site-open-2019"),
    ("https://www.masakiyo-denki.com/post/２０２６春の合同展示会のご案内",       "tenrankai-2026spring"),
    ("https://www.masakiyo-denki.com/post/年末年始の営業について-1",             "nenmatsu-2025"),
    ("https://www.masakiyo-denki.com/post/春のグランメッセフェアのお知らせ",      "haru-granmesse-2022"),
    ("https://www.masakiyo-denki.com/post/年末年始の営業について-2",             "nenmatsu-2024"),
    ("https://www.masakiyo-denki.com/post/ihクッキングヒーターキャンペーン",      "ih-campaign-2021"),
    ("https://www.masakiyo-denki.com/post/震災による店舗移転のお知らせ",         "ten-iten-2019"),
    ("https://www.masakiyo-denki.com/post/オール電化フェア-開催",               "all-denka-fair-2019"),
    ("https://www.masakiyo-denki.com/post/いよいよ明日から開催！合同展示会よかばい熊本サクラまつり", "sakura-matsuri-pre-2024"),
    ("https://www.masakiyo-denki.com/post/lumix-g9pro-発売記念キャッシュバックキャンペーン", "lumix-g9pro-2023"),
    ("https://www.masakiyo-denki.com/post/パナソニックホームビューイングキャンペーン-最大７万円キャッシュバック", "home-viewing-2020"),
    ("https://www.masakiyo-denki.com/post/ビエラmz2500デビューキャッシュバックキャンペーンのお知らせ", "viera-mz2500-2023"),
    ("https://www.masakiyo-denki.com/post/「くまもと経済」2025年9月号に掲載されました", "kumamoto-keizai-2025"),
    ("https://www.masakiyo-denki.com/post/福は家まつり-お知らせ",               "fukuwa-matsuri-2020"),
    ("https://www.masakiyo-denki.com/post/年末年始の営業について-3",             "nenmatsu-2023"),
    ("https://www.masakiyo-denki.com/post/新年のご挨拶-2",                     "shinnen-2026"),
    ("https://www.masakiyo-denki.com/post/熊本市商品券とキャッシュレス対応について", "kumamoto-shokken-2019"),
    ("https://www.masakiyo-denki.com/post/夏のパナソニックフェアキャンペーンのお知らせ", "summer-fair-campaign-2023"),
    ("https://www.masakiyo-denki.com/post/冷蔵庫さきどりセールのお知らせ",       "reizoko-sakidori-2024"),
    ("https://www.masakiyo-denki.com/post/kumamotoアトツギベンチャーday2025",   "atotsugi-2025"),
    ("https://www.masakiyo-denki.com/post/「shop-small」-amexのお支払いで30-キャッシュバック", "shopsmall-amex-2020"),
    ("https://www.masakiyo-denki.com/post/秋のグランメッセフェア開催決定！",     "aki-granmesse-2021"),
    ("https://www.masakiyo-denki.com/post/2018年度-優良販売店-表彰式",          "yuryo-hanbaten-2019"),
    ("https://www.masakiyo-denki.com/post/期間限定パナカード決済キャッシュバックキャンペーン", "panacard-cashback-2024"),
    ("https://www.masakiyo-denki.com/post/防犯対策キャンペーンのお知らせ",       "bohan-campaign-2023"),
    ("https://www.masakiyo-denki.com/post/衣類乾燥機除湿機-交換・引き取りのお知らせ", "kanso-kijo-recall-2023"),
    ("https://www.masakiyo-denki.com/post/おうちごはんキャンペーン",             "ouchi-gohan-2022"),
    ("https://www.masakiyo-denki.com/post/令和7年度（2025年度）熊本市省エネルギー機器等導入推進事業補助金のお知らせ", "shonene-hojo-2025"),
    ("https://www.masakiyo-denki.com/post/夏季休業日（お盆休み）のお知らせ-1",  "obon-2025"),
    ("https://www.masakiyo-denki.com/post/ジェットウォッシャー-超音波水流モデル100万台感謝キャンペーン", "jetwasher-2025"),
    ("https://www.masakiyo-denki.com/post/gw期間中の営業について",              "gw-2024"),
    ("https://www.masakiyo-denki.com/post/エアコンクリーニングのご案内-1",       "aircon-cleaning-2022"),
    ("https://www.masakiyo-denki.com/post/お盆期間営業日のご案内",              "obon-2024"),
    ("https://www.masakiyo-denki.com/post/おうちごはんキャンペーンのお知らせ-1", "ouchi-gohan-2023"),
    ("https://www.masakiyo-denki.com/post/秋の大感謝祭開催！",                  "daikansha-2024"),
    ("https://www.masakiyo-denki.com/post/ジャー炊飯器キャッシュバックキャンペーン", "jar-suihanki-2021"),
    ("https://www.masakiyo-denki.com/post/冷蔵庫買替え祭りキャンペーン",         "reizoko-matsuri-2023"),
    ("https://www.masakiyo-denki.com/post/おうちごはんキャンペーンのお知らせ",   "ouchi-gohan-2020"),
    ("https://www.masakiyo-denki.com/post/新年のご挨拶-1",                     "shinnen-2025"),
    ("https://www.masakiyo-denki.com/post/夏季休業日（お盆休み）のお知らせ",    "obon-2023"),
    ("https://www.masakiyo-denki.com/post/「熊本日日新聞」2026年3月20日に掲載されました", "kumamoto-nichinichi-2026"),
    ("https://www.masakiyo-denki.com/post/住宅省エネ2025キャンペーンスタートのお知らせ", "shonene-2025"),
    ("https://www.masakiyo-denki.com/post/適格請求書発行事業者登録番号のご案内", "invoice-2023"),
    ("https://www.masakiyo-denki.com/post/秋の大感謝祭開催！-1",               "haru-kaitekifair-2025"),
    ("https://www.masakiyo-denki.com/post/ナノケアドライヤーキャンペーン",       "nano-care-2024"),
    ("https://www.masakiyo-denki.com/post/新・パナカードスタートのお知らせ",     "new-pana-card"),
    ("https://www.masakiyo-denki.com/post/ワイヤレス商品旧スプリアス規格製品に関するお知らせ", "spurious-2022"),
    ("https://www.masakiyo-denki.com/post/おうちごはんキャンペーン-1",          "ouchi-gohan-2024"),
    ("https://www.masakiyo-denki.com/post/お盆休みのお知らせ",                  "obon-2022"),
    ("https://www.masakiyo-denki.com/post/ドアホン＆宅配ボックスキャンペーンのお知らせ", "doorphone-2021"),
    ("https://www.masakiyo-denki.com/post/家庭用生ごみ処理機についてのご案内",   "namagomi-2024"),
    ("https://www.masakiyo-denki.com/post/夏のパナソニックフェア開催のお知らせ", "summer-fair-2025"),
    ("https://www.masakiyo-denki.com/post/テレビ出演のお知らせ（kab「月刊！くまもと情報ステーション」11-8）", "tv-kab-2025"),
    ("https://www.masakiyo-denki.com/post/夏のパナソニックフェアのお知らせ",     "summer-fair-2024"),
    ("https://www.masakiyo-denki.com/post/エアコンクリーニングのご案内",         "aircon-cleaning-2020"),
    ("https://www.masakiyo-denki.com/post/「読売新聞」2025年9月26日に掲載されました", "yomiuri-2025"),
    ("https://www.masakiyo-denki.com/post/クリーンドックのあるコードレス掃除機デビューキャンペーン", "cleandock-2023"),
    ("https://www.masakiyo-denki.com/post/こどもみらい住宅支援事業のご案内",     "kodomo-mirai-2022"),
    ("https://www.masakiyo-denki.com/post/住宅省エネ2024キャンペーンスタートのお知らせ", "shonene-2024"),
    ("https://www.masakiyo-denki.com/post/合同展示会-よかばい熊本サクラまつりのご案内", "sakura-matsuri-2024"),
    ("https://www.masakiyo-denki.com/post/１０月１４日会社説明会開催します",     "setsumeikai-2025"),
    ("https://www.masakiyo-denki.com/post/冷蔵庫キャッシュバックキャンペーン",   "reizoko-cashback-2022"),
    ("https://www.masakiyo-denki.com/post/「企業診断くまもと」2025年号にて紹介いただきました", "kigyoshinkumu-2025"),
    ("https://www.masakiyo-denki.com/post/価格改定のお知らせ",                  "kakaku-kaitei-2022"),
    ("https://www.masakiyo-denki.com/post/春のおうち快適フェア",                "haru-fair-cancel-2022"),
    ("https://www.masakiyo-denki.com/post/電池商品キャンペーン",                "denchi-2023"),
    ("https://www.masakiyo-denki.com/post/年末年始の営業について",              "nenmatsu-2022"),
    ("https://www.masakiyo-denki.com/post/パナカード限定！冷蔵庫・掃除機キャッシュバックキャンペーン", "panacard-reizoko-2024"),
    # 追加（サイトマップに含まれていたもの）
    ("https://www.masakiyo-denki.com/post/新年のご挨拶-2",                     "shinnen-2026"),  # dup check
]

def get_og_image(url):
    """og:imageからカバー画像URLを取得"""
    try:
        r = requests.get(url, timeout=20, headers=HEADERS)
        if r.status_code != 200:
            return None, f"HTTP {r.status_code}"
        html = r.text
        # og:image
        m = re.search(r'property=["\']og:image["\'][^>]*content=["\']([^"\']+)', html)
        if not m:
            m = re.search(r'content=["\']([^"\']+)["\'][^>]*property=["\']og:image["\']', html)
        if m:
            img_url = m.group(1)
            # ロゴチェック
            if LOGO_HASH in img_url:
                return None, "ロゴ画像のみ（記事固有画像なし）"
            return img_url, None
        return None, "og:imageなし"
    except Exception as e:
        return None, str(e)

def get_full_res_url(wix_url):
    """wixstatic URLからフルサイズURLを生成"""
    # ハッシュ部分を抽出
    m = re.search(r'(16b3e3_[a-f0-9]{32}~mv2\.\w+)', wix_url)
    if m:
        return f"https://static.wixstatic.com/media/{m.group(1)}"
    return wix_url

def download_image(url, dest_path):
    """画像をダウンロード"""
    try:
        r = requests.get(url, timeout=30, headers=HEADERS)
        if r.status_code == 200:
            with open(dest_path, 'wb') as f:
                f.write(r.content)
            return True, len(r.content)
        return False, f"HTTP {r.status_code}"
    except Exception as e:
        return False, str(e)

def update_md_heroimage(slug, img_path_rel):
    """MDファイルのfrontmatterにheroImageを追加"""
    md_path = os.path.join(BLOG_DIR, f"{slug}.md")
    if not os.path.exists(md_path):
        return False, f"MDファイルなし: {slug}.md"
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()
    # すでにheroImageがあればスキップ
    if 'heroImage:' in content:
        return False, "heroImage既存"
    # frontmatter内のdescription行の後にheroImageを挿入
    new_content = re.sub(
        r'(description: ".*?")',
        f'\\1\nheroImage: "{img_path_rel}"',
        content,
        count=1
    )
    if new_content == content:
        return False, "frontmatter更新失敗"
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    return True, "OK"

# 重複を除去
seen_slugs = set()
unique_articles = []
for url, slug in ARTICLES:
    if slug not in seen_slugs:
        seen_slugs.add(slug)
        unique_articles.append((url, slug))

print(f"処理対象: {len(unique_articles)} 記事\n")

results = []
for i, (url, slug) in enumerate(unique_articles):
    print(f"[{i+1}/{len(unique_articles)}] {slug}", end=" ... ", flush=True)

    # og:image取得
    og_url, err = get_og_image(url)
    if not og_url:
        print(f"SKIP ({err})")
        results.append((slug, None, err))
        time.sleep(0.3)
        continue

    # フルサイズURL生成
    full_url = get_full_res_url(og_url)

    # ハッシュ取得（ファイル名用）
    m = re.search(r'16b3e3_([a-f0-9]{32})~mv2\.(\w+)', full_url)
    if not m:
        print(f"SKIP (URL parse失敗: {full_url})")
        results.append((slug, None, "URL parse失敗"))
        time.sleep(0.3)
        continue

    ext = m.group(2).lower()
    img_filename = f"blog-{slug}.{ext}"
    img_dest = os.path.join(IMG_DIR, img_filename)
    img_path_rel = f"/images/blog/{img_filename}"

    # ダウンロード（既存はスキップ）
    if os.path.exists(img_dest):
        print(f"既存スキップ → {img_filename}")
    else:
        ok, info = download_image(full_url, img_dest)
        if ok:
            print(f"DL OK ({info//1024}KB) → {img_filename}")
        else:
            print(f"DL失敗 ({info})")
            results.append((slug, None, f"DL失敗: {info}"))
            time.sleep(0.3)
            continue

    # MDフロントマター更新
    ok, msg = update_md_heroimage(slug, img_path_rel)
    if ok:
        print(f"  → MD更新: {msg}")
    else:
        print(f"  → MD: {msg}")

    results.append((slug, img_path_rel, "OK"))
    time.sleep(0.3)  # 礼儀正しいアクセス

print("\n=== 結果サマリー ===")
ok_count = sum(1 for _, p, m in results if p)
skip_count = len(results) - ok_count
print(f"成功: {ok_count} / スキップ・失敗: {skip_count}")
for slug, path, msg in results:
    if not path:
        print(f"  SKIP [{slug}]: {msg}")
