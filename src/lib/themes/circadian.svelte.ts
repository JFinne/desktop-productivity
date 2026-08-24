/**
 * The theme that follows the real daylight cycle.
 *
 * Rather than switching between a handful of themes at fixed clock times, this
 * interpolates a palette continuously against the sun's actual elevation at the
 * user's coordinates. Two consequences worth knowing: the shift is gradual
 * enough that you never catch it happening, and it tracks the seasons — a
 * January afternoon reaches a lower, warmer part of the ramp than a June one.
 *
 * Everything stays dark by default, because the point is mood rather than
 * brightness. Turning on `daylight` swaps the two high-sun stops for light ones.
 */
import { settings } from '$lib/settings/settings.svelte';
import { sunPosition, sunTimes, type SunTimes } from './sun';
import type { Theme, ThemeTokens } from './themes';

/** `accentSoft` is derived from the interpolated accent, so it isn't stored. */
type Palette = Omit<ThemeTokens, 'accentSoft'>;

const deepNight: Palette = {
	bg: '#05060A',
	bgSunken: '#030409',
	bgRaised: '#090B12',
	bgHover: '#0D1018',
	bgActive: '#12151F',
	border: '#0B0D14',
	borderStrong: '#1A1E2A',
	text: '#9BA0AE',
	textMuted: '#727889',
	textFaint: '#464B59',
	accent: '#6E77E8',
	accentText: '#05060A',
	success: '#5FBF74',
	warning: '#C9963C',
	danger: '#D9555F',
	info: '#5F93E8'
};

const night: Palette = {
	bg: '#080B12',
	bgSunken: '#05070D',
	bgRaised: '#0D111A',
	bgHover: '#121722',
	bgActive: '#181E2B',
	border: '#0F131C',
	borderStrong: '#212736',
	text: '#ADB2BE',
	textMuted: '#7A8090',
	textFaint: '#4E545F',
	accent: '#7C86FF',
	accentText: '#080B12',
	success: '#6FCF7F',
	warning: '#D9A441',
	danger: '#E5636B',
	info: '#6EA8FE'
};

const dawn: Palette = {
	bg: '#0C0910',
	bgSunken: '#080611',
	bgRaised: '#120E18',
	bgHover: '#181320',
	bgActive: '#1F1829',
	border: '#140F1B',
	borderStrong: '#2A2136',
	text: '#C4B4C0',
	textMuted: '#857584',
	textFaint: '#564A5B',
	accent: '#E9899B',
	accentText: '#0C0910',
	success: '#8FD08A',
	warning: '#F0B36B',
	danger: '#F0787F',
	info: '#7FB6FF'
};

const dusk: Palette = {
	bg: '#0B0810',
	bgSunken: '#070511',
	bgRaised: '#110D19',
	bgHover: '#171122',
	bgActive: '#1E172C',
	border: '#130E1C',
	borderStrong: '#291F39',
	text: '#BAB0C6',
	textMuted: '#7E758E',
	textFaint: '#4E4760',
	accent: '#A78BFA',
	accentText: '#0B0810',
	success: '#8BCB92',
	warning: '#E8A65C',
	danger: '#EC6F86',
	info: '#7EA9FF'
};

const morning: Palette = {
	bg: '#0A0E14',
	bgSunken: '#070A10',
	bgRaised: '#0F141C',
	bgHover: '#151B25',
	bgActive: '#1B2230',
	border: '#121821',
	borderStrong: '#232C3A',
	text: '#C3C8CF',
	textMuted: '#7E8894',
	textFaint: '#545E6C',
	accent: '#E9C46A',
	accentText: '#0A0E14',
	success: '#A8D96B',
	warning: '#F0BC5E',
	danger: '#EE7A82',
	info: '#63C6FF'
};

