import z from "zod";
import { CustomerOrder } from "../../../generated/prisma/client";
import { Decimal } from "@prisma/client/runtime/client";

const BaseCustomerOrderSchema = z.object({
    id: z.uuid(),
    orderDate: z.date(),
    totalAmount: z.instanceof(Decimal),
    adminId: z.uuid(),
}) satisfies z.ZodType<CustomerOrder>;
