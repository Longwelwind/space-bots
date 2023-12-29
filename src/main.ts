import app, { launchDelayedTasks, unscheduleAllDelayedTasks } from "./app";
import logger from "./utils/logger";
import moduleName from "./utils/moduleName";

const LOGGER = logger(moduleName(__filename));

process.on("uncaughtException", (err) => {
    LOGGER.error("uncaught exception", err);
    LOGGER.on("finish", () => {
        process.exit(1);
    });
});

const port = process.env.APP_PORT || 8080;

const server = app.listen(port, () => {
    LOGGER.info("server started", { port });

    process.on("SIGTERM", () => {
        LOGGER.info("SIGTERM received");
        LOGGER.info("unscheduling all tasks");
        unscheduleAllDelayedTasks();
        server.close();
    });
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
launchDelayedTasks();
