import z from "zod";
import { Admin } from "../../../generated/prisma/client";

const BaseAdminSchema = z.object({
    id: z.uuid(),
    username: z.string(),
    passwordHash: z.string()
}) satisfies z.ZodType<Admin>;

export const CreateAdminSchema = BaseAdminSchema.omit({
    id: true,
    passwordHash: true
}).extend({
    password: z.string().min(6)
});

export const ChangePasswordSchema = z.object({
    password: z.string().min(6)
});


