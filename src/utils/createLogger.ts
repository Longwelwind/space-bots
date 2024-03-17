import {
    createLogger as createLoggerWinston,
    format,
    transports,
} from "winston";
import { LOG_LEVEL, NODE_ENV } from "../config";
import { AsyncLocalStorage } from "async_hooks";
import { v4 } from "uuid";

// Generate a unique instance-id each time a server is launched
export const instanceId = v4();

export const traceIdStore = new AsyncLocalStorage<{ traceId: string }>();

export function loggerMiddleware(req, res, next) {
    const traceId = v4();

    res.locals.traceId = traceId;

    traceIdStore.run({ traceId }, () => {
        next();
    });
}

const rootLogger = createLoggerWinston({
    level:
        LOG_LEVEL ||
        (NODE_ENV == "development" || NODE_ENV == "test" ? "debug" : "info"),
    format: format.combine(
        format.timestamp(),
        NODE_ENV != "production" ? format.colorize() : format.label(),
        format((info) => {
            // Add instanceId
            const transformedInfo = { ...info, instanceId };

            // Add traceId
            const store = traceIdStore.getStore();
            if (store) {
                return {
                    ...transformedInfo,
                    traceId: store.traceId,
                };
            } else {
                return transformedInfo;
            }
        })(),
        NODE_ENV == "production" ? format.json() : format.prettyPrint(),
    ),
    transports: [new transports.Console()],
});

export default function createLogger(module: string) {
    return rootLogger.child({ module });
}
