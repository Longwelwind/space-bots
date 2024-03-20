import ModuleType from "./models/static-game-data/ModuleType";
import Resource from "./models/static-game-data/Resource";
import Fleet from "./models/Fleet";
import ShipType from "./models/static-game-data/ShipType";
import Inventory from "./models/Inventory";
import System, {
    ASTEROID_REFRESH_INTERVAL_SECONDS,
} from "./models/static-game-data/System";
import Module from "./models/Module";
import User from "./models/User";
import Planet from "./models/static-game-data/Planet";
import { components } from "./schema";
import miningSizes from "./models/static-game-data/miningSizes";

export function serializeFleet(fleet: Fleet, showCargo = true) {
    return {
        id: fleet.id,
        owner: {
            type: "user",
            userId: fleet.ownerUserId,
        },
        locationSystemId: fleet.locationSystemId,
        currentAction: serializeFleetAction(fleet),
        ships: Object.fromEntries(
            fleet.fleetCompositions.map((c) => [
                c.shipTypeId,
                Number(c.quantity),
            ]),
        ),
        ...(showCargo
            ? {
                  cargo: serializeInventory(fleet.inventory),
              }
            : {}),
    };
}

export function serializeInventory(inventory: Inventory) {
    return Object.fromEntries(
        inventory.items.map((item) => [item.resourceId, Number(item.quantity)]),
    );
}

function serializeFleetAction(fleet: Fleet) {
    if (fleet.currentAction == "idling") {
        return null;
    } else if (fleet.currentAction == "mining") {
        return {
            type: "mining",
            finishTime: fleet.miningFinishTime,
        };
    } else if (fleet.currentAction == "traveling") {
        return {
            type: "traveling",
            departureTime: fleet.departureTime,
            arrivalTime: fleet.arrivalTime,
            travelingFromSystemId: fleet.travelingFromSystemId,
            travelingToSystemId: fleet.travelingToSystemId,
        };
    } else {
        throw new Error();
    }
}

export function serializeSystem(
    system: System,
    pointOfViewUserId: string,
    detailed: boolean,
) {
    return {
        id: system.id,
        name: system.name,
        x: system.x,
        y: system.y,
        ...(system.miningResourceId
            ? {
                  asteroid: {
                      miningResourceId: system.miningResourceId,
                      yield: system.miningYield,
                      size: system.miningSize,
                      ...(system.miningSize != "ENDLESS"
                          ? {
                                // For `quantityLeft`, check if the asteroid has refreshed or not
                                quantityLeft:
                                    Date.now() -
                                        system.firstMiningTimeForCycle.getTime() >
                                    ASTEROID_REFRESH_INTERVAL_SECONDS * 1000
                                        ? miningSizes[system.miningSize]
                                        : miningSizes[system.miningSize] -
                                          system.quantityMinedForCycle,
                            }
                          : {}),
                  },
              }
            : {}),
        ...(system.hasStation
            ? {
                  station: {
                      directSell: true,
                      buyShips: true,
                      cargo:
                          system.stationInventories.length > 0
                              ? serializeInventory(
                                    system.stationInventories[0].inventory,
                                )
                              : {},
                  },
              }
            : {}),
        neighboringSystems: system.systemLinks.map((link) => ({
            systemId: link.other(system),
        })),
    };
}

export function serializeUserForWebsite(user: User) {
    return {
        id: user.id,
        name: user.name,
        token: user.token,
        registered: user.registered,
    };
}

export function serializeUser(user: User, personal: boolean) {
    return {
        id: user.id,
        name: user.name,
        ...(personal
            ? {
                  credits: Number(BigInt(user.credits)),
                  createdAt: user.createdAt,
                  registered: user.registered,
              }
            : {}),
    };
}

export function serializePlanet(planet: Planet) {
    return {
        id: planet.id,
        name: planet.name,
        typeId: planet.typeId,
    };
}

export function serializeModule(module: Module) {
    return {
        moduleTypeId: module.moduleTypeId,
        level: module.level,
        ...(module.moduleType.kind == "refinery"
            ? {
                  kind: "refinery" as const,
                  jobs: module.jobs.map((job) => ({
                      count: job.count,
                      blueprintId: job.moduleTypeRefineryBlueprintId,
                      startTime: job.startTime.toISOString(),
                      finishTime: job.finishTime.toISOString(),
                  })),
              }
            : (() => {
                  throw new Error();
              })()),
    };
}

export function serializeModuleType(moduleType: ModuleType) {
    return {
        id: moduleType.id,
        name: moduleType.name,
        kind: moduleType.kind,
        levels: moduleType.levels
            .sort((a, b) => a.level - b.level)
            .map((level) => ({
                cost: {
                    ...(level.creditCost > 0
                        ? { credits: level.creditCost }
                        : {}),
                },
                ...(moduleType.kind == "refinery"
                    ? {
                          maxJobs: level.maxJobs,
                          ...(moduleType.getBlueprintsForLevel(level.level)
                              .length > 0
                              ? {
                                    blueprints: moduleType
                                        .getBlueprintsForLevel(level.level)
                                        .map((blueprint) => ({
                                            id: blueprint.id,
                                            credits: blueprint.creditCost,
                                            time: blueprint.time,
                                            inputs: Object.fromEntries(
                                                blueprint.inputResources.map(
                                                    (input) => [
                                                        input.resourceId,
                                                        input.quantity,
                                                    ],
                                                ),
                                            ),
                                            outputs: Object.fromEntries(
                                                blueprint.outputResources.map(
                                                    (input) => [
                                                        input.resourceId,
                                                        input.quantity,
                                                    ],
                                                ),
                                            ),
                                        })),
                                }
                              : {}),
                      }
                    : moduleType.kind == "shipyard"
                      ? {
                            ...(moduleType.getShipyardBlueprintsForLevel(
                                level.level,
                            ).length > 0
                                ? {
                                      blueprints: moduleType
                                          .getShipyardBlueprintsForLevel(
                                              level.level,
                                          )
                                          .map((blueprint) => ({
                                              credits: blueprint.creditCost,
                                              inputs: Object.fromEntries(
                                                  blueprint.inputResources.map(
                                                      (input) => [
                                                          input.resourceId,
                                                          input.quantity,
                                                      ],
                                                  ),
                                              ),
                                              shipTypeId: blueprint.shipTypeId,
                                          })),
                                  }
                                : {}),
                        }
                      : (() => {
                            throw new Error();
                        })()),
            })),
    };
}

export function serializeShipTypes(shipType: ShipType) {
    return {
        id: shipType.id,
        name: shipType.name,
        price: shipType.price,
    };
}

export function serializeResource(resource: Resource) {
    return {
        id: resource.id,
        name: resource.name,
        price: resource.price,
    };
}
