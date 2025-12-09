import { Request, Response, NextFunction } from 'express';
import zod, { ZodType } from 'zod';
import { ERROR_CODE, getErrorMessage } from './errorHandler';
import { fail } from '../util/apiresponse';

export const validate =
    (schema: ZodType) =>
        (req: Request, res: Response, next: NextFunction) => {
            try {
                schema.parse({
                    params: req.params,
                    body: req.body,
                    query: req.query,
                });
                return next();
            } catch (e: unknown) {
                return res.status(400).json(fail(getErrorMessage(e), ERROR_CODE.VALIDATION_FAILED));
            }
        };
