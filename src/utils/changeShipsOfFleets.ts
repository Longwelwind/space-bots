import { Transaction } from "sequelize";
import { FleetComposition, Fleet } from "../database";
import asyncSequentialMap from "./asyncSequentialMap";

export default async function changeShipsOfFleets(
    shipsToChangeOfFleets: {
        [fleetId: string]: { [shipTypeId: string]: number };
    },
    transaction: Transaction,
): Promise<boolean> {
    // Fetch all the related fleet compositions, on the right order
    let fleetCompositionsForFleets = await asyncSequentialMap(
        Object.entries(shipsToChangeOfFleets).sort(
            (a, b) => parseInt(a[0]) - parseInt(b[0]),
        ),
        async ([fleetId, shipToChange]) =>
            [
                fleetId,
                await asyncSequentialMap(
                    Object.entries(shipToChange).sort((a, b) =>
                        a[0] < b[0] ? -1 : 1,
                    ),
                    async ([shipTypeId, _]) =>
                        [
                            shipTypeId,
                            await FleetComposition.findOne({
                                where: { fleetId, shipTypeId },
                                transaction,
                                lock: true,
                            }),
                        ] as [string, FleetComposition],
                ),
            ] as [string, [string, FleetComposition | null][]],
    );

    // For negative quantities, check if there are enough quantity to remove
    const notEnoughQuantity = fleetCompositionsForFleets.some(
        ([fleetId, resourcesToChange]) =>
            resourcesToChange.some(([shipTypeId, fleetComposition]) => {
                const quantity = shipsToChangeOfFleets[fleetId][shipTypeId];

                if (quantity >= 0) {
                    return false;
                }

                return (
                    fleetComposition == null ||
                    BigInt(fleetComposition.quantity) < -quantity
                );
            }),
    );

    if (notEnoughQuantity) {
        return false;
    }

    // Create new fleet compositions for added quantities for which there is no fleet compositions
    fleetCompositionsForFleets = await Promise.all(
        fleetCompositionsForFleets.map(async ([fleetId, resourcesToChange]) => [
            fleetId,
            await Promise.all(
                resourcesToChange.map(
                    async ([shipTypeId, fleetComposition]) => {
                        return [
                            shipTypeId,
                            fleetComposition == null
                                ? await FleetComposition.create(
                                      { fleetId, shipTypeId, quantity: 0 },
                                      { transaction, lock: true },
                                  )
                                : fleetComposition,
                        ] as [string, FleetComposition];
                    },
                ),
            ),
        ]),
    );

    // Apply the changes
    await Promise.all(
        fleetCompositionsForFleets.map(
            async ([fleetId, resourcesToChange]) =>
                await Promise.all(
                    resourcesToChange.map(
                        async ([shipTypeId, fleetComposition]) => {
                            fleetComposition.quantity = (
                                BigInt(fleetComposition.quantity) +
                                BigInt(
                                    shipsToChangeOfFleets[fleetId][shipTypeId],
                                )
                            ).toString();

                            // Delete if quantity is 0
                            if (
                                BigInt(fleetComposition.quantity) == BigInt(0)
                            ) {
                                await fleetComposition.destroy({ transaction });
                            } else {
                                await fleetComposition.save({ transaction });
                            }
                        },
                    ),
                ),
        ),
    );

    // Check if fleets need to be destroyed because there is no more ships
    const fleetIdsToBeDestroyed = (
        await Promise.all(
            Object.keys(shipsToChangeOfFleets).map(async (fleetId) => {
                return await Fleet.findByPk(fleetId, {
                    transaction,
                    include: FleetComposition,
                });
            }),
        )
    )
        .filter((fleet) => fleet.fleetCompositions.length == 0)
        .map((f) => f.id);

    await Fleet.destroy({
        where: { id: fleetIdsToBeDestroyed },
        transaction,
    });

    return true;
}
