<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import ColorPicker from './ColorPicker.svelte';
	import { DEFAULT_CATEGORY_COLOR, taskStore, type CategoryColor } from './store.svelte';

	let name = $state('');
	let color = $state<CategoryColor>(DEFAULT_CATEGORY_COLOR);

	function add() {
		if (taskStore.addCategory(name, color)) name = '';
	}
</script>

<div class="manager">
	<div class="list">
		{#each taskStore.categories as category (category.id)}
			<div class="row">
				<ColorPicker
					value={category.color}
					label="Colour for {category.name}"
					onchange={(picked) => taskStore.updateCategory(category.id, { color: picked })}
				/>
				<input
					class="name"
					value={category.name}
					oninput={(e) => taskStore.updateCategory(category.id, { name: e.currentTarget.value })}
					aria-label="Category name"
				/>
				<button
					type="button"
					class="remove"
					aria-label="Delete category"
					title="Tasks in this category keep existing, uncategorised."
					onclick={() => taskStore.removeCategory(category.id)}
				>
					<Icon name="trash" size={13} />
				</button>
			</div>
		{/each}
	</div>

	<form
		class="add"
		onsubmit={(e) => {
			e.preventDefault();
			add();
		}}
	>
		<ColorPicker value={color} label="Colour for the new category" onchange={(p) => (color = p)} />
		<input class="name" bind:value={name} placeholder="New category" />
		<button class="addBtn" type="submit" disabled={!name.trim()}>
			<Icon name="plus" size={13} />
		</button>
	</form>
</div>

<style>
	.manager {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		margin-bottom: 1.5rem;
		padding: 0.6rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--bg-raised);
	}

	.row,
	.add {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.add {
		margin-top: 0.35rem;
		padding-top: 0.55rem;
		border-top: 1px solid var(--border);
	}

	.name {
		flex: 1;
		min-width: 0;
		height: 26px;
		padding: 0 0.3rem;
		border: 1px solid transparent;
		border-radius: var(--radius);
		background: transparent;
		font-size: 0.82rem;
	}

	.name:hover,
	.name:focus {
		border-color: var(--border-strong);
		background: var(--bg);
		outline: none;
	}

	.remove,
	.addBtn {
		display: grid;
		place-items: center;
		flex: none;
		width: 26px;
		height: 26px;
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		color: var(--text-faint);
	}

	.remove:hover {
		background: var(--bg-active);
		color: var(--danger);
	}

	.addBtn:hover:not(:disabled) {
		background: var(--bg-active);
		color: var(--accent);
	}

	.addBtn:disabled {
		opacity: 0.4;
		cursor: default;
	}
</style>
