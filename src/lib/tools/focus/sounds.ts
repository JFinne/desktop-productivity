/**
 * Alarm sounds, synthesised with the Web Audio API.
 *
 * Nothing is loaded from disk or the network — each sound is a few scheduled
 * oscillators — so the app stays self-contained and the sounds can be previewed
 * instantly from Settings.
 */

import { customSoundId, isCustomSound, playCustomSound } from './customSounds.svelte';

export interface AlarmSound {
	id: string;
	name: string;
	/** Schedules the sound on `ctx`, routed through `out`. */
	render(ctx: AudioContext, out: GainNode, at: number): void;
}

let ctx: AudioContext | null = null;

/** Audio contexts start suspended until a gesture; this resumes lazily. */
function audio(): AudioContext {
	ctx ??= new AudioContext();
	if (ctx.state === 'suspended') void ctx.resume();
	return ctx;
}

interface ToneOptions {
	freq: number;
	at: number;
	duration: number;
	type?: OscillatorType;
	gain?: number;
	/** Ratio the pitch slides to over the tone's life. 1 = no slide. */
	glide?: number;
}

function tone(ctx: AudioContext, out: GainNode, o: ToneOptions) {
	const osc = ctx.createOscillator();
	const env = ctx.createGain();
	const peak = o.gain ?? 0.3;

	osc.type = o.type ?? 'sine';
	osc.frequency.setValueAtTime(o.freq, o.at);
	if (o.glide && o.glide !== 1) {
		osc.frequency.exponentialRampToValueAtTime(o.freq * o.glide, o.at + o.duration);
	}

	// Fast attack, exponential decay — the shape most struck/plucked things have.
	env.gain.setValueAtTime(0.0001, o.at);
	env.gain.exponentialRampToValueAtTime(peak, o.at + 0.008);
	env.gain.exponentialRampToValueAtTime(0.0001, o.at + o.duration);

	osc.connect(env).connect(out);
	osc.start(o.at);
	osc.stop(o.at + o.duration + 0.02);
}

const NOTE = { C6: 1046.5, E6: 1318.5, G6: 1568.0, A5: 880.0, D6: 1174.7, F5: 698.5, C5: 523.25 };

export const alarmSounds: AlarmSound[] = [
	{
		id: 'chime',
		name: 'Chime',
		render: (ctx, out, at) => {
			[NOTE.C6, NOTE.E6, NOTE.G6].forEach((f, i) =>
				tone(ctx, out, { freq: f, at: at + i * 0.13, duration: 1.1, type: 'triangle', gain: 0.22 })
			);
		}
	},
	{
		id: 'bell',
		name: 'Bell',
		render: (ctx, out, at) => {
			// A struck bell is a fundamental plus inharmonic partials that decay faster.
			tone(ctx, out, { freq: NOTE.A5, at, duration: 2.4, gain: 0.24 });
			tone(ctx, out, { freq: NOTE.A5 * 2.76, at, duration: 1.2, gain: 0.07 });
			tone(ctx, out, { freq: NOTE.A5 * 5.4, at, duration: 0.6, gain: 0.035 });
		}
	},
	{
		id: 'marimba',
		name: 'Marimba',
		render: (ctx, out, at) => {
			[NOTE.C5, NOTE.F5, NOTE.C6].forEach((f, i) => {
				tone(ctx, out, { freq: f, at: at + i * 0.11, duration: 0.5, gain: 0.28 });
				tone(ctx, out, { freq: f * 4, at: at + i * 0.11, duration: 0.16, gain: 0.05 });
			});
		}
	},
	{
		id: 'ping',
		name: 'Ping',
		render: (ctx, out, at) => {
			tone(ctx, out, { freq: NOTE.D6, at, duration: 0.55, gain: 0.26, glide: 0.75 });
		}
	},
	{
		id: 'digital',
		name: 'Digital',
		render: (ctx, out, at) => {
			for (let i = 0; i < 3; i++) {
				tone(ctx, out, {
					freq: 1000,
					at: at + i * 0.18,
					duration: 0.1,
					type: 'square',
					gain: 0.12
				});
			}
		}
	},
	{
		id: 'none',
		name: 'Silent',
		render: () => {}
	}
];

export function getAlarmSound(id: string): AlarmSound {
	return alarmSounds.find((s) => s.id === id) ?? alarmSounds[0];
}

/** Plays an alarm at the given volume (0–1). Safe to call before any gesture. */
export function playAlarm(soundId: string, volume: number) {
	if (soundId === 'none' || volume <= 0) return;

	if (isCustomSound(soundId)) {
		void playCustomSound(customSoundId(soundId), volume);
		return;
	}

	try {
		const context = audio();
		const out = context.createGain();
		out.gain.value = Math.min(1, Math.max(0, volume));
		out.connect(context.destination);
		getAlarmSound(soundId).render(context, out, context.currentTime + 0.02);
	} catch (err) {
		console.error('could not play alarm', err);
	}
}

/** The optional per-second tick. Deliberately quieter than any alarm. */
export function playTick(volume: number) {
	if (volume <= 0) return;
	try {
		const context = audio();
		const out = context.createGain();
		out.gain.value = Math.min(1, Math.max(0, volume)) * 0.18;
		out.connect(context.destination);
		tone(context, out, {
			freq: 2200,
			at: context.currentTime + 0.01,
			duration: 0.035,
			type: 'square',
			gain: 0.09
		});
	} catch {
		// A missing tick is never worth surfacing.
	}
}
