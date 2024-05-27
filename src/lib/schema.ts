import { z } from 'zod';

export const storeSchema = z.array(
  z.object({
    store: z.object({
      website: z.boolean().refine((val) => val === true, {
        message: "Website must be true",
      }),
      name: z.string().min(1),
      storeId: z.string().min(1),
    }),
  })
)

export type StoreSchema = z.infer<typeof storeSchema>;

export const productSchema = z.object({
  article: z.object({
    slug: z.string().min(1),
    title: z.string().min(1),
    webcode: z.string().min(1),
    articleId: z.string().min(1),
  }),
  primaryImageMedium: z.object({
    originalData: z.string().min(1),
  }),
  brand: z.object({
    name: z.string().min(1),
  }),
});

export type ProductSchema = z.infer<typeof productSchema>;

export const productPriceSchema = z.object({
  price: z.object({
    gross: z.number().nonnegative('Net price must be a non-negative number'),
  }),
  onlineButtonAction: z.literal('ORDER'),
  itemOnDisplay: z.boolean(),
  onlineShipment: z.array(z.object({
    price: z.object({
      gross: z.number().nonnegative('Shipment gross price must be a non-negative number'),
    }),
  })).optional(),
});

export type ProductPriceSchema = z.infer<typeof productPriceSchema>;

const singleStoreSchema = z.object({
  store: z.object({
    name: z.string(),
    id: z.string(),
  }),
});

export const productDataSchema = singleStoreSchema.merge(productPriceSchema);

export type ProductDataSchema = z.infer<typeof productDataSchema>;

export const cashbackSchema = z.object({
  url: z.string().min(1),
});
