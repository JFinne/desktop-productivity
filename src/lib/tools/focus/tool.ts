import { registerSettingsSection, registerTool } from '$lib/registry.svelte';
import { settings } from '$lib/settings/settings.svelte';
import {
	CUSTOM_PREFIX,
	customSoundId,
	customSounds,
	importCustomSound,
	isCustomSound,
	preloadCustomSound,
	removeCustomSound
} from './customSounds.svelte';
import { alarmSounds, playAlarm } from './sounds';
import { timer } from './timer.svelte';

/** Built-ins first, then anything the user imported, with Silent last. */
function soundOptions() {
	return [
		...alarmSounds.filter((s) => s.id !== 'none').map((s) => ({ value: s.id, label: s.name })),
		...customSounds.all.map((s) => ({ value: CUSTOM_PREFIX + s.id, label: s.name })),
		{ value: 'none', label: 'Silent' }
	];
}

registerTool({
	id: 'focus',
	label: 'Focus',
	path: '/focus',
	icon: 'timer',
	order: 10,
	description: 'Pomodoro timer',
	// Shown in the sidebar and title bar, so a running session is visible
	// from anywhere in the app.
	status: () => (timer.running ? timer.display : null)
});

registerSettingsSection({
	id: 'pomodoro',
	title: 'Pomodoro',
	description: 'Lengths apply to the next session you start, or immediately to an idle one.',
	order: 20,
	fields: [
		{
			kind: 'number',
			path: 'pomodoro.focusMinutes',
			label: 'Focus length',
			min: 1,
			max: 180,
			suffix: 'min'
		},
		{
			kind: 'number',
			path: 'pomodoro.shortBreakMinutes',
			label: 'Short break',
			min: 1,
			max: 60,
			suffix: 'min'
		},
		{
			kind: 'number',
			path: 'pomodoro.longBreakMinutes',
			label: 'Long break',
			min: 1,
			max: 120,
			suffix: 'min'
		},
		{
			kind: 'number',
			path: 'pomodoro.roundsBeforeLongBreak',
			label: 'Focus rounds per long break',
			min: 1,
			max: 12,
			suffix: 'rounds'
		},
		{
			kind: 'toggle',
			path: 'pomodoro.autoStartBreaks',
			label: 'Start breaks automatically',
			help: 'When a focus round ends, roll straight into the break.'
		},
		{
			kind: 'toggle',
			path: 'pomodoro.autoStartFocus',
			label: 'Start focus automatically',
			help: 'When a break ends, roll straight into the next focus round.'
		},
		{
			kind: 'select',
			path: 'pomodoro.soundId',
			label: 'Alarm sound',
			options: soundOptions
		},
		{
			kind: 'action',
			label: 'Use your own sound',
			button: 'Choose file…',
			help: 'The file is copied into Fokus, so moving or deleting the original is safe.',
			run: async () => {
				const sound = await importCustomSound();
				if (!sound) return;
				settings.value.pomodoro.soundId = CUSTOM_PREFIX + sound.id;
				void preloadCustomSound(sound.id);
			}
		},
		{
			kind: 'action',
			label: 'Remove imported sound',
			button: 'Remove',
			danger: true,
			disabled: () => !isCustomSound(settings.value.pomodoro.soundId),
			run: async () => {
				const selected = settings.value.pomodoro.soundId;
				if (!isCustomSound(selected)) return;
				await removeCustomSound(customSoundId(selected));
				settings.value.pomodoro.soundId = 'chime';
			}
		},
		{
			kind: 'slider',
			path: 'pomodoro.volume',
			label: 'Volume',
			min: 0,
			max: 1,
			step: 0.05,
			format: (v) => `${Math.round(v * 100)}%`
		},
		{
			kind: 'action',
			label: 'Preview alarm',
			button: 'Play',
			run: () => playAlarm(settings.value.pomodoro.soundId, settings.value.pomodoro.volume)
		},
		{
			kind: 'toggle',
			path: 'pomodoro.tickSound',
			label: 'Tick every second',
			help: 'A quiet click while the timer runs. Off by default.'
		},
		{
			kind: 'toggle',
			path: 'pomodoro.notify',
			label: 'Desktop notification',
			help: 'Shows a toast when a round ends, so you see it behind other windows.'
		}
	]
});
