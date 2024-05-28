<script lang="ts">
	import { onDestroy } from 'svelte';
	import {
		ProgressStatus,
		StoreDataHandler,
		SubStatus,
		productsStore,
		progressStore
	} from '../lib/storeDataHandler';
	import { Toaster, toast } from 'svelte-sonner';
	import ControlButton from './ControlButton.svelte';
	import ProgressBar from './ProgressBar.svelte';
	import MessageDisplay from './MessageDisplay.svelte';
	import ProductTable from './ProductTable.svelte';
	import type { ProductDataSchema } from '../lib/schema';
	import ErrorDisplay from './ErrorDisplay.svelte';

	const storeDataHandler = new StoreDataHandler();

	async function init() {
		storeDataHandler.startNewSearch();
	}

	onDestroy(() => {
		storeDataHandler.ngOnDestroy();
	});

	progressStore.subscribe(({ status, subStatus }) => {
		if (status === ProgressStatus.ERROR) {
			switch (subStatus) {
				case SubStatus.API_KEY_MISSING:
					toast.error('API Key fehlt!');
					break;
				case SubStatus.API_KEY_INVALID:
					toast.error('API Key ist ungültig!');
					break;
				case SubStatus.PRODUCT_ALREADY_SEARCHED:
					toast.error('Produkt wurde bereits in den letzten 60 Minuten gesucht!');
					break;
				case SubStatus.NO_PRODUCT_ID:
					toast.error('Keine Produkt-ID gefunden!');
					break;
				case SubStatus.ERROR_FETCHING_STORES:
					toast.error('Fehler beim Abrufen der Geschäfte!');
					break;
				case SubStatus.ERROR_UPLOADING_DATA:
					toast.error('Fehler beim Hochladen der Daten!');
					break;
				default:
					toast.error('Ein unbekannter Fehler ist aufgetreten!');
					break;
			}
		} else if (status === ProgressStatus.UPLOADED) {
			toast.success('Preis hochgeladen!');
		} else if (status === ProgressStatus.CANCELLED) {
			toast.info('Suche abgebrochen!');
		} else if (status === ProgressStatus.UPLOADING) {
			toast.info('Daten werden hochgeladen...');
		}
	});

	function createAffiliate(awinlink: string | void, selectedMarket: string): string {
		if (!awinlink) {
			return `https://www.expert.de/shop/suche?q=${storeDataHandler.Webcode}&branch_id=e_${selectedMarket}`;
		}
		return `${awinlink}&ued=${encodeURIComponent(`https://www.expert.de/shop/suche?q=${storeDataHandler.Webcode}&branch_id=e_${selectedMarket}`)}`;
	}

	function calculatePriceInclShipping(productData: ProductDataSchema) {
		return (
			productData.price.gross +
			(productData.onlineShipment ? productData.onlineShipment[0].price.gross : 0)
		);
	}

	$: console.log("DEBUGSTATE", $progressStore.status);
</script>

<Toaster richColors position="top-right" />

<div>
	<div class="relative top-1 z-100 px-2">
		{#if $progressStore.status === ProgressStatus.PROCESSING}
			<ProgressBar />
		{:else}
			<div class="h-1"></div>
		{/if}
	</div>
	<div class="flex flex-col h-full max-h-400px p-2 gap-2 tw-container">
		<ControlButton {init} {storeDataHandler} />
		{#if $progressStore.status === ProgressStatus.READY}
			<MessageDisplay {storeDataHandler} />
		{:else if $progressStore.status === ProgressStatus.ERROR}
			<ErrorDisplay {storeDataHandler} />
		{:else if $progressStore.status === ProgressStatus.PROCESSING || $progressStore.status === ProgressStatus.UPLOADED || $progressStore.status === ProgressStatus.CANCELLED || $progressStore.status === ProgressStatus.UPLOADING}
			<ProductTable {storeDataHandler} {createAffiliate} {calculatePriceInclShipping} />
		{/if}
	</div>
</div>

<style>
	.tw-container > * {
		grid-area: 1 / 1;
	}
</style>
