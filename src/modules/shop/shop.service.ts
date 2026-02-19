import { AppError } from '../../errors/AppError';
import { ERROR_CODE } from '../../middleware/errorHandler';
import { prisma } from '../../util/prisma';
import { cache } from '../../util/redis';
import type { CreateShopInput, ShopIdInputNumber, UpdateShopInput } from './shop.schema';

async function findShopById(id: ShopIdInputNumber['id']) {
    return await prisma.shop.findUnique({
        where: {
            id,
        },
    });
}

export async function getShopById(id: ShopIdInputNumber['id']) {
    const cached = await cache.shops.get(id);
    if (cached) return cached;

    const shop = await findShopById(id);
    if (!shop) throw new AppError(404, 'Shop not found', ERROR_CODE.NOT_FOUND);

    await cache.shops.set(id, shop);
    return shop;
}

export async function getAllShops() {
    return await prisma.shop.findMany();
}

export async function createShop(data: CreateShopInput) {
    return await prisma.shop.create({
        data,
    });
}

export async function updateShop(id: ShopIdInputNumber['id'], data: UpdateShopInput) {
    const exists = await findShopById(id);

    if (!exists) throw new AppError(404, 'Shop not found', ERROR_CODE.NOT_FOUND);

    const result = await prisma.shop.update({
        where: {
            id,
        },
        data,
    });

    await cache.shops.del(id);
    return result;
}

export async function deleteShop(id: ShopIdInputNumber['id']) {
    const exists = await findShopById(id);

    if (!exists) throw new AppError(404, 'Shop not found', ERROR_CODE.NOT_FOUND);

    await prisma.shop.delete({
        where: {
            id,
        },
    });

    await cache.shops.del(id);
    return true;
}
