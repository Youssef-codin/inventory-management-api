import type { NextFunction, Request, Response } from 'express';
import z from 'zod';
import { fail, respond } from '../util/apiresponse';
import { ERROR_CODE } from './errorHandler';

export function validate(schema: z.ZodObject) {
    function middleware(req: Request, res: Response, next: NextFunction) {
        const result = schema.safeParse({
            params: req.params,
            body: req.body,
            query: req.query,
        });

        if (!result.success) {
            return respond(res, 400, fail(z.prettifyError(result.error), ERROR_CODE.VALIDATION_FAILED));
        }

        next();
    }

    return middleware;
}
