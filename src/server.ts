import express from "express"
import helmet from "helmet";
import errorHandler from "./middleware/errorHandler";
import pino from "pino";
import { validate } from "./middleware/validate";

const app = express();

export const logger = pino({ transport: { target: "pino-pretty", options: { colorize: true } } });
const port = process.env.PORT;

app.use(helmet()); // basic security
app.use(express.urlencoded({ extended: true })) // Read body of requests
app.use(express.json()) // res and req are in json

// logging middleware
app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.url });
    next();
});

app.use(validate);
app.use(errorHandler);

app.listen(port, () => {
    logger.info(`Example app listening on port ${port}`)
});
