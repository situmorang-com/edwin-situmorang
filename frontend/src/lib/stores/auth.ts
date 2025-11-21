import { writable } from "svelte/store";
import { browser } from "$app/environment";
import { sseManager } from "$lib/utils/sseManager";
import { stopSync } from "$lib/utils/syncManager";

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: browser ? true : false, // Don't load on server
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  // Load auth from localStorage on init
  if (browser) {
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("auth_user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (e) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        set({ ...initialState, isLoading: false });
      }
    } else {
      set({ ...initialState, isLoading: false });
    }
  }

  return {
    subscribe,
    login: (user: User, token: string) => {
      if (browser) {
        localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_user", JSON.stringify(user));
      }
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    },
    logout: () => {
      if (browser) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        // Disconnect SSE and stop sync on logout
        sseManager.disconnect();
        stopSync();
      }
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    },
    setLoading: (isLoading: boolean) => {
      update((state) => ({ ...state, isLoading }));
    },
  };
}

export const auth = createAuthStore();
