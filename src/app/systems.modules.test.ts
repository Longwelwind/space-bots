import testSetup from "../__tests__/testSetup";
import request from "supertest";
import { UUIDV4_1, UUIDV4_2 } from "../__tests__/helpers";
import app from "../app";
import seedTestData from "../__tests__/seedTestData";

describe("/v1/systems/{systemId}/modules", () => {
    testSetup();

    test("GET /v1/systems/{systemId}/station/modules pass", async () => {
        await seedTestData({
            systems: {
                omega: {
                    modules: {
                        [UUIDV4_1]: [
                            {
                                id: UUIDV4_1,
                                moduleTypeId: "refinery-super-alloy",
                                level: 1,
                            },
                        ],
                    },
                },
                "mega-torox": {
                    modules: {
                        [UUIDV4_1]: [
                            {
                                id: UUIDV4_2,
                                moduleTypeId: "refinery-super-alloy",
                                level: 3,
                            },
                        ],
                    },
                },
            },
        });

        const res = await request(app)
            .get("/v1/systems/mega-torox/station/modules/")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body.items).toEqual([
            {
                moduleTypeId: "refinery-super-alloy",
                kind: "refinery",
                level: 3,
                jobs: [],
            },
        ]);
    });

    test("POST /v1/systems/{systemId}/station/modules/build when building a new module", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 1000,
                },
            },
            systems: {
                omega: {
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {
                                zinc: 10,
                            },
                        },
                    },
                },
                "mega-torox": {
                    modules: {
                        [UUIDV4_1]: [
                            {
                                id: UUIDV4_1,
                                moduleTypeId: "refinery-super-alloy",
                                level: 3,
                            },
                        ],
                    },
                },
            },
        });

        const res = await request(app)
            .post("/v1/systems/omega/station/modules/build")
            .set("Authorization", "Bearer longwelwind")
            .send({ moduleTypeId: "refinery-super-alloy" });

        expect(res.status).toEqual(200);

        const resTwo = await request(app)
            .get("/v1/systems/omega/station/modules/")
            .set("Authorization", "Bearer longwelwind");
        const resMe = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer longwelwind");
        const resStation = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer longwelwind");

        expect(resMe.body.credits).toBe(1000 - 100);
        expect(resStation.body.station.cargo).toEqual({
            zinc: 10 - 3,
        });
        expect(resTwo.body.items).toEqual([
            {
                moduleTypeId: "refinery-super-alloy",
                kind: "refinery",
                level: 1,
                jobs: [],
            },
        ]);
    });

    test("POST /v1/systems/{systemId}/station/modules/build when upgrading a module", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 1000,
                },
            },
            systems: {
                omega: {
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {
                                zinc: 10,
                            },
                        },
                    },
                    modules: {
                        [UUIDV4_1]: [
                            {
                                id: UUIDV4_1,
                                moduleTypeId: "refinery-super-alloy",
                                level: 2,
                            },
                        ],
                    },
                },
            },
        });

        const res = await request(app)
            .post("/v1/systems/omega/station/modules/build")
            .set("Authorization", "Bearer longwelwind")
            .send({ moduleTypeId: "refinery-super-alloy" });

        expect(res.status).toEqual(200);

        const resTwo = await request(app)
            .get("/v1/systems/omega/station/modules/")
            .set("Authorization", "Bearer longwelwind");
        const resMe = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer longwelwind");

        expect(resMe.body.credits).toBe(1000 - 1000);
        expect(resTwo.body.items).toEqual([
            {
                moduleTypeId: "refinery-super-alloy",
                kind: "refinery",
                level: 3,
                jobs: [],
            },
        ]);
    });

    test("POST /v1/systems/{systemId}/station/modules/build try to upgrade a module without enough credits", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 800,
                },
            },
            systems: {
                omega: {
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {
                                zinc: 10,
                            },
                        },
                    },
                    modules: {
                        [UUIDV4_1]: [
                            {
                                id: UUIDV4_1,
                                moduleTypeId: "refinery-super-alloy",
                                level: 2,
                            },
                        ],
                    },
                },
            },
        });

        const res = await request(app)
            .post("/v1/systems/omega/station/modules/build")
            .set("Authorization", "Bearer longwelwind")
            .send({ moduleTypeId: "refinery-super-alloy" });

        expect(res.status).toEqual(400);
        expect(res.body.error).toBe("not_enough_credits");
    });

    test("POST /v1/systems/{systemId}/station/modules/build try to build a module without enough resources", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 800,
                },
            },
            systems: {
                omega: {
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {
                                zinc: 2,
                            },
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .post("/v1/systems/omega/station/modules/build")
            .set("Authorization", "Bearer longwelwind")
            .send({ moduleTypeId: "refinery-super-alloy" });

        expect(res.status).toEqual(400);
        expect(res.body.error).toBe("not_enough_resources");
    });

    test("POST /v1/systems/{systemId}/station/modules/build try to upgrade a module when already at max level", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 800,
                },
            },
            systems: {
                omega: {
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {
                                zinc: 10,
                            },
                        },
                    },
                    modules: {
                        [UUIDV4_1]: [
                            {
                                id: UUIDV4_1,
                                moduleTypeId: "refinery-super-alloy",
                                level: 3,
                            },
                        ],
                    },
                },
            },
        });

        const res = await request(app)
            .post("/v1/systems/omega/station/modules/build")
            .set("Authorization", "Bearer longwelwind")
            .send({ moduleTypeId: "refinery-super-alloy" });

        expect(res.status).toEqual(400);
        expect(res.body.error).toBe("already_at_max_level");
    });

    test("POST /v1/systems/{systemId}/station/modules/{moduleTypeId}/refine to launch a refining job", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 800,
                },
            },
            systems: {
                omega: {
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {
                                aluminium: 100,
                                zinc: 30,
                            },
                        },
                    },
                    modules: {
                        [UUIDV4_1]: [
                            {
                                id: UUIDV4_1,
                                moduleTypeId: "refinery-super-alloy",
                                level: 3,
                            },
                        ],
                    },
                },
            },
        });

        const res = await request(app)
            .post(
                "/v1/systems/omega/station/modules/refinery-super-alloy/refine",
            )
            .set("Authorization", "Bearer longwelwind")
            .send({ blueprintId: "make-mithril", count: 1 });

        expect(res.status).toEqual(200);
        expect(res.body.duration).toEqual(2);

        const resStation = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer longwelwind");

        expect(resStation.body.station.cargo).toEqual({
            zinc: 30 - 25,
            aluminium: 100 - 15,
        });

        const resModules = await request(app)
            .get("/v1/systems/omega/station/modules")
            .set("Authorization", "Bearer longwelwind");

        expect(resModules.body.items[0].jobs).toHaveLength(1);
        expect(resModules.body.items[0].jobs[0]).toMatchObject({
            blueprintId: "make-mithril",
            count: 1,
        });

        await jest.runAllTimersAsync();

        const resStationTwo = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer longwelwind");

        expect(resStationTwo.body.station.cargo).toEqual({
            zinc: 30 - 25,
            aluminium: 100 - 15,
            mithril: 10,
        });
    });

    test("POST /v1/systems/{systemId}/station/modules/{moduleTypeId}/refine to launch a refining job with count > 1", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 800,
                },
            },
            systems: {
                omega: {
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {
                                aluminium: 100,
                                zinc: 80,
                            },
                        },
                    },
                    modules: {
                        [UUIDV4_1]: [
                            {
                                id: UUIDV4_1,
                                moduleTypeId: "refinery-super-alloy",
                                level: 3,
                            },
                        ],
                    },
                },
            },
        });

        const res = await request(app)
            .post(
                "/v1/systems/omega/station/modules/refinery-super-alloy/refine",
            )
            .set("Authorization", "Bearer longwelwind")
            .send({ blueprintId: "make-mithril", count: 3 });

        expect(res.status).toEqual(200);
        expect(res.body.duration).toEqual(2);

        const resStation = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer longwelwind");

        expect(resStation.body.station.cargo).toEqual({
            zinc: 80 - 3 * 25,
            aluminium: 100 - 3 * 15,
        });

        const resModules = await request(app)
            .get("/v1/systems/omega/station/modules")
            .set("Authorization", "Bearer longwelwind");

        expect(resModules.body.items[0].jobs).toHaveLength(1);
        expect(resModules.body.items[0].jobs[0]).toMatchObject({
            blueprintId: "make-mithril",
            count: 3,
        });

        const resMe = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer longwelwind");

        expect(resMe.body.credits).toBe(800 - 3 * 10);

        await jest.runAllTimersAsync();

        const resStationTwo = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer longwelwind");

        expect(resStationTwo.body.station.cargo).toEqual({
            zinc: 80 - 3 * 25,
            aluminium: 100 - 3 * 15,
            mithril: 3 * 10,
        });
    });

    test("POST /v1/systems/{systemId}/station/modules/{moduleTypeId}/refine without enough input resources", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 800,
                },
            },
            systems: {
                omega: {
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {
                                aluminium: 100,
                                zinc: 20,
                            },
                        },
                    },
                    modules: {
                        [UUIDV4_1]: [
                            {
                                id: UUIDV4_1,
                                moduleTypeId: "refinery-super-alloy",
                                level: 3,
                            },
                        ],
                    },
                },
            },
        });

        const res = await request(app)
            .post(
                "/v1/systems/omega/station/modules/refinery-super-alloy/refine",
            )
            .set("Authorization", "Bearer longwelwind")
            .send({ blueprintId: "make-mithril", count: 1 });

        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual("not_enough_resources");
    });

    test("POST /v1/systems/{systemId}/station/modules/{moduleTypeId}/refine without enough credits", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 2,
                },
            },
            systems: {
                omega: {
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {
                                aluminium: 100,
                                zinc: 200,
                            },
                        },
                    },
                    modules: {
                        [UUIDV4_1]: [
                            {
                                id: UUIDV4_1,
                                moduleTypeId: "refinery-super-alloy",
                                level: 3,
                            },
                        ],
                    },
                },
            },
        });

        const res = await request(app)
            .post(
                "/v1/systems/omega/station/modules/refinery-super-alloy/refine",
            )
            .set("Authorization", "Bearer longwelwind")
            .send({ blueprintId: "make-mithril", count: 1 });

        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual("not_enough_credits");
    });

    test("POST /v1/systems/{systemId}/station/modules/{moduleTypeId}/refine without enough jobs to launch it", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 800,
                },
            },
            systems: {
                omega: {
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {
                                aluminium: 1000,
                                zinc: 1000,
                            },
                        },
                    },
                    modules: {
                        [UUIDV4_1]: [
                            {
                                id: UUIDV4_1,
                                moduleTypeId: "refinery-super-alloy",
                                level: 2,
                                jobs: [
                                    { blueprintId: "make-mithril", count: 7 },
                                ],
                            },
                        ],
                    },
                },
            },
        });

        const res = await request(app)
            .post(
                "/v1/systems/omega/station/modules/refinery-super-alloy/refine",
            )
            .set("Authorization", "Bearer longwelwind")
            .send({ blueprintId: "make-mithril", count: 4 });

        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual("too_many_jobs");
    });

    test("POST /v1/systems/{systemId}/station/modules/{moduleTypeId}/refine without module", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 800,
                },
            },
            systems: {
                omega: {
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_1,
                            content: {
                                aluminium: 1000,
                                zinc: 1000,
                            },
                        },
                    },
                },
            },
        });

        const res = await request(app)
            .post(
                "/v1/systems/omega/station/modules/refinery-super-alloy/refine",
            )
            .set("Authorization", "Bearer longwelwind")
            .send({ blueprintId: "make-mithril", count: 4 });

        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual("no_module");
    });

    test("POST /v1/systems/{systemId}/station/modules/{moduleTypeId}/build-ships to build ships", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 800,
                },
            },
            systems: {
                omega: {
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_2,
                            content: {
                                aluminium: 100,
                                zinc: 30,
                            },
                        },
                    },
                    modules: {
                        [UUIDV4_1]: [
                            {
                                id: UUIDV4_1,
                                moduleTypeId: "shipyard",
                                level: 2,
                            },
                        ],
                    },
                },
            },
            fleets: [
                {
                    id: UUIDV4_1,
                    locationSystemId: "omega",
                    ownerUserId: UUIDV4_1,
                    ships: {
                        miner: 1,
                    },
                    inventoryId: UUIDV4_1,
                    cargo: {},
                },
            ],
        });

        const res = await request(app)
            .post("/v1/systems/omega/station/modules/shipyard/build-ships")
            .set("Authorization", "Bearer longwelwind")
            .send({ shipTypeId: "miner", count: 2, fleetId: UUIDV4_1 });

        expect(res.status).toEqual(200);

        const resStation = await request(app)
            .get("/v1/systems/omega")
            .set("Authorization", "Bearer longwelwind");

        expect(resStation.body.station.cargo).toEqual({
            zinc: 30,
            aluminium: 100 - 2 * 10,
        });

        const resFleet = await request(app)
            .get("/v1/fleets/" + UUIDV4_1)
            .set("Authorization", "Bearer longwelwind");

        expect(resFleet.body.ships).toMatchObject({
            miner: 3,
        });
        expect(resFleet.body.capacity).toEqual(3 * 10);
    });

    test("POST /v1/systems/{systemId}/station/modules/{moduleTypeId}/build-ships to build a ship not unlocked yet", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 800,
                },
            },
            systems: {
                omega: {
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_2,
                            content: {
                                aluminium: 100,
                                zinc: 30,
                            },
                        },
                    },
                    modules: {
                        [UUIDV4_1]: [
                            {
                                id: UUIDV4_1,
                                moduleTypeId: "shipyard",
                                level: 2,
                            },
                        ],
                    },
                },
            },
            fleets: [
                {
                    id: UUIDV4_1,
                    locationSystemId: "omega",
                    ownerUserId: UUIDV4_1,
                    ships: {
                        miner: 1,
                    },
                    inventoryId: UUIDV4_1,
                    cargo: {},
                },
            ],
        });

        const res = await request(app)
            .post("/v1/systems/omega/station/modules/shipyard/build-ships")
            .set("Authorization", "Bearer longwelwind")
            .send({ shipTypeId: "fighter", count: 1, fleetId: UUIDV4_1 });

        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual("not_buildable");
    });

    test("POST /v1/systems/{systemId}/station/modules/{moduleTypeId}/build-ships to a fleet in another system", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 800,
                },
            },
            systems: {
                omega: {
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_2,
                            content: {
                                aluminium: 100,
                                zinc: 30,
                            },
                        },
                    },
                    modules: {
                        [UUIDV4_1]: [
                            {
                                id: UUIDV4_1,
                                moduleTypeId: "shipyard",
                                level: 2,
                            },
                        ],
                    },
                },
            },
            fleets: [
                {
                    id: UUIDV4_1,
                    locationSystemId: "mega-torox",
                    ownerUserId: UUIDV4_1,
                    ships: {
                        miner: 1,
                    },
                    inventoryId: UUIDV4_1,
                    cargo: {},
                },
            ],
        });

        const res = await request(app)
            .post("/v1/systems/omega/station/modules/shipyard/build-ships")
            .set("Authorization", "Bearer longwelwind")
            .send({ shipTypeId: "miner", count: 2, fleetId: UUIDV4_1 });

        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual("fleet_not_reachable");
    });

    test("POST /v1/systems/{systemId}/station/modules/{moduleTypeId}/build-ships without a module", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 800,
                },
            },
            systems: {
                omega: {
                    stationInventories: {
                        [UUIDV4_1]: {
                            inventoryId: UUIDV4_2,
                            content: {
                                aluminium: 100,
                                zinc: 30,
                            },
                        },
                    },
                },
            },
            fleets: [
                {
                    id: UUIDV4_1,
                    locationSystemId: "omega",
                    ownerUserId: UUIDV4_1,
                    ships: {
                        miner: 1,
                    },
                    inventoryId: UUIDV4_1,
                    cargo: {},
                },
            ],
        });

        const res = await request(app)
            .post("/v1/systems/omega/station/modules/shipyard/build-ships")
            .set("Authorization", "Bearer longwelwind")
            .send({ shipTypeId: "miner", count: 2, fleetId: UUIDV4_1 });

        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual("no_module");
    });
});
