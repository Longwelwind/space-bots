import { UUID } from "sequelize";
import { BelongsTo, ForeignKey, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import User from "./User";
import Inventory from "./Inventory";
import System from "./static-game-data/System";

@Table({ modelName: "StationInventories" })
export default class StationInventory extends Model {
    @BelongsTo(() => System)
    system: System;

    @ForeignKey(() => System)
    @PrimaryKey
    @Column
    declare systemId: string;

    @BelongsTo(() => User)
    user: User;

    @ForeignKey(() => User)
    @PrimaryKey
    @Column({ type: UUID })
    declare userId: string;

    @BelongsTo(() => Inventory)
    inventory: Inventory;

    @ForeignKey(() => Inventory)
    @Column({ type: UUID, allowNull: false })
    declare inventoryId: string;
}
