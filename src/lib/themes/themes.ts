/**
 * Themes are plain token maps. Adding one = adding an entry to `themes` below;
 * nothing else in the app needs to know about it.
 *
 * Every token becomes a CSS custom property named `--<kebab-case-key>` on
 * `<html>`, so components only ever reference `var(--bg)`, `var(--accent)`, etc.
 */

export type ThemeMode = 'dark' | 'light';

export interface ThemeTokens {
	/** Main content background — the largest surface in the window. */
	bg: string;
	/** Chrome behind the content: title bar and sidebar. */
	bgSunken: string;
	/** Cards, popovers, inputs — sits above `bg`. */
	bgRaised: string;
	bgHover: string;
	bgActive: string;

	border: string;
	borderStrong: string;

	text: string;
	textMuted: string;
	textFaint: string;

	accent: string;
	/** Text/icon colour that sits legibly on top of a solid `accent` fill. */
	accentText: string;
	/** Translucent accent wash for selected rows and soft badges. */
	accentSoft: string;

	success: string;
	warning: string;
	danger: string;
	info: string;
}

export interface Theme {
	id: string;
	name: string;
	mode: ThemeMode;
	tokens: ThemeTokens;
}

const ayuDark: Theme = {
	id: 'ayu-dark',
	name: 'Ayu Dark',
	mode: 'dark',
	tokens: {
		bg: '#0B0E14',
		bgSunken: '#080A10',
		bgRaised: '#0F131A',
		bgHover: '#141922',
		bgActive: '#1A202B',
		border: '#151A23',
		borderStrong: '#232A36',
		text: '#BFBDB6',
		textMuted: '#7A8290',
		textFaint: '#4D5566',
		accent: '#E6B450',
		accentText: '#0B0E14',
		accentSoft: 'rgba(230, 180, 80, 0.14)',
		success: '#AAD94C',
		warning: '#FFB454',
		danger: '#F07178',
		info: '#59C2FF'
	}
};

const ayuMirage: Theme = {
	id: 'ayu-mirage',
	name: 'Ayu Mirage',
	mode: 'dark',
	tokens: {
		bg: '#1F2430',
		bgSunken: '#1A1F29',
		bgRaised: '#242B38',
		bgHover: '#2A3140',
		bgActive: '#313A4B',
		border: '#272D3A',
		borderStrong: '#3A4354',
		text: '#CCCAC2',
		textMuted: '#8A9199',
		textFaint: '#5C6773',
		accent: '#FFCC66',
		accentText: '#1F2430',
		accentSoft: 'rgba(255, 204, 102, 0.14)',
		success: '#D5FF80',
		warning: '#FFD173',
		danger: '#F28779',
		info: '#73D0FF'
	}
};

const midnight: Theme = {
	id: 'midnight',
	name: 'Midnight',
	mode: 'dark',
	tokens: {
		bg: '#0A0A0B',
		bgSunken: '#060607',
		bgRaised: '#101012',
		bgHover: '#17171A',
		bgActive: '#1E1E22',
		border: '#161618',
		borderStrong: '#26262A',
		text: '#C9C9CC',
		textMuted: '#7C7C84',
		textFaint: '#4E4E56',
		accent: '#8A7CFF',
		accentText: '#0A0A0B',
		accentSoft: 'rgba(138, 124, 255, 0.16)',
		success: '#6FCF7F',
		warning: '#E0B341',
		danger: '#E5484D',
		info: '#6EA8FE'
	}
};

const paper: Theme = {
	id: 'paper',
	name: 'Paper',
	mode: 'light',
	tokens: {
		bg: '#FCFCFC',
		bgSunken: '#F3F3F1',
		bgRaised: '#FFFFFF',
		bgHover: '#EDEDEA',
		bgActive: '#E3E3DF',
		border: '#E6E6E1',
		borderStrong: '#D2D2CB',
		text: '#3B4045',
		textMuted: '#787E85',
		textFaint: '#A7ADB4',
		accent: '#F2A73B',
		accentText: '#2B2E33',
		accentSoft: 'rgba(242, 167, 59, 0.18)',
		success: '#5C9E31',
		warning: '#D48A1C',
		danger: '#D14343',
		info: '#3E8FD6'
	}
};

export const themes: Theme[] = [ayuDark, ayuMirage, midnight, paper];

export const DEFAULT_THEME_ID = ayuDark.id;

export function getTheme(id: string): Theme {
	return themes.find((t) => t.id === id) ?? ayuDark;
}
