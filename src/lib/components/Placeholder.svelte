<script lang="ts">
	import Icon from './Icon.svelte';
	import type { IconName } from './icons';

	let { icon, note }: { icon: IconName; note: string } = $props();
</script>

<div class="placeholder">
	<Icon name={icon} size={26} stroke={1.4} />
	<p>{note}</p>
</div>

<style>
	.placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 4rem 1rem;
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius-lg);
		color: var(--text-faint);
		text-align: center;
	}

	p {
		font-size: 0.85rem;
		max-width: 34ch;
	}
</style>
