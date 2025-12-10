import z from "zod";
import { PurchaseOrder } from "../../../generated/prisma/client";
import { Decimal } from "@prisma/client/runtime/client";

const BasePurhcaseOrderSchema = z.object({
    id: z.uuid(),
    orderDate: z.date(),
    totalAmount: z.instanceof(Decimal),
    arrived: z.boolean(),
    adminId: z.uuid(),
    supplierId: z.uuid(),
}) satisfies z.ZodType<PurchaseOrder>;
