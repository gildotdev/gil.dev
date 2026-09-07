// 1. Import utilities from `astro:content`
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

// 2. Import loader(s)
import { glob } from 'astro/loaders';

// 3. Define your collection(s)
const notes = defineCollection({ loader: glob({ pattern: "**/*.md*", base: "./src/content/notes" }),

schema: z.object({
      title: z.string(),
      description: z.string().optional(),
      microblog: z.boolean().optional(),
      guid: z.url().optional(),
      post_id: z.number().optional(),
      created: z.date().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{4}$/)),
      type: z.literal('note').optional(),
      tags: z.array(z.string()),
      images: z.array(z.url()).nullable().optional(),
      photos: z.url().nullable().optional(),
      photos_with_metadata: z.url().nullable().optional(),
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
      url: z.url(),
    })).optional().default([]),
  }),
});

// 4. Export a single `collections` object to register your collection(s)
export const collections = { notes, topics };