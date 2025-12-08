import { Request, Response, NextFunction } from "express";
import { ZodObject } from "zod";
import { fail } from "../validation/api/ApiResponse";
import { ERROR_CODE, getErrorMessage } from "./errorHandler";

export const validate =
    (schema: ZodObject) =>
        (req: Request, res: Response, next: NextFunction) => {
            try {
                schema.parse({
                    params: req.params,
                    body: req.body,
                    query: req.query,
                });

                return next();
            } catch (e: any) {
                return res.status(400)
                    .json(fail(getErrorMessage(e),
                        ERROR_CODE.VALIDATION_FAILED));
            }
        };
