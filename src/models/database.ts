import { DestroyOptions, DropOptions } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import logger from "../utils/logger";
import moduleName from "../utils/moduleName";
import { DATABASE_URL } from "../config";
import User from "./User";
import Module from "./Module";
import ModuleRefineryJob from "./ModuleRefineryJob";
import FleetComposition from "./FleetComposition";
import StationInventory from "./StationInventory";
import MarketOrder from "./MarketOrder";
import MarketTransaction from "./MarketTransaction";
import SystemLink from "./static-game-data/SystemLink";
import ModuleTypeLevel from "./static-game-data/ModuleTypeLevel";
import ModuleTypeRefineryBlueprint from "./static-game-data/ModuleTypeRefineryBlueprint";
import ModuleTypeRefineryBlueprintInputResource from "./static-game-data/ModuleTypeRefineryBlueprintInputResource";
import ModuleTypeRefineryBlueprintOutputResource from "./static-game-data/ModuleTypeRefineryBlueprintOutputResource";
import System from "./static-game-data/System";
import Inventory from "./Inventory";
import InventoryItem from "./InventoryItem";
import ShipType from "./static-game-data/ShipType";
import ShipTypeBuildResources from "./static-game-data/ShipTypeBuildResources";
import Fleet from "./Fleet";
import Resource from "./static-game-data/Resource";
import ModuleType from "./static-game-data/ModuleType";
import Planet from "./static-game-data/Planet";
import PlanetType from "./static-game-data/PlanetType";
import ModuleTypeShipyardBlueprint from "./static-game-data/ModuleTypeShipyardBlueprint";
import ModuleTypeShipyardBlueprintInputResource from "./static-game-data/ModuleTypeShipyardBlueprintInputResource";

const LOGGER = logger(moduleName(__filename));

// @ts-expect-error Sequelize being sequelize
export const sequelize = new Sequelize(DATABASE_URL, {
    define: { noPrimaryKey: true },
    logging: (sql: string, _) => {
        LOGGER.debug("SQL query", { sql });
    },
});

sequelize.addModels([
    Planet,
    PlanetType,
    User,
    System,
    Fleet,
    SystemLink,
    Resource,
    Inventory,
    InventoryItem,
    StationInventory,
    ShipType,
    FleetComposition,
    ShipTypeBuildResources,
    MarketOrder,
    MarketTransaction,
    ModuleType,
    ModuleTypeLevel,
    ModuleTypeRefineryBlueprint,
    ModuleTypeRefineryBlueprintInputResource,
    ModuleTypeRefineryBlueprintOutputResource,
    ModuleTypeShipyardBlueprint,
    ModuleTypeShipyardBlueprintInputResource,
    Module,
    ModuleRefineryJob,
]);

export async function sync(options = {}) {
    await sequelize.sync({ alter: true, ...options });
}

export function checkProductionDatabase() {
    if (process.env.UNSAFE_DATABASE_OPERATIONS == "true") {
        return;
    }

    if (
        process.env.DATABASE_HOSTNAME != null &&
        process.env.DATABASE_HOSTNAME.includes("digitalocean")
    ) {
        console.error(
            'Calling sequelize.drop but DATABASE_HOSTNAME contains "digitalocean". Interrupting...',
        );
        throw new Error("");
    }
}

export async function truncate(options: DestroyOptions = {}, force = false) {
    if (!force) {
        checkProductionDatabase();
    }
    await sequelize.truncate(options);
}

export async function drop(options: DropOptions = {}, force = false) {
    if (!force) {
        checkProductionDatabase();
    }
    await sequelize.drop(options);
}
