import type { Theme, ThemeTokens } from './themes';

const cssVar = (key: string) => `--${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

/** Paint a theme onto `<html>` as CSS custom properties. */
export function applyTheme(theme: Theme, fontScale = 1) {
	const root = document.documentElement;
	for (const [key, value] of Object.entries(theme.tokens) as [keyof ThemeTokens, string][]) {
		root.style.setProperty(cssVar(key), value);
	}
	root.style.setProperty('--font-scale', String(fontScale));
	root.dataset.theme = theme.id;
	root.dataset.mode = theme.mode;
	// Keeps native scrollbars and form controls in step with the theme.
	root.style.colorScheme = theme.mode;
}
