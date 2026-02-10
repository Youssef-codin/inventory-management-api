import { includes } from 'zod';
import { AppError } from '../../errors/AppError';
import { ERROR_CODE } from '../../middleware/errorHandler';
import { prisma } from '../../util/prisma';
import type {
    CreateProductInput,
    PatchStockInput,
    ProductIdInput,
    UpdateProductInput,
} from './product.schema';
import { getLowStock } from '../shared/inventory.service';

async function findProductById(id: ProductIdInput['id']) {
    return await prisma.product.findUnique({
        where: {
            id,
        },
    });
}

export async function getProductById(id: ProductIdInput['id']) {
    const productToRtrn = await findProductById(id);

    if (!productToRtrn) {
        throw new AppError(404, 'Product with such ID not found', ERROR_CODE.NOT_FOUND);
    }

    return productToRtrn;
}

export async function getAllProducts() {
    return await prisma.product.findMany();
}

export async function getLowStockProducts() {
    return await getLowStock();
}

export async function getProductByName(search: string) {
    return await prisma.product.findMany({
        where: {
            name: {
                contains: search,
                mode: 'insensitive',
            },
        },
    });
}

export async function createProduct(data: CreateProductInput) {
    return await prisma.product.create({
        data: {
            name: data.name,
            category: data.category,
            unitPrice: data.unitPrice,
            reorderLevel: data.reorderLevel,
            inventories: {
                create: data.inventories.map((inv) => ({
                    shopId: inv.shopId,
                    quantity: inv.quantity,
                })),
            },
        },
        include: {
            inventories: true,
        },
    });
}

export async function updateProduct(id: ProductIdInput['id'], data: UpdateProductInput) {
    const productToUpdate = await findProductById(id);

    if (!productToUpdate) {
        throw new AppError(404, 'Product with such ID not found', ERROR_CODE.NOT_FOUND);
    }

    return await prisma.$transaction(async (tx) => {
        await tx.inventory.deleteMany({
            where: { productId: id },
        });

        return await tx.product.update({
            where: { id },
            data: {
                name: data.name,
                category: data.category,
                unitPrice: data.unitPrice,
                reorderLevel: data.reorderLevel,

                inventories: {
                    create: data.inventories.map((inv) => ({
                        shopId: inv.shopId,
                        quantity: inv.quantity,
                    })),
                },
            },
            include: { inventories: true },
        });
    });
}

export async function patchProductStock(
    productId: ProductIdInput['id'],
    newQuantity: PatchStockInput['newQuantity'],
    shopId: PatchStockInput['shopid'],
) {
    const product = await findProductById(productId);

    if (!product) {
        throw new AppError(404, 'Product with such ID not found', ERROR_CODE.NOT_FOUND);
    }

    const existingInventory = await prisma.inventory.findUnique({
        where: {
            productId_shopId: {
                productId,
                shopId,
            },
        },
    });

    if (existingInventory) {
        return await prisma.inventory.update({
            where: {
                productId_shopId: {
                    productId,
                    shopId,
                },
            },
            data: {
                quantity: newQuantity < 0 ? 0 : newQuantity, // extra safeguard against negative quantity
            },
        });
    }

    return await prisma.inventory.create({
        data: {
            productId,
            shopId,
            quantity: newQuantity,
        },
    });
}

export async function deleteProduct(id: ProductIdInput['id']) {
    const productToDelete = await findProductById(id);

    if (!productToDelete) {
        throw new AppError(404, 'Product with such ID not found', ERROR_CODE.NOT_FOUND);
    }

    await prisma.product.delete({
        where: {
            id,
        },
    });

    return true;
}
