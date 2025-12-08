import z, { string, uuid } from "zod";
import { Admin } from "../../../generated/prisma/client";

const AdminSchema = z.object({
    id: uuid(),
    username: string(),
    passwordHash: string().min(6)
}) satisfies z.ZodType<Admin>;


