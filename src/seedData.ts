import { sync } from "./models/database";
import ModuleType from "./models/static-game-data/ModuleType";
import Resource from "./models/static-game-data/Resource";
import Fleet from "./models/Fleet";
import ShipType from "./models/static-game-data/ShipType";
import InventoryItem from "./models/InventoryItem";
import Inventory from "./models/Inventory";
import System from "./models/static-game-data/System";
import ModuleTypeRefineryBlueprintOutputResource from "./models/static-game-data/ModuleTypeRefineryBlueprintOutputResource";
import ModuleTypeRefineryBlueprintInputResource from "./models/static-game-data/ModuleTypeRefineryBlueprintInputResource";
import ModuleTypeRefineryBlueprint from "./models/static-game-data/ModuleTypeRefineryBlueprint";
import ModuleTypeLevel from "./models/static-game-data/ModuleTypeLevel";
import SystemLink from "./models/static-game-data/SystemLink";
import FleetComposition from "./models/FleetComposition";
import User from "./models/User";
import { UUIDV4_1 } from "./__tests__/helpers";
import logger from "./utils/logger";
import moduleName from "./utils/moduleName";

const LOGGER = logger(moduleName(__filename));

const NODE_ENV = process.env.NODE_ENV;

async function seed() {
    await sync();

    const countRessource = await Resource.count();
    if (countRessource > 0) {
        LOGGER.info("seed data already existing in database, skipping");
        return;
    }

    await Resource.bulkCreate([
        { id: "aluminium", name: "Aluminium", price: 10 },
        { id: "zinc", name: "Zinc", price: 20 },
        { id: "titanium", name: "Titanium", price: 20 },
        { id: "zirconium", name: "Zirconium", price: 30 },
        { id: "mithril", name: "Mithril", price: 50 },
    ]);

    await ModuleType.bulkCreate([
        { id: "refinery", name: "Refinery", kind: "refinery" },
    ]);

    await ModuleTypeLevel.bulkCreate([
        { moduleTypeId: "refinery", level: 1, creditCost: 100, maxJobs: 1 },
    ]);

    await ModuleTypeLevel.bulkCreate([
        { moduleTypeId: "refinery", level: 2, creditCost: 1000, maxJobs: 10 },
    ]);

    await ModuleTypeLevel.bulkCreate([
        { moduleTypeId: "refinery", level: 3, creditCost: 10000, maxJobs: 100 },
    ]);

    await ModuleTypeRefineryBlueprint.bulkCreate([
        {
            id: "refine-mithril",
            creditCost: 10,
            unlockLevel: 1,
            moduleTypeId: "refinery",
            time: 10,
        },
        {
            id: "refine-mithril-improved",
            creditCost: 30,
            unlockLevel: 3,
            moduleTypeId: "refinery",
            time: 10,
        },
    ]);

    await ModuleTypeRefineryBlueprintInputResource.bulkCreate([
        {
            moduleTypeRefineryBlueprintId: "refine-mithril",
            resourceId: "aluminium",
            quantity: 15,
        },
        {
            moduleTypeRefineryBlueprintId: "refine-mithril",
            resourceId: "zinc",
            quantity: 25,
        },
        {
            moduleTypeRefineryBlueprintId: "refine-mithril-improved",
            resourceId: "aluminium",
            quantity: 10,
        },
        {
            moduleTypeRefineryBlueprintId: "refine-mithril-improved",
            resourceId: "zinc",
            quantity: 20,
        },
    ]);

    await ModuleTypeRefineryBlueprintOutputResource.bulkCreate([
        {
            moduleTypeRefineryBlueprintId: "refine-mithril",
            resourceId: "mithril",
            quantity: 10,
        },
        {
            moduleTypeRefineryBlueprintId: "refine-mithril-improved",
            resourceId: "mithril",
            quantity: 15,
        },
    ]);

    await System.bulkCreate([
        {
            id: "omega",
            name: "Omega",
            x: 0,
            y: 0,
            startingSystem: true,
            hasStation: true,
        },
        {
            id: "mega-torox",
            name: "Mega Torox",
            x: 2,
            y: 2,
            miningResourceId: "aluminium",
        },
        { id: "tashornia", name: "Tashornia", x: 3, y: 1 },
        {
            id: "duovin-anaon",
            name: "Duovin Anaon",
            x: 4,
            y: 4,
            miningResourceId: "mithril",
        },
        {
            id: "bitara",
            name: "Bitara",
            x: 6,
            y: 2,
            miningResourceId: "mithril",
        },
        {
            id: "reticulum",
            name: "Reticulum",
            x: 4,
            y: 0,
            miningResourceId: "zinc",
        },
        {
            id: "toloros",
            name: "Toloros",
            x: 5,
            y: -3,
            miningResourceId: "titanium",
        },
        {
            id: "legaka",
            name: "Legaka",
            x: 1,
            y: -2,
            miningResourceId: "aluminium",
        },
        {
            id: "conaleko",
            name: "Conaleko",
            x: -1,
            y: -2,
            miningResourceId: "zinc",
        },
        { id: "fogelius", name: "Fogelius", x: -1, y: -3 },
        {
            id: "sumlas",
            name: "Sumlas",
            x: -3,
            y: -1,
            miningResourceId: "zinc",
        },
        { id: "sigma", name: "Sigma", x: -1, y: 1 },
        {
            id: "plotaria",
            name: "Plotaria",
            x: -2,
            y: 2,
            miningResourceId: "zirconium",
        },
        {
            id: "corona",
            name: "Corona",
            x: -2,
            y: 4,
            miningResourceId: "zirconium",
        },
    ]);

    await SystemLink.bulkCreate([
        { firstSystemId: "mega-torox", secondSystemId: "omega" },
        { firstSystemId: "omega", secondSystemId: "sigma" },
        { firstSystemId: "legaka", secondSystemId: "omega" },
        { firstSystemId: "omega", secondSystemId: "tashornia" },
        { firstSystemId: "duovin-anaon", secondSystemId: "mega-torox" },
        { firstSystemId: "bitara", secondSystemId: "duovin-anaon" },
        { firstSystemId: "bitara", secondSystemId: "tashornia" },
        { firstSystemId: "bitara", secondSystemId: "reticulum" },
        { firstSystemId: "reticulum", secondSystemId: "tashornia" },
        { firstSystemId: "reticulum", secondSystemId: "toloros" },
        { firstSystemId: "legaka", secondSystemId: "toloros" },
        { firstSystemId: "conaleko", secondSystemId: "legaka" },
        { firstSystemId: "conaleko", secondSystemId: "sumlas" },
        { firstSystemId: "conaleko", secondSystemId: "fogelius" },
        { firstSystemId: "fogelius", secondSystemId: "sumlas" },
        { firstSystemId: "plotaria", secondSystemId: "sumlas" },
        { firstSystemId: "corona", secondSystemId: "plotaria" },
        { firstSystemId: "plotaria", secondSystemId: "sigma" },
    ]);

    await ShipType.bulkCreate([
        { id: "miner", name: "Miner", miningPower: 1, price: 100 },
        { id: "fighter", name: "Fighter", price: 1000 },
    ]);

    if (NODE_ENV == "development") {
        const longUser = await User.create({
            id: UUIDV4_1,
            name: "Longwelwind",
            token: "longwelwind",
        });

        await Inventory.bulkCreate([{ id: UUIDV4_1 }]);

        await InventoryItem.bulkCreate([
            { inventoryId: UUIDV4_1, resourceId: "aluminium", quantity: 10 },
        ]);

        await Fleet.bulkCreate([
            {
                id: UUIDV4_1,
                ownerUserId: UUIDV4_1,
                locationSystemId: "omega",
                inventoryId: UUIDV4_1,
            },
        ]);

        await FleetComposition.bulkCreate([
            { fleetId: UUIDV4_1, shipTypeId: "miner", quantity: 1 },
        ]);
    }
}

seed();
