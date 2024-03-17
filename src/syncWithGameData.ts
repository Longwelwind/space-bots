import { parse } from "csv-parse";
import ModuleType from "./models/static-game-data/ModuleType";
import * as fs from "fs";
import path from "path";
import _ from "lodash";
import "./models/database";
import { sequelize } from "./models/database";
import ShipType from "./models/static-game-data/ShipType";
import { ModelStatic } from "sequelize";
import Resource from "./models/static-game-data/Resource";
import ModuleTypeLevel from "./models/static-game-data/ModuleTypeLevel";
import createLogger from "./utils/createLogger";
import moduleName from "./utils/moduleName";
import ModuleTypeRefineryBlueprint from "./models/static-game-data/ModuleTypeRefineryBlueprint";
import ModuleTypeRefineryBlueprintOutputResource from "./models/static-game-data/ModuleTypeRefineryBlueprintOutputResource";
import ModuleTypeRefineryBlueprintInputResource from "./models/static-game-data/ModuleTypeRefineryBlueprintInputResource";
import System from "./models/static-game-data/System";
import SystemLink from "./models/static-game-data/SystemLink";
import ModuleTypeLevelResource from "./models/static-game-data/ModuleTypeLevelResource";

const FILES: { model: ModelStatic<any>; fileName: string }[] = [
    { model: Resource, fileName: "resources.csv" },
    { model: System, fileName: "systems.csv" },
    { model: SystemLink, fileName: "system-links.csv" },
    { model: ShipType, fileName: "ship-types.csv" },
    { model: ModuleType, fileName: "module-types.csv" },
    { model: ModuleTypeLevel, fileName: "module-type-levels.csv" },
    {
        model: ModuleTypeLevelResource,
        fileName: "module-type-level-resources.csv",
    },
    {
        model: ModuleTypeRefineryBlueprint,
        fileName: "module-type-refinery-blueprints.csv",
    },
    {
        model: ModuleTypeRefineryBlueprintInputResource,
        fileName: "module-type-refinery-blueprint-input-resources.csv",
    },
    {
        model: ModuleTypeRefineryBlueprintOutputResource,
        fileName: "module-type-refinery-blueprint-output-resources.csv",
    },
];

export const LOGGER = createLogger(moduleName(__filename));

export default async function syncWithGameData() {
    await sequelize.transaction(async (transaction) => {
        for await (const file of FILES) {
            LOGGER.info("Reading file", { filename: file.fileName });
            const csvPromise = new Promise<(string | null)[][]>(
                (resolve, reject) => {
                    fs.readFile(
                        path.join(__dirname, "game-data", file.fileName),
                        (err, fileData) => {
                            if (err) {
                                reject(err);
                            }
                            parse(
                                fileData,
                                { cast: true },
                                function (err, rows) {
                                    resolve(rows);
                                },
                            );
                        },
                    );
                },
            );

            const rows = await csvPromise;
            const headerRow = rows[0];

            // Create records from arrays in rows
            const records = _.drop(rows, 1).map((row) => {
                return _.fromPairs(
                    _.zip(headerRow, row).map(([name, value]) => [
                        name,
                        value !== "" ? value : null,
                    ]),
                );
            });

            const dataColumns = headerRow.filter((h) => !h.startsWith("//"));

            const toUpsert = records.filter(
                (record) => record.deleted != "true",
            );

            try {
                await file.model.bulkCreate(
                    toUpsert.map((record) => {
                        // Remove some fileds not necessary
                        return _.pick(record, dataColumns);
                    }),
                    {
                        updateOnDuplicate: dataColumns,
                        transaction,
                        validate: true,
                    },
                );
            } catch (e) {
                LOGGER.error(e);
                throw e;
            }
        }
    });
}

if (require.main === module) {
    void syncWithGameData();
}
