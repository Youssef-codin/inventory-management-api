/** biome-ignore-all lint/style/noNonNullAssertion: we already check if the items and products are there */
import { Decimal } from '@prisma/client/runtime/client';
import { AppError } from '../../errors/AppError';
import { ERROR_CODE } from '../../middleware/errorHandler';
import { prisma } from '../../util/prisma';
import { decrementInventory, getLowStock, incrementInventory } from '../shared/inventory.service';
import type {
    CreateCustomerOrderInput,
    CustomerOrderIdInput,
    UpdateCustomerOrderInput,
} from './customerorder.schema';

async function findById(id: CustomerOrderIdInput['id']) {
    return await prisma.customerOrder.findUnique({
        where: {
            id,
        },
        include: {
            items: true,
        },
    });
}

export async function getCustomerOrderById(id: CustomerOrderIdInput['id']) {
    const order = await findById(id);

    if (!order) throw new AppError(404, 'Customer order with this ID does not exist', ERROR_CODE.NOT_FOUND);

    return order;
}

export async function getAllCustomerOrders() {
    return await prisma.customerOrder.findMany({
        orderBy: {
            orderDate: 'desc',
        },
    });
}

export async function createCustomerOrder(requestingAdminId: string, data: CreateCustomerOrderInput) {
    if (requestingAdminId !== data.adminId)
        // check Token
        throw new AppError(
            403,
            'Unauthorized: cannot create customer order for another admin.',
            ERROR_CODE.UNAUTHORIZED,
        );

    const shop = await prisma.shop.findUnique({ where: { id: data.shopId } });
    if (!shop) {
        throw new AppError(404, 'Shop not found', ERROR_CODE.NOT_FOUND);
    }

    const productIds = data.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { inventories: { where: { shopId: data.shopId } } },
    });

    if (products.length !== productIds.length) {
        throw new AppError(404, 'One or more products not found', ERROR_CODE.NOT_FOUND);
    }

    const itemsQuantity = data.items;

    // make sure each item from the order can be fulfilled by our inventory
    for (const item of data.items) {
        const product = products.find((p) => p.id === item.productId);
        const inventory = product?.inventories[0];

        if (!inventory) {
            throw new AppError(
                404,
                `No inventory found for product ${item.productId} in shop ${data.shopId}`,
                ERROR_CODE.NOT_FOUND,
            );
        }

        if (item.quantity > inventory.quantity) {
            throw new AppError(400, 'Insufficient stock for customer order', ERROR_CODE.INSUFFICIENT_STOCK);
        }
    }

    // calculate total amount
    const total = products.reduce((sum, prod) => {
        const item = itemsQuantity.find((i) => i.productId === prod.id);
        return sum + item!.quantity * prod.unitPrice.toNumber();
    }, 0);

    const order = await prisma.$transaction(async (tx) => {
        const order = await tx.customerOrder.create({
            data: {
                adminId: data.adminId,
                orderDate: data.orderDate || new Date(),
                totalAmount: new Decimal(total),
                shopId: data.shopId,
                items: {
                    create: data.items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: products.find((p) => p.id === item.productId)!.unitPrice,
                    })),
                },
            },
            include: {
                items: true,
            },
        });

        // update inventory with the new quantity
        for (const item of data.items) {
            await incrementInventory(tx, { productId: item.productId, quantity: item.quantity }, data.shopId);
        }

        return order;
    });

    const lowStockProducts = await getLowStock();

    return {
        order,
        lowStockProducts,
    };
}

