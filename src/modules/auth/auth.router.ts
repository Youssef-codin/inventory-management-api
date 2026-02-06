import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { CredentialsSchema } from './auth.schema';
import { loginHandler } from './auth.controller';
import { inBody } from '../../util/schema.helper';

const authRouter = Router();

authRouter.post('/login', validate(inBody(CredentialsSchema)), loginHandler);

export default authRouter;
