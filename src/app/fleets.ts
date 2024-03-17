import { Router } from "express";
import { paths } from "../schema";
import getOrNotFound from "../utils/getOrNotFound";
import { sequelize } from "../models/database";
import Resource from "../models/static-game-data/Resource";
import Fleet from "../models/Fleet";
import ShipTypeBuildResources from "../models/static-game-data/ShipTypeBuildResources";
import ShipType from "../models/static-game-data/ShipType";
import InventoryItem from "../models/InventoryItem";
import Inventory from "../models/Inventory";
import System, {
    ASTEROID_REFRESH_INTERVAL_SECONDS,
} from "../models/static-game-data/System";
import SystemLink from "../models/static-game-data/SystemLink";
import StationInventory from "../models/StationInventory";
import FleetComposition from "../models/FleetComposition";
import User from "../models/User";
import { SPEED, createFleet } from "../app";
import changeShipsOfFleets from "../utils/changeShipsOfFleets";
import scheduleFleetArrival from "../scheduler/scheduleFleetArrival";
import scheduleMiningFinish from "../scheduler/scheduleMiningFinish";
import { changeResourcesOfInventories } from "../utils/changeResourcesOfInventories";
import { serializeFleet } from "../serializers";
import oppositeOfValues from "../utils/oppositeOfValues";
import mergeByAdding from "../utils/mergeByAdding";
import _ from "lodash";
import createLogger from "../utils/createLogger";
import path from "path";
import HttpError from "../utils/HttpError";
import setupTransaction from "../utils/setupTransaction";
import { setTimeout } from "timers/promises";
import miningSizes from "../models/static-game-data/miningSizes";
import { QueryTypes, col } from "sequelize";
import miningYields from "../models/static-game-data/miningYields";

const LOGGER = createLogger(path.relative(process.cwd(), __filename));

