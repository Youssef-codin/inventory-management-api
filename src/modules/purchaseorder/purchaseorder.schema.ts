import z from "zod";
import { PurchaseOrder } from "../../../generated/prisma/client";
import { Decimal } from "@prisma/client/runtime/client";
import { inBody, inParams } from "../../util/schema.helper";

const BasePurchaseOrderSchema = z.object({
    id: z.uuid(),
    orderDate: z.date(),
    totalAmount: z.union([
        z.instanceof(Decimal),
        z.number().transform(n => new Decimal(n)),
    ]),
    arrived: z.boolean(),
    adminId: z.uuid(),
    supplierId: z.uuid(),
}) satisfies z.ZodType<PurchaseOrder>;

export const CreatePurchaseOrderSchema = inBody(BasePurchaseOrderSchema.omit({
    id: true,
}));

export const GetPurchaseOrderByIdSchema = inParams(BasePurchaseOrderSchema.pick({
    id: true,
}));

export const UpdatePurchaseOrderSchema = inBody(BasePurchaseOrderSchema.omit({
    id: true,
}));

export const UpdatePurchaseOrderParamsSchema = inParams(BasePurchaseOrderSchema.pick({
    id: true,
}));

export const DeletePurchaseOrderSchema = inParams(BasePurchaseOrderSchema.pick({
    id: true,
}));

export type CreatePurchaseOrderInput = z.infer<typeof CreatePurchaseOrderSchema.shape.body>;
export type GetPurchaseOrderByIdInput = z.infer<typeof GetPurchaseOrderByIdSchema.shape.params>;
export type UpdatePurchaseOrderInput = z.infer<typeof UpdatePurchaseOrderSchema.shape.body>;
export type UpdatePurchaseOrderParamsInput = z.infer<typeof UpdatePurchaseOrderParamsSchema.shape.params>;
export type DeletePurchaseOrderInput = z.infer<typeof DeletePurchaseOrderSchema.shape.params>;
