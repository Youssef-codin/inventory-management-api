import { AppError } from "../../errors/AppError";
import { ERROR_CODE } from "../../middleware/errorHandler";
import { CreateSupplierInput, UpdateSupplierInput } from "./supplier.schema";

export async function getSupplierById(id: string) {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);
}

export async function getAllSuppliers() {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);
}

export async function createSupplier(data: CreateSupplierInput) {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);
}

export async function updateSupplier(id: string, data: UpdateSupplierInput) {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);
}

export async function deleteSupplier(id: string) {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);
}
