import "dotenv/config";
import {
    Fleet,
    FleetComposition,
    Inventory,
    InventoryItem,
    Resource,
    ShipType,
    System,
    SystemLink,
    User,
    sync,
} from "./database";
import { UUIDV4_1 } from "../tests/helpers";
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
