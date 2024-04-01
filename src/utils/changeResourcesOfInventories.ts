import { QueryTypes, Transaction } from "sequelize";
import InventoryItem from "../models/InventoryItem";
import asyncSequentialMap from "./asyncSequentialMap";
import Inventory from "../models/Inventory";
import { sequelize } from "../models/database";
import _ from "lodash";
import HttpError from "./HttpError";
import createLogger from "./createLogger";
import moduleName from "./moduleName";

const LOGGER = createLogger(moduleName(__filename));

export async function changeResourcesOfInventories(
    resourcesToChangeOfInventories: Map<
        Inventory,
        { [resourceId: string]: number }
    >,
    transaction: Transaction,
    limitToAvailableCargo = false,
): Promise<void> {
    // First check if the capacity of the inventories checks out
    const inventoriesWithLimitedCapacity = [
        ...resourcesToChangeOfInventories.keys(),
    ].filter((i) => i.capacity > -1);

    // Get the capacity left of all inventories who do not
    // have infinite capacity
    const capacityLeftOfInventories =
        inventoriesWithLimitedCapacity.length > 0
            ? Object.fromEntries(
                  (
                      await sequelize.query<{
                          inventoryId: string;
                          total: number;
                      }>(
                          `
                SELECT
                    "Inventories"."id" AS "inventoryId",
                    "Inventories".capacity - COALESCE(SUM("InventoryItems".quantity), 0) AS total
                FROM
                    "Inventories"
                    LEFT JOIN "InventoryItems" ON "InventoryItems"."inventoryId" = "Inventories"."id"
                WHERE
                    "Inventories".id IN(?)
                GROUP BY
                    "Inventories".id
            `,
                          {
                              transaction,
                              replacements: [
                                  inventoriesWithLimitedCapacity.map(
                                      (i) => i.id,
                                  ),
                              ],
                              type: QueryTypes.SELECT,
                          },
                      )
                  ).map(({ inventoryId, total }) => [inventoryId, total]),
              )
            : {};

    if (!limitToAvailableCargo) {
        const notEnoughCapacity = inventoriesWithLimitedCapacity.some(
            (inventory) =>
                _.sum(
                    Object.values(
                        resourcesToChangeOfInventories.get(inventory),
                    ),
                ) > capacityLeftOfInventories[inventory.id],
        );

        if (notEnoughCapacity) {
            throw new HttpError(400, "not_enough_capacity");
        }
    } else {
        // Change resourcesToChangeofInventories so that
        // the delta of resources matches the available capacity
        resourcesToChangeOfInventories.forEach(
            (resourcesToChange, inventory) => {
                if (inventory.capacity == -1) {
                    return;
                }
                let capacityLeft = capacityLeftOfInventories[inventory.id];

                Object.entries(resourcesToChange).forEach(
                    ([resourceId, quantity]) => {
                        if (capacityLeft == 0) {
                            return;
                        }
                        const quantityToAdd = Math.min(capacityLeft, quantity);
                        resourcesToChange[resourceId] = quantityToAdd;

                        capacityLeft -= quantity;
                    },
                );
            },
        );
    }

    // Fetch all the related inventory items, on the right order
    let inventoryItemsForInventories = await asyncSequentialMap(
        [...resourcesToChangeOfInventories.entries()].sort(
            (a, b) => parseInt(a[0].id) - parseInt(b[0].id),
        ),
        async ([inventory, resourcesToChange]) =>
            [
                inventory.id,
                await asyncSequentialMap(
                    Object.entries(resourcesToChange).sort((a, b) =>
                        a[0] < b[0] ? -1 : 1,
                    ),
                    async ([resourceId, _]) =>
                        [
                            resourceId,
                            await InventoryItem.findOne({
                                where: {
                                    inventoryId: inventory.id,
                                    resourceId,
                                },
                                transaction,
                                lock: true,
                            }),
                        ] as [string, InventoryItem],
                ),
            ] as [string, [string, InventoryItem | null][]],
    );

    // For negative quantities, check if there are enough quantity to remove
    const notEnoughQuantity = inventoryItemsForInventories.some(
        ([inventoryId, resourcesToChange]) =>
            resourcesToChange.some(([resourceId, inventoryItem]) => {
                const quantity = resourcesToChangeOfInventories.get(
                    [...resourcesToChangeOfInventories.keys()].find(
                        (i) => i.id == inventoryId,
                    ),
                )[resourceId];

                if (quantity >= 0) {
                    return false;
                }

                return (
                    inventoryItem == null ||
                    BigInt(inventoryItem.quantity) < -quantity
                );
            }),
    );

    if (notEnoughQuantity) {
        throw new HttpError(400, "not_enough_resources");
    }

    // Create new inventory items for added quantities for which there is no inventory items
    inventoryItemsForInventories = await Promise.all(
        inventoryItemsForInventories.map(
            async ([inventoryId, resourcesToChange]) => [
                inventoryId,
                await Promise.all(
                    resourcesToChange.map(
                        async ([resourceId, inventoryItem]) => {
                            return [
                                resourceId,
                                inventoryItem == null
                                    ? await InventoryItem.create(
                                          {
                                              inventoryId,
                                              resourceId,
                                              quantity: 0,
                                          },
                                          { transaction },
                                      )
                                    : inventoryItem,
                            ] as [string, InventoryItem];
                        },
                    ),
                ),
            ],
        ),
    );

    // Apply the changes
    await Promise.all(
        inventoryItemsForInventories.map(
            async ([inventoryId, resourcesToChange]) =>
                await Promise.all(
                    resourcesToChange.map(
                        async ([resourceId, inventoryItem]) => {
                            inventoryItem.quantity = (
                                BigInt(inventoryItem.quantity) +
                                BigInt(
                                    resourcesToChangeOfInventories.get(
                                        [
                                            ...resourcesToChangeOfInventories.keys(),
                                        ].find((i) => i.id == inventoryId),
                                    )[resourceId],
                                )
                            ).toString();

                            // Delete if quantity is 0
                            if (BigInt(inventoryItem.quantity) == BigInt(0)) {
                                await inventoryItem.destroy({ transaction });
                            } else {
                                await inventoryItem.save({ transaction });
                            }
                        },
                    ),
                ),
        ),
    );
}
