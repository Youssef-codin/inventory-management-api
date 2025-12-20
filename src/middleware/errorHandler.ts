import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError";
import { fail, respond } from "../util/apiresponse";
import { logger } from "./logger";

export enum ERROR_CODE {
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
    VALIDATION_FAILED = "VALIDATION_FAILED",
    NOT_FOUND = "NOT_FOUND",
    UNAUTHENTICATED = "UNAUTHENTICATED",
    USERNAME_TAKEN = "USERNAME_TAKEN",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    UNAUTHORIZED = "UNAUTHORIZED",
    INSUFFICIENT_STOCK = "INSUFFICIENT_STOCK"
}

export function getErrorMessage(error: unknown): string {
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

export default function errorHandler(error: unknown, req: Request, res: Response, next: NextFunction) {
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
    } else if (error instanceof jwt.TokenExpiredError) {
        status = 401;
        message = "Token expired";
        code = ERROR_CODE.UNAUTHENTICATED;
    } else if (error instanceof jwt.JsonWebTokenError) {
        status = 401;
        message = "Invalid token";
        code = ERROR_CODE.UNAUTHENTICATED;
    } else {
        logger.error({ err: error, path: req.path }, "Unhandled Error");
    }

    return respond(res, status, fail(message, code));
}
