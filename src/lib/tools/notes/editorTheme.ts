/**
 * CodeMirror styling, wired to the app's theme tokens.
 *
 * Everything here is `var(--…)`, so the editor follows the theme picker for
 * free — including the ten tinted palettes — rather than needing a light and a
 * dark CodeMirror theme of its own.
 */
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';

export const editorTheme = EditorView.theme({
	'&': {
		height: '100%',
		color: 'var(--text)',
		backgroundColor: 'transparent',
		fontSize: 'calc(0.95rem * var(--font-scale))'
	},
	'&.cm-focused': { outline: 'none' },
	'.cm-scroller': {
		fontFamily: 'var(--font-ui)',
		lineHeight: '1.65',
		overflow: 'auto'
	},
	'.cm-content': {
		padding: '0.25rem 0 40vh',
		caretColor: 'var(--accent)',
		maxWidth: '46rem'
	},
	'.cm-line': { padding: '0 2px' },
	'.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)' },
	'.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
		backgroundColor: 'var(--accent-soft)'
	},
	'.cm-activeLine': { backgroundColor: 'transparent' },
	'.cm-placeholder': { color: 'var(--text-faint)' },

	/* Live-preview block styles. */
	'.cm-md-h1': { fontSize: '1.7em', fontWeight: '600', lineHeight: '1.3' },
	'.cm-md-h2': { fontSize: '1.42em', fontWeight: '600', lineHeight: '1.3' },
	'.cm-md-h3': { fontSize: '1.22em', fontWeight: '600' },
	'.cm-md-h4': { fontSize: '1.08em', fontWeight: '600' },
	'.cm-md-h5': { fontSize: '1em', fontWeight: '600', color: 'var(--text-muted)' },
	'.cm-md-h6': { fontSize: '0.94em', fontWeight: '600', color: 'var(--text-muted)' },
	'.cm-md-quote': {
		borderLeft: '2px solid var(--border-strong)',
		paddingLeft: '0.7rem',
		color: 'var(--text-muted)'
	},
	'.cm-md-hr': {
		borderBottom: '1px solid var(--border-strong)',
		height: '0',
		overflow: 'hidden',
		color: 'transparent'
	},

	/* Inline styles. */
	'.cm-md-strong': { fontWeight: '700', color: 'var(--text)' },
	'.cm-md-em': { fontStyle: 'italic' },
	'.cm-md-strike': { textDecoration: 'line-through', color: 'var(--text-muted)' },
	'.cm-md-code': {
		fontFamily: 'var(--font-mono)',
		fontSize: '0.88em',
		background: 'var(--bg-active)',
		borderRadius: '3px',
		padding: '0.05em 0.3em'
	},
	'.cm-md-listmark': { color: 'var(--accent)' },
	'.cm-md-link': { color: 'var(--accent)', textDecoration: 'underline' },
	'.cm-md-wikilink': {
		color: 'var(--accent)',
		textDecoration: 'underline',
		textUnderlineOffset: '2px',
		cursor: 'pointer'
	},

	/* Completion popup for `[[`. */
	'.cm-tooltip': {
		border: '1px solid var(--border-strong)',
		borderRadius: 'var(--radius)',
		backgroundColor: 'var(--bg-raised)',
		color: 'var(--text)'
	},
	'.cm-tooltip.cm-tooltip-autocomplete > ul': {
		fontFamily: 'var(--font-ui)',
		fontSize: '0.85rem',
		maxHeight: '14rem'
	},
	'.cm-tooltip.cm-tooltip-autocomplete > ul > li': { padding: '0.2rem 0.5rem' },
	'.cm-tooltip-autocomplete ul li[aria-selected]': {
		backgroundColor: 'var(--accent-soft)',
		color: 'var(--text)'
	}
});

/** Only really visible inside fenced code blocks, where marks stay literal. */
export const editorHighlight = syntaxHighlighting(
	HighlightStyle.define([
		{ tag: tags.keyword, color: 'var(--accent)' },
		{ tag: [tags.string, tags.special(tags.string)], color: 'var(--success)' },
		{ tag: [tags.number, tags.bool, tags.null], color: 'var(--warning)' },
		{ tag: [tags.comment, tags.lineComment, tags.blockComment], color: 'var(--text-faint)' },
		{ tag: [tags.function(tags.variableName), tags.definition(tags.variableName)], color: 'var(--info)' },
		{ tag: tags.monospace, fontFamily: 'var(--font-mono)' },
		{ tag: tags.url, color: 'var(--info)' }
	])
);
