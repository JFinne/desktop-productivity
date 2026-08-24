<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { PHASE_LABEL, timer, type Phase } from '$lib/tools/focus/timer.svelte';

	const PHASE_COLOR: Record<Phase, string> = {
		focus: 'var(--accent)',
		shortBreak: 'var(--info)',
		longBreak: 'var(--success)'
	};

	const RADIUS = 118;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

	const colour = $derived(PHASE_COLOR[timer.phase]);
	const dashOffset = $derived(CIRCUMFERENCE * (1 - timer.progress));
	const rounds = $derived(Array.from({ length: timer.roundsPerSet }, (_, i) => i < timer.round));

	function onKeydown(event: KeyboardEvent) {
		// Never steal keys from a control the user is actually operating.
		const target = event.target as HTMLElement | null;
		if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;

		if (event.code === 'Space') {
			event.preventDefault();
			timer.toggle();
		} else if (event.key.toLowerCase() === 'r') {
			timer.reset();
		} else if (event.key.toLowerCase() === 's') {
			timer.skip();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<PageHeader title="Focus" subtitle="Space to start or pause · R to reset · S to skip" />

<div class="stage">
	<span class="phase" style:color={colour}>{PHASE_LABEL[timer.phase]}</span>

	<div class="dial">
		<svg viewBox="0 0 260 260" aria-hidden="true">
			<circle class="track" cx="130" cy="130" r={RADIUS} />
			<circle
				class="progress"
				cx="130"
				cy="130"
				r={RADIUS}
				stroke={colour}
				stroke-dasharray={CIRCUMFERENCE}
				stroke-dashoffset={dashOffset}
			/>
		</svg>
		<div class="readout" role="timer" aria-live="off">
			<span class="time">{timer.display}</span>
			<span class="of">of {Math.round(timer.totalMs / 60000)} min</span>
		</div>
	</div>

	<div class="rounds" title="Focus rounds until the long break">
		{#each rounds as done, i (i)}
			<span class="pip" class:done style:background={done ? colour : undefined}></span>
		{/each}
	</div>

	<div class="controls">
		<button class="primary" style:--phase={colour} onclick={() => timer.toggle()}>
			<Icon name={timer.running ? 'pause' : 'play'} size={15} />
			{timer.running ? 'Pause' : timer.remainingMs < timer.totalMs ? 'Resume' : 'Start'}
		</button>
		<button class="ghost" onclick={() => timer.reset()} title="Reset this phase (R)">
			<Icon name="reset" size={15} />
		</button>
		<button class="ghost" onclick={() => timer.skip()} title="Skip to next phase (S)">
			<Icon name="skip" size={15} />
		</button>
	</div>

	<p class="tally">
		{timer.completedToday} {timer.completedToday === 1 ? 'session' : 'sessions'} completed today
	</p>
</div>

<style>
	.stage {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.4rem;
		padding-top: 1rem;
	}

	.phase {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.dial {
		position: relative;
		width: 260px;
		height: 260px;
	}

	svg {
		width: 100%;
		height: 100%;
		/* Start the sweep at 12 o'clock. */
		transform: rotate(-90deg);
	}

	circle {
		fill: none;
		stroke-width: 2.5;
	}

	.track {
		stroke: var(--border-strong);
	}

	.progress {
		stroke-linecap: round;
		transition: stroke-dashoffset 200ms linear;
	}

	.readout {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
	}

	.time {
		font-family: var(--font-mono);
		font-size: 3.1rem;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.02em;
		line-height: 1;
	}

	.of {
		font-size: 0.75rem;
		color: var(--text-faint);
	}

	.rounds {
		display: flex;
		gap: 0.4rem;
	}

	.pip {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--border-strong);
		transition: background 200ms ease;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		height: 36px;
		border-radius: var(--radius);
		border: 1px solid var(--border-strong);
		background: var(--bg-raised);
		font-size: 0.86rem;
		transition:
			background 120ms ease,
			border-color 120ms ease,
			color 120ms ease;
	}

	.primary {
		min-width: 118px;
		padding: 0 1.1rem;
		border-color: var(--phase);
		color: var(--phase);
	}

	.primary:hover {
		background: var(--accent-soft);
	}

	.ghost {
		width: 36px;
		color: var(--text-muted);
	}

	.ghost:hover {
		background: var(--bg-hover);
		color: var(--text);
	}

	.tally {
		font-size: 0.78rem;
		color: var(--text-faint);
	}
</style>
