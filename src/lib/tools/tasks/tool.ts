import { registerSettingsSection, registerTool } from '$lib/registry.svelte';
import { taskStore } from './store.svelte';

registerTool({
	id: 'tasks',
	label: 'Tasks',
	path: '/tasks',
	icon: 'list-todo',
	order: 20,
	description: 'To-do lists and categories',
	status: () => {
		const due = taskStore.dueToday.length;
		return due > 0 ? String(due) : null;
	}
});

registerSettingsSection({
	id: 'tasks',
	title: 'Tasks',
	order: 30,
	fields: [
		{
			kind: 'toggle',
			path: 'tasks.showCompleted',
			label: 'Show completed tasks',
			help: 'Keeps a Completed section at the bottom of the list.'
		},
		{
			kind: 'toggle',
			path: 'tasks.carryOverUnfinished',
			label: 'Carry unfinished tasks forward',
			help: 'On launch, anything still open from a past day moves to today rather than falling out of sight.'
		}
	]
});
