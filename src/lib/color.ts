/**
 * Small colour helpers, shared by the category picker and anything else that
 * needs to put an arbitrary colour on a themed background and keep it legible.
 */

export type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
	const value = parseInt(hex.slice(1), 16);
	return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function rgbToHex(rgb: RGB): string {
	return (
		'#' +
		rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('')
	);
}

export function luminance(hex: string): number {
	const channels = hexToRgb(hex).map((c) => {
		const v = c / 255;
		return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(a: string, b: string): number {
	const l1 = luminance(a);
	const l2 = luminance(b);
	return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export const isHex = (value: string): boolean => /^#[0-9a-f]{6}$/i.test(value);

/**
 * The same colour, lightened or darkened just enough to be readable on `bg`.
 *
 * Hue is preserved by mixing toward white or black rather than recolouring, so
 * a category the user chose as "Tomato" still reads as tomato — a little paler
 * on a dark theme, a little deeper on a light one.
 */
export function readableOn(color: string, bg: string, minContrast = 4.5): string {
	if (!isHex(color) || !isHex(bg)) return color;
	if (contrastRatio(color, bg) >= minContrast) return color;

	const toward: RGB = luminance(bg) < 0.5 ? [255, 255, 255] : [0, 0, 0];
	const base = hexToRgb(color);

	let out = color;
	for (let t = 0; t <= 1.0001; t += 0.02) {
		out = rgbToHex(base.map((v, i) => v + (toward[i] - v) * t) as RGB);
		if (contrastRatio(out, bg) >= minContrast) break;
	}
	return out;
}
