/**
 * Themes are plain token maps. Adding one = adding an entry to `themes` below;
 * nothing else in the app needs to know about it.
 *
 * Every token becomes a CSS custom property named `--<kebab-case-key>` on
 * `<html>`, so components only ever reference `var(--bg)`, `var(--accent)`, etc.
 *
 * Each theme tints its whole surface rather than dropping a coloured accent onto
 * a neutral grey — Forest really does sit on deep green, Desert on warm sand.
 * The two Classic themes are the exception, staying close to neutral so there is
 * always somewhere quiet to land.
 *
 * `accent` is used as a foreground colour far more often than as a fill (link
 * text, the active nav icon, the running countdown, focused borders), so on the
 * light themes it has to be a deep, saturated shade rather than a pastel one —
 * a pale gold would be unreadable on white.
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

/* ------------------------------------------------------------------ dark -- */

const classicDark: Theme = {
	id: 'classic-dark',
	name: 'Classic Dark',
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
		textMuted: '#99A0AD',
		textFaint: '#69737F',
		accent: '#FFCC66',
		accentText: '#1F2430',
		accentSoft: 'rgba(255, 204, 102, 0.14)',
		success: '#D5FF80',
		warning: '#FFD173',
		danger: '#F28779',
		info: '#73D0FF'
	}
};

const forest: Theme = {
	id: 'forest',
	name: 'Forest',
	mode: 'dark',
	tokens: {
		bg: '#0E1712',
		bgSunken: '#0A120E',
		bgRaised: '#131F18',
		bgHover: '#18271E',
		bgActive: '#1F3126',
		border: '#16241B',
		borderStrong: '#28402F',
		text: '#C9D6CA',
		textMuted: '#92A997',
		textFaint: '#66806D',
		accent: '#7FD18C',
		accentText: '#0E1712',
		accentSoft: 'rgba(127, 209, 140, 0.16)',
		success: '#8FE39B',
		warning: '#E3C46A',
		danger: '#E8867F',
		info: '#74C0D6'
	}
};

const abyss: Theme = {
	id: 'abyss',
	name: 'Abyss',
	mode: 'dark',
	tokens: {
		bg: '#0A1018',
		bgSunken: '#070C13',
		bgRaised: '#0F1926',
		bgHover: '#14202F',
		bgActive: '#1A2A3C',
		border: '#121D2B',
		borderStrong: '#22344A',
		text: '#C3CEDC',
		textMuted: '#8598AF',
		textFaint: '#5C6E85',
		accent: '#5AA9FF',
		accentText: '#0A1018',
		accentSoft: 'rgba(90, 169, 255, 0.16)',
		success: '#6FD3A0',
		warning: '#E5B75F',
		danger: '#F0787F',
		info: '#7FC7FF'
	}
};

const astra: Theme = {
	id: 'astra',
	name: 'Astra',
	mode: 'dark',
	tokens: {
		bg: '#120E1B',
		bgSunken: '#0D0915',
		bgRaised: '#1A1425',
		bgHover: '#221A2F',
		bgActive: '#2B2139',
		border: '#1E1729',
		borderStrong: '#342847',
		text: '#CDC4DC',
		textMuted: '#998CB2',
		textFaint: '#6D6085',
		accent: '#B48BFF',
		accentText: '#120E1B',
		accentSoft: 'rgba(180, 139, 255, 0.16)',
		success: '#8FD9A8',
		warning: '#E7BE6A',
		danger: '#F07B9B',
		info: '#86AEFF'
	}
};

const crimson: Theme = {
	id: 'crimson',
	name: 'Crimson',
	mode: 'dark',
	tokens: {
		bg: '#170D0F',
		bgSunken: '#110809',
		bgRaised: '#1F1214',
		bgHover: '#28181A',
		bgActive: '#331E21',
		border: '#241416',
		borderStrong: '#3D2427',
		text: '#DCC7C9',
		textMuted: '#AE9093',
		textFaint: '#7E6467',
		accent: '#EF6461',
		accentText: '#170D0F',
		accentSoft: 'rgba(239, 100, 97, 0.16)',
		success: '#8FC97F',
		warning: '#E5AC5B',
		// Lighter and pinker than the accent, so a delete or an overdue heading
		// still reads as a warning inside an already-red theme.
		danger: '#FF8FA0',
		info: '#88ADD9'
	}
};

