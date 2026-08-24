import { todayISO } from '$lib/date';
import { Persisted } from '$lib/persisted.svelte';
import { settings } from '$lib/settings/settings.svelte';
import { customSoundId, isCustomSound, preloadCustomSound } from './customSounds.svelte';
import { notify } from './notify';
import { playAlarm, playTick } from './sounds';

export type Phase = 'focus' | 'shortBreak' | 'longBreak';

export const PHASE_LABEL: Record<Phase, string> = {
	focus: 'Focus',
	shortBreak: 'Short break',
	longBreak: 'Long break'
};

interface TimerState {
	phase: Phase;
	/** Focus sessions finished since the last long break. */
	round: number;
	running: boolean;
	/** False until the phase has been started at least once — see `remainingMs`. */
	started: boolean;
	/** Wall-clock instant the current run ends; null while paused. */
	endsAt: number | null;
	/** Time left when paused. Only meaningful once `started` is true. */
	remainingMs: number;
	today: { date: string; completed: number };
}

const DEFAULT_STATE: TimerState = {
	phase: 'focus',
	round: 0,
	running: false,
	started: false,
	endsAt: null,
	remainingMs: 0,
	today: { date: todayISO(), completed: 0 }
};

/**
 * The Pomodoro clock.
 *
 * Timing is anchored to `Date.now()` rather than counted in interval ticks, so
 * a throttled or descheduled timer never drifts: the interval only decides how
 * often the display refreshes. The whole state is persisted, so quitting
 * mid-session and reopening picks up where you left off.
 */
class PomodoroTimer {
	#store = new Persisted<TimerState>('focus-timer', DEFAULT_STATE, { debounceMs: 1000 });
	#interval: ReturnType<typeof setInterval> | null = null;
	#lastTickSecond = -1;
	#restored = false;

	/** Refreshed by the interval; everything time-dependent derives from it. */
	now = $state(Date.now());

	constructor() {
		$effect.root(() => {
			$effect(() => {
				if (this.#store.loaded && !this.#restored) {
					this.#restored = true;
					this.#afterRestore();
				}
			});

			// Pull an imported alarm into memory as soon as it is selected, so the
			// first time it fires it isn't waiting on disk.
			$effect(() => {
				const soundId = settings.value.pomodoro.soundId;
				if (isCustomSound(soundId)) void preloadCustomSound(customSoundId(soundId));
			});
		});
	}

	get state() {
		return this.#store.value;
	}

	get phase(): Phase {
		return this.state.phase;
	}

	get running(): boolean {
		return this.state.running;
	}

	get round(): number {
		return this.state.round;
	}

	get completedToday(): number {
		return this.state.today.date === todayISO() ? this.state.today.completed : 0;
	}

	get roundsPerSet(): number {
		return Math.max(1, settings.value.pomodoro.roundsBeforeLongBreak);
	}

	/** Full length of a phase, in ms, from the current settings. */
	durationOf(phase: Phase): number {
		const p = settings.value.pomodoro;
		const minutes =
			phase === 'focus'
				? p.focusMinutes
				: phase === 'shortBreak'
					? p.shortBreakMinutes
					: p.longBreakMinutes;
		return Math.max(1, minutes) * 60_000;
	}

	/**
	 * Milliseconds left. Before a phase is started this tracks the settings
	 * live, so editing the focus length updates an idle clock immediately.
	 */
	get remainingMs(): number {
		const s = this.state;
		if (!s.started) return this.durationOf(s.phase);
		if (s.running && s.endsAt !== null) return Math.max(0, s.endsAt - this.now);
		return Math.max(0, s.remainingMs);
	}

	get totalMs(): number {
		return this.durationOf(this.state.phase);
	}

	/** 0–1 through the current phase. */
	get progress(): number {
		const total = this.totalMs;
		return total <= 0 ? 0 : 1 - this.remainingMs / total;
	}

	get display(): string {
		return formatDuration(this.remainingMs);
	}