export async function updateCustomerOrder(
    requestingAdminId: string,
    id: CustomerOrderIdInput['id'],
    data: UpdateCustomerOrderInput,
) {
    if (requestingAdminId !== data.adminId)
        throw new AppError(
            403,
            'Unauthorized: cannot update customer order for another admin.',
            ERROR_CODE.UNAUTHORIZED,
        );

    const existingOrder = await findById(id);

    if (!existingOrder) {
        throw new AppError(404, 'Customer order by this ID does not exist', ERROR_CODE.NOT_FOUND);
    }

    // make sure products exist
    const productIds = data.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { inventories: { where: { shopId: data.shopId } } },
    });

    if (products.length !== productIds.length) {
        throw new AppError(404, 'One or more products not found', ERROR_CODE.NOT_FOUND);
    }

    //TODO: deal with shop change
    if (existingOrder.shopId !== data.shopId) {
    }

    // split items into added, removed, and common
    const oldItems = existingOrder.items;
    const newItems = data.items;

    const oldIds = new Set(oldItems.map((i) => i.productId));
    const newIds = new Set(newItems.map((i) => i.productId));

    // this is what is going to be used
    const addedItems = newItems.filter((i) => !oldIds.has(i.productId));
    const removedItems = oldItems.filter((i) => !newIds.has(i.productId));
    const commonItems = newItems
        .filter((i) => oldIds.has(i.productId))
        .map((i) => {
            const old = oldItems.find((o) => o.productId === i.productId)!;
            const diff = i.quantity - old.quantity;
            return { productId: i.productId, diff, newQty: i.quantity };
        });

    // make sure stock can fulfill updated order
    for (const item of addedItems) {
        const product = products.find((p) => p.id === item.productId);
        const inventory = product?.inventories[0];

        if (!inventory) {
            throw new AppError(
                404,
                `No inventory found for product ${item.productId} in shop ${data.shopId}`,
                ERROR_CODE.NOT_FOUND,
            );
        }

        if (item.quantity > inventory.quantity) {
            throw new AppError(400, 'Insufficient stock for customer order', ERROR_CODE.INSUFFICIENT_STOCK);
        }
    }

    // make sure stock can fulfill updated order
    for (const item of commonItems) {
        if (item.diff > 0) {
            const product = products.find((p) => p.id === item.productId);
            const inv = product?.inventories[0];

            if (!inv) {
                throw new AppError(
                    404,
                    `No inventory found for product ${item.productId} in shop ${data.shopId}`,
                    ERROR_CODE.NOT_FOUND,
                );
            }

            if (inv.quantity < item.diff) {
                throw new AppError(
                    400,
                    'Insufficient stock for item quantity increase',
                    ERROR_CODE.INSUFFICIENT_STOCK,
                );
            }
        }
    }

    // calculate total
    const total = products.reduce((sum, prod) => {
        const item = newItems.find((i) => i.productId === prod.id);
        return sum + item!.quantity * prod.unitPrice.toNumber();
    }, 0);

    const updatedOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.customerOrder.update({
            where: { id },
            data: {
                adminId: data.adminId,
                orderDate: data.orderDate || new Date(),
                totalAmount: new Decimal(total),
                items: {
                    deleteMany: {},
                    create: newItems.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: products.find((p) => p.id === item.productId)!.unitPrice,
                    })),
                },
            },
            include: { items: true },
        });

        // return stock for removed
        for (const item of removedItems) {
            await incrementInventory(tx, { productId: item.productId, quantity: item.quantity }, data.shopId);
        }

        // adjust stock for common
        for (const item of commonItems) {
            if (item.diff > 0) {
                await decrementInventory(
                    tx,
                    { productId: item.productId, quantity: item.newQty },
                    data.shopId,
                );
            } else if (item.diff < 0) {
                await incrementInventory(
                    tx,
                    { productId: item.productId, quantity: item.newQty },
                    data.shopId,
                );
            }
        }

        // deduct stock for new additions
        for (const item of addedItems) {
            await decrementInventory(tx, item, data.shopId);
        }

        return order;
    });

    const lowStockProducts = await getLowStock();

    return {
        updatedOrder,
        lowStockProducts,
    };
}

export async function deleteCustomerOrder(id: CustomerOrderIdInput['id']) {
    const order = await findById(id);
    if (!order) {
        throw new AppError(404, 'Customer order with this ID does not exist', ERROR_CODE.NOT_FOUND);
    }

    return prisma.$transaction(async (tx) => {
        await tx.customerOrder.delete({ where: { id } });

        for (const item of order.items) {
            await incrementInventory(
                tx,
                { productId: item.productId, quantity: item.quantity },
                order.shopId,
            );
        }

        return true;
    });
}
