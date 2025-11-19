<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import { initSync, stopSync, loadOfflineData } from '$lib/utils/syncManager';
	import '../app.css';

	onMount(async () => {
		// Load offline data first
		await loadOfflineData();

		// Initialize sync if authenticated
		if ($auth.isAuthenticated) {
			initSync();
		}

		return () => {
			stopSync();
		};
	});

	// Redirect to login if not authenticated (except on login page)
	$: if (!$auth.isLoading && !$auth.isAuthenticated && typeof window !== 'undefined') {
		const path = window.location.pathname;
		if (path !== '/login') {
			goto('/login');
		}
	}
</script>

<slot />
