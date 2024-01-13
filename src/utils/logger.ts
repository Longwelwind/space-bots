import { createLogger, format, transports } from "winston";
import { DATADOG_API_KEY, NODE_ENV } from "../config";
import { AsyncLocalStorage } from "async_hooks";
import { v4 } from "uuid";

const httpTransportOptions = {
    host: "http-intake.logs.datadoghq.eu",
    path: `/api/v2/logs?dd-api-key=${DATADOG_API_KEY}&ddsource=nodejs&service=space-bots-api`,
    ssl: true,
};

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

const rootLogger = createLogger({
    level: NODE_ENV == "development" || NODE_ENV == "test" ? "debug" : "info",
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
        NODE_ENV == "production" ? format.json() : format.simple(),
    ),
    transports: [
        new transports.Console(),
        ...(NODE_ENV == "production"
            ? [new transports.Http(httpTransportOptions)]
            : []),
    ],
});

export default function logger(module: string) {
    return rootLogger.child({ module });
}
