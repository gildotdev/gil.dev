import { defineLiveCollection } from 'astro:content';
import { z } from 'astro/zod';
import { micropubLoader } from './lib/micropubLoader';

const posts = defineLiveCollection({
  loader: micropubLoader(),
  schema: z.object({
    uid: z.string(),
    slug: z.string(),
    rawContent: z.string(),
    published: z.string(),
    title: z.string().nullish(),
    canonicalURL: z.url(),
    category: z.array(z.string()).optional().default([]),
  }),
});

export const collections = { posts };
