import { registerSettingsSection, registerTool } from '$lib/registry.svelte';

registerTool({
	id: 'calendar',
	label: 'Calendar',
	path: '/calendar',
	icon: 'calendar',
	order: 30,
	description: 'Tasks laid out across days'
});

registerSettingsSection({
	id: 'calendar',
	title: 'Calendar',
	order: 40,
	fields: [
		{
			kind: 'select',
			path: 'calendar.weekStartsOn',
			label: 'Week starts on',
			options: [
				{ value: 'monday', label: 'Monday' },
				{ value: 'sunday', label: 'Sunday' }
			]
		},
		{
			kind: 'select',
			path: 'calendar.defaultView',
			label: 'Opens in',
			options: [
				{ value: 'month', label: 'Month' },
				{ value: 'week', label: 'Week' }
			]
		}
	]
});
