import { Router } from "express";
import { validate } from "../../middleware/validate";
import { createCustomerOrderHandler, deleteCustomerOrderHandler, getCustomerOrderByIdHandler, updateCustomerOrderHandler } from "./customerorder.controller";
import { CreateCustomerOrderSchema, DeleteCustomerOrderSchema, GetCustomerOrderByIdSchema, UpdateCustomerOrderParamsSchema, UpdateCustomerOrderSchema } from "./customerorder.schema";

const customerOrderRouter = Router();

customerOrderRouter.post("/add", validate(CreateCustomerOrderSchema), createCustomerOrderHandler);
customerOrderRouter.get("/:id", validate(GetCustomerOrderByIdSchema), getCustomerOrderByIdHandler);
customerOrderRouter.put("/:id", validate(UpdateCustomerOrderParamsSchema), validate(UpdateCustomerOrderSchema), updateCustomerOrderHandler);
customerOrderRouter.delete("/:id", validate(DeleteCustomerOrderSchema), deleteCustomerOrderHandler);

export default customerOrderRouter;
