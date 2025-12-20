import z from "zod";
import { Decimal } from "@prisma/client/runtime/client";
import { inBody, inParams } from "../../util/schema.helper";
import { PurchaseOrder, PurchaseOrderItem } from "../../../generated/prisma/client";

const BasePurchaseOrderItemSchema = z.object({
    id: z.uuid(),
    purchaseOrderId: z.uuid(),
    productId: z.uuid(),
    quantity: z.number().int().positive("Quantity must be positive"),
    unitPrice: z.union([
        z.instanceof(Decimal),
        z.number().positive("Unit price must be positive").transform(n => new Decimal(n)),
    ]),
}) satisfies z.ZodType<PurchaseOrderItem>;

const BasePurchaseOrderSchema = z.object({
    id: z.uuid(),
    orderDate: z.coerce.date(),
    totalAmount: z.union([
        z.instanceof(Decimal),
        z.number().positive("Unit price must be positive").transform(n => new Decimal(n)),
    ]),
    arrived: z.boolean().default(false),
    adminId: z.uuid(),
    supplierId: z.uuid(),
    items: z.array(BasePurchaseOrderItemSchema).min(1),
}) satisfies z.ZodType<PurchaseOrder>;

const itemsInputSchema = BasePurchaseOrderSchema.shape.items.element.omit({
    id: true,
    purchaseOrderId: true,
});

export const CreatePurchaseOrderSchema = inBody(
    BasePurchaseOrderSchema.omit({
        id: true,
        items: true,
        totalAmount: true,
    }).extend({
        items: z.array(itemsInputSchema).min(1),
    })
);

export const GetPurchaseOrderByIdSchema = inParams(
    BasePurchaseOrderSchema.pick({ id: true })
);

export const UpdatePurchaseOrderSchema = inBody(
    BasePurchaseOrderSchema.omit({
        id: true,
        items: true,
        totalAmount: true,
    }).extend({
        items: z.array(itemsInputSchema).min(1),
    })
);

export const UpdatePurchaseOrderParamsSchema = inParams(
    BasePurchaseOrderSchema.pick({ id: true })
);

export const DeletePurchaseOrderSchema = inParams(
    BasePurchaseOrderSchema.pick({ id: true })
);

export type CreatePurchaseOrderInput = z.infer<typeof CreatePurchaseOrderSchema.shape.body>;
export type GetPurchaseOrderByIdInput = z.infer<typeof GetPurchaseOrderByIdSchema.shape.params>;
export type UpdatePurchaseOrderInput = z.infer<typeof UpdatePurchaseOrderSchema.shape.body>;
export type UpdatePurchaseOrderParamsInput = z.infer<typeof UpdatePurchaseOrderParamsSchema.shape.params>;
export type DeletePurchaseOrderInput = z.infer<typeof DeletePurchaseOrderSchema.shape.params>;
