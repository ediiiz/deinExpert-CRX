import type { ProductData } from '../lib/types/getArticleData';
import expertStores, { type ExpertStores } from '../lib/expertStore';
import { writable } from 'svelte/store';

type progessStatus = 'stopped' | 'running' | 'stoppedByUser' | 'restarted';

export const productsStore = writable<ProductData[]>([]);
export const progressStore = writable({
  current: 0,
  total: 0,
  status: 'stopped' as progessStatus,
});

export class StoreDataHandler {
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

  public get Webcode(): string {
    this.dataWebcodeMobile = document
      .querySelector(
        '#__nuxt > main > div > div.lg\\:container.lg\\:mx-auto.flex.flex-col.gap-y-4 > div.grid.grid-cols-12.gap-4.lg\\:gap-12 > div.col-span-12.lg\\:col-span-9 > div'
      )
      ?.innerHTML?.replace('Web-Code: ', '');
    return this.dataWebcodeMobile!;
  }

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
      status: 'restarted',
      current: 0,
      total: 0,
    }));
    // Reset the products array
    this.products = [];
    productsStore.set(this.products);
    // set progesStore status to restarted
    this.isSearchCancelled = false;
    this.abortController = new AbortController();
    this.fetchData();
    progressStore.update(() => ({
      status: 'running',
      current: 0,
      total: 0,
    }));
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
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Parse the response as ProductData type
      const productData: ProductData = await response.json();
      // Push to the products array and sort by price
      if (!productData.price?.gross) {
        return productData;
      }

      // replace the returned storeid with the passed storeid
      productData.onlineStore = storeId;
      productData.priceInclShipping = productData.price.gross + productData.onlineShipment[0]?.price?.gross;
      if (!productData.priceInclShipping) return productData;

      this.products.push(productData);
      this.products.sort((a, b) => {
        if (a.priceInclShipping && b.priceInclShipping) {
          return a.priceInclShipping - b.priceInclShipping;
        }
        return 0;
      });

      productsStore.set(this.products);

      return productData;
    } catch (error) {
      // Handle errors in fetching product information
      console.error(`Error fetching product information for storeId ${storeId}:`, error);
      return undefined;
    }
  }
}
