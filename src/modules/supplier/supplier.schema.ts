import z from "zod";
import { Supplier } from "../../../generated/prisma/client";

const BaseSupplierSchema = z.object({
    name: z.string().nullable(),
    id: z.uuid(),
    contactEmail: z.email(),
    phone: z.string(),
    address: z.string()

}) satisfies z.ZodType<Supplier>;

