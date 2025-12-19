import { AppError } from "../../errors/AppError";
import { ERROR_CODE } from "../../middleware/errorHandler";
import { prisma } from "../../util/prisma";
import { CreateProductInput, UpdateProductInput } from "./product.schema";

async function findProductById(id: string) {
    return await prisma.product.findUnique({
        where: {
            id
        },
        omit: {
            id: true
        }
    });
}

export async function getProductById(id: string) {
    const product = findProductById(id);

    if (!product)
        throw new AppError(404, "Product with such ID not found", ERROR_CODE.NOT_FOUND);

    return product;
}

export async function getAllProducts() {
    return await prisma.product.findMany();
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

export async function updateProduct(id: string, data: UpdateProductInput) {
    const productToUpdate = findProductById(id);

    return await prisma.product.update({
        where: {
            id
        },
        data
    });
}

export async function deleteProduct(id: string) {
    const productToDelete = findProductById(id);

    if (!productToDelete)
        throw new AppError(404, "Product with such ID not found", ERROR_CODE.NOT_FOUND);

    await prisma.product.delete({
        where: {
            id
        }
    });

    return true;
}

