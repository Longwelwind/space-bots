import { Transaction } from "sequelize";
import InventoryItem from "../models/InventoryItem";
import asyncSequentialMap from "./asyncSequentialMap";

export async function changeResourcesOfInventories(
    resourcesToChangeOfInventories: {
        [inventoryId: string]: { [resourceId: string]: number };
    },
    transaction: Transaction,
): Promise<boolean> {
    // Fetch all the related inventory items, on the right order
    let inventoryItemsForInventories = await asyncSequentialMap(
        Object.entries(resourcesToChangeOfInventories).sort(
            (a, b) => parseInt(a[0]) - parseInt(b[0]),
        ),
        async ([inventoryId, resourcesToChange]) =>
            [
                inventoryId,
                await asyncSequentialMap(
                    Object.entries(resourcesToChange).sort((a, b) =>
                        a[0] < b[0] ? -1 : 1,
                    ),
                    async ([resourceId, _]) =>
                        [
                            resourceId,
                            await InventoryItem.findOne({
                                where: { inventoryId, resourceId },
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
                const quantity =
                    resourcesToChangeOfInventories[inventoryId][resourceId];

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
        return false;
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
                                    resourcesToChangeOfInventories[inventoryId][
                                        resourceId
                                    ],
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

    return true;
}