	start() {
		const s = this.state;
		if (s.running) return;
		if (!s.started) {
			s.remainingMs = this.durationOf(s.phase);
			s.started = true;
		}
		s.endsAt = Date.now() + s.remainingMs;
		s.running = true;
		this.#startInterval();
	}

	pause() {
		const s = this.state;
		if (!s.running) return;
		s.remainingMs = this.remainingMs;
		s.running = false;
		s.endsAt = null;
		this.#stopInterval();
	}

	toggle() {
		if (this.state.running) this.pause();
		else this.start();
	}

	/** Back to the start of the current phase. */
	reset() {
		const s = this.state;
		s.running = false;
		s.started = false;
		s.endsAt = null;
		s.remainingMs = 0;
		this.#stopInterval();
	}

	/** Move to the next phase without counting the current one. */
	skip() {
		this.#advance({ count: false, alarm: false });
	}

	#complete() {
		this.#advance({ count: true, alarm: true });
	}

	#advance({
		count,
		alarm,
		autoStart = true
	}: {
		count: boolean;
		alarm: boolean;
		autoStart?: boolean;
	}) {
		const s = this.state;
		const p = settings.value.pomodoro;
		const finished = s.phase;

		let next: Phase;
		if (finished === 'focus') {
			if (count) {
				s.round += 1;
				this.#recordCompletion();
			}
			next = s.round >= this.roundsPerSet ? 'longBreak' : 'shortBreak';
		} else {
			if (finished === 'longBreak') s.round = 0;
			next = 'focus';
		}

		const auto = next === 'focus' ? p.autoStartFocus : p.autoStartBreaks;
		const willStart = autoStart && auto;

		if (alarm) {
			playAlarm(p.soundId, p.volume);
			if (p.notify) {
				void notify(
					`${PHASE_LABEL[finished]} complete`,
					willStart
						? `Starting your ${PHASE_LABEL[next].toLowerCase()}.`
						: `${PHASE_LABEL[next]} is ready when you are.`
				);
			}
		}

		s.phase = next;
		s.started = false;
		s.endsAt = null;
		s.remainingMs = 0;
		s.running = false;
		this.#stopInterval();

		if (willStart) this.start();
	}

	#recordCompletion() {
		const s = this.state;
		const date = todayISO();
		if (s.today.date !== date) s.today = { date, completed: 0 };
		s.today.completed += 1;
	}

	/** Reattach to a session that was running when the app last closed. */
	#afterRestore() {
		const s = this.state;
		if (s.today.date !== todayISO()) s.today = { date: todayISO(), completed: 0 };
		if (!s.running) return;

		// A running session with no deadline can't be resumed sensibly; treat it
		// as paused rather than letting the clock sit frozen.
		if (s.endsAt === null) {
			s.running = false;
			return;
		}

		if (s.endsAt <= Date.now()) {
			// The phase ended while Fokus was closed. Count it, but stay silent
			// and idle rather than firing an alarm for something long past.
			// Don't auto-start the next phase: the user may have been away for days.
			const wasFocus = s.phase === 'focus';
			this.#advance({ count: wasFocus, alarm: false, autoStart: false });
			return;
		}
		this.#startInterval();
	}

	#startInterval() {
		if (this.#interval) return;
		this.#lastTickSecond = -1;
		this.now = Date.now();
		this.#interval = setInterval(() => this.#tick(), 200);
	}

	#stopInterval() {
		if (!this.#interval) return;
		clearInterval(this.#interval);
		this.#interval = null;
	}

	#tick() {
		this.now = Date.now();
		const remaining = this.remainingMs;

		if (settings.value.pomodoro.tickSound) {
			const second = Math.ceil(remaining / 1000);
			if (second !== this.#lastTickSecond && remaining > 0) {
				this.#lastTickSecond = second;
				playTick(settings.value.pomodoro.volume);
			}
		}

		if (remaining <= 0) this.#complete();
	}
}

export function formatDuration(ms: number): string {
	const total = Math.ceil(Math.max(0, ms) / 1000);
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const seconds = total % 60;
	const pad = (n: number) => String(n).padStart(2, '0');
	return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export const timer = new PomodoroTimer();
