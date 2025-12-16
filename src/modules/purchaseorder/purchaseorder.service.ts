import { AppError } from "../../errors/AppError";
import { ERROR_CODE } from "../../middleware/errorHandler";
import { CreatePurchaseOrderInput, UpdatePurchaseOrderInput } from "./purchaseorder.schema";

export async function getPurchaseOrderById(id: string) {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);
}

export async function getAllPurchaseOrders() {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);
}

export async function createPurchaseOrder(data: CreatePurchaseOrderInput) {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);
}

export async function updatePurchaseOrder(id: string, data: UpdatePurchaseOrderInput) {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);
}

export async function deletePurchaseOrder(id: string) {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);
}
