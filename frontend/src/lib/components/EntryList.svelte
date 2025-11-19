<script lang="ts">
	import { entries } from '$lib/stores/entries';
	import { deleteEntryWithSync } from '$lib/utils/syncManager';

	let filter: 'all' | 'today' | 'week' = 'all';

	$: filteredEntries = $entries.filter(entry => {
		if (filter === 'all') return true;

		const entryDate = new Date(entry.fed_at);
		const now = new Date();

		if (filter === 'today') {
			return entryDate.toDateString() === now.toDateString();
		}

		if (filter === 'week') {
			const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			return entryDate >= weekAgo;
		}

		return true;
	});

	// Group entries by date
	$: groupedEntries = filteredEntries.reduce((groups, entry) => {
		const date = new Date(entry.fed_at).toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});

		if (!groups[date]) {
			groups[date] = [];
		}
		groups[date].push(entry);
		return groups;
	}, {} as Record<string, typeof filteredEntries>);

	function formatTime(dateStr: string) {
		return new Date(dateStr).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		});
	}

	async function handleDelete(id: number | string) {
		if (confirm('Are you sure you want to delete this entry?')) {
			await deleteEntryWithSync(id);
		}
	}

	function getEntryId(entry: any): number | string {
		return entry.id || entry.local_id;
	}
</script>

<div class="glass-strong rounded-3xl p-6">
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-2xl font-bold text-gray-900">History</h2>

		<!-- Filter Buttons -->
		<div class="flex gap-2">
			<button
				on:click={() => filter = 'today'}
				class:bg-baby-blue-500={filter === 'today'}
				class:text-white={filter === 'today'}
				class:glass={filter !== 'today'}
				class="px-4 py-2 rounded-xl text-sm font-medium transition-all"
			>
				Today
			</button>
			<button
				on:click={() => filter = 'week'}
				class:bg-baby-blue-500={filter === 'week'}
				class:text-white={filter === 'week'}
				class:glass={filter !== 'week'}
				class="px-4 py-2 rounded-xl text-sm font-medium transition-all"
			>
				Week
			</button>
			<button
				on:click={() => filter = 'all'}
				class:bg-baby-blue-500={filter === 'all'}
				class:text-white={filter === 'all'}
				class:glass={filter !== 'all'}
				class="px-4 py-2 rounded-xl text-sm font-medium transition-all"
			>
				All
			</button>
		</div>
	</div>

	{#if filteredEntries.length === 0}
		<div class="text-center py-12">
			<div class="text-6xl mb-4">📝</div>
			<p class="text-gray-600">No entries yet</p>
			<p class="text-sm text-gray-500 mt-2">Start tracking by adding a feeding entry above</p>
		</div>
	{:else}
		<div class="space-y-6 max-h-[600px] overflow-y-auto">
			{#each Object.entries(groupedEntries) as [date, dateEntries]}
				<div>
					<h3 class="text-sm font-semibold text-gray-700 mb-3 sticky top-0 bg-white/80 backdrop-blur-sm py-2">
						{date}
					</h3>
					<div class="space-y-3">
						{#each dateEntries as entry (getEntryId(entry))}
							<div class="glass rounded-2xl p-4 hover:shadow-lg transition-shadow">
								<div class="flex items-start gap-4">
									<!-- Icon -->
									<div class="text-3xl flex-shrink-0">
										{entry.type === 'milk' ? '🍼' : '🍽️'}
									</div>

									<!-- Details -->
									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between gap-2">
											<div>
												<h4 class="font-semibold text-gray-900 capitalize">
													{entry.type}
												</h4>
												<p class="text-2xl font-bold text-baby-blue-600">
													{entry.quantity_ml} ml
												</p>
											</div>
											<div class="text-right">
												<p class="text-sm font-medium text-gray-700">
													{formatTime(entry.fed_at)}
												</p>
												{#if entry.feeder_name}
													<p class="text-xs text-gray-500 mt-1">
														by {entry.feeder_name}
													</p>
												{/if}
												{#if entry.synced === false}
													<span class="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
														Not synced
													</span>
												{/if}
											</div>
										</div>

										{#if entry.notes}
											<p class="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-2">
												{entry.notes}
											</p>
										{/if}
									</div>

									<!-- Delete Button -->
									<button
										on:click={() => handleDelete(getEntryId(entry))}
										class="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
										aria-label="Delete entry"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
