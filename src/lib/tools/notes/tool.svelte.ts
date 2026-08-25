import { registerSettingsSection, registerTool } from '$lib/registry.svelte';
import { notesLocation } from './api';

let notesPath = $state('Locating…');
void notesLocation().then((p) => (notesPath = p));

registerTool({
	id: 'notes',
	label: 'Notes',
	path: '/notes',
	icon: 'notes',
	order: 25,
	description: 'Markdown notes and wiki links',
	// The editor owns its own scrolling, so it takes the whole pane.
	layout: 'full'
});

registerSettingsSection({
	id: 'notes',
	title: 'Notes',
	description: 'Each note is a plain .md file, named after its title.',
	order: 35,
	fields: [{ kind: 'info', label: 'Notes folder', value: () => notesPath }]
});
