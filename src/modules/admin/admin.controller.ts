import { ok, respond } from "../../util/apiresponse";
import { Request, Response } from "express";
import { CreateAdminInput, DeleteAdminInput, GetAdminByIdInput, GetAdminByNameInput, UpdateAdminInput, UpdateAdminParamsInput } from "./admin.schema";
import { createAdmin, deleteAdmin, getAdminById, getAdminByName, updateAdmin } from "./admin.service";

export async function getAdminByNameHandler(req: Request<{}, {}, {}, GetAdminByNameInput>, res: Response) {
    const getName = req.query.username;

    const admin = await getAdminByName(getName);
    return respond(res, 200, ok(admin));
}

export async function getAdminByIdHandler(req: Request<GetAdminByIdInput>, res: Response) {
    const getId = req.params.id;

    const admin = await getAdminById(getId);
    return respond(res, 200, ok(admin));
}

export async function createAdminHandler(req: Request<{}, {}, CreateAdminInput>, res: Response) {
    const adminInput = req.body;

    const newAdmin = await createAdmin(adminInput);
    return respond(res, 201, ok(newAdmin));
}

export async function updateAdminHandler(req: Request<UpdateAdminParamsInput, {}, UpdateAdminInput>, res: Response) {
    const adminInput = req.body;
    const id = req.params.id;

    const updatedAdmin = await updateAdmin(id, adminInput);
    return respond(res, 200, ok(updatedAdmin));
}

export async function deleteAdminHandler(req: Request<DeleteAdminInput>, res: Response) {
    await deleteAdmin(req.params.id);
    return res.status(204).send();
}
