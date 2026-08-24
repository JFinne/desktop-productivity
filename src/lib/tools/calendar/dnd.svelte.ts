/**
 * Drag state for moving a task onto a day.
 *
 * The task id also goes into the drag event's dataTransfer, but a module-level
 * record is what lets cells style themselves while a drag is in flight —
 * dataTransfer is not readable during `dragover` for security reasons.
 */
let draggingId = $state<string | null>(null);

export const drag = {
	get taskId() {
		return draggingId;
	},
	get active() {
		return draggingId !== null;
	},
	start(id: string) {
		draggingId = id;
	},
	end() {
		draggingId = null;
	}
};
