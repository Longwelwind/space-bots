import path from "path";
import logger from "../utils/logger";
import { Router } from "express";
import { sequelize } from "../models/database";
import ModuleType from "../models/static-game-data/ModuleType";
import Resource from "../models/static-game-data/Resource";
import Fleet from "../models/Fleet";
import InventoryItem from "../models/InventoryItem";
import Inventory from "../models/Inventory";
import System from "../models/static-game-data/System";
import ModuleTypeRefineryBlueprintInputResource from "../models/static-game-data/ModuleTypeRefineryBlueprintInputResource";
import ModuleTypeRefineryBlueprint from "../models/static-game-data/ModuleTypeRefineryBlueprint";
import ModuleTypeLevel from "../models/static-game-data/ModuleTypeLevel";
import SystemLink from "../models/static-game-data/SystemLink";
import MarketTransaction from "../models/MarketTransaction";
import MarketOrder from "../models/MarketOrder";
import StationInventory from "../models/StationInventory";
import FleetComposition from "../models/FleetComposition";
import ModuleRefineryJob from "../models/ModuleRefineryJob";
import Module from "../models/Module";
import User from "../models/User";
import getOrNotFound from "../utils/getOrNotFound";
import { paths } from "../schema";
import {
    serializeFleet,
    serializeModule,
    serializeSystem,
} from "../serializers";
import {
    marketGetMyOrdersRoute,
    marketGetOrdersRoute,
    marketInstantRoute,
    marketOrderRoute,
} from "../utils/marketRoutesHelpers";
import paginatedListRoute from "../utils/paginatedListRoute";
import HttpError from "../utils/HttpError";
import setupTransaction from "../utils/setupTransaction";
import { changeResourcesOfInventories } from "../utils/changeResourcesOfInventories";
import scheduleModuleJobFinish from "../scheduler/scheduleModuleJobFinish";

const LOGGER = logger(path.relative(process.cwd(), __filename));

