import type { Request, Response } from 'express';
import { ok, respond } from '../../util/apiresponse';
import type { CredentialsInput } from './auth.schema';
import { login } from './auth.service';

export async function loginHandler(req: Request<{}, {}, CredentialsInput>, res: Response) {
    const token = await login(req.body);
    return respond(res, 200, ok(token));
}
