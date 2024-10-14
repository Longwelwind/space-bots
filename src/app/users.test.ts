import request from "supertest";
import testSetup from "../__tests__/testSetup";
import seedTestData from "../__tests__/seedTestData";
import app from "../app";
import { UUIDV4_1, UUIDV4_2 } from "../__tests__/helpers";

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

    test("GET /v1/users/{userId} pass", async () => {
        await seedTestData({});

        const res = await request(app)
            .get("/v1/users/" + UUIDV4_2)
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({ id: UUIDV4_2, name: "User2" });
    });

    test("GET /v1/users/me pass", async () => {
        await seedTestData({});

        const res = await request(app)
            .get("/v1/users/me")
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body).toMatchObject({
            id: UUIDV4_1,
            name: "Longwelwind",
            credits: 0,
            registered: false,
        });
    });
});
