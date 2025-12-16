import { AppError } from "../../errors/AppError";
import { ERROR_CODE } from "../../middleware/errorHandler";
import { CreateCustomerOrderInput, UpdateCustomerOrderInput } from "./customerorder.schema";

export async function getCustomerOrderById(id: string) {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);
}

export async function getAllCustomerOrders() {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);
}

export async function createCustomerOrder(data: CreateCustomerOrderInput) {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);
}

export async function updateCustomerOrder(id: string, data: UpdateCustomerOrderInput) {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);
}

export async function deleteCustomerOrder(id: string) {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);
}
