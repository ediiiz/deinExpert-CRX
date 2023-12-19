<script lang="ts">
  import { fade } from 'svelte/transition';

  import { StoreDataHandler, productsStore, progressStore } from '../lib/storeDataHandler';
  import { onDestroy } from 'svelte';
  import { Toaster, toast } from 'svelte-sonner';

  let awinLink: string | void = '';

  const storeDataHandler = new StoreDataHandler();

  async function init() {
    toast.info('Orange markierte Einträge sind Aussteller!');
    awinLink = await storeDataHandler.fetchCashbackLink();
    if (awinLink) {
      storeDataHandler.startNewSearch();
    }
  }

  // create a promise based sleep function
  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function createAffiliate(awinlink: string | void, branchId: string): string {
    const url = window.location.href.split('?');
    return `${awinlink}&p=` + encodeURIComponent(`${url[0]}?branch_id=e_${branchId}`);
  }

  onDestroy(() => {
    storeDataHandler.ngOnDestroy();
  });

  progressStore.subscribe(({ status }) => {
    switch (status) {
      case 'error-articleId':
        toast.error('Daten konnten nicht geladen');
        break;
      case 'finished':
        toast.success('Upload erfolgreich');
        break;
      case 'error-searchTooFast':
        toast.warning('Search too fast');
        break;
      // Add other cases as needed
    }
  });
</script>

<Toaster richColors position={'top-right'} />

<div class="flex flex-col h-100% max-h-400px place-content-start">
  <div class="grid gap-2 place-content-stretch tw-container relative top-0.5 z-11">
    {#if $progressStore.status === 'processing'}
      <button
        transition:fade={{ duration: 200 }}
        class="p-4 bg-gray-400 rounded-t-2 shadow-dark shadow-2xl text-white"
        on:click={() => storeDataHandler.cancelSearch()}
      >
        Stop!
      </button>
    {:else}
      <button
        transition:fade={{ duration: 200 }}
        class="p-4 bg-gray-400 rounded-2 shadow-dark shadow-2xl text-white animate-count-infinite animate-pulse"
        on:click={async () => init()}
      >
        <div class="h-full">Suche starten!</div>
      </button>
    {/if}
  </div>
  {#if $progressStore.status === 'processing' && $progressStore.total !== 0}
    <div class="relative -top-0.5 z-11">
      <div class="h-1 w-full bg-neutral-200 dark:bg-neutral-600">
        <div class="h-1 bg-primary" style="width: {($progressStore.current / $progressStore.total) * 100}%" />
      </div>
    </div>
  {/if}

  {#if $progressStore.status === 'ready' || $progressStore.status === 'error-articleId' || $progressStore.status === 'error-searchTooFast'}
    <div class="grid justify-center items-center text-center">
      {#if $progressStore.status === 'error-searchTooFast'}
        <div
          transition:fade={{ duration: 500 }}
          class="p-4 grid justify-center items-center text-center bg-red rounded-2 my-4"
        >
          <p class="pb-4">In den letzten 10 Minuten wurde dieser Artikel bereits von jemanden gesucht.</p>
          <a
            class="p-4 bg-dark rounded-2 shadow-dark shadow-2xl text-white"
            href="https://dein.Expert/product/{storeDataHandler.Webcode}"
            target="_blank">Link zum Suchergebniss</a
          >
        </div>
      {:else}
        <div
          transition:fade={{ duration: 500 }}
          class="p-4 grid justify-center items-center text-center text-white bg-gray-400 rounded-2 my-4"
        >
          <p class="pb-4">Sobald die Suche abgeschlossen ist kannst du die Preise hier finden:</p>
          <a
            class="p-4 bg-gray-400 rounded-2 shadow-dark shadow-2xl text-white border-white border-2"
            href="https://dein.Expert/product/{storeDataHandler.Webcode}"
            target="_blank">Link zum Produkt</a
          >
        </div>
      {/if}
    </div>
  {:else}
    <div id="table-container" class="h-80% overflow-auto grid grid-cols-1 shadow-inset rounded-b-2">
      <table>
        <thead>
          <tr>
            <th class="sticky top-0 bg-white z-10">Preis inkl. VSK</th>
            <th class="sticky top-0 bg-white z-10">Vsk.</th>
            <th class="sticky top-0 bg-white z-10">Markt</th>
          </tr>
        </thead>
        <tbody>
          {#if $progressStore.status !== 'restarted'}
            {#each $productsStore as product (product.onlineStore)}
              <tr class="text-center" transition:fade={{ duration: 200 }}>
                {#if product.itemOnDisplay === false}
                  <td>{product.priceInclShipping || 'N/A'}€</td>
                  <td>{product.onlineShipment[0].price.gross}€</td>
                  <td
                    ><button class="p-4 bg-dark rounded-2 shadow-dark shadow-2xl text-white"
                      ><a href={createAffiliate(awinLink, product.onlineStore)} target="_blank">Link</a></button
                    ></td
                  >
                {:else}
                  <td class="bg-primary">{product.priceInclShipping || 'N/A'}€ inkl. Vsk.</td>
                  <td class="bg-primary">{product.onlineShipment[0].price.gross}€</td>
                  <td class="bg-primary"
                    ><button class="p-4 bg-dark rounded-2 shadow-dark shadow-2xl text-white"
                      ><a href={createAffiliate(awinLink, product.onlineStore)} target="_blank">Link</a></button
                    >
                  </td>
                {/if}
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .tw-container > * {
    grid-area: 1 / 1;
  }
  #table-container {
    -moz-box-shadow: inset 0 -10px 10px -10px rgba(17, 17, 17, 0.322);
    -webkit-box-shadow: inset 0 -10px 10px -10px rgba(17, 17, 17, 0.322);
    box-shadow: inset 0 -10px 20px -10px rgba(17, 17, 17, 0.322);
  }
  th,
  td {
    padding: 8px 12px;
    border: 1px solid #ddd;
  }

  th {
    background-color: #f2f2f2;
  }
</style>
