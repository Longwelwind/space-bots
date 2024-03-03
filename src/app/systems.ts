import path from "path";
import logger from "../utils/logger";
import { Router } from "express";
import { sequelize } from "../models/database";
import Resource from "../models/static-game-data/Resource";
import Fleet from "../models/Fleet";
import InventoryItem from "../models/InventoryItem";
import Inventory from "../models/Inventory";
import System from "../models/static-game-data/System";
import SystemLink from "../models/static-game-data/SystemLink";
import MarketTransaction from "../models/MarketTransaction";
import MarketOrder from "../models/MarketOrder";
import StationInventory from "../models/StationInventory";
import FleetComposition from "../models/FleetComposition";
import getOrNotFound from "../utils/getOrNotFound";
import { paths } from "../schema";
import { serializeFleet, serializeSystem } from "../serializers";
import {
    marketGetMyOrdersRoute,
    marketGetOrdersRoute,
    marketInstantRoute,
    marketOrderRoute,
} from "../utils/marketRoutesHelpers";
import paginatedListRoute from "../utils/paginatedListRoute";
import HttpError from "../utils/HttpError";

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

    router.get<
        paths["/systems/{systemId}/fleets"]["get"]["parameters"]["path"],
        | paths["/systems/{systemId}/fleets"]["get"]["responses"][200]["content"]["application/json"]
        | paths["/systems/{systemId}/fleets"]["get"]["responses"][404]["content"]["application/json"],
        null,
        paths["/systems/{systemId}/fleets"]["get"]["parameters"]["query"]
    >("/systems/:systemId/fleets", async (req, res) => {
        const system = await getOrNotFound<System>(
            System,
            req.params["systemId"],
            res,
        );

        // The user needs at least one fleet in the system
        // to see the fleets in the system
        const userFleet = await Fleet.findOne({
            where: { ownerUserId: res.locals.user.id },
        });
        if (userFleet == null) {
            throw new HttpError(
                400,
                "no_fleet_in_system",
                "You need to have a fleet in the system to see the other fleets in it",
            );
        }

        await paginatedListRoute(
            req,
            res,
            Fleet,
            [{ colName: "id", ascending: true }],
            (fleet) => serializeFleet(fleet, false),
            { locationSystemId: system.id },
            { model: FleetComposition },
        );
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
            await marketGetMyOrdersRoute(req, res, "sell");
        },
    );

    router.get<
        paths["/systems/{systemId}/market/resources/{resourceId}/buy-orders/my"]["get"]["parameters"]["path"],
        paths["/systems/{systemId}/market/resources/{resourceId}/buy-orders/my"]["get"]["responses"][200]["content"]["application/json"]
    >(
        "/systems/:systemId/market/resources/:resourceId/buy-orders/my",
        async (req, res) => {
            await marketGetMyOrdersRoute(req, res, "buy");
        },
    );

    router.get<
        paths["/systems/{systemId}/market/resources/{resourceId}/buy-orders"]["get"]["parameters"]["path"],
        paths["/systems/{systemId}/market/resources/{resourceId}/buy-orders"]["get"]["responses"][200]["content"]["application/json"]
    >(
        "/systems/:systemId/market/resources/:resourceId/buy-orders",
        async (req, res) => {
            await marketGetOrdersRoute(req, res, "buy");
        },
    );

    router.get<
        paths["/systems/{systemId}/market/resources/{resourceId}/sell-orders"]["get"]["parameters"]["path"],
        paths["/systems/{systemId}/market/resources/{resourceId}/sell-orders"]["get"]["responses"][200]["content"]["application/json"]
    >(
        "/systems/:systemId/market/resources/:resourceId/sell-orders",
        async (req, res) => {
            await marketGetOrdersRoute(req, res, "sell");
        },
    );
}
