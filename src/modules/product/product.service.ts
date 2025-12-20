import { AppError } from "../../errors/AppError";
import { ERROR_CODE } from "../../middleware/errorHandler";
import { prisma } from "../../util/prisma";
import { CreateProductInput, DeleteProductInput, GetProductByIdInput, UpdateProductInput, UpdateProductParamsInput, UpdateStockInput } from "./product.schema";

async function findProductById(id: GetProductByIdInput['id']) {
    return await prisma.product.findUnique({
        where: {
            id
        }
    });
}

export async function updateProductStock(id: UpdateProductParamsInput['id'], amount: UpdateStockInput['amount']) {
    const product = await findProductById(id);

    if (!product) {
        throw new AppError(404, "Product with such ID not found", ERROR_CODE.NOT_FOUND);
    }

    return await prisma.product.update({
        where: {
            id
        },
        data: {
            stockQuantity: amount
        }
    });
}

export async function getProductById(id: GetProductByIdInput['id']) {
    const product = await findProductById(id);

    if (!product)
        throw new AppError(404, "Product with such ID not found", ERROR_CODE.NOT_FOUND);

    return product;
}

export async function getAllProducts() {
    return await prisma.product.findMany();
}

export async function getLowStockProducts() {
    return await prisma.product.findMany({
        where: {
            stockQuantity: {
                lte: prisma.product.fields.reorderLevel
            }
        }
    });
}

export async function getProductByName(search: string) {
    return await prisma.product.findMany({
        where: {
            name: {
                contains: search,
                mode: "insensitive"
            }
        }
    });
}

export async function createProduct(data: CreateProductInput) {
    return prisma.product.create({
        data
    });
}

export async function updateProduct(id: UpdateProductParamsInput['id'], data: UpdateProductInput) {
    const productToUpdate = await findProductById(id);

    if (!productToUpdate)
        throw new AppError(404, "Product with such ID not found", ERROR_CODE.NOT_FOUND);

    return await prisma.product.update({
        where: {
            id
        },
        data
    });
}

export async function deleteProduct(id: DeleteProductInput['id']) {
    const productToDelete = await findProductById(id);

    if (!productToDelete)
        throw new AppError(404, "Product with such ID not found", ERROR_CODE.NOT_FOUND);

    await prisma.product.delete({
        where: {
            id
        }
    });

    return true;
}
