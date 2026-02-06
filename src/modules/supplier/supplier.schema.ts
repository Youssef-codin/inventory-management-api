import z from "zod";
import { Supplier } from "../../../generated/prisma/client";

const BaseSupplierSchema = z.object({
    name: z.string().nullable(),
    id: z.uuid(),
    contactEmail: z.email(),
    phone: z.string(),
    address: z.string()

}) satisfies z.ZodType<Supplier>;

export const CreateSupplierSchema = BaseSupplierSchema.omit({
    id: true,
});

export const SupplierIdSchema = BaseSupplierSchema.pick({
    id: true,
});

export const UpdateSupplierSchema = BaseSupplierSchema.omit({
    id: true,
});

export const GetSupplierByProductIdSchema = z.object({
    productId: z.uuid()
});

export type CreateSupplierInput = z.infer<typeof CreateSupplierSchema>;
export type SupplierIdInput = z.infer<typeof SupplierIdSchema>;
export type UpdateSupplierInput = z.infer<typeof UpdateSupplierSchema>;
export type GetSupplierByProductIdInput = z.infer<typeof GetSupplierByProductIdSchema>;

