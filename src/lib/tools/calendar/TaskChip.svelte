<script lang="ts">
	import { colorVar, taskStore, type Task } from '$lib/tools/tasks/store.svelte';
	import { drag } from './dnd.svelte';

	let { task }: { task: Task } = $props();

	const category = $derived(taskStore.category(task.categoryId));

	function onDragStart(event: DragEvent) {
		event.dataTransfer?.setData('text/plain', task.id);
		if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
		drag.start(task.id);
	}
</script>

<!--
	A chip only shows and moves a task. Clicking it falls through to the day cell,
	which selects that day; editing and completing happen in the detail panel, where
	a stray click can't tick something off by accident.
-->
<div
	class="chip"
	class:done={task.done}
	class:lifted={drag.taskId === task.id}
	draggable="true"
	role="listitem"
	title={task.title}
	ondragstart={onDragStart}
	ondragend={() => drag.end()}
>
	<span class="dot" style:background={category ? colorVar(category.color) : 'var(--text-faint)'}
	></span>
	<span class="label">{task.title}</span>
</div>

<style>
	.chip {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		width: 100%;
		padding: 0.1rem 0.3rem;
		border-radius: 4px;
		background: var(--bg-raised);
		font-size: 0.72rem;
		line-height: 1.5;
		cursor: grab;
		user-select: none;
	}

	.chip:hover {
		background: var(--bg-active);
	}

	.chip.lifted {
		opacity: 0.35;
	}

	.dot {
		flex: none;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		box-shadow: var(--swatch-ring);
	}

	.label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		/* Without this a slow drag selects the text instead of lifting the chip. */
		-webkit-user-select: none;
		user-select: none;
	}

	.chip.done .label {
		color: var(--text-faint);
		text-decoration: line-through;
	}
</style>
