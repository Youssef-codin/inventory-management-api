import { CredentialsInput as CredentialsInput } from './auth.schema';
import { Request, Response } from 'express';
import { login } from './auth.service';
import { ok, respond } from '../../util/apiresponse';

export async function loginHandler(req: Request<{}, {}, CredentialsInput>, res: Response) {
    const token = await login(req.body);
    return respond(res, 200, ok(token));
}
