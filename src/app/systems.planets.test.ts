import testSetup from "../__tests__/testSetup";
import request from "supertest";
import { UUIDV4_1, UUIDV4_2 } from "../__tests__/helpers";
import app from "../app";
import seedTestData from "../__tests__/seedTestData";

describe("/v1/systems/{systemId}/planets", () => {
    testSetup();

    test("GET /v1/systems/{systemId}/planets", async () => {
        await seedTestData({});

        const res = await request(app)
            .get("/v1/systems/omega/planets")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body.items).toEqual([
            { id: "sol", name: "Sol", typeId: "continental" },
            { id: "omega-ii", name: "Omega II", typeId: "barren" },
        ]);
    });
});
