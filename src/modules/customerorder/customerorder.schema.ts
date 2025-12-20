import z from "zod";
import { Decimal } from "@prisma/client/runtime/client";
import { inBody, inParams } from "../../util/schema.helper";
import { CustomerOrder, CustomerOrderItem } from "../../../generated/prisma/client";

const BaseCustomerOrderItemSchema = z.object({
    id: z.uuid(),
    customerOrderId: z.uuid(),
    productId: z.uuid(),
    quantity: z.number().int().positive("Quantity must be positive"),
    unitPrice: z.union([
        z.instanceof(Decimal),
        z.number().transform(n => new Decimal(n)),
    ]),
}) satisfies z.ZodType<CustomerOrderItem>;

const BaseCustomerOrderSchema = z.object({
    id: z.uuid(),
    orderDate: z.date(),
    totalAmount: z.union([
        z.instanceof(Decimal),
        z.number().transform(n => new Decimal(n)),
    ]),
    adminId: z.uuid(),
    items: z.array(BaseCustomerOrderItemSchema).min(1)

}) satisfies z.ZodType<CustomerOrder>;

const itemsInputSchema = BaseCustomerOrderSchema.shape.items.element.omit({
    id: true,
    customerOrderId: true,
});

export const CreateCustomerOrderSchema = inBody(BaseCustomerOrderSchema.omit({
    id: true,
    items: true,
}).extend({
    items: z.array(itemsInputSchema)
}));

export const GetCustomerOrderByIdSchema = inParams(BaseCustomerOrderSchema.pick({
    id: true,
}));

export const UpdateCustomerOrderParamsSchema = GetCustomerOrderByIdSchema;

export const UpdateCustomerOrderSchema = inBody(BaseCustomerOrderSchema.omit({
    id: true,
}));

export const DeleteCustomerOrderSchema = inParams(BaseCustomerOrderSchema.pick({
    id: true,
}));

export type CreateCustomerOrderInput = z.infer<typeof CreateCustomerOrderSchema.shape.body>;
export type GetCustomerOrderByIdInput = z.infer<typeof GetCustomerOrderByIdSchema.shape.params>;
export type UpdateCustomerOrderParamsInput = z.infer<typeof UpdateCustomerOrderParamsSchema.shape.params>;
export type UpdateCustomerOrderInput = z.infer<typeof UpdateCustomerOrderSchema.shape.body>;
export type DeleteCustomerOrderInput = z.infer<typeof DeleteCustomerOrderSchema.shape.params>;
