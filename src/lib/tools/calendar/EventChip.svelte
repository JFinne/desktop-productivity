<script lang="ts">
	import { formatTime } from '$lib/date';
	import type { FokusEvent } from '$lib/tools/events/store.svelte';
	import { drag } from './dnd.svelte';

	let { event }: { event: FokusEvent } = $props();

	const label = $derived(event.start ? formatTime(event.start) : null);

	function onDragStart(dragEvent: DragEvent) {
		dragEvent.dataTransfer?.setData('text/plain', `event:${event.id}`);
		if (dragEvent.dataTransfer) dragEvent.dataTransfer.effectAllowed = 'move';
		drag.start('event', event.id);
	}
</script>

<!--
	An event reads as a coloured bar rather than a dotted chip, so the calendar
	distinguishes "happening at 2pm" from "to do today" without a legend.
-->
<div
	class="chip"
	class:lifted={drag.isDragging('event', event.id)}
	draggable="true"
	role="listitem"
	title={`${event.title}${event.location ? ` · ${event.location}` : ''}`}
	style:--event-color={event.color}
	ondragstart={onDragStart}
	ondragend={() => drag.end()}
>
	{#if label}<span class="at">{label}</span>{/if}
	<span class="label">{event.title}</span>
</div>

<style>
	.chip {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		width: 100%;
		padding: 0.1rem 0.3rem;
		border-left: 3px solid var(--event-color);
		border-radius: 3px;
		background: color-mix(in srgb, var(--event-color) 16%, transparent);
		font-size: 0.72rem;
		line-height: 1.5;
		cursor: grab;
		user-select: none;
	}

	.chip:hover {
		background: color-mix(in srgb, var(--event-color) 26%, transparent);
	}

	.chip.lifted {
		opacity: 0.35;
	}

	.at {
		flex: none;
		font-variant-numeric: tabular-nums;
		color: var(--text-muted);
	}

	.label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
