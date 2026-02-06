import { Decimal } from '@prisma/client/runtime/client';
import { AppError } from '../../errors/AppError';
import { ERROR_CODE } from '../../middleware/errorHandler';
import { prisma } from '../../util/prisma';
import {
    CreateCustomerOrderInput,
    UpdateCustomerOrderInput,
    CustomerOrderIdInput,
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
    return prisma.customerOrder.findMany({
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

    const itemQuantity = data.items.map((item) => ({
        id: item.productId,
        quantity: item.quantity,
    }));

    products.forEach((prod) => {
        const item = itemQuantity.find((i) => i.id === prod.id);
        if (item!.quantity > prod.stockQuantity)
            throw new AppError(400, 'Insufficient Stock for customer Order', ERROR_CODE.INSUFFICIENT_STOCK);
    });

    const total = products.reduce((sum, prod) => {
        const item = itemQuantity.find((i) => i.id === prod.id);
        return sum + item!.quantity * prod.unitPrice.toNumber();
    }, 0);

    const order = await prisma.$transaction(async (tx) => {
        const order = await tx.customerOrder.create({
            data: {
                adminId: data.adminId,
                orderDate: data.orderDate || new Date(),
                totalAmount: new Decimal(total),
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

        for (const item of data.items) {
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stockQuantity: {
                        decrement: item.quantity,
                    },
                },
            });
        }

        return order;
    });

    const lowStockProductIds = await prisma.product.findMany({
        where: {
            stockQuantity: {
                lte: prisma.product.fields.reorderLevel,
            },
        },
        select: {
            id: true,
        },
    });

    return {
        order,
        lowStockProductIds,
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
            'Unauthorized: cannot create customer order for another admin.',
            ERROR_CODE.UNAUTHORIZED,
        );

    const exists = await findById(id);

    if (!exists) throw new AppError(404, 'Customer order by this ID does not exist', ERROR_CODE.NOT_FOUND);

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

    const total = data.items.reduce((sum, item) => {
        return sum + item.quantity * products.find((p) => p.id === item.productId)!.unitPrice.toNumber();
    }, 0);

    return await prisma.customerOrder.update({
        where: {
            id,
        },
        data: {
            adminId: data.adminId,
            orderDate: data.orderDate || new Date(),
            totalAmount: new Decimal(total),
            items: {
                deleteMany: {},
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
}

export async function deleteCustomerOrder(id: CustomerOrderIdInput['id']) {
    const order = await findById(id);
    if (!order) throw new AppError(404, 'Customer order with this ID does not exist', ERROR_CODE.NOT_FOUND);

    await prisma.customerOrder.delete({
        where: {
            id,
        },
    });
    return true;
}
