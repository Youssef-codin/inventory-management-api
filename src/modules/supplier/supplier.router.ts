import { Router } from "express";
import { validate } from "../../middleware/validate";
import { CreateSupplierSchema, DeleteSupplierSchema, GetSupplierByIdSchema, UpdateSupplierParamsSchema, UpdateSupplierSchema } from "./supplier.schema";
import { createSupplierHandler, deleteSupplierHandler, getAllSuppliersHandler, getSupplierByIdHandler, updateSupplierHandler } from "./supplier.controller";

const supplierRouter = Router();

supplierRouter.get("/", getAllSuppliersHandler);
supplierRouter.post("/add", validate(CreateSupplierSchema), createSupplierHandler);
supplierRouter.get("/:id", validate(GetSupplierByIdSchema), getSupplierByIdHandler);
supplierRouter.put("/:id", validate(UpdateSupplierParamsSchema), validate(UpdateSupplierSchema), updateSupplierHandler);
supplierRouter.delete("/:id", validate(DeleteSupplierSchema), deleteSupplierHandler);

export default supplierRouter;
