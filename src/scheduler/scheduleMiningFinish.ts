import { LOGGER } from "../app";

import { sequelize } from "../models/database";
import Fleet from "../models/Fleet";
import ShipType from "../models/static-game-data/ShipType";
import Inventory from "../models/Inventory";
import FleetComposition from "../models/FleetComposition";
import { changeResourcesOfInventories } from "../utils/changeResourcesOfInventories";
import setupTransaction from "../utils/setupTransaction";
import { scheduleDelayedTask } from "./delayedTasks";

export default function scheduleMiningFinish(
    fleetId: string,
    miningFinishTime: Date,
) {
    scheduleDelayedTask(miningFinishTime, async () => {
        await setupTransaction(sequelize, async (transaction) => {
            LOGGER.info("mining finish begin", { fleetId });
            const fleet = await Fleet.findByPk(fleetId, {
                transaction,
                lock: true,
                include: [{ model: Inventory, required: true }],
            });

            if (fleet.currentAction != "mining") {
                LOGGER.error("fleet's current action is not mining", {
                    fleetId,
                    currentAction: fleet.currentAction,
                });
                throw new Error();
            }

            const resourceMined = {
                [fleet.miningResourceId]: fleet.miningQuantity,
            };

            await changeResourcesOfInventories(
                new Map([[fleet.inventory, resourceMined]]),
                transaction,
                true,
            );

            fleet.currentAction = "idling";
            fleet.miningFinishTime = null;

            await fleet.save({ transaction });
            LOGGER.info("mining finish end", { fleetId });
        });
    });
}
