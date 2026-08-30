import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string().optional(),
    image: z.string().optional(),
    heroImage: z.string().optional(),
    imageAlt: z.string().optional(),
    category: z.string().optional(),
    // 法人向けサービスページの「関連コラム」欄で、どのページに出すかの絞り込みに使う。
    // 未指定だと school に会議室の記事が並ぶ等の取り違えが起きるため、
    // 法人向けコラムには必ず付ける。表記ゆれで静かに壊れないよう enum で縛る。
    audience: z.array(z.enum(['会議室', '学校', '保育園'])).optional(),
    // FAQPageスキーマの生成元（blog/[...id].astro が読む）。
    // ここで宣言しないと zod に未知キーとして捨てられ、FAQが一切出力されない
    faq: z.array(z.object({
      q: z.string(),
      a: z.string(),
    })).optional(),
  }),
});

const cases = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cases' }),
  schema: z.object({
    title: z.string(),
    client: z.string(),
    location: z.string(),
    year: z.number(),
    category: z.string(),
    description: z.string(),
    heroImage: z.string(),
    heroImageAlt: z.string(),
    images: z.array(z.object({
      src: z.string(),
      alt: z.string(),
      caption: z.string().optional(),
    })).optional(),
    tags: z.array(z.string()).optional(),
    youtubeId: z.string().optional(),
  }),
});

export const collections = { blog, cases };
