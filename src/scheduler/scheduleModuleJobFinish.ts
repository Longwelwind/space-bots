import { LOGGER } from "../app";

import {
    sequelize,
    Fleet,
    FleetComposition,
    ShipType,
    Inventory,
    ModuleRefineryJob,
    ModuleTypeRefineryBlueprint,
    ModuleTypeRefineryBlueprintOutputResource,
    StationInventory,
    Module,
} from "../database";
import { changeResourcesOfInventories } from "../utils/changeResourcesOfInventories";
import setupTransaction from "../utils/setupTransaction";
import { scheduleDelayedTask } from "./delayedTasks";

export default function scheduleModuleJobFinish(
    moduleJobId: string,
    finishTime: Date,
) {
    scheduleDelayedTask(finishTime, async () => {
        await setupTransaction(sequelize, async (transaction) => {
            LOGGER.info("module job finish begin", { moduleJobId });
            const moduleRefineryJob = await ModuleRefineryJob.findByPk(
                moduleJobId,
                {
                    lock: true,
                    transaction,
                },
            );

            const blueprint = await ModuleTypeRefineryBlueprint.findOne({
                where: {
                    id: moduleRefineryJob.moduleTypeRefineryBlueprintId,
                },
                include: [ModuleTypeRefineryBlueprintOutputResource],
                transaction,
            });

            const module = await Module.findByPk(moduleRefineryJob.moduleId, {
                transaction,
            });

            // Produce the output ressources
            const resourcesToProduce = Object.fromEntries(
                blueprint.outputResources.map((r) => [
                    r.resourceId,
                    r.quantity * moduleRefineryJob.count,
                ]),
            );

            const stationInventory = await StationInventory.findOne({
                where: {
                    userId: module.userId,
                    systemId: module.systemId,
                },
                lock: true,
                transaction,
            });

            await changeResourcesOfInventories(
                {
                    [stationInventory.inventoryId]: resourcesToProduce,
                },
                transaction,
            );

            // Delete the jobs
            await moduleRefineryJob.destroy({ transaction });

            LOGGER.info("module job finish end", { moduleJobId });
        });
    });
}
