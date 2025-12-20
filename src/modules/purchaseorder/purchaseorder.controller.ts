import { ok, respond } from "../../util/apiresponse";
import { Request, Response } from "express";
import { CreatePurchaseOrderInput, DeletePurchaseOrderInput, GetPurchaseOrderByIdInput, UpdatePurchaseOrderInput, UpdatePurchaseOrderParamsInput } from "./purchaseorder.schema";
import { createPurchaseOrder, deletePurchaseOrder, getPurchaseOrderById, updatePurchaseOrder } from "./purchaseorder.service";
import { AppError } from "../../errors/AppError";
import { ERROR_CODE } from "../../middleware/errorHandler";

export async function getPurchaseOrderByIdHandler(req: Request<GetPurchaseOrderByIdInput>, res: Response) {
    const getId = req.params.id;

    const purchaseOrder = await getPurchaseOrderById(getId);
    return respond(res, 200, ok(purchaseOrder));
}

export async function createPurchaseOrderHandler(req: Request<{}, {}, CreatePurchaseOrderInput>, res: Response) {
    const reqAdminId = res.locals.id;

    const purchaseOrderInput = req.body;

    const newPurchaseOrder = await createPurchaseOrder(reqAdminId, purchaseOrderInput);
    return respond(res, 201, ok(newPurchaseOrder));
}

export async function updatePurchaseOrderHandler(req: Request<UpdatePurchaseOrderParamsInput, {}, UpdatePurchaseOrderInput>, res: Response) {
    const reqAdminId = res.locals.id;
    if (reqAdminId !== req.body.adminId)
        throw new AppError(403, "Unauthorized: cannot create purchase order for another admin.", ERROR_CODE.UNAUTHORIZED)

    const purchaseOrderInput = req.body;
    const id = req.params.id;

    const updatedPurchaseOrder = await updatePurchaseOrder(reqAdminId, id, purchaseOrderInput);
    return respond(res, 200, ok(updatedPurchaseOrder));
}

export async function deletePurchaseOrderHandler(req: Request<DeletePurchaseOrderInput>, res: Response) {
    await deletePurchaseOrder(req.params.id);
    return res.status(204).send();
}
