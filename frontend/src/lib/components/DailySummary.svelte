<script lang="ts">
	import { todayTotal, todayByType, todayEntries } from '$lib/stores/entries';
</script>

<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
	<!-- Total Today -->
	<div class="glass-strong rounded-2xl p-6 text-center">
		<div class="text-4xl mb-2">💧</div>
		<p class="text-sm text-gray-600 mb-1">Total Today</p>
		<p class="text-3xl font-bold text-baby-blue-600">{$todayTotal}</p>
		<p class="text-xs text-gray-500 mt-1">ml</p>
	</div>

	<!-- Milk Today -->
	<div class="glass-strong rounded-2xl p-6 text-center">
		<div class="text-4xl mb-2">🍼</div>
		<p class="text-sm text-gray-600 mb-1">Milk Today</p>
		<p class="text-3xl font-bold text-blue-600">{$todayByType.milk}</p>
		<p class="text-xs text-gray-500 mt-1">ml</p>
	</div>

	<!-- Food Today -->
	<div class="glass-strong rounded-2xl p-6 text-center">
		<div class="text-4xl mb-2">🍽️</div>
		<p class="text-sm text-gray-600 mb-1">Food Today</p>
		<p class="text-3xl font-bold text-orange-600">{$todayByType.food}</p>
		<p class="text-xs text-gray-500 mt-1">ml</p>
	</div>
</div>

<!-- Feeding Count -->
<div class="mt-4 glass rounded-2xl p-4 text-center">
	<p class="text-sm text-gray-600">
		Total feedings today: <span class="font-bold text-gray-900">{$todayEntries.length}</span>
	</p>
</div>
