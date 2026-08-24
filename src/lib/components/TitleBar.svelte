<script lang="ts">
	import { getCurrentWindow } from '@tauri-apps/api/window';
	import { inTauri } from '../storage';
	import Icon from './Icon.svelte';

	let { title = '' }: { title?: string } = $props();

	let maximized = $state(false);

	const appWindow = inTauri ? getCurrentWindow() : null;

	$effect(() => {
		if (!appWindow) return;
		void appWindow.isMaximized().then((v) => (maximized = v));
		const unlisten = appWindow.onResized(() => {
			void appWindow.isMaximized().then((v) => (maximized = v));
		});
		return () => void unlisten.then((off) => off());
	});
</script>

<!-- The whole strip is the drag handle; the buttons opt out via their own region. -->
<header class="titlebar" data-tauri-drag-region>
	<span class="brand" data-tauri-drag-region>Fokus</span>
	{#if title}
		<span class="sep" data-tauri-drag-region>/</span>
		<span class="context" data-tauri-drag-region>{title}</span>
	{/if}

	<div class="spacer" data-tauri-drag-region></div>

	{#if appWindow}
		<div class="controls">
			<button class="ctl" title="Minimize" onclick={() => appWindow.minimize()}>
				<Icon name="minus" size={14} />
			</button>
			<button
				class="ctl"
				title={maximized ? 'Restore' : 'Maximize'}
				onclick={() => appWindow.toggleMaximize()}
			>
				<Icon name={maximized ? 'restore' : 'maximize'} size={13} />
			</button>
			<button class="ctl close" title="Close" onclick={() => appWindow.close()}>
				<Icon name="close" size={14} />
			</button>
		</div>
	{/if}
</header>

<style>
	.titlebar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		height: var(--titlebar-height);
		padding-left: 0.9rem;
		background: var(--bg-sunken);
		user-select: none;
		flex: none;
	}

	.brand {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.sep,
	.context {
		font-size: 0.72rem;
		color: var(--text-faint);
	}

	.spacer {
		flex: 1;
		align-self: stretch;
	}

	.controls {
		display: flex;
		align-self: stretch;
	}

	.ctl {
		display: grid;
		place-items: center;
		width: 44px;
		border: 0;
		background: transparent;
		color: var(--text-faint);
		cursor: default;
		transition:
			background 120ms ease,
			color 120ms ease;
	}

	.ctl:hover {
		background: var(--bg-hover);
		color: var(--text);
	}

	.ctl.close:hover {
		background: var(--danger);
		color: #fff;
	}
</style>
