import z from 'zod';
import { Decimal } from '@prisma/client/runtime/client';
import { CustomerOrder, CustomerOrderItem } from '../../../generated/prisma/client';

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

const itemsInputSchema = BaseCustomerOrderSchema.shape.items.element
    .omit({
        id: true,
        customerOrderId: true,
    })
    .omit({
        unitPrice: true,
    });

export const CreateCustomerOrderSchema = BaseCustomerOrderSchema.omit({
    id: true,
    items: true,
    totalAmount: true,
}).extend({
    items: z.array(itemsInputSchema).min(1),
});

export const CustomerOrderIdSchema = BaseCustomerOrderSchema.pick({
    id: true,
});

export const UpdateCustomerOrderSchema = BaseCustomerOrderSchema.omit({
    id: true,
    items: true,
    totalAmount: true,
}).extend({
    items: z.array(itemsInputSchema),
});

export type CreateCustomerOrderInput = z.infer<typeof CreateCustomerOrderSchema>;
export type CustomerOrderIdInput = z.infer<typeof CustomerOrderIdSchema>;
export type UpdateCustomerOrderInput = z.infer<typeof UpdateCustomerOrderSchema>;