export default function addSystemsRoutes(router: Router) {
    router.get<
        paths["/systems/{systemId}"]["get"]["parameters"]["path"],
        paths["/systems/{systemId}"]["get"]["responses"][200]["content"]["application/json"],
        null
    >("/systems/:systemId", async (req, res) => {
        const system = await getOrNotFound<System>(
            System,
            req.params["systemId"],
            res,
            {
                include: [
                    { model: SystemLink, as: "firstSystemLinks" },
                    { model: SystemLink, as: "secondSystemLinks" },
                    {
                        model: StationInventory,
                        where: { userId: res.locals.user.id },
                        required: false,
                        include: [
                            { model: Inventory, include: [InventoryItem] },
                        ],
                    },
                ],
            },
        );

        res.json(serializeSystem(system, res.locals.user.id, true));
    });

    router.get<
        paths["/systems/{systemId}/market/resources/{resourceId}"]["get"]["parameters"]["path"],
        paths["/systems/{systemId}/market/resources/{resourceId}"]["get"]["responses"][200]["content"]["application/json"],
        null
    >("/systems/:systemId/market/resources/:resourceId", async (req, res) => {
        const system = await getOrNotFound<System>(
            System,
            req.params["systemId"],
            res,
        );

        const resource = await getOrNotFound<Resource>(
            Resource,
            req.params["resourceId"],
            res,
        );

        const [sellOrders, buyOrders] = await Promise.all(
            ["sell", "buy"].map(
                async (type) =>
                    await MarketOrder.findAll({
                        attributes: [
                            "price",
                            [
                                sequelize.fn("SUM", sequelize.col("quantity")),
                                "quantity",
                            ],
                        ],
                        where: {
                            type,
                            resourceId: resource.id,
                            systemId: system.id,
                        },
                        order: [
                            // @ts-expect-error I don't understand why it's complaining
                            [
                                sequelize.col("price"),
                                ...(type == "buy" ? ["DESC"] : []),
                            ],
                        ],
                        group: "price",
                        limit: 10,
                    }),
            ),
        );

        const lastTransactions = await MarketTransaction.findAll({
            attributes: [
                "price",
                "time",
                [sequelize.fn("SUM", sequelize.col("quantity")), "quantity"],
            ],
            where: {
                resourceId: resource.id,
                systemId: system.id,
            },
            order: [[sequelize.col("time"), "DESC"]],
            group: ["time", "price"],
            limit: 5,
        });

        res.send({
            sellOrders: sellOrders.map((s) => ({
                price: Number(BigInt(s.price)),
                quantity: Number(BigInt(s.quantity)),
            })),
            buyOrders: buyOrders.map((s) => ({
                price: Number(BigInt(s.price)),
                quantity: Number(BigInt(s.quantity)),
            })),
            lastTransactions: lastTransactions.map((t) => ({
                price: Number(t.price),
                quantity: Number(t.quantity),
                time: t.time.toISOString(),
            })),
        });
    });

    router.get<
        paths["/systems/{systemId}/fleets"]["get"]["parameters"]["path"],
        | paths["/systems/{systemId}/fleets"]["get"]["responses"][200]["content"]["application/json"]
        | paths["/systems/{systemId}/fleets"]["get"]["responses"][404]["content"]["application/json"],
        null,
        paths["/systems/{systemId}/fleets"]["get"]["parameters"]["query"]
    >("/systems/:systemId/fleets", async (req, res) => {
        const system = await getOrNotFound<System>(
            System,
            req.params["systemId"],
            res,
        );

        // The user needs at least one fleet in the system
        // to see the fleets in the system
        const userFleet = await Fleet.findOne({
            where: { ownerUserId: res.locals.user.id },
        });
        if (userFleet == null) {
            throw new HttpError(
                400,
                "no_fleet_in_system",
                "You need to have a fleet in the system to see the other fleets in it",
            );
        }

        await paginatedListRoute(
            req,
            res,
            Fleet,
            [{ colName: "id", ascending: true }],
            (fleet) => serializeFleet(fleet, false),
            { locationSystemId: system.id },
            { model: FleetComposition },
        );
    });

    router.post<
        paths["/systems/{systemId}/market/resources/{resourceId}/instant-sell"]["post"]["parameters"]["path"],
        | paths["/systems/{systemId}/market/resources/{resourceId}/instant-sell"]["post"]["responses"][200]["content"]["application/json"]
        | paths["/systems/{systemId}/market/resources/{resourceId}/instant-sell"]["post"]["responses"][400]["content"]["application/json"]
        | paths["/systems/{systemId}/market/resources/{resourceId}/instant-sell"]["post"]["responses"][403]["content"]["application/json"],
        paths["/systems/{systemId}/market/resources/{resourceId}/instant-sell"]["post"]["requestBody"]["content"]["application/json"],
        null
    >(
        "/systems/:systemId/market/resources/:resourceId/instant-sell",
        async (req, res) => {
            await marketInstantRoute(req, res, "sell");
        },
    );

    router.post<
        paths["/systems/{systemId}/market/resources/{resourceId}/buy-orders"]["post"]["parameters"]["path"],
        | paths["/systems/{systemId}/market/resources/{resourceId}/buy-orders"]["post"]["responses"][200]["content"]["application/json"]
        | paths["/systems/{systemId}/market/resources/{resourceId}/buy-orders"]["post"]["responses"][400]["content"]["application/json"]
        | paths["/systems/{systemId}/market/resources/{resourceId}/buy-orders"]["post"]["responses"][403]["content"]["application/json"],
        paths["/systems/{systemId}/market/resources/{resourceId}/buy-orders"]["post"]["requestBody"]["content"]["application/json"]
    >(
        "/systems/:systemId/market/resources/:resourceId/buy-orders",
        async (req, res) => {
            await marketOrderRoute(req, res, "buy");
        },
    );

    router.post<
        paths["/systems/{systemId}/market/resources/{resourceId}/instant-buy"]["post"]["parameters"]["path"],
        | paths["/systems/{systemId}/market/resources/{resourceId}/instant-buy"]["post"]["responses"][200]["content"]["application/json"]
        | paths["/systems/{systemId}/market/resources/{resourceId}/instant-buy"]["post"]["responses"][400]["content"]["application/json"]
        | paths["/systems/{systemId}/market/resources/{resourceId}/instant-buy"]["post"]["responses"][403]["content"]["application/json"],
        paths["/systems/{systemId}/market/resources/{resourceId}/instant-buy"]["post"]["requestBody"]["content"]["application/json"],
        null
    >(
        "/systems/:systemId/market/resources/:resourceId/instant-buy",
        async (req, res) => {
            await marketInstantRoute(req, res, "buy");
        },
    );

    router.post<
        paths["/systems/{systemId}/market/resources/{resourceId}/sell-orders"]["post"]["parameters"]["path"],
        | paths["/systems/{systemId}/market/resources/{resourceId}/sell-orders"]["post"]["responses"][200]["content"]["application/json"]
        | paths["/systems/{systemId}/market/resources/{resourceId}/sell-orders"]["post"]["responses"][400]["content"]["application/json"]
        | paths["/systems/{systemId}/market/resources/{resourceId}/sell-orders"]["post"]["responses"][403]["content"]["application/json"],
        paths["/systems/{systemId}/market/resources/{resourceId}/sell-orders"]["post"]["requestBody"]["content"]["application/json"]
    >(
        "/systems/:systemId/market/resources/:resourceId/sell-orders",
        async (req, res) => {
            await marketOrderRoute(req, res, "sell");
        },
    );

    router.get<
        paths["/systems/{systemId}/market/resources/{resourceId}/sell-orders/my"]["get"]["parameters"]["path"],
        paths["/systems/{systemId}/market/resources/{resourceId}/sell-orders/my"]["get"]["responses"][200]["content"]["application/json"]
    >(
        "/systems/:systemId/market/resources/:resourceId/sell-orders/my",
        async (req, res) => {
            await marketGetMyOrdersRoute(req, res, "sell");
        },
    );

    router.get<
        paths["/systems/{systemId}/market/resources/{resourceId}/buy-orders/my"]["get"]["parameters"]["path"],
        paths["/systems/{systemId}/market/resources/{resourceId}/buy-orders/my"]["get"]["responses"][200]["content"]["application/json"]
    >(
        "/systems/:systemId/market/resources/:resourceId/buy-orders/my",
        async (req, res) => {
            await marketGetMyOrdersRoute(req, res, "buy");
        },
    );

    router.get<
        paths["/systems/{systemId}/market/resources/{resourceId}/buy-orders"]["get"]["parameters"]["path"],
        paths["/systems/{systemId}/market/resources/{resourceId}/buy-orders"]["get"]["responses"][200]["content"]["application/json"]
    >(
        "/systems/:systemId/market/resources/:resourceId/buy-orders",
        async (req, res) => {
            await marketGetOrdersRoute(req, res, "buy");
        },
    );

    router.get<
        paths["/systems/{systemId}/market/resources/{resourceId}/sell-orders"]["get"]["parameters"]["path"],
        paths["/systems/{systemId}/market/resources/{resourceId}/sell-orders"]["get"]["responses"][200]["content"]["application/json"]
    >(
        "/systems/:systemId/market/resources/:resourceId/sell-orders",
        async (req, res) => {
            await marketGetOrdersRoute(req, res, "sell");
        },
    );

    router.get<
        paths["/systems/{systemId}/station/modules"]["get"]["parameters"]["path"],
        | paths["/systems/{systemId}/station/modules"]["get"]["responses"][200]["content"]["application/json"]
        | paths["/systems/{systemId}/station/modules"]["get"]["responses"][404]["content"]["application/json"]
    >("/systems/:systemId/station/modules", async (req, res) => {
        const system = await getOrNotFound<System>(
            System,
            req.params["systemId"],
            res,
        );

        const modules = await Module.findAll({
            where: {
                systemId: system.id,
                userId: res.locals.user.id,
            },
            include: [{ model: ModuleType }, ModuleRefineryJob],
        });

        res.send({ items: modules.map((module) => serializeModule(module)) });
    });

    router.post<
        paths["/systems/{systemId}/station/modules/build"]["post"]["parameters"]["path"],
        | paths["/systems/{systemId}/station/modules/build"]["post"]["responses"][200]["content"]["application/json"]
        | paths["/systems/{systemId}/station/modules/build"]["post"]["responses"][400]["content"]["application/json"],
        paths["/systems/{systemId}/station/modules/build"]["post"]["requestBody"]["content"]["application/json"],
        { user: User }
    >("/systems/:systemId/station/modules/build", async (req, res) => {
        await setupTransaction(sequelize, async (transaction) => {
            const system = await getOrNotFound<System>(
                System,
                req.params["systemId"],
                res,
            );

            const moduleType = await getOrNotFound<ModuleType>(
                ModuleType,
                req.body["moduleTypeId"],
                res,
            );

            const module = await Module.findOne({
                where: {
                    userId: res.locals.user.id,
                    systemId: system.id,
                    moduleTypeId: moduleType.id,
                },
            });

            const levelToBuild = await ModuleTypeLevel.findOne({
                where: {
                    moduleTypeId: moduleType.id,
                    level: module == null ? 1 : module.level + 1,
                },
            });

            if (levelToBuild == null) {
                throw new HttpError(
                    400,
                    "already_at_max_level",
                    "The max level of this module has been reached",
                );
            }

            // Check if the user can cover the cost
            if (
                BigInt(res.locals.user.credits) <
                BigInt(levelToBuild.creditCost)
            ) {
                throw new HttpError(400, "not_enough_credits");
            }

            // Make the user pay
            await res.locals.user.decrement("credits", {
                by: Number(BigInt(levelToBuild.creditCost)),
                transaction,
            });

            // Build the module
            if (module != null) {
                await module.increment("level", { by: 1, transaction });
            } else {
                await Module.create(
                    {
                        userId: res.locals.user.id,
                        systemId: system.id,
                        moduleTypeId: moduleType.id,
                        level: 1,
                    },
                    { transaction },
                );
            }

            res.json({});
        });
    });

    router.post<
        paths["/systems/{systemId}/station/modules/{moduleTypeId}/refine"]["post"]["parameters"]["path"],
        | paths["/systems/{systemId}/station/modules/{moduleTypeId}/refine"]["post"]["responses"][200]["content"]["application/json"]
        | paths["/systems/{systemId}/station/modules/{moduleTypeId}/refine"]["post"]["responses"][400]["content"]["application/json"],
        paths["/systems/{systemId}/station/modules/{moduleTypeId}/refine"]["post"]["requestBody"]["content"]["application/json"],
        { user: User }
    >(
        "/systems/:systemId/station/modules/:moduleTypeId/refine",
        async (req, res) => {
            await setupTransaction(sequelize, async (transaction) => {
                const system = await getOrNotFound<System>(
                    System,
                    req.params["systemId"],
                    res,
                );

                const count = req.body["count"];

                const module = await Module.findOne({
                    where: {
                        userId: res.locals.user.id,
                        systemId: system.id,
                        moduleTypeId: req.params["moduleTypeId"],
                    },
                    transaction,
                    lock: true,
                });

                if (module == null) {
                    throw new HttpError(400, "no_module");
                }

                // Module type is fetched separately since it must not
                // be locked on it
                const moduleType = await ModuleType.findOne({
                    where: {
                        id: module.moduleTypeId,
                    },
                    include: [
                        {
                            model: ModuleTypeLevel,
                            where: { level: module.level },
                        },
                    ],
                    transaction,
                });

                if (moduleType.kind != "refinery") {
                    throw new HttpError(
                        400,
                        "not_refinery",
                        "Only refineries can refine reosurces",
                    );
                }

                const blueprint =
                    await getOrNotFound<ModuleTypeRefineryBlueprint>(
                        ModuleTypeRefineryBlueprint,
                        req.body.blueprintId,
                        res,
                        {
                            transaction,
                            include: [ModuleTypeRefineryBlueprintInputResource],
                        },
                    );

                // Check if the user has the cost
                const totalCreditCost = blueprint.creditCost * count;
                if (res.locals.user.credits <= totalCreditCost) {
                    throw new HttpError(400, "not_enough_credits");
                }

                // Check if this module has enough slots for this job
                // The levels array contains only one because it was filtered in the query
                // earlier
                const maxJobCount = moduleType.levels[0].maxJobs;
                const currentJobsCount =
                    (await ModuleRefineryJob.sum("count", {
                        where: { moduleId: module.id },
                        transaction,
                    })) || 0;

                if (currentJobsCount + count > maxJobCount) {
                    throw new HttpError(
                        400,
                        "too_many_jobs",
                        "Trying to launch too many jobs than the current module level can currently do",
                    );
                }

                // Remove input resources
                const inputResources = Object.fromEntries(
                    blueprint.inputResources.map((r) => [
                        r.resourceId,
                        -r.quantity * count,
                    ]),
                );

                const stationInventory = await StationInventory.findOne({
                    where: {
                        systemId: system.id,
                        userId: res.locals.user.id,
                    },
                    transaction,
                });

                if (stationInventory == null) {
                    throw new HttpError(400, "not_enough_resources");
                }

                const enoughResources = await changeResourcesOfInventories(
                    { [stationInventory.inventoryId]: inputResources },
                    transaction,
                );

                if (!enoughResources) {
                    throw new HttpError(400, "not_enough_resources");
                }

                // Remove credits
                await res.locals.user.decrement("credits", {
                    by: Number(BigInt(totalCreditCost)),
                    transaction,
                });

                const startTime = new Date();
                const duration = blueprint.time;
                const finishTime = new Date(startTime.getTime());
                finishTime.setMilliseconds(
                    finishTime.getMilliseconds() + duration * 1000,
                );

                // Launch the job
                const moduleJob = await ModuleRefineryJob.create(
                    {
                        moduleId: module.id,
                        moduleTypeRefineryBlueprintId: blueprint.id,
                        count,
                        startTime,
                        finishTime,
                    },
                    { transaction },
                );

                scheduleModuleJobFinish(moduleJob.id, finishTime);

                res.json({
                    startTime: startTime.toISOString(),
                    finishTime: finishTime.toISOString(),
                    duration,
                });
            });
        },
    );
}
