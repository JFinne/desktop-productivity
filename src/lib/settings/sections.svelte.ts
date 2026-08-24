import CircadianPreview from '$lib/components/settings/CircadianPreview.svelte';
import { registerSettingsSection } from '$lib/registry.svelte';
import { storeLocation } from '$lib/storage';
import { themes } from '$lib/themes/themes';
import { settings } from './settings.svelte';

let dataPath = $state('Locating…');
void storeLocation().then((p) => (dataPath = p));

registerSettingsSection({
	id: 'appearance',
	title: 'Appearance',
	description: 'How Fokus looks. Changes apply immediately.',
	order: 10,
	fields: [
		{
			kind: 'select',
			path: 'appearance.themeId',
			label: 'Theme',
			help: 'Ignored while the daylight cycle is on.',
			options: themes.map((t) => ({ value: t.id, label: t.name }))
		},
		{
			kind: 'slider',
			path: 'appearance.fontScale',
			label: 'Text size',
			min: 0.85,
			max: 1.3,
			step: 0.05,
			format: (v) => `${Math.round(v * 100)}%`
		},
		{
			kind: 'toggle',
			path: 'appearance.showSidebarLabels',
			label: 'Sidebar labels',
			help: 'Turn off for a narrow icon-only rail.'
		}
	]
});

registerSettingsSection({
	id: 'circadian',
	title: 'Daylight cycle',
	description:
		'Shifts the palette continuously with the sun where you are — warm and dim at night, ' +
		'cool and open in the middle of the day. Computed on this machine from your coordinates; ' +
		'nothing is looked up online.',
	order: 15,
	fields: [
		{
			kind: 'toggle',
			path: 'appearance.adaptive',
			label: 'Follow the daylight cycle',
			help: 'Overrides the theme above.'
		},
		{
			kind: 'number',
			path: 'appearance.latitude',
			label: 'Latitude',
			min: -90,
			max: 90,
			step: 0.5,
			suffix: '°N',
			help: 'Negative for the southern hemisphere. Check the sunrise time below to confirm.'
		},
		{
			kind: 'number',
			path: 'appearance.longitude',
			label: 'Longitude',
			min: -180,
			max: 180,
			step: 0.5,
			suffix: '°E',
			help: 'Negative for west. Guessed from your time zone, so it is usually close already.'
		},
		{
			kind: 'toggle',
			path: 'appearance.daylight',
			label: 'Go light in the daytime',
			help: 'Off keeps Fokus dark around the clock and shifts only warmth and contrast.'
		},
		{ kind: 'custom', component: CircadianPreview }
	]
});

registerSettingsSection({
	id: 'data',
	title: 'Data',
	description: 'Everything Fokus stores lives on this machine, as plain JSON.',
	order: 900,
	fields: [
		{ kind: 'info', label: 'Data folder', value: () => dataPath },
		{
			kind: 'action',
			label: 'Reset settings',
			button: 'Reset',
			danger: true,
			help: 'Restores every setting to its default. Your tasks and history are untouched.',
			run: () => settings.reset()
		}
	]
});
