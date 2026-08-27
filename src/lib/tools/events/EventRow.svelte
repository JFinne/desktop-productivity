<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { formatTime, type ISODate } from '$lib/date';
	import ColorPicker from '$lib/tools/tasks/ColorPicker.svelte';
	import DateMenu from '$lib/tools/tasks/DateMenu.svelte';
	import { eventStore, type FokusEvent } from './store.svelte';

	let {
		event,
		compact = false
	}: {
		event: FokusEvent;
		/**
		 * For narrow columns: drops the time inputs and the date picker, and
		 * shows only the start time. The full range stays in the tooltip.
		 */
		compact?: boolean;
	} = $props();

	const fullTime = $derived(
		!event.start
			? 'All day'
			: event.end
				? `${formatTime(event.start)} – ${formatTime(event.end)}`
				: formatTime(event.start)
	);

	const timeLabel = $derived(
		compact ? (event.start ? formatTime(event.start) : 'All day') : fullTime
	);

	function schedule(date: ISODate | null) {
		// `allowNone` is off on the menu, so null can't reach here in practice.
		if (date) eventStore.update(event.id, { date });
	}
</script>

<!--
	No checkbox: an event is not something you complete. The time takes the slot
	where a task row puts its tick box, which is what makes the two read
	differently at a glance in a shared list.
-->
<div class="event" class:compact title={compact ? `${event.title} · ${fullTime}` : undefined}>
	<span class="time" class:allday={!event.start} style:color={event.color}>{timeLabel}</span>

	<div class="body">
		<input
			class="title"
			value={event.title}
			aria-label="Event title"
			oninput={(e) => eventStore.update(event.id, { title: e.currentTarget.value })}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur();
			}}
		/>
		{#if event.location}
			<span class="location"><Icon name="pin" size={11} />{event.location}</span>
		{/if}
	</div>

	{#if !compact}
		<div class="times">
			<input
				type="time"
				class="clock"
				value={event.start ?? ''}
				aria-label="Start time"
				onchange={(e) => eventStore.update(event.id, { start: e.currentTarget.value || null })}
			/>
			{#if event.start}
				<span class="dash">–</span>
				<input
					type="time"
					class="clock"
					value={event.end ?? ''}
					aria-label="End time"
					onchange={(e) => eventStore.update(event.id, { end: e.currentTarget.value || null })}
				/>
			{/if}
		</div>
	{/if}

	<ColorPicker
		value={event.color}
		label="Colour for {event.title}"
		onchange={(picked) => eventStore.update(event.id, { color: picked })}
	/>

	{#if !compact}
		<DateMenu value={event.date} allowNone={false} onselect={schedule} />
	{/if}

	<button
		type="button"
		class="delete"
		aria-label="Delete event"
		onclick={() => eventStore.remove(event.id)}
	>
		<Icon name="trash" size={14} />
	</button>
</div>

<style>
	.event {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.2rem 0.35rem;
		border-radius: var(--radius);
	}

	.event:hover {
		background: var(--bg-hover);
	}

	.time {
		flex: none;
		width: 8.5rem;
		font-size: 0.78rem;
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	.time.allday {
		color: var(--text-faint) !important;
		font-style: italic;
	}

	.body {
		display: flex;
		flex: 1;
		min-width: 0;
		flex-direction: column;
	}

	.title {
		height: 26px;
		border: 0;
		background: transparent;
		color: var(--text);
		font-size: 0.88rem;
	}

	.title:focus {
		outline: none;
		border-bottom: 1px solid var(--border-strong);
	}

	.location {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding-left: 0.15rem;
		font-size: 0.74rem;
		color: var(--text-faint);
	}

	.event.compact .time {
		width: 5rem;
	}

	.times {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		flex: none;
	}

	.clock {
		width: 6.6rem;
		height: 24px;
		padding: 0 0.25rem;
		border: 1px solid transparent;
		border-radius: var(--radius);
		background: transparent;
		color: var(--text-muted);
		font-size: 0.74rem;
	}

	.clock:hover,
	.clock:focus-visible {
		border-color: var(--border-strong);
		background: var(--bg-raised);
		color: var(--text);
	}

	.dash {
		color: var(--text-faint);
		font-size: 0.74rem;
	}

	.delete {
		display: grid;
		place-items: center;
		flex: none;
		width: 26px;
		height: 26px;
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		color: var(--text-faint);
		opacity: 0;
	}

	.event:hover .delete,
	.delete:focus-visible {
		opacity: 1;
	}

	.delete:hover {
		background: var(--bg-active);
		color: var(--danger);
	}
</style>
