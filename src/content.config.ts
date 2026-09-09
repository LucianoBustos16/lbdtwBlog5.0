import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
	schema: z.object({
		title: z.string(),
		author: z.string(),
		image: z.object({
			url: z.string(),
			alt: z.string().optional(),
		}),
		pubDate: z.date(),
		tags: z.array(z.string()).optional(),
	}),
});

export const collections = { posts };