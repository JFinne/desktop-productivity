/**
 * Obsidian-style live preview.
 *
 * Rather than rendering Markdown to HTML in a separate pane, this decorates the
 * source in place: heading text gets sized, `**bold**` is drawn bold — and the
 * syntax characters themselves are hidden with replace decorations, *except*
 * when the cursor is inside them. Put the caret on a line and the raw Markdown
 * reappears so it can be edited; move away and it renders again.
 *
 * Everything is rebuilt on selection changes as well as edits, since "is the
 * cursor here" is an input to the result.
 */
import { syntaxTree } from '@codemirror/language';
import type { EditorState, Range } from '@codemirror/state';
import {
	Decoration,
	EditorView,
	ViewPlugin,
	type DecorationSet,
	type ViewUpdate
} from '@codemirror/view';
import { type Completion, type CompletionContext, type CompletionResult } from '@codemirror/autocomplete';

/** Wiki links aren't part of Markdown, so they're matched directly. */
const WIKI_LINK = /\[\[([^\]\n]+)\]\]/g;

const hide = Decoration.replace({});

/** True when a selection touches the range — i.e. the user is editing it. */
function touches(state: EditorState, from: number, to: number): boolean {
	return state.selection.ranges.some((r) => r.from <= to && r.to >= from);
}

/** Block syntax reveals for the whole line, which is far less twitchy. */
function lineTouched(state: EditorState, pos: number): boolean {
	const line = state.doc.lineAt(pos);
	return touches(state, line.from, line.to);
}

interface WikiRange {
	from: number;
	to: number;
	title: string;
}

/** Every `[[…]]` in a slice of the document. */
function wikiRangesIn(state: EditorState, from: number, to: number): WikiRange[] {
	const text = state.doc.sliceString(from, to);
	const found: WikiRange[] = [];
	WIKI_LINK.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = WIKI_LINK.exec(text))) {
		const start = from + match.index;
		found.push({ from: start, to: start + match[0].length, title: match[1] });
	}
	return found;
}

