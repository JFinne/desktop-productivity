/**
 * Drag state for moving a task or an event onto a day.
 *
 * The payload also goes into the drag event's dataTransfer as `kind:id`, but a
 * module-level record is what lets cells style themselves while a drag is in
 * flight — dataTransfer is not readable during `dragover` for security reasons.
 */
export type DragKind = 'task' | 'event';

export interface DragItem {
	kind: DragKind;
	id: string;
}

let dragging = $state<DragItem | null>(null);

export const drag = {
	get item(): DragItem | null {
		return dragging;
	},
	get active(): boolean {
		return dragging !== null;
	},
	/** True for the exact chip being dragged, so it can fade itself out. */
	isDragging(kind: DragKind, id: string): boolean {
		return dragging?.kind === kind && dragging.id === id;
	},
	start(kind: DragKind, id: string) {
		dragging = { kind, id };
	},
	end() {
		dragging = null;
	}
};

/** Parses the `kind:id` payload written into dataTransfer. */
export function parseDragPayload(payload: string | undefined): DragItem | null {
	if (!payload) return null;
	const at = payload.indexOf(':');
	if (at < 0) return null;
	const kind = payload.slice(0, at);
	const id = payload.slice(at + 1);
	if ((kind !== 'task' && kind !== 'event') || !id) return null;
	return { kind, id };
}
