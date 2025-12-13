import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from "../../generated/prisma/client";
import { logger } from "../middleware/logger";
import { QueryEvent } from "../../generated/prisma/internal/prismaNamespace";

const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })
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
    adapter
})

export function logPrismaQuery(event: QueryEvent) {
    const { query, params, duration, target } = event;

    // Try to prettify params for clarity
    let prettyParams = params;
    try {
        prettyParams = JSON.stringify(JSON.parse(params), null, 2);
    } catch {
        // leave as-is
    }

    const message =
        [
            "",
            "┌─── Prisma Query ───────────────────────────────────────",
            `│ Target:   ${target}`,
            `│ Duration: ${duration.toFixed(2)} ms`,
            "│",
            "│ Query:",
            ...query
                .trim()
                .split("\n")
                .map((line) => `│   ${line}`),
            "│",
            `│ Params: ${prettyParams}`,
            "└────────────────────────────────────────────────────────",
            "",
        ].join("\n");

    logger.info(message);
}


prisma.$on('query', (e) => {
    logPrismaQuery(e);
})

prisma.$on('error', (e) => {
    logger.info(e);
})

prisma.$on('info', (e) => {
    logger.info(e);
})

prisma.$on('warn', (e) => {
    logger.info(e);
})

export { prisma }
