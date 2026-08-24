<script lang="ts">
	import '../app.css';
	// Side-effect imports: these populate the tool + settings registries.
	import '$lib/tools';
	import '$lib/settings/sections.svelte';

	import { page } from '$app/state';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import TitleBar from '$lib/components/TitleBar.svelte';
	import { registry } from '$lib/registry.svelte';
	import { settings } from '$lib/settings/settings.svelte';
	import { applyTheme } from '$lib/themes/apply';
	import { circadian } from '$lib/themes/circadian.svelte';
	import { getTheme } from '$lib/themes/themes';

	let { children } = $props();

	$effect(() => {
		const { themeId, adaptive, fontScale } = settings.value.appearance;
		// `circadian.theme` reads a ticking clock, so this effect re-runs on its own.
		applyTheme(adaptive ? circadian.theme : getTheme(themeId), fontScale);
	});

	const activeTool = $derived(registry.tools.find((t) => page.url.pathname.startsWith(t.path)));

	const context = $derived.by(() => {
		if (page.url.pathname.startsWith('/settings')) return 'Settings';
		if (!activeTool) return '';
		const status = activeTool.status?.();
		return status ? `${activeTool.label} · ${status}` : activeTool.label;
	});
</script>

<div class="app">
	<TitleBar title={context} />
	<div class="body">
		<Sidebar />
		<main>
			{@render children()}
		</main>
	</div>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: var(--bg-sunken);
	}

	.body {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	main {
		flex: 1;
		min-width: 0;
		overflow-y: auto;
		background: var(--bg);
		/* The single soft corner is the only "frame" in the whole window. */
		border-top-left-radius: var(--radius-lg);
		padding: 2rem 2.25rem 3rem;
	}
</style>
