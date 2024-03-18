import request from "supertest";
import { UUIDV4_1, UUIDV4_2 } from "../__tests__/helpers";
import app from "../app";
import seedTestData from "../__tests__/seedTestData";
import testSetup from "../__tests__/testSetup";

describe("/v1/fleets", () => {
    testSetup();

    test("GET /v1/fleets/my", async () => {
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
            .get("/v1/fleets/my")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
    });

    test("POST /v1/fleets/{fleetId}/travel", async () => {
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
            .post(`/v1/fleets/${UUIDV4_1}/travel`)
            .set("Authorization", "Bearer longwelwind")
            .send({ destinationSystemId: "mega-torox" });

        expect(res.status).toBe(200);
        expect(res.body.duration).toBeGreaterThan(0);

        expect(setTimeout).toHaveBeenCalled();

        const resTwo = await request(app)
            .get(`/v1/fleets/${UUIDV4_1}`)
            .set("Authorization", "Bearer longwelwind");

        expect(resTwo.status).toEqual(200);
        expect(resTwo.body.locationSystemId).toBeNull();
        expect(resTwo.body.currentAction).toMatchObject({
            type: "traveling",
            travelingFromSystemId: "omega",
            travelingToSystemId: "mega-torox",
        });

        await jest.runAllTimersAsync();

        const resThree = await request(app)
            .get(`/v1/fleets/${UUIDV4_1}`)
            .set("Authorization", "Bearer longwelwind");

        expect(resThree.body.currentAction).toBeNull();
        expect(resThree.status).toEqual(200);
        expect(resThree.body.locationSystemId).toBe("mega-torox");
    });

    test("POST /v1/fleets/{fleetId}/transfer creating a new fleet", async () => {
        await seedTestData({
            fleets: [
                {
                    id: UUIDV4_1,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_1,
                    ships: { miner: 5 },
                },
            ],
        });

        const res = await request(app)
            .post(`/v1/fleets/${UUIDV4_1}/transfer`)
            .set("Authorization", "Bearer longwelwind")
            .send({ shipsFromFleetToTarget: { miner: 2 } });

        expect(res.status).toEqual(200);
        expect(res.body.newFleetId).toBeDefined();

        const newFleetId = res.body.newFleetId;

        const resFirstFleet = await request(app)
            .get(`/v1/fleets/${UUIDV4_1}`)
            .set("Authorization", "Bearer longwelwind");
        const resSecondFleet = await request(app)
            .get(`/v1/fleets/${newFleetId}`)
            .set("Authorization", "Bearer longwelwind");

        expect(resSecondFleet.status).toEqual(200);
        expect(resFirstFleet.body.ships).toEqual({ miner: 5 - 2 });
        expect(resSecondFleet.body.ships).toEqual({ miner: 2 });
    });

    test("POST /v1/fleets/{fleetId}/transfer should destroy empty fleet", async () => {
        await seedTestData({
            fleets: [
                {
                    id: UUIDV4_1,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_1,
                    ships: { miner: 4 },
                },
                {
                    id: UUIDV4_2,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_2,
                    ships: { miner: 1 },
                },
            ],
        });

        const res = await request(app)
            .post(`/v1/fleets/${UUIDV4_1}/transfer`)
            .set("Authorization", "Bearer longwelwind")
            .send({
                targetFleetId: UUIDV4_2,
                shipsFromTargetToFleet: { miner: 1 },
            });

        expect(res.status).toEqual(200);

        const resFirstFleet = await request(app)
            .get(`/v1/fleets/${UUIDV4_1}`)
            .set("Authorization", "Bearer longwelwind");
        const resSecondFleet = await request(app)
            .get(`/v1/fleets/${UUIDV4_2}`)
            .set("Authorization", "Bearer longwelwind");

        expect(resFirstFleet.status).toEqual(200);
        expect(resFirstFleet.body.ships).toMatchObject({ miner: 5 });
        expect(resSecondFleet.status).toEqual(404);
    });

    test("POST /v1/fleets/{fleetId}/transfer should transfer resources and ships to an other fleet", async () => {
        await seedTestData({
            fleets: [
                {
                    id: UUIDV4_1,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_1,
                    ships: { miner: 10 },
                    cargo: { aluminium: 10 },
                },
                {
                    id: UUIDV4_2,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_2,
                    ships: { miner: 5 },
                    cargo: { aluminium: 9 },
                },
            ],
        });

        const res = await request(app)
            .post(`/v1/fleets/${UUIDV4_1}/transfer`)
            .set("Authorization", "Bearer longwelwind")
            .send({
                targetFleetId: UUIDV4_2,
                shipsFromFleetToTarget: { miner: 2 },
                resourcesFromTargetToFleet: { aluminium: 3 },
            });

        expect(res.status).toEqual(200);

        const resFirstFleet = await request(app)
            .get(`/v1/fleets/${UUIDV4_1}`)
            .set("Authorization", "Bearer longwelwind");
        const resSecondFleet = await request(app)
            .get(`/v1/fleets/${UUIDV4_2}`)
            .set("Authorization", "Bearer longwelwind");

        expect(resFirstFleet.body.cargo).toEqual({ aluminium: 10 + 3 });
        expect(resSecondFleet.body.cargo).toEqual({ aluminium: 9 - 3 });
    });

    test("POST /v1/fleets/{fleetId}/transfer-to-station should transfer resources to the station of the system", async () => {
        await seedTestData({
            fleets: [
                {
                    id: UUIDV4_1,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_1,
                    ships: { miner: 10 },
                    cargo: { aluminium: 10 },
                },
            ],
        });

        const res = await request(app)
            .post(`/v1/fleets/${UUIDV4_1}/transfer-to-station`)
            .set("Authorization", "Bearer longwelwind")
            .send({
                resourcesFromFleetToStation: { aluminium: 3 },
            });

        expect(res.status).toEqual(200);

        const resFleet = await request(app)
            .get(`/v1/fleets/${UUIDV4_1}`)
            .set("Authorization", "Bearer longwelwind");
        const resSystem = await request(app)
            .get(`/v1/systems/omega`)
            .set("Authorization", "Bearer longwelwind");

        expect(resFleet.body.cargo).toEqual({ aluminium: 10 - 3 });
        console.log(resSystem.body);
        expect(resSystem.body.station.cargo).toEqual({ aluminium: 3 });
    });

    test("fleet transfer should not authorize new fleet with no ships", async () => {
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
            .post(`/v1/fleets/${UUIDV4_1}/transfer`)
            .set("Authorization", "Bearer longwelwind")
            .send({ resourcesFromTargetToFleet: { aluminium: 3 } });

        expect(res.status).toEqual(400);
    });

    test("fleet transfer to create new fleet without tranferring shtsips", async () => {
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
            .post(`/v1/fleets/${UUIDV4_1}/transfer`)
            .set("Authorization", "Bearer longwelwind")
            .send({ resourcesFromFleetToTarget: { aluminium: 3 } });

        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual("new_fleet_must_have_ships");
    });

    test("fleet transfer to create new fleet while taking resources from non-existing target", async () => {
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
            .post(`/v1/fleets/${UUIDV4_1}/transfer`)
            .set("Authorization", "Bearer longwelwind")
            .send({
                shipsFromFleetToTarget: { miner: 3 },
                resourcesFromTargetToFleet: { aluminium: 2 },
            });

        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual(
            "cant_transfer_from_target_when_creating_fleet",
        );
    });

    test("fleet mine from asteroids", async () => {
        await seedTestData({
            fleets: [
                {
                    id: UUIDV4_1,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "corona",
                    inventoryId: UUIDV4_1,
                    ships: { miner: 10 },
                },
            ],
        });

        const res = await request(app)
            .post(`/v1/fleets/${UUIDV4_1}/mine`)
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toBe(200);
        expect(res.body.duration).toBeGreaterThan(0);

        expect(setTimeout).toHaveBeenCalled();

        const resTwo = await request(app)
            .get(`/v1/fleets/${UUIDV4_1}`)
            .set("Authorization", "Bearer longwelwind");

        expect(resTwo.status).toEqual(200);
        expect(resTwo.body.currentAction).toMatchObject({ type: "mining" });

        await jest.runAllTimersAsync();

        const resThree = await request(app)
            .get(`/v1/fleets/${UUIDV4_1}`)
            .set("Authorization", "Bearer longwelwind");

        expect(resThree.status).toEqual(200);
        expect(resThree.body.currentAction).toBeNull();
        expect(resThree.body.cargo).toMatchObject({ zirconium: 10 });
    });

    test("fleet direct-sell", async () => {
        await seedTestData({
            fleets: [
                {
                    id: UUIDV4_1,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_1,
                    ships: { miner: 1 },
                    cargo: { aluminium: 10 },
                },
            ],
        });

        const res = await request(app)
            .post(`/v1/fleets/${UUIDV4_1}/direct-sell`)
            .set("Authorization", "Bearer longwelwind")
            .send({ resources: { aluminium: 4 } });

        expect(res.status).toEqual(200);
        expect(res.body.creditsGained).toEqual(4 * 10);

        const resMe = await request(app)
            .get(`/v1/users/me`)
            .set("Authorization", "Bearer longwelwind");

        expect(resMe.body).toMatchObject({ credits: 40 });

        const resThree = await request(app)
            .get(`/v1/fleets/${UUIDV4_1}`)
            .set("Authorization", "Bearer longwelwind");

        expect(resThree.body.cargo).toMatchObject({ aluminium: 6 });
    });

    test("fleet direct-sell all ressources", async () => {
        await seedTestData({
            fleets: [
                {
                    id: UUIDV4_1,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_1,
                    ships: { miner: 1 },
                    cargo: { aluminium: 10 },
                },
            ],
        });

        const res = await request(app)
            .post(`/v1/fleets/${UUIDV4_1}/direct-sell`)
            .set("Authorization", "Bearer longwelwind")
            .send({ resources: { aluminium: 10 } });

        expect(res.status).toEqual(200);
        expect(res.body.creditsGained).toEqual(10 * 10);

        const resThree = await request(app)
            .get(`/v1/fleets/${UUIDV4_1}`)
            .set("Authorization", "Bearer longwelwind");

        expect(resThree.body.cargo).toEqual({});
    });

    test("fleet buy-ships", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 1000,
                },
            },
            fleets: [
                {
                    id: UUIDV4_1,
                    ownerUserId: UUIDV4_1,
                    locationSystemId: "omega",
                    inventoryId: UUIDV4_1,
                    ships: { miner: 5 },
                },
            ],
        });

        const res = await request(app)
            .post(`/v1/fleets/${UUIDV4_1}/buy-ships`)
            .set("Authorization", "Bearer longwelwind")
            .send({ shipsToBuy: { miner: 2 } });

        expect(res.status).toEqual(200);

        const resThree = await request(app)
            .get(`/v1/fleets/${UUIDV4_1}`)
            .set("Authorization", "Bearer longwelwind");

        expect(resThree.body.ships).toEqual({ miner: 5 + 2 });

        const resMe = await request(app)
            .get(`/v1/users/me`)
            .set("Authorization", "Bearer longwelwind");

        expect(resMe.body.credits).toEqual(1000 - 2 * 100);
    });

    test("fleet buy-ships over 100 ships", async () => {
        await seedTestData({
            users: {
                [UUIDV4_1]: {
                    credits: 100000,
                },
            },
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
            .post(`/v1/fleets/${UUIDV4_1}/buy-ships`)
            .set("Authorization", "Bearer longwelwind")
            .send({ shipsToBuy: { miner: 101 } });

        expect(res.status).toEqual(400);
        expect(res.body).toMatchObject({ error: "too_much_ships_in_fleet" });
    });
});
