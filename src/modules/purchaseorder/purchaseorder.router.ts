import { Router } from "express";
import { validate } from "../../middleware/validate";
import { CreatePurchaseOrderSchema, PurchaseOrderIdSchema, UpdatePurchaseOrderSchema } from "./purchaseorder.schema";
import { createPurchaseOrderHandler, deletePurchaseOrderHandler, getPurchaseOrderByIdHandler, orderArrivedHandler, updatePurchaseOrderHandler } from "./purchaseorder.controller";
import { inBody, inParams } from "../../util/schema.helper";

const purchaseOrderRouter = Router();

purchaseOrderRouter.post("/add", validate(inBody(CreatePurchaseOrderSchema)), createPurchaseOrderHandler);
purchaseOrderRouter.get("/:id", validate(inParams(PurchaseOrderIdSchema)), getPurchaseOrderByIdHandler);
purchaseOrderRouter.put("/:id", validate(inParams(PurchaseOrderIdSchema)), validate(inBody(UpdatePurchaseOrderSchema)), updatePurchaseOrderHandler);
purchaseOrderRouter.patch("/:id", validate(inParams(PurchaseOrderIdSchema)), orderArrivedHandler)
purchaseOrderRouter.delete("/:id", validate(inParams(PurchaseOrderIdSchema)), deletePurchaseOrderHandler);

export default purchaseOrderRouter;
