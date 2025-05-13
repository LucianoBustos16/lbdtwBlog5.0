// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node'; // <-- este u otro adaptador SSR
import tailwind from '@astrojs/tailwind';


// https://astro.build/config
export default defineConfig({
  output: 'server', // <-- debe estar en 'server' para SSR
  adapter: node({ mode: 'standalone' }), // Provide required options
  integrations: [tailwind()]
});