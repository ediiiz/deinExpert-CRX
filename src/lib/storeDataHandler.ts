import type { ProductData } from '../lib/types/getArticleData';
import expertStores, { type ExpertStores } from '../lib/expertStore';
import { writable } from 'svelte/store';
import { getLinkomatAwin } from './cashback/linkomat';

const productApi = 'https://dein.expert/api/product' as const;

import type { product } from './types/deinExpertApi';

type progessStatus = 'ready' | 'restarted' | 'finished' | 'processing' | 'cancelled' | 'error-articleId';

export const productsStore = writable<ProductData[]>([]);
export const progressStore = writable({
  current: 0,
  total: 0,
  status: 'ready' as progessStatus,
});

export class StoreDataHandler {
  products: ProductData[] = [];
  private dataExpertStore: ExpertStores | null = null;
  private reactiveDataExpertStores: ExpertStores | null = null;
  private dataWebcode: string | undefined = undefined;
  private dataDesktop: string | undefined = undefined;
  private dataMobile: string | undefined = undefined;
  private fetchInterval: number = 200; // 200 milliseconds (5 requests per second)
  private abortController: AbortController | null = null;
  private isSearchCancelled: boolean = false;
  private unsubscribe: () => void;

  constructor() {
    progressStore.update(value => ({
      ...value,
      status: 'ready'
    }));
    // Assuming this class has a constructor, initialize the subscription here
    this.unsubscribe = progressStore.subscribe((value) => {
      if (value.status === 'finished') {
        this.uploadData();
      }
    });
  }

  public ngOnDestroy() { // Or a similar destructor method
    this.unsubscribe();
  }

  public get Webcode(): string {
    this.dataWebcode = document
      .querySelector(
        '#__nuxt > main > div > div.lg\\:container.lg\\:mx-auto.flex.flex-col.gap-y-4 > div.grid.grid-cols-12.gap-4.lg\\:gap-12 > div.col-span-12.lg\\:col-span-9 > div'
      )
      ?.innerHTML?.replace('Web-Code: ', '');
    return this.dataWebcode!;
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

      // Extract values from the website's DOM
      this.dataDesktop = document
        .querySelector(
          '#__nuxt > main > div > div.lg\\:container.lg\\:mx-auto.flex.flex-col.gap-y-4 > div.lg\\:grid.lg\\:grid-cols-12.lg\\:gap-12 > div.col-span-4.gap-y-4.flex.flex-col.article-pds-middle > a > div > div'
        )
        ?.getAttribute('data-bv-product-id')!;
      this.dataMobile = document.querySelector('#mobileVersion > div')?.getAttribute('data-bv-product-id')!;

      // Continue processing the data
      if (this.dataDesktop || this.dataMobile) {
        this.processData();
      } else {
        console.error('No product ID found on the website');
        // update store to show error
        progressStore.update(value => ({
          ...value,
          status: 'error-articleId',
        }));
      }


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
      status: 'processing'
    }));

    let wasCancelled = false;

    for (let index = 0; index < this.dataExpertStore.length; index++) {
      if (this.isSearchCancelled) {
        wasCancelled = true;
        break;
      }
      const shop = this.dataExpertStore[index];
      const storeId = shop.store.storeId;

      // Use a Promise to introduce the delay
      await new Promise((resolve) => setTimeout(resolve, this.fetchInterval));

      if (this.isSearchCancelled) {
        wasCancelled = true;
        break;
      }

      this.fetchProductInformation(storeId, shop.store.name);

      progressStore.update((value) => ({
        ...value,
        current: value.current + 1,
      }));
    }
    progressStore.update(value => ({
      ...value,
      status: wasCancelled ? 'cancelled' : 'finished'
    }));
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
      status: 'processing',
      current: 0,
      total: 0,
    }));
  }

  cancelSearch() {
    progressStore.update(() => ({
      status: 'cancelled',
      current: 0,
      total: 0,
    }));

    this.isSearchCancelled = true;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  public async fetchCashbackLink(): Promise<string | void> {
    const awinLink = await getLinkomatAwin();
    if (awinLink) {
      return awinLink;
    }
  }

  private async fetchProductInformation(storeId: string, storeName: string): Promise<ProductData | undefined> {
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
      if (!productData.price?.gross || productData.onlineButtonAction !== 'ORDER') {
        return productData;
      }
      // replace the returned storeid with the passed storeid
      console.log(productData.onlineButtonAction);

      productData.showStoreName = storeName;
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

  public async uploadData() {
    const aggregatedProduct: product = {
      webcode: this.Webcode,
      url: window.location.href.split('?')[0],
      price: []
    };

    this.products.forEach((product) => {
      aggregatedProduct.price.push({
        price: product.priceInclShipping!,
        branchName: product.showStoreName!,
        branchId: parseInt(product.onlineStore),
      });
    });

    if (aggregatedProduct.price.length === 0) return;

    const requestBody = JSON.stringify(aggregatedProduct);
    const response = await fetch(productApi, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: requestBody,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
  }

}
