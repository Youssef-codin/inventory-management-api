import { Decimal } from "@prisma/client/runtime/client";
import { AppError } from "../../errors/AppError";
import { ERROR_CODE } from "../../middleware/errorHandler";
import { prisma } from "../../util/prisma";
import { CreateCustomerOrderInput, UpdateCustomerOrderInput } from "./customerorder.schema";

async function findById(id: string) {
    return await prisma.customerOrder.findUnique({
        where: {
            id
        }
    });
}

export async function getCustomerOrderById(id: string) {
    const order = await findById(id);

    if (!order)
        throw new AppError(404, "Customer order with this ID does not exist", ERROR_CODE.NOT_FOUND);

    return order;
}

export async function getAllCustomerOrders() {
    return prisma.customerOrder.findMany();
}

export async function createCustomerOrder(data: CreateCustomerOrderInput) {

    const productIds = data.items.map(item => item.productId);
    const products = await prisma.product.findMany({
        where: {
            id: {
                in: productIds
            }
        },
    });

    if (products.length !== productIds.length) {
        throw new AppError(404, "One or more products not found", ERROR_CODE.NOT_FOUND);
    }

    const total = data.items.reduce((sum, e) => {
        return sum + (e.quantity * e.unitPrice.toNumber());
    }, 0);

    return await prisma.customerOrder.create({
        data: {
            //TODO: check adminId in controller with Token
            adminId: data.adminId,
            orderDate: data.orderDate || new Date(),
            totalAmount: new Decimal(total),
            items: {
                create: data.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: new Decimal(item.unitPrice),
                })),
            },
        },
        include: {
            items: true,
        },
    });
}

export async function updateCustomerOrder(id: string, data: UpdateCustomerOrderInput) {
    const exists = await findById(id);

    if (!exists)
        throw new AppError(404, "Customer order by this ID does not exist", ERROR_CODE.NOT_FOUND);

    const productIds = data.items.map(item => item.productId);
    const products = await prisma.product.findMany({
        where: {
            id: {
                in: productIds
            }
        },
    });

    if (products.length !== productIds.length) {
        throw new AppError(404, "One or more products not found", ERROR_CODE.NOT_FOUND);
    }

    const total = data.items.reduce((sum, e) => {
        return sum + (e.quantity * e.unitPrice.toNumber());
    }, 0);

    return await prisma.customerOrder.update({
        where: {
            id
        },
        data: {
            //TODO: check adminId in controller with Token
            adminId: data.adminId,
            orderDate: data.orderDate || new Date(),
            totalAmount: new Decimal(total),
            items: {
                deleteMany: {},
                create: data.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: new Decimal(item.unitPrice),
                })),
            },
        },
        include: {
            items: true,
        },
    });
}

export async function deleteCustomerOrder(id: string) {
    const order = await findById(id);
    if (!order)
        throw new AppError(404, "Customer order with this ID does not exist", ERROR_CODE.NOT_FOUND);

    await prisma.customerOrder.delete({
        where: {
            id
        }
    });
    return true;
}
