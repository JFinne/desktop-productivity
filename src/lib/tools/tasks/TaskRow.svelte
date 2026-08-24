<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { ISODate } from '$lib/date';
	import { colorVar, taskStore, type Task } from './store.svelte';
	import DateMenu from './DateMenu.svelte';

	let { task }: { task: Task } = $props();

	const category = $derived(taskStore.category(task.categoryId));

	function onTitleInput(event: Event & { currentTarget: HTMLInputElement }) {
		taskStore.update(task.id, { title: event.currentTarget.value });
	}

	function onTitleKeydown(event: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		// Enter just commits — the value is already saved on every keystroke.
		if (event.key === 'Enter' || event.key === 'Escape') event.currentTarget.blur();
	}

	function schedule(date: ISODate | null) {
		taskStore.schedule(task.id, date);
	}
</script>

<div class="task" class:done={task.done}>
	<button
		type="button"
		class="check"
		role="checkbox"
		aria-checked={task.done}
		aria-label={task.done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
		onclick={() => taskStore.toggle(task.id)}
	>
		{#if task.done}<Icon name="check" size={12} stroke={2.5} />{/if}
	</button>

	<input
		class="title"
		value={task.title}
		oninput={onTitleInput}
		onkeydown={onTitleKeydown}
		aria-label="Task title"
	/>

	<select
		class="category"
		style:color={category ? colorVar(category.color) : 'var(--text-faint)'}
		value={task.categoryId ?? ''}
		onchange={(e) => taskStore.update(task.id, { categoryId: e.currentTarget.value || null })}
		aria-label="Category"
	>
		<option value="">No category</option>
		{#each taskStore.categories as option (option.id)}
			<option value={option.id}>{option.name}</option>
		{/each}
	</select>

	<DateMenu value={task.scheduledFor} onselect={schedule} />

	<button type="button" class="delete" aria-label="Delete task" onclick={() => taskStore.remove(task.id)}>
		<Icon name="trash" size={14} />
	</button>
</div>

<style>
	.task {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.2rem 0.35rem;
		border-radius: var(--radius);
	}

	.task:hover {
		background: var(--bg-hover);
	}

	.check {
		display: grid;
		place-items: center;
		flex: none;
		width: 16px;
		height: 16px;
		padding: 0;
		border: 1.5px solid var(--border-strong);
		border-radius: 4px;
		background: transparent;
		color: var(--accent-text);
	}

	.check:hover {
		border-color: var(--accent);
	}

	.task.done .check {
		border-color: var(--accent);
		background: var(--accent);
	}

	.title {
		flex: 1;
		min-width: 0;
		height: 28px;
		padding: 0 0.15rem;
		border: 0;
		background: transparent;
		font-size: 0.88rem;
	}

	.title:focus {
		outline: none;
		border-bottom: 1px solid var(--border-strong);
	}

	.task.done .title {
		color: var(--text-faint);
		text-decoration: line-through;
	}

	.category {
		flex: none;
		max-width: 120px;
		height: 24px;
		padding: 0 0.3rem;
		border: 1px solid transparent;
		border-radius: var(--radius);
		background: transparent;
		font-size: 0.76rem;
	}

	.category:hover,
	.category:focus-visible {
		border-color: var(--border-strong);
		background: var(--bg-raised);
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

	.task:hover .delete,
	.delete:focus-visible {
		opacity: 1;
	}

	.delete:hover {
		background: var(--bg-active);
		color: var(--danger);
	}
</style>
