import z from "zod";
import { Admin } from "../../../generated/prisma/client";
import { inBody, inParams, inQuery } from "../../util/schema.helper";

const BaseAdminSchema = z.object({
    id: z.uuid(),
    username: z.string(),
    passwordHash: z.string()
}) satisfies z.ZodType<Admin>;

export const GetAdminByIdSchema = inParams(BaseAdminSchema.pick({
    id: true
}));

export const GetAdminByNameSchema = inQuery(BaseAdminSchema.pick({
    username: true
}));

export const CreateAdminSchema = inBody(BaseAdminSchema.omit({
    id: true,
    passwordHash: true
}).extend({
    password: z.string().min(6)
}));

export const UpdateAdminIdSchema = GetAdminByNameSchema;

export const UpdateAdminSchema = inBody(BaseAdminSchema.omit({
    id: true,
    passwordHash: true
}).extend({
    password: z.string().min(6)
}));

export const UpdateAdminParamsSchema = inParams(BaseAdminSchema.pick({
    id: true
}));

export const DeleteAdminSchema = inParams(BaseAdminSchema.pick({
    id: true
}));

export type CreateAdminInput = z.infer<typeof CreateAdminSchema.shape.body>;
export type GetAdminByIdInput = z.infer<typeof GetAdminByIdSchema.shape.params>;
export type GetAdminByNameInput = z.infer<typeof GetAdminByNameSchema.shape.query>;
export type UpdateAdminInput = z.infer<typeof UpdateAdminSchema.shape.body>;
export type UpdateAdminParamsInput = z.infer<typeof UpdateAdminParamsSchema.shape.params>;
export type DeleteAdminInput = z.infer<typeof DeleteAdminSchema.shape.params>;
