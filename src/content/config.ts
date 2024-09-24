import { defineCollection, z } from "astro:content";

const posts = defineCollection({
  schema: z.object({
    title: z.string(),
    author: z.string(),
    image: z.object({
      url: z.string(),
      alt: z.string().optional(),}),
    pubDate: z.date(),
    tags: z.array(z.string()).optional(),
    }),
  })

export const collections = { posts }