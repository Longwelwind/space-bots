import _ from "lodash";
import { setTimeout } from "timers/promises";

const fleetIds = [
    "e25e7125-2e8d-4a44-a36e-38c58ee00837",
    "00000000-0000-0000-0000-000000000001",
    "00000000-0000-0000-0000-000000000001",
];

async function testBattery() {
    const responses = await Promise.all(
        fleetIds.map((fleetId) =>
            fetch("http://localhost:8080/v1/fleets/" + fleetId + "/travel", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer longwelwind",
                },
                body: JSON.stringify({ destinationSystemId: "mega-torox" }),
            }),
        ),
    );
    const fullResponses = await Promise.all(
        responses.map(async (r) => [r.status, await r.json()]),
    );

    fullResponses.forEach(([status, json]) => {
        console.log(status);
        console.log(json);
    });

    await setTimeout(4000);

    await Promise.all(
        fleetIds.map((fleetId) =>
            fetch("http://localhost:8080/v1/fleets/" + fleetId + "/travel", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer longwelwind",
                },
                body: JSON.stringify({ destinationSystemId: "omega" }),
            }),
        ),
    );
}

testBattery();
