import z from "zod";

export const CredentialsSchema = z.object({
    username: z.string(),
    password: z.string(),
});

export type CredentialsInput = z.infer<typeof CredentialsSchema>
