/** biome-ignore-all lint/style/noNonNullAssertion: we already check if the items and products are there */
import { Decimal } from '@prisma/client/runtime/client';
import { AppError } from '../../errors/AppError';
import { ERROR_CODE } from '../../middleware/errorHandler';
import { prisma } from '../../util/prisma';
import { decrementInventory, getLowStock, incrementInventory } from '../shared/inventory.service';
import type {
    CreatePurchaseOrderInput,
    PurchaseOrderIdInput,
    UpdatePurchaseOrderInput,
} from './purchaseorder.schema';

type OrderItem = { productId: string; quantity: number; unitPrice: number };

type OldOrderItem = {
    id: string;
    purchaseOrderId: string;
    productId: string;
    quantity: number;
    unitPrice: Decimal;
};

type ProductWithInventory = {
    id: string;
    name: string;
    unitPrice: Decimal;
    category: string;
    reorderLevel: number;
    inventories: {
        shopId: number;
        productId: string;
        quantity: number;
    }[];
};

type UpdateOrderData = {
    orderDate: Date;
    adminId: string;
    shopId: number;
    supplierId: string;
    arrived: boolean;
    items: OrderItem[];
};

async function findById(id: PurchaseOrderIdInput['id']) {
    return await prisma.purchaseOrder.findUnique({
        where: {
            id,
        },
        include: {
            items: true,
        },
    });
}

export async function getPurchaseOrderById(id: PurchaseOrderIdInput['id']) {
    const order = await findById(id);

    if (!order) throw new AppError(404, 'Order not found with this id', ERROR_CODE.NOT_FOUND);

    return order;
}

export async function getAllPurchaseOrders() {
    return await prisma.purchaseOrder.findMany();
}

export async function createPurchaseOrder(requestingAdminId: string, data: CreatePurchaseOrderInput) {
    if (requestingAdminId !== data.adminId)
        throw new AppError(
            403,
            'Unauthorized: cannot create purchase order for another admin.',
            ERROR_CODE.UNAUTHORIZED,
        );

    const supplier = await prisma.supplier.findUnique({
        where: {
            id: data.supplierId,
        },
    });

    if (!supplier) throw new AppError(404, 'Supplier of this ID not found', ERROR_CODE.NOT_FOUND);

    const productIds = data.items.map((item) => item.productId);

    const order = await prisma.$transaction(async (tx) => {
        const products = await tx.product.findMany({
            where: {
                id: {
                    in: productIds,
                },
            },
            include: { inventories: { where: { shopId: data.shopId } } },
        });

        const productsMap = new Map(products.map((p) => [p.id, p]));

        if (products.length !== productIds.length) {
            throw new AppError(404, 'One or more products not found', ERROR_CODE.NOT_FOUND);
        }

        const total = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

        for (const item of data.items) {
            const product = productsMap.get(item.productId);
            const inventory = product?.inventories[0];

            if (!inventory) {
                throw new AppError(
                    404,
                    `No inventory found for product ${item.productId} in shop ${data.shopId}`,
                    ERROR_CODE.NOT_FOUND,
                );
            }
        }

        const newOrder = await tx.purchaseOrder.create({
            data: {
                adminId: data.adminId,
                supplierId: data.supplierId,
                shopId: data.shopId,
                orderDate: data.orderDate || new Date(),
                arrived: data.arrived,
                totalAmount: new Decimal(total),
                items: {
                    createMany: {
                        data: data.items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: Number(item.unitPrice),
                        })),
                    },
                },
            },
            include: {
                items: true,
            },
        });

        if (data.arrived) {
            for (const item of newOrder.items) {
                await incrementInventory(
                    tx,
                    { productId: item.productId, incrementBy: item.quantity },
                    data.shopId,
                );
            }
        }

        return newOrder;
    });

    const lowStockProducts = await getLowStock();

    return {
        order,
        lowStockProducts,
    };
}

