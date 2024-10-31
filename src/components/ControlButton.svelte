<script lang="ts">
	import {
		ProgressStatus,
		StoreDataHandler,
		SubStatus,
		progressStore
	} from '../lib/storeDataHandler';

	export let init;
	export let storeDataHandler: StoreDataHandler;

	function restart() {
		progressStore.update((store) => ({
			...store,
			status: ProgressStatus.READY
		}));
	}
</script>

{#if $progressStore.status === ProgressStatus.PROCESSING}
	<button
		class="bg-dark z-10 p-4 text-white rounded-2"
		on:click={() => storeDataHandler.cancelSearch()}
	>
		Stop!
	</button>
{:else if $progressStore.status === ProgressStatus.LOADING}
	<button disabled class="bg-dark z-10 p-4 text-white rounded-2 bg-op-50">
		Daten werden geladen...
	</button>
{:else if $progressStore.status === ProgressStatus.UPLOADING}
	<button disabled class="bg-dark z-10 p-4 text-white rounded-2 bg-op-50">
		Daten werden hochgeladen...
	</button>
{:else if $progressStore.status === ProgressStatus.UPLOADED || $progressStore.status === ProgressStatus.CANCELLED || ($progressStore.subStatus === SubStatus.ERROR_UPLOADING_DATA && $progressStore.status == ProgressStatus.ERROR)}
	<button class="bg-dark z-10 p-4 text-white rounded-2 animate-pulse" on:click={restart}>
		Suche erneut starten!
	</button>
{:else if $progressStore.status === ProgressStatus.READY}
	<button class="bg-dark z-10 p-4 text-white rounded-2 animate-pulse" on:click={init}>
		Suche starten!
	</button>
{/if}
