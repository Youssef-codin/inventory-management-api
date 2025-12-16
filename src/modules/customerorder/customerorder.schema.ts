import z from "zod";
import { CustomerOrder } from "../../../generated/prisma/client";
import { Decimal } from "@prisma/client/runtime/client";
import { inBody, inParams } from "../../util/schema.helper";

const BaseCustomerOrderSchema = z.object({
    id: z.uuid(),
    orderDate: z.date(),
    totalAmount: z.union([
        z.instanceof(Decimal),
        z.number().transform(n => new Decimal(n)),
    ]),
    adminId: z.uuid(),
}) satisfies z.ZodType<CustomerOrder>;

export const CreateCustomerOrderSchema = inBody(BaseCustomerOrderSchema.omit({
    id: true,
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