function buildDecorations(view: EditorView): DecorationSet {
	const decorations: Range<Decoration>[] = [];
	const { state } = view;

	for (const { from, to } of view.visibleRanges) {
		// Markdown parses the inner `[…]` of a `[[wiki link]]` as an ordinary
		// link, and would hide one bracket of each pair with its own rule. Wiki
		// ranges are resolved first so those nodes can be skipped.
		const wikiRanges = wikiRangesIn(state, from, to);
		const insideWiki = (nodeFrom: number, nodeTo: number) =>
			wikiRanges.some((w) => nodeFrom >= w.from && nodeTo <= w.to);

		syntaxTree(state).iterate({
			from,
			to,
			enter: (node) => {
				const name = node.name;

				const heading = /^ATXHeading(\d)$/.exec(name);
				if (heading) {
					const line = state.doc.lineAt(node.from);
					decorations.push(
						Decoration.line({ class: `cm-md-h${heading[1]}` }).range(line.from)
					);
					return;
				}

				switch (name) {
					case 'HeaderMark': {
						if (lineTouched(state, node.from)) return;
						// Swallow the space after the #s too, or the text starts indented.
						let end = node.to;
						if (state.doc.sliceString(end, end + 1) === ' ') end += 1;
						decorations.push(hide.range(node.from, end));
						return;
					}

					case 'StrongEmphasis':
						decorations.push(Decoration.mark({ class: 'cm-md-strong' }).range(node.from, node.to));
						return;
					case 'Emphasis':
						decorations.push(Decoration.mark({ class: 'cm-md-em' }).range(node.from, node.to));
						return;
					case 'Strikethrough':
						decorations.push(Decoration.mark({ class: 'cm-md-strike' }).range(node.from, node.to));
						return;
					case 'InlineCode':
						decorations.push(Decoration.mark({ class: 'cm-md-code' }).range(node.from, node.to));
						return;

					case 'EmphasisMark':
					case 'StrikethroughMark': {
						const parent = node.node.parent;
						if (parent && !touches(state, parent.from, parent.to)) {
							decorations.push(hide.range(node.from, node.to));
						}
						return;
					}

					case 'CodeMark': {
						// Only the backticks of inline code; fenced-block fences stay put,
						// because hiding them makes it impossible to see where code ends.
						const parent = node.node.parent;
						if (parent?.name === 'InlineCode' && !touches(state, parent.from, parent.to)) {
							decorations.push(hide.range(node.from, node.to));
						}
						return;
					}

					case 'QuoteMark': {
						if (!lineTouched(state, node.from)) {
							let end = node.to;
							if (state.doc.sliceString(end, end + 1) === ' ') end += 1;
							decorations.push(hide.range(node.from, end));
						}
						return;
					}
					case 'Blockquote': {
						for (let pos = node.from; pos <= node.to; ) {
							const line = state.doc.lineAt(pos);
							decorations.push(Decoration.line({ class: 'cm-md-quote' }).range(line.from));
							if (line.to >= node.to) break;
							pos = line.to + 1;
						}
						return;
					}

					case 'ListMark':
						decorations.push(Decoration.mark({ class: 'cm-md-listmark' }).range(node.from, node.to));
						return;

					case 'HorizontalRule':
						decorations.push(
							Decoration.line({ class: 'cm-md-hr' }).range(state.doc.lineAt(node.from).from)
						);
						return;

					case 'LinkMark':
					case 'URL': {
						if (insideWiki(node.from, node.to)) return;
						const parent = node.node.parent;
						if (parent?.name === 'Link' && !touches(state, parent.from, parent.to)) {
							decorations.push(hide.range(node.from, node.to));
						}
						return;
					}
					case 'Link': {
						if (insideWiki(node.from, node.to)) return;
						decorations.push(Decoration.mark({ class: 'cm-md-link' }).range(node.from, node.to));
						return;
					}
				}
			}
		});

		for (const { from: start, to: end, title } of wikiRanges) {
			decorations.push(
				Decoration.mark({
					class: 'cm-md-wikilink',
					attributes: { 'data-wikilink': title, title: `Open “${title}”` }
				}).range(start + 2, end - 2)
			);

			if (!touches(state, start, end)) {
				decorations.push(hide.range(start, start + 2));
				decorations.push(hide.range(end - 2, end));
			}
		}
	}

	// `sort` because tree order and the wiki-link pass interleave.
	return Decoration.set(decorations, true);
}

export interface LivePreviewOptions {
	onOpenLink: (title: string) => void;
}

export function livePreview({ onOpenLink }: LivePreviewOptions) {
	const plugin = ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = buildDecorations(view);
			}

			update(update: ViewUpdate) {
				if (update.docChanged || update.viewportChanged || update.selectionSet) {
					this.decorations = buildDecorations(update.view);
				}
			}
		},
		{ decorations: (value) => value.decorations }
	);

	const followLinks = EditorView.domEventHandlers({
		mousedown(event) {
			const target = event.target as HTMLElement | null;
			const link = target?.closest?.('[data-wikilink]') as HTMLElement | null;
			if (!link?.dataset.wikilink) return false;
			// Stop CodeMirror placing the caret; the click means "go there".
			event.preventDefault();
			onOpenLink(link.dataset.wikilink);
			return true;
		}
	});

	return [plugin, followLinks];
}

/** Completes note titles after `[[`. */
export function wikiLinkCompletion(getTitles: () => string[]) {
	return (context: CompletionContext): CompletionResult | null => {
		const before = context.matchBefore(/\[\[[^\]\n]*/);
		if (!before) return null;

		const typed = before.text.slice(2).toLowerCase();
		const options: Completion[] = getTitles()
			.filter((title) => title.toLowerCase().includes(typed))
			.slice(0, 25)
			.map((title) => ({
				label: title,
				type: 'text',
				// Close the brackets so the link is complete on accept.
				apply: `${title}]]`
			}));

		if (!options.length) return null;
		return { from: before.from + 2, options, validFor: /^[^\]\n]*$/ };
	};
}
