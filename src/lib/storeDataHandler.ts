import { writable } from 'svelte/store';
import { cashbackSchema, productPriceSchema, productSchema, storeSchema, type ProductDataSchema, type ProductSchema, type StoreSchema, } from './schema';

const DEINEXPERT_HOST: string = 'https://dein.expert'
const GET_EXPERT_ARTICLE_URL: string = 'https://production.brntgs.expert.de/api/neo/internal-pub-service/getArticleData'
const DEINEXPERT_API_URL: string = `${DEINEXPERT_HOST}/api`
const EXPERT_STORES: string = "https://shop.brntgs.expert.de/api/storeFinder?maxResults=1000"

export enum ProgressStatus {
  INITIAL = 'initial',
  READY = 'ready',
  RESTARTED = 'restarted',
  FINISHED = 'finished',
  PROCESSING = 'processing',
  CANCELLED = 'cancelled',
  ERROR = 'error',
  LOADING = 'loading',
  UPLOADED = 'uploaded',
}

export enum SubStatus {
  NONE = 'none',
  API_KEY_MISSING = 'api_key_missing',
  API_KEY_INVALID = 'api_key_invalid',
  PRODUCT_ALREADY_SEARCHED = 'product_already_searched',
  NO_PRODUCT_ID = 'no_product_id',
  ERROR_FETCHING_STORES = 'error_fetching_stores',
  ERROR_UPLOADING_DATA = 'error_uploading_data',
  SUCCESS_SEARCH_COMPLETED = 'success_search_completed',
  SUCCESS_UPLOADED = 'success_uploaded',
}

export const productsStore = writable<ProductDataSchema[]>([]);

export const progressStore = writable({
  current: 0,
  total: 0,
  status: ProgressStatus.INITIAL,
  subStatus: SubStatus.NONE,
  message: '',
});



export class StoreDataHandler {
  products: ProductDataSchema[] = [];
  private apiKey: string | undefined = undefined;
  private dataExpertStore: StoreSchema | null = null;
  private fetchInterval: number = 200; // 200 milliseconds (5 requests per second)
  private abortController: AbortController | null = null;
  private isSearchCancelled: boolean = false;
  private awinLink: string | void = undefined;
  private waitMinutes: number = 60;
  private productInfo: ProductSchema | undefined = undefined;
  private unsubscribe: () => void;

