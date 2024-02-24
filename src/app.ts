import express, { Request, Response } from "express";
import { sequelize } from "./models/database";
import Fleet from "./models/Fleet";
import Inventory from "./models/Inventory";
import System from "./models/static-game-data/System";
import FleetComposition from "./models/FleetComposition";
import User from "./models/User";
import { serializeUser, serializeUserForWebsite } from "./serializers";
import { Transaction } from "sequelize";
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import generateApiKey from "generate-api-key";
import * as OpenApiValidator from "express-openapi-validator";
import swaggerUI from "swagger-ui-express";
import { paths } from "./schema";
import fs from "fs";
import YAML from "yaml";
import addFleetsRoutes from "./app/fleets";
import addShipTypesRoutes from "./app/shipTypes";
import addResourcesRoutes from "./app/resources";
import logger, { loggerMiddleware } from "./utils/logger";
import moduleName from "./utils/moduleName";
import HttpError from "./utils/HttpError";
import { rateLimit } from "express-rate-limit";
import { NODE_ENV } from "./config";
import authMiddleware from "./utils/authMiddleware";
import setupTransaction from "./utils/setupTransaction";
import addSystemsRoutes from "./app/systems";
import addUsersRoutes from "./app/users";
import addModuleTypesRoutes from "./app/moduleTypes";
import addSystemsPlanetsRoutes from "./app/systems.planets";

export const LOGGER = logger(moduleName(__filename));

if (process.env.FIREBASE_API_TOKEN) {
    admin.initializeApp({
        credential: admin.credential.cert(
            JSON.parse(process.env.FIREBASE_API_TOKEN),
        ),
    });
}

const app = express();

export const SPEED = 1; // In units/seconds

const nonGameRouter = express.Router();

nonGameRouter.post("/users/login", async (req, res) => {
    const idToken = req.body["idToken"] as string;

    const response = await getAuth().verifyIdToken(idToken);

    const firebaseUid = response.uid;

    let user = await User.findOne({ where: { firebaseUid } });

    if (user == null) {
        // Generate a user and its starting spot
        await setupTransaction(sequelize, async (transaction) => {
            const pool =
                "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            const token = "spbo_" + generateApiKey({ length: 32, pool });
            const generatedUsername = generateApiKey({ length: 32, pool });
            user = await User.create(
                { name: generatedUsername, token, firebaseUid },
                { transaction },
            );

            const startingSystem = (
                await System.findAll({
                    where: { startingSystem: true },
                    transaction,
                })
            )[0];

            const inventory = await Inventory.create({}, { transaction });
            const fleet = await Fleet.create(
                {
                    ownerUserId: user.id,
                    locationSystemId: startingSystem.id,
                    inventoryId: inventory.id,
                },
                { transaction },
            );
            await FleetComposition.create(
                { fleetId: fleet.id, shipTypeId: "miner", quantity: 1 },
                { transaction },
            );
        });
    }

    res.json(serializeUserForWebsite(user));
});

const gameRouter = express.Router();

gameRouter.use(
    OpenApiValidator.middleware({
        apiSpec: "src/openapi.yaml",
        validateRequests: true,
        validateResponses: true,
    }),
);

gameRouter.use(authMiddleware);

if (NODE_ENV == "production") {
    gameRouter.use(
        rateLimit({
            windowMs: 1 * 1000, // 1 second
            limit: 10,
            standardHeaders: "draft-7",
            legacyHeaders: false,
            keyGenerator: (req, res) => res.locals.user.id,
            handler: (req, res, next, options) =>
                res.status(options.statusCode).send({
                    error: "rate_limited",
                    message: "Too much requests were sent",
                }),
        }),
    );
}

addFleetsRoutes(gameRouter);
addUsersRoutes(gameRouter);
addShipTypesRoutes(gameRouter);
addSystemsRoutes(gameRouter);
addSystemsPlanetsRoutes(gameRouter);
addResourcesRoutes(gameRouter);
addModuleTypesRoutes(gameRouter);

export async function createFleet(
    ownerUserId: string,
    locationSystemId: string,
    transaction: Transaction,
): Promise<Fleet> {
    const inventory = await Inventory.create({}, { transaction });
    const fleet = await Fleet.create(
        { ownerUserId, locationSystemId, inventoryId: inventory.id },
        { transaction },
    );
    return fleet;
}

app.use(express.json());

app.use(loggerMiddleware);

app.use((req, res, next) => {
    LOGGER.info("new request", {
        originalUrl: req.originalUrl,
        body: req.body,
    });
    next();
});

app.use(express.static("public"));
app.use("/openapi.yaml", express.static("src/openapi.yaml"));
app.use(
    "/docs",
    swaggerUI.serve,
    swaggerUI.setup(YAML.parse(fs.readFileSync("src/openapi.yaml", "utf8"))),
);

app.use("/v1", nonGameRouter);
app.use("/v1", gameRouter);
app.use((req, res, next) => {
    res.status(404).send();
    next();
});

app.use((err, req, res, next) => {
    let httpStatusCode = 0;
    let errorCode = "";
    let message = "";
    let additionalFields = {};

    if (err instanceof HttpError) {
        httpStatusCode = err.httpStatusCode;
        errorCode = err.errorCode;
        message = err.message;

        LOGGER.child({ traceId: res.locals.traceId }).info(
            "HttpError occured",
            err,
        );
    } else if (err.errors && err.status) {
        if (err.status == 500) {
            httpStatusCode = 500;
            errorCode = "internal_error";
            message = "An internal error occured.";

            LOGGER.child({ traceId: res.locals.traceId }).error(err);
        } else {
            httpStatusCode = err.status;
            errorCode = "validation_error";
            message = err.message;
            additionalFields = {
                errors: err.errors,
            };

            LOGGER.child({ traceId: res.locals.traceId }).info(
                "request validation error occured",
                err,
            );
        }
    } else {
        httpStatusCode = 500;
        errorCode = "internal_error";
        message = "An internal error occured.";

        LOGGER.child({ traceId: res.locals.traceId }).error(err);
    }

    res.status(httpStatusCode).send({
        error: errorCode,
        message,
        ...additionalFields,
    });

    next();
});

export default app;
