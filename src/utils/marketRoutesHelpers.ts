import { Request, Response } from "express";
import getOrNotFound from "./getOrNotFound";
import {
    Inventory,
    MarketOrder,
    MarketTransaction,
    Resource,
    StationInventory,
    System,
    User,
    sequelize,
} from "../database";
import HttpError from "./HttpError";
import acquireMarketLock from "./acquireMarketLock";
import { changeResourcesOfInventories } from "../app";
import setupTransaction from "./setupTransaction";
import { Op, Transaction } from "sequelize";
import paginatedListRoute from "./paginatedListRoute";

async function tryBuyOrSell(
    system: System,
    resource: Resource,
    quantity: bigint,
    maximumOrMinimumPricePerUnit: bigint,
    stationInventory: StationInventory,
    type: "buy" | "sell",
    user: User,
    transaction: Transaction,
): Promise<[bigint, bigint]> {
    let offsetBatch = 0;
    const batchSize = 1;
    let quantitiesExchanged = BigInt(0);
    let notEnoughCredits = false;
    let totalCreditsExchanged = BigInt(0);
    const creditsAvailable = BigInt(user.credits);
    const modifiedMarketOrders: MarketOrder[] = [];
    const creditsToGiveToUsers: { [userId: string]: number } = {};
    const resourcesToGiveToUsers: { [userId: string]: number } = {};
    const transactions: {
        otherUserId: string;
        quantity: bigint;
        price: bigint;
    }[] = [];

    do {
        const marketOrders = await MarketOrder.findAll({
            where: {
                type: type == "buy" ? "sell" : "buy",
                resourceId: resource.id,
                systemId: system.id,
                price: {
                    [type == "buy" ? Op.lte : Op.gte]:
                        maximumOrMinimumPricePerUnit,
                },
            },
            transaction,
            // @ts-expect-error I don't understand why it doesn't accept that...
            order: [["price", ...(type == "buy" ? [] : ["DESC"])]],
            offset: offsetBatch * batchSize,
            limit: batchSize,
        });

        if (marketOrders.length == 0) {
            // No more market orders to fulfill this order
            break;
        }

        marketOrders.forEach((marketOrder) => {
            let quantityToRemoveForThisMarketOrder = BigInt(
                Math.min(
                    Number(quantity - quantitiesExchanged),
                    Number(marketOrder.quantity),
                ),
            );

            // If it is a buy, check that the user has enough credits
            // to continue buying, otherwise, just buy what they can
            if (type == "buy") {
                if (
                    Math.floor(
                        Number(
                            (creditsAvailable - totalCreditsExchanged) /
                                BigInt(marketOrder.price),
                        ),
                    ) < quantityToRemoveForThisMarketOrder
                ) {
                    quantityToRemoveForThisMarketOrder = BigInt(
                        Math.floor(
                            Number(
                                (creditsAvailable - totalCreditsExchanged) /
                                    BigInt(marketOrder.price),
                            ),
                        ),
                    );
                    notEnoughCredits = true;
                }
            }

            const creditsExchangedForThisMarketOrder =
                BigInt(quantityToRemoveForThisMarketOrder) *
                BigInt(marketOrder.price);

            if (type == "buy") {
                // Give to the original seller their credits
                if (marketOrder.userId in creditsToGiveToUsers) {
                    creditsToGiveToUsers[marketOrder.userId] += Number(
                        creditsExchangedForThisMarketOrder,
                    );
                } else {
                    creditsToGiveToUsers[marketOrder.userId] = Number(
                        creditsExchangedForThisMarketOrder,
                    );
                }
            } else {
                // Give the ressource to the original buyer
                if (marketOrder.userId in resourcesToGiveToUsers) {
                    resourcesToGiveToUsers[marketOrder.userId] += Number(
                        quantityToRemoveForThisMarketOrder,
                    );
                } else {
                    resourcesToGiveToUsers[marketOrder.userId] = Number(
                        quantityToRemoveForThisMarketOrder,
                    );
                }
            }

            quantitiesExchanged += quantityToRemoveForThisMarketOrder;
            marketOrder.quantity = (
                BigInt(marketOrder.quantity) -
                BigInt(quantityToRemoveForThisMarketOrder)
            ).toString();
            totalCreditsExchanged =
                totalCreditsExchanged + creditsExchangedForThisMarketOrder;
            transactions.push({
                otherUserId: marketOrder.userId,
                quantity: quantityToRemoveForThisMarketOrder,
                price: BigInt(marketOrder.price),
            });

            modifiedMarketOrders.push(marketOrder);
        });

        if (marketOrders.length < batchSize) {
            // This batch was not complete, meaning that there is no more market orders
            // to fetch. Stop here.
            break;
        }

        offsetBatch++;
    } while (quantitiesExchanged < quantity && !notEnoughCredits);

    await Promise.all(
        modifiedMarketOrders.map(async (marketOrder) => {
            if (BigInt(marketOrder.quantity) > BigInt(0)) {
                await marketOrder.save({ transaction });
            } else {
                await marketOrder.destroy();
            }
        }),
    );

    if (type == "buy") {
        // Give the credits to those who have sold things
        await Promise.all(
            Object.entries(creditsToGiveToUsers).map(
                async ([userId, credits]) => {
                    await User.increment("credits", {
                        where: { id: userId },
                        by: credits,
                        transaction,
                    });
                },
            ),
        );
    } else {
        // Give resources to those who have bought things
        // Fetch inventoryId of the inventory station of all players
        const inventoryIdsByUserId = Object.fromEntries(
            await Promise.all(
                Object.entries(resourcesToGiveToUsers).map(
                    async ([userId, _q]) => {
                        const stationInventory = await StationInventory.findOne(
                            {
                                where: { userId, systemId: system.id },
                                transaction,
                            },
                        );

                        return [userId, stationInventory.inventoryId];
                    },
                ),
            ),
        );

        await changeResourcesOfInventories(
            Object.fromEntries(
                Object.keys(inventoryIdsByUserId).map((userId) => [
                    inventoryIdsByUserId[userId],
                    { [resource.id]: resourcesToGiveToUsers[userId] },
                ]),
            ),
            transaction,
        );
    }

    // Create transactions
    const timestamp = Date.now();
    await MarketTransaction.bulkCreate(
        transactions.map((t) => ({
            time: timestamp,
            sellerUserId: type == "buy" ? t.otherUserId : user.id,
            buyerUserId: type == "buy" ? user.id : t.otherUserId,
            price: t.price,
            quantity: t.quantity,
            resourceId: resource.id,
            systemId: system.id,
        })),
        { transaction },
    );

    const enoughResources = await changeResourcesOfInventories(
        {
            [stationInventory.inventoryId]: {
                [resource.id]: Number(
                    (type == "buy" ? BigInt(1) : BigInt(-1)) *
                        quantitiesExchanged,
                ),
            },
        },
        transaction,
    );

    if (!enoughResources) {
        throw new HttpError(400, "not_enough_resources");
    }

    if (type == "buy") {
        await (user as User).decrement("credits", {
            by: Number(totalCreditsExchanged),
            transaction,
        });
    } else {
        await (user as User).increment("credits", {
            by: Number(totalCreditsExchanged),
            transaction,
        });
    }

    return [totalCreditsExchanged, quantitiesExchanged];
}

