import request from "supertest";
import { UUIDV4_1, UUIDV4_2 } from "../__tests__/helpers";
import app from "../app";
import seedTestData from "../__tests__/seedTestData";
import testSetup from "../__tests__/testSetup";

describe("/v1/systems", () => {
    testSetup();

    test("GET /v1/systems/{systemId}", async () => {
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
        expect(res.body.station.cargo).toEqual({});
    });
});
