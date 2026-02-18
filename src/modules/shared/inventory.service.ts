import type { PrismaClient } from '@prisma/client/extension';
import type { TransactionClient } from '../../../generated/prisma/internal/prismaNamespace';
import { prisma } from '../../util/prisma';

export async function getLowStock() {
    const result = await prisma.$queryRaw<
        { productId: string; shopId: number; quantity: number; productName: string; reorderLevel: number }[]
    >`
        SELECT i."productId",
        i."shopId",
        i."quantity",
        p."name" as "productName",
        p."reorderLevel"
        FROM "Inventory" i
        JOIN "Product" p ON i."productId" = p."id"
        WHERE i."quantity" <= p."reorderLevel";
    `;
    return result;
}

export async function incrementInventory(
    ctx: TransactionClient | PrismaClient,
    item: { productId: string; incrementBy: number },
    shopId: number,
) {
    await ctx.inventory.update({
        where: {
            productId_shopId: {
                productId: item.productId,
                shopId,
            },
        },
        data: {
            quantity: { increment: item.incrementBy },
        },
    });
}

export async function decrementInventory(
    ctx: TransactionClient | PrismaClient,
    item: { productId: string; decrementBy: number },
    shopId: number,
) {
    const inventory = await ctx.inventory.findUnique({
        where: {
            productId_shopId: {
                productId: item.productId,
                shopId,
            },
        },
    });

    if (!inventory || inventory.quantity < item.decrementBy) {
        throw new Error(`Insufficient stock for product ${item.productId} in shop ${shopId}`);
    }

    await ctx.inventory.update({
        where: {
            productId_shopId: {
                productId: item.productId,
                shopId,
            },
        },
        data: {
            quantity: { decrement: item.decrementBy },
        },
    });
}

export async function getQuantity(ctx: TransactionClient | PrismaClient, productId: string, shopId: number) {
    return await ctx.inventory.findUnique({
        where: {
            productId_shopId: {
                productId,
                shopId,
            },
        },
        select: {
            quantity: true,
        },
    });
}
