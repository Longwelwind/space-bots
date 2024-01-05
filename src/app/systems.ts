import path from "path";
import logger from "../utils/logger";
import { Router } from "express";
import {
    Inventory,
    InventoryItem,
    MarketOrder,
    MarketTransaction,
    Resource,
    StationInventory,
    System,
    SystemLink,
    sequelize,
} from "../database";
import getOrNotFound from "../utils/getOrNotFound";
import { paths } from "../schema";
import { serializeSystem } from "../serializers";
import {
    marketGetOrdersRoute,
    marketInstantRoute,
    marketOrderRoute,
} from "../utils/marketRoutesHelpers";

const LOGGER = logger(path.relative(process.cwd(), __filename));

export default function addSystemsRoutes(router: Router) {
    router.get<
        paths["/systems/{systemId}"]["get"]["parameters"]["path"],
        paths["/systems/{systemId}"]["get"]["responses"][200]["content"]["application/json"],
        null
    >("/systems/:systemId", async (req, res) => {
        const system = await getOrNotFound<System>(
            System,
            req.params["systemId"],
            res,
            {
                include: [
                    { model: SystemLink, as: "firstSystemLinks" },
                    { model: SystemLink, as: "secondSystemLinks" },
                    {
                        model: StationInventory,
                        where: { userId: res.locals.user.id },
                        required: false,
                        include: [
                            { model: Inventory, include: [InventoryItem] },
                        ],
                    },
                ],
            },
        );

        res.json(serializeSystem(system, res.locals.user.id, true));
    });

    router.get<
        paths["/systems/{systemId}/market/resources/{resourceId}"]["get"]["parameters"]["path"],
        paths["/systems/{systemId}/market/resources/{resourceId}"]["get"]["responses"][200]["content"]["application/json"],
        null
    >("/systems/:systemId/market/resources/:resourceId", async (req, res) => {
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

        const [sellOrders, buyOrders] = await Promise.all(
            ["sell", "buy"].map(
                async (type) =>
                    await MarketOrder.findAll({
                        attributes: [
                            "price",
                            [
                                sequelize.fn("SUM", sequelize.col("quantity")),
                                "quantity",
                            ],
                        ],
                        where: {
                            type,
                            resourceId: resource.id,
                            systemId: system.id,
                        },
                        order: [
                            // @ts-expect-error I don't understand why it's complaining
                            [
                                sequelize.col("price"),
                                ...(type == "buy" ? ["DESC"] : []),
                            ],
                        ],
                        group: "price",
                        limit: 10,
                    }),
            ),
        );

        const lastTransactions = await MarketTransaction.findAll({
            attributes: [
                "price",
                "time",
                [sequelize.fn("SUM", sequelize.col("quantity")), "quantity"],
            ],
            where: {
                resourceId: resource.id,
                systemId: system.id,
            },
            order: [[sequelize.col("time"), "DESC"]],
            group: ["time", "price"],
            limit: 5,
        });

        res.send({
            sellOrders: sellOrders.map((s) => ({
                price: Number(BigInt(s.price)),
                quantity: Number(BigInt(s.quantity)),
            })),
            buyOrders: buyOrders.map((s) => ({
                price: Number(BigInt(s.price)),
                quantity: Number(BigInt(s.quantity)),
            })),
            lastTransactions: lastTransactions.map((t) => ({
                price: Number(t.price),
                quantity: Number(t.quantity),
                time: t.time.toISOString(),
            })),
        });
    });

    router.post<
        paths["/systems/{systemId}/market/resources/{resourceId}/instant-sell"]["post"]["parameters"]["path"],
        | paths["/systems/{systemId}/market/resources/{resourceId}/instant-sell"]["post"]["responses"][200]["content"]["application/json"]
        | paths["/systems/{systemId}/market/resources/{resourceId}/instant-sell"]["post"]["responses"][400]["content"]["application/json"]
        | paths["/systems/{systemId}/market/resources/{resourceId}/instant-sell"]["post"]["responses"][403]["content"]["application/json"],
        paths["/systems/{systemId}/market/resources/{resourceId}/instant-sell"]["post"]["requestBody"]["content"]["application/json"],
        null
    >(
        "/systems/:systemId/market/resources/:resourceId/instant-sell",
        async (req, res) => {
            await marketInstantRoute(req, res, "sell");
        },
    );

    router.post<
        paths["/systems/{systemId}/market/resources/{resourceId}/buy-orders"]["post"]["parameters"]["path"],
        | paths["/systems/{systemId}/market/resources/{resourceId}/buy-orders"]["post"]["responses"][200]["content"]["application/json"]
        | paths["/systems/{systemId}/market/resources/{resourceId}/buy-orders"]["post"]["responses"][400]["content"]["application/json"]
        | paths["/systems/{systemId}/market/resources/{resourceId}/buy-orders"]["post"]["responses"][403]["content"]["application/json"],
        paths["/systems/{systemId}/market/resources/{resourceId}/buy-orders"]["post"]["requestBody"]["content"]["application/json"]
    >(
        "/systems/:systemId/market/resources/:resourceId/buy-orders",
        async (req, res) => {
            await marketOrderRoute(req, res, "buy");
        },
    );

    router.post<
        paths["/systems/{systemId}/market/resources/{resourceId}/instant-buy"]["post"]["parameters"]["path"],
        | paths["/systems/{systemId}/market/resources/{resourceId}/instant-buy"]["post"]["responses"][200]["content"]["application/json"]
        | paths["/systems/{systemId}/market/resources/{resourceId}/instant-buy"]["post"]["responses"][400]["content"]["application/json"]
        | paths["/systems/{systemId}/market/resources/{resourceId}/instant-buy"]["post"]["responses"][403]["content"]["application/json"],
        paths["/systems/{systemId}/market/resources/{resourceId}/instant-buy"]["post"]["requestBody"]["content"]["application/json"],
        null
    >(
        "/systems/:systemId/market/resources/:resourceId/instant-buy",
        async (req, res) => {
            await marketInstantRoute(req, res, "buy");
        },
    );

    router.post<
        paths["/systems/{systemId}/market/resources/{resourceId}/sell-orders"]["post"]["parameters"]["path"],
        | paths["/systems/{systemId}/market/resources/{resourceId}/sell-orders"]["post"]["responses"][200]["content"]["application/json"]
        | paths["/systems/{systemId}/market/resources/{resourceId}/sell-orders"]["post"]["responses"][400]["content"]["application/json"]
        | paths["/systems/{systemId}/market/resources/{resourceId}/sell-orders"]["post"]["responses"][403]["content"]["application/json"],
        paths["/systems/{systemId}/market/resources/{resourceId}/sell-orders"]["post"]["requestBody"]["content"]["application/json"]
    >(
        "/systems/:systemId/market/resources/:resourceId/sell-orders",
        async (req, res) => {
            await marketOrderRoute(req, res, "sell");
        },
    );

    router.get<
        paths["/systems/{systemId}/market/resources/{resourceId}/sell-orders/my"]["get"]["parameters"]["path"],
        paths["/systems/{systemId}/market/resources/{resourceId}/sell-orders/my"]["get"]["responses"][200]["content"]["application/json"]
    >(
        "/systems/:systemId/market/resources/:resourceId/sell-orders/my",
        async (req, res) => {
            await marketGetOrdersRoute(req, res, "sell");
        },
    );

    router.get<
        paths["/systems/{systemId}/market/resources/{resourceId}/buy-orders/my"]["get"]["parameters"]["path"],
        paths["/systems/{systemId}/market/resources/{resourceId}/buy-orders/my"]["get"]["responses"][200]["content"]["application/json"]
    >(
        "/systems/:systemId/market/resources/:resourceId/buy-orders/my",
        async (req, res) => {
            await marketGetOrdersRoute(req, res, "buy");
        },
    );
}
