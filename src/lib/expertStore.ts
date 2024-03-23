const EXPERT_STORES: string = "https://shop.brntgs.expert.de/api/storeFinder?maxResults=1000"

interface OpeningTimes {
  "Mo. - Fr."?: {
    times: [string, string],
    comment: string;
  };
  "Sa."?: {
    times: [string],
    comment: string;
  };
}

interface Store {
  canUseShop: boolean;
  decentralizedShop: boolean;
  website: boolean;
  latitude: number;
  longitude: number;
  street: string;
  zip: string;
  city: string;
  phone: string;
  name: string;
  id: string;
  storeId: string;
}

interface ExpertStore {
  startLat: number;
  StartLng: number;
  linearDistance: string;
  openingTimes?: OpeningTimes;
  store: Store;
}

export type ExpertStores = ExpertStore[];


export default async function expertStores(): Promise<ExpertStores> {
  return fetch(EXPERT_STORES).then((response) => response.json())
}
