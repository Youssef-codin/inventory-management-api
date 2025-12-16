import { AppError } from "../../errors/AppError";
import { ERROR_CODE } from "../../middleware/errorHandler";
import { CreateAdminInput, UpdateAdminInput } from "./admin.schema";

export async function getAdminById(id: string) {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);
}

export async function getAdminByName(username: string) {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);
}

export async function createAdmin(data: CreateAdminInput) {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);
}

export async function updateAdmin(id: string, data: UpdateAdminInput) {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);
}

export async function deleteAdmin(id: string) {
    throw new AppError(501, "Not implemented", ERROR_CODE.UNKNOWN_ERROR);
}
