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
