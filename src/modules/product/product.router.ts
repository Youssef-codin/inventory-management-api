import { Router } from 'express';
import { validate } from '../../middleware/validate';
import {
    CreateProductSchema,
    UpdateProductSchema,
    PatchStockSchema,
    GetProductByNameSchema,
    ProductIdSchema,
} from './product.schema';
import {
    createProductHandler,
    deleteProductHandler,
    getAllProductsHandler,
    getLowStockProductsHandler,
    getProductByIdHandler,
    getProductByNameHandler,
    updateProductHandler,
    patchProductStockHandler as patchProductStockHandler,
} from './product.controller';
import { inBody, inParams, inQuery } from '../../util/schema.helper';

const productRouter = Router();

productRouter.post('/add', validate(inBody(CreateProductSchema)), createProductHandler);
productRouter.get('/', getAllProductsHandler);
productRouter.get('/low-stock', getLowStockProductsHandler);
productRouter.get('/search', validate(inQuery(GetProductByNameSchema)), getProductByNameHandler);
productRouter.get('/:id', validate(inParams(ProductIdSchema)), getProductByIdHandler);
productRouter.put(
    '/:id',
    validate(inParams(ProductIdSchema)),
    validate(inBody(UpdateProductSchema)),
    updateProductHandler,
);
productRouter.patch(
    '/:id/stock',
    validate(inParams(ProductIdSchema)),
    validate(inBody(PatchStockSchema)),
    patchProductStockHandler,
);
productRouter.delete('/:id', validate(inParams(ProductIdSchema)), deleteProductHandler);

export default productRouter;
