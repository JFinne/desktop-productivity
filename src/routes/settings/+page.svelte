<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import SettingRow from '$lib/components/settings/SettingRow.svelte';
	import { registry } from '$lib/registry.svelte';
</script>

<PageHeader title="Settings" subtitle="Sections appear here as tools register them." />

<div class="sections">
	{#each registry.sections as section (section.id)}
		<section>
			<div class="head">
				<h2>{section.title}</h2>
				{#if section.description}<p>{section.description}</p>{/if}
			</div>
			<div class="fields">
				{#each section.fields as field, i (section.id + i)}
					<SettingRow {field} />
				{/each}
			</div>
		</section>
	{/each}
</div>

<style>
	.sections {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		max-width: 46rem;
	}

	.head {
		margin-bottom: 0.4rem;
	}

	h2 {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.head p {
		margin-top: 0.3rem;
		font-size: 0.8rem;
		color: var(--text-faint);
	}

	.fields {
		padding: 0.25rem 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--bg-raised);
	}
</style>
