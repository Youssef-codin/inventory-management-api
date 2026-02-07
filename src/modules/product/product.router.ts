import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { inBody, inParams, inQuery } from '../../util/schema.helper';
import {
    createProductHandler,
    deleteProductHandler,
    getAllProductsHandler,
    getLowStockProductsHandler,
    getProductByIdHandler,
    getProductByNameHandler,
    patchProductStockHandler,
    updateProductHandler,
} from './product.controller';
import {
    CreateProductSchema,
    GetProductByNameSchema,
    PatchStockSchema,
    ProductIdSchema,
    UpdateProductSchema,
} from './product.schema';

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
