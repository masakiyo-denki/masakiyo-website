# 正清電器 ホームページ CLAUDE.md
## このファイルの目的
Claudeがセッションをまたいでも正確な前提を持てるよう、サイト構成・運用ルール・注意事項を記録する。
作業前に必ずこのファイルを読むこと。

---

## 会社概要
- **社名**: 合資会社 正清電器（まさきよでんき）
- **住所**: 熊本市南区田迎3丁目2番**33**号（※37号は旧住所・誤り）
- **TEL**: 096-379-1234
- **創業**: 明治39年（1906年）・119年
- **代表**: 5代目・正清義悟（音響設計専門家・SR誌掲載実績あり）
- **形態**: パナソニック正規特約店（パナショップ）
- **許認可**: 一般建設業 熊本県知事許可（電気工事業・管工事業・電気通信工事業）、登録電気工事業者

## 事業の2軸
1. **個人向け**: 家電販売・修理・設置・エアコン・エコキュート・リフォーム（熊本市南区エリア）
2. **法人向け**: 会議室・ホール・学校・体育館・幼稚園の音響映像設備設計・施工・調整。技術責任者の全国実績70施設以上。SR誌・業界メディア掲載あり。

---

## サイト構成

### 技術スタック
- Astro v5 / Tailwind CSS / TypeScript
- ホスティング: Cloudflare Pages（GitHubプッシュで自動デプロイ）
- リポジトリ: `C:\Users\silva\Desktop\New_HP_PJ\masakiyo-denki`

### 固定ページ（src/pages/）

| URL | ファイル | 内容 |
|---|---|---|
| `/` | index.astro | トップページ |
| `/value` | value.astro | 地元電器店の価値訴求 |
| `/company` | company.astro | 会社紹介 |
| `/overview` | overview.astro | 会社概要・許認可・スタッフ紹介 |
| `/recruit` | recruit.astro | 採用情報・応募フォーム(Formspree) |
| `/contact` | contact.astro | お問い合わせフォーム(Formspree) |
| `/privacy-policy` | privacy-policy.astro | プライバシーポリシー |
| `/case` | case.astro | 導入事例一覧（casesコレクション読み込み） |
| `/case/[id]` | case/[...id].astro | 導入事例詳細 |
| `/case-housing` | case-housing.astro | 住宅設備施工事例（個人向け） |
| `/blog` | blog/index.astro | ブログ一覧 |
| `/blog/[id]` | blog/[...id].astro | ブログ詳細（FAQスキーマ自動付与） |

### 法人向けサービスページ（src/pages/business/）

| URL | ファイル | 内容 |
|---|---|---|
| `/business` | index.astro | 事業一覧（個人・法人） |
| `/business/corporate` | corporate.astro | 法人向けAV設備総合 |
| `/business/seminarroom` | seminarroom.astro | 会議室・セミナー室 |
| `/business/school` | school.astro | 学校・体育館音響 |
| `/business/nursery` | nursery.astro | 幼稚園・保育園音響 |

### 導入事例コンテンツ（src/content/cases/）
**6件存在。写真付き。**

| ファイル | クライアント | カテゴリ | 年 |
|---|---|---|---|
| tamana-ishikai.md | 玉名郡市医師会館 | 医療・福祉施設 | 2026 |
| daikumamoto-shoken.md | 大熊本証券 株式会社 | 企業・金融機関 | 2025 |
| panahome-seminar.md | 松栄パナホーム 株式会社 | 企業・ショールーム | 2025 |
| panahome-signage.md | 松栄パナホーム 株式会社 | 企業・ショールーム | 2025 |
| panahome-theater.md | 松栄パナホーム 株式会社 | 企業・ショールーム | 2025 |
| panahome-camera.md | 松栄パナホーム 株式会社 | 企業・ショールーム | 2025 |

### ブログコンテンツ（src/content/blog/）
約80件。2019年〜2026年。カテゴリ2種：

- **法人向けコラム**: taikukan-howling-2026, kaigishitsu-onkyo-2026, gakko-hoso-setsubi-2026, hoikuen-onkyo-2026, atotsugi-2025 等
- **お知らせ（個人向け）**: ecocute-hojokin-2026, aircon-kaekae-kumamoto-2026, イベント・キャンペーン告知多数

### SEO/GEO関連実装済み（src/layouts/Layout.astro）
- LocalBusiness + ElectronicsStore スキーマ
- alternateName・knowsAbout・hasOfferCatalog・openingHoursSpecification・areaServed
- 住所は**33号**（全ページ統一済み）
- FAQPageスキーマ：frontmatterに `faq:` を書いた記事に自動付与

---

## 運用ルール

### 工事業種の表記ルール（重要）
音響・映像・LAN配線が主体の記述では必ず「**電気通信工事**」を前に出す。電源100V工事が主体なら「電気工事」のみでよい。

| 用途 | 正しい表記 |
|---|---|
| 音響配線・LAN・映像配線 | 電気通信工事業・電気工事業 |
| エアコン・エコキュート・IH・コンセント | 電気工事業（のみでよい） |
| エコキュート設置 | 電気工事業・管工事業 |

### ブログ週1本pushスケジュール
「今週の記事をプッシュ」と言われたら、その日の日付でfrontmatterのdateを更新してgit push。

| 予定日 | ファイル | 状態 |
|---|---|---|
| 2026-06-25 | taikukan-howling-2026.md | 済 |
| 2026-07-02 | ecocute-hojokin-2026.md | 待機中 |
| 2026-07-09 | aircon-kaekae-kumamoto-2026.md | 待機中 |
| 2026-07-16 | kaigishitsu-onkyo-2026.md | 待機中 |
| 2026-07-23 | gakko-hoso-setsubi-2026.md | 待機中 |
| 2026-07-30 | hoikuen-onkyo-2026.md | 待機中 |

### SEO・GEO記事チェックリスト
1. ターゲットは「法人施設担当者」か「熊本市在住の個人」か？
2. カテゴリ：法人向けコラム / お知らせ
3. 個人向け記事に「熊本市南区」「田迎」が入っているか？
4. 記事末尾に住所・電話番号があるか？
5. Q&Aがあるならfrontmatterに `faq:` を追加したか？

---

## ドメイン移管状況（2026-06-27時点）
- Wix → Namecheap 移管中。7/1 午前3:29 自動完了予定
- 完了後: STEP2（Cloudflare DNS切替）→ STEP3（Email Routing設定・Wix解約）
- メール転送先: masakiyo.comele@gmail.com
- 年間削減額: 約¥46,680

---

## 今後の優先タスク
1. 施工写真が揃い次第、導入事例を追加（フォーマットはtamana-ishikai.mdを参照）
2. GBPへの投稿を月1〜2回継続
3. ブログ週1本継続
