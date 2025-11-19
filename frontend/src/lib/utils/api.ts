import { get } from 'svelte/store';
import { auth } from '../stores/auth';
import type { FeedingEntry } from '../stores/entries';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
	const authState = get(auth);
	const headers = new Headers(options.headers);

	if (authState.token) {
		headers.set('Authorization', `Bearer ${authState.token}`);
	}

	headers.set('Content-Type', 'application/json');

	const response = await fetch(`${API_BASE}${url}`, {
		...options,
		headers
	});

	if (response.status === 401) {
		// Token expired, logout
		auth.logout();
		throw new Error('Unauthorized');
	}

	if (!response.ok) {
		const error = await response.text();
		throw new Error(error || 'Request failed');
	}

	return response;
}

export async function loginWithGoogle(token: string) {
	const response = await fetch(`${API_BASE}/auth/google`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ token })
	});

	if (!response.ok) {
		throw new Error('Login failed');
	}

	return response.json();
}

export async function fetchEntries(): Promise<FeedingEntry[]> {
	const response = await fetchWithAuth('/entries');
	return response.json();
}

export async function createEntry(entry: Omit<FeedingEntry, 'id' | 'created_at'>): Promise<FeedingEntry> {
	const response = await fetchWithAuth('/entries', {
		method: 'POST',
		body: JSON.stringify(entry)
	});
	return response.json();
}

export async function updateEntry(id: number, entry: Partial<FeedingEntry>): Promise<FeedingEntry> {
	const response = await fetchWithAuth(`/entries/${id}`, {
		method: 'PUT',
		body: JSON.stringify(entry)
	});
	return response.json();
}

export async function deleteEntryAPI(id: number): Promise<void> {
	await fetchWithAuth(`/entries/${id}`, {
		method: 'DELETE'
	});
}

export async function getStats(days: number = 7) {
	const response = await fetchWithAuth(`/entries/stats?days=${days}`);
	return response.json();
}
