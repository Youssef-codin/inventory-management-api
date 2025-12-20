import { Router } from "express";
import { validate } from "../../middleware/validate";
import { CreateProductSchema, DeleteProductSchema, GetProductByIdSchema, GetProductByNameSchema, UpdateProductParamsSchema, UpdateProductSchema, UpdateStockSchema } from "./product.schema";
import { createProductHandler, deleteProductHandler, getAllProductsHandler, getLowStockProductsHandler, getProductByIdHandler, getProductByNameHandler, updateProductHandler, updateProductStockHandler } from "./product.controller";

const productRouter = Router();

productRouter.post("/add", validate(CreateProductSchema), createProductHandler);
productRouter.get("/", getAllProductsHandler);
productRouter.get("/low-stock", getLowStockProductsHandler);
productRouter.get("/search", validate(GetProductByNameSchema), getProductByNameHandler);
productRouter.get("/:id", validate(GetProductByIdSchema), getProductByIdHandler);
productRouter.put("/:id", validate(UpdateProductParamsSchema), validate(UpdateProductSchema), updateProductHandler);
productRouter.patch("/:id/stock", validate(UpdateProductParamsSchema), validate(UpdateStockSchema), updateProductStockHandler);
productRouter.delete("/:id", validate(DeleteProductSchema), deleteProductHandler);

export default productRouter;

