import { ok, respond } from "../../util/apiresponse";
import { Request, Response } from "express"
import { CreateProductInput, GetProductByIdInput as GetProductByIdInput, GetProductByNameInput } from "./product.schema";
import { getProductById, getProductByName } from "./product.service";

export async function getProductByNameHandler(req: Request<{}, {}, {}, GetProductByNameInput>, res: Response) {
    const getName = req.query.name;

    const product = await getProductByName(getName);
    return respond(res, 200, ok(product));
}

export async function getProductByIdHandler(req: Request<GetProductByIdInput, {}, {}, {}>, res: Response) {
    const getId = req.params.id;

    const product = await getProductById(getId);
    return respond(res, 200, ok(product));
}

export function createProductHandler(req: Request<{}, {}, CreateProductInput, {}>) {

}

export function updateProductHandler(req: Request) {

}

export function deleteProductHandler() { }
