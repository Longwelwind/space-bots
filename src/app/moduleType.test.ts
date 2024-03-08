import request from "supertest";
import app from "../app";
import seedTestData from "../__tests__/seedTestData";
import testSetup from "../__tests__/testSetup";

describe("/v1/modules-types", () => {
    testSetup();

    test("GET /v1/module-types pass", async () => {
        await seedTestData({});

        const res = await request(app)
            .get(`/v1/module-types`)
            .set("Authorization", "Bearer longwelwind");

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
            items: [
                {
                    id: "refinery-super-alloy",
                    name: "Refinery of Super Alloy!!",
                    kind: "refinery",
                    levels: [
                        {
                            maxJobs: 1,
                            cost: {
                                credits: 100,
                            },
                            blueprints: [
                                {
                                    id: "make-mithril",
                                    credits: 10,
                                    inputs: {
                                        aluminium: 15,
                                        zinc: 25,
                                    },
                                    outputs: {
                                        mithril: 10,
                                    },
                                    time: 2,
                                },
                            ],
                        },
                        {
                            maxJobs: 10,
                            cost: {
                                credits: 400,
                            },
                        },
                        {
                            maxJobs: 100,
                            cost: {
                                credits: 1000,
                            },
                            blueprints: [
                                {
                                    id: "make-mithril-improved",
                                    credits: 30,
                                    inputs: {
                                        aluminium: 10,
                                        zinc: 20,
                                    },
                                    outputs: {
                                        mithril: 15,
                                    },
                                    time: 3,
                                },
                            ],
                        },
                    ],
                },
                {
                    id: "shipyard",
                    name: "My Shipyard",
                    kind: "shipyard",
                    levels: [
                        {
                            blueprints: [
                                {
                                    credits: 10,
                                    inputs: { aluminium: 10 },
                                    shipTypeId: "miner",
                                },
                            ],
                            cost: {
                                credits: 100,
                            },
                        },
                        {
                            cost: { credits: 40 },
                        },
                        {
                            blueprints: [
                                {
                                    credits: 10,
                                    inputs: { aluminium: 15 },
                                    shipTypeId: "fighter",
                                },
                            ],
                            cost: {
                                credits: 100,
                            },
                        },
                    ],
                },
            ],
        });
    });
});
