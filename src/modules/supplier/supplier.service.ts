import { AppError } from '../../errors/AppError';
import { ERROR_CODE } from '../../middleware/errorHandler';
import { prisma } from '../../util/prisma';
import type {
    CreateSupplierInput,
    GetSupplierByProductIdInput,
    SupplierIdInput,
    UpdateSupplierInput,
} from './supplier.schema';

async function findSupplierById(id: SupplierIdInput['id']) {
    return await prisma.supplier.findUnique({
        where: {
            id,
        },
    });
}

export async function getSuppliersByProduct(productId: GetSupplierByProductIdInput['productId']) {
    return await prisma.supplier.findMany({
        where: {
            purchaseOrders: {
                some: {
                    items: {
                        some: {
                            productId,
                        },
                    },
                },
            },
        },
    });
}

export async function getSupplierById(id: SupplierIdInput['id']) {
    const supplier = await findSupplierById(id);

    if (!supplier) throw new AppError(404, 'Supplier not found', ERROR_CODE.NOT_FOUND);

    return supplier;
}

export async function getAllSuppliers() {
    return await prisma.supplier.findMany();
}

export async function createSupplier(data: CreateSupplierInput) {
    return await prisma.supplier.create({
        data,
    });
}

export async function updateSupplier(id: SupplierIdInput['id'], data: UpdateSupplierInput) {
    const exists = await findSupplierById(id);

    if (!exists) throw new AppError(404, 'Supplier not found', ERROR_CODE.NOT_FOUND);

    return await prisma.supplier.update({
        where: {
            id,
        },
        data,
    });
}

export async function deleteSupplier(id: SupplierIdInput['id']) {
    const exists = await findSupplierById(id);

    if (!exists) throw new AppError(404, 'Supplier not found', ERROR_CODE.NOT_FOUND);

    await prisma.supplier.delete({
        where: {
            id,
        },
    });

    return true;
}
