<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { addDays, formatDayLabel, todayISO, type ISODate } from '$lib/date';
	import EventRow from '$lib/tools/events/EventRow.svelte';
	import { DEFAULT_EVENT_COLOR, eventStore } from '$lib/tools/events/store.svelte';
	import ColorPicker from '$lib/tools/tasks/ColorPicker.svelte';
	import DateMenu from '$lib/tools/tasks/DateMenu.svelte';

	let title = $state('');
	let date = $state<ISODate>(todayISO());
	let allDay = $state(false);
	let start = $state('09:00');
	let end = $state('');
	let location = $state('');
	let color = $state(DEFAULT_EVENT_COLOR);
	let showPast = $state(false);

	const today = $derived(todayISO());

	const upcoming = $derived(eventStore.grouped(today));
	const past = $derived(eventStore.grouped(undefined, addDays(today, -1)).reverse());

	function add() {
		const created = eventStore.add({
			title,
			date,
			start: allDay ? null : start,
			end: allDay ? null : end,
			location,
			color
		});
		if (created) {
			title = '';
			location = '';
		}
	}
</script>

<PageHeader title="Events" subtitle="Things that happen at a time. They stay on their day." />

<form
	class="composer"
	onsubmit={(e) => {
		e.preventDefault();
		add();
	}}
>
	<div class="line">
		<Icon name="plus" size={15} />
		<input class="title" bind:value={title} placeholder="Add an event…" aria-label="Event title" />
		<ColorPicker value={color} label="Event colour" onchange={(picked) => (color = picked)} />
		<DateMenu value={date} allowNone={false} onselect={(picked) => picked && (date = picked)} />
		<button type="submit" disabled={!title.trim()}>Add</button>
	</div>

	<div class="line details">
		<label class="allday">
			<input type="checkbox" bind:checked={allDay} />
			All day
		</label>

		{#if !allDay}
			<label class="field">
				<Icon name="clock" size={13} />
				<input type="time" bind:value={start} aria-label="Start time" />
			</label>
			<span class="dash">–</span>
			<label class="field">
				<input type="time" bind:value={end} aria-label="End time" />
			</label>
		{/if}

		<label class="field grow">
			<Icon name="pin" size={13} />
			<input bind:value={location} placeholder="Location (optional)" aria-label="Location" />
		</label>
	</div>
</form>

<div class="lists">
	{#each upcoming as group (group.date)}
		<section>
			<h2>
				{formatDayLabel(group.date, today)}<span class="count">{group.events.length}</span>
			</h2>
			{#each group.events as event (event.id)}
				<EventRow {event} />
			{/each}
		</section>
	{/each}

	{#if !upcoming.length}
		<p class="empty">
			Nothing coming up. Add something with a time — a lesson, an appointment, a birthday.
		</p>
	{/if}

	{#if past.length}
		<section class="pastSection">
			<h2>
				<button type="button" class="toggle" onclick={() => (showPast = !showPast)}>
					<Icon name="chevron" size={12} class={showPast ? '' : 'closed'} />
					Past<span class="count">{past.reduce((n, g) => n + g.events.length, 0)}</span>
				</button>
			</h2>
			{#if showPast}
				{#each past as group (group.date)}
					<h3>{formatDayLabel(group.date, today)}</h3>
					{#each group.events as event (event.id)}
						<EventRow {event} />
					{/each}
				{/each}
			{/if}
		</section>
	{/if}
</div>

<style>
	.composer {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		max-width: 52rem;
		padding: 0.45rem 0.6rem 0.55rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		background: var(--bg-raised);
		color: var(--text-faint);
	}

	.composer:focus-within {
		border-color: var(--accent);
	}

	.line {
		display: flex;
		align-items: center;
		gap: 0.55rem;
	}

	.details {
		padding-left: 1.6rem;
		border-top: 1px solid var(--border);
		padding-top: 0.45rem;
	}

	.composer .title {
		flex: 1;
		min-width: 0;
		height: 32px;
		border: 0;
		background: transparent;
		color: var(--text);
		font-size: 0.9rem;
	}

	.composer input:focus {
		outline: none;
	}

	.allday {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		flex: none;
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.allday input {
		accent-color: var(--accent);
	}

	.field {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		flex: none;
		height: 26px;
		padding: 0 0.4rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--bg);
	}

	.field.grow {
		flex: 1;
		min-width: 0;
	}

	.field input {
		min-width: 0;
		border: 0;
		background: transparent;
		color: var(--text);
		font-size: 0.76rem;
	}

	.dash {
		font-size: 0.76rem;
	}

	.composer button[type='submit'] {
		flex: none;
		height: 28px;
		padding: 0 0.8rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--bg);
		font-size: 0.8rem;
	}

	.composer button[type='submit']:hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--accent);
	}

	.composer button[type='submit']:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.lists {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 52rem;
		margin-top: 1.5rem;
	}

	h2 {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		margin-bottom: 0.3rem;
		padding-left: 0.35rem;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	h3 {
		margin: 0.6rem 0 0.15rem;
		padding-left: 0.35rem;
		font-size: 0.72rem;
		font-weight: 500;
		color: var(--text-faint);
	}

	.count {
		color: var(--text-faint);
		font-weight: 500;
		letter-spacing: 0;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		letter-spacing: inherit;
		text-transform: inherit;
	}

	.toggle:hover {
		color: var(--text);
	}

	.toggle :global(svg) {
		transition: transform 120ms ease;
	}

	.toggle :global(svg.closed) {
		transform: rotate(-90deg);
	}

	.empty {
		max-width: 44ch;
		color: var(--text-faint);
		font-size: 0.85rem;
	}
</style>
