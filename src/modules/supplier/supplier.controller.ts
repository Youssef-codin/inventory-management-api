import { ok, respond } from '../../util/apiresponse';
import { Request, Response } from 'express';
import {
    CreateSupplierInput,
    SupplierIdInput,
    GetSupplierByProductIdInput,
    UpdateSupplierInput,
} from './supplier.schema';
import {
    createSupplier,
    deleteSupplier,
    getAllSuppliers,
    getSupplierById,
    getSuppliersByProduct,
    updateSupplier,
} from './supplier.service';

export async function getAllSuppliersHandler(req: Request, res: Response) {
    const suppliers = await getAllSuppliers();
    return respond(res, 200, ok(suppliers));
}

export async function getSuppliersByProductHandler(
    req: Request<GetSupplierByProductIdInput>,
    res: Response,
) {
    const suppliers = await getSuppliersByProduct(req.params.productId);
    return respond(res, 200, ok(suppliers));
}

export async function getSupplierByIdHandler(
    req: Request<SupplierIdInput>,
    res: Response,
) {
    const getId = req.params.id;

    const supplier = await getSupplierById(getId);
    return respond(res, 200, ok(supplier));
}

export async function createSupplierHandler(
    req: Request<{}, {}, CreateSupplierInput>,
    res: Response,
) {
    const supplierInput = req.body;

    const newSupplier = await createSupplier(supplierInput);
    return respond(res, 201, ok(newSupplier));
}

export async function updateSupplierHandler(
    req: Request<SupplierIdInput, {}, UpdateSupplierInput>,
    res: Response,
) {
    const supplierInput = req.body;
    const id = req.params.id;

    const updatedSupplier = await updateSupplier(id, supplierInput);
    return respond(res, 200, ok(updatedSupplier));
}

export async function deleteSupplierHandler(
    req: Request<SupplierIdInput>,
    res: Response,
) {
    await deleteSupplier(req.params.id);
    return res.status(204).send();
}
