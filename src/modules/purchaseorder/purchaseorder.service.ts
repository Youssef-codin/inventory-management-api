import { AppError } from "../../errors/AppError";
import { ERROR_CODE } from "../../middleware/errorHandler";
import { prisma } from "../../util/prisma";
import { CreatePurchaseOrderInput, UpdatePurchaseOrderInput } from "./purchaseorder.schema";

async function findById(id: string) {
    return await prisma.purchaseOrder.findUnique({
        where: {
            id
        }, include: {
            items: true
        }
    });
}

export async function getPurchaseOrderById(id: string) {
    const order = await findById(id);

    if (!order)
        throw new AppError(404, "Order not found with this id", ERROR_CODE.NOT_FOUND);

    return order;
}

export async function getAllPurchaseOrders() {
    return await prisma.purchaseOrder.findMany();
}

export async function createPurchaseOrder(data: CreatePurchaseOrderInput) {
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

    return await prisma.purchaseOrder.create({
        data: {
            adminId: data.adminId,
            supplierId: data.supplierId,


        }
    });
}

export async function updatePurchaseOrder(id: string, data: UpdatePurchaseOrderInput) {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);

}

export async function deletePurchaseOrder(id: string) {
    const order = await findById(id);

    if (!order)
        throw new AppError(404, "Order not found with this id", ERROR_CODE.NOT_FOUND);

    await prisma.purchaseOrder.delete({
        where: {
            id
        }
    });

    return true;
}
