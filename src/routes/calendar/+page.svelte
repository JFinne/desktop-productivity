<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import {
		addMonths,
		addDays,
		fullDayLabel,
		isSameMonth,
		monthLabel,
		monthMatrix,
		todayISO,
		weekDates,
		weekLabel,
		weekdayLabels,
		type ISODate
	} from '$lib/date';
	import { settings } from '$lib/settings/settings.svelte';
	import EventRow from '$lib/tools/events/EventRow.svelte';
	import { eventStore, type FokusEvent } from '$lib/tools/events/store.svelte';
	import DayCell from '$lib/tools/calendar/DayCell.svelte';
	import TaskChip from '$lib/tools/calendar/TaskChip.svelte';
	import { drag, parseDragPayload } from '$lib/tools/calendar/dnd.svelte';
	import TaskRow from '$lib/tools/tasks/TaskRow.svelte';
	import { taskStore, type Task } from '$lib/tools/tasks/store.svelte';

	type View = 'month' | 'week';

	const today = $derived(todayISO());

	let anchor = $state(todayISO());
	let selected = $state<ISODate>(todayISO());
	let view = $state<View | null>(null);
	let draftTitle = $state('');
	let draftEventTitle = $state('');
	let draftEventTime = $state('');
	let backlogDropTarget = $state(false);

	// Starts from the saved default, then follows whatever the user picks here.
	const activeView = $derived<View>(view ?? settings.value.calendar.defaultView);
	const weekStartsOn = $derived(settings.value.calendar.weekStartsOn);
	const showCompleted = $derived(settings.value.tasks.showCompleted);

	const listed = $derived(taskStore.tasks.filter((t) => showCompleted || !t.done));

	/** Tasks keyed by the day they sit on, so cells are a lookup rather than a scan. */
	const byDate = $derived.by(() => {
		const map = new Map<ISODate, Task[]>();
		for (const task of listed) {
			if (task.scheduledFor === null) continue;
			const day = map.get(task.scheduledFor) ?? [];
			day.push(task);
			map.set(task.scheduledFor, day);
		}
		for (const day of map.values()) day.sort((a, b) => a.order - b.order);
		return map;
	});

	const showEvents = $derived(settings.value.events.showOnCalendar);

	/** Events keyed by day, same shape as `byDate` so cells stay a lookup. */
	const eventsByDate = $derived.by(() => {
		const map = new Map<ISODate, FokusEvent[]>();
		if (!showEvents) return map;
		for (const event of eventStore.events) {
			const day = map.get(event.date) ?? [];
			day.push(event);
			map.set(event.date, day);
		}
		return map;
	});

	const selectedEvents = $derived(showEvents ? eventStore.forDate(selected) : []);

	const unscheduled = $derived(
		listed.filter((t) => t.scheduledFor === null).sort((a, b) => a.order - b.order)
	);

	const weeks = $derived(
		activeView === 'month'
			? monthMatrix(anchor, weekStartsOn)
			: [weekDates(anchor, weekStartsOn)]
	);

	const label = $derived(
		activeView === 'month' ? monthLabel(anchor) : weekLabel(anchor, weekStartsOn)
	);

	const selectedTasks = $derived(byDate.get(selected) ?? []);

	function step(direction: -1 | 1) {
		anchor = activeView === 'month' ? addMonths(anchor, direction) : addDays(anchor, direction * 7);
	}

	function goToday() {
		anchor = todayISO();
		selected = todayISO();
	}

	function addToSelected() {
		if (taskStore.add(draftTitle, { scheduledFor: selected })) draftTitle = '';
	}

	function addEventToSelected() {
		const created = eventStore.add({
			title: draftEventTitle,
			date: selected,
			// Blank time means all-day, matching the Events tab.
			start: draftEventTime || null
		});
		if (created) draftEventTitle = '';
	}

	function dropOnBacklog(dropEvent: DragEvent) {
		dropEvent.preventDefault();
		backlogDropTarget = false;
		// Only tasks can be unscheduled; an event without a day is a task.
		const item = parseDragPayload(dropEvent.dataTransfer?.getData('text/plain'));
		if (item?.kind === 'task') taskStore.schedule(item.id, null);
		drag.end();
	}
