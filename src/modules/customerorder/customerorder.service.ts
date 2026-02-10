/** biome-ignore-all lint/style/noNonNullAssertion: we already check if the items and products are there */
import { Decimal } from '@prisma/client/runtime/client';
import { AppError } from '../../errors/AppError';
import { ERROR_CODE } from '../../middleware/errorHandler';
import { prisma } from '../../util/prisma';
import { getLowStock } from '../shared/inventory.service';
import type {
    CreateCustomerOrderInput,
    CustomerOrderIdInput,
    UpdateCustomerOrderInput,
} from './customerorder.schema';
import { CustomerOrderItem } from '../../../generated/prisma/client';

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

    const productIds = data.items.map((item) => item.productId);

    const products = await prisma.product.findMany({
        where: {
            id: {
                in: productIds,
            },
        },
    });

    if (products.length !== productIds.length) {
        throw new AppError(404, 'One or more products not found', ERROR_CODE.NOT_FOUND);
    }

    const itemsQuantity = data.items;

    // make sure each item from the order can be fulfilled by our inventory
    for (const prod of products) {
        const availableStock = await prisma.inventory.findUnique({
            where: {
                productId_shopId: {
                    productId: prod.id,
                    shopId: data.shopId,
                },
            },
            select: {
                quantity: true,
            },
        });

        const requestedItemQuantity = itemsQuantity.find((item) => item.productId === prod.id)?.quantity;

        if (requestedItemQuantity! > availableStock!.quantity) {
            throw new AppError(400, 'Insufficient Stock for customer order', ERROR_CODE.INSUFFICIENT_STOCK);
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
            await tx.inventory.update({
                where: {
                    productId_shopId: {
                        productId: item.productId,
                        shopId: data.shopId,
                    },
                },
                data: {
                    quantity: {
                        decrement: item.quantity,
                    },
                },
            });
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
    });

    if (products.length !== productIds.length) {
        throw new AppError(404, 'One or more products not found', ERROR_CODE.NOT_FOUND);
    }

    //TODO: deal with shop change
    if (existingOrder.shopId !== data.shopId) {
        throw new AppError(400, 'Shop change not yet implemented', ERROR_CODE.VALIDATION_FAILED);
    }

    // split items into added, removed, and common
    const oldItems = existingOrder.items;
    const newItems = data.items;

    const oldIds = new Set(oldItems.map((i) => i.productId));
    const newIds = new Set(newItems.map((i) => i.productId));

    // this is what is going to be worked on
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
    for (const common of commonItems) {
        if (common.diff > 0) {
            const inv = await prisma.inventory.findUnique({
                where: {
                    productId_shopId: {
                        productId: common.productId,
                        shopId: data.shopId,
                    },
                },
                select: { quantity: true },
            });
            if (!inv || inv.quantity < common.diff) {
                throw new AppError(
                    400,
                    'Insufficient stock for item quantity increase',
                    ERROR_CODE.INSUFFICIENT_STOCK,
                );
            }
        }
    }

    for (const add of addedItems) {
        const inv = await prisma.inventory.findUnique({
            where: {
                productId_shopId: {
                    productId: add.productId,
                    shopId: data.shopId,
                },
            },
            select: { quantity: true },
        });
        if (!inv || inv.quantity < add.quantity) {
            throw new AppError(400, 'Insufficient stock for new item', ERROR_CODE.INSUFFICIENT_STOCK);
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
        for (const rem of removedItems) {
            await tx.inventory.update({
                where: {
                    productId_shopId: {
                        productId: rem.productId,
                        shopId: data.shopId,
                    },
                },
                data: {
                    quantity: { increment: rem.quantity },
                },
            });
        }

        // adjust stock for common
        for (const common of commonItems) {
            if (common.diff !== 0) {
                await tx.inventory.update({
                    where: {
                        productId_shopId: {
                            productId: common.productId,
                            shopId: data.shopId,
                        },
                    },
                    data: {
                        quantity:
                            common.diff > 0
                                ? { decrement: common.diff }
                                : { increment: Math.abs(common.diff) },
                    },
                });
            }
        }

        // deduct stock for new additions
        for (const add of addedItems) {
            await tx.inventory.update({
                where: {
                    productId_shopId: {
                        productId: add.productId,
                        shopId: data.shopId,
                    },
                },
                data: {
                    quantity: { decrement: add.quantity },
                },
            });
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
    if (!order) throw new AppError(404, 'Customer order with this ID does not exist', ERROR_CODE.NOT_FOUND);

    return prisma.$transaction(async (tx) => {
        await tx.customerOrder.delete({ where: { id } });

        for (const item of order.items) {
            await tx.inventory.update({
                where: {
                    productId_shopId: {
                        productId: item.productId,
                        shopId: order.shopId,
                    },
                },
                data: {
                    quantity: { increment: item.quantity },
                },
            });
        }

        return true;
    });
}
