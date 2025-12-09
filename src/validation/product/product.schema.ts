import z, { number, string, uuid } from "zod";
import { Product } from "../../../generated/prisma/client";
import { Decimal } from "@prisma/client/runtime/client";

const BaseProductSchema = z.object({
    id: uuid(),
    name: string(),
    category: string(),
    unitPrice: z.instanceof(Decimal),
    stockQuantity: number().int().default(0),
    reorderLevel: number().int()
}) satisfies z.ZodType<Product>;

export const CreateProductSchema = BaseProductSchema.omit({
    id: true,
});
export const UpdateProductSchema = BaseProductSchema.optional();
export const DeleteProductSchema = z.uuid();
export const GetProductSchema = BaseProductSchema;
