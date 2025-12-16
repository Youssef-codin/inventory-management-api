import { ok, respond } from "../../util/apiresponse";
import { Request, Response } from "express";
import { CreateSupplierInput, DeleteSupplierInput, GetSupplierByIdInput, UpdateSupplierInput, UpdateSupplierParamsInput } from "./supplier.schema";
import { createSupplier, deleteSupplier, getSupplierById, updateSupplier } from "./supplier.service";

export async function getSupplierByIdHandler(req: Request<GetSupplierByIdInput>, res: Response) {
    const getId = req.params.id;

    const supplier = await getSupplierById(getId);
    return respond(res, 200, ok(supplier));
}

export async function createSupplierHandler(req: Request<{}, {}, CreateSupplierInput>, res: Response) {
    const supplierInput = req.body;

    const newSupplier = await createSupplier(supplierInput);
    return respond(res, 201, ok(newSupplier));
}

export async function updateSupplierHandler(req: Request<UpdateSupplierParamsInput, {}, UpdateSupplierInput>, res: Response) {
    const supplierInput = req.body;
    const id = req.params.id;

    const updatedSupplier = await updateSupplier(id, supplierInput);
    return respond(res, 200, ok(updatedSupplier));
}

export async function deleteSupplierHandler(req: Request<DeleteSupplierInput>, res: Response) {
    await deleteSupplier(req.params.id);
    return res.status(204).send();
}