export async function updatePurchaseOrder(
    requestingAdminId: string,
    id: PurchaseOrderIdInput['id'],
    data: UpdatePurchaseOrderInput,
) {
    if (requestingAdminId !== data.adminId)
        throw new AppError(
            403,
            'Unauthorized: cannot update purchase order for another admin.',
            ERROR_CODE.UNAUTHORIZED,
        );

    const existingOrder = await findById(id);

    if (!existingOrder) {
        throw new AppError(404, 'Purchase order not found', ERROR_CODE.NOT_FOUND);
    }

    const productIds = data.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { inventories: { where: { shopId: data.shopId } } },
    });

    if (products.length !== productIds.length) {
        throw new AppError(404, 'One or more products not found', ERROR_CODE.NOT_FOUND);
    }

    const oldItems = existingOrder.items;
    const newItems = data.items;

    let updatedOrder: typeof existingOrder;

    // Branch 1: Already arrived + changing shop
    if (existingOrder.arrived && existingOrder.shopId !== data.shopId) {
        updatedOrder = await handleDiffShop(id, existingOrder.shopId, oldItems, newItems, products, data);
    }
    // Branch 2: Already arrived + same shop (calculate diffs)
    else if (existingOrder.arrived && existingOrder.shopId === data.shopId) {
        updatedOrder = await handleSameShop(id, oldItems, newItems, products, data);
    }
    // Branch 3: Not arrived yet, but marking as arrived now
    else if (!existingOrder.arrived && data.arrived) {
        updatedOrder = await handleArrived(id, newItems, products, data);
    }
    // Branch 4: Not arrived, staying not arrived (simplest)
    else {
        updatedOrder = await handleNotArrived(id, newItems, data);
    }

    const lowStockProducts = await getLowStock();

    return {
        updatedOrder,
        lowStockProducts,
    };
}

async function handleDiffShop(
    orderId: string,
    oldShopId: number,
    oldItems: OldOrderItem[],
    newItems: OrderItem[],
    products: ProductWithInventory[],
    data: UpdateOrderData,
) {
    const productsMap = new Map(products.map((p) => [p.id, p]));

    const updatedOrder = await prisma.$transaction(async (tx) => {
        for (const item of newItems) {
            const product = productsMap.get(item.productId);
            const inventory = product?.inventories[0];

            if (!inventory) {
                throw new AppError(
                    404,
                    `No inventory found for product ${item.productId} in shop ${data.shopId}`,
                    ERROR_CODE.NOT_FOUND,
                );
            }
        }

        for (const item of oldItems) {
            const inventory = await tx.inventory.findUnique({
                where: {
                    productId_shopId: {
                        productId: item.productId,
                        shopId: oldShopId,
                    },
                },
            });

            if (!inventory || inventory.quantity < item.quantity) {
                throw new AppError(
                    400,
                    `Insufficient stock to return for product ${item.productId}`,
                    ERROR_CODE.INSUFFICIENT_STOCK,
                );
            }
        }

        const total = newItems.reduce((sum, item) => {
            return sum + item.quantity * item.unitPrice;
        }, 0);

        const order = await tx.purchaseOrder.update({
            where: { id: orderId },
            data: {
                adminId: data.adminId,
                supplierId: data.supplierId,
                orderDate: data.orderDate || new Date(),
                arrived: data.arrived,
                totalAmount: new Decimal(total),
                shopId: data.shopId,
                items: {
                    deleteMany: {},
                    createMany: {
                        data: newItems.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                        })),
                    },
                },
            },
            include: { items: true },
        });

        for (const item of newItems) {
            await incrementInventory(
                tx,
                { productId: item.productId, incrementBy: item.quantity },
                data.shopId,
            );
        }

        for (const item of oldItems) {
            await decrementInventory(
                tx,
                { productId: item.productId, decrementBy: item.quantity },
                oldShopId,
            );
        }

        return order;
    });

    return updatedOrder;
}

async function handleSameShop(
    orderId: string,
    oldItems: OldOrderItem[],
    newItems: OrderItem[],
    products: ProductWithInventory[],
    data: UpdateOrderData,
) {
    const productsMap = new Map(products.map((p) => [p.id, p]));
    const oldItemsMap = new Map(oldItems.map((i) => [i.productId, i]));

    const oldIds = new Set(oldItems.map((i) => i.productId));
    const newIds = new Set(newItems.map((i) => i.productId));

    const addedItems = newItems.filter((i) => !oldIds.has(i.productId));
    const removedItems = oldItems.filter((i) => !newIds.has(i.productId));
    const commonItems = newItems
        .filter((i) => oldIds.has(i.productId))
        .map((i) => {
            const old = oldItemsMap.get(i.productId)!;
            const diff = i.quantity - old.quantity;
            return { productId: i.productId, diff, newQty: i.quantity };
        });

    for (const item of addedItems) {
        const product = productsMap.get(item.productId);
        const inventory = product?.inventories[0];

        if (!inventory) {
            throw new AppError(
                404,
                `No inventory found for product ${item.productId} in shop ${data.shopId}`,
                ERROR_CODE.NOT_FOUND,
            );
        }
    }

    for (const item of commonItems) {
        if (item.diff > 0) {
            const product = productsMap.get(item.productId);
            const inv = product?.inventories[0];

            if (!inv) {
                throw new AppError(
                    404,
                    `No inventory found for product ${item.productId} in shop ${data.shopId}`,
                    ERROR_CODE.NOT_FOUND,
                );
            }
        }
    }

    const total = newItems.reduce((sum, item) => {
        return sum + item.quantity * item.unitPrice;
    }, 0);

    const updatedOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.purchaseOrder.update({
            where: { id: orderId },
            data: {
                adminId: data.adminId,
                supplierId: data.supplierId,
                orderDate: data.orderDate || new Date(),
                arrived: data.arrived,
                totalAmount: new Decimal(total),
                items: {
                    deleteMany: {},
                    createMany: {
                        data: newItems.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                        })),
                    },
                },
            },
            include: { items: true },
        });

        for (const item of removedItems) {
            await decrementInventory(
                tx,
                { productId: item.productId, decrementBy: item.quantity },
                data.shopId,
            );
        }

        for (const item of commonItems) {
            if (item.diff > 0) {
                await incrementInventory(
                    tx,
                    { productId: item.productId, incrementBy: item.diff },
                    data.shopId,
                );
            } else if (item.diff < 0) {
                await decrementInventory(
                    tx,
                    { productId: item.productId, decrementBy: Math.abs(item.diff) },
                    data.shopId,
                );
            }
        }

        for (const item of addedItems) {
            await incrementInventory(
                tx,
                { productId: item.productId, incrementBy: item.quantity },
                data.shopId,
            );
        }

        return order;
    });

    return updatedOrder;
}

