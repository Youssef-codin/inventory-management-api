import { AppError } from '../../errors/AppError';
import { ERROR_CODE } from '../../middleware/errorHandler';
import { prisma } from '../../util/prisma';
import { cache } from '../../util/redis';
import { getLowStock } from '../shared/inventory.service';
import type {
    CreateProductInput,
    PatchStockInput,
    ProductIdInput,
    UpdateProductInput,
} from './product.schema';

async function findProductById(id: ProductIdInput['id']) {
    return await prisma.product.findUnique({
        where: {
            id,
        },
    });
}

export async function getProductById(id: ProductIdInput['id']) {
    const cached = await cache.products.get(id);
    if (cached) return cached;

    const productToRtrn = await findProductById(id);
    if (!productToRtrn) {
        throw new AppError(404, 'Product with such ID not found', ERROR_CODE.NOT_FOUND);
    }

    await cache.products.set(id, productToRtrn);
    return productToRtrn;
}

export async function getAllProducts() {
    return await prisma.product.findMany();
}

export async function getLowStockProducts() {
    return await getLowStock();
}

export async function getProductsByName(search: string) {
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

    const result = await prisma.$transaction(async (tx) => {
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

    await cache.products.del(id);
    return result;
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

    let result: {
        productId: string;
        shopId: number;
        quantity: number;
    };
    if (existingInventory) {
        result = await prisma.inventory.update({
            where: {
                productId_shopId: {
                    productId,
                    shopId,
                },
            },
            data: {
                quantity: newQuantity < 0 ? 0 : newQuantity,
            },
        });
    } else {
        result = await prisma.inventory.create({
            data: {
                productId,
                shopId,
                quantity: newQuantity,
            },
        });
    }

    await cache.products.del(productId);
    return result;
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

    await cache.products.del(id);
    return true;
}
