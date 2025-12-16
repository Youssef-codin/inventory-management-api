import { Router } from "express";
import { validate } from "../../middleware/validate";
import { CreateProductSchema, DeleteProductSchema, GetProductByIdSchema, GetProductByNameSchema, UpdateProductParamsSchema, UpdateProductSchema } from "./product.schema";
import { createProductHandler, deleteProductHandler, getProductByIdHandler, getProductByNameHandler, updateProductHandler } from "./product.controller";

const productRouter = Router();

productRouter.post("/add", validate(CreateProductSchema), createProductHandler);
productRouter.get("/search", validate(GetProductByNameSchema), getProductByNameHandler);
productRouter.get("/:id", validate(GetProductByIdSchema), getProductByIdHandler);
productRouter.put("/:id", validate(UpdateProductParamsSchema), validate(UpdateProductSchema), updateProductHandler);
productRouter.delete("/:id", validate(DeleteProductSchema), deleteProductHandler);

export default productRouter;

