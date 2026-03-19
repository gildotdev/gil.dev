import { defineLiveCollection, z } from 'astro:content';
import { micropubLoader } from './lib/micropubLoader';

const posts = defineLiveCollection({
  loader: micropubLoader(),
  schema: z.object({
    uid: z.string(),
    rawContent: z.string(),
    published: z.string(),
    title: z.string().nullish(),
    canonicalURL: z.string().url(),
    category: z.array(z.string()).optional().default([]),
  }),
});

export const collections = { posts };
