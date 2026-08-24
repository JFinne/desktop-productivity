<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { addDays, formatDayLabel, todayISO, type ISODate } from '$lib/date';

	let {
		value,
		onselect
	}: { value: ISODate | null; onselect: (date: ISODate | null) => void } = $props();

	let open = $state(false);
	let root = $state<HTMLElement | null>(null);

	const today = $derived(todayISO());
	const label = $derived(value === null ? 'Someday' : formatDayLabel(value, today));

	const presets = $derived([
		{ label: 'Today', date: today },
		{ label: 'Tomorrow', date: addDays(today, 1) },
		{ label: 'Next week', date: addDays(today, 7) },
		{ label: 'Someday', date: null }
	]);

	function choose(date: ISODate | null) {
		onselect(date);
		open = false;
	}

	function onPointerDown(event: PointerEvent) {
		if (open && root && !root.contains(event.target as Node)) open = false;
	}
</script>

<svelte:window
	onpointerdown={onPointerDown}
	onkeydown={(e) => {
		if (e.key === 'Escape') open = false;
	}}
/>

<div class="date-menu" bind:this={root}>
	<button
			type="button"
			class="trigger"
			class:someday={value === null}
			onclick={() => (open = !open)}
		>
		{label}
		<Icon name="chevron" size={12} />
	</button>

	{#if open}
		<div class="menu">
			{#each presets as preset (preset.label)}
				<button type="button" class="option" onclick={() => choose(preset.date)}>
					<span>{preset.label}</span>
					{#if preset.date}<span class="hint">{formatDayLabel(preset.date, today)}</span>{/if}
				</button>
			{/each}
			<label class="picker">
				<span>Pick a date</span>
				<input
					type="date"
					value={value ?? ''}
					onchange={(e) => choose(e.currentTarget.value || null)}
				/>
			</label>
		</div>
	{/if}
</div>

<style>
	.date-menu {
		position: relative;
		flex: none;
	}

	.trigger {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		height: 24px;
		padding: 0 0.4rem;
		border: 1px solid transparent;
		border-radius: var(--radius);
		background: transparent;
		color: var(--text-muted);
		font-size: 0.76rem;
		white-space: nowrap;
	}

	.trigger:hover,
	.trigger:focus-visible {
		border-color: var(--border-strong);
		background: var(--bg-raised);
		color: var(--text);
	}

	.trigger.someday {
		color: var(--text-faint);
	}

	.menu {
		position: absolute;
		top: calc(100% + 4px);
		right: 0;
		z-index: 20;
		display: flex;
		flex-direction: column;
		min-width: 224px;
		padding: 0.25rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		background: var(--bg-raised);
		box-shadow: 0 12px 28px rgb(0 0 0 / 0.35);
	}

	.option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.4rem 0.5rem;
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		font-size: 0.82rem;
		text-align: left;
	}

	.option:hover {
		background: var(--bg-hover);
	}

	.hint {
		font-size: 0.74rem;
		color: var(--text-faint);
	}

	.picker {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		white-space: nowrap;
		margin-top: 0.25rem;
		padding: 0.4rem 0.5rem;
		border-top: 1px solid var(--border);
		font-size: 0.82rem;
	}

	.picker input {
		width: 120px;
		padding: 0.15rem 0.3rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--bg);
		font-size: 0.76rem;
	}
</style>
