<script lang="ts">
	import { ProgressStatus, productsStore, progressStore } from '../lib/storeDataHandler';
	import { fade } from 'svelte/transition';

	export let storeDataHandler;
	export let createAffiliate;
	export let calculatePriceInclShipping;
</script>

<div
	class="h-80% overflow-auto grid grid-cols-1 shadow-inset rounded-2"
	transition:fade={{ duration: 500 }}
	id="table-container"
>
	<table class="">
		<thead class="sticky top-[-0.1px]">
			<tr>
				<th class="bg-dark z-10 p-4 text-white">Preis inkl. Vsk</th>
				<th class="bg-dark z-10 p-4 text-white">Markt</th>
			</tr>
		</thead>
		<tbody class="scroll-auto">
			{#if $progressStore.status !== ProgressStatus.RESTARTED}
				{#each $productsStore as product (product.store.id)}
					<tr class="text-center" transition:fade={{ duration: 200 }}>
						{#if !product.itemOnDisplay}
							<td>{calculatePriceInclShipping(product).toFixed(2) || 'N/A'}€</td>
							<td>
								<button class="p-4 bg-dark rounded-2 shadow-dark shadow-2xl text-white">
									<a
										href={createAffiliate(storeDataHandler.getAwinLink, product.store.id)}
										target="_blank">Link*</a
									>
								</button>
							</td>
						{:else}
							<td class="bg-orange-400">{calculatePriceInclShipping(product).toFixed(2) || 'N/A'}€</td>
							<td class="bg-orange-400">
								<button class="p-4 bg-dark rounded-2 shadow-dark shadow-2xl text-white">
									<a
										href={createAffiliate(storeDataHandler.getAwinLink, product.store.id)}
										target="_blank">Link*</a
									>
								</button>
							</td>
						{/if}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<style>
	#table-container {
		-moz-box-shadow: inset 0 -10px 10px -10px rgba(17, 17, 17, 0.322);
		-webkit-box-shadow: inset 0 -10px 10px -10px rgba(17, 17, 17, 0.322);
		box-shadow: inset 0 -10px 20px -10px rgba(17, 17, 17, 0.322);
	}

	#table-container::-webkit-scrollbar {
		display: none;
	}

	table {
		border-collapse: collapse;
		width: 100%;
	}

	td {
		padding: 8px 12px;
		border: 1px solid #ddd;
	}
</style>
