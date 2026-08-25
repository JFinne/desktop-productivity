<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { NoteHit } from '$lib/tools/notes/api';
	import Editor from '$lib/tools/notes/Editor.svelte';
	import { notesStore } from '$lib/tools/notes/store.svelte';

	let query = $state('');
	let results = $state<NoteHit[]>([]);
	let renaming = $state('');
	let renameError = $state('');
	let editor = $state<ReturnType<typeof Editor> | null>(null);

	const active = $derived(notesStore.activeTitle);
	const searching = $derived(query.trim().length > 0);

	// Load the list once, and open the most recent note so the pane is never bare.
	$effect(() => {
		if (notesStore.loaded) return;
		void notesStore.refresh().then(() => {
			if (!notesStore.activeTitle && notesStore.notes.length) {
				void notesStore.open(notesStore.notes[0].title);
			}
		});
	});

	// Keep the rename field in step with whichever note is open.
	$effect(() => {
		renaming = active ?? '';
		renameError = '';
	});

	let searchTimer: ReturnType<typeof setTimeout> | null = null;
	function onSearch(value: string) {
		query = value;
		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(async () => {
			results = value.trim() ? await notesStore.search(value) : [];
		}, 180);
	}

	async function commitRename() {
		const next = renaming.trim();
		if (!active || !next || next === active) {
			renaming = active ?? '';
			return;
		}
		try {
			await notesStore.rename(next);
			renameError = '';
		} catch (err) {
			renameError = err instanceof Error ? err.message : String(err);
			renaming = active;
		}
	}

	async function newNote() {
		await notesStore.create('Untitled');
		queueMicrotask(() => editor?.focus());
	}

	async function remove(title: string) {
		await notesStore.remove(title);
		if (!notesStore.activeTitle && notesStore.notes.length) {
			await notesStore.open(notesStore.notes[0].title);
		}
	}

	const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
	const modifiedLabel = (ms: number) => (ms ? dateFormat.format(new Date(ms)) : '');
</script>

