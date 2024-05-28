<script lang="ts">
	export let storeDataHandler;
	import { fade } from 'svelte/transition';
</script>

<div class="flex flex-col gap-2">
	<div
		transition:fade={{ duration: 500 }}
		class="p-4 grid justify-center items-center text-center text-white bg-dark rounded-2"
	>
		<p class="pb-4">Sobald die Suche abgeschlossen ist, kannst du die Preise hier finden:</p>
		<a
			class="p-4 bg-dark rounded-2 shadow-dark shadow-2xl text-white border-white border-2"
			href="https://dein.Expert/product/{storeDataHandler.Webcode}"
			target="_blank">Link zum Produkt</a
		>
	</div>
	<div
		transition:fade={{ duration: 500 }}
		class="p-4 grid justify-center items-center text-center text-white bg-dark rounded-2"
	>
		<p class="">Links mit * sind Affiliate Links! Danke!❤️</p>
	</div>
</div>