/* ----------------------------------------------------------------- light -- */

const classicLight: Theme = {
	id: 'classic-light',
	name: 'Classic Light',
	mode: 'light',
	tokens: {
		bg: '#FCFBF8',
		bgSunken: '#F3F1EC',
		bgRaised: '#FFFFFF',
		bgHover: '#EDEAE3',
		bgActive: '#E3DFD6',
		border: '#E7E3DA',
		borderStrong: '#D2CDC2',
		text: '#3B4045',
		textMuted: '#6E747A',
		textFaint: '#8B9096',
		accent: '#926C12',
		accentText: '#FCFBF8',
		accentSoft: 'rgba(146, 108, 18, 0.14)',
		success: '#4F7A2E',
		warning: '#9B690E',
		danger: '#C0392B',
		info: '#2C6E9E'
	}
};

const sunset: Theme = {
	id: 'sunset',
	name: 'Sunset',
	mode: 'light',
	tokens: {
		bg: '#FFF7EC',
		bgSunken: '#FBEFDD',
		bgRaised: '#FFFDF8',
		bgHover: '#F7E8D2',
		bgActive: '#F0DCBF',
		border: '#F2E4CE',
		borderStrong: '#DCC7A8',
		text: '#4A3B2A',
		textMuted: '#7A6650',
		textFaint: '#A08B70',
		accent: '#AE5A0D',
		accentText: '#FFF7EC',
		accentSoft: 'rgba(174, 90, 13, 0.14)',
		success: '#4F7A2E',
		warning: '#97680F',
		danger: '#C0432F',
		info: '#2C6E9E'
	}
};

const breeze: Theme = {
	id: 'breeze',
	name: 'Breeze',
	mode: 'light',
	tokens: {
		bg: '#F2F8FD',
		bgSunken: '#E6F1FA',
		bgRaised: '#FFFFFF',
		bgHover: '#DCEBF7',
		bgActive: '#CBE0F1',
		border: '#DCE9F4',
		borderStrong: '#B9CFE3',
		text: '#2E3F4D',
		textMuted: '#5B7080',
		textFaint: '#7E909E',
		accent: '#1C6FB8',
		accentText: '#F2F8FD',
		accentSoft: 'rgba(28, 111, 184, 0.14)',
		success: '#2F7D46',
		warning: '#98670E',
		danger: '#C0392B',
		info: '#1C6FB8'
	}
};

const faerie: Theme = {
	id: 'faerie',
	name: 'Faerie',
	mode: 'light',
	tokens: {
		bg: '#F3FAF3',
		bgSunken: '#E7F3E8',
		bgRaised: '#FFFFFF',
		bgHover: '#DEEEDF',
		bgActive: '#CEE3D0',
		border: '#DEEBDF',
		borderStrong: '#BCD4BE',
		text: '#2F4034',
		textMuted: '#5B7260',
		textFaint: '#809383',
		accent: '#2F7D46',
		accentText: '#F3FAF3',
		accentSoft: 'rgba(47, 125, 70, 0.14)',
		success: '#2F7D46',
		warning: '#98670E',
		danger: '#BE3B34',
		info: '#22688F'
	}
};

const desert: Theme = {
	id: 'desert',
	name: 'Desert',
	mode: 'light',
	tokens: {
		bg: '#F6EFE2',
		bgSunken: '#EDE3D2',
		bgRaised: '#FDF9F1',
		bgHover: '#E7DBC6',
		bgActive: '#DCCDB2',
		border: '#E5D9C4',
		borderStrong: '#C9B695',
		text: '#43382A',
		textMuted: '#73634D',
		textFaint: '#98856B',
		accent: '#96601C',
		accentText: '#F6EFE2',
		accentSoft: 'rgba(150, 96, 28, 0.14)',
		success: '#56752A',
		warning: '#916315',
		danger: '#B24230',
		info: '#2F6A90'
	}
};

/** Order here is the order shown in the picker, dark family first. */
export const themes: Theme[] = [
	classicDark,
	forest,
	abyss,
	astra,
	crimson,
	classicLight,
	sunset,
	breeze,
	faerie,
	desert
];

export const DEFAULT_THEME_ID = classicDark.id;

export function getTheme(id: string): Theme {
	return themes.find((t) => t.id === id) ?? classicDark;
}
