import { Request, Response, NextFunction } from "express";
import { ERROR_CODE } from "./errorHandler";
import { AppError } from "../errors/AppError";
import { verifyJWT } from "../util/auth";

export function authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer "))
        throw new AppError(401, "Invalid authorization header", ERROR_CODE.UNAUTHENTICATED);

    const token = req.headers.authorization!.split(" ")[1];
    const decodedId = verifyJWT(token);
    res.locals.user = decodedId;

    next();
}
