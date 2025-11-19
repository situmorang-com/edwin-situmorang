import { writable, derived } from 'svelte/store';

export interface FeedingEntry {
	id?: number;
	user_id?: number;
	type: 'food' | 'milk';
	quantity_ml: number;
	fed_at: string; // ISO datetime string
	notes?: string;
	feeder_name?: string;
	created_at?: string;
	synced?: boolean; // For offline tracking
	local_id?: string; // Temporary ID for offline entries
}

function createEntriesStore() {
	const { subscribe, set, update } = writable<FeedingEntry[]>([]);

	return {
		subscribe,
		set,
		add: (entry: FeedingEntry) => {
			update(entries => [entry, ...entries]);
		},
		remove: (id: number | string) => {
			update(entries => entries.filter(e =>
				e.id ? e.id !== id : e.local_id !== id
			));
		},
		updateEntry: (id: number | string, updatedEntry: Partial<FeedingEntry>) => {
			update(entries => entries.map(e => {
				const matches = e.id ? e.id === id : e.local_id === id;
				return matches ? { ...e, ...updatedEntry } : e;
			}));
		},
		clear: () => set([])
	};
}

export const entries = createEntriesStore();

// Derived stores for analytics
export const todayEntries = derived(entries, $entries => {
	const today = new Date().toISOString().split('T')[0];
	return $entries.filter(e => e.fed_at.startsWith(today));
});

export const todayTotal = derived(todayEntries, $today => {
	return $today.reduce((sum, e) => sum + e.quantity_ml, 0);
});

export const todayByType = derived(todayEntries, $today => {
	return {
		food: $today.filter(e => e.type === 'food').reduce((sum, e) => sum + e.quantity_ml, 0),
		milk: $today.filter(e => e.type === 'milk').reduce((sum, e) => sum + e.quantity_ml, 0)
	};
});
