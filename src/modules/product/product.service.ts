import { AppError } from "../../errors/AppError";
import { ERROR_CODE } from "../../middleware/errorHandler";
import { prisma } from "../../util/prisma";
import { CreateProductInput } from "./product.schema";

export async function getProductById(id: string) {
    const product = await prisma.product.findUnique({
        where: {
            id: id,
        },
        omit: {
            id: true
        }
    });

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
