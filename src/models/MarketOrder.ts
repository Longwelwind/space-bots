import { BIGINT, UUID } from "sequelize";
import { BelongsTo, ForeignKey, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import User from "./User";
import Resource from "./static-game-data/Resource";
import System from "./static-game-data/System";

@Table({ modelName: "MarketOrders" })
export default class MarketOrder extends Model {
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

    @BelongsTo(() => Resource)
    resource: Resource;

    @ForeignKey(() => Resource)
    @PrimaryKey
    @Column
    declare resourceId: string;

    @Column({ allowNull: false, type: BIGINT })
    quantity: string;

    @PrimaryKey
    @Column({ allowNull: false, type: BIGINT })
    price: string;

    // Can either be "sell" or "buy"
    @PrimaryKey
    @Column({ allowNull: false })
    type: string;
}
