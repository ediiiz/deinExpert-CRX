<script lang="ts">
	import ApiKey from './ApiKey.svelte';
	import { SubStatus, progressStore } from '../lib/storeDataHandler';
	import { type StoreDataHandler } from '../lib/storeDataHandler';
	import { fade } from 'svelte/transition';

	export let storeDataHandler: StoreDataHandler;
</script>

<div class="grid justify-center items-center text-center">
	{#if $progressStore.subStatus === SubStatus.PRODUCT_ALREADY_SEARCHED}
		<div
			transition:fade={{ duration: 500 }}
			class="p-4 grid justify-center items-center text-center bg-red rounded-2 my-4"
		>
			<p class="">
				In den letzten {storeDataHandler.waitTime} Minuten wurde dieser Artikel bereits von jemanden
				gesucht.
			</p>
			<a
				class="p-4 bg-dark rounded-2 shadow-dark shadow-2xl text-white"
				href="https://dein.Expert/product/{storeDataHandler.Webcode}"
				target="_blank">Link zum Suchergebniss</a
			>
		</div>
	{:else if $progressStore.subStatus === SubStatus.API_KEY_INVALID}
		<ApiKey {storeDataHandler} />
	{/if}
</div>
