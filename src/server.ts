import express from "express"
import helmet from "helmet";
import errorHandler from "./middleware/errorHandler";
import log, { logger } from "./middleware/logger";

const app = express();

const port = process.env.PORT;

app.use(helmet());
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

//-- middleware --
app.use(log);
//-- routes -- 

//-- error handler -- 
app.use(errorHandler);

app.listen(port, () => {
    logger.info(`Example app listening on port ${port}`)
});
