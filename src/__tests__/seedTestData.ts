import _ from "lodash";
import { checkProductionDatabase, sequelize } from "../models/database";
import ModuleType from "../models/static-game-data/ModuleType";
import Resource from "../models/static-game-data/Resource";
import Fleet from "../models/Fleet";
import ShipTypeBuildResources from "../models/static-game-data/ShipTypeBuildResources";
import ShipType from "../models/static-game-data/ShipType";
import InventoryItem from "../models/InventoryItem";
import Inventory from "../models/Inventory";
import System from "../models/static-game-data/System";
import ModuleTypeRefineryBlueprintOutputResource from "../models/static-game-data/ModuleTypeRefineryBlueprintOutputResource";
import ModuleTypeRefineryBlueprintInputResource from "../models/static-game-data/ModuleTypeRefineryBlueprintInputResource";
import ModuleTypeRefineryBlueprint from "../models/static-game-data/ModuleTypeRefineryBlueprint";
import ModuleTypeLevel from "../models/static-game-data/ModuleTypeLevel";
import SystemLink from "../models/static-game-data/SystemLink";
import MarketOrder from "../models/MarketOrder";
import StationInventory from "../models/StationInventory";
import FleetComposition from "../models/FleetComposition";
import ModuleRefineryJob from "../models/ModuleRefineryJob";
import Module from "../models/Module";
import User from "../models/User";
import { UUIDV4_1, UUIDV4_2, UUIDV4_3 } from "./helpers";
import path from "path";
import createLogger from "../utils/createLogger";
import PlanetType from "../models/static-game-data/PlanetType";
import Planet from "../models/static-game-data/Planet";
import ModuleTypeShipyardBlueprint from "../models/static-game-data/ModuleTypeShipyardBlueprint";
import ModuleTypeShipyardBlueprintInputResource from "../models/static-game-data/ModuleTypeShipyardBlueprintInputResource";
import ModuleTypeLevelResource from "../models/static-game-data/ModuleTypeLevelResource";

const LOGGER = createLogger(path.relative(process.cwd(), __filename));

interface TestData {
    fleets?: {
        id: string;
        ownerUserId: string;
        inventoryId: string;
        ships: { [shipTypeId: string]: number };
        cargo?: { [resourceId: string]: number };
        locationSystemId: string;
    }[];
    users?: {
        [userId: string]: {
            credits?: number;
        };
    };
    systems?: {
        [systemId: string]: {
            modules?: {
                [userId: string]: {
                    id: string;
                    moduleTypeId: string;
                    level: number;
                    jobs?: {
                        count: number;
                        blueprintId: string;
                    }[];
                }[];
            };
            stationInventories?: {
                [userId: string]: {
                    inventoryId: string;
                    content: { [resourceId: string]: number };
                };
            };
            market?: {
                [userId: string]: {
                    sellOrders?: {
                        [resourceId: string]: {
                            price: number;
                            quantity: number;
                        }[];
                    };
                    buyOrders?: {
                        [resourceId: string]: {
                            price: number;
                            quantity: number;
                        }[];
                    };
                };
            };
            quantityMinedForCycle?: number;
            firstMiningTimeForCycle?: Date;
        };
    };
}

