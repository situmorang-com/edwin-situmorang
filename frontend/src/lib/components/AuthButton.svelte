<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { syncStatus } from '$lib/stores/sync';

	function handleLogout() {
		auth.logout();
		window.location.href = '/login';
	}
</script>

{#if $auth.isAuthenticated && $auth.user}
	<div class="glass rounded-2xl p-4 flex items-center justify-between gap-4">
		<div class="flex items-center gap-3">
			{#if $auth.user.picture}
				<img
					src={$auth.user.picture}
					alt={$auth.user.name}
					class="w-10 h-10 rounded-full border-2 border-white/50"
				/>
			{:else}
				<div class="w-10 h-10 rounded-full bg-baby-blue-500 flex items-center justify-center text-white font-bold">
					{$auth.user.name.charAt(0).toUpperCase()}
				</div>
			{/if}
			<div class="flex-1 min-w-0">
				<p class="text-sm font-medium text-gray-900 truncate">{$auth.user.name}</p>
				<p class="text-xs text-gray-600 truncate">{$auth.user.email}</p>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<!-- Sync status indicator -->
			<div class="flex items-center gap-1">
				{#if $syncStatus.isSyncing}
					<div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
					<span class="text-xs text-gray-600">Syncing...</span>
				{:else if !$syncStatus.isOnline}
					<div class="w-2 h-2 bg-red-500 rounded-full"></div>
					<span class="text-xs text-gray-600">Offline</span>
				{:else if $syncStatus.pendingCount > 0}
					<div class="w-2 h-2 bg-orange-500 rounded-full"></div>
					<span class="text-xs text-gray-600">{$syncStatus.pendingCount} pending</span>
				{:else}
					<div class="w-2 h-2 bg-green-500 rounded-full"></div>
					<span class="text-xs text-gray-600">Synced</span>
				{/if}
			</div>

			<button
				on:click={handleLogout}
				class="px-3 py-1.5 bg-red-500/80 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
			>
				Logout
			</button>
		</div>
	</div>
{/if}
