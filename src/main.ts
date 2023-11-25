import "dotenv/config";
import app, { launchDelayedTasks } from "./app";
import logger from "./utils/logger";
import moduleName from "./utils/moduleName";

const LOGGER = logger(moduleName(__filename));

const port = process.env.APP_PORT || 8080;

const server = app.listen(port, () => {
    LOGGER.info("server started", { port });

    process.on("SIGTERM", () => {
        LOGGER.info("SIGTERM received");
        server.close();
    });
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
launchDelayedTasks();
