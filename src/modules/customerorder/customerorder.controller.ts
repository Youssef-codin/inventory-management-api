import type { Request, Response } from 'express';
import { AppError } from '../../errors/AppError';
import { ERROR_CODE } from '../../middleware/errorHandler';
import { ok, respond } from '../../util/apiresponse';
import type {
    CreateCustomerOrderInput,
    CustomerOrderIdInput,
    UpdateCustomerOrderInput,
} from './customerorder.schema';
import {
    createCustomerOrder,
    deleteCustomerOrder,
    getCustomerOrderById,
    updateCustomerOrder,
} from './customerorder.service';

export async function getCustomerOrderByIdHandler(req: Request<CustomerOrderIdInput>, res: Response) {
    const getId = req.params.id;

    const customerOrder = await getCustomerOrderById(getId);
    return respond(res, 200, ok(customerOrder));
}

export async function createCustomerOrderHandler(
    req: Request<{}, {}, CreateCustomerOrderInput>,
    res: Response,
) {
    const reqAdminId = res.locals.id;

    const customerOrderInput = req.body;

    const newCustomerOrder = await createCustomerOrder(reqAdminId, customerOrderInput);
    return respond(res, 201, ok(newCustomerOrder));
}

export async function updateCustomerOrderHandler(
    req: Request<CustomerOrderIdInput, {}, UpdateCustomerOrderInput>,
    res: Response,
) {
    const reqAdminId = res.locals.id;
    if (reqAdminId !== req.body.adminId)
        throw new AppError(
            403,
            'Unauthorized: cannot create customer order for another admin.',
            ERROR_CODE.UNAUTHORIZED,
        );

    const customerOrderInput = req.body;
    const id = req.params.id;

    const updatedCustomerOrder = await updateCustomerOrder(reqAdminId, id, customerOrderInput);
    return respond(res, 200, ok(updatedCustomerOrder));
}

export async function deleteCustomerOrderHandler(req: Request<CustomerOrderIdInput>, res: Response) {
    await deleteCustomerOrder(req.params.id);
    return res.status(204).send();
}
