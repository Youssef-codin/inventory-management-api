import { prisma } from "../../util/prisma";
import { CreateProductInput } from "./product.schema";

export async function getProductById(id: string) {
    return await prisma.product.findUnique({
        where: {
            id: id,
        },
        omit: {
            id: true
        }
    });

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
