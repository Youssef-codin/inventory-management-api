import z, { string, uuid } from "zod";
import { Admin } from "../../../generated/prisma/client";

const BaseAdminSchema = z.object({
    id: uuid(),
    username: string(),
    passwordHash: string()
}) satisfies z.ZodType<Admin>;

export const CreateAdminSchema = BaseAdminSchema.omit({
    id: true,
    passwordHash: true
}).extend({
    password: string().min(6)
});

export const ChangePasswordSchema = z.object({
    password: string().min(6)
});


