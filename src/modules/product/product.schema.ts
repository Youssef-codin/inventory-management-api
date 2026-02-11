import { Decimal } from '@prisma/client/runtime/client';
import z from 'zod';
import type { Inventory } from '../../../generated/prisma/browser';
import type { Product } from '../../../generated/prisma/client';

const BaseInventorySchema = z.object({
    productId: z.uuid(),
    shopId: z.number().positive(),
    quantity: z.number(),
}) satisfies z.ZodType<Inventory>;

const InventoryInputSchema = BaseInventorySchema.omit({
    productId: true,
});

const BaseProductSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    category: z.string(),
    unitPrice: z.union([
        z.instanceof(Decimal),
        z
            .number()
            .max(100000000)
            .positive()
            .transform((n) => new Decimal(n)),
    ]),
    reorderLevel: z.number().int(),
    inventories: z.array(BaseInventorySchema).min(1),
}) satisfies z.ZodType<Product>;

export const CreateProductSchema = BaseProductSchema.omit({
    id: true,
    inventories: true,
}).extend({
    inventories: z.array(InventoryInputSchema).min(1),
});

export const ProductIdSchema = BaseProductSchema.pick({
    id: true,
});

export const GetProductByNameSchema = BaseProductSchema.pick({
    name: true,
});

export const UpdateProductSchema = BaseProductSchema.omit({
    id: true,
    inventories: true,
}).extend({
    inventories: z.array(InventoryInputSchema).min(1),
});

export const PatchStockSchema = z.object({
    shopid: z.number(),
    newQuantity: z.number().int().min(0),
});

export type ProductIdInput = z.infer<typeof ProductIdSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type GetProductByNameInput = z.infer<typeof GetProductByNameSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type PatchStockInput = z.infer<typeof PatchStockSchema>;
