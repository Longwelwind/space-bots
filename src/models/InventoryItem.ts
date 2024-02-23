import { BIGINT, STRING, UUID } from "sequelize";
import { BelongsTo, ForeignKey, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import System from "./static-game-data/System";
import Inventory from "./Inventory";
import Resource from "./static-game-data/Resource";

@Table({ modelName: "InventoryItems" })
export default class InventoryItem extends Model {
    @BelongsTo(() => Inventory, "inventoryId")
    inventory: System;

    @PrimaryKey
    @ForeignKey(() => Inventory)
    @Column({ type: UUID, allowNull: false })
    declare inventoryId: string;

    @BelongsTo(() => Resource, "resourceId")
    resource: System;

    @PrimaryKey
    @ForeignKey(() => Resource)
    @Column({ allowNull: false, type: STRING })
    declare resourceId: string;

    @Column({ type: BIGINT })
    declare quantity: string;
}