async function handleArrived(
    orderId: string,
    newItems: OrderItem[],
    products: ProductWithInventory[],
    data: UpdateOrderData,
) {
    const productsMap = new Map(products.map((p) => [p.id, p]));

    for (const item of newItems) {
        const product = productsMap.get(item.productId);
        const inventory = product?.inventories[0];

        if (!inventory) {
            throw new AppError(
                404,
                `No inventory found for product ${item.productId} in shop ${data.shopId}`,
                ERROR_CODE.NOT_FOUND,
            );
        }
    }

    const total = newItems.reduce((sum, item) => {
        return sum + item.quantity * item.unitPrice;
    }, 0);

    const updatedOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.purchaseOrder.update({
            where: { id: orderId },
            data: {
                adminId: data.adminId,
                supplierId: data.supplierId,
                orderDate: data.orderDate || new Date(),
                arrived: data.arrived,
                totalAmount: new Decimal(total),
                items: {
                    deleteMany: {},
                    createMany: {
                        data: newItems.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                        })),
                    },
                },
            },
            include: { items: true },
        });

        for (const item of newItems) {
            await incrementInventory(
                tx,
                { productId: item.productId, incrementBy: item.quantity },
                data.shopId,
            );
        }

        return order;
    });

    return updatedOrder;
}

async function handleNotArrived(orderId: string, newItems: OrderItem[], data: UpdateOrderData) {
    const total = newItems.reduce((sum, item) => {
        return sum + item.quantity * item.unitPrice;
    }, 0);

    const updatedOrder = await prisma.purchaseOrder.update({
        where: { id: orderId },
        data: {
            adminId: data.adminId,
            supplierId: data.supplierId,
            orderDate: data.orderDate || new Date(),
            arrived: data.arrived,
            totalAmount: new Decimal(total),
            items: {
                deleteMany: {},
                createMany: {
                    data: newItems.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                    })),
                },
            },
        },
        include: { items: true },
    });

    return updatedOrder;
}

export async function orderArrived(id: PurchaseOrderIdInput['id']) {
    const exisitingOrder = await findById(id);

    if (!exisitingOrder) throw new AppError(404, 'Order not found with this id', ERROR_CODE.NOT_FOUND);

    if (exisitingOrder.arrived)
        throw new AppError(400, 'Order already marked as arrived', ERROR_CODE.INVALID_STATE);

    // Validate all items have inventory records before starting transaction
    for (const item of exisitingOrder.items) {
        const inventory = await prisma.inventory.findUnique({
            where: {
                productId_shopId: {
                    productId: item.productId,
                    shopId: exisitingOrder.shopId,
                },
            },
        });

        if (!inventory) {
            throw new AppError(
                404,
                `No inventory found for product ${item.productId} in shop ${exisitingOrder.shopId}`,
                ERROR_CODE.NOT_FOUND,
            );
        }
    }

    return await prisma.$transaction(async (tx) => {
        const order = await tx.purchaseOrder.update({
            where: {
                id,
            },
            data: {
                arrived: true,
            },
            include: {
                items: true,
            },
        });

        for (const item of order.items) {
            await incrementInventory(
                tx,
                { productId: item.productId, incrementBy: item.quantity },
                order.shopId,
            );
        }

        return order;
    });
}

export async function deletePurchaseOrder(id: PurchaseOrderIdInput['id']) {
    const order = await findById(id);

    if (!order) throw new AppError(404, 'Order not found with this id', ERROR_CODE.NOT_FOUND);

    await prisma.purchaseOrder.delete({
        where: {
            id,
        },
    });

    return true;
}
