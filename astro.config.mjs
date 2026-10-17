import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	image: {
		// Genera srcset/sizes también para las imágenes dentro del markdown de las notas
		layout: 'constrained',
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
