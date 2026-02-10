import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { inBody, inParams } from '../../util/schema.helper';
import {
    createCustomerOrderHandler,
    deleteCustomerOrderHandler,
    getCustomerOrderByIdHandler,
    updateCustomerOrderHandler,
} from './customerorder.controller';
import {
    CreateCustomerOrderSchema,
    CustomerOrderIdSchema,
    UpdateCustomerOrderSchema,
} from './customerorder.schema';

const customerOrderRouter = Router();

customerOrderRouter.get('/:id', validate(inParams(CustomerOrderIdSchema)), getCustomerOrderByIdHandler);
customerOrderRouter.post('/add', validate(inBody(CreateCustomerOrderSchema)), createCustomerOrderHandler);
customerOrderRouter.put(
    '/:id',
    validate(inParams(CustomerOrderIdSchema)),
    validate(inBody(UpdateCustomerOrderSchema)),
    updateCustomerOrderHandler,
);
customerOrderRouter.delete('/:id', validate(inParams(CustomerOrderIdSchema)), deleteCustomerOrderHandler);

export default customerOrderRouter;
