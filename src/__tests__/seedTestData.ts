import _ from "lodash";
import {
    Fleet,
    FleetComposition,
    Inventory,
    InventoryItem,
    MarketOrder,
    Module,
    ModuleRefineryJob,
    ModuleType,
    ModuleTypeLevel,
    ModuleTypeRefineryBlueprint,
    ModuleTypeRefineryBlueprintInputResource,
    ModuleTypeRefineryBlueprintOutputResource,
    Resource,
    ShipType,
    ShipTypeBuildResources,
    StationInventory,
    System,
    SystemLink,
    User,
    checkProductionDatabase,
} from "../database";
import { UUIDV4_1, UUIDV4_2, UUIDV4_3 } from "./helpers";
import { stat } from "fs";
import path from "path";
import logger from "../utils/logger";

const LOGGER = logger(path.relative(process.cwd(), __filename));

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
        };
    };
}

export default async function seedTestData(testData: TestData) {
    checkProductionDatabase();

    const options = {
        logging: false,
    };
    await Resource.bulkCreate(
        [
            { id: "aluminium", name: "Aluminium", price: 10 },
            { id: "zinc", name: "Zinc", price: 10 },
            { id: "titane", name: "Titane", price: 10 },
            { id: "zirconium", name: "Zirconium", price: 10 },
            { id: "mithril", name: "Mithril", price: 10 },
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
            },
            { id: "tashornia", name: "Tashornia", x: 3, y: 1 },
            {
                id: "duovin-anaon",
                name: "Duovin Anaon",
                x: 4,
                y: 4,
                miningResourceId: "mithril",
            },
            { id: "bitara", name: "Bitara", x: 6, y: 2 },
            { id: "reticulum", name: "Reticulum", x: 4, y: 0 },
            { id: "toloros", name: "Toloros", x: 5, y: -3 },
            { id: "legaka", name: "Legaka", x: 1, y: -2 },
            { id: "conaleko", name: "Conaleko", x: -1, y: -2 },
            { id: "fogelius", name: "Fogelius", x: -1, y: -3 },
            { id: "sumlas", name: "Sumlas", x: -3, y: -1 },
            { id: "sigma", name: "Sigma", x: -1, y: 1 },
            { id: "plotaria", name: "Plotaria", x: -2, y: 2 },
            {
                id: "corona",
                name: "Corona",
                x: -2,
                y: 4,
                miningResourceId: "zirconium",
            },
        ],
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

    await ShipType.bulkCreate(
        [
            { id: "miner", name: "Miner", miningPower: 1, price: 100 },
            { id: "fighter", name: "Fighter", price: 1000 },
        ],
        options,
    );

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
}
