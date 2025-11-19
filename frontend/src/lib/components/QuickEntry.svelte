<script lang="ts">
	import { tick } from 'svelte';
	import { addEntryWithSync } from '$lib/utils/syncManager';
	import type { FeedingEntry } from '$lib/stores/entries';

	export let type: 'food' | 'milk';

	let isOpen = false;
	let quantity = '';
	let notes = '';
	let dateTime = '';
	let isSubmitting = false;
	let modalKey = 0; // Force re-render on Safari

	$: icon = type === 'milk' ? '🍼' : '🍽️';
	$: label = type === 'milk' ? 'Milk' : 'Food';
	$: placeholder = type === 'milk' ? 'e.g., 120ml' : 'e.g., 150ml';

	function openForm() {
		// Set default datetime to now
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');
		dateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

		isOpen = true;
	}

	async function closeForm() {
		console.log('🔴 Closing modal, isOpen before:', isOpen);

		// Reset form state first
		quantity = '';
		notes = '';
		dateTime = '';
		isSubmitting = false;

		// Force Safari to close by incrementing key
		modalKey++;

		// Force immediate close for Safari - set isOpen after a microtask
		await tick();
		isOpen = false;

		// Double-check after another tick
		await tick();
		console.log('🔴 Modal closed, isOpen after:', isOpen);
	}

	async function handleSubmit() {
		if (!quantity || !dateTime) return;

		isSubmitting = true;

		try {
			const entry: Omit<FeedingEntry, 'id' | 'created_at'> = {
				type,
				quantity_ml: parseInt(quantity),
				fed_at: new Date(dateTime).toISOString(),
				notes: notes.trim() || undefined
			};

			await addEntryWithSync(entry);
			closeForm();
		} catch (error) {
			console.error('Failed to add entry:', error);
			alert('Failed to save entry. Please try again.');
		} finally {
			isSubmitting = false;
		}
	}

	// Quick add buttons
	const quickAmounts = type === 'milk' ? [60, 90, 120, 150] : [60, 90, 120, 150];

	async function quickAdd(amount: number) {
		console.log('📱 Quick add clicked:', amount, 'isSubmitting:', isSubmitting);
		if (isSubmitting) {
			console.log('⚠️ Already submitting, ignoring');
			return; // Prevent double-tap
		}
		isSubmitting = true;

		try {
			console.log('💾 Adding entry...');
			const entry: Omit<FeedingEntry, 'id' | 'created_at'> = {
				type,
				quantity_ml: amount,
				fed_at: new Date().toISOString()
			};

			await addEntryWithSync(entry);
			console.log('✅ Entry added successfully');

			// Close form - await to ensure Safari processes it
			await closeForm();
		} catch (error) {
			console.error('❌ Failed to add entry:', error);
			alert('Failed to save entry. Please try again.');
			isSubmitting = false;
		}
	}
</script>

<!-- Quick Add Button -->
<button
	on:click={openForm}
	disabled={isSubmitting}
	class="glass-strong rounded-3xl p-6 text-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
>
	<div class="text-5xl mb-3">{icon}</div>
	<h3 class="text-xl font-bold text-gray-900 mb-2">{label}</h3>
	<p class="text-sm text-gray-600">Tap to add</p>
</button>

<!-- Modal Form -->
{#if isOpen}
	{#key modalKey}
	<div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
		<div class="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
			<!-- Header -->
			<div class="sticky top-0 bg-gradient-to-r from-baby-blue-500 to-blue-500 p-6 rounded-t-3xl sm:rounded-t-3xl">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<span class="text-4xl">{icon}</span>
						<h2 class="text-2xl font-bold text-white">Add {label}</h2>
					</div>
					<button
						on:click={closeForm}
						class="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>

			<!-- Form -->
			<form on:submit|preventDefault={handleSubmit} class="p-6 space-y-6">
				<!-- Quick Amount Buttons -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-3">Quick Add (ml)</label>
					<div class="grid grid-cols-4 gap-3">
						{#each quickAmounts as amount}
							<button
								type="button"
								on:click={() => quickAdd(amount)}
								disabled={isSubmitting}
								class="glass-strong rounded-2xl py-4 text-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
							>
								<div class="text-2xl font-bold text-baby-blue-600">{amount}</div>
								<div class="text-xs text-gray-600 mt-1">ml</div>
							</button>
						{/each}
					</div>
				</div>

				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-gray-200"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="px-4 bg-white text-gray-500">or enter custom</span>
					</div>
				</div>

				<!-- Quantity Input -->
				<div>
					<label for="quantity" class="block text-sm font-medium text-gray-700 mb-2">
						Quantity (ml) *
					</label>
					<input
						id="quantity"
						type="number"
						bind:value={quantity}
						placeholder={placeholder}
						min="1"
						max="1000"
						required
						class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-baby-blue-500 focus:ring-0 text-lg"
					/>
				</div>

				<!-- Date/Time Input -->
				<div>
					<label for="datetime" class="block text-sm font-medium text-gray-700 mb-2">
						Date & Time *
					</label>
					<input
						id="datetime"
						type="datetime-local"
						bind:value={dateTime}
						required
						class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-baby-blue-500 focus:ring-0"
					/>
				</div>

				<!-- Notes Input -->
				<div>
					<label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
						Notes (optional)
					</label>
					<textarea
						id="notes"
						bind:value={notes}
						placeholder="Any additional notes..."
						rows="3"
						class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-baby-blue-500 focus:ring-0 resize-none"
					></textarea>
				</div>

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={isSubmitting || !quantity || !dateTime}
					class="w-full py-4 bg-gradient-to-r from-baby-blue-500 to-blue-500 text-white font-bold rounded-2xl hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if isSubmitting}
						<span class="flex items-center justify-center gap-2">
							<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
							Saving...
						</span>
					{:else}
						Save Entry
					{/if}
				</button>
			</form>
		</div>
	</div>
	{/key}
{/if}
