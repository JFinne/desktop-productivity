<script lang="ts">
	import { settings } from '$lib/settings/settings.svelte';
	import { circadian } from '$lib/themes/circadian.svelte';

	const TIME = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });

	const adaptive = $derived(settings.value.appearance.adaptive);
	const position = $derived(circadian.position);
	const times = $derived(circadian.times);

	const now = $derived(new Date());
	const liveHour = $derived(now.getHours() + now.getMinutes() / 60);
	const scrubbed = $derived(circadian.previewHour);
	const hour = $derived(scrubbed ?? liveHour);

	const clockLabel = $derived(
		`${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.round((hour % 1) * 60)).padStart(2, '0')}`
	);

	const daylightLabel = $derived.by(() => {
		if (times.polarDay) return 'Sun never sets today';
		if (times.polarNight) return 'Sun never rises today';
		if (!times.sunrise || !times.sunset) return 'No sunrise or sunset today';
		return `Sunrise ${TIME.format(times.sunrise)} · Sunset ${TIME.format(times.sunset)}`;
	});

	// Leaving Settings should never strand the app on a previewed hour.
	$effect(() => () => {
		circadian.previewHour = null;
	});
</script>

<div class="preview" class:inactive={!adaptive}>
	<div class="readout">
		<span class="phase">{circadian.phase}</span>
		<span class="detail">
			{position.elevation.toFixed(1)}° {position.elevation < 0 ? 'below' : 'above'} the horizon
		</span>
		<span class="detail">{daylightLabel}</span>
	</div>

	<div class="scrub">
		<label>
			<span class="label">Preview the day</span>
			<input
				type="range"
				min="0"
				max="24"
				step="0.25"
				value={hour}
				oninput={(e) => (circadian.previewHour = e.currentTarget.valueAsNumber)}
				aria-label="Preview hour"
			/>
		</label>
		<span class="clock">{clockLabel}</span>
		<button
			type="button"
			class="live"
			disabled={scrubbed === null}
			onclick={() => (circadian.previewHour = null)}
		>
			{scrubbed === null ? 'Live' : 'Back to now'}
		</button>
	</div>

	{#if !adaptive}
		<p class="note">Turn on “Follow the daylight cycle” to use this palette.</p>
	{/if}
</div>

<style>
	.preview {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		padding: 0.5rem 0 0.2rem;
	}

	.preview.inactive {
		opacity: 0.6;
	}

	.readout {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.phase {
		font-size: 0.88rem;
		color: var(--accent);
	}

	.detail {
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.scrub {
		display: flex;
		align-items: center;
		gap: 0.7rem;
	}

	label {
		display: flex;
		flex: 1;
		align-items: center;
		gap: 0.7rem;
		min-width: 0;
	}

	.label {
		flex: none;
		font-size: 0.82rem;
	}

	input[type='range'] {
		flex: 1;
		min-width: 0;
		accent-color: var(--accent);
	}

	.clock {
		flex: none;
		width: 3.4rem;
		font-family: var(--font-mono);
		font-size: 0.78rem;
		font-variant-numeric: tabular-nums;
		color: var(--text-muted);
		text-align: right;
	}

	.live {
		flex: none;
		height: 26px;
		padding: 0 0.7rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--bg);
		font-size: 0.76rem;
	}

	.live:hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--accent);
	}

	.live:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.note {
		font-size: 0.78rem;
		color: var(--text-faint);
	}
</style>
