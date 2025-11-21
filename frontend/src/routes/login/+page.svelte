<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import { loginWithGoogle } from '$lib/utils/api';
	import { sseManager } from '$lib/utils/sseManager';
	import { initSync } from '$lib/utils/syncManager';

	let isLoading = false;
	let error = '';

	onMount(() => {
		// Redirect if already authenticated
		if ($auth.isAuthenticated) {
			goto('/');
		}

		// Debug: Check if Client ID is loaded
		const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
		console.log('🔑 Google Client ID:', clientId);

		if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com') {
			error = 'Google Client ID not configured. Please check frontend/.env file.';
			return;
		}

		// Load Google Sign-In script
		const script = document.createElement('script');
		script.src = 'https://accounts.google.com/gsi/client';
		script.async = true;
		script.defer = true;
		document.head.appendChild(script);

		// Initialize Google Sign-In when script loads
		script.onload = () => {
			if (window.google) {
				console.log('✅ Google Sign-In SDK loaded');

				// Use popup mode for better compatibility
				window.google.accounts.id.initialize({
					client_id: clientId,
					callback: handleGoogleResponse,
					auto_select: false,
					cancel_on_tap_outside: false
				});

				window.google.accounts.id.renderButton(
					document.getElementById('google-signin-button'),
					{
						theme: 'filled_blue',
						size: 'large',
						text: 'signin_with',
						shape: 'pill',
						width: 280,
						locale: 'en'
					}
				);
			}
		};
	});

	async function handleGoogleResponse(response: any) {
		console.log('📱 Google response received:', response ? 'Yes' : 'No');
		isLoading = true;
		error = '';

		try {
			if (!response || !response.credential) {
				throw new Error('No credential received from Google');
			}

			console.log('🔐 Sending credential to backend...');
			const data = await loginWithGoogle(response.credential);
			console.log('✅ Login successful:', data.user.name);

			auth.login(data.user, data.token);

			// Initialize sync and SSE after login
			initSync();
			sseManager.connect();

			await goto('/');
		} catch (err: any) {
			const errorMsg = err?.message || 'Login failed. Please try again.';
			error = errorMsg;
			console.error('❌ Login error:', err);
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Login - Edwin's Feeding Tracker</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<!-- Logo/Header -->
		<div class="text-center mb-8">
			<div class="inline-block glass-strong rounded-3xl p-6 mb-4">
				<img
					src="/edwin.jpg"
					alt="Edwin"
					class="w-32 h-32 rounded-2xl object-cover mx-auto shadow-lg"
				/>
			</div>
			<h1 class="text-4xl font-bold text-gray-900 mb-2">Edwin's Tracker</h1>
			<p class="text-gray-600">Track feeding with love and care</p>
		</div>

		<!-- Login Card -->
		<div class="glass-strong rounded-3xl p-8 shadow-2xl">
			<h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Welcome!</h2>

			{#if error}
				<div class="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
					{error}
				</div>
			{/if}

			<div class="flex flex-col items-center gap-4">
				<p class="text-gray-600 text-center text-sm">
					Sign in with your Google account to start tracking
				</p>

				<div id="google-signin-button" class="flex justify-center"></div>

				{#if isLoading}
					<div class="flex items-center gap-2 text-baby-blue-600">
						<div class="w-4 h-4 border-2 border-baby-blue-600 border-t-transparent rounded-full animate-spin"></div>
						<span class="text-sm">Signing in...</span>
					</div>
				{/if}
			</div>

			<div class="mt-8 pt-6 border-t border-gray-200">
				<p class="text-xs text-gray-500 text-center">
					By signing in, you agree to track Edwin's feeding data securely.
				</p>
			</div>
		</div>

		<!-- Features -->
		<div class="mt-8 grid grid-cols-2 gap-4">
			<div class="glass rounded-2xl p-4 text-center">
				<div class="text-2xl mb-2">🍼</div>
				<p class="text-sm font-medium text-gray-900">Track Milk</p>
				<p class="text-xs text-gray-600 mt-1">Monitor intake</p>
			</div>
			<div class="glass rounded-2xl p-4 text-center">
				<div class="text-2xl mb-2">🍽️</div>
				<p class="text-sm font-medium text-gray-900">Track Food</p>
				<p class="text-xs text-gray-600 mt-1">Log meals easily</p>
			</div>
			<div class="glass rounded-2xl p-4 text-center">
				<div class="text-2xl mb-2">📊</div>
				<p class="text-sm font-medium text-gray-900">View Trends</p>
				<p class="text-xs text-gray-600 mt-1">Analyze patterns</p>
			</div>
			<div class="glass rounded-2xl p-4 text-center">
				<div class="text-2xl mb-2">📱</div>
				<p class="text-sm font-medium text-gray-900">Works Offline</p>
				<p class="text-xs text-gray-600 mt-1">Auto-sync later</p>
			</div>
		</div>
	</div>
</div>
