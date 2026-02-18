import { Decimal } from '@prisma/client/runtime/client';
import z from 'zod';
import type { PurchaseOrder, PurchaseOrderItem } from '../../../generated/prisma/client';

const BasePurchaseOrderItemSchema = z.object({
    id: z.uuid(),
    purchaseOrderId: z.uuid(),
    productId: z.uuid(),
    quantity: z.number().int().positive('Quantity must be positive').max(1_000_000),
    unitPrice: z.union([
        z.instanceof(Decimal),
        z
            .number()
            .positive('Unit price must be positive')
            .transform((n) => new Decimal(n)),
    ]),
}) satisfies z.ZodType<PurchaseOrderItem>;

const BasePurchaseOrderSchema = z.object({
    id: z.uuid(),
    shopId: z.number().positive(),
    orderDate: z.coerce.date(),
    totalAmount: z.union([
        z.instanceof(Decimal),
        z
            .number()
            .max(100000000)
            .positive('Total amount must be positive')
            .transform((n) => new Decimal(n)),
    ]),
    arrived: z.boolean().default(false),
    adminId: z.uuid(),
    supplierId: z.uuid(),
    items: z.array(BasePurchaseOrderItemSchema).min(1),
}) satisfies z.ZodType<PurchaseOrder>;

const itemsInputSchema = z.object({
    productId: z.uuid(),
    quantity: z.number().int().positive('Quantity must be positive').max(1_000_000),
    unitPrice: z.number().positive('Unit price must be positive'),
});

const ItemsArrayWithUniqueProducts = z
    .array(itemsInputSchema)
    .min(1, 'Order must contain at least one item')
    .refine(
        (items) => {
            const productIds = items.map((i) => i.productId);
            return new Set(productIds).size === productIds.length;
        },
        {
            message: 'Duplicate productId found in items',
            path: ['items'],
        },
    );

export const CreatePurchaseOrderSchema = BasePurchaseOrderSchema.omit({
    id: true,
    items: true,
    totalAmount: true,
}).extend({
    items: ItemsArrayWithUniqueProducts,
});

export const PurchaseOrderIdSchema = BasePurchaseOrderSchema.pick({ id: true });

export const UpdatePurchaseOrderSchema = BasePurchaseOrderSchema.omit({
    id: true,
    items: true,
    totalAmount: true,
}).extend({
    items: ItemsArrayWithUniqueProducts,
});

export type CreatePurchaseOrderInput = z.infer<typeof CreatePurchaseOrderSchema>;
export type PurchaseOrderIdInput = z.infer<typeof PurchaseOrderIdSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof UpdatePurchaseOrderSchema>;
