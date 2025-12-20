import { seedDemo } from "../util/seed.demo";
import { logger } from "../middleware/logger";

async function runSeed() {
    try {
        await seedDemo();
        logger.info("Demo data seeded successfully.");
    } catch (error) {
        logger.error(error, "Failed to seed demo data.");
        process.exit(1);
    }
}

runSeed();
