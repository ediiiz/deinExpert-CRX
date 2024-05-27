<script lang="ts">
	import { ProgressStatus, progressStore } from '../lib/storeDataHandler';

	export let init;
	export let storeDataHandler;
</script>

{#if $progressStore.status === ProgressStatus.PROCESSING}
	<button
		class="bg-dark z-10 p-4 text-white rounded-2"
		on:click={() => storeDataHandler.cancelSearch()}
	>
		Stop!
	</button>
{:else if $progressStore.status === ProgressStatus.LOADING}
	<button disabled class="bg-dark z-10 p-4 text-white rounded-2" on:click={init}>
		Daten werden geladen...
	</button>
{:else}
	<button class="bg-dark z-10 p-4 text-white rounded-2 animate-pulse" on:click={init}>
		Suche starten!
	</button>
{/if}
