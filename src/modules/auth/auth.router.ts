import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { inBody } from '../../util/schema.helper';
import { loginHandler } from './auth.controller';
import { CredentialsSchema } from './auth.schema';

const authRouter = Router();

authRouter.post('/login', validate(inBody(CredentialsSchema)), loginHandler);

export default authRouter;