  constructor() {
    progressStore.update(value => ({
      ...value,
      status: ProgressStatus.READY,
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

  async expertStores() {
    const data = storeSchema.safeParse(await fetch(EXPERT_STORES).then((response) => response.json()).catch(() => undefined))
    return data
  }

  get getApiKeyFromLocalStorage() {
    const apiKey = localStorage.getItem('apiKey');
    if (apiKey) {
      this.apiKey = apiKey;
    }
    return this.apiKey;
  }

  setApiKeyToLocalStorage(apiKey: string) {
    localStorage.setItem('apiKey', apiKey);
  }

  async checkApiKey() {
    this.getApiKeyFromLocalStorage
    const test = await this.fetchCashbackLink()
    return test
  }

  public async checkIfProductAlreadySearched(): Promise<boolean> {
    try {
      const response = await fetch(`${DEINEXPERT_API_URL}/product/${this.Webcode}?apikey=${this.apiKey}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (!data.success) {
        return false;
      }

      const lastSearchDate = new Date(data.product.priceHistory[0].date);
      const now = new Date();

      // Calculate the difference in minutes between now and the last search date
      const diffMinutes = (now.getTime() - lastSearchDate.getTime()) / (1000 * 60);

      return diffMinutes < this.waitMinutes;
    } catch (error) {
      console.error('Error checking if product was already searched:', error);
      return false;
    }
  }

  get waitTime(): number {
    return this.waitMinutes;
  }


  public get Webcode(): string | void {
    const regex = /\/(\d+)-/;
    const match = window.location.href.match(regex);
    return match ? match[1] : undefined;
  }

  async fetchData() {
    try {
      progressStore.update(value => ({
        ...value,
        status: ProgressStatus.LOADING,
        subStatus: SubStatus.NONE,
      }));

      if (!(await this.checkApiKey())) {
        progressStore.update(value => ({
          ...value,
          status: ProgressStatus.ERROR,
          subStatus: SubStatus.API_KEY_INVALID,
          message: 'API Key fehlt oder falsch!',
        }));
        return;
      }

      const alreadySearched = await this.checkIfProductAlreadySearched();
      if (alreadySearched) {
        progressStore.update(value => ({
          ...value,
          status: ProgressStatus.ERROR,
          subStatus: SubStatus.PRODUCT_ALREADY_SEARCHED,
          message: 'Product was already searched in the last 60 minutes',
        }));
        return;
      }


      // Fetch dataExpertStore
      const expertStores = await this.expertStores();
      if (!expertStores.success) {
        progressStore.update(value => ({
          ...value,
          status: ProgressStatus.ERROR,
          subStatus: SubStatus.ERROR_FETCHING_STORES,
          message: 'Error fetching stores',
        }));
        return;
      }

      this.dataExpertStore = expertStores.data;

      if (!this.Webcode) {
        progressStore.update(value => ({
          ...value,
          status: ProgressStatus.ERROR,
          subStatus: SubStatus.NO_PRODUCT_ID,
          message: 'No webcode found on the website',
        }));
        return;
      }

      // Extract values from the website's DOM
      const productInfo = await this.getProductInfo(this.Webcode);
      if (!productInfo.success) {
        progressStore.update(value => ({
          ...value,
          status: ProgressStatus.ERROR,
          subStatus: SubStatus.NO_PRODUCT_ID,
          message: 'No product ID found on the website',
        }));
        return;
      }

      // Continue processing the data
      this.processStores(productInfo.data);


    } catch (error) {
      console.error('Error fetching data:', error);
      progressStore.update(value => ({
        ...value,
        status: ProgressStatus.ERROR,
        subStatus: SubStatus.NONE,
        message: 'An error occurred while fetching data',
      }));
    }
  }

  private getProductInfoUrl(webcode: string) {
    return `https://shop.brntgs.expert.de/api/search/article/webcode/${webcode}`
  }

  private async getProductInfo(webcode: string) {

    const productInfo = productSchema.safeParse(await fetch(this.getProductInfoUrl(webcode))
      .then((response) => response.json()));

    this.productInfo = productInfo.data;
    return productInfo;
  }

  get getweb() {
    return this.productInfo;
  }

  private async processStores(productInfo: ProductSchema) {
    progressStore.update(value => ({
      ...value,
      status: ProgressStatus.PROCESSING,
      subStatus: SubStatus.NONE,
      current: 0,
      total: this.dataExpertStore!.length,
    }));

    if (!this.dataExpertStore) return;

    let wasCancelled = false;

    for (const store of this.dataExpertStore) {
      if (this.isSearchCancelled) {
        wasCancelled = true;
        break;
      }

      // Use a Promise to introduce the delay
      await new Promise((resolve) => setTimeout(resolve, this.fetchInterval));

      if (this.isSearchCancelled) {
        wasCancelled = true;
        break;
      }

      this.fetchProductInformation(productInfo, store.store.storeId, store.store.name);

      progressStore.update((value) => ({
        ...value,
        current: value.current + 1,
      }));

    }

    progressStore.update(value => ({
      ...value,
      status: wasCancelled ? ProgressStatus.CANCELLED : ProgressStatus.FINISHED,
      subStatus: wasCancelled ? SubStatus.NONE : SubStatus.SUCCESS_SEARCH_COMPLETED,
    }));
  }

  startNewSearch() {
    progressStore.update(() => ({
      status: ProgressStatus.RESTARTED,
      subStatus: SubStatus.NONE,
      current: 0,
      total: 0,
      message: '',
    }));
    this.products = [];
    productsStore.set(this.products);
    this.isSearchCancelled = false;
    this.abortController = new AbortController();
    this.fetchData();
  }

  cancelSearch() {
    progressStore.update(() => ({
      status: ProgressStatus.CANCELLED,
      subStatus: SubStatus.NONE,
      current: 0,
      total: 0,
      message: '',
    }));

    this.isSearchCancelled = true;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async fetchCashbackLink() {
    try {
      const response = await fetch(`${DEINEXPERT_API_URL}/affiliate?apikey=${this.apiKey}`);
      if (!response.ok) {
        return false;
      }

      const cashbackLink = cashbackSchema.safeParse(await response.json().catch(() => undefined));
      if (!cashbackLink.success) {
        return false;
      }
      this.awinLink = cashbackLink.data.url;
      return true;
    } catch (error) {
      return false;
    }
  }

  public get getAwinLink(): string | void {
    return this.awinLink;
  }

  private async fetchProductInformation(productInfo: ProductSchema, storeId: string, storeName: string): Promise<ProductDataSchema | undefined> {
    this.abortController = new AbortController();
    try {
      // Construct the body for the fetch request
      const requestBody = JSON.stringify({
        articleId: productInfo.article.articleId,
        store: storeId,
        cacheLevel: 'MOST_RECENT',
      });

      // Make the fetch request to the website
      const response = await fetch(GET_EXPERT_ARTICLE_URL, {
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
      const productPriceData = productPriceSchema.safeParse(await response.json().catch(() => undefined));
      // Push to the products array and sort by price
      if (!productPriceData.success) return;
      // replace the returned storeid with the passed storeid

      const productData: ProductDataSchema = {
        store: {
          name: storeName,
          id: storeId,
        },
        ...productPriceData.data,
      }

      this.products.push(productData);

      function calculatePriceInclShipping(productData: ProductDataSchema) {
        return productData.price.gross + (productData.onlineShipment ? productData.onlineShipment[0].price.gross : 0);
      };

      this.products.sort((a, b) => {
        // Calculate and assign priceInclShipping for each product
        const priceA = calculatePriceInclShipping(a);
        const priceB = calculatePriceInclShipping(b);
        // Return the comparison of the calculated prices
        return priceA - priceB;
      });

      productsStore.set(this.products);

      return productData;
    } catch (error) {
      // Handle errors in fetching product information
      console.error(`Error fetching product information for storeId ${storeId}:`, error);
      return undefined;
    }
  }

  async uploadData() {
    try {
      const products = this.products;

      if (products.length === 0) return;

      const requestBody = JSON.stringify(products);
      const response = await fetch(`${DEINEXPERT_API_URL}/product/${this.Webcode}?apikey=${this.apiKey}`, {
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

      progressStore.update(value => ({
        ...value,
        status: ProgressStatus.UPLOADED,
        subStatus: SubStatus.SUCCESS_UPLOADED,
      }));
    } catch {
      console.error('Error uploading data');
      progressStore.update(value => ({
        ...value,
        status: ProgressStatus.ERROR,
        subStatus: SubStatus.ERROR_UPLOADING_DATA,
        message: 'Error uploading data',
      }));
    }
  }

  async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

