<script lang="ts">
  import { fade } from 'svelte/transition';

  import { StoreDataHandler, productsStore, progressStore } from '../lib/storeDataHandler';
  import { onDestroy } from 'svelte';

  let awinLink: string | void = '';

  const storeDataHandler = new StoreDataHandler();

  async function init() {
    awinLink = await storeDataHandler.fetchCashbackLink();
    if (awinLink) {
      storeDataHandler.startNewSearch();
    }
  }

  function createAffiliate(awinlink: string | void, branchId: string): string {
    const url = window.location.href.split('?');
    return `${awinlink}&p=` + encodeURIComponent(`${url[0]}?branch_id=e_${branchId}`);
  }

  onDestroy(() => {
    storeDataHandler.ngOnDestroy();
  });
</script>

{#if $progressStore.status === 'error-articleId'}
  <div
    transition:fade={{ duration: 500 }}
    class="p-4 grid justify-center items-center text-center bg-red rounded-2 mb-2"
  >
    <p>Etwas ist schief gelaufen! Artikel ID nicht gefunden.</p>
  </div>
{/if}

<div class="grid gap-2 place-content-stretch tw-container relative top-0.5 z-9999">
  {#if $progressStore.status === 'processing'}
    <button
      transition:fade={{ duration: 200 }}
      class="p-4 bg-dark rounded-t-2 shadow-dark shadow-2xl text-white"
      on:click={() => storeDataHandler.cancelSearch()}
    >
      Cancel
    </button>
  {:else}
    <button
      transition:fade={{ duration: 200 }}
      class="p-4 bg-dark rounded-2 shadow-dark shadow-2xl text-white"
      on:click={async () => init()}
    >
      <div class="h-full animate-bounce animate-count-infinite animate-duration-1s">Start</div>
    </button>
  {/if}
</div>
{#if $progressStore.status === 'processing' && $progressStore.total !== 0}
  <div class="relative -top-0.5 z-9999">
    <div class="h-1 w-full bg-neutral-200 dark:bg-neutral-600">
      <div class="h-1 bg-primary" style="width: {($progressStore.current / $progressStore.total) * 100}%" />
    </div>
  </div>
{/if}

{#if $progressStore.status !== 'ready'}
  <div id="table-container" class="h-80% overflow-auto grid grid-cols-1 shadow-inset rounded-b-2">
    <table>
      <thead>
        <tr>
          <th class="sticky top-0 bg-white z-10">Preis</th>
          <th class="sticky top-0 bg-white z-10">Vsk.</th>
          <th class="sticky top-0 bg-white z-10">Markt</th>
        </tr>
      </thead>
      <tbody>
        {#if $progressStore.status !== 'restarted'}
          {#each $productsStore as product (product.onlineStore)}
            <tr transition:fade={{ duration: 200 }}>
              {#if product.itemOnDisplay === false}
                <td>{product.priceInclShipping || 'N/A'}€ inkl. Vsk.</td>
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
{:else}
  <div class="pt-4 grid justify-center items-center text-center">
    <p class="pb-4">Drücke einfach auf Start um die Suche zu starten!</p>
    <p class="bg-primary rounded-2 p-4">Orange markierte Einträge sind {@html '<strong>Aussteller</strong>'}!</p>
    <p class="pt-4">Sobald die Suche abgeschlossen ist kannst du die Preise hier finden:</p>
    <button class="p-4 bg-dark rounded-2 shadow-dark shadow-2xl text-white"
      ><a href="https://dein.Expert/product/{storeDataHandler.Webcode}" target="_blank">Link zum Produkt</a>
    </button>
  </div>
{/if}

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
