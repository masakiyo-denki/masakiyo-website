// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * 段落本文の句点（。）の後に <br> を挿入し、一文ごとに改行する rehype プラグイン。
 * - <p> 要素の直下テキストのみが対象（見出し・表・リスト・ボタン等には作用しない）
 * - 段落末尾の句点には改行を付けない（行末の余分な空行を防ぐ）
 */
function rehypeSentenceBreaks() {
  /** @param {any} node */
  function walk(node) {
    if (!node || !Array.isArray(node.children)) return;

    if (node.tagName === 'p') {
      /** @type {any[]} */
      const out = [];
      for (const child of node.children) {
        if (child.type === 'text' && child.value.includes('。')) {
          const parts = child.value.split('。');
          parts.forEach((/** @type {string} */ part, /** @type {number} */ i) => {
            if (i < parts.length - 1) {
              out.push({ type: 'text', value: part + '。' });
              out.push({ type: 'element', tagName: 'br', properties: {}, children: [] });
            } else if (part) {
              out.push({ type: 'text', value: part });
            }
          });
        } else {
          out.push(child);
        }
      }
      // 段落末尾に来た <br>（＝末尾が句点だった場合）は取り除く
      while (out.length && out[out.length - 1].type === 'element' && out[out.length - 1].tagName === 'br') {
        out.pop();
      }
      node.children = out;
      return; // <p> 配下はこれ以上潜らない
    }

    node.children.forEach(walk);
  }
  /** @param {any} tree */
  return (tree) => walk(tree);
}

// https://astro.build/config
export default defineConfig({
  site: 'https://www.masakiyo-denki.com',
  /* astro-indexnow は2026-09-05に撤去した。
     9か月間（2025-12のAstro移行以降）一度も成功しておらず、毎ビルド116URLを
     送信して403で失敗し続けていた。失敗するとキャッシュが更新されないため
     次回も全URLが対象になり、循環していた（.astro-indexnow-cache.json は 2バイトの {} のまま）。
     Bing Webmaster Tools 側でも送信記録は0件で、最終がWix時代の2026-05-09だった。
     Bingは IndexNow 無しでも公開直後に拾うので実害はない（Googleより速い）。
     毎ビルド警告が出続けると本物の異常が埋もれる方が問題だった。
     キーファイル public/a89324d0c7b651fe.txt は残してある（16バイト・所有証明なので、
     再開する場合に必要）。 */
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [rehypeSentenceBreaks],
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
