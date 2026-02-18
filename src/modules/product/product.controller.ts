import type { Request, Response } from 'express';
import { ok, respond } from '../../util/apiresponse';
import type {
    CreateProductInput,
    GetProductByNameInput,
    PatchStockInput,
    ProductIdInput,
    UpdateProductInput,
} from './product.schema';
import {
    createProduct,
    deleteProduct,
    getAllProducts,
    getLowStockProducts,
    getProductById,
    getProductsByName,
    patchProductStock,
    updateProduct,
} from './product.service';

export async function getAllProductsHandler(_req: Request, res: Response) {
    const products = await getAllProducts();
    return respond(res, 200, ok(products));
}

export async function getLowStockProductsHandler(_req: Request, res: Response) {
    const products = await getLowStockProducts();
    return respond(res, 200, ok(products));
}

export async function patchProductStockHandler(
    req: Request<ProductIdInput, {}, PatchStockInput>,
    res: Response,
) {
    const id = req.params.id;
    const newQuantity = req.body.newQuantity;
    const shopId = req.body.shopid;
    const updatedProduct = await patchProductStock(id, newQuantity, shopId);

    return respond(res, 200, ok(updatedProduct));
}

export async function getProductByNameHandler(
    req: Request<{}, {}, {}, GetProductByNameInput>,
    res: Response,
) {
    const getName = req.query.name;

    const product = await getProductsByName(getName);
    return respond(res, 200, ok(product));
}

export async function getProductByIdHandler(req: Request<ProductIdInput>, res: Response) {
    const getId = req.params.id;

    const product = await getProductById(getId);
    return respond(res, 200, ok(product));
}

export async function createProductHandler(req: Request<{}, {}, CreateProductInput>, res: Response) {
    const productInput = req.body;

    const newProduct = await createProduct(productInput);
    return respond(res, 201, ok(newProduct));
}

export async function updateProductHandler(
    req: Request<ProductIdInput, {}, UpdateProductInput>,
    res: Response,
) {
    const id = req.params.id;
    const productInput = req.body;

    const updatedProduct = await updateProduct(id, productInput);
    return respond(res, 200, ok(updatedProduct));
}

export async function deleteProductHandler(req: Request<ProductIdInput>, res: Response) {
    await deleteProduct(req.params.id);
    return res.status(204).send();
}
