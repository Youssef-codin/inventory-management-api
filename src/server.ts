import app from "./app";
import { logger } from "./middleware/logger";
import { initDb } from "./util/db.init";

const port = process.env.PORT || 3000;

async function start() {
    await initDb();

    app.listen(port, () => {
        logger.info(`App listening on port ${port}`);
    });
}

start().catch(err => {
    logger.error("Failed to start:", err);
    process.exit(1);
});