export default function addFleetsRoutes(router: Router) {
    router.post<
        paths["/fleets/{fleetId}/mine"]["post"]["parameters"]["path"],
        | paths["/fleets/{fleetId}/mine"]["post"]["responses"][200]["content"]["application/json"]
        | paths["/fleets/{fleetId}/mine"]["post"]["responses"][400]["content"]["application/json"]
        | paths["/fleets/{fleetId}/mine"]["post"]["responses"][403]["content"]["application/json"],
        null
    >("/fleets/:fleetId/mine", async (req, res) => {
        await setupTransaction(sequelize, async (transaction) => {
            const fleet = await getOrNotFound<Fleet>(
                Fleet,
                req.params["fleetId"],
                res,
                {
                    transaction,
                    lock: true,
                    include: [{ model: Inventory, required: true }],
                },
            );

            // This cannot be queried while querying the fleet because this would
            // create a lock on the System. It is thus fetched separately.
            const systemOfFleet = await System.findByPk(
                fleet.locationSystemId,
                { transaction },
            );

            // Check that they own this fleet
            if (fleet.ownerUserId != res.locals.user.id) {
                throw new HttpError(403, "not_owner");
            }

            // Check that this fleet is not busy
            if (fleet.currentAction != "idling") {
                throw new HttpError(400, "fleet_busy");
            }

            // Check that the system can be mined
            const miningResourceId = systemOfFleet.miningResourceId;
            if (miningResourceId == null) {
                throw new HttpError(400, "cant_mine");
            }

            // Compute how much ore the fleet can mine at maximum
            const queryResult = await sequelize.query(
                `SELECT
                    SUM("quantity" * "miningPower") AS "totalMiningPower"
                FROM
                    "Fleets"
                    INNER JOIN "FleetCompositions" ON "FleetCompositions"."fleetId" = "Fleets".id
                    INNER JOIN "ShipTypes" ON "FleetCompositions"."shipTypeId" = "ShipTypes".id
                WHERE "Fleets".id = ?`,
                {
                    transaction,
                    type: QueryTypes.SELECT,
                    replacements: [fleet.id],
                },
            );
            const totalMiningPower =
                parseInt(queryResult[0]["totalMiningPower"]) *
                miningYields[systemOfFleet.miningYield];

            // Check if the asteroid must be refilled
            const quantityMinedForCycle =
                // This logic is only applied for non-infinite asteroids
                systemOfFleet.miningSize != "ENDLESS" &&
                Date.now() - systemOfFleet.firstMiningTimeForCycle.getTime() >=
                    ASTEROID_REFRESH_INTERVAL_SECONDS * 1000
                    ? 0
                    : systemOfFleet.quantityMinedForCycle;

            // Check that the asteroid field still can be mined
            const quantityLeftInAsteroid =
                systemOfFleet.miningSize != "ENDLESS"
                    ? miningSizes[systemOfFleet.miningSize] -
                      quantityMinedForCycle
                    : // If the asteroid is infinite, consider that there is `totalMiningPower` left to mine
                      totalMiningPower;

            if (quantityLeftInAsteroid <= 0) {
                throw new HttpError(400, "asteroid_exhausted");
            }

            const quantityToMine = Math.min(
                quantityLeftInAsteroid,
                totalMiningPower,
            );

            // Start the mining
            const duration = 4; // in seconds
            fleet.currentAction = "mining";
            fleet.miningFinishTime = new Date(Date.now() + duration * 1000);
            fleet.miningResourceId = miningResourceId;
            fleet.miningQuantity = quantityToMine;

            await fleet.save({ transaction });

            // Only register the mined quantity for non-infinite asteroid
            if (systemOfFleet.miningSize != "ENDLESS") {
                await systemOfFleet.update(
                    {
                        quantityMinedForCycle:
                            quantityMinedForCycle + quantityToMine,
                        // If this asteroid is mined for the first time in this cycle,
                        // note the time in which it was mined
                        firstMiningTimeForCycle:
                            quantityMinedForCycle == 0 ? new Date() : undefined,
                    },
                    { transaction },
                );
            }

            scheduleMiningFinish(fleet.id, fleet.miningFinishTime);

            res.json({
                finishTime: fleet.miningFinishTime.toISOString(),
                duration,
            });
        });
    });

    router.get<
        null,
        paths["/fleets/my"]["get"]["responses"][200]["content"]["application/json"],
        null
    >("/fleets/my", async (req, res) => {
        const fleets = await Fleet.findAll({
            where: { ownerUserId: res.locals.user.id },
            include: [
                { model: Inventory, include: [{ model: InventoryItem }] },
                { model: FleetComposition, include: [ShipType] },
            ],
        });

        // @ts-expect-error type: "user" doesn't go well with TS
        res.json(fleets.map((fleet) => serializeFleet(fleet)));
    });

    router.post<
        paths["/fleets/{fleetId}/direct-sell"]["post"]["parameters"]["path"],
        | paths["/fleets/{fleetId}/direct-sell"]["post"]["responses"][200]["content"]["application/json"]
        | paths["/fleets/{fleetId}/direct-sell"]["post"]["responses"][400]["content"]["application/json"]
        | paths["/fleets/{fleetId}/direct-sell"]["post"]["responses"][403]["content"]["application/json"],
        paths["/fleets/{fleetId}/direct-sell"]["post"]["requestBody"]["content"]["application/json"]
    >("/fleets/:fleetId/direct-sell", async (req, res) => {
        await setupTransaction(sequelize, async (transaction) => {
            const fleet = await getOrNotFound<Fleet>(
                Fleet,
                req.params.fleetId,
                res,
                {
                    transaction,
                    lock: true,
                    include: [{ model: Inventory, required: true }],
                },
            );

            // This cannot be queried while querying the fleet because this would
            // create a lock on the System. It is thus fetched separately.
            const systemOfFleet = await System.findByPk(
                fleet.locationSystemId,
                { transaction },
            );

            // Check that they own this fleet
            if (fleet.ownerUserId != res.locals.user.id) {
                throw new HttpError(403, "not_owner");
            }

            // Check that this system has a station
            if (!systemOfFleet.hasStation) {
                throw new HttpError(400, "no_station");
            }

            const resourcesToSell = req.body["resources"] as {
                [resource: string]: number;
            };

            const resourcesEntries = await Promise.all(
                Object.keys(resourcesToSell).map(async (resourceId) => {
                    const resource = await getOrNotFound<Resource>(
                        Resource,
                        resourceId,
                        res,
                        { transaction },
                    );
                    if (!resource) return null;

                    return [resource.id, resource] as [string, Resource];
                }),
            );

            if (resourcesEntries.some((r) => r == null)) return;

            const resources = Object.fromEntries(resourcesEntries);

            // Remove resources of inventory
            await changeResourcesOfInventories(
                new Map([
                    [
                        fleet.inventory,
                        Object.fromEntries(
                            Object.entries(resourcesToSell).map(([r, q]) => [
                                r,
                                -q,
                            ]),
                        ),
                    ],
                ]),
                transaction,
            );

            // Add credits to user
            const creditsGained = Object.entries(resourcesToSell).reduce(
                (s, [resourceId, quantity]) =>
                    s + resources[resourceId].price * quantity,
                0,
            );

            res.locals.user.credits = (
                BigInt(res.locals.user.credits) + BigInt(creditsGained)
            ).toString();

            await res.locals.user.save({ transaction });

            res.json({ creditsGained });
        });
    });

    router.post<
        paths["/fleets/{fleetId}/buy-ships"]["post"]["parameters"]["path"],
        | paths["/fleets/{fleetId}/buy-ships"]["post"]["responses"][200]["content"]["application/json"]
        | paths["/fleets/{fleetId}/buy-ships"]["post"]["responses"][400]["content"]["application/json"]
        | paths["/fleets/{fleetId}/buy-ships"]["post"]["responses"][403]["content"]["application/json"],
        paths["/fleets/{fleetId}/buy-ships"]["post"]["requestBody"]["content"]["application/json"]
    >("/fleets/:fleetId/buy-ships", async (req, res) => {
        await setupTransaction(sequelize, async (transaction) => {
            const fleet = await getOrNotFound<Fleet>(
                Fleet,
                req.params.fleetId,
                res,
                {
                    transaction,
                    lock: true,
                },
            );

            // This cannot be queried while querying the fleet because this would
            // create a lock on the System. It is thus fetched separately.
            const systemOfFleet = await System.findByPk(
                fleet.locationSystemId,
                { transaction },
            );

            // Check that they own this fleet
            if (fleet.ownerUserId != res.locals.user.id) {
                throw new HttpError(403, "not_owner");
            }

            const user = await User.findByPk(res.locals.user.id, {
                transaction,
                lock: true,
            });

            // Check that this system has a station
            if (!systemOfFleet.hasStation) {
                throw new HttpError(400, "no_station");
            }

            const shipsToBuy = req.body["shipsToBuy"] as {
                [shipTypeId: string]: number;
            };

            // Check that received shipTypeIds are correct
            const shipTypesEntries = await Promise.all(
                Object.keys(shipsToBuy).map(async (shipTypeId) => {
                    const shipType = await getOrNotFound<ShipType>(
                        ShipType,
                        shipTypeId,
                        res,
                        { transaction },
                    );
                    if (!shipType) {
                        return null;
                    }

                    return [shipType.id, shipType] as [string, ShipType];
                }),
            );

            const shipTypes = Object.fromEntries(shipTypesEntries);

            // Compute price to pay for all those ships
            const price = _.sum(
                Object.entries(shipsToBuy).map(
                    ([shipTypeId, quantity]) =>
                        quantity * shipTypes[shipTypeId].price,
                ),
            );

            // Check if user has enough credits
            if (res.locals.user.credits < price) {
                throw new HttpError(400, "not_enough_money");
            }

            // Add ships to fleet
            const { newCargoCapacities } = await changeShipsOfFleets(
                { [fleet.id]: shipsToBuy },
                transaction,
            );

            // await fleet.update(
            //     { capacity: newCargoCapacities[fleet.id] },
            //     { transaction },
            // );

            // Check if fleets don't have too much ships
            const totalShips = await FleetComposition.sum("quantity", {
                where: { fleetId: fleet.id },
                transaction,
            });

            if (totalShips > 100) {
                throw new HttpError(400, "too_much_ships_in_fleet");
            }

            // Remove credits to user
            await user.update(
                { credits: BigInt(user.credits) - BigInt(price) },
                { transaction },
            );

            res.json({ creditsSpent: price });
        });
    });

    router.post<
        paths["/fleets/{fleetId}/transfer"]["post"]["parameters"]["path"],
        | paths["/fleets/{fleetId}/transfer"]["post"]["responses"][200]["content"]["application/json"]
        | paths["/fleets/{fleetId}/transfer"]["post"]["responses"][400]["content"]["application/json"]
        | paths["/fleets/{fleetId}/transfer"]["post"]["responses"][403]["content"]["application/json"],
        paths["/fleets/{fleetId}/transfer"]["post"]["requestBody"]["content"]["application/json"]
    >("/fleets/:fleetId/transfer", async (req, res) => {
        await setupTransaction(sequelize, async (transaction) => {
            const fleet = await getOrNotFound<Fleet>(
                Fleet,
                req.params["fleetId"],
                res,
                {
                    transaction,
                    lock: true,
                    include: [{ model: Inventory, required: true }],
                },
            );

            // Check that they own this fleet
            if (fleet.ownerUserId != res.locals.user.id) {
                throw new HttpError(403, "not_owner");
            }

            // If no target fleet is mentionned,
            // *FromTargetToFleet must be null
            if (
                req.body.targetFleetId == null &&
                (req.body.resourcesFromTargetToFleet != null ||
                    req.body.shipsFromTargetToFleet != null)
            ) {
                throw new HttpError(
                    400,
                    "cant_transfer_from_target_when_creating_fleet",
                );
            }

            const resourcesFromFleetToTarget =
                req.body.resourcesFromFleetToTarget || {};
            const resourcesFromTargetToFleet =
                req.body.resourcesFromTargetToFleet || {};

            const resourcesChangeFleet = mergeByAdding(
                resourcesFromTargetToFleet,
                oppositeOfValues(resourcesFromFleetToTarget),
            );
            const resourcesChangeTarget = mergeByAdding(
                resourcesFromFleetToTarget,
                oppositeOfValues(resourcesFromTargetToFleet),
            );

            const shipsFromFleetToTarget =
                req.body.shipsFromFleetToTarget || {};
            const shipsFromTargetToFleet =
                req.body.shipsFromTargetToFleet || {};

            const shipsChangeFleet = mergeByAdding(
                shipsFromTargetToFleet,
                oppositeOfValues(shipsFromFleetToTarget),
            );
            const shipsChangeTarget = mergeByAdding(
                shipsFromFleetToTarget,
                oppositeOfValues(shipsFromTargetToFleet),
            );

            let targetFleet: Fleet = null;
            let newFleet = false;
            if (req.body.targetFleetId != null) {
                targetFleet = await getOrNotFound<Fleet>(
                    Fleet,
                    req.body.targetFleetId,
                    res,
                    {
                        transaction,
                        lock: true,
                        include: [{ model: Inventory, required: true }],
                    },
                );
            } else {
                // Check that ships are passed to a future new Fleet
                if (
                    Object.entries(shipsFromFleetToTarget).every(
                        ([_, q]) => q <= 0,
                    )
                ) {
                    throw new HttpError(400, "new_fleet_must_have_ships");
                }

                // Create the new Fleet
                targetFleet = await createFleet(
                    res.locals.user.id,
                    fleet.locationSystemId,
                    transaction,
                );

                newFleet = true;
            }

            const systemOfTargetFleet = await System.findByPk(
                fleet.locationSystemId,
                { transaction },
            );

            // Check that they own the target fleet
            if (targetFleet.ownerUserId != res.locals.user.id) {
                throw new HttpError(403, "not_owner");
            }

            // Check that the two fleets are in the same location
            if (fleet.locationSystemId != systemOfTargetFleet.id) {
                throw new HttpError(400, "not_in_same_location");
            }

            if (
                fleet.currentAction != "idling" ||
                targetFleet.currentAction != "idling"
            ) {
                // Both fleets must not be busy
                throw new HttpError(400, "fleet_busy");
            }

            await changeResourcesOfInventories(
                new Map([
                    [fleet.inventory, resourcesChangeFleet],
                    [targetFleet.inventory, resourcesChangeTarget],
                ]),
                transaction,
            );

            const { enoughShips, newCargoCapacities } =
                await changeShipsOfFleets(
                    {
                        [fleet.id]: shipsChangeFleet,
                        [targetFleet.id]: shipsChangeTarget,
                    },
                    transaction,
                );

            if (!enoughShips) {
                throw new HttpError(400, "not_enough_ships");
            }

            await Promise.all(
                [fleet, targetFleet].map(
                    async (f) =>
                        await f.inventory.update(
                            { capacity: newCargoCapacities[f.id] },
                            { transaction },
                        ),
                ),
            );

            res.json({ ...(newFleet ? { newFleetId: targetFleet.id } : {}) });
        });
    });

    router.post<
        paths["/fleets/{fleetId}/transfer-to-station"]["post"]["parameters"]["path"],
        | paths["/fleets/{fleetId}/transfer-to-station"]["post"]["responses"][200]["content"]["application/json"]
        | paths["/fleets/{fleetId}/transfer-to-station"]["post"]["responses"][400]["content"]["application/json"]
        | paths["/fleets/{fleetId}/transfer-to-station"]["post"]["responses"][403]["content"]["application/json"],
        paths["/fleets/{fleetId}/transfer-to-station"]["post"]["requestBody"]["content"]["application/json"]
    >("/fleets/:fleetId/transfer-to-station", async (req, res) => {
        await setupTransaction(sequelize, async (transaction) => {
            const fleet = await getOrNotFound<Fleet>(
                Fleet,
                req.params["fleetId"],
                res,
                {
                    transaction,
                    lock: true,
                    include: [{ model: Inventory, required: true }],
                },
            );

            // This cannot be queried while querying the fleet because this would
            // create a lock on the System. It is thus fetched separately.
            const systemOfFleet = await System.findByPk(
                fleet.locationSystemId,
                { transaction },
            );

            // Check that they own this fleet
            if (fleet.ownerUserId != res.locals.user.id) {
                throw new HttpError(403, "not_owner");
            }

            const resourcesFromFleetToStation =
                req.body.resourcesFromFleetToStation || {};
            const resourcesFromStationToFleet =
                req.body.resourcesFromStationToFleet || {};

            const resourcesChangeFleet = mergeByAdding(
                resourcesFromStationToFleet,
                oppositeOfValues(resourcesFromFleetToStation),
            );
            const resourcesChangeStation = mergeByAdding(
                resourcesFromFleetToStation,
                oppositeOfValues(resourcesFromStationToFleet),
            );

            // Check that this system has a station
            if (!systemOfFleet.hasStation) {
                throw new HttpError(
                    400,
                    "no_station",
                    "The system this fleet is in does not have a station",
                );
            }

            if (fleet.currentAction != "idling") {
                // Both fleets must not be busy
                throw new HttpError(400, "fleet_busy");
            }

            // Get, or create, the inventory of this fleet for this station
            let stationInventory = await StationInventory.findOne({
                where: {
                    userId: res.locals.user.id,
                    systemId: systemOfFleet.id,
                },
                transaction,
                lock: true,
            });

            if (stationInventory == null) {
                stationInventory = await StationInventory.create(
                    {
                        userId: res.locals.user.id,
                        systemId: systemOfFleet.id,
                        inventory: { capacity: -1 },
                    },
                    { transaction, include: [Inventory] },
                );
            }

            await changeResourcesOfInventories(
                new Map([
                    [fleet.inventory, resourcesChangeFleet],
                    [stationInventory.inventory, resourcesChangeStation],
                ]),
                transaction,
            );

            res.json({});
        });
    });

    router.get("/fleets/:fleetId", async (req, res) => {
        const fleet = await getOrNotFound<Fleet>(
            Fleet,
            req.params["fleetId"],
            res,
            {
                include: [
                    {
                        model: Inventory,
                        include: [{ model: InventoryItem }],
                        required: true,
                    },
                    {
                        model: FleetComposition,
                        include: [ShipType],
                    },
                ],
            },
        );

        res.json(serializeFleet(fleet));
    });

    router.post<
        paths["/fleets/{fleetId}/travel"]["post"]["parameters"]["path"],
        | paths["/fleets/{fleetId}/travel"]["post"]["responses"][200]["content"]["application/json"]
        | paths["/fleets/{fleetId}/travel"]["post"]["responses"][400]["content"]["application/json"]
        | paths["/fleets/{fleetId}/travel"]["post"]["responses"][403]["content"]["application/json"],
        paths["/fleets/{fleetId}/travel"]["post"]["requestBody"]["content"]["application/json"]
    >("/fleets/:fleetId/travel", async (req, res) => {
        await setupTransaction(sequelize, async (transaction) => {
            const fleet = await getOrNotFound<Fleet>(
                Fleet,
                req.params["fleetId"],
                res,
                {
                    transaction,
                    lock: true,
                },
            );

            // This cannot be queried while querying the fleet because this would
            // create a lock on the System. It is thus fetched separately.
            const systemOfFleet = await System.findByPk(
                fleet.locationSystemId,
                { transaction },
            );

            if (fleet == null) return;

            // Check that they own this fleet
            if (fleet.ownerUserId != res.locals.user.id) {
                throw new HttpError(403, "not_owner");
            }

            // Check if the fleet is not doing something else
            if (fleet.currentAction != "idling") {
                throw new HttpError(400, "fleet_busy");
            }

            // Check if the destination system exists
            const destinationSystemId = req.body[
                "destinationSystemId"
            ] as string;
            const destinationSystem = await getOrNotFound<System>(
                System,
                destinationSystemId,
                res,
                { transaction },
            );

            if (destinationSystem == null) return;

            // Check if the destination system is reachable
            const originSystem = systemOfFleet;

            if (originSystem.id == destinationSystemId) {
                throw new HttpError(400, "same_system");
            }

            const systemIds = [originSystem.id, destinationSystemId].sort();

            const systemLink = await SystemLink.findOne({
                where: {
                    firstSystemId: systemIds[0],
                    secondSystemId: systemIds[1],
                },
                transaction,
            });

            if (systemLink == null) {
                throw new HttpError(404, "system_not_reachable");
            }

            // Compute the time to reach the destination
            const travelDuration =
                Math.sqrt(
                    Math.pow(destinationSystem.y - originSystem.y, 2) +
                        Math.pow(destinationSystem.x - originSystem.x, 2),
                ) * SPEED;
            const departureTime = new Date(Date.now());
            const arrivalTime = new Date(Date.now() + travelDuration * 1000);

            // Apply the change
            fleet.currentAction = "traveling";
            fleet.locationSystemId = null;
            fleet.travelingFromSystemId = originSystem.id;
            fleet.travelingToSystemId = destinationSystemId;
            fleet.departureTime = departureTime;
            fleet.arrivalTime = arrivalTime;

            scheduleFleetArrival(fleet.id, arrivalTime);

            await fleet.save({ transaction });

            res.json({
                arrivalTime: arrivalTime.toISOString(),
                duration: travelDuration,
            });

            LOGGER.info("ship travelling", {
                travelingFromSystemId: originSystem.id,
                destinationSystemId,
                arrivalTime,
            });
        });
    });
}
