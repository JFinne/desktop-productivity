<script lang="ts">
	import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
	import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
	import { markdown } from '@codemirror/lang-markdown';
	import { indentOnInput } from '@codemirror/language';
	import { EditorState } from '@codemirror/state';
	import { EditorView, keymap, placeholder as cmPlaceholder } from '@codemirror/view';
	import { onMount, untrack } from 'svelte';
	import { editorHighlight, editorTheme } from './editorTheme';
	import { livePreview, wikiLinkCompletion } from './livePreview';

	let {
		value,
		docKey,
		titles,
		onchange,
		onopenlink
	}: {
		value: string;
		/** Changes when a different note is opened, which is when to swap the doc. */
		docKey: string | null;
		titles: () => string[];
		onchange: (next: string) => void;
		onopenlink: (title: string) => void;
	} = $props();

	let host = $state<HTMLDivElement | null>(null);
	let view: EditorView | null = null;
	/** Set while replacing the document, so the swap isn't reported as an edit. */
	let applying = false;

	function extensions() {
		return [
			history(),
			indentOnInput(),
			closeBrackets(),
			keymap.of([
				...closeBracketsKeymap,
				...defaultKeymap,
				...historyKeymap,
				...completionKeymap,
				indentWithTab
			]),
			markdown(),
			livePreview({ onOpenLink: onopenlink }),
			autocompletion({ override: [wikiLinkCompletion(titles)] }),
			EditorView.lineWrapping,
			cmPlaceholder('Start writing… use [[ to link another note.'),
			editorTheme,
			editorHighlight,
			EditorView.updateListener.of((update) => {
				if (update.docChanged && !applying) onchange(update.state.doc.toString());
			})
		];
	}

	onMount(() => {
		view = new EditorView({
			state: EditorState.create({ doc: value, extensions: extensions() }),
			parent: host!
		});
		return () => {
			view?.destroy();
			view = null;
		};
	});

	// Only `docKey` is tracked: reading `value` here would reset the document on
	// every keystroke, since the store updates it as you type.
	$effect(() => {
		docKey;
		if (!view) return;
		const next = untrack(() => value);
		if (next === view.state.doc.toString()) return;

		applying = true;
		view.dispatch({
			changes: { from: 0, to: view.state.doc.length, insert: next },
			selection: { anchor: 0 },
			scrollIntoView: true
		});
		applying = false;
	});

	export function focus() {
		view?.focus();
	}
</script>

<div class="editor" bind:this={host}></div>

<style>
	.editor {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.editor :global(.cm-editor) {
		height: 100%;
	}
</style>