export async function marketGetMyOrdersRoute(
    req: Request<
        { systemId: string; resourceId: string },
        any,
        { quantity: number; price: number }
    >,
    res: Response,
    type: "buy" | "sell",
) {
    const system = await getOrNotFound<System>(
        System,
        req.params["systemId"],
        res,
    );

    const resource = await getOrNotFound<Resource>(
        Resource,
        req.params["resourceId"],
        res,
    );

    const marketOrders = await MarketOrder.findAll({
        where: {
            resourceId: resource.id,
            systemId: system.id,
            userId: res.locals.user.id,
            type,
        },
        // @ts-expect-error Why does TS throw an error here???
        order: [["price", ...(type == "buy" ? ["DESC"] : [])]],
    });

    res.send(
        marketOrders.map((marketOrder) => ({
            price: Number(BigInt(marketOrder.price)),
            quantity: Number(BigInt(marketOrder.quantity)),
        })),
    );
}

export async function marketGetOrdersRoute(
    req: Request<
        { systemId: string; resourceId: string },
        any,
        { quantity: number; price: number }
    >,
    res: Response,
    type: "buy" | "sell",
) {
    const system = await getOrNotFound<System>(
        System,
        req.params["systemId"],
        res,
    );

    const resource = await getOrNotFound<Resource>(
        Resource,
        req.params["resourceId"],
        res,
    );

    await paginatedListRoute(
        req,
        res,
        MarketOrder,
        [{ colName: "price", ascending: type == "sell" }],
        (marketOrder) => ({
            quantity: Number(BigInt(marketOrder.quantity)),
            price: Number(BigInt(marketOrder.price)),
        }),
        {
            systemId: system.id,
            resourceId: resource.id,
            type,
        },
        [],
        ["price", [sequelize.fn("SUM", sequelize.col("quantity")), "quantity"]],
        "price",
    );
}

