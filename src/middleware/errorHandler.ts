import { Request, Response, NextFunction } from "express";
import { logger } from "../server";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";
import { fail } from "../dto/api/ApiResponse";

export enum ERROR_CODE {
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
    VALIDATION_FAILED = "VALIDATION_FAILED",
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (error && typeof error === "object" && "message" in error) {
        return String(error.message);
    }
    if (typeof error === "string") {
        return error;
    }

    return "An error occured. Please view logs for more details.";
}

export default function errorHandler(
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (res.headersSent) {
        next(error);
        return;
    }

    let status = 500;
    let message = getErrorMessage(error);
    let code: ERROR_CODE = ERROR_CODE.UNKNOWN_ERROR;

    if (error instanceof AppError) {
        status = error.status;
        code = error.code;
    } else if (error instanceof ZodError) {
        status = 400;
        message = "Validation failed"
        code = ERROR_CODE.VALIDATION_FAILED;
    }

    else {
        logger.error({ err: error, path: req.path }, "Unhandled Error");
    }

    res.status(status).json(fail(message, code));
}
