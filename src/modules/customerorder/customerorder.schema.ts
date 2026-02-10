import { Decimal } from '@prisma/client/runtime/client';
import z from 'zod';
import type { CustomerOrder, CustomerOrderItem } from '../../../generated/prisma/client';

const BaseCustomerOrderItemSchema = z.object({
    id: z.uuid(),
    customerOrderId: z.uuid(),
    productId: z.uuid(),
    quantity: z.number().int().positive('Quantity must be positive'),
    unitPrice: z.union([
        z.instanceof(Decimal),
        z
            .number()
            .positive('Unit price must be positive')
            .transform((n) => new Decimal(n)),
    ]),
}) satisfies z.ZodType<CustomerOrderItem>;

const BaseCustomerOrderSchema = z.object({
    id: z.uuid(),
    orderDate: z.coerce.date(),
    totalAmount: z.union([z.instanceof(Decimal), z.number().transform((n) => new Decimal(n))]),
    adminId: z.uuid(),
    shopId: z.number().int().positive(),
    items: z.array(BaseCustomerOrderItemSchema).min(1),
}) satisfies z.ZodType<CustomerOrder>;

export const CustomerOrderIdSchema = BaseCustomerOrderSchema.pick({
    id: true,
});

const itemsInputSchema = BaseCustomerOrderItemSchema.omit({
    id: true,
    customerOrderId: true,
    unitPrice: true,
});

const itemsArrayWithUniqueProducts = z
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

export const CreateCustomerOrderSchema = BaseCustomerOrderSchema.omit({
    id: true,
    items: true,
    totalAmount: true,
}).extend({
    items: itemsArrayWithUniqueProducts,
});

export const UpdateCustomerOrderSchema = BaseCustomerOrderSchema.omit({
    id: true,
    items: true,
    totalAmount: true,
}).extend({
    items: itemsArrayWithUniqueProducts,
});

export type CreateCustomerOrderInput = z.infer<typeof CreateCustomerOrderSchema>;
export type CustomerOrderIdInput = z.infer<typeof CustomerOrderIdSchema>;
export type UpdateCustomerOrderInput = z.infer<typeof UpdateCustomerOrderSchema>;
