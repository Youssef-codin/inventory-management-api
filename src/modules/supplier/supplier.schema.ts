import z from "zod";
import { Supplier } from "../../../generated/prisma/client";
import { inBody, inParams } from "../../util/schema.helper";

const BaseSupplierSchema = z.object({
    name: z.string().nullable(),
    id: z.uuid(),
    contactEmail: z.string().email(),
    phone: z.string(),
    address: z.string()

}) satisfies z.ZodType<Supplier>;

export const CreateSupplierSchema = inBody(BaseSupplierSchema.omit({
    id: true,
}));

export const GetSupplierByIdSchema = inParams(BaseSupplierSchema.pick({
    id: true,
}));

export const UpdateSupplierSchema = inBody(BaseSupplierSchema.omit({
    id: true,
}));

export const UpdateSupplierParamsSchema = inParams(BaseSupplierSchema.pick({
    id: true,
}));

export const DeleteSupplierSchema = inParams(BaseSupplierSchema.pick({
    id: true,
}));

export type CreateSupplierInput = z.infer<typeof CreateSupplierSchema.shape.body>;
export type GetSupplierByIdInput = z.infer<typeof GetSupplierByIdSchema.shape.params>;
export type UpdateSupplierInput = z.infer<typeof UpdateSupplierSchema.shape.body>;
export type UpdateSupplierParamsInput = z.infer<typeof UpdateSupplierParamsSchema.shape.params>;
export type DeleteSupplierInput = z.infer<typeof DeleteSupplierSchema.shape.params>;

