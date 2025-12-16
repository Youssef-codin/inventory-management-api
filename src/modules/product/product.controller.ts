import { ok, respond } from "../../util/apiresponse";
import { Request, Response } from "express"
import { CreateProductInput, DeleteProductInput, GetProductByIdInput as GetProductByIdInput, GetProductByNameInput, UpdateProductInput, UpdateProductParamsInput } from "./product.schema";
import { createProduct, deleteProduct, getProductById, getProductByName, updateProduct } from "./product.service";

export async function getProductByNameHandler(req: Request<{}, {}, {}, GetProductByNameInput>, res: Response) {
    const getName = req.query.name;

    const product = await getProductByName(getName);
    return respond(res, 200, ok(product));
}

export async function getProductByIdHandler(req: Request<GetProductByIdInput>, res: Response) {
    const getId = req.params.id;

    const product = await getProductById(getId);
    return respond(res, 200, ok(product));
}

export async function createProductHandler(req: Request<{}, {}, CreateProductInput>, res: Response) {
    const productInput = req.body;

    const newProduct = await createProduct(productInput);
    return respond(res, 201, ok(newProduct));
}

export async function updateProductHandler(req: Request<UpdateProductParamsInput, {}, UpdateProductInput>, res: Response) {
    const id = req.params.id;
    const productInput = req.body;

    const updatedProduct = await updateProduct(id, productInput);
    return respond(res, 200, ok(updatedProduct));
}

export async function deleteProductHandler(req: Request<DeleteProductInput>, res: Response) {
    await deleteProduct(req.params.id);
    return res.status(204).send();
}
