import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static', // el resto del sitio sigue siendo estático
  adapter: cloudflare(),
  vite: {
    plugins: [tailwindcss()],
  },
});