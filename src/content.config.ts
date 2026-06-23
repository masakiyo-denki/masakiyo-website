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
