import request from "supertest";
import {
    UUIDV4_1,
    UUIDV4_2,
    UUIDV4_3,
    UUIDV4_4,
    UUIDV4_5,
} from "../__tests__/helpers";
import app from "../app";
import seedTestData from "../__tests__/seedTestData";
import testSetup from "../__tests__/testSetup";

describe("/v1/systems", () => {
    testSetup();

    test("GET /v1/systems/{systemId} without an asteroid field", async () => {
        await seedTestData({
            fleets: [
                {
                    id: UUIDV4_1,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_1,
                    ships: { miner: 1 },
                },
            ],
        });

        const res = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
            id: "omega",
            name: "Omega",
            x: 0,
            y: 0,
            station: { directSell: true, buyShips: true, cargo: {} },
            neighboringSystems: [
                { systemId: "sigma" },
                { systemId: "tashornia" },
                { systemId: "mega-torox" },
                { systemId: "legaka" },
            ],
        });
    });

    test("GET /v1/systems/{systemId} with an asteroid field", async () => {
        await seedTestData({});

        const res = await request(app)
            .get("/v1/systems/corona")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
            id: "corona",
            name: "Corona",
            x: -2,
            y: 4,
            asteroid: {
                miningResourceId: "zirconium",
                quantityLeft: 1000,
                size: "SMALL",
                yield: "VERY_LOW",
            },
            neighboringSystems: [{ systemId: "plotaria" }],
        });
    });

    test("GET /v1/systems/{systemId} with an asteroid field that is partially exhausted", async () => {
        await seedTestData({
            systems: {
                corona: {
                    quantityMinedForCycle: 400,
                },
            },
        });

        const res = await request(app)
            .get("/v1/systems/corona")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
            id: "corona",
            name: "Corona",
            x: -2,
            y: 4,
            asteroid: {
                miningResourceId: "zirconium",
                quantityLeft: 1000 - 400,
                size: "SMALL",
                yield: "VERY_LOW",
            },
            neighboringSystems: [{ systemId: "plotaria" }],
        });
    });

    test("GET /v1/systems/{systemId} with an asteroid field that is exhausted and that shouldn't be refreshed", async () => {
        await seedTestData({
            systems: {
                corona: {
                    quantityMinedForCycle: 1000,
                    firstMiningTimeForCycle: new Date(jest.now() - 30 * 1000),
                },
            },
        });

        const res = await request(app)
            .get("/v1/systems/corona")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
            id: "corona",
            name: "Corona",
            x: -2,
            y: 4,
            asteroid: {
                miningResourceId: "zirconium",
                quantityLeft: 0,
                size: "SMALL",
                yield: "VERY_LOW",
            },
            neighboringSystems: [{ systemId: "plotaria" }],
        });
    });

    test("GET /v1/systems/{systemId} with an asteroid field that is exhausted but that should be refreshed", async () => {
        await seedTestData({
            systems: {
                corona: {
                    quantityMinedForCycle: 1000,
                    firstMiningTimeForCycle: new Date(jest.now() - 90 * 1000),
                },
            },
        });

        const res = await request(app)
            .get("/v1/systems/corona")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
            id: "corona",
            name: "Corona",
            x: -2,
            y: 4,
            asteroid: {
                miningResourceId: "zirconium",
                quantityLeft: 1000,
                size: "SMALL",
                yield: "VERY_LOW",
            },
            neighboringSystems: [{ systemId: "plotaria" }],
        });
    });

    test("GET /v1/systems/{systemId}/fleets pass", async () => {
        await seedTestData({
            fleets: [
                {
                    id: UUIDV4_1,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_1,
                    ships: { miner: 1 },
                },
                {
                    id: UUIDV4_2,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_2,
                    ships: { miner: 1, fighter: 2 },
                },
                {
                    id: UUIDV4_3,
                    ownerUserId: UUIDV4_2,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_3,
                    ships: { miner: 2, fighter: 3 },
                },
                {
                    id: UUIDV4_4,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "mega-torox",
                    inventoryId: UUIDV4_4,
                    ships: { miner: 1, fighter: 10 },
                },
            ],
        });

        const res = await request(app)
            .get("/v1/systems/omega/fleets")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body.pagination.total).toEqual(3);
        expect(res.body.pagination.pageNext).toBeUndefined();
        expect(res.body.pagination.pagePrevious).toBeUndefined();
        expect(res.body.items).toEqual([
            {
                id: UUIDV4_1,
                owner: { type: "user", userId: UUIDV4_1 },
                currentAction: null,
                locationSystemId: "omega",
                ships: { miner: 1 },
            },
            {
                id: UUIDV4_2,
                owner: { type: "user", userId: UUIDV4_1 },
                currentAction: null,
                locationSystemId: "omega",
                ships: { miner: 1, fighter: 2 },
            },
            {
                id: UUIDV4_3,
                owner: { type: "user", userId: UUIDV4_2 },
                currentAction: null,
                locationSystemId: "omega",
                ships: { miner: 2, fighter: 3 },
            },
        ]);
    });

    test("GET /v1/systems/{systemId}/fleets without a fleet in the system", async () => {
        await seedTestData({
            fleets: [
                {
                    id: UUIDV4_1,
                    ownerUserId: UUIDV4_2,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_1,
                    ships: { miner: 1 },
                },
                {
                    id: UUIDV4_2,
                    ownerUserId: UUIDV4_2,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_2,
                    ships: { miner: 1, fighter: 2 },
                },
            ],
        });

        const res = await request(app)
            .get("/v1/systems/omega/fleets")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual("no_fleet_in_system");
    });

    test("GET /v1/systems/{systemId}/fleets with a specified count", async () => {
        await seedTestData({
            fleets: [
                {
                    id: UUIDV4_1,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_1,
                    ships: { miner: 1 },
                },
                {
                    id: UUIDV4_2,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_2,
                    ships: { miner: 1, fighter: 2 },
                },
                {
                    id: UUIDV4_3,
                    ownerUserId: UUIDV4_2,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_3,
                    ships: { miner: 2, fighter: 3 },
                },
                {
                    id: UUIDV4_4,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "mega-torox",
                    inventoryId: UUIDV4_4,
                    ships: { miner: 1, fighter: 10 },
                },
            ],
        });

        const res = await request(app)
            .get("/v1/systems/omega/fleets?count=2")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body.items.length).toEqual(2);
        expect(res.body.pagination.pageNext).toEqual(UUIDV4_2);
        expect(res.body.pagination.pagePrevious).toBeUndefined();
        expect(res.body.items).toEqual([
            {
                id: UUIDV4_1,
                owner: { type: "user", userId: UUIDV4_1 },
                currentAction: null,
                locationSystemId: "omega",
                ships: { miner: 1 },
            },
            {
                id: UUIDV4_2,
                owner: { type: "user", userId: UUIDV4_1 },
                currentAction: null,
                locationSystemId: "omega",
                ships: { miner: 1, fighter: 2 },
            },
        ]);
    });

    test("GET /v1/systems/{systemId}/fleets with a specified pageNext", async () => {
        await seedTestData({
            fleets: [
                {
                    id: UUIDV4_1,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_1,
                    ships: { miner: 1 },
                },
                {
                    id: UUIDV4_2,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_2,
                    ships: { miner: 1, fighter: 2 },
                },
                {
                    id: UUIDV4_3,
                    ownerUserId: UUIDV4_2,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_3,
                    ships: { miner: 2, fighter: 3 },
                },
                {
                    id: UUIDV4_4,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "mega-torox",
                    inventoryId: UUIDV4_4,
                    ships: { miner: 1, fighter: 10 },
                },
                {
                    id: UUIDV4_5,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_5,
                    ships: { fighter: 3 },
                },
            ],
        });

        const res = await request(app)
            .get(`/v1/systems/omega/fleets?pageNext=${UUIDV4_2}`)
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body.items.length).toEqual(2);
        expect(res.body.pagination.pageNext).toBeUndefined();
        expect(res.body.pagination.pagePrevious).toEqual(UUIDV4_3);
        expect(res.body.items).toEqual([
            {
                id: UUIDV4_3,
                owner: { type: "user", userId: UUIDV4_2 },
                currentAction: null,
                locationSystemId: "omega",
                ships: { miner: 2, fighter: 3 },
            },
            {
                id: UUIDV4_5,
                owner: { type: "user", userId: UUIDV4_1 },
                currentAction: null,
                locationSystemId: "omega",
                ships: { fighter: 3 },
            },
        ]);
    });

    test("GET /v1/systems/{systemId}/fleets with a specified pagePrevious", async () => {
        await seedTestData({
            fleets: [
                {
                    id: UUIDV4_1,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_1,
                    ships: { miner: 1 },
                },
                {
                    id: UUIDV4_2,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_2,
                    ships: { miner: 1, fighter: 2 },
                },
                {
                    id: UUIDV4_3,
                    ownerUserId: UUIDV4_2,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_3,
                    ships: { miner: 2, fighter: 3 },
                },
                {
                    id: UUIDV4_4,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "mega-torox",
                    inventoryId: UUIDV4_4,
                    ships: { miner: 1, fighter: 10 },
                },
                {
                    id: UUIDV4_5,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_5,
                    ships: { fighter: 3 },
                },
            ],
        });

        const res = await request(app)
            .get(`/v1/systems/omega/fleets?pagePrevious=${UUIDV4_3}`)
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body.items.length).toEqual(2);
        expect(res.body.pagination.pageNext).toEqual(UUIDV4_2);
        expect(res.body.pagination.pagePrevious).toBeUndefined();
        expect(res.body.items).toEqual([
            {
                id: UUIDV4_1,
                owner: { type: "user", userId: UUIDV4_1 },
                currentAction: null,
                locationSystemId: "omega",
                ships: { miner: 1 },
            },
            {
                id: UUIDV4_2,
                owner: { type: "user", userId: UUIDV4_1 },
                currentAction: null,
                locationSystemId: "omega",
                ships: { miner: 1, fighter: 2 },
            },
        ]);
    });

    test("GET /v1/systems/{systemId}/fleets with a specified count and pagePrevious", async () => {
        await seedTestData({
            fleets: [
                {
                    id: UUIDV4_1,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_1,
                    ships: { miner: 1 },
                },
                {
                    id: UUIDV4_2,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_2,
                    ships: { miner: 1, fighter: 2 },
                },
                {
                    id: UUIDV4_3,
                    ownerUserId: UUIDV4_2,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_3,
                    ships: { miner: 2, fighter: 3 },
                },
                {
                    id: UUIDV4_4,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "mega-torox",
                    inventoryId: UUIDV4_4,
                    ships: { miner: 1, fighter: 10 },
                },
                {
                    id: UUIDV4_5,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_5,
                    ships: { fighter: 3 },
                },
            ],
        });

        const res = await request(app)
            .get(`/v1/systems/omega/fleets?pagePrevious=${UUIDV4_5}&count=2`)
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body.items.length).toEqual(2);
        expect(res.body.pagination.pageNext).toEqual(UUIDV4_3);
        expect(res.body.pagination.pagePrevious).toEqual(UUIDV4_2);
        expect(res.body.items).toEqual([
            {
                id: UUIDV4_2,
                owner: { type: "user", userId: UUIDV4_1 },
                currentAction: null,
                locationSystemId: "omega",
                ships: { miner: 1, fighter: 2 },
            },
            {
                id: UUIDV4_3,
                owner: { type: "user", userId: UUIDV4_2 },
                currentAction: null,
                locationSystemId: "omega",
                ships: { miner: 2, fighter: 3 },
            },
        ]);
    });
});