const evening: Palette = {
	bg: '#100B0A',
	bgSunken: '#0B0707',
	bgRaised: '#16100E',
	bgHover: '#1D1613',
	bgActive: '#251C18',
	border: '#181110',
	borderStrong: '#33251F',
	text: '#C6B8AC',
	textMuted: '#87786D',
	textFaint: '#5C4F46',
	accent: '#FF9E5E',
	accentText: '#100B0A',
	success: '#A6C96B',
	warning: '#FFB454',
	danger: '#F0787F',
	info: '#8FB6E8'
};

/** Midday is the familiar Ayu Dark palette, so the app's resting look is home base. */
const day: Palette = {
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
	success: '#AAD94C',
	warning: '#FFB454',
	danger: '#F07178',
	info: '#59C2FF'
};

const lightMorning: Palette = {
	bg: '#F7F7F5',
	bgSunken: '#EEEEEA',
	bgRaised: '#FFFFFF',
	bgHover: '#E7E7E2',
	bgActive: '#DDDDD7',
	border: '#E2E2DC',
	borderStrong: '#CDCDC5',
	text: '#3C4247',
	textMuted: '#6B7178',
	textFaint: '#A4ABB2',
	accent: '#D99A2B',
	accentText: '#2B2E33',
	success: '#5A9A30',
	warning: '#C9861B',
	danger: '#CC4141',
	info: '#2F80C4'
};

const lightDay: Palette = {
	bg: '#FCFCFC',
	bgSunken: '#F3F3F1',
	bgRaised: '#FFFFFF',
	bgHover: '#EDEDEA',
	bgActive: '#E3E3DF',
	border: '#E6E6E1',
	borderStrong: '#D2D2CB',
	text: '#3B4045',
	textMuted: '#6E747A',
	textFaint: '#A7ADB4',
	accent: '#F2A73B',
	accentText: '#2B2E33',
	success: '#5C9E31',
	warning: '#D48A1C',
	danger: '#D14343',
	info: '#3E8FD6'
};

const lightEvening: Palette = {
	bg: '#FBF8F4',
	bgSunken: '#F2EDE6',
	bgRaised: '#FFFFFF',
	bgHover: '#EDE6DC',
	bgActive: '#E3DACD',
	border: '#E9E1D6',
	borderStrong: '#D3C8B8',
	text: '#453E38',
	textMuted: '#797065',
	textFaint: '#AFA79C',
	accent: '#C9762B',
	accentText: '#2B2620',
	success: '#5E9433',
	warning: '#C27A18',
	danger: '#C74A3C',
	info: '#3B7FB8'
};

interface Stop {
	elevation: number;
	palette: Palette;
	/** Marks a stop as a light palette, which controls where the ramp snaps. */
	light?: boolean;
}

/**
 * Stops are keyed by sun elevation in degrees, ascending. Below the horizon the
 * ramp splits: the same altitude reads as dawn on the way up and dusk on the
 * way down, which is the difference between "about to start" and "winding down".
 */
