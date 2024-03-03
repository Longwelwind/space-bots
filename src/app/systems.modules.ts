import { Router } from "express";
import System from "../models/static-game-data/System";
import { paths } from "../schema";
import getOrNotFound from "../utils/getOrNotFound";
import Module from "../models/Module";
import ModuleType from "../models/static-game-data/ModuleType";
import ModuleRefineryJob from "../models/ModuleRefineryJob";
import { serializeModule } from "../serializers";
import HttpError from "../utils/HttpError";
import ModuleTypeLevel from "../models/static-game-data/ModuleTypeLevel";
import { sequelize } from "../models/database";
import setupTransaction from "../utils/setupTransaction";
import User from "../models/User";
import ModuleTypeRefineryBlueprint from "../models/static-game-data/ModuleTypeRefineryBlueprint";
import ModuleTypeRefineryBlueprintInputResource from "../models/static-game-data/ModuleTypeRefineryBlueprintInputResource";
import StationInventory from "../models/StationInventory";
import { changeResourcesOfInventories } from "../utils/changeResourcesOfInventories";
import scheduleModuleJobFinish from "../scheduler/scheduleModuleJobFinish";

export default function addSystemsModulesRoutes(router: Router) {
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
