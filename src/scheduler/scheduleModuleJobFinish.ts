import { sequelize } from "../models/database";
import Fleet from "../models/Fleet";
import ShipType from "../models/static-game-data/ShipType";
import Inventory from "../models/Inventory";
import ModuleTypeRefineryBlueprintOutputResource from "../models/static-game-data/ModuleTypeRefineryBlueprintOutputResource";
import ModuleTypeRefineryBlueprint from "../models/static-game-data/ModuleTypeRefineryBlueprint";
import StationInventory from "../models/StationInventory";
import FleetComposition from "../models/FleetComposition";
import ModuleRefineryJob from "../models/ModuleRefineryJob";
import Module from "../models/Module";
import { changeResourcesOfInventories } from "../utils/changeResourcesOfInventories";
import setupTransaction from "../utils/setupTransaction";
import { scheduleDelayedTask } from "./delayedTasks";
import createLogger from "../utils/logger";
import moduleName from "../utils/moduleName";

const LOGGER = createLogger(moduleName(__filename));

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

            // Get the current free cargo of the fleet

            const stationInventory = await StationInventory.findOne({
                where: {
                    userId: module.userId,
                    systemId: module.systemId,
                },
                include: [{ model: Inventory, required: true }],
                lock: true,
                transaction,
            });

            await changeResourcesOfInventories(
                new Map([[stationInventory.inventory, resourcesToProduce]]),
                transaction,
            );

            // Delete the jobs
            await moduleRefineryJob.destroy({ transaction });

            LOGGER.info("module job finish end", { moduleJobId });
        });
    });
}
