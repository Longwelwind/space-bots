import { LOGGER } from "../app";

import {
    sequelize,
    Fleet,
    FleetComposition,
    ShipType,
    Inventory,
} from "../database";
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
                include: [
                    {
                        model: FleetComposition,
                        required: true,
                        include: [{ model: ShipType, required: true }],
                    },
                    { model: Inventory, required: true },
                ],
            });

            // Get resource mined
            const miningResourceId = fleet.miningResourceId;

            if (fleet.currentAction != "mining") {
                LOGGER.error("fleet's current action is not mining", {
                    fleetId,
                    currentAction: fleet.currentAction,
                });
                throw new Error();
            }

            // Get mining power of fleet
            const miningPower = Number(
                fleet.fleetCompositions.reduce(
                    (p, c) =>
                        p + BigInt(c.quantity) * BigInt(c.shipType.miningPower),
                    BigInt(0),
                ),
            );

            const resourceMined = {
                [miningResourceId]: miningPower,
            };

            await changeResourcesOfInventories(
                { [fleet.inventoryId]: resourceMined },
                transaction,
            );

            fleet.currentAction = "idling";
            fleet.miningFinishTime = null;

            await fleet.save({ transaction });
            LOGGER.info("mining finish end", { fleetId });
        });
    });
}
