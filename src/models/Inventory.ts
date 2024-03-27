import { UUID, UUIDV4 } from "sequelize";
import { HasMany, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import InventoryItem from "./InventoryItem";

@Table({ modelName: "Inventories" })
export default class Inventory extends Model {
    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    declare id: string;

    // `-1` means an inventory that can contain an infinite amount
    // of resources
    @Column({ allowNull: false })
    declare capacity: number;

    @HasMany(() => InventoryItem, "inventoryId")
    items: InventoryItem[];
}
