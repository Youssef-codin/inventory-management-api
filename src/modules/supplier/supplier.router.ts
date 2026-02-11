import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { inBody, inParams } from '../../util/schema.helper';
import {
    createSupplierHandler,
    deleteSupplierHandler,
    getAllSuppliersHandler,
    getSupplierByIdHandler,
    getSuppliersByProductHandler,
    updateSupplierHandler,
} from './supplier.controller';
import {
    CreateSupplierSchema,
    GetSupplierByProductIdSchema,
    SupplierIdSchema,
    UpdateSupplierSchema,
} from './supplier.schema';

const supplierRouter = Router();

supplierRouter.get('/', getAllSuppliersHandler);
supplierRouter.post('/', validate(inBody(CreateSupplierSchema)), createSupplierHandler);
supplierRouter.get(
    '/product/:productId',
    validate(inParams(GetSupplierByProductIdSchema)),
    getSuppliersByProductHandler,
);
supplierRouter.get('/:id', validate(inParams(SupplierIdSchema)), getSupplierByIdHandler);
supplierRouter.put(
    '/:id',
    validate(inParams(SupplierIdSchema)),
    validate(inBody(UpdateSupplierSchema)),
    updateSupplierHandler,
);
supplierRouter.delete('/:id', validate(inParams(SupplierIdSchema)), deleteSupplierHandler);

export default supplierRouter;
