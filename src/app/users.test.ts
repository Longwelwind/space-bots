import request from "supertest";
import testSetup from "../__tests__/testSetup";
import seedTestData from "../__tests__/seedTestData";
import app from "../app";

describe("/v1/users", () => {
    testSetup();

    test("POST /v1/users/register", async () => {
        await seedTestData({});

        const res = await request(app)
            .post("/v1/users/register")
            .set("Authorization", "Bearer longwelwind")
            .send({ name: "LongwelwindReborn" });

        expect(res.status).toEqual(200);

        // TODO: Add a check that the username indeed changed
    });
});
