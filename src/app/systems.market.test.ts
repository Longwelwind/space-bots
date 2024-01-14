import testSetup from "../__tests__/testSetup";
import request from "supertest";
import { UUIDV4_1, UUIDV4_2, UUIDV4_3 } from "../__tests__/helpers";
import app from "../app";
import seedTestData from "../__tests__/seedTestData";

describe("/v1/systems/{systemId}/market", () => {
    testSetup();

    test("GET /v1/systems/{systemId}/market/resources/{resourceId}", async () => {
        await seedTestData({
            systems: {
                omega: {
                    market: {
                        [UUIDV4_1]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 3 },
                                    { price: 11, quantity: 2 },
                                ],
                                zinc: [{ price: 10, quantity: 1 }],
                            },
                        },
                        [UUIDV4_2]: {
                            sellOrders: {
                                aluminium: [{ price: 10, quantity: 4 }],
                            },
                            buyOrders: {
                                aluminium: [{ price: 9, quantity: 1 }],
                            },
                        },
                    },
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {},
                        },
                        [UUIDV4_2]: {
                            inventoryId: UUIDV4_2,
                            content: {},
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .get("/v1/systems/omega/market/resources/aluminium")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body.sellOrders).toEqual([
            { price: 10, quantity: 7 },
            { price: 11, quantity: 2 },
        ]);
        expect(res.body.buyOrders).toEqual([{ price: 9, quantity: 1 }]);
    });

    test("GET /v1/systems/{systemId}/market/resources/{resourceId}/sell-orders/my", async () => {
        await seedTestData({
            systems: {
                omega: {
                    market: {
                        [UUIDV4_1]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 3 },
                                    { price: 11, quantity: 2 },
                                ],
                                zinc: [{ price: 10, quantity: 1 }],
                            },
                            buyOrders: {
                                aluminium: [{ price: 9, quantity: 3 }],
                            },
                        },
                        [UUIDV4_2]: {
                            sellOrders: {
                                aluminium: [{ price: 10, quantity: 4 }],
                            },
                            buyOrders: {
                                aluminium: [{ price: 9, quantity: 1 }],
                            },
                        },
                    },
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {},
                        },
                        [UUIDV4_2]: {
                            inventoryId: UUIDV4_2,
                            content: {},
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .get("/v1/systems/omega/market/resources/aluminium/sell-orders/my")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body).toEqual([
            { price: 10, quantity: 3 },
            { price: 11, quantity: 2 },
        ]);
    });

    test("GET /v1/systems/{systemId}/market/resources/{resourceId}/buy-orders pass", async () => {
        await seedTestData({
            systems: {
                omega: {
                    market: {
                        [UUIDV4_1]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 3 },
                                    { price: 11, quantity: 2 },
                                ],
                                zinc: [{ price: 10, quantity: 1 }],
                            },
                            buyOrders: {
                                aluminium: [
                                    { price: 9, quantity: 3 },
                                    { price: 8, quantity: 4 },
                                ],
                            },
                        },
                        [UUIDV4_2]: {
                            sellOrders: {
                                aluminium: [{ price: 10, quantity: 4 }],
                            },
                            buyOrders: {
                                aluminium: [{ price: 9, quantity: 1 }],
                            },
                        },
                    },
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {},
                        },
                        [UUIDV4_2]: {
                            inventoryId: UUIDV4_2,
                            content: {},
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .get("/v1/systems/omega/market/resources/aluminium/buy-orders")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
            items: [
                { price: 9, quantity: 4 },
                { price: 8, quantity: 4 },
            ],
            pagination: {
                total: 2,
            },
        });
    });

    test("GET /v1/systems/{systemId}/market/resources/{resourceId}/sell-orders pass", async () => {
        await seedTestData({
            systems: {
                omega: {
                    market: {
                        [UUIDV4_1]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 3 },
                                    { price: 11, quantity: 2 },
                                    { price: 15, quantity: 10 },
                                    { price: 17, quantity: 4 },
                                ],
                                zinc: [{ price: 10, quantity: 1 }],
                            },
                            buyOrders: {
                                aluminium: [
                                    { price: 9, quantity: 3 },
                                    { price: 8, quantity: 4 },
                                ],
                            },
                        },
                        [UUIDV4_2]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 4 },
                                    { price: 13, quantity: 1 },
                                    { price: 20, quantity: 4 },
                                ],
                            },
                            buyOrders: {
                                aluminium: [{ price: 9, quantity: 1 }],
                            },
                        },
                        [UUIDV4_3]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 2 },
                                    { price: 13, quantity: 4 },
                                ],
                            },
                            buyOrders: {
                                aluminium: [{ price: 9, quantity: 1 }],
                            },
                        },
                    },
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {},
                        },
                        [UUIDV4_2]: {
                            inventoryId: UUIDV4_2,
                            content: {},
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .get("/v1/systems/omega/market/resources/aluminium/sell-orders")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
            items: [
                { price: 10, quantity: 9 },
                { price: 11, quantity: 2 },
                { price: 13, quantity: 5 },
                { price: 15, quantity: 10 },
                { price: 17, quantity: 4 },
                { price: 20, quantity: 4 },
            ],
            pagination: {
                total: 6,
            },
        });
    });

    test("GET /v1/systems/{systemId}/market/resources/{resourceId}/sell-orders with a next page", async () => {
        await seedTestData({
            systems: {
                omega: {
                    market: {
                        [UUIDV4_1]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 3 },
                                    { price: 11, quantity: 2 },
                                    { price: 15, quantity: 10 },
                                    { price: 17, quantity: 4 },
                                ],
                                zinc: [{ price: 10, quantity: 1 }],
                            },
                            buyOrders: {
                                aluminium: [
                                    { price: 9, quantity: 3 },
                                    { price: 8, quantity: 4 },
                                ],
                            },
                        },
                        [UUIDV4_2]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 4 },
                                    { price: 13, quantity: 1 },
                                    { price: 20, quantity: 4 },
                                ],
                            },
                            buyOrders: {
                                aluminium: [{ price: 9, quantity: 1 }],
                            },
                        },
                        [UUIDV4_3]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 2 },
                                    { price: 13, quantity: 4 },
                                ],
                            },
                            buyOrders: {
                                aluminium: [{ price: 9, quantity: 1 }],
                            },
                        },
                    },
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {},
                        },
                        [UUIDV4_2]: {
                            inventoryId: UUIDV4_2,
                            content: {},
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .get(
                "/v1/systems/omega/market/resources/aluminium/sell-orders?count=2",
            )
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
            items: [
                { price: 10, quantity: 9 },
                { price: 11, quantity: 2 },
            ],
            pagination: {
                total: 6,
                pageNext: "11",
            },
        });
    });

    test("GET /v1/systems/{systemId}/market/resources/{resourceId}/sell-orders with a specified pageNext", async () => {
        await seedTestData({
            systems: {
                omega: {
                    market: {
                        [UUIDV4_1]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 3 },
                                    { price: 11, quantity: 2 },
                                    { price: 15, quantity: 10 },
                                    { price: 17, quantity: 4 },
                                ],
                                zinc: [{ price: 10, quantity: 1 }],
                            },
                            buyOrders: {
                                aluminium: [
                                    { price: 9, quantity: 3 },
                                    { price: 8, quantity: 4 },
                                ],
                            },
                        },
                        [UUIDV4_2]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 4 },
                                    { price: 13, quantity: 1 },
                                    { price: 20, quantity: 4 },
                                ],
                            },
                            buyOrders: {
                                aluminium: [{ price: 9, quantity: 1 }],
                            },
                        },
                        [UUIDV4_3]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 2 },
                                    { price: 13, quantity: 4 },
                                ],
                            },
                            buyOrders: {
                                aluminium: [{ price: 9, quantity: 1 }],
                            },
                        },
                    },
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {},
                        },
                        [UUIDV4_2]: {
                            inventoryId: UUIDV4_2,
                            content: {},
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .get(
                "/v1/systems/omega/market/resources/aluminium/sell-orders?count=2&pageNext=11",
            )
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
            items: [
                { price: 13, quantity: 5 },
                { price: 15, quantity: 10 },
            ],
            pagination: {
                total: 6,
                pageNext: "15",
                pagePrevious: "13",
            },
        });
    });

    test("GET /v1/systems/{systemId}/market/resources/{resourceId}/sell-orders with a specified pagePrevious", async () => {
        await seedTestData({
            systems: {
                omega: {
                    market: {
                        [UUIDV4_1]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 3 },
                                    { price: 11, quantity: 2 },
                                    { price: 15, quantity: 10 },
                                    { price: 17, quantity: 4 },
                                ],
                                zinc: [{ price: 10, quantity: 1 }],
                            },
                            buyOrders: {
                                aluminium: [
                                    { price: 9, quantity: 3 },
                                    { price: 8, quantity: 4 },
                                ],
                            },
                        },
                        [UUIDV4_2]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 4 },
                                    { price: 13, quantity: 1 },
                                    { price: 20, quantity: 4 },
                                ],
                            },
                            buyOrders: {
                                aluminium: [{ price: 9, quantity: 1 }],
                            },
                        },
                        [UUIDV4_3]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 2 },
                                    { price: 13, quantity: 4 },
                                ],
                            },
                            buyOrders: {
                                aluminium: [{ price: 9, quantity: 1 }],
                            },
                        },
                    },
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {},
                        },
                        [UUIDV4_2]: {
                            inventoryId: UUIDV4_2,
                            content: {},
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .get(
                "/v1/systems/omega/market/resources/aluminium/sell-orders?count=3&pagePrevious=20",
            )
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
            items: [
                { price: 13, quantity: 5 },
                { price: 15, quantity: 10 },
                { price: 17, quantity: 4 },
            ],
            pagination: {
                total: 6,
                pageNext: "17",
                pagePrevious: "13",
            },
        });
    });

    test("GET /v1/systems/{systemId}/market/resources/{resourceId}/sell-orders with a specified pagePrevious and without previous page", async () => {
        await seedTestData({
            systems: {
                omega: {
                    market: {
                        [UUIDV4_1]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 3 },
                                    { price: 11, quantity: 2 },
                                    { price: 15, quantity: 10 },
                                    { price: 17, quantity: 4 },
                                ],
                                zinc: [{ price: 10, quantity: 1 }],
                            },
                            buyOrders: {
                                aluminium: [
                                    { price: 9, quantity: 3 },
                                    { price: 8, quantity: 4 },
                                ],
                            },
                        },
                        [UUIDV4_2]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 4 },
                                    { price: 13, quantity: 1 },
                                    { price: 20, quantity: 4 },
                                ],
                            },
                            buyOrders: {
                                aluminium: [{ price: 9, quantity: 1 }],
                            },
                        },
                        [UUIDV4_3]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 2 },
                                    { price: 13, quantity: 4 },
                                ],
                            },
                            buyOrders: {
                                aluminium: [{ price: 9, quantity: 1 }],
                            },
                        },
                    },
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {},
                        },
                        [UUIDV4_2]: {
                            inventoryId: UUIDV4_2,
                            content: {},
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .get(
                "/v1/systems/omega/market/resources/aluminium/sell-orders?count=3&pagePrevious=13",
            )
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
            items: [
                { price: 10, quantity: 9 },
                { price: 11, quantity: 2 },
            ],
            pagination: {
                total: 6,
                pageNext: "11",
            },
        });
    });

    test("GET /v1/systems/{systemId}/market/resources/{resourceId}/buy-orders/my", async () => {
        await seedTestData({
            systems: {
                omega: {
                    market: {
                        [UUIDV4_1]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 3 },
                                    { price: 11, quantity: 2 },
                                ],
                                zinc: [{ price: 10, quantity: 1 }],
                            },
                            buyOrders: {
                                aluminium: [
                                    { price: 9, quantity: 3 },
                                    { price: 8, quantity: 4 },
                                ],
                            },
                        },
                        [UUIDV4_2]: {
                            sellOrders: {
                                aluminium: [{ price: 10, quantity: 4 }],
                            },
                            buyOrders: {
                                aluminium: [{ price: 9, quantity: 1 }],
                            },
                        },
                    },
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {},
                        },
                        [UUIDV4_2]: {
                            inventoryId: UUIDV4_2,
                            content: {},
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .get("/v1/systems/omega/market/resources/aluminium/buy-orders/my")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body).toEqual([
            { price: 9, quantity: 3 },
            { price: 8, quantity: 4 },
        ]);
    });

    test("GET /v1/systems/{systemId}/market/resources/{resourceId}/instant-sell pass", async () => {
        await seedTestData({
            systems: {
                omega: {
                    market: {
                        [UUIDV4_2]: {
                            buyOrders: {
                                aluminium: [
                                    { price: 10, quantity: 4 },
                                    { price: 9, quantity: 3 },
                                ],
                            },
                        },
                    },
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {
                                aluminium: 100,
                            },
                        },
                        [UUIDV4_2]: {
                            inventoryId: UUIDV4_2,
                            content: {},
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .post("/v1/systems/omega/market/resources/aluminium/instant-sell")
            .set("Authorization", "Bearer longwelwind")
            .send({ quantity: 2 });
        const resMe = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer longwelwind");
        const resSystem = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer longwelwind");
        const resSystemOtherUser = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer user2");

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
            quantitySold: 2,
            creditsGained: 2 * 10,
        });
        expect(resSystem.body.station.cargo).toEqual({ aluminium: 100 - 2 });
        expect(resMe.body.credits).toEqual(2 * 10);
        expect(resSystemOtherUser.body.station.cargo).toEqual({ aluminium: 2 });
    });

    test("GET /v1/systems/{systemId}/market/resources/{resourceId}/instant-sell too much resources than available on the market", async () => {
        await seedTestData({
            systems: {
                omega: {
                    market: {
                        [UUIDV4_2]: {
                            buyOrders: {
                                aluminium: [{ price: 10, quantity: 4 }],
                            },
                        },
                    },
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {
                                aluminium: 100,
                            },
                        },
                        [UUIDV4_2]: {
                            inventoryId: UUIDV4_2,
                            content: {},
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .post("/v1/systems/omega/market/resources/aluminium/instant-sell")
            .set("Authorization", "Bearer longwelwind")
            .send({ quantity: 10 });
        const resMe = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer longwelwind");
        const resSystem = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer longwelwind");
        const resSystemOtherUser = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer user2");

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
            quantitySold: 4,
            creditsGained: 4 * 10,
        });
        expect(resSystem.body.station.cargo).toEqual({ aluminium: 100 - 4 });
        expect(resSystemOtherUser.body.station.cargo).toEqual({
            aluminium: 4,
        });
        expect(resMe.body.credits).toEqual(4 * 10);
    });

    test("GET /v1/systems/{systemId}/market/resources/{resourceId}/instant-buy", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 100,
                },
            },
            systems: {
                omega: {
                    market: {
                        [UUIDV4_2]: {
                            sellOrders: {
                                aluminium: [{ price: 10, quantity: 4 }],
                            },
                        },
                    },
                    stationInventories: {
                        [UUIDV4_2]: {
                            inventoryId: UUIDV4_2,
                            content: {},
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .post("/v1/systems/omega/market/resources/aluminium/instant-buy")
            .set("Authorization", "Bearer longwelwind")
            .send({ quantity: 2 });
        const resMe = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer longwelwind");
        const resMeOtherUser = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer user2");
        const resSystem = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
            quantityBought: 2,
            creditsSpent: 2 * 10,
        });
        expect(resSystem.body.station.cargo).toEqual({ aluminium: 2 });
        expect(resMe.body.credits).toEqual(100 - 2 * 10);
        expect(resMeOtherUser.body.credits).toEqual(2 * 10);
    });

    test("GET /v1/systems/{systemId}/market/resources/{resourceId}/instant-buy too much resources than available on the market", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 100,
                },
            },
            systems: {
                omega: {
                    market: {
                        [UUIDV4_2]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 4 },
                                    { price: 11, quantity: 2 },
                                ],
                            },
                        },
                    },
                    stationInventories: {
                        [UUIDV4_2]: {
                            inventoryId: UUIDV4_2,
                            content: {},
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .post("/v1/systems/omega/market/resources/aluminium/instant-buy")
            .set("Authorization", "Bearer longwelwind")
            .send({ quantity: 10 });
        const resMe = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer longwelwind");
        const resMeOtherUser = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer user2");
        const resSystem = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
            quantityBought: 6,
            creditsSpent: 4 * 10 + 2 * 11,
        });
        expect(resSystem.body.station.cargo).toEqual({ aluminium: 6 });
        expect(resMe.body.credits).toEqual(100 - (4 * 10 + 2 * 11));
        expect(resMeOtherUser.body.credits).toEqual(4 * 10 + 2 * 11);
    });

    test("GET /v1/systems/{systemId}/market/resources/{resourceId}/instant-buy with not enough credits", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 22,
                },
            },
            systems: {
                omega: {
                    market: {
                        [UUIDV4_2]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 4 },
                                    { price: 11, quantity: 2 },
                                ],
                            },
                        },
                    },
                    stationInventories: {
                        [UUIDV4_2]: {
                            inventoryId: UUIDV4_2,
                            content: {},
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .post("/v1/systems/omega/market/resources/aluminium/instant-buy")
            .set("Authorization", "Bearer longwelwind")
            .send({ quantity: 10 });
        const resMe = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer longwelwind");
        const resMeOtherUser = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer user2");
        const resSystem = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
            quantityBought: 2,
            creditsSpent: 2 * 10,
        });
        expect(resSystem.body.station.cargo).toEqual({ aluminium: 2 });
        expect(resMe.body.credits).toEqual(22 - 2 * 10);
        expect(resMeOtherUser.body.credits).toEqual(2 * 10);
    });

    test("POST /v1/systems/{systemId}/market/resources/{resourceId}/sell-orders", async () => {
        await seedTestData({
            systems: {
                omega: {
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {
                                aluminium: 5,
                            },
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .post("/v1/systems/omega/market/resources/aluminium/sell-orders")
            .set("Authorization", "Bearer longwelwind")
            .send({
                resourceId: "aluminium",
                quantity: 3,
                price: 10,
            });
        const resSystem = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer longwelwind");
        const resMarket = await request(app)
            .get("/v1/systems/omega/market/resources/aluminium")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(resSystem.body.station.cargo).toEqual({ aluminium: 2 });
        expect(resMarket.body.sellOrders).toEqual([{ quantity: 3, price: 10 }]);
        expect(resMarket.body.buyOrders).toEqual([]);
    });

    test("POST /v1/systems/{systemId}/market/resources/{resourceId}/sell-orders that can be fully resolved directly", async () => {
        await seedTestData({
            systems: {
                omega: {
                    market: {
                        [UUIDV4_2]: {
                            buyOrders: {
                                aluminium: [{ price: 10, quantity: 4 }],
                            },
                        },
                    },
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {
                                aluminium: 5,
                            },
                        },
                        [UUIDV4_2]: {
                            inventoryId: UUIDV4_2,
                            content: {},
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .post("/v1/systems/omega/market/resources/aluminium/sell-orders")
            .set("Authorization", "Bearer longwelwind")
            .send({
                resourceId: "aluminium",
                quantity: 3,
                price: 10,
            });
        const resSystem = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer longwelwind");
        const resMarket = await request(app)
            .get("/v1/systems/omega/market/resources/aluminium")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(resSystem.body.station.cargo).toEqual({ aluminium: 2 });
        expect(resMarket.body.sellOrders).toEqual([]);
        expect(resMarket.body.buyOrders).toEqual([{ quantity: 1, price: 10 }]);
    });

    test("POST /v1/systems/{systemId}/market/resources/{resourceId}/sell-orders that can be partially resolved directly", async () => {
        await seedTestData({
            systems: {
                omega: {
                    market: {
                        [UUIDV4_2]: {
                            buyOrders: {
                                aluminium: [
                                    { price: 10, quantity: 4 },
                                    { price: 9, quantity: 5 },
                                ],
                            },
                        },
                    },
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {
                                aluminium: 5,
                            },
                        },
                        [UUIDV4_2]: {
                            inventoryId: UUIDV4_2,
                            content: {},
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .post("/v1/systems/omega/market/resources/aluminium/sell-orders")
            .set("Authorization", "Bearer longwelwind")
            .send({
                resourceId: "aluminium",
                quantity: 5,
                price: 10,
            });
        const resSystem = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer longwelwind");
        const resSystemOtherUser = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer user2");
        const resMe = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer longwelwind");
        const resMarket = await request(app)
            .get("/v1/systems/omega/market/resources/aluminium")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(resSystem.body.station.cargo).toEqual({});
        expect(resSystemOtherUser.body.station.cargo).toEqual({ aluminium: 4 });
        expect(resMe.body.credits).toEqual(4 * 10);
        expect(resMarket.body.sellOrders).toEqual([{ quantity: 1, price: 10 }]);
        expect(resMarket.body.buyOrders).toEqual([{ quantity: 5, price: 9 }]);
    });

    test("POST /v1/systems/{systemId}/market/resources/{resourceId}/buy-orders pass", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 100,
                },
            },
        });

        const res = await request(app)
            .post("/v1/systems/omega/market/resources/aluminium/buy-orders")
            .set("Authorization", "Bearer longwelwind")
            .send({
                resourceId: "aluminium",
                quantity: 3,
                price: 10,
            });
        const resMe = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer longwelwind");
        const resMarket = await request(app)
            .get("/v1/systems/omega/market/resources/aluminium")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(resMe.body.credits).toEqual(100 - 3 * 10);
        expect(resMarket.body.sellOrders).toEqual([]);
        expect(resMarket.body.buyOrders).toEqual([{ quantity: 3, price: 10 }]);
    });

    test("POST /v1/systems/{systemId}/market/resources/{resourceId}/buy-orders that can be fully resolved directly", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 100,
                },
            },
            systems: {
                omega: {
                    market: {
                        [UUIDV4_2]: {
                            sellOrders: {
                                aluminium: [{ price: 9, quantity: 4 }],
                            },
                        },
                    },
                    stationInventories: {
                        [UUIDV4_2]: {
                            inventoryId: UUIDV4_2,
                            content: {},
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .post("/v1/systems/omega/market/resources/aluminium/buy-orders")
            .set("Authorization", "Bearer longwelwind")
            .send({
                resourceId: "aluminium",
                quantity: 3,
                price: 10,
            });
        const resSystem = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer longwelwind");
        const resMe = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer longwelwind");
        const resMeOtherUser = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer user2");
        const resMarket = await request(app)
            .get("/v1/systems/omega/market/resources/aluminium")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(resSystem.body.station.cargo).toEqual({ aluminium: 3 });
        expect(resMarket.body.sellOrders).toEqual([{ quantity: 1, price: 9 }]);
        expect(resMarket.body.buyOrders).toEqual([]);
        expect(resMe.body.credits).toEqual(100 - 3 * 9);
        expect(resMeOtherUser.body.credits).toEqual(3 * 9);
    });

    test("POST /v1/systems/{systemId}/market/resources/{resourceId}/buy-orders that can be partially resolved directly", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 100,
                },
            },
            systems: {
                omega: {
                    market: {
                        [UUIDV4_2]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 2 },
                                    { price: 11, quantity: 3 },
                                ],
                            },
                        },
                    },
                    stationInventories: {
                        [UUIDV4_2]: {
                            inventoryId: UUIDV4_2,
                            content: {},
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .post("/v1/systems/omega/market/resources/aluminium/buy-orders")
            .set("Authorization", "Bearer longwelwind")
            .send({
                resourceId: "aluminium",
                quantity: 6,
                price: 12,
            });
        const resSystem = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer longwelwind");
        const resMe = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer longwelwind");
        const resMeOtherUser = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer user2");
        const resMarket = await request(app)
            .get("/v1/systems/omega/market/resources/aluminium")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(resSystem.body.station.cargo).toEqual({ aluminium: 5 });
        expect(resMe.body.credits).toEqual(100 - 2 * 10 - 3 * 11 - 1 * 12);
        expect(resMeOtherUser.body.credits).toEqual(2 * 10 + 3 * 11);
        expect(resMarket.body.sellOrders).toEqual([]);
        expect(resMarket.body.buyOrders).toEqual([{ quantity: 1, price: 12 }]);
    });

    test("POST /v1/systems/{systemId}/market/resources/{resourceId}/buy-orders for a complex case", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 1000,
                },
            },
            systems: {
                omega: {
                    market: {
                        [UUIDV4_1]: {
                            buyOrders: {
                                zinc: [
                                    { price: 10, quantity: 2 },
                                    { price: 11, quantity: 3 },
                                ],
                            },
                            sellOrders: {
                                zinc: [{ price: 20, quantity: 2 }],
                            },
                        },
                        [UUIDV4_2]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 10, quantity: 2 },
                                    { price: 11, quantity: 3 },
                                    { price: 21, quantity: 4 },
                                ],
                            },
                            buyOrders: {
                                aluminium: [{ price: 18, quantity: 15 }],
                                zinc: [{ price: 18, quantity: 15 }],
                            },
                        },
                        [UUIDV4_3]: {
                            sellOrders: {
                                aluminium: [
                                    { price: 9, quantity: 1 },
                                    { price: 11, quantity: 3 },
                                ],
                                zinc: [{ price: 19, quantity: 3 }],
                            },
                        },
                    },
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: { aluminium: 7, zinc: 1 },
                        },
                        [UUIDV4_2]: {
                            inventoryId: UUIDV4_2,
                            content: {},
                        },
                        [UUIDV4_3]: {
                            inventoryId: UUIDV4_3,
                            content: {
                                aluminium: 3,
                            },
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .post("/v1/systems/omega/market/resources/aluminium/buy-orders")
            .set("Authorization", "Bearer longwelwind")
            .send({
                resourceId: "aluminium",
                quantity: 20,
                price: 12,
            });
        const resSystem = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer longwelwind");
        const resMe = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer longwelwind");
        const resMeUser2 = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer user2");
        const resMeUser3 = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer user3");
        const resMarket = await request(app)
            .get("/v1/systems/omega/market/resources/aluminium")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);

        expect(resSystem.body.station.cargo).toEqual({
            aluminium: 7 + 2 + 1 + 6,
            zinc: 1, // It didn't change
        });

        expect(resMe.body.credits).toEqual(
            1000 - 2 * 10 - 1 * 9 - 6 * 11 - 11 * 12,
        );
        expect(resMeUser2.body.credits).toEqual(2 * 10 + 3 * 11);
        expect(resMeUser3.body.credits).toEqual(1 * 9 + 3 * 11);

        expect(resMarket.body.lastTransactions[0]).toMatchObject({
            price: 9,
            quantity: 1,
        });
        expect(resMarket.body.lastTransactions[1]).toMatchObject({
            price: 10,
            quantity: 2,
        });
        expect(resMarket.body.lastTransactions[2]).toMatchObject({
            price: 11,
            quantity: 6,
        });

        //expect(resMarket.body.sellOrders).toEqual([]);
        //expect(resMarket.body.buyOrders).toEqual([{ quantity: 1, price: 12 }]);
    });
});
