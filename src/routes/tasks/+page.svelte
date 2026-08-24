<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { formatDayLabel, todayISO, type ISODate } from '$lib/date';
	import { settings } from '$lib/settings/settings.svelte';
	import CategoryManager from '$lib/tools/tasks/CategoryManager.svelte';
	import DateMenu from '$lib/tools/tasks/DateMenu.svelte';
	import TaskRow from '$lib/tools/tasks/TaskRow.svelte';
	import { colorVar, taskStore, type Task } from '$lib/tools/tasks/store.svelte';

	let filterCategoryId = $state<string | null>(null);
	let managingCategories = $state(false);

	let draftTitle = $state('');
	let draftCategoryId = $state('');
	let draftDate = $state<ISODate | null>(todayISO());

	const today = $derived(todayISO());
	const byOrder = (a: Task, b: Task) => a.order - b.order;

	const visible = $derived(
		taskStore.tasks.filter(
			(task) => filterCategoryId === null || task.categoryId === filterCategoryId
		)
	);
	const active = $derived(visible.filter((task) => !task.done));

	// Only reachable with carry-over turned off; otherwise these move to today on load.
	const overdue = $derived(
		active
			.filter((t) => t.scheduledFor !== null && t.scheduledFor < today)
			.sort((a, b) => (a.scheduledFor! < b.scheduledFor! ? -1 : 1))
	);
	const dueToday = $derived(active.filter((t) => t.scheduledFor === today).sort(byOrder));
	const someday = $derived(active.filter((t) => t.scheduledFor === null).sort(byOrder));

	const upcoming = $derived.by(() => {
		const groups = new Map<ISODate, Task[]>();
		for (const task of active) {
			if (task.scheduledFor === null || task.scheduledFor <= today) continue;
			const group = groups.get(task.scheduledFor) ?? [];
			group.push(task);
			groups.set(task.scheduledFor, group);
		}
		return [...groups.entries()]
			.sort(([a], [b]) => (a < b ? -1 : 1))
			.map(([date, tasks]) => ({ date, tasks: tasks.sort(byOrder) }));
	});

	const completed = $derived(
		visible
			.filter((t) => t.done)
			.sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
	);

	const isEmpty = $derived(taskStore.loaded && visible.length === 0);

	function addTask() {
		const created = taskStore.add(draftTitle, {
			categoryId: draftCategoryId || null,
			scheduledFor: draftDate
		});
		if (created) draftTitle = '';
	}
</script>

{#snippet section(title: string, tasks: Task[], accent?: string)}
	{#if tasks.length}
		<section>
			<h2 style:color={accent}>{title}<span class="count">{tasks.length}</span></h2>
			{#each tasks as task (task.id)}
				<TaskRow {task} />
			{/each}
		</section>
	{/if}
{/snippet}

<PageHeader title="Tasks" subtitle="What you are working on, and what waits for another day.">
	{#snippet actions()}
		<button type="button" class="manage" onclick={() => (managingCategories = !managingCategories)}>
			<Icon name="tag" size={14} />
			Categories
		</button>
	{/snippet}
</PageHeader>

{#if managingCategories}
	<CategoryManager />
{/if}

<form
	class="composer"
	onsubmit={(e) => {
		e.preventDefault();
		addTask();
	}}
>
	<Icon name="plus" size={15} />
	<input bind:value={draftTitle} placeholder="Add a task…" aria-label="New task" />
	<select bind:value={draftCategoryId} aria-label="Category for the new task">
		<option value="">No category</option>
		{#each taskStore.categories as category (category.id)}
			<option value={category.id}>{category.name}</option>
		{/each}
	</select>
	<DateMenu value={draftDate} onselect={(date) => (draftDate = date)} />
	<button type="submit" disabled={!draftTitle.trim()}>Add</button>
</form>

{#if taskStore.categories.length}
	<div class="filters">
		<button
			type="button"
			class:on={filterCategoryId === null}
			onclick={() => (filterCategoryId = null)}
		>
			All
		</button>
		{#each taskStore.categories as category (category.id)}
			<button
				type="button"
				class:on={filterCategoryId === category.id}
				onclick={() => (filterCategoryId = filterCategoryId === category.id ? null : category.id)}
			>
				<span class="swatch" style:background={colorVar(category.color)}></span>
				{category.name}
			</button>
		{/each}
	</div>
{/if}

<div class="lists">
	{@render section('Overdue', overdue, 'var(--danger)')}
	{@render section('Today', dueToday)}

	{#each upcoming as group (group.date)}
		{@render section(formatDayLabel(group.date, today), group.tasks)}
	{/each}

	{@render section('Someday', someday)}

	{#if settings.value.tasks.showCompleted && completed.length}
		<section>
			<h2>
				Completed<span class="count">{completed.length}</span>
				<button type="button" class="clear" onclick={() => taskStore.clearCompleted()}>Clear</button>
			</h2>
			{#each completed as task (task.id)}
				<TaskRow {task} />
			{/each}
		</section>
	{/if}

	{#if isEmpty}
		<p class="empty">
			Nothing here yet. Add what you want to get through today, or park something under Someday.
		</p>
	{/if}
</div>

<style>
	.manage {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		height: 30px;
		padding: 0 0.7rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--bg-raised);
		color: var(--text-muted);
		font-size: 0.82rem;
	}

	.manage:hover {
		background: var(--bg-hover);
		color: var(--text);
	}

	.composer {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		max-width: 46rem;
		padding: 0.35rem 0.6rem;
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
		height: 32px;
		border: 0;
		background: transparent;
		color: var(--text);
		font-size: 0.9rem;
	}

	.composer input:focus {
		outline: none;
	}

	.composer select {
		height: 26px;
		padding: 0 0.3rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--bg);
		font-size: 0.76rem;
	}

	.composer button[type='submit'] {
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

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin: 1.1rem 0 0.4rem;
	}

	.filters button {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		height: 25px;
		padding: 0 0.6rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: transparent;
		color: var(--text-muted);
		font-size: 0.76rem;
	}

	.filters button:hover {
		background: var(--bg-hover);
		color: var(--text);
	}

	.filters button.on {
		border-color: var(--border-strong);
		background: var(--bg-active);
		color: var(--text);
	}

	.swatch {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		box-shadow: var(--swatch-ring);
	}

	.lists {
		display: flex;
		flex-direction: column;
		gap: 1.6rem;
		max-width: 46rem;
		margin-top: 1.4rem;
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

	.count {
		color: var(--text-faint);
		font-weight: 500;
		letter-spacing: 0;
	}

	.clear {
		margin-left: auto;
		border: 0;
		background: transparent;
		color: var(--text-faint);
		font-size: 0.72rem;
		letter-spacing: 0.04em;
	}

	.clear:hover {
		color: var(--danger);
	}

	.empty {
		max-width: 40ch;
		color: var(--text-faint);
		font-size: 0.85rem;
	}
</style>
