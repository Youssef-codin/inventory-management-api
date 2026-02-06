import z from 'zod';
import type { Shop } from '../../../generated/prisma/client';

const BaseShopSchema = z.object({
    id: z.number().positive(),
    name: z.string(),
    address: z.string(),
}) satisfies z.ZodType<Shop>;

export const CreateShopSchema = BaseShopSchema.omit({
    id: true,
});

export const ShopIdSchema = z.object({
    id: z.coerce.number().positive()
});

export const UpdateShopSchema = BaseShopSchema.omit({
    id: true,
});

export type CreateShopInput = z.infer<typeof CreateShopSchema>;
export type ShopIdInput = z.infer<typeof ShopIdSchema>;
export type UpdateShopInput = z.infer<typeof UpdateShopSchema>;
