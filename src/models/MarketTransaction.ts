import { BIGINT, UUID } from "sequelize";
import { BelongsTo, ForeignKey, Model } from "sequelize-typescript";
import { Column, Table } from "sequelize-typescript";
import User from "./User";
import Resource from "./static-game-data/Resource";
import System from "./static-game-data/System";

@Table({ modelName: "MarketTransactions" })
export default class MarketTransaction extends Model {
    @BelongsTo(() => System)
    system: System;

    @ForeignKey(() => System)
    @Column
    declare systemId: string;

    @BelongsTo(() => User, "sellerUserId")
    seller: User;

    @ForeignKey(() => User)
    @Column({ type: UUID })
    declare sellerUserId: string;

    @BelongsTo(() => User, "buyerUserId")
    buyer: User;

    @ForeignKey(() => User)
    @Column({ type: UUID })
    declare buyerUserId: string;

    @BelongsTo(() => Resource)
    resource: Resource;

    @ForeignKey(() => Resource)
    @Column
    declare resourceId: string;

    @Column({ allowNull: false, type: BIGINT })
    quantity: string;

    @Column({ allowNull: false, type: BIGINT })
    price: string;

    @Column
    time: Date;
}
