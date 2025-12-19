import z from "zod";
import { inBody } from "../../util/schema.helper";

export const CredentialsSchema = inBody(z.object({
    username: z.string(),
    password: z.string(),
}));

export type CredentialsInput = z.infer<typeof CredentialsSchema.shape.body>
