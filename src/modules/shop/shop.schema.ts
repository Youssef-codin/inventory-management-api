import z from 'zod';
import type { Shop } from '../../../generated/prisma/client';

const BaseShopSchema = z.object({
    id: z.number().positive().int(),
    name: z.string(),
    address: z.string().nullable(),
}) satisfies z.ZodType<Shop>;

export const CreateShopSchema = BaseShopSchema.omit({
    id: true,
});

export const ShopIdSchema = z.object({
    id: z
        .union([z.string(), z.number()])
        .transform((x) => `${x}`)
        .pipe(z.string()),
});

export const UpdateShopSchema = BaseShopSchema.omit({
    id: true,
});

type NumericId = { id: number };

export type CreateShopInput = z.infer<typeof CreateShopSchema>;
export type ShopIdInputStr = z.infer<typeof ShopIdSchema>;
export type ShopIdInputNumber = NumericId;
export type UpdateShopInput = z.infer<typeof UpdateShopSchema>;
