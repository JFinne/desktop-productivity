<script lang="ts">
	import { dayOfMonth, fullDayLabel, type ISODate } from '$lib/date';
	import { eventStore, type FokusEvent } from '$lib/tools/events/store.svelte';
	import { taskStore, type Task } from '$lib/tools/tasks/store.svelte';
	import { drag, parseDragPayload } from './dnd.svelte';
	import EventChip from './EventChip.svelte';
	import TaskChip from './TaskChip.svelte';

	let {
		date,
		tasks,
		events = [],
		muted = false,
		today = false,
		selected = false,
		maxChips = 3,
		onselect
	}: {
		date: ISODate;
		tasks: Task[];
		events?: FokusEvent[];
		muted?: boolean;
		today?: boolean;
		selected?: boolean;
		maxChips?: number;
		onselect: (date: ISODate) => void;
	} = $props();

	let dropTarget = $state(false);

	// Events come first — they are anchored to a clock, tasks merely to the day.
	const shownEvents = $derived(events.slice(0, maxChips));
	const shownTasks = $derived(tasks.slice(0, Math.max(0, maxChips - shownEvents.length)));
	const overflow = $derived(
		events.length - shownEvents.length + (tasks.length - shownTasks.length)
	);

	function onDrop(dropEvent: DragEvent) {
		dropEvent.preventDefault();
		dropTarget = false;
		const item = parseDragPayload(dropEvent.dataTransfer?.getData('text/plain'));
		if (item?.kind === 'task') taskStore.schedule(item.id, date);
		else if (item?.kind === 'event') eventStore.update(item.id, { date });
		drag.end();
	}
</script>

<div
	class="cell"
	class:muted
	class:today
	class:selected
	class:dropTarget
	role="gridcell"
	tabindex="0"
	aria-label={fullDayLabel(date)}
	aria-selected={selected}
	onclick={() => onselect(date)}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onselect(date);
		}
	}}
	ondragover={(e) => {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dropTarget = true;
	}}
	ondragleave={() => (dropTarget = false)}
	ondrop={onDrop}
>
	<span class="number">{dayOfMonth(date)}</span>

	<div class="chips" role="list">
		{#each shownEvents as event (event.id)}
			<EventChip {event} />
		{/each}
		{#each shownTasks as task (task.id)}
			<TaskChip {task} />
		{/each}
		{#if overflow > 0}
			<span class="more">+{overflow} more</span>
		{/if}
	</div>
</div>

<style>
	.cell {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-height: 84px;
		padding: 0.3rem 0.35rem;
		border: 1px solid transparent;
		border-radius: var(--radius);
		background: var(--bg-raised);
		overflow: hidden;
		transition:
			background 120ms ease,
			border-color 120ms ease;
	}

	.cell:hover {
		background: var(--bg-hover);
	}

	/* Days spilling in from the neighbouring months stay present but recede. */
	.cell.muted {
		background: transparent;
	}

	.cell.muted .number {
		color: var(--text-faint);
		opacity: 0.6;
	}

	.cell.selected {
		border-color: var(--border-strong);
		background: var(--bg-active);
	}

	.cell.dropTarget {
		border-color: var(--accent);
		background: var(--accent-soft);
	}

	.number {
		font-size: 0.74rem;
		font-variant-numeric: tabular-nums;
		color: var(--text-muted);
	}

	.cell.today .number {
		display: grid;
		place-items: center;
		align-self: flex-start;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--accent);
		color: var(--accent-text);
		font-weight: 600;
	}

	.chips {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.more {
		padding-left: 0.3rem;
		font-size: 0.68rem;
		color: var(--text-faint);
	}
</style>
