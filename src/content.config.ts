// 1. Import utilities from `astro:content`
import { defineCollection, z } from 'astro:content';

// 2. Import loader(s)
import { glob, file } from 'astro/loaders';

// 3. Define your collection(s)
const notes = defineCollection({ loader: glob({ pattern: "**/*.md*", base: "./src/content/notes" }),

schema: z.object({
      title: z.string(),
      microblog: z.boolean().optional(),
      guid: z.string().url().optional(),
      post_id: z.number().optional(),
      date: z.date().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{4}$/)),
      type: z.literal('note').optional(),
      tags: z.array(z.string()),
      images: z.array(z.string().url()).nullable().optional(),
      photos: z.string().url().nullable().optional(),
      photos_with_metadata: z.string().url().nullable().optional(),
      url: z.string().optional(),
      lastmod: z.date().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{4}$/)),
      slug: z.string(),
  }),

});

// 4. Export a single `collections` object to register your collection(s)
export const collections = { notes };