import { openDB, type IDBPDatabase } from 'idb';
import type { FeedingEntry } from '../stores/entries';

const DB_NAME = 'edwin-feeding-tracker';
const DB_VERSION = 1;
const ENTRIES_STORE = 'entries';
const SYNC_QUEUE_STORE = 'sync_queue';

let db: IDBPDatabase | null = null;

export async function initDB() {
	if (db) return db;

	db = await openDB(DB_NAME, DB_VERSION, {
		upgrade(db) {
			// Store for all feeding entries
			if (!db.objectStoreNames.contains(ENTRIES_STORE)) {
				const entryStore = db.createObjectStore(ENTRIES_STORE, {
					keyPath: 'id',
					autoIncrement: true
				});
				entryStore.createIndex('fed_at', 'fed_at');
				entryStore.createIndex('type', 'type');
				entryStore.createIndex('synced', 'synced');
			}

			// Queue for entries that need to be synced
			if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
				const syncStore = db.createObjectStore(SYNC_QUEUE_STORE, {
					keyPath: 'local_id',
					autoIncrement: true
				});
				syncStore.createIndex('created_at', 'created_at');
			}
		}
	});

	return db;
}

export async function addEntryOffline(entry: FeedingEntry): Promise<string> {
	const database = await initDB();
	const local_id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

	const entryWithId = {
		...entry,
		local_id,
		synced: false,
		created_at: new Date().toISOString()
	};

	await database.add(SYNC_QUEUE_STORE, entryWithId);
	await database.add(ENTRIES_STORE, entryWithId);

	return local_id;
}

export async function getAllEntries(): Promise<FeedingEntry[]> {
	const database = await initDB();
	const entries = await database.getAll(ENTRIES_STORE);
	return entries.sort((a, b) =>
		new Date(b.fed_at).getTime() - new Date(a.fed_at).getTime()
	);
}

export async function getUnsyncedEntries(): Promise<FeedingEntry[]> {
	const database = await initDB();
	const allUnsynced = await database.getAllFromIndex(SYNC_QUEUE_STORE, 'created_at');
	return allUnsynced;
}

export async function markEntrySynced(local_id: string, server_id: number) {
	const database = await initDB();

	// Remove from sync queue
	await database.delete(SYNC_QUEUE_STORE, local_id);

	// Update in entries store
	const entry = await database.get(ENTRIES_STORE, local_id);
	if (entry) {
		await database.delete(ENTRIES_STORE, local_id);
		await database.add(ENTRIES_STORE, {
			...entry,
			id: server_id,
			synced: true,
			local_id: undefined
		});
	}
}

export async function saveEntries(entries: FeedingEntry[]) {
	const database = await initDB();
	const tx = database.transaction(ENTRIES_STORE, 'readwrite');

	// Clear existing synced entries
	const allEntries = await tx.store.getAll();
	for (const entry of allEntries) {
		if (entry.synced !== false) {
			await tx.store.delete(entry.id);
		}
	}

	// Add new entries from server
	for (const entry of entries) {
		await tx.store.add({ ...entry, synced: true });
	}

	await tx.done;
}

export async function deleteEntry(id: number | string) {
	const database = await initDB();

	if (typeof id === 'string') {
		// Local entry
		await database.delete(SYNC_QUEUE_STORE, id);
		await database.delete(ENTRIES_STORE, id);
	} else {
		// Synced entry
		await database.delete(ENTRIES_STORE, id);
	}
}

export async function clearAllData() {
	const database = await initDB();
	await database.clear(ENTRIES_STORE);
	await database.clear(SYNC_QUEUE_STORE);
}
