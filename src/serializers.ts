import e from "express";
import { Fleet, Inventory, Resource, ShipType, System, User } from "./database";

export function serializeFleet(fleet: Fleet) {
    return {
        id: fleet.id,
        owner: {
            type: "user",
            userId: fleet.ownerUserId,
        },
        locationSystemId: fleet.locationSystemId,
        currentAction: serializeFleetAction(fleet),
        cargo: serializeInventory(fleet.inventory),
        ships: Object.fromEntries(
            fleet.fleetCompositions.map((c) => [
                c.shipTypeId,
                Number(c.quantity),
            ]),
        ),
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

export function serializeUser(user: User) {
    return {
        id: user.id,
        name: user.name,
        credits: Number(BigInt(user.credits)),
        createdAt: user.createdAt,
        registered: user.registered,
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
