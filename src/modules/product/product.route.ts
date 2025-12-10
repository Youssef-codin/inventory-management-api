import { Router } from "express";
import { validate } from "../../middleware/validate";
import { GetProductByIdSchema, GetProductByNameSchema } from "./product.schema";
import { getProductByIdHandler, getProductByNameHandler } from "./product.controller";

const productRouter = Router();

productRouter.get("/search", validate(GetProductByNameSchema), getProductByNameHandler);
productRouter.get("/:id", validate(GetProductByIdSchema), getProductByIdHandler);

export default productRouter;

