<script lang="ts">
	let {
		checked = $bindable(false),
		label,
		onchange
	}: { checked?: boolean; label: string; onchange?: (value: boolean) => void } = $props();

	function toggle() {
		checked = !checked;
		onchange?.(checked);
	}
</script>

<button
	class="switch"
	class:on={checked}
	role="switch"
	aria-checked={checked}
	aria-label={label}
	onclick={toggle}
>
	<span class="knob"></span>
</button>

<style>
	.switch {
		position: relative;
		width: 38px;
		height: 21px;
		padding: 0;
		border: 1px solid var(--border-strong);
		border-radius: 999px;
		background: var(--bg-raised);
		transition:
			background 140ms ease,
			border-color 140ms ease;
	}

	.switch.on {
		background: var(--accent);
		border-color: var(--accent);
	}

	.knob {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 15px;
		height: 15px;
		border-radius: 50%;
		background: var(--text-faint);
		transition:
			transform 140ms ease,
			background 140ms ease;
	}

	.switch.on .knob {
		transform: translateX(17px);
		background: var(--accent-text);
	}
</style>