<div class="notes">
	<aside class="list">
		<div class="tools">
			<div class="search">
				<Icon name="search" size={14} />
				<input
					value={query}
					placeholder="Search notes"
					aria-label="Search notes"
					oninput={(e) => onSearch(e.currentTarget.value)}
				/>
			</div>
			<button type="button" class="new" title="New note" aria-label="New note" onclick={newNote}>
				<Icon name="plus" size={15} />
			</button>
		</div>

		<div class="items">
			{#if searching}
				{#if results.length}
					{#each results as hit, i (hit.title + ':' + hit.line + ':' + i)}
						<button
							type="button"
							class="item"
							class:on={hit.title === active}
							onclick={() => notesStore.open(hit.title)}
						>
							<span class="title">{hit.title}</span>
							<span class="excerpt">{hit.snippet}</span>
						</button>
					{/each}
				{:else}
					<p class="empty">No matches.</p>
				{/if}
			{:else if notesStore.notes.length}
				{#each notesStore.notes as note (note.title)}
					<button
						type="button"
						class="item"
						class:on={note.title === active}
						onclick={() => notesStore.open(note.title)}
					>
						<span class="row">
							<span class="title">{note.title}</span>
							<span class="when">{modifiedLabel(note.modified)}</span>
						</span>
						{#if note.excerpt}<span class="excerpt">{note.excerpt}</span>{/if}
					</button>
				{/each}
			{:else}
				<p class="empty">No notes yet.</p>
			{/if}
		</div>
	</aside>

	<section class="pane">
		{#if active}
			<header class="bar">
				<input
					class="name"
					bind:value={renaming}
					aria-label="Note title"
					onblur={commitRename}
					onkeydown={(e) => {
						if (e.key === 'Enter') e.currentTarget.blur();
						if (e.key === 'Escape') {
							renaming = active ?? '';
							e.currentTarget.blur();
						}
					}}
				/>
				{#if notesStore.saving}<span class="saving">Saving…</span>{/if}
				<button
					type="button"
					class="delete"
					title="Delete note"
					aria-label="Delete note"
					onclick={() => remove(active)}
				>
					<Icon name="trash" size={14} />
				</button>
			</header>

			{#if renameError}<p class="error">{renameError}</p>{/if}

			<Editor
				bind:this={editor}
				value={notesStore.contents}
				docKey={active}
				titles={() => notesStore.titles}
				onchange={(next) => notesStore.edit(next)}
				onopenlink={(title) => notesStore.openOrCreate(title)}
			/>

			{#if notesStore.backlinks.length}
				<footer class="backlinks">
					<h2><Icon name="link" size={12} /> Linked from</h2>
					{#each notesStore.backlinks as hit, i (hit.title + ':' + hit.line + ':' + i)}
						<button type="button" class="backlink" onclick={() => notesStore.open(hit.title)}>
							<span class="title">{hit.title}</span>
							<span class="excerpt">{hit.snippet}</span>
						</button>
					{/each}
				</footer>
			{/if}
		{:else}
			<div class="blank">
				<Icon name="notes" size={26} stroke={1.4} />
				<p>Nothing open. Make a note, and link others with <code>[[double brackets]]</code>.</p>
				<button type="button" class="primary" onclick={newNote}>New note</button>
			</div>
		{/if}
	</section>
</div>

<style>
	.notes {
		display: flex;
		flex: 1;
		min-width: 0;
	}

	.list {
		display: flex;
		flex-direction: column;
		width: 254px;
		flex: none;
		border-right: 1px solid var(--border);
		background: var(--bg);
	}

	.tools {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 0.6rem 0.5rem;
	}

	.search {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex: 1;
		min-width: 0;
		height: 28px;
		padding: 0 0.5rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--bg-raised);
		color: var(--text-faint);
	}

	.search:focus-within {
		border-color: var(--accent);
		color: var(--accent);
	}

	.search input {
		flex: 1;
		min-width: 0;
		border: 0;
		background: transparent;
		color: var(--text);
		font-size: 0.82rem;
	}

	.search input:focus {
		outline: none;
	}

	.new {
		display: grid;
		place-items: center;
		flex: none;
		width: 28px;
		height: 28px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--bg-raised);
		color: var(--text-muted);
	}

	.new:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.items {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 0 0.4rem 0.6rem;
	}

	.item {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		width: 100%;
		padding: 0.4rem 0.5rem;
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		text-align: left;
	}

	.item:hover {
		background: var(--bg-hover);
	}

	.item.on {
		background: var(--bg-active);
	}

	.row {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.title {
		flex: 1;
		overflow: hidden;
		font-size: 0.85rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.when {
		flex: none;
		font-size: 0.7rem;
		color: var(--text-faint);
	}

	.excerpt {
		overflow: hidden;
		font-size: 0.74rem;
		color: var(--text-faint);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.empty {
		padding: 0.6rem 0.5rem;
		font-size: 0.8rem;
		color: var(--text-faint);
	}

	.pane {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
		padding: 0 2rem;
	}

	.bar {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 1.1rem 0 0.5rem;
	}

	.name {
		flex: 1;
		min-width: 0;
		border: 0;
		background: transparent;
		color: var(--text);
		font-size: 1.15rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.name:focus {
		outline: none;
		border-bottom: 1px solid var(--border-strong);
	}

	.saving {
		flex: none;
		font-size: 0.72rem;
		color: var(--text-faint);
	}

	.delete {
		display: grid;
		place-items: center;
		flex: none;
		width: 28px;
		height: 28px;
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		color: var(--text-faint);
	}

	.delete:hover {
		background: var(--bg-active);
		color: var(--danger);
	}

	.error {
		padding-bottom: 0.4rem;
		font-size: 0.78rem;
		color: var(--danger);
	}

	.backlinks {
		flex: none;
		max-height: 30%;
		overflow-y: auto;
		margin-bottom: 1rem;
		padding-top: 0.6rem;
		border-top: 1px solid var(--border);
	}

	.backlinks h2 {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		margin-bottom: 0.3rem;
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.backlink {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		width: 100%;
		padding: 0.3rem 0.4rem;
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		text-align: left;
	}

	.backlink:hover {
		background: var(--bg-hover);
	}

	.backlink .title {
		color: var(--accent);
		font-size: 0.8rem;
	}

	.blank {
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.8rem;
		color: var(--text-faint);
		text-align: center;
	}

	.blank p {
		max-width: 34ch;
		font-size: 0.85rem;
	}

	.blank code {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.primary {
		height: 32px;
		padding: 0 1rem;
		border: 1px solid var(--accent);
		border-radius: var(--radius);
		background: transparent;
		color: var(--accent);
		font-size: 0.84rem;
	}

	.primary:hover {
		background: var(--accent-soft);
	}
</style>
