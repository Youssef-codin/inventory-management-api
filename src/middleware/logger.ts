import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { NextFunction, Request, Response } from 'express';
import pino from 'pino';

const logDir = resolve(process.cwd(), 'logs');
mkdirSync(logDir, { recursive: true });

export const logger = pino({
    transport: {
        targets: [
            {
                target: 'pino-pretty',
                options: { colorize: true },
                level: 'info',
            },
            {
                target: 'pino/file',
                options: { destination: resolve(logDir, 'error.log'), mkdir: true },
                level: 'error',
            },
        ],
    },
});

export default function log(req: Request, res: Response, next: NextFunction) {
    logger.info({
        method: req.method,
        url: req.url,
    });
    next();
}
