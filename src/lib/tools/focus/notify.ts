/**
 * Desktop notifications for phase changes, so a finished round is visible when
 * Fokus is minimised or behind another window.
 */
import {
	isPermissionGranted,
	requestPermission,
	sendNotification
} from '@tauri-apps/plugin-notification';
import { inTauri } from '$lib/storage';

let granted: boolean | null = null;

async function ensurePermission(): Promise<boolean> {
	if (!inTauri) return false;
	if (granted !== null) return granted;

	try {
		granted = (await isPermissionGranted()) || (await requestPermission()) === 'granted';
	} catch (err) {
		console.error('could not check notification permission', err);
		granted = false;
	}
	return granted;
}

export async function notify(title: string, body: string): Promise<void> {
	if (!(await ensurePermission())) return;
	try {
		sendNotification({ title, body });
	} catch (err) {
		console.error('could not send notification', err);
	}
}
