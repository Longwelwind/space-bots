import { stringify } from "csv-stringify";
import { writeFile } from "fs/promises";
import { readFile } from "fs/promises";
import _ from "lodash";
import path from "path";

interface TiledMap {
    layers: TiledLayer[];
}

interface TiledLayer {
    name: string;
    objects: TiledObject[];
}

interface TiledObject {
    name: string;
    x: number;
    y: number;
    properties: { name: string; type: string; value: string | boolean }[];
    polygon: { x: number; y: number }[];
}

async function convertFromTiledToCSV() {
    const galaxyData: TiledMap = JSON.parse(
        (await readFile(path.join(__dirname, "galaxy.tmj"))).toString(),
    );

    const systems = galaxyData.layers
        .find((l) => l.name == "Systems")
        .objects.map((d) => {
            return {
                id: d.name.toLowerCase().replace(" ", "-"),
                x: Math.round(d.x),
                y: Math.round(d.y),
                name: d.name,
                miningResourceId: d.properties?.find(
                    (p) => p.name == "miningResourceId",
                )?.value,
                miningSize: d.properties?.find((p) => p.name == "miningSize")
                    ?.value,
                miningYield: d.properties?.find((p) => p.name == "miningYield")
                    ?.value,
                startingSystem: d.properties?.find(
                    (p) => p.name == "startingSystem",
                )?.value,
                hasStation: d.properties?.find((p) => p.name == "hasStation")
                    ?.value,
            };
        });

    function findClosestSystemId(x: number, y: number) {
        function distSquared(x1: number, y1: number, x2: number, y2: number) {
            return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
        }
        return systems.reduce(
            (p, c) =>
                distSquared(c.x, c.y, x, y) < distSquared(p.x, p.y, x, y)
                    ? c
                    : p,
            systems[0],
        ).id;
    }

    const systemLinks = galaxyData.layers
        .find((l) => l.name == "System Links")
        .objects.map((d) => {
            const systemIds = _.uniq(
                d.polygon.map((p) => findClosestSystemId(d.x + p.x, d.y + p.y)),
            ).sort();

            if (systemIds.length != 2) {
                throw new Error(
                    "More than 2 systems found for link joining " +
                        systemIds.join(","),
                );
            }

            return {
                firstSystemId: systemIds[0],
                secondSystemId: systemIds[1],
            };
        });

    await writeFile(
        path.join(__dirname, "../game-data/systems.csv"),
        stringify(systems, { columns: Object.keys(systems[0]), header: true }),
    );

    await writeFile(
        path.join(__dirname, "../game-data/system-links.csv"),
        stringify(systemLinks, {
            columns: Object.keys(systemLinks[0]),
            header: true,
        }),
    );
}

void convertFromTiledToCSV();