function ramp(rising: boolean, daylight: boolean): Stop[] {
	const high = daylight ? lightDay : day;
	const mid = daylight ? (rising ? lightMorning : lightEvening) : rising ? morning : evening;
	return [
		{ elevation: -90, palette: deepNight },
		{ elevation: -15, palette: night },
		{ elevation: -4, palette: rising ? dawn : dusk },
		{ elevation: 8, palette: mid, light: daylight },
		{ elevation: 26, palette: high, light: daylight },
		{ elevation: 90, palette: high, light: daylight }
	];
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function parseHex(hex: string): [number, number, number] {
	const value = parseInt(hex.slice(1), 16);
	return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

const toHex = (rgb: [number, number, number]) =>
	'#' + rgb.map((c) => Math.round(clamp01(c / 255) * 255).toString(16).padStart(2, '0')).join('');

function mixHex(a: string, b: string, t: number): string {
	const [ar, ag, ab] = parseHex(a);
	const [br, bg, bb] = parseHex(b);
	return toHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}

function mixPalettes(a: Palette, b: Palette, t: number): Palette {
	const out = {} as Palette;
	for (const key of Object.keys(a) as (keyof Palette)[]) {
		out[key] = mixHex(a[key], b[key], t);
	}
	return out;
}

interface Resolved {
	palette: Palette;
	light: boolean;
}

function paletteFor(elevation: number, rising: boolean, daylight: boolean): Resolved {
	const stops = ramp(rising, daylight);
	const resolve = (stop: Stop): Resolved => ({ palette: stop.palette, light: stop.light ?? false });

	if (elevation <= stops[0].elevation) return resolve(stops[0]);

	for (let i = 1; i < stops.length; i++) {
		const previous = stops[i - 1];
		const current = stops[i];
		if (elevation > current.elevation) continue;

		const span = current.elevation - previous.elevation;
		const t = clamp01((elevation - previous.elevation) / span);

		// A light palette and a dark one must never be mixed: the blend passes
		// through mid-grey, where the background and the text meet in the middle
		// and contrast collapses to around 2.5:1. Step across that boundary
		// instead, which puts the switch just above the horizon — light while
		// the sun is up, dark once it has set.
		if ((previous.light ?? false) !== (current.light ?? false)) {
			return resolve(t < 0.5 ? previous : current);
		}

		// Smoothstep, so the palette eases in and out of each stop instead of
		// changing pace abruptly as it crosses one.
		return {
			palette: mixPalettes(previous.palette, current.palette, t * t * (3 - 2 * t)),
			light: current.light ?? false
		};
	}
	return resolve(stops[stops.length - 1]);
}

function withAccentSoft(palette: Palette): ThemeTokens {
	const [r, g, b] = parseHex(palette.accent);
	return { ...palette, accentSoft: `rgba(${r}, ${g}, ${b}, 0.16)` };
}

/**
 * Elevation alone can't tell late morning from mid-afternoon — they are the same
 * height — so every daytime label is split by which way the sun is travelling.
 */
export function phaseLabel(elevation: number, rising: boolean): string {
	if (elevation >= 26) return rising ? 'Late morning' : 'Early afternoon';
	if (elevation >= 8) return rising ? 'Morning' : 'Afternoon';
	if (elevation >= 0) return rising ? 'Sunrise' : 'Golden hour';
	if (elevation >= -6) return rising ? 'Dawn' : 'Dusk';
	if (elevation >= -18) return 'Twilight';
	return 'Night';
}

let clock = $state(Date.now());
let preview = $state<number | null>(null);

if (typeof window !== 'undefined') {
	// A minute is far finer than the palette can visibly change.
	setInterval(() => (clock = Date.now()), 60_000);
}

/** The instant the palette is being computed for — now, or the preview hour. */
function referenceDate(): Date {
	const date = new Date(clock);
	if (preview === null) return date;
	date.setHours(Math.floor(preview), Math.round((preview % 1) * 60), 0, 0);
	return date;
}

export const circadian = {
	/** Scrub the day without waiting for it; null follows the real clock. */
	get previewHour(): number | null {
		return preview;
	},
	set previewHour(hour: number | null) {
		preview = hour;
	},

	get position() {
		const { latitude, longitude } = settings.value.appearance;
		return sunPosition(referenceDate(), latitude, longitude);
	},

	get times(): SunTimes {
		const { latitude, longitude } = settings.value.appearance;
		return sunTimes(referenceDate(), latitude, longitude);
	},

	get phase(): string {
		const { elevation, rising } = this.position;
		return phaseLabel(elevation, rising);
	},

	get theme(): Theme {
		const { elevation, rising } = this.position;
		const { palette, light } = paletteFor(elevation, rising, settings.value.appearance.daylight);
		return {
			id: 'circadian',
			name: 'Circadian',
			mode: light ? 'light' : 'dark',
			tokens: withAccentSoft(palette)
		};
	}
};
