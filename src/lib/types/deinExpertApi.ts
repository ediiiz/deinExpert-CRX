export type product = {
  webcode: string;
  url: string;
  price: {
    price: number;
    branchName: string;
    branchId: number;
    aussteller: boolean;
  }[];
};
