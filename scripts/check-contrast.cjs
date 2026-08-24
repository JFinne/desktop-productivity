// Contrast audit for the Fokus theme palettes.
// Usage: node contrast.cjs <path-to-themes.ts> [--fix]
const fs = require('fs');

const file = process.argv[2];
const fix = process.argv.includes('--fix');
let src = fs.readFileSync(file, 'utf8');

const lum = (hex) => {
	const v = parseInt(hex.slice(1), 16);
	const c = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((x) => {
		x /= 255;
		return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const cr = (a, b) => {
	const l1 = lum(a), l2 = lum(b);
	const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
	return (hi + 0.05) / (lo + 0.05);
};
const rgb = (h) => { const v = parseInt(h.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
const hex = (c) => '#' + c.map((x) => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, '0')).join('').toUpperCase();

// Push a colour toward white or black (whichever the background is not) until it clears.
function lift(color, bg, target) {
	const toward = lum(bg) < 0.5 ? [255, 255, 255] : [0, 0, 0];
	let out = color;
	for (let t = 0; t <= 1.0001; t += 0.005) {
		out = hex(rgb(color).map((v, i) => v + (toward[i] - v) * t));
		if (cr(out, bg) >= target) break;
	}
	return out;
}

// key -> minimum contrast against `bg`
const RULES = {
	text: 7, textMuted: 4.5, textFaint: 3,
	accent: 4.5, danger: 4.5, info: 4.5, success: 4.5, warning: 4.5
};

const blockRe = /const (\w+): Theme = \{[\s\S]*?tokens: \{([\s\S]*?)\n\t\}/g;
const pad = (s, n) => String(s).padEnd(n);
const cols = Object.keys(RULES);

console.log(pad('theme', 15) + cols.map((c) => pad(c, 9)).join('') + 'onFill');
let failures = 0;
let m;
const blocks = [];
while ((m = blockRe.exec(src))) blocks.push({ name: m[1], body: m[2], full: m[0] });

for (const block of blocks) {
	const get = (k) => {
		const found = block.body.match(new RegExp('(?:^|\\n)\\s*' + k + ": '(#[0-9A-Fa-f]{6})'"));
		return found ? found[1] : null;
	};
	const bg = get('bg');
	if (!bg) { console.log(pad(block.name, 15) + '  (no bg found)'); continue; }

	let newBody = block.body;
	const cells = cols.map((key) => {
		const value = get(key);
		if (!value) return pad('--', 9);
		let ratio = cr(value, bg);
		const min = RULES[key];
		if (ratio < min) {
			failures++;
			if (fix) {
				const fixed = lift(value, bg, min + 0.08);
				newBody = newBody.replace(key + ": '" + value + "'", key + ": '" + fixed + "'");
				return pad(ratio.toFixed(2) + '→' + cr(fixed, bg).toFixed(2), 9);
			}
			return pad('!' + ratio.toFixed(2), 9);
		}
		return pad(' ' + ratio.toFixed(2), 9);
	});

	const onFill = cr(get('accentText'), get('accent'));
	if (onFill < 4.5) failures++;

	console.log(pad(block.name, 15) + cells.join('') + (onFill < 4.5 ? '!' : ' ') + onFill.toFixed(2));

	if (fix && newBody !== block.body) src = src.replace(block.body, newBody);
}

if (fix) {
	fs.writeFileSync(file, src);
	console.log('\nwrote fixes to ' + file);
} else {
	console.log('\nfailures: ' + failures + '   (! marks below threshold)');
}
