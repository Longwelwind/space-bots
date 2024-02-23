import { LOGGER } from "../app";

import { sequelize } from "../models/database";
import Fleet from "../models/Fleet";
import setupTransaction from "../utils/setupTransaction";
import { scheduleDelayedTask } from "./delayedTasks";

export default function scheduleFleetArrival(
    fleetId: string,
    arrivalTime: Date,
) {
    scheduleDelayedTask(arrivalTime, async () => {
        await setupTransaction(sequelize, async (transaction) => {
            LOGGER.info("fleet arrival begin", { fleetId });
            const fleet = await Fleet.findByPk(fleetId, {
                transaction,
                lock: true,
            });

            const destinationSystemId = fleet.travelingToSystemId;

            if (destinationSystemId == null) {
                LOGGER.error("destinationSystemId null", { fleetId });
                throw new Error();
            }

            if (fleet.currentAction != "traveling") {
                LOGGER.error("fleet's current action is not traveling", {
                    fleetId,
                    currentAction: fleet.currentAction,
                });
                throw new Error();
            }

            fleet.currentAction = "idling";
            fleet.travelingFromSystemId = null;
            fleet.travelingToSystemId = null;
            fleet.arrivalTime = null;
            fleet.departureTime = null;
            fleet.locationSystemId = destinationSystemId;

            await fleet.save({ transaction });

            LOGGER.info("fleet arrival end", { fleetId });
        });
    });
}
