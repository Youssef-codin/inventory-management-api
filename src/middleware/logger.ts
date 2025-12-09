import pino from "pino";
import { Request, Response, NextFunction } from "express";

export const logger = pino({ transport: { target: "pino-pretty", options: { colorize: true } } });

export default function log(req: Request, res: Response, next: NextFunction) {
    logger.info({ method: req.method, url: req.url });
    next();
}
