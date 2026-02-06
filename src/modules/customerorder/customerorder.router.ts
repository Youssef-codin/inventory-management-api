import { Router } from "express";
import { validate } from "../../middleware/validate";
import { createCustomerOrderHandler, deleteCustomerOrderHandler, getCustomerOrderByIdHandler, updateCustomerOrderHandler } from "./customerorder.controller";
import { CreateCustomerOrderSchema, CustomerOrderIdSchema, UpdateCustomerOrderSchema } from "./customerorder.schema";
import { inBody, inParams } from "../../util/schema.helper";

const customerOrderRouter = Router();

customerOrderRouter.post("/add", validate(inBody(CreateCustomerOrderSchema)), createCustomerOrderHandler);
customerOrderRouter.get("/:id", validate(inParams(CustomerOrderIdSchema)), getCustomerOrderByIdHandler);
customerOrderRouter.put("/:id", validate(inParams(CustomerOrderIdSchema)), validate(inBody(UpdateCustomerOrderSchema)), updateCustomerOrderHandler);
customerOrderRouter.delete("/:id", validate(inParams(CustomerOrderIdSchema)), deleteCustomerOrderHandler);

export default customerOrderRouter;
