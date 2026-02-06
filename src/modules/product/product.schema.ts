import { Decimal } from '@prisma/client/runtime/client';
import z from 'zod';
import { Inventory } from '../../../generated/prisma/browser';
import { Product } from '../../../generated/prisma/client';

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
            .positive()
            .transform((n) => new Decimal(n)),
    ]),
    reorderLevel: z.number().int(),
    inventory: z.array(BaseInventorySchema).min(1),
}) satisfies z.ZodType<Product>;

export const CreateProductSchema = BaseProductSchema.omit({
    id: true,
    inventory: true,
}).extend({
    inventory: z.array(InventoryInputSchema).min(1),
});

export const ProductIdSchema = BaseProductSchema.pick({
    id: true,
});

export const GetProductByNameSchema = BaseProductSchema.pick({
    name: true,
});

export const UpdateProductSchema = BaseProductSchema.omit({
    id: true,
    inventory: true,
}).extend({
    inventory: z.array(InventoryInputSchema).min(1),
});

export const PatchStockSchema = z.object({
    amount: z.number().int().min(0),
});

export type ProductIdInput = z.infer<typeof ProductIdSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type GetProductByNameInput = z.infer<typeof GetProductByNameSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type PatchStockInput = z.infer<typeof PatchStockSchema>;
