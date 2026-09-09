import typography from '@tailwindcss/typography'
import animations from '@midudev/tailwind-animations'

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	darkMode: "class",
	theme: {
		extend: {
			colors: {
				primary: 'var(--color-primary)',
				'primary-ink': 'var(--color-primary-ink)',
				accent: 'var(--color-accent)',
				'accent-ink': 'var(--color-accent-ink)',
				surface: 'var(--color-surface)',
				'surface-2': 'var(--color-surface-2)',
				border: 'var(--color-border)',
				textDark: 'var(--color-textDark)',
				textLight: 'var(--color-textLight)',
			},
			fontFamily: {
				sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				display: ['"Barlow Condensed"', 'sans-serif'],
			},
		},
	},
	plugins:
	[typography, animations]
}