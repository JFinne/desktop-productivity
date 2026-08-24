<script lang="ts">
	import type { SettingsField } from '$lib/registry.svelte';
	import { getSetting, setSetting } from '$lib/settings/settings.svelte';
	import Switch from '../Switch.svelte';

	let { field }: { field: SettingsField } = $props();

	const num = (v: unknown) => (typeof v === 'number' ? v : 0);
	const str = (v: unknown) => (typeof v === 'string' ? v : '');
</script>

{#if field.kind === 'custom'}
	<div class="row custom">
		<field.component />
	</div>
{:else}
	<div class="row">
		<div class="meta">
			<span class="label">{field.label}</span>
			{#if field.help}<span class="help">{field.help}</span>{/if}
		</div>

		<div class="control">
			{#if field.kind === 'toggle'}
				<Switch
					label={field.label}
					checked={getSetting(field.path) === true}
					onchange={(value) => setSetting(field.path, value)}
				/>
			{:else if field.kind === 'select'}
				<select
					value={str(getSetting(field.path))}
					onchange={(e) => setSetting(field.path, e.currentTarget.value)}
				>
					{#each typeof field.options === 'function' ? field.options() : field.options as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			{:else if field.kind === 'number'}
				<div class="numeric">
					<input
						type="number"
						min={field.min}
						max={field.max}
						step={field.step ?? 1}
						value={num(getSetting(field.path))}
						oninput={(e) => setSetting(field.path, e.currentTarget.valueAsNumber)}
					/>
					{#if field.suffix}<span class="suffix">{field.suffix}</span>{/if}
				</div>
			{:else if field.kind === 'slider'}
				<div class="slider">
					<input
						type="range"
						min={field.min}
						max={field.max}
						step={field.step ?? 1}
						value={num(getSetting(field.path))}
						oninput={(e) => setSetting(field.path, e.currentTarget.valueAsNumber)}
					/>
					<span class="value">
						{field.format ? field.format(num(getSetting(field.path))) : getSetting(field.path)}
					</span>
				</div>
			{:else if field.kind === 'text'}
				<input
					type="text"
					placeholder={field.placeholder}
					value={str(getSetting(field.path))}
					oninput={(e) => setSetting(field.path, e.currentTarget.value)}
				/>
			{:else if field.kind === 'info'}
				<span class="info">{field.value()}</span>
			{:else if field.kind === 'action'}
				<button
					class="btn"
					class:danger={field.danger}
					disabled={field.disabled?.() ?? false}
					onclick={() => field.run()}
				>
					{field.button}
				</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		padding: 0.7rem 0;
	}

	.row + :global(.row) {
		border-top: 1px solid var(--border);
	}

	.row.custom {
		display: block;
	}

	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.label {
		font-size: 0.88rem;
	}

	.help {
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.control {
		flex: none;
	}

	select,
	input[type='text'],
	input[type='number'] {
		height: 30px;
		min-width: 160px;
		padding: 0 0.55rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--bg-raised);
	}

	input[type='number'] {
		min-width: 72px;
		text-align: right;
	}

	.numeric,
	.slider {
		display: flex;
		align-items: center;
		gap: 0.55rem;
	}

	.suffix,
	.value {
		font-size: 0.8rem;
		color: var(--text-muted);
		min-width: 3.2rem;
	}

	input[type='range'] {
		width: 150px;
		accent-color: var(--accent);
	}

	.info {
		font-family: var(--font-mono);
		font-size: 0.76rem;
		color: var(--text-muted);
		word-break: break-all;
	}

	.btn {
		height: 30px;
		padding: 0 0.85rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--bg-raised);
		font-size: 0.83rem;
	}

	.btn:hover {
		background: var(--bg-hover);
	}

	.btn.danger:hover:not(:disabled) {
		border-color: var(--danger);
		color: var(--danger);
	}

	.btn:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.btn:disabled:hover {
		background: var(--bg-raised);
	}
</style>
