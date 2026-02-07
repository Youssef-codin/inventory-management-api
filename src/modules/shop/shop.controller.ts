import type { Request, Response } from 'express';
import { ok, respond } from '../../util/apiresponse';
import type { CreateShopInput, ShopIdInputStr, UpdateShopInput } from './shop.schema';
import { createShop, deleteShop, getAllShops, getShopById, updateShop } from './shop.service';

export async function getAllShopsHandler(_req: Request, res: Response) {
    const shops = await getAllShops();
    return respond(res, 200, ok(shops));
}

export async function getShopByIdHandler(req: Request<ShopIdInputStr>, res: Response) {
    const id = Number(req.params.id);

    const shop = await getShopById(id);
    return respond(res, 200, ok(shop));
}

export async function createShopHandler(req: Request<{}, {}, CreateShopInput>, res: Response) {
    const shopInput = req.body;

    const newShop = await createShop(shopInput);
    return respond(res, 201, ok(newShop));
}

export async function updateShopHandler(req: Request<ShopIdInputStr, {}, UpdateShopInput>, res: Response) {
    const shopInput = req.body;
    const id = Number(req.params.id);

    const updatedShop = await updateShop(id, shopInput);
    return respond(res, 200, ok(updatedShop));
}

export async function deleteShopHandler(req: Request<ShopIdInputStr>, res: Response) {
    await deleteShop(Number(req.params.id));
    return res.status(204).send();
}
