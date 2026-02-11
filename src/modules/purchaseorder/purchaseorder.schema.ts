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
            .positive('Unit price must be positive')
            .transform((n) => new Decimal(n)),
    ]),
    arrived: z.boolean().default(false),
    adminId: z.uuid(),
    supplierId: z.uuid(),
    items: z.array(BasePurchaseOrderItemSchema).min(1),
}) satisfies z.ZodType<PurchaseOrder>;

const itemsInputSchema = BasePurchaseOrderItemSchema.omit({
    id: true,
    purchaseOrderId: true,
});

export const CreatePurchaseOrderSchema = BasePurchaseOrderSchema.omit({
    id: true,
    items: true,
    totalAmount: true,
}).extend({
    items: z.array(itemsInputSchema).min(1),
});

export const PurchaseOrderIdSchema = BasePurchaseOrderSchema.pick({ id: true });

export const UpdatePurchaseOrderSchema = BasePurchaseOrderSchema.omit({
    id: true,
    items: true,
    totalAmount: true,
}).extend({
    items: z.array(itemsInputSchema).min(1),
});

export type CreatePurchaseOrderInput = z.infer<typeof CreatePurchaseOrderSchema>;
export type PurchaseOrderIdInput = z.infer<typeof PurchaseOrderIdSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof UpdatePurchaseOrderSchema>;
