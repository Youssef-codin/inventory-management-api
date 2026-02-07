import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { logger } from '../middleware/logger';
import { QueryEvent } from '../../generated/prisma/internal/prismaNamespace';

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({
    log: [
        {
            emit: 'event',
            level: 'query',
        },
        {
            emit: 'event',
            level: 'error',
        },
        {
            emit: 'event',
            level: 'info',
        },
        {
            emit: 'event',
            level: 'warn',
        },
    ],
    adapter,
});

export function logPrismaQuery(event: QueryEvent) {
    const { query, params, duration } = event;
    const cleanQuery = query.replace(/\s+/g, ' ').trim();
    const message = `[Prisma] ${duration.toFixed(2)}ms | ${cleanQuery} | Params: ${params}`;
    logger.info(message);
}

prisma.$on('query', (e) => {
    logPrismaQuery(e);
});

prisma.$on('error', (e) => {
    logger.error(e);
});

prisma.$on('info', (e) => {
    logger.info(e);
});

prisma.$on('warn', (e) => {
    logger.warn(e);
});

export { prisma };
