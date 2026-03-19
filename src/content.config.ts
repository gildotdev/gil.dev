// 1. Import utilities from `astro:content`
import { defineCollection, z } from 'astro:content';

// 2. Import loader(s)
import { glob } from 'astro/loaders';
import { micropubLoader } from './lib/micropubLoader';

// 3. Define your collection(s)
const notes = defineCollection({ loader: glob({ pattern: "**/*.md*", base: "./src/content/notes" }),

schema: z.object({
      title: z.string(),
      description: z.string().optional(),
      microblog: z.boolean().optional(),
      guid: z.string().url().optional(),
      post_id: z.number().optional(),
      created: z.date().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{4}$/)),
      type: z.literal('note').optional(),
      tags: z.array(z.string()),
      images: z.array(z.string().url()).nullable().optional(),
      photos: z.string().url().nullable().optional(),
      photos_with_metadata: z.string().url().nullable().optional(),
      url: z.string().optional(),
      updated: z.date().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{4}$/)),
      slug: z.string(),
      draft: z.boolean().optional(),
      topics: z.array(z.string()).optional().default([]),
      status: z.enum(['seed', 'growing', 'evergreen']).optional(),
  }),

});

const topics = defineCollection({
  loader: glob({ pattern: "**/*.md*", base: "./src/content/topics" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    intro: z.string().optional(),
    relatedTopics: z.array(z.string()).optional().default([]),
    externalLinks: z.array(z.object({
      title: z.string(),
      url: z.string().url(),
    })).optional().default([]),
  }),
});

// 3b. Posts loaded dynamically from micro.blog via content loader
const posts = defineCollection({
  loader: micropubLoader(),
  schema: z.object({
    uid: z.string(),
    rawContent: z.string(),
    published: z.string(),
    title: z.string().nullable().optional(),
    canonicalURL: z.string().url(),
    category: z.array(z.string()).optional().default([]),
  }),
});

// 4. Export a single `collections` object to register your collection(s)
export const collections = { notes, topics, posts };