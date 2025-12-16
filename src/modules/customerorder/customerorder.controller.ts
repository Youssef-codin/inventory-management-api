import { ok, respond } from "../../util/apiresponse";
import { Request, Response } from "express";
import { CreateCustomerOrderInput, DeleteCustomerOrderInput, GetCustomerOrderByIdInput, UpdateCustomerOrderInput, UpdateCustomerOrderParamsInput } from "./customerorder.schema";
import { createCustomerOrder, deleteCustomerOrder, getCustomerOrderById, updateCustomerOrder } from "./customerorder.service";

export async function getCustomerOrderByIdHandler(req: Request<GetCustomerOrderByIdInput>, res: Response) {
    const getId = req.params.id;

    const customerOrder = await getCustomerOrderById(getId);
    return respond(res, 200, ok(customerOrder));
}

export async function createCustomerOrderHandler(req: Request<{}, {}, CreateCustomerOrderInput>, res: Response) {
    const customerOrderInput = req.body;

    const newCustomerOrder = await createCustomerOrder(customerOrderInput);
    return respond(res, 201, ok(newCustomerOrder));
}

export async function updateCustomerOrderHandler(req: Request<UpdateCustomerOrderParamsInput, {}, UpdateCustomerOrderInput>, res: Response) {
    const customerOrderInput = req.body;
    const id = req.params.id;

    const updatedCustomerOrder = await updateCustomerOrder(id, customerOrderInput);
    return respond(res, 200, ok(updatedCustomerOrder));
}

export async function deleteCustomerOrderHandler(req: Request<DeleteCustomerOrderInput>, res: Response) {
    await deleteCustomerOrder(req.params.id);
    return res.status(204).send();
}
