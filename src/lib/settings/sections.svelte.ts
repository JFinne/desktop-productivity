import ThemePicker from '$lib/components/settings/ThemePicker.svelte';
import { registerSettingsSection } from '$lib/registry.svelte';
import { storeLocation } from '$lib/storage';
import { settings } from './settings.svelte';

let dataPath = $state('Locating…');
void storeLocation().then((p) => (dataPath = p));

registerSettingsSection({
	id: 'appearance',
	title: 'Appearance',
	description: 'How Fokus looks. Changes apply immediately.',
	order: 10,
	fields: [
		{ kind: 'custom', component: ThemePicker },
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
