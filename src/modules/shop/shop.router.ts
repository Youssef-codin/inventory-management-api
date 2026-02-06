import { Router } from 'express';
import { validate } from '../../middleware/validate';
import {
    createShopHandler,
    deleteShopHandler,
    getAllShopsHandler,
    getShopByIdHandler,
    updateShopHandler,
} from './shop.controller';
import {
    CreateShopSchema,
    ShopIdSchema,
    UpdateShopSchema,
} from './shop.schema';
import { inBody, inParams } from '../../util/schema.helper';

const shopRouter = Router();
shopRouter.get('/', getAllShopsHandler);
shopRouter.post('/add', validate(inBody(CreateShopSchema)), createShopHandler);
shopRouter.get('/:id', validate(inParams(ShopIdSchema)), getShopByIdHandler);

shopRouter.put(
    '/:id',
    validate(inParams(ShopIdSchema)),
    validate(inBody(UpdateShopSchema)),
    updateShopHandler,
);
shopRouter.delete('/:id', validate(inParams(ShopIdSchema)), deleteShopHandler);

export default shopRouter;
