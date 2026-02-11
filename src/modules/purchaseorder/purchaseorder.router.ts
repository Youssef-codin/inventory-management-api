import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { inBody, inParams } from '../../util/schema.helper';
import {
    createPurchaseOrderHandler,
    deletePurchaseOrderHandler,
    getPurchaseOrderByIdHandler,
    orderArrivedHandler,
    updatePurchaseOrderHandler,
} from './purchaseorder.controller';
import {
    CreatePurchaseOrderSchema,
    PurchaseOrderIdSchema,
    UpdatePurchaseOrderSchema,
} from './purchaseorder.schema';

const purchaseOrderRouter = Router();

purchaseOrderRouter.post('/', validate(inBody(CreatePurchaseOrderSchema)), createPurchaseOrderHandler);
purchaseOrderRouter.get('/:id', validate(inParams(PurchaseOrderIdSchema)), getPurchaseOrderByIdHandler);
purchaseOrderRouter.put(
    '/:id',
    validate(inParams(PurchaseOrderIdSchema)),
    validate(inBody(UpdatePurchaseOrderSchema)),
    updatePurchaseOrderHandler,
);
purchaseOrderRouter.patch('/:id', validate(inParams(PurchaseOrderIdSchema)), orderArrivedHandler);
purchaseOrderRouter.delete('/:id', validate(inParams(PurchaseOrderIdSchema)), deletePurchaseOrderHandler);

export default purchaseOrderRouter;
