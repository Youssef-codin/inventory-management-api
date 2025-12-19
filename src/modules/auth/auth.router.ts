import { Router } from "express";
import { validate } from "../../middleware/validate";
import { CredentialsSchema } from "./auth.schema";
import { loginHandler } from "./auth.controller";

const authRouter = Router();

authRouter.post('/login', validate(CredentialsSchema), loginHandler);

export default authRouter;
