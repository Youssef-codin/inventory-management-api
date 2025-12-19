import { Router } from "express";
import { validate } from "../../middleware/validate";
import { CredentialsSchema } from "./auth.schema";
import { loginHandler, registerHandler } from "./auth.controller";

const authRouter = Router();

authRouter.post('/login', validate(CredentialsSchema), loginHandler);
authRouter.post('/register', validate(CredentialsSchema), registerHandler);

export default authRouter;
