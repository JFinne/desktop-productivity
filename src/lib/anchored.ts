import type { Action } from 'svelte/action';

export interface AnchorOptions {
	/** The element the popover hangs off — usually the button that opened it. */
	anchor: HTMLElement | null;
	/** Which edge of the anchor to line up with when there is room. */
	align?: 'start' | 'end';
	gap?: number;
}

const MARGIN = 8;

/**
 * Pins a popover to an anchor using `position: fixed`.
 *
 * Fixed rather than absolute on purpose: the page content lives inside a
 * scrolling `<main>`, and `overflow: auto` clips absolutely-positioned children
 * at its box — a menu opening past the edge simply disappears. Fixed
 * positioning escapes that, at the cost of having to place the element by hand
 * and re-place it whenever anything scrolls.
 *
 * Placement prefers below-and-aligned, then flips to the other edge or above if
 * that would leave the window, and clamps as a last resort so a popover is
 * never pushed off-screen entirely.
 */
export const anchored: Action<HTMLElement, AnchorOptions> = (node, options) => {
	let current = options;

	function place() {
		const anchor = current?.anchor;
		if (!anchor) return;

		const { align = 'start', gap = 5 } = current;
		const box = anchor.getBoundingClientRect();
		const width = node.offsetWidth;
		const height = node.offsetHeight;

		let left = align === 'start' ? box.left : box.right - width;
		// Flip to the opposite edge if the preferred side overflows, then clamp.
		if (left + width > window.innerWidth - MARGIN) left = box.right - width;
		if (left < MARGIN) left = box.left;
		left = Math.max(MARGIN, Math.min(left, window.innerWidth - width - MARGIN));

		let top = box.bottom + gap;
		if (top + height > window.innerHeight - MARGIN) {
			const above = box.top - gap - height;
			top = above >= MARGIN ? above : Math.max(MARGIN, window.innerHeight - height - MARGIN);
		}

		node.style.position = 'fixed';
		node.style.left = `${left}px`;
		node.style.top = `${top}px`;
	}

	place();

	// Capture phase, because the scroll happens on an inner container and
	// scroll events from those do not bubble.
	window.addEventListener('scroll', place, true);
	window.addEventListener('resize', place);

	return {
		update(next: AnchorOptions) {
			current = next;
			place();
		},
		destroy() {
			window.removeEventListener('scroll', place, true);
			window.removeEventListener('resize', place);
		}
	};
};
