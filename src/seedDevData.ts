import { sync } from "./models/database";
import Fleet from "./models/Fleet";
import InventoryItem from "./models/InventoryItem";
import Inventory from "./models/Inventory";
import FleetComposition from "./models/FleetComposition";
import User from "./models/User";
import { UUIDV4_1 } from "./__tests__/helpers";

async function seedDevData() {
    await sync();

    const longUser = await User.create({
        id: UUIDV4_1,
        name: "Longwelwind",
        token: "longwelwind",
    });

    await Inventory.bulkCreate([{ id: UUIDV4_1, capacity: 10 }]);

    await InventoryItem.bulkCreate([
        { inventoryId: UUIDV4_1, resourceId: "iron", quantity: 10 },
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
        { fleetId: UUIDV4_1, shipTypeId: "miner_mk_i", quantity: 1 },
    ]);
}

seedDevData();