export async function marketOrderRoute(
    req: Request<
        { systemId: string; resourceId: string },
        Record<string, never>,
        { quantity: number; price: number }
    >,
    res: Response,
    type: "buy" | "sell",
) {
    await setupTransaction(sequelize, async (transaction) => {
        const system = await getOrNotFound<System>(
            System,
            req.params["systemId"],
            res,
            {
                transaction,
            },
        );

        const resource = await getOrNotFound<Resource>(
            Resource,
            req.params["resourceId"],
            res,
            { transaction },
        );

        let quantity = BigInt(req.body["quantity"]);
        const price = BigInt(req.body["price"]);

        // Check that this system has a station
        if (!system.hasStation) {
            throw new HttpError(
                400,
                "no_market",
                "This system does not have a market",
            );
        }

        // Fetch or create the inventory of this user in this station
        let stationInventory = await StationInventory.findOne({
            where: {
                userId: res.locals.user.id,
                systemId: system.id,
            },
            transaction,
            lock: true,
        });

        if (stationInventory == null) {
            const inventory = await Inventory.create({ transaction });
            stationInventory = await StationInventory.create(
                {
                    userId: res.locals.user.id,
                    systemId: system.id,
                    inventoryId: inventory.id,
                },
                { transaction },
            );
        }

        await acquireMarketLock(system.id, resource.id, transaction);

        // Fetch the current market order of this user
        let marketOrder = await MarketOrder.findOne({
            where: {
                userId: res.locals.user.id,
                resourceId: resource.id,
                systemId: system.id,
                type,
                price,
            },
            transaction,
        });

        if (marketOrder == null) {
            // Before creating an order, let's check if the order can't be
            // resolved or partially resolved now
            const [_, quantitiesExchanged] = await tryBuyOrSell(
                system,
                resource,
                quantity,
                price,
                stationInventory,
                type,
                res.locals.user,
                transaction,
            );

            quantity -= quantitiesExchanged;

            // If the order was completely fulfilled, stop here
            if (quantity == BigInt(0)) {
                res.send({});
                return;
            }

            marketOrder = MarketOrder.build({
                userId: res.locals.user.id,
                resourceId: resource.id,
                systemId: system.id,
                type,
                quantity: 0,
                price,
            });
        }

        const currentQuantityOnMarket = BigInt(marketOrder.quantity);

        // deltaQuantity > 0 means the user is adding quantity on this order
        // deltaQuantity < 0 means the user is removing quantity from this order
        const deltaQuantity = BigInt(quantity) - currentQuantityOnMarket;

        if (type == "sell") {
            // In the case of a sell order, the user sends or receives
            // resources
            const enoughResources = await changeResourcesOfInventories(
                {
                    [stationInventory.inventoryId]: {
                        [resource.id]: -Number(deltaQuantity),
                    },
                },
                transaction,
            );

            if (!enoughResources) {
                throw new HttpError(400, "not_enough_resources");
            }
        } else {
            // In the case of a buy order, the user sends or receives
            // credits
            const totalPrice = deltaQuantity * BigInt(price);
            if (deltaQuantity > 0) {
                if (res.locals.user.credits < totalPrice) {
                    throw new HttpError(400, "not_enough_credits");
                }

                res.locals.user.decrement("credits", {
                    by: deltaQuantity * BigInt(price),
                    transaction,
                });
            }
        }

        if (quantity > 0) {
            marketOrder.quantity = quantity.toString();
            await marketOrder.save({ transaction });
        } else {
            // Delete the order if quantity = 0
            await marketOrder.destroy({ transaction });
        }

        res.send({});
    });
}

export async function marketInstantRoute(
    req: Request<
        { resourceId: string; systemId: string },
        any,
        { quantity: number }
    >,
    res: Response,
    type: "buy" | "sell",
) {
    await setupTransaction(sequelize, async (transaction) => {
        const system = await getOrNotFound<System>(
            System,
            req.params["systemId"],
            res,
        );

        const resource = await getOrNotFound<Resource>(
            Resource,
            req.params["resourceId"],
            res,
        );

        const quantity = req.body["quantity"];

        // Check that this system has a station
        if (!system.hasStation) {
            throw new HttpError(
                400,
                "no_market",
                "This system does not have a market",
            );
        }

        // Fetch or create the inventory of this user in this station
        let stationInventory = await StationInventory.findOne({
            where: {
                userId: res.locals.user.id,
                systemId: system.id,
            },
            transaction,
            lock: true,
        });

        if (stationInventory == null) {
            const inventory = await Inventory.create({ transaction });
            stationInventory = await StationInventory.create(
                {
                    userId: res.locals.user.id,
                    systemId: system.id,
                    inventoryId: inventory.id,
                },
                { transaction },
            );
        }

        await acquireMarketLock(system.id, resource.id, transaction);

        const [totalCreditsExchanged, quantityExchanged] = await tryBuyOrSell(
            system,
            resource,
            BigInt(quantity),
            type == "buy"
                ? BigInt(Number.MAX_SAFE_INTEGER)
                : BigInt(Number.MIN_SAFE_INTEGER),
            stationInventory,
            type,
            res.locals.user,
            transaction,
        );

        if (type == "buy") {
            res.send({
                creditsSpent: Number(totalCreditsExchanged),
                quantityBought: Number(quantityExchanged),
            });
        } else {
            res.send({
                creditsGained: Number(totalCreditsExchanged),
                quantitySold: Number(quantityExchanged),
            });
        }
    });
}
