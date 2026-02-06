import { Router } from "express";
import { validate } from "../../middleware/validate";
import { AdminIdSchema, CreateAdminSchema, GetAdminByNameSchema, UpdateAdminSchema } from "./admin.schema";
import { createAdminHandler, deleteAdminHandler, getAdminByIdHandler, getAdminByNameHandler, getAllAdminsHandler, updateAdminHandler } from "./admin.controller";
import { inBody, inParams, inQuery } from "../../util/schema.helper";

const adminRouter = Router();

adminRouter.get("/", getAllAdminsHandler);
adminRouter.post("/add", validate(inBody(CreateAdminSchema)), createAdminHandler);
adminRouter.get("/search", validate(inQuery(GetAdminByNameSchema)), getAdminByNameHandler);
adminRouter.get("/:id", validate(inParams(AdminIdSchema)), getAdminByIdHandler);
adminRouter.put("/:id", validate(inParams(AdminIdSchema)), validate(inBody(UpdateAdminSchema)), updateAdminHandler);
adminRouter.delete("/:id", validate(inParams(AdminIdSchema)), deleteAdminHandler);

export default adminRouter;