</script>

<PageHeader title="Calendar" subtitle="Drag a task onto any day to move it there.">
	{#snippet actions()}
		<div class="views">
			<button type="button" class:on={activeView === 'month'} onclick={() => (view = 'month')}>
				Month
			</button>
			<button type="button" class:on={activeView === 'week'} onclick={() => (view = 'week')}>
				Week
			</button>
		</div>
	{/snippet}
</PageHeader>

<div class="toolbar">
	<button type="button" class="nav prev" aria-label="Previous" onclick={() => step(-1)}>
		<Icon name="chevron" size={15} />
	</button>
	<button type="button" class="nav next" aria-label="Next" onclick={() => step(1)}>
		<Icon name="chevron" size={15} />
	</button>
	<button type="button" class="today" onclick={goToday}>Today</button>
	<h2>{label}</h2>
</div>

<!-- The backlog doubles as a drop target, so a day can hand a task back to Someday. -->
<div
	class="backlog"
	class:dropTarget={backlogDropTarget}
	class:armed={drag.item?.kind === 'task'}
	role="group"
	aria-label="Someday backlog"
	ondragover={(e) => {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		backlogDropTarget = true;
	}}
	ondragleave={() => (backlogDropTarget = false)}
	ondrop={dropOnBacklog}
>
	<span class="backlog-label">Someday</span>
	{#if unscheduled.length}
		<div class="backlog-chips" role="list">
			{#each unscheduled as task (task.id)}
				<div class="backlog-chip" role="none"><TaskChip {task} /></div>
			{/each}
		</div>
	{:else}
		<span class="backlog-empty">Drop a task here to unschedule it.</span>
	{/if}
</div>

<div class="weekdays">
	{#each weekdayLabels(weekStartsOn) as day (day)}
		<span>{day}</span>
	{/each}
</div>

<div class="grid" class:week={activeView === 'week'} role="grid">
	{#each weeks as week, index (index)}
		{#each week as date (date)}
			<DayCell
				{date}
				tasks={byDate.get(date) ?? []}
				events={eventsByDate.get(date) ?? []}
				muted={activeView === 'month' && !isSameMonth(date, anchor)}
				today={date === today}
				selected={date === selected}
				maxChips={activeView === 'week' ? 8 : 3}
				onselect={(picked) => (selected = picked)}
			/>
		{/each}
	{/each}
</div>

<section class="detail">
	<h3>{fullDayLabel(selected)}</h3>

	<div class="columns">
		<div class="col">
			<h4>To-do</h4>

			<form
				class="composer"
				onsubmit={(e) => {
					e.preventDefault();
					addToSelected();
				}}
			>
				<Icon name="plus" size={14} />
				<input
					bind:value={draftTitle}
					placeholder="Add a task to this day…"
					aria-label="New task"
				/>
				<button type="submit" disabled={!draftTitle.trim()}>Add</button>
			</form>

			{#each selectedTasks as task (task.id)}
				<TaskRow {task} />
			{/each}

			{#if !selectedTasks.length}
				<p class="empty">Nothing to do.</p>
			{/if}
		</div>

		{#if showEvents}
			<div class="col">
				<h4>Events</h4>

				<form
					class="composer"
					onsubmit={(e) => {
						e.preventDefault();
						addEventToSelected();
					}}
				>
					<Icon name="plus" size={14} />
					<input
						bind:value={draftEventTitle}
						placeholder="Add an event…"
						aria-label="New event"
					/>
					<input
						class="time"
						type="time"
						bind:value={draftEventTime}
						aria-label="Start time (blank for all day)"
						title="Leave blank for an all-day event"
					/>
					<button type="submit" disabled={!draftEventTitle.trim()}>Add</button>
				</form>

				{#each selectedEvents as event (event.id)}
					<EventRow {event} compact />
				{/each}

				{#if !selectedEvents.length}
					<p class="empty">Nothing on.</p>
				{/if}
			</div>
		{/if}
	</div>
</section>

<style>
	.views {
		display: flex;
		gap: 2px;
		padding: 2px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--bg-raised);
	}

	.views button {
		height: 24px;
		padding: 0 0.6rem;
		border: 0;
		border-radius: 4px;
		background: transparent;
		color: var(--text-muted);
		font-size: 0.78rem;
	}

	.views button:hover {
		color: var(--text);
	}

	.views button.on {
		background: var(--bg-active);
		color: var(--text);
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-bottom: 0.9rem;
	}

	.nav,
	.today {
		display: grid;
		place-items: center;
		height: 28px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--bg-raised);
		color: var(--text-muted);
	}

	.nav {
		width: 28px;
	}

	/* One chevron asset, turned to point either way. */
	.nav.prev :global(svg) {
		transform: rotate(90deg);
	}

	.nav.next :global(svg) {
		transform: rotate(-90deg);
	}

	.today {
		padding: 0 0.7rem;
		font-size: 0.78rem;
	}

	.nav:hover,
	.today:hover {
		background: var(--bg-hover);
		color: var(--text);
	}

	.toolbar h2 {
		margin-left: 0.35rem;
		font-size: 0.95rem;
		font-weight: 600;
	}

	.backlog {
		display: flex;
		align-items: flex-start;
		gap: 0.7rem;
		min-height: 40px;
		margin-bottom: 1rem;
		padding: 0.45rem 0.6rem;
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius-lg);
		transition:
			border-color 120ms ease,
			background 120ms ease;
	}

	/* Only hint at the drop zone while something is actually being dragged. */
	.backlog.armed {
		border-color: var(--text-faint);
	}

	.backlog.dropTarget {
		border-color: var(--accent);
		background: var(--accent-soft);
	}

	.backlog-label {
		flex: none;
		padding-top: 0.1rem;
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.backlog-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.backlog-chip {
		max-width: 190px;
	}

	.backlog-empty {
		padding-top: 0.1rem;
		font-size: 0.76rem;
		color: var(--text-faint);
	}

	.weekdays,
	.grid {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 4px;
	}

	.weekdays {
		margin-bottom: 0.3rem;
	}

	.weekdays span {
		padding-left: 0.4rem;
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-faint);
	}

	.grid.week :global(.cell) {
		min-height: 240px;
	}

	.detail {
		margin-top: 1.8rem;
	}

	.columns {
		display: flex;
		align-items: flex-start;
		gap: 1.8rem;
		/* Wraps to stacked columns before either side gets too narrow to use. */
		flex-wrap: wrap;
	}

	.col {
		flex: 1 1 24rem;
		min-width: 0;
	}

	.col h4 {
		margin-bottom: 0.4rem;
		padding-left: 0.35rem;
		font-size: 0.66rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-faint);
	}

	.composer .time {
		flex: none;
		width: 6.6rem;
		height: 26px;
		padding: 0 0.3rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--bg);
		color: var(--text-muted);
		font-size: 0.74rem;
	}

	.detail h3 {
		margin-bottom: 0.5rem;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.composer {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		padding: 0.25rem 0.6rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		background: var(--bg-raised);
		color: var(--text-faint);
	}

	.composer:focus-within {
		border-color: var(--accent);
		color: var(--accent);
	}

	.composer input {
		flex: 1;
		min-width: 0;
		height: 30px;
		border: 0;
		background: transparent;
		color: var(--text);
		font-size: 0.86rem;
	}

	.composer input:focus {
		outline: none;
	}

	.composer button {
		height: 26px;
		padding: 0 0.75rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--bg);
		font-size: 0.78rem;
	}

	.composer button:hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--accent);
	}

	.composer button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.empty {
		padding-left: 0.35rem;
		font-size: 0.82rem;
		color: var(--text-faint);
	}
</style>
