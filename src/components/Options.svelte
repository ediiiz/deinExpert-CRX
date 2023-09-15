<script lang="ts">
  import { fade } from 'svelte/transition';
  import expertStores, { type ExpertStores } from '../lib/expertStore';
  import type { ProductData } from '../lib/types/getArticleData';
  import { writable } from 'svelte/store';

  type progessStatus = 'stopped' | 'running' | 'stoppedByUser';

  const productsStore = writable<ProductData[]>([]);
  const progressStore = writable({
    current: 0,
    total: 0,
    status: 'stopped' as progessStatus,
  });

  class StoreDataHandler {
    products: ProductData[] = [];
    private dataExpertStore: ExpertStores | null = null;
    private reactiveDataExpertStores: ExpertStores | null = null;
    private dataWebcodeMobile: string | undefined = undefined;
    private dataDesktop: string | undefined = undefined;
    private dataMobile: string | undefined = undefined;
    private fetchInterval: number = 200; // 200 milliseconds (5 requests per second)
    private abortController: AbortController | null = null;
    private isSearchCancelled: boolean = false;

    // constructor() {}

    async fetchData() {
      try {
        // Fetch dataExpertStore
        this.dataExpertStore = await expertStores().then((expertStores) => {
          const seenStoreIds = new Set<string>();
          return expertStores.filter((shop) => {
            if (shop.store.website && !seenStoreIds.has(shop.store.storeId)) {
              seenStoreIds.add(shop.store.storeId);
              return true;
            }
            return false;
          });
        });

        // Use the fetched data within the fetchData method
        console.log(this.dataExpertStore);

        // Extract values from the website's DOM
        this.dataWebcodeMobile = document
          .querySelector(
            '#__nuxt > main > div > div.lg\\:container.lg\\:mx-auto.flex.flex-col.gap-y-4 > div.grid.grid-cols-12.gap-4.lg\\:gap-12 > div.col-span-12.lg\\:col-span-9 > div'
          )
          ?.innerHTML?.replace('Web-Code: ', '');
        this.dataDesktop = document
          .querySelector(
            '#__nuxt > main > div > div.lg\\:container.lg\\:mx-auto.flex.flex-col.gap-y-4 > div.lg\\:grid.lg\\:grid-cols-12.lg\\:gap-12 > div.col-span-4.gap-y-4.flex.flex-col.article-pds-middle > a > div > div'
          )
          ?.getAttribute('data-bv-product-id')!;
        this.dataMobile = document.querySelector('#mobileVersion > div')?.getAttribute('data-bv-product-id')!;

        // Continue processing the data
        this.processData();
      } catch (error) {
        // Handle any errors that may occur during the fetch operation or DOM manipulation
        console.error('Error fetching data:', error);
      }
    }

    private processData() {
      // Perform further operations with the fetched data here
      console.log('Processing data:', this.dataExpertStore);

      // You can use the data here or call other methods as needed
      this.processStores();
    }

    private async processStores() {
      if (!this.dataExpertStore) return;

      progressStore.update((value) => ({
        ...value,
        current: 0,
        total: this.dataExpertStore!.length,
      }));

      for (let index = 0; index < this.dataExpertStore.length; index++) {
        if (this.isSearchCancelled) break; // Exit loop if search is cancelled

        const shop = this.dataExpertStore[index];
        const storeId = shop.store.storeId;

        // Use a Promise to introduce the delay
        await new Promise((resolve) => setTimeout(resolve, this.fetchInterval));

        if (this.isSearchCancelled) break; // Check again before fetching

        this.fetchProductInformation(storeId);

        progressStore.update((value) => ({
          ...value,
          current: value.current + 1,
        }));
      }
    }

    startNewSearch() {
      progressStore.update(() => ({
        status: 'running',
        current: 0,
        total: 0,
      }));
      this.isSearchCancelled = false;
      this.abortController = new AbortController();
      this.fetchData(); // Or whatever starting function you want
    }

    cancelSearch() {
      progressStore.update(() => ({
        status: 'stoppedByUser',
        current: 0,
        total: 0,
      }));
      this.isSearchCancelled = true;

      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
    }

    private async fetchProductInformation(storeId: string): Promise<ProductData | undefined> {
      this.abortController = new AbortController();
      try {
        // Construct the body for the fetch request
        const requestBody = JSON.stringify({
          articleId: this.dataDesktop || this.dataMobile,
          store: storeId,
          cacheLevel: 'MOST_RECENT',
        });

        // Make the fetch request to the website
        const response = await fetch('https://www.expert.de/shop/api/neo/internal-pub-service/getArticleData', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            accept: 'application/json',
          },
          body: requestBody,
        });

        // Check if the response status indicates success
        if (response.ok) {
          // Parse the response as ProductData type
          const productData: ProductData = await response.json();
          // Push to the products array and sort by price
          if (!productData.price?.gross) {
            return productData;
          }

          // replace the returned storeid with the passed storeid
          productData.onlineStore = storeId;

          this.products.push(productData);
          this.products.sort((a, b) => {
            if (a.price?.gross && b.price?.gross) {
              return a.price.gross - b.price.gross;
            }
            return 0;
          });

          productsStore.set(this.products);

          return productData;
        } else {
          // Handle non-successful response (e.g., status code other than 200)
          console.error(`Error fetching product information for storeId ${storeId}:`, response.statusText);
          return undefined;
        }
      } catch (error) {
        // Handle errors in fetching product information
        console.error(`Error fetching product information for storeId ${storeId}:`, error);
        return undefined;
      }
    }
  }

  // Create an instance of the class to start the data fetching and processing
  const storeDataHandler = new StoreDataHandler();
