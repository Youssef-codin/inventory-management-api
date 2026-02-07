import type { Request, Response } from 'express';
import { ok, respond } from '../../util/apiresponse';
import type {
    CreatePurchaseOrderInput,
    PurchaseOrderIdInput,
    UpdatePurchaseOrderInput,
} from './purchaseorder.schema';
import {
    createPurchaseOrder,
    deletePurchaseOrder,
    getPurchaseOrderById,
    orderArrived,
    updatePurchaseOrder,
} from './purchaseorder.service';

export async function getPurchaseOrderByIdHandler(req: Request<PurchaseOrderIdInput>, res: Response) {
    const getId = req.params.id;

    const purchaseOrder = await getPurchaseOrderById(getId);
    return respond(res, 200, ok(purchaseOrder));
}

export async function createPurchaseOrderHandler(
    req: Request<{}, {}, CreatePurchaseOrderInput>,
    res: Response,
) {
    const reqAdminId = res.locals.id;

    const purchaseOrderInput = req.body;

    const newPurchaseOrder = await createPurchaseOrder(reqAdminId, purchaseOrderInput);
    return respond(res, 201, ok(newPurchaseOrder));
}

export async function updatePurchaseOrderHandler(
    req: Request<PurchaseOrderIdInput, {}, UpdatePurchaseOrderInput>,
    res: Response,
) {
    const reqAdminId = res.locals.id;
    const purchaseOrderInput = req.body;
    const id = req.params.id;

    const updatedPurchaseOrder = await updatePurchaseOrder(reqAdminId, id, purchaseOrderInput);
    return respond(res, 200, ok(updatedPurchaseOrder));
}

export async function orderArrivedHandler(req: Request<PurchaseOrderIdInput>, res: Response) {
    const updated = await orderArrived(req.params.id);
    return respond(res, 200, ok(updated));
}

export async function deletePurchaseOrderHandler(req: Request<PurchaseOrderIdInput>, res: Response) {
    await deletePurchaseOrder(req.params.id);
    return res.status(204).send();
}