export default async function seedTestData(testData: TestData) {
    checkProductionDatabase();

    const options = {
        logging: false,
        validate: true,
    };
    await Resource.bulkCreate(
        [
            { id: "aluminium", name: "Aluminium", price: 10 },
            { id: "zinc", name: "Zinc", price: 10 },
            { id: "titane", name: "Titane", price: 10 },
            { id: "zirconium", name: "Zirconium" },
            { id: "mithril", name: "Mithril", price: 10 },
        ],
        options,
    );

    await ShipType.bulkCreate(
        [
            {
                id: "miner",
                name: "Miner",
                miningPower: 1,
                price: 100,
                cargoCapacity: 10,
            },
            { id: "fighter", name: "Fighter", price: 1000 },
            {
                id: "admiral",
                name: "Admiral",
                leadershipValue: 10,
            },
        ],
        options,
    );

    await ModuleType.bulkCreate(
        [
            {
                id: "refinery-super-alloy",
                name: "Refinery of Super Alloy!!",
                kind: "refinery",
            },
            {
                id: "shipyard",
                name: "My Shipyard",
                kind: "shipyard",
            },
        ],
        options,
    );

    await ModuleTypeRefineryBlueprint.bulkCreate(
        [
            {
                id: "make-mithril",
                creditCost: 10,
                unlockLevel: 1,
                moduleTypeId: "refinery-super-alloy",
                time: 2,
            },
            {
                id: "make-mithril-improved",
                creditCost: 30,
                unlockLevel: 3,
                moduleTypeId: "refinery-super-alloy",
                time: 3,
            },
        ],
        options,
    );

    await ModuleTypeRefineryBlueprintInputResource.bulkCreate(
        [
            {
                moduleTypeRefineryBlueprintId: "make-mithril",
                resourceId: "aluminium",
                quantity: 15,
            },
            {
                moduleTypeRefineryBlueprintId: "make-mithril",
                resourceId: "zinc",
                quantity: 25,
            },
            {
                moduleTypeRefineryBlueprintId: "make-mithril-improved",
                resourceId: "aluminium",
                quantity: 10,
            },
            {
                moduleTypeRefineryBlueprintId: "make-mithril-improved",
                resourceId: "zinc",
                quantity: 20,
            },
        ],
        options,
    );

    await ModuleTypeRefineryBlueprintOutputResource.bulkCreate(
        [
            {
                moduleTypeRefineryBlueprintId: "make-mithril",
                resourceId: "mithril",
                quantity: 10,
            },
            {
                moduleTypeRefineryBlueprintId: "make-mithril-improved",
                resourceId: "mithril",
                quantity: 15,
            },
        ],
        options,
    );

    await ModuleTypeShipyardBlueprint.bulkCreate(
        [
            {
                id: "build-miner",
                moduleTypeId: "shipyard",
                creditCost: 10,
                unlockLevel: 1,
                shipTypeId: "miner",
            },
            {
                id: "build-fighter",
                moduleTypeId: "shipyard",
                creditCost: 10,
                unlockLevel: 3,
                shipTypeId: "fighter",
            },
        ],
        options,
    );

    await ModuleTypeShipyardBlueprintInputResource.bulkCreate(
        [
            {
                moduleTypeShipyardBlueprintId: "build-miner",
                resourceId: "aluminium",
                quantity: 10,
            },
            {
                moduleTypeShipyardBlueprintId: "build-fighter",
                resourceId: "aluminium",
                quantity: 15,
            },
        ],
        options,
    );

    await ModuleTypeLevel.bulkCreate(
        [
            {
                moduleTypeId: "refinery-super-alloy",
                level: 1,
                creditCost: 100,
                maxJobs: 1,
            },
            {
                moduleTypeId: "refinery-super-alloy",
                level: 2,
                creditCost: 400,
                maxJobs: 10,
            },
            {
                moduleTypeId: "refinery-super-alloy",
                level: 3,
                creditCost: 1000,
                maxJobs: 100,
            },
            {
                moduleTypeId: "shipyard",
                level: 1,
                creditCost: 100,
            },
            {
                moduleTypeId: "shipyard",
                level: 2,
                creditCost: 40,
            },
            {
                moduleTypeId: "shipyard",
                level: 3,
                creditCost: 100,
            },
        ],
        options,
    );

    await ModuleTypeLevelResource.bulkCreate(
        [
            {
                moduleTypeId: "refinery-super-alloy",
                level: 1,
                resourceId: "zinc",
                quantity: 3,
            },
        ],
        options,
    );

    await System.bulkCreate(
        [
            {
                id: "omega",
                name: "Omega",
                x: 0,
                y: 0,
                hasStation: true,
                startingSystem: true,
            },
            {
                id: "mega-torox",
                name: "Mega Torox",
                x: 2,
                y: 2,
                miningResourceId: "aluminium",
                miningSize: "ENDLESS",
                miningYield: "VERY_LOW",
            },
            { id: "tashornia", name: "Tashornia", x: 3, y: 1 },
            {
                id: "duovin-anaon",
                name: "Duovin Anaon",
                x: 4,
                y: 4,
                miningResourceId: "mithril",
                miningSize: "ENDLESS",
                miningYield: "VERY_LOW",
            },
            { id: "bitara", name: "Bitara", x: 6, y: 2 },
            { id: "reticulum", name: "Reticulum", x: 4, y: 0 },
            { id: "toloros", name: "Toloros", x: 5, y: -3 },
            { id: "legaka", name: "Legaka", x: 1, y: -2 },
            { id: "conaleko", name: "Conaleko", x: -1, y: -2 },
            { id: "fogelius", name: "Fogelius", x: -1, y: -3 },
            { id: "sumlas", name: "Sumlas", x: -3, y: -1 },
            { id: "sigma", name: "Sigma", x: -1, y: 1 },
            {
                id: "plotaria",
                name: "Plotaria",
                x: -2,
                y: 2,
                miningResourceId: "zirconium",
                miningSize: "SMALL",
                miningYield: "VERY_HIGH",
            },
            {
                id: "corona",
                name: "Corona",
                x: -2,
                y: 4,
                miningResourceId: "zirconium",
                miningSize: "SMALL",
                miningYield: "VERY_LOW",
            },
        ].map((i) => ({
            ...i,
            ...(testData.systems && testData.systems[i.id]
                ? {
                      quantityMinedForCycle:
                          testData.systems[i.id].quantityMinedForCycle,
                      firstMiningTimeForCycle:
                          testData.systems[i.id].firstMiningTimeForCycle,
                  }
                : {}),
        })),
        options,
    );

    await SystemLink.bulkCreate(
        [
            { firstSystemId: "mega-torox", secondSystemId: "omega" },
            { firstSystemId: "omega", secondSystemId: "sigma" },
            { firstSystemId: "legaka", secondSystemId: "omega" },
            { firstSystemId: "omega", secondSystemId: "tashornia" },
            { firstSystemId: "duovin-anaon", secondSystemId: "mega-torox" },
            { firstSystemId: "bitara", secondSystemId: "duovin-anaon" },
            { firstSystemId: "bitara", secondSystemId: "tashornia" },
            { firstSystemId: "bitara", secondSystemId: "reticulum" },
            { firstSystemId: "reticulum", secondSystemId: "tashornia" },
            { firstSystemId: "reticulum", secondSystemId: "toloros" },
            { firstSystemId: "legaka", secondSystemId: "toloros" },
            { firstSystemId: "conaleko", secondSystemId: "legaka" },
            { firstSystemId: "conaleko", secondSystemId: "sumlas" },
            { firstSystemId: "conaleko", secondSystemId: "fogelius" },
            { firstSystemId: "fogelius", secondSystemId: "sumlas" },
            { firstSystemId: "plotaria", secondSystemId: "sumlas" },
            { firstSystemId: "corona", secondSystemId: "plotaria" },
            { firstSystemId: "plotaria", secondSystemId: "sigma" },
        ],
        options,
    );

    await PlanetType.bulkCreate([
        { id: "continental" },
        { id: "desertic" },
        { id: "barren" },
        { id: "volcanous" },
        { id: "frozen" },
        { id: "oceanic" },
        { id: "tropical" },
    ]);

    await Planet.bulkCreate([
        {
            id: "sol",
            name: "Sol",
            systemId: "omega",
            order: "1",
            typeId: "continental",
        },
        {
            id: "omega-ii",
            name: "Omega II",
            systemId: "omega",
            order: "2",
            typeId: "barren",
        },
        {
            id: "Bitara 1",
            systemId: "bitara",
            order: "1",
            typeId: "barren",
        },
    ]);

    await ShipTypeBuildResources.bulkCreate(
        [
            {
                shipTypeId: "fighter",
                resourceId: "aluminium",
                quantity: 10,
            },
            { shipTypeId: "fighter", resourceId: "zinc", quantity: 15 },
        ],
        options,
    );

    await User.bulkCreate(
        [
            {
                id: UUIDV4_1,
                name: "Longwelwind",
                token: "longwelwind",
                credits: testData?.users?.[UUIDV4_1]?.credits || 0,
            },
            {
                id: UUIDV4_2,
                name: "User2",
                token: "user2",
                credits: testData?.users?.[UUIDV4_2]?.credits || 0,
            },
            {
                id: UUIDV4_3,
                name: "User3",
                token: "user3",
                credits: testData?.users?.[UUIDV4_3]?.credits || 0,
            },
        ],
        options,
    );

    await Inventory.bulkCreate(
        [
            ...(testData.fleets
                ? testData.fleets.map((fleetTestData) => ({
                      id: fleetTestData.inventoryId,
                      // This is temporary, updated just after
                      capacity: -1,
                  }))
                : []),
            ...(testData.systems
                ? _.flatMap(
                      Object.entries(testData.systems).map(
                          ([systemId, systemTestData]) =>
                              systemTestData.stationInventories
                                  ? Object.entries(
                                        systemTestData.stationInventories,
                                    ).map(
                                        ([
                                            _userId,
                                            stationInventoryTestData,
                                        ]) => ({
                                            id: stationInventoryTestData.inventoryId,
                                            capacity: -1,
                                        }),
                                    )
                                  : [],
                      ),
                  )
                : []),
        ],
        options,
    );

    await InventoryItem.bulkCreate(
        [
            ...(testData.fleets
                ? _.flatMap(
                      testData.fleets.map((fleetTestData) =>
                          fleetTestData.cargo
                              ? Object.entries(fleetTestData.cargo).map(
                                    ([resourceId, quantity]) => ({
                                        inventoryId: fleetTestData.inventoryId,
                                        resourceId,
                                        quantity,
                                    }),
                                )
                              : [],
                      ),
                  )
                : []),
            ...(testData.systems
                ? _.flatMap(
                      Object.entries(testData.systems).map(
                          ([systemId, systemTestData]) =>
                              systemTestData.stationInventories
                                  ? _.flatMap(
                                        Object.entries(
                                            systemTestData.stationInventories,
                                        ).map(
                                            ([
                                                userId,
                                                stationInventoryTestData,
                                            ]) =>
                                                Object.entries(
                                                    stationInventoryTestData.content,
                                                ).map(
                                                    ([
                                                        resourceId,
                                                        quantity,
                                                    ]) => ({
                                                        inventoryId:
                                                            stationInventoryTestData.inventoryId,
                                                        resourceId,
                                                        quantity,
                                                    }),
                                                ),
                                        ),
                                    )
                                  : [],
                      ),
                  )
                : []),
        ],
        options,
    );

    await StationInventory.bulkCreate(
        [
            ...(testData.systems
                ? _.flatMap(
                      Object.entries(testData.systems).map(
                          ([systemId, systemTestData]) =>
                              systemTestData.stationInventories
                                  ? Object.entries(
                                        systemTestData.stationInventories,
                                    ).map(
                                        ([
                                            userId,
                                            stationInventoryTestData,
                                        ]) => ({
                                            userId,
                                            inventoryId:
                                                stationInventoryTestData.inventoryId,
                                            systemId,
                                        }),
                                    )
                                  : [],
                      ),
                  )
                : []),
        ],
        options,
    );

    await Fleet.bulkCreate(
        testData.fleets
            ? testData.fleets.map((fleetTestData) => ({
                  id: fleetTestData.id,
                  ownerUserId: fleetTestData.ownerUserId,
                  inventoryId: fleetTestData.inventoryId,
                  locationSystemId: fleetTestData.locationSystemId,
              }))
            : [],
        options,
    );

    await FleetComposition.bulkCreate(
        testData.fleets
            ? _.flatMap(
                  testData.fleets.map((fleetTestData) =>
                      fleetTestData.ships
                          ? Object.entries(fleetTestData.ships).map(
                                ([shipTypeId, quantity]) => ({
                                    fleetId: fleetTestData.id,
                                    shipTypeId: shipTypeId,
                                    quantity,
                                }),
                            )
                          : [],
                  ),
              )
            : [],
        options,
    );

    await MarketOrder.bulkCreate(
        [
            ...(testData.systems
                ? _.flatMap(
                      Object.entries(testData.systems).map(
                          ([systemId, systemTestData]) =>
                              systemTestData.market
                                  ? _.flatMap(
                                        Object.entries(
                                            systemTestData.market,
                                        ).map(([userId, marketTestData]) =>
                                            _.flatMap(
                                                marketTestData.buyOrders
                                                    ? Object.entries(
                                                          marketTestData.buyOrders,
                                                      ).map(
                                                          ([
                                                              resourceId,
                                                              orders,
                                                          ]) =>
                                                              orders.map(
                                                                  (order) => ({
                                                                      price: order.price,
                                                                      quantity:
                                                                          order.quantity,
                                                                      userId,
                                                                      systemId,
                                                                      type: "buy",
                                                                      resourceId,
                                                                  }),
                                                              ),
                                                      )
                                                    : [],
                                            ),
                                        ),
                                    )
                                  : [],
                      ),
                  )
                : []),
            ...(testData.systems
                ? _.flatMap(
                      Object.entries(testData.systems).map(
                          ([systemId, systemTestData]) =>
                              systemTestData.market
                                  ? _.flatMap(
                                        Object.entries(
                                            systemTestData.market,
                                        ).map(([userId, marketTestData]) =>
                                            _.flatMap(
                                                marketTestData.sellOrders
                                                    ? Object.entries(
                                                          marketTestData.sellOrders,
                                                      ).map(
                                                          ([
                                                              resourceId,
                                                              orders,
                                                          ]) =>
                                                              orders.map(
                                                                  (order) => ({
                                                                      price: order.price,
                                                                      quantity:
                                                                          order.quantity,
                                                                      userId,
                                                                      systemId,
                                                                      type: "sell",
                                                                      resourceId,
                                                                  }),
                                                              ),
                                                      )
                                                    : [],
                                            ),
                                        ),
                                    )
                                  : [],
                      ),
                  )
                : []),
        ],
        options,
    );

    await Module.bulkCreate(
        [
            ...(testData.systems
                ? _.flatMap(
                      Object.entries(testData.systems).map(
                          ([systemId, systemData]) =>
                              systemData.modules
                                  ? _.flatMap(
                                        Object.entries(systemData.modules).map(
                                            ([userId, modulesData]) =>
                                                modulesData.map(
                                                    (moduleData) => ({
                                                        id: moduleData.id,
                                                        systemId,
                                                        userId,
                                                        moduleTypeId:
                                                            moduleData.moduleTypeId,
                                                        level: moduleData.level,
                                                    }),
                                                ),
                                        ),
                                    )
                                  : [],
                      ),
                  )
                : []),
        ],
        options,
    );

    await ModuleRefineryJob.bulkCreate(
        [
            ...(testData.systems
                ? _.flatMap(
                      Object.entries(testData.systems).map(
                          ([_systemId, systemData]) =>
                              systemData.modules
                                  ? _.flatMap(
                                        Object.entries(systemData.modules).map(
                                            ([_userId, modulesData]) =>
                                                _.flatMap(
                                                    modulesData.map(
                                                        (moduleData) =>
                                                            moduleData.jobs
                                                                ? moduleData.jobs.map(
                                                                      (
                                                                          job,
                                                                      ) => ({
                                                                          moduleId:
                                                                              moduleData.id,
                                                                          moduleTypeRefineryBlueprintId:
                                                                              job.blueprintId,
                                                                          count: job.count,
                                                                          startTime:
                                                                              new Date(),
                                                                          finishTime:
                                                                              new Date(),
                                                                      }),
                                                                  )
                                                                : [],
                                                    ),
                                                ),
                                        ),
                                    )
                                  : [],
                      ),
                  )
                : []),
        ],
        options,
    );

    // Update the capacity of the fleets' inventories
    await sequelize.query(
        `
        UPDATE
            "Inventories"
        SET
            capacity = total
        FROM (
            SELECT
                "Fleets"."inventoryId" AS "inventoryId",
                SUM("ShipTypes"."cargoCapacity" * "FleetCompositions".quantity) AS total
            FROM
                "Fleets"
                INNER JOIN "FleetCompositions" ON "FleetCompositions"."fleetId" = "Fleets"."id"
                INNER JOIN "ShipTypes" ON "ShipTypes".id = "FleetCompositions"."shipTypeId"
            GROUP BY
                "Fleets".id) AS "Totals"
        WHERE
            "Inventories".id = "Totals"."inventoryId"
    `,
        options,
    );
}
