import { Router } from "express";
import { validate } from "../../middleware/validate";
import { CreatePurchaseOrderSchema, DeletePurchaseOrderSchema, GetPurchaseOrderByIdSchema, UpdatePurchaseOrderParamsSchema, UpdatePurchaseOrderSchema } from "./purchaseorder.schema";
import { createPurchaseOrderHandler, deletePurchaseOrderHandler, getPurchaseOrderByIdHandler, orderArrivedHandler, updatePurchaseOrderHandler } from "./purchaseorder.controller";

const purchaseOrderRouter = Router();

purchaseOrderRouter.post("/add", validate(CreatePurchaseOrderSchema), createPurchaseOrderHandler);
purchaseOrderRouter.get("/:id", validate(GetPurchaseOrderByIdSchema), getPurchaseOrderByIdHandler);
purchaseOrderRouter.put("/:id", validate(UpdatePurchaseOrderParamsSchema), validate(UpdatePurchaseOrderSchema), updatePurchaseOrderHandler);
purchaseOrderRouter.patch("/:id", validate(UpdatePurchaseOrderParamsSchema), orderArrivedHandler)
purchaseOrderRouter.delete("/:id", validate(DeletePurchaseOrderSchema), deletePurchaseOrderHandler);

export default purchaseOrderRouter;
