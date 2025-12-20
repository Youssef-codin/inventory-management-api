import { Router } from "express";
import { validate } from "../../middleware/validate";
import { CreateAdminSchema, DeleteAdminSchema, GetAdminByIdSchema, GetAdminByNameSchema, UpdateAdminParamsSchema, UpdateAdminSchema } from "./admin.schema";
import { createAdminHandler, deleteAdminHandler, getAdminByIdHandler, getAdminByNameHandler, getAllAdminsHandler, updateAdminHandler } from "./admin.controller";

const adminRouter = Router();

adminRouter.get("/", getAllAdminsHandler);
adminRouter.post("/add", validate(CreateAdminSchema), createAdminHandler);
adminRouter.get("/search", validate(GetAdminByNameSchema), getAdminByNameHandler);
adminRouter.get("/:id", validate(GetAdminByIdSchema), getAdminByIdHandler);
adminRouter.put("/:id", validate(UpdateAdminParamsSchema), validate(UpdateAdminSchema), updateAdminHandler);
adminRouter.delete("/:id", validate(DeleteAdminSchema), deleteAdminHandler);

export default adminRouter;
