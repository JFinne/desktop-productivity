<script lang="ts">
	import { settings } from '$lib/settings/settings.svelte';
	import { themes, type Theme } from '$lib/themes/themes';

	const selected = $derived(settings.value.appearance.themeId);

	const dark = themes.filter((t) => t.mode === 'dark');
	const light = themes.filter((t) => t.mode === 'light');

	function choose(theme: Theme) {
		settings.value.appearance.themeId = theme.id;
	}
</script>

{#snippet swatch(theme: Theme)}
	<button
		type="button"
		class="swatch"
		class:on={selected === theme.id}
		aria-pressed={selected === theme.id}
		onclick={() => choose(theme)}
	>
		<!--
			A miniature of the app itself: sunken rail on the left, content on the
			right, accent dot and two text lines. Painted from the theme's own
			tokens, so the preview can never drift from the real thing.
		-->
		<span
			class="chip"
			style:background={theme.tokens.bg}
			style:border-color={theme.tokens.borderStrong}
		>
			<span class="rail" style:background={theme.tokens.bgSunken}>
				<span class="pip" style:background={theme.tokens.accent}></span>
			</span>
			<span class="body">
				<span class="line" style:background={theme.tokens.text}></span>
				<span class="line short" style:background={theme.tokens.textMuted}></span>
				<span class="card" style:background={theme.tokens.bgRaised}></span>
			</span>
		</span>
		<span class="name">{theme.name}</span>
	</button>
{/snippet}

<div class="picker">
	<div class="group">
		<h4>Dark</h4>
		<div class="grid">
			{#each dark as theme (theme.id)}{@render swatch(theme)}{/each}
		</div>
	</div>

	<div class="group">
		<h4>Light</h4>
		<div class="grid">
			{#each light as theme (theme.id)}{@render swatch(theme)}{/each}
		</div>
	</div>
</div>

<style>
	.picker {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
		padding: 0.4rem 0 0.2rem;
	}

	h4 {
		margin: 0 0 0.45rem;
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-faint);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
		gap: 0.6rem;
	}

	.swatch {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 0;
		border: 0;
		background: none;
		text-align: left;
	}

	.chip {
		display: flex;
		height: 58px;
		border: 1px solid;
		border-radius: var(--radius);
		overflow: hidden;
		transition:
			box-shadow 120ms ease,
			transform 120ms ease;
	}

	.swatch:hover .chip {
		transform: translateY(-1px);
	}

	.swatch.on .chip {
		/* Ring rather than a border swap, so the preview's own edge colour shows. */
		box-shadow: 0 0 0 2px var(--accent);
	}

	.rail {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		width: 22px;
		padding-top: 7px;
	}

	.pip {
		width: 7px;
		height: 7px;
		border-radius: 2px;
	}

	.body {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 4px;
		padding: 8px 8px 0;
	}

	.line {
		height: 3px;
		width: 78%;
		border-radius: 2px;
		opacity: 0.85;
	}

	.line.short {
		width: 52%;
	}

	.card {
		flex: 1;
		margin-top: 2px;
		border-radius: 3px 3px 0 0;
	}

	.name {
		font-size: 0.76rem;
		color: var(--text-muted);
	}

	.swatch.on .name {
		color: var(--text);
	}
</style>
