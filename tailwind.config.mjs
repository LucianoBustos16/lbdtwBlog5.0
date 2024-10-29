import typography from '@tailwindcss/typography'
import animations from '@midudev/tailwind-animations'

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	darkMode: "class",
	theme: {
		extend: {
			colors: {
				'primary': 'var(--color-primary)',
				'textDark': 'var(--color-textDark)',
				'textLight':  'var(--color-textLight)',
			},
		},
	},
	plugins: 
	[typography, animations]
}
