<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import AuthButton from '$lib/components/AuthButton.svelte';
	import QuickEntry from '$lib/components/QuickEntry.svelte';
	import DailySummary from '$lib/components/DailySummary.svelte';
	import EntryList from '$lib/components/EntryList.svelte';
	import TrendsChart from '$lib/components/TrendsChart.svelte';
</script>

<svelte:head>
	<title>Edwin's Feeding Tracker</title>
</svelte:head>

{#if $auth.isAuthenticated}
	<div class="min-h-screen p-4 pb-20">
		<div class="max-w-6xl mx-auto space-y-6">
			<!-- Header with Auth -->
			<div class="space-y-4">
				<div class="text-center">
					<div class="inline-block glass-strong rounded-3xl p-4 mb-3">
						<img
							src="/edwin.jpg"
							alt="Baby Edwin"
							class="w-24 h-24 rounded-2xl object-cover shadow-lg"
						/>
					</div>
					<h1 class="text-4xl font-bold text-gray-900 mb-1">Edwin's Tracker</h1>
					<p class="text-gray-600">Track feeding with love</p>
				</div>

				<AuthButton />
			</div>

			<!-- Daily Summary -->
			<DailySummary />

			<!-- Quick Entry Buttons -->
			<div class="grid grid-cols-2 gap-4">
				<QuickEntry type="milk" />
				<QuickEntry type="food" />
			</div>

			<!-- Trends Chart -->
			<TrendsChart />

			<!-- Entry History -->
			<EntryList />
		</div>
	</div>
{:else if $auth.isLoading}
	<!-- Loading State -->
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-center">
			<div class="w-16 h-16 border-4 border-baby-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
			<p class="text-gray-600">Loading...</p>
		</div>
	</div>
{/if}
