import z from "zod";
import { Product } from "../../../generated/prisma/client";
import { Decimal } from "@prisma/client/runtime/client";
import { inBody, inParams, inQuery } from "../../util/schema.helper";

const BaseProductSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    category: z.string(),
    unitPrice: z.instanceof(Decimal),
    stockQuantity: z.number().int().default(0),
    reorderLevel: z.number().int()
}) satisfies z.ZodType<Product>;

export const CreateProductSchema = inBody(BaseProductSchema.omit({
    id: true,
}));

export const UpdateProductSchema = inBody(BaseProductSchema);
export const DeleteProductSchema = inParams(BaseProductSchema.pick({
    id: true,
}));

export const GetProductByIdSchema = inParams(BaseProductSchema.pick({
    id: true,
}));

export const GetProductByNameSchema = inQuery(BaseProductSchema.pick({
    name: true,
}));

export type GetProductByIdInput = z.infer<typeof GetProductByIdSchema.shape.params>
export type GetProductByNameInput = z.infer<typeof GetProductByNameSchema.shape.query>
export type CreateProductInput = z.infer<typeof CreateProductSchema.shape.body>
export type DeleteProductInput = z.infer<typeof DeleteProductSchema.shape.params>
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>
