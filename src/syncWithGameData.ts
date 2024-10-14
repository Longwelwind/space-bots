import { parse } from "csv-parse/sync";
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
import ModuleTypeShipyardBlueprint from "./models/static-game-data/ModuleTypeShipyardBlueprint";
import ModuleTypeShipyardBlueprintInputResource from "./models/static-game-data/ModuleTypeShipyardBlueprintInputResource";

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
    {
        model: ModuleTypeShipyardBlueprint,
        fileName: "module-type-shipyard-blueprints.csv",
    },
    {
        model: ModuleTypeShipyardBlueprintInputResource,
        fileName: "module-type-shipyard-blueprint-input-resources.csv",
    },
];

export const LOGGER = createLogger(moduleName(__filename));

export default async function syncWithGameData() {
    await sequelize.transaction(async (transaction) => {
        for await (const file of FILES) {
            LOGGER.info("Reading file", { filename: file.fileName });
            const fileData = fs.readFileSync(
                path.join(__dirname, "game-data", file.fileName),
                { encoding: "utf-8" },
            );
            LOGGER.info("Reading file finished");

            const records = parse(fileData, {
                cast: (value, { quoting }) =>
                    value == "" ? (quoting ? "" : null) : value,
                columns: true,
                skip_empty_lines: true,
                comment: "#",
            });
            LOGGER.info("Parsing file finished");

            const filteredRecords = records.map((record) =>
                _.pickBy(record, (value, key) => !key.startsWith("#")),
            );

            const toUpsert = filteredRecords.filter(
                (record) => record.deleted != "true",
            );

            try {
                LOGGER.info("Bulk creating records");
                await file.model.bulkCreate(toUpsert, {
                    updateOnDuplicate: _.keys(toUpsert[0]),
                    transaction,
                    validate: true,
                });
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
