import { registerSettingsSection, registerTool } from '$lib/registry.svelte';
import { eventStore } from './store.svelte';

registerTool({
	id: 'events',
	label: 'Events',
	path: '/events',
	icon: 'events',
	order: 22,
	description: 'Things happening at a time',
	status: () => {
		const count = eventStore.todayCount;
		return count > 0 ? String(count) : null;
	}
});

registerSettingsSection({
	id: 'events',
	title: 'Events',
	description:
		'Events are pinned to their day. Unlike tasks, they are never carried forward, ' +
		'and there is nothing to tick off.',
	order: 32,
	fields: [
		{
			kind: 'toggle',
			path: 'events.showOnCalendar',
			label: 'Show events on the calendar',
			help: 'Turn off to keep the calendar grid to tasks only.'
		}
	]
});
