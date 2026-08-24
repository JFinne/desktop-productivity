<script lang="ts">
	import { icons, type IconName } from './icons';

	let {
		name,
		size = 16,
		stroke = 1.75,
		class: klass = ''
	}: { name: IconName; size?: number; stroke?: number; class?: string } = $props();
</script>

<svg
	class={klass}
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static, in-repo icon paths -->
	{@html icons[name]}
</svg>

<style>
	svg {
		display: block;
		flex: none;
	}
</style>