</script>

<div class="grid gap-2 place-content-stretch tw-container relative top-0.5 z-9999">
  {#if $progressStore.status !== 'running'}
    <button
      transition:fade={{ duration: 200 }}
      class="p-4 bg-dark rounded-t-2 shadow-dark shadow-2xl text-white"
      on:click={() => storeDataHandler.startNewSearch()}
    >
      Start
    </button>
  {:else}
    <button
      transition:fade={{ duration: 200 }}
      class="p-4 bg-dark rounded-t-2 shadow-dark shadow-2xl text-white"
      on:click={() => storeDataHandler.cancelSearch()}
    >
      Cancel
    </button>
  {/if}
</div>
{#if $progressStore.status === 'running' && $progressStore.total !== 0}
  <div class="relative -top-0.5 z-9999">
    <div class="h-1 w-full bg-neutral-200 dark:bg-neutral-600">
      <div class="h-1 bg-primary" style="width: {($progressStore.current / $progressStore.total) * 100}%" />
    </div>
  </div>
{/if}

{#if $progressStore.status !== 'stopped'}
  <div id="table-container" class="h-80% overflow-auto grid grid-cols-1 shadow-inset rounded-b-2">
    <table>
      <thead>
        <tr>
          <th class="sticky top-0 bg-white z-10">Price (Gross)</th>
          <th class="sticky top-0 bg-white z-10">Online Store</th>
          <th class="sticky top-0 bg-white z-10">Stock</th>
          <!-- Add other headers as needed -->
        </tr>
      </thead>
      <tbody>
        {#each $productsStore as product (product.onlineStore)}
          <tr transition:fade={{ duration: 200 }}>
            <td>{product.price?.gross || 'N/A'}</td>
            <td>{product.onlineStore}</td>
            <td>{product.stock}</td>
            <!-- Add other columns as needed -->
          </tr>
        {/each}
        {#if false}
          <tr class="s-ZclnAN89mjA8"
            ><td class="s-ZclnAN89mjA8">519</td> <td class="s-ZclnAN89mjA8">31826557</td>
            <td class="s-ZclnAN89mjA8">0</td>
          </tr><tr class="s-ZclnAN89mjA8"
            ><td class="s-ZclnAN89mjA8">519</td> <td class="s-ZclnAN89mjA8">1907106</td>
            <td class="s-ZclnAN89mjA8">1</td>
          </tr><tr class="s-ZclnAN89mjA8"
            ><td class="s-ZclnAN89mjA8">519</td> <td class="s-ZclnAN89mjA8">1907035</td>
            <td class="s-ZclnAN89mjA8">0</td>
          </tr><tr class="s-ZclnAN89mjA8"
            ><td class="s-ZclnAN89mjA8">519</td> <td class="s-ZclnAN89mjA8">1907554</td>
            <td class="s-ZclnAN89mjA8">1</td>
          </tr><tr class="s-ZclnAN89mjA8"
            ><td class="s-ZclnAN89mjA8">519</td> <td class="s-ZclnAN89mjA8">31826556</td>
            <td class="s-ZclnAN89mjA8">0</td>
          </tr><tr class="s-ZclnAN89mjA8"
            ><td class="s-ZclnAN89mjA8">519</td> <td class="s-ZclnAN89mjA8">1907398</td>
            <td class="s-ZclnAN89mjA8">1</td>
          </tr><tr class="s-ZclnAN89mjA8"
            ><td class="s-ZclnAN89mjA8">554.98</td> <td class="s-ZclnAN89mjA8">29938844</td>
            <td class="s-ZclnAN89mjA8">1</td>
          </tr><tr class="s-ZclnAN89mjA8"
            ><td class="s-ZclnAN89mjA8">554.98</td> <td class="s-ZclnAN89mjA8">29703322</td>
            <td class="s-ZclnAN89mjA8">3</td>
          </tr><tr class="s-ZclnAN89mjA8"
            ><td class="s-ZclnAN89mjA8">554.98</td> <td class="s-ZclnAN89mjA8">31826547</td>
            <td class="s-ZclnAN89mjA8">1</td>
          </tr><tr class="s-ZclnAN89mjA8"
            ><td class="s-ZclnAN89mjA8">562.98</td> <td class="s-ZclnAN89mjA8">31826550</td>
            <td class="s-ZclnAN89mjA8">2</td>
          </tr><tr class="s-ZclnAN89mjA8"
            ><td class="s-ZclnAN89mjA8">588</td> <td class="s-ZclnAN89mjA8">35880019</td>
            <td class="s-ZclnAN89mjA8">4</td>
          </tr><tr class="s-ZclnAN89mjA8"
            ><td class="s-ZclnAN89mjA8">598.99</td> <td class="s-ZclnAN89mjA8">1907185</td>
            <td class="s-ZclnAN89mjA8">0</td>
          </tr><tr class="s-ZclnAN89mjA8"
            ><td class="s-ZclnAN89mjA8">598.99</td> <td class="s-ZclnAN89mjA8">1906930</td>
            <td class="s-ZclnAN89mjA8">0</td>
          </tr><tr class="s-ZclnAN89mjA8"
            ><td class="s-ZclnAN89mjA8">598.99</td> <td class="s-ZclnAN89mjA8">1907585</td>
            <td class="s-ZclnAN89mjA8">1</td>
          </tr>
        {/if}
      </tbody>
    </table>
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
