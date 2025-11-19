<script lang="ts">
	import { onMount } from 'svelte';
	import { entries } from '$lib/stores/entries';
	import { Chart, registerables } from 'chart.js';

	Chart.register(...registerables);

	let chartCanvas: HTMLCanvasElement;
	let chart: Chart | null = null;
	let days = 7;

	$: if (chartCanvas && $entries.length > 0) {
		updateChart();
	}

	function updateChart() {
		const now = new Date();
		const labels: string[] = [];
		const foodData: number[] = [];
		const milkData: number[] = [];

		// Generate last N days
		for (let i = days - 1; i >= 0; i--) {
			const date = new Date(now);
			date.setDate(date.getDate() - i);
			const dateStr = date.toISOString().split('T')[0];

			labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

			// Sum entries for this day
			const dayEntries = $entries.filter(e => e.fed_at.startsWith(dateStr));
			const foodTotal = dayEntries
				.filter(e => e.type === 'food')
				.reduce((sum, e) => sum + e.quantity_ml, 0);
			const milkTotal = dayEntries
				.filter(e => e.type === 'milk')
				.reduce((sum, e) => sum + e.quantity_ml, 0);

			foodData.push(foodTotal);
			milkData.push(milkTotal);
		}

		if (chart) {
			chart.destroy();
		}

		chart = new Chart(chartCanvas, {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						label: 'Milk (ml)',
						data: milkData,
						backgroundColor: 'rgba(56, 189, 248, 0.7)',
						borderColor: 'rgba(56, 189, 248, 1)',
						borderWidth: 2,
						borderRadius: 8
					},
					{
						label: 'Food (ml)',
						data: foodData,
						backgroundColor: 'rgba(251, 146, 60, 0.7)',
						borderColor: 'rgba(251, 146, 60, 1)',
						borderWidth: 2,
						borderRadius: 8
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'top',
						labels: {
							padding: 15,
							font: {
								size: 12,
								weight: 'bold'
							},
							usePointStyle: true,
							pointStyle: 'circle'
						}
					},
					tooltip: {
						backgroundColor: 'rgba(0, 0, 0, 0.8)',
						padding: 12,
						cornerRadius: 8,
						titleFont: {
							size: 14
						},
						bodyFont: {
							size: 13
						},
						callbacks: {
							label: function(context) {
								return ` ${context.dataset.label}: ${context.parsed.y} ml`;
							}
						}
					}
				},
				scales: {
					x: {
						grid: {
							display: false
						},
						ticks: {
							font: {
								size: 11
							}
						}
					},
					y: {
						beginAtZero: true,
						grid: {
							color: 'rgba(0, 0, 0, 0.05)'
						},
						ticks: {
							font: {
								size: 11
							},
							callback: function(value) {
								return value + ' ml';
							}
						}
					}
				},
				interaction: {
					intersect: false,
					mode: 'index'
				}
			}
		});
	}

	onMount(() => {
		if ($entries.length > 0) {
			updateChart();
		}

		return () => {
			if (chart) {
				chart.destroy();
			}
		};
	});
</script>

<div class="glass-strong rounded-3xl p-6">
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-2xl font-bold text-gray-900">Trends</h2>

		<!-- Days Filter -->
		<div class="flex gap-2">
			<button
				on:click={() => days = 7}
				class:bg-baby-blue-500={days === 7}
				class:text-white={days === 7}
				class:glass={days !== 7}
				class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
			>
				7 Days
			</button>
			<button
				on:click={() => days = 14}
				class:bg-baby-blue-500={days === 14}
				class:text-white={days === 14}
				class:glass={days !== 14}
				class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
			>
				14 Days
			</button>
			<button
				on:click={() => days = 30}
				class:bg-baby-blue-500={days === 30}
				class:text-white={days === 30}
				class:glass={days !== 30}
				class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
			>
				30 Days
			</button>
		</div>
	</div>

	{#if $entries.length === 0}
		<div class="text-center py-12">
			<div class="text-6xl mb-4">📊</div>
			<p class="text-gray-600">No data to display</p>
			<p class="text-sm text-gray-500 mt-2">Add some entries to see trends</p>
		</div>
	{:else}
		<div class="h-64 sm:h-80">
			<canvas bind:this={chartCanvas}></canvas>
		</div>
	{/if}
</div>
