import type { NextFunction, Request, Response } from 'express';
import pino from 'pino';

export const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
        },
    },
});

export default function log(req: Request, res: Response, next: NextFunction) {
    logger.info({
        method: req.method,
        url: req.url,
    });
    next();
}
