<script lang="ts">
	import { anchored } from '$lib/anchored';
	import Icon from '$lib/components/Icon.svelte';
	import { CATEGORY_PRESETS, colorVar, resolveColor } from './store.svelte';

	let {
		value,
		onchange,
		label = 'Colour'
	}: { value: string; onchange: (color: string) => void; label?: string } = $props();

	let open = $state(false);
	let root = $state<HTMLElement | null>(null);
	let trigger = $state<HTMLElement | null>(null);

	/** The native colour input needs a literal hex, not a CSS variable. */
	const current = $derived(resolveColor(value));

	function pick(hex: string) {
		onchange(hex);
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

<div class="picker" bind:this={root}>
	<button
		bind:this={trigger}
		type="button"
		class="trigger"
		aria-label={label}
		aria-expanded={open}
		title={label}
		onclick={() => (open = !open)}
	>
		<span class="dot" style:background={colorVar(value)}></span>
	</button>

	{#if open}
		<div class="menu" use:anchored={{ anchor: trigger, align: 'start' }}>
			<div class="swatches">
				{#each CATEGORY_PRESETS as preset (preset.hex)}
					<button
						type="button"
						class="swatch"
						style:background={preset.hex}
						title={preset.name}
						aria-label={preset.name}
						aria-pressed={current.toLowerCase() === preset.hex.toLowerCase()}
						onclick={() => pick(preset.hex)}
					>
						{#if current.toLowerCase() === preset.hex.toLowerCase()}
							<Icon name="check" size={12} stroke={3} />
						{/if}
					</button>
				{/each}
			</div>

			<!--
				The native colour input opens the OS picker, which already has a
				spectrum and an eyedropper — better than anything hand-rolled here,
				and it costs no dependency.
			-->
			<label class="custom">
				<span class="wheel"></span>
				<span class="text">Custom…</span>
				<span class="hex">{current.toUpperCase()}</span>
				<input
					type="color"
					value={current}
					oninput={(e) => onchange(e.currentTarget.value)}
					aria-label="Custom colour"
				/>
			</label>
		</div>
	{/if}
</div>

<style>
	.picker {
		position: relative;
		flex: none;
	}

	.trigger {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		padding: 0;
		border: 1px solid transparent;
		border-radius: var(--radius);
		background: transparent;
	}

	.trigger:hover,
	.trigger:focus-visible,
	.trigger[aria-expanded='true'] {
		border-color: var(--border-strong);
		background: var(--bg);
	}

	.dot {
		width: 13px;
		height: 13px;
		border-radius: 50%;
		box-shadow: var(--swatch-ring);
	}

	.menu {
		/* Positioned by the `anchored` action, which sets position/left/top. */
		z-index: 30;
		width: 208px;
		padding: 0.5rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		background: var(--bg-raised);
		box-shadow: 0 12px 28px rgb(0 0 0 / 0.35);
	}

	.swatches {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.35rem;
	}

	.swatch {
		display: grid;
		place-items: center;
		aspect-ratio: 1;
		padding: 0;
		border: 0;
		border-radius: 50%;
		color: #fff;
		box-shadow: var(--swatch-ring);
		transition: transform 100ms ease;
	}

	.swatch:hover {
		transform: scale(1.12);
	}

	.custom {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
		padding: 0.4rem 0.35rem 0.15rem;
		border-top: 1px solid var(--border);
		font-size: 0.78rem;
		cursor: pointer;
	}

	.custom:hover .text {
		color: var(--text);
	}

	.wheel {
		flex: none;
		width: 15px;
		height: 15px;
		border-radius: 50%;
		background: conic-gradient(
			#e5544b,
			#e8913a,
			#e3b341,
			#8fbf6b,
			#3fb4b0,
			#3e9fd6,
			#5b7fe0,
			#a96bd1,
			#de6ba5,
			#e5544b
		);
		box-shadow: var(--swatch-ring);
	}

	.text {
		flex: 1;
		color: var(--text-muted);
	}

	.hex {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--text-faint);
	}

	/* The real input sits invisibly over the row so the whole row is the target. */
	input[type='color'] {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		opacity: 0;
		cursor: pointer;
	}
</style>
