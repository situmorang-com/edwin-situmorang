import { get } from "svelte/store";
import { entries } from "$lib/stores/entries";
import { syncData } from "./syncManager";
import type { FeedingEntry } from "$lib/types";

class SSEManager {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isIntentionallyClosed = false;
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
  private fallbackPollInterval: ReturnType<typeof setInterval> | null = null;

  async connect() {
    if (this.eventSource) {
      console.log("📡 SSE already connected");
      return;
    }

    const token = localStorage.getItem("auth_token");
    if (!token) {
      console.log("📡 No token, skipping SSE connection");
      return;
    }

    this.isIntentionallyClosed = false;

    try {
      // EventSource doesn't support custom headers, so pass token as query param
      const url = `/api/sse/stream?token=${encodeURIComponent(token)}`;
      console.log("📡 Connecting to SSE:", url);

      this.eventSource = new EventSource(url, {
        withCredentials: true,
      });

      this.eventSource.addEventListener("connection", (event: MessageEvent) => {
        console.log("📡 SSE connected:", event.data);
        const data = JSON.parse(event.data);
        console.log("📡 Connection details:", data);
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.startHeartbeatMonitor();
        this.stopFallbackPolling(); // Stop polling once SSE is connected
      });

      this.eventSource.addEventListener("heartbeat", () => {
        console.log("💓 SSE heartbeat received");
        this.resetHeartbeatMonitor();
      });

      this.eventSource.addEventListener("entry", (event: MessageEvent) => {
        console.log("📡 SSE entry event:", event.data);
        const data = JSON.parse(event.data);
        this.handleEntryEvent(data);
      });

      this.eventSource.onerror = (error) => {
        console.error("📡 SSE connection error:", error);
        this.handleConnectionError();
      };

      this.eventSource.onopen = () => {
        console.log("📡 SSE connection opened");
      };
    } catch (error) {
      console.error("📡 Failed to create SSE connection:", error);
      this.handleConnectionError();
    }
  }

  private handleEntryEvent(data: {
    type: string;
    entry?: FeedingEntry;
    entryId?: string;
  }) {
    const currentEntries = get(entries);

    switch (data.type) {
      case "new_entry":
        if (data.entry) {
          console.log("📡 New entry received via SSE:", data.entry);
          // Check if entry already exists (avoid duplicates)
          const exists = currentEntries.some((e) => e.id === data.entry!.id);
          if (!exists) {
            entries.set([data.entry, ...currentEntries]);
            console.log("✅ Added new entry to UI");
          } else {
            console.log("ℹ️ Entry already exists, skipping");
          }
        }
        break;

      case "update_entry":
        if (data.entry) {
          console.log("📡 Entry update received via SSE:", data.entry);
          const updatedEntries = currentEntries.map((e) =>
            e.id === data.entry!.id ? data.entry! : e,
          );
          entries.set(updatedEntries);
          console.log("✅ Updated entry in UI");
        }
        break;

      case "delete_entry":
        if (data.entryId) {
          console.log("📡 Entry deletion received via SSE:", data.entryId);
          const filteredEntries = currentEntries.filter(
            (e) => e.id !== data.entryId,
          );
          entries.set(filteredEntries);
          console.log("✅ Removed entry from UI");
        }
        break;

      default:
        console.warn("📡 Unknown entry event type:", data.type);
    }
  }

  private startHeartbeatMonitor() {
    this.resetHeartbeatMonitor();
  }

  private resetHeartbeatMonitor() {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }
    // If no heartbeat received in 45 seconds (30s interval + 15s buffer), reconnect
    this.heartbeatTimeout = setTimeout(() => {
      console.warn("📡 No heartbeat received, reconnecting...");
      this.disconnect();
      this.connect();
    }, 45000);
  }

  private handleConnectionError() {
    this.disconnect();

    if (this.isIntentionallyClosed) {
      console.log("📡 Connection closed intentionally, not reconnecting");
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay =
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
      console.log(
        `📡 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      );

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error(
        "📡 Max reconnection attempts reached, falling back to polling",
      );
      this.startFallbackPolling();
    }
  }

  private startFallbackPolling() {
    if (this.fallbackPollInterval) {
      return; // Already polling
    }

    console.log("📡 Starting fallback polling (every 30 seconds)");
    this.fallbackPollInterval = setInterval(() => {
      console.log("🔄 Polling for updates (SSE fallback)");
      syncData();
    }, 30000); // Poll every 30 seconds
  }

  private stopFallbackPolling() {
    if (this.fallbackPollInterval) {
      clearInterval(this.fallbackPollInterval);
      this.fallbackPollInterval = null;
      console.log("📡 Stopped fallback polling");
    }
  }

  disconnect() {
    console.log("📡 Disconnecting SSE");
    this.isIntentionallyClosed = true;

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.stopFallbackPolling();
  }

  reconnect() {
    console.log("📡 Manual reconnect requested");
    this.disconnect();
    this.isIntentionallyClosed = false;
    this.reconnectAttempts = 0;
    this.connect();
  }

  isConnected(): boolean {
    return (
      this.eventSource !== null &&
      this.eventSource.readyState === EventSource.OPEN
    );
  }
}

export const sseManager = new SSEManager();
