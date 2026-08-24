<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		subtitle,
		actions
	}: { title: string; subtitle?: string; actions?: Snippet } = $props();
</script>

<header class="page-header">
	<div>
		<h1>{title}</h1>
		{#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
	</div>
	{#if actions}
		<div class="actions">{@render actions()}</div>
	{/if}
</header>

<style>
	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.75rem;
	}

	h1 {
		font-size: 1.15rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.subtitle {
		margin-top: 0.2rem;
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}
</style>
