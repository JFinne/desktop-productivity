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
	import { getTheme } from '$lib/themes/themes';

	let { children } = $props();

	$effect(() => {
		const { themeId, fontScale } = settings.value.appearance;
		const theme = getTheme(themeId);

		// A settings file written before a theme was renamed or removed still
		// names it. `getTheme` already falls back, but writing the resolved id
		// back keeps the picker's selection honest instead of showing nothing.
		if (settings.loaded && theme.id !== themeId) {
			settings.value.appearance.themeId = theme.id;
		}

		applyTheme(theme, fontScale);
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
		<main class:full={activeTool?.layout === 'full'}>
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

	/* A tool that manages its own scrolling gets the bare pane. */
	main.full {
		display: flex;
		padding: 0;
		overflow: hidden;
	}
</style>
