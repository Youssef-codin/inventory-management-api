import z from 'zod';
import type { Shop } from '../../../generated/prisma/client';

const BaseShopSchema = z.object({
    id: z.number().positive().int(),
    name: z.string(),
    address: z.string(),
}) satisfies z.ZodType<Shop>;

export const CreateShopSchema = BaseShopSchema.omit({
    id: true,
});

export const ShopIdSchema = BaseShopSchema.pick({
    id: true,
}).extend({
    id: z.coerce
        .number()
        .positive()
        .int()
        .transform((n) => String(n)),
});

export const UpdateShopSchema = BaseShopSchema.omit({
    id: true,
});

type NumericId = { id: number };

export type CreateShopInput = z.infer<typeof CreateShopSchema>;
export type ShopIdInputStr = z.infer<typeof ShopIdSchema>;
export type ShopIdInputNumber = NumericId;
export type UpdateShopInput = z.infer<typeof UpdateShopSchema>;
