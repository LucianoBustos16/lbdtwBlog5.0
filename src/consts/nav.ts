export const NAV_LINKS = [
	{ name: "Inicio", href: "/" },
	{ name: "Blog", href: "/blog" },
	// { name: "Estadisticas", href: "/statistics" },
	{ name: "LBDTw Tv", href: "/lbdtwtv" },
] as const;

export function isActivePath(pathname: string, href: string): boolean {
	const normalized =
		pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

	return normalized === href || (href !== "/" && normalized.startsWith(href));
}