import { get } from "svelte/store";
import { entries } from "../stores/entries";
import { syncStatus } from "../stores/sync";
import { auth } from "../stores/auth";
import * as idb from "./indexedDB";
import * as api from "./api";
import { browser } from "$app/environment";

let syncInterval: number | null = null;

export function initSync() {
  if (!browser) return;

  // Listen to online/offline events
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Initial online status
  syncStatus.setOnline(navigator.onLine);

  // Start periodic sync check (more frequent for mobile)
  syncInterval = window.setInterval(checkAndSync, 5000); // Every 5 seconds

  // Initial sync if online
  if (navigator.onLine && get(auth).isAuthenticated) {
    syncData();
  }
}

export function stopSync() {
  if (!browser) return;

  window.removeEventListener("online", handleOnline);
  window.removeEventListener("offline", handleOffline);

  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

function handleOnline() {
  syncStatus.setOnline(true);
  syncData();
}

function handleOffline() {
  syncStatus.setOnline(false);
}

async function checkAndSync() {
  if (navigator.onLine && get(auth).isAuthenticated) {
    const unsynced = await idb.getUnsyncedEntries();
    syncStatus.setPendingCount(unsynced.length);

    if (unsynced.length > 0) {
      await syncData();
    }
  }
}

export async function syncData() {
  const authState = get(auth);

  if (!authState.isAuthenticated || !navigator.onLine) {
    return;
  }

  syncStatus.setSyncing(true);

  try {
    // 1. Push unsynced local entries to server
    const unsyncedEntries = await idb.getUnsyncedEntries();

    for (const entry of unsyncedEntries) {
      try {
        const { local_id, synced, ...entryData } = entry;
        const serverEntry = await api.createEntry(entryData);

        // Mark as synced in IndexedDB
        if (local_id) {
          await idb.markEntrySynced(local_id, serverEntry.id!);
        }
      } catch (error) {
        console.error("Failed to sync entry:", error);
        // Continue with other entries
      }
    }

    // 2. Fetch all entries from server
    const serverEntries = await api.fetchEntries();

    // 3. Update local IndexedDB
    await idb.saveEntries(serverEntries);

    // 4. Update Svelte store
    entries.set(serverEntries);

    syncStatus.setSynced();
  } catch (error) {
    console.error("Sync failed:", error);
    syncStatus.setSyncing(false);
  }
}

export async function addEntryWithSync(
  entry: Omit<FeedingEntry, "id" | "created_at">,
) {
  const authState = get(auth);

  if (!authState.isAuthenticated) {
    throw new Error("Not authenticated");
  }

  if (navigator.onLine) {
    // Online: try to save to server first
    try {
      console.log("🌐 Saving entry to server...");
      const serverEntry = await api.createEntry(entry);
      console.log("✅ Entry saved to server:", serverEntry);

      // Save to IndexedDB with synced flag
      await idb.saveEntries([serverEntry]);

      // Update store
      entries.add(serverEntry);

      // Update sync status
      syncStatus.setPendingCount((await idb.getUnsyncedEntries()).length);

      return serverEntry;
    } catch (error) {
      // If server fails, fall through to offline mode
      console.error("❌ Server save failed, saving offline:", error);
    }
  }

  // Offline or server failed: save locally
  console.log("💾 Saving entry offline...");
  const local_id = await idb.addEntryOffline(entry as any);
  const localEntry = {
    ...entry,
    local_id,
    synced: false,
    created_at: new Date().toISOString(),
  };

  entries.add(localEntry);
  syncStatus.setPendingCount((await idb.getUnsyncedEntries()).length);

  // Trigger immediate sync attempt in background
  if (navigator.onLine) {
    setTimeout(() => syncData(), 1000);
  }

  return localEntry;
}

export async function deleteEntryWithSync(id: number | string) {
  if (typeof id === "number" && navigator.onLine) {
    // Synced entry, delete from server
    try {
      await api.deleteEntryAPI(id);
    } catch (error) {
      console.error("Failed to delete from server:", error);
    }
  }

  // Delete from IndexedDB
  await idb.deleteEntry(id);

  // Update store
  entries.remove(id);
}

// Load initial data from IndexedDB
export async function loadOfflineData() {
  try {
    const offlineEntries = await idb.getAllEntries();
    entries.set(offlineEntries);

    const unsynced = await idb.getUnsyncedEntries();
    syncStatus.setPendingCount(unsynced.length);
  } catch (error) {
    console.error("Failed to load offline data:", error);
  }
}

import type { FeedingEntry } from "../stores/entries";
