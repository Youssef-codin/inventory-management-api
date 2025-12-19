import { CredentialsInput as CredentialsInput } from "./auth.schema";
import { Request, Response } from "express";
import { login, register } from "./auth.service";
import { ok, respond } from "../../util/apiresponse";

export async function loginHandler(req: Request<{}, {}, CredentialsInput>, res: Response) {
    const token = await login(req.body);
    return respond(res, 200, ok(token));
}

export async function registerHandler(req: Request<{}, {}, CredentialsInput>, res: Response) {
    const user = await register(req.body);
    return respond(res, 201, ok(user));
}
