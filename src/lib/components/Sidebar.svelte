<script lang="ts">
	import { page } from '$app/state';
	import { registry } from '../registry.svelte';
	import { settings } from '../settings/settings.svelte';
	import Icon from './Icon.svelte';

	const showLabels = $derived(settings.value.appearance.showSidebarLabels);
	const isActive = (path: string) =>
		page.url.pathname === path || page.url.pathname.startsWith(path + '/');
</script>

<nav class="sidebar" class:narrow={!showLabels} aria-label="Tools">
	<div class="group">
		{#each registry.tools as tool (tool.id)}
			<a
				class="item"
				class:active={isActive(tool.path)}
				href={tool.path}
				title={showLabels ? undefined : tool.label}
			>
				<Icon name={tool.icon} size={17} />
				{#if showLabels}
					<span class="label">{tool.label}</span>
					{#if tool.status?.()}<span class="status">{tool.status()}</span>{/if}
				{:else if tool.status?.()}
					<span class="dot" aria-hidden="true"></span>
				{/if}
			</a>
		{/each}
	</div>

	<div class="group bottom">
		<a
			class="item"
			class:active={isActive('/settings')}
			href="/settings"
			title={showLabels ? undefined : 'Settings'}
		>
			<Icon name="settings" size={17} />
			{#if showLabels}<span>Settings</span>{/if}
		</a>
	</div>
</nav>

<style>
	.sidebar {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		width: 196px;
		padding: 0.35rem 0.5rem 0.65rem;
		background: var(--bg-sunken);
		flex: none;
		transition: width 140ms ease;
	}

	.sidebar.narrow {
		width: 56px;
		padding-inline: 0.5rem;
	}

	.group {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.item {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		height: 32px;
		padding: 0 0.6rem;
		border-radius: var(--radius);
		color: var(--text-muted);
		font-size: 0.83rem;
		text-decoration: none;
		white-space: nowrap;
		overflow: hidden;
	}

	.sidebar.narrow .item {
		justify-content: center;
		padding: 0;
	}

	.item:hover {
		background: var(--bg-hover);
		color: var(--text);
	}

	.item.active {
		background: var(--bg-active);
		color: var(--text);
	}

	.item.active :global(svg) {
		color: var(--accent);
	}

	.label {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.status {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-variant-numeric: tabular-nums;
		color: var(--accent);
	}

	/* Narrow rail has no room for the text, so activity shows as a dot. */
	.sidebar.narrow .item {
		position: relative;
	}

	.dot {
		position: absolute;
		top: 5px;
		right: 8px;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--accent);
	}
</style>
