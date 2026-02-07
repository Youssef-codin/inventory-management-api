import z from 'zod';
import type { Admin } from '../../../generated/prisma/client';

const BaseAdminSchema = z.object({
    id: z.uuid(),
    username: z.string(),
    passwordHash: z.string(),
}) satisfies z.ZodType<Admin>;

export const AdminIdSchema = BaseAdminSchema.pick({
    id: true,
});

export const GetAdminByNameSchema = BaseAdminSchema.pick({
    username: true,
});

export const CreateAdminSchema = BaseAdminSchema.omit({
    id: true,
    passwordHash: true,
}).extend({
    password: z.string().min(6),
});

export const UpdateAdminSchema = BaseAdminSchema.omit({
    id: true,
    passwordHash: true,
}).extend({
    password: z.string().min(6),
});

export type AdminIdInput = z.infer<typeof AdminIdSchema>;
export type GetAdminByNameInput = z.infer<typeof GetAdminByNameSchema>;
export type CreateAdminInput = z.infer<typeof CreateAdminSchema>;
export type UpdateAdminInput = z.infer<typeof UpdateAdminSchema>;
