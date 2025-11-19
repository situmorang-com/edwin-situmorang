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

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>Edwin's Feeding Tracker - Track Baby Food & Milk Intake</title>
	<meta name="title" content="Edwin's Feeding Tracker - Track Baby Food & Milk Intake" />
	<meta name="description" content="Track baby Edwin's daily food and milk intake with this easy-to-use offline-first mobile app. Monitor feeding patterns and trends." />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://edwin.situmorang.com/" />
	<meta property="og:title" content="Edwin's Feeding Tracker - Track Baby Food & Milk Intake" />
	<meta property="og:description" content="Track baby Edwin's daily food and milk intake with this easy-to-use offline-first mobile app. Monitor feeding patterns and trends." />
	<meta property="og:image" content="https://edwin.situmorang.com/edwin.jpg" />
	<meta property="og:image:secure_url" content="https://edwin.situmorang.com/edwin.jpg" />
	<meta property="og:image:type" content="image/jpeg" />
	<meta property="og:image:width" content="945" />
	<meta property="og:image:height" content="849" />
	<meta property="og:image:alt" content="Baby Edwin" />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://edwin.situmorang.com/" />
	<meta property="twitter:title" content="Edwin's Feeding Tracker - Track Baby Food & Milk Intake" />
	<meta property="twitter:description" content="Track baby Edwin's daily food and milk intake with this easy-to-use offline-first mobile app. Monitor feeding patterns and trends." />
	<meta property="twitter:image" content="https://edwin.situmorang.com/edwin.jpg" />

	<!-- Additional Meta -->
	<meta name="theme-color" content="#93C5FD" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
</svelte:head>

<slot />
