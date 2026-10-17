import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const posts = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
	// `image()` hace que Astro importe y valide la portada en el build:
	// si la ruta está mal, el build falla en vez de mostrar una imagen rota.
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			author: z.string(),
			image: z.object({
				// Alcanza con el nombre del archivo que está en src/assets/blog/, ej: 'mi-foto.webp'
				// (si ponés una ruta con "/", se usa tal cual)
				url: z.preprocess(
					(file) => (typeof file === "string" && !file.includes("/") ? `@blog/${file}` : file),
					image(),
				),
				alt: z.string().optional(),
			}),
			pubDate: z.date(),
			tags: z.array(z.string()).default([]),
		}),
});

export const collections = { posts };
