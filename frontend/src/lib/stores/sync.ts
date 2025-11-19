import { writable } from 'svelte/store';

export interface SyncStatus {
	isOnline: boolean;
	isSyncing: boolean;
	lastSync: Date | null;
	pendingCount: number;
}

function createSyncStore() {
	const { subscribe, update } = writable<SyncStatus>({
		isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
		isSyncing: false,
		lastSync: null,
		pendingCount: 0
	});

	return {
		subscribe,
		setOnline: (isOnline: boolean) => {
			update(state => ({ ...state, isOnline }));
		},
		setSyncing: (isSyncing: boolean) => {
			update(state => ({ ...state, isSyncing }));
		},
		setSynced: () => {
			update(state => ({ ...state, lastSync: new Date(), pendingCount: 0, isSyncing: false }));
		},
		setPendingCount: (count: number) => {
			update(state => ({ ...state, pendingCount: count }));
		}
	};
}

export const syncStatus = createSyncStore();
