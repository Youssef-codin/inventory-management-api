import { logger } from '../middleware/logger';
import { seedLarge } from '../util/seed.demo';

async function runSeed() {
    try {
        await seedLarge();
        logger.info('Large dataset seeded successfully.');
    } catch (error) {
        logger.error(error, 'Failed to seed large dataset.');
        process.exit(1);
    }
}

runSeed();
