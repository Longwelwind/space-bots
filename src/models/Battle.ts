import { UUID, UUIDV4 } from "sequelize";
import { BelongsTo, DataType, ForeignKey, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import System from "./static-game-data/System";

@Table({ modelName: "Battles" })
export default class Battle extends Model {
    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    declare id: string;

    @BelongsTo(() => System, "locationSystemId")
    location: System;

    @ForeignKey(() => System)
    @Column
    declare locationSystemId: string;

    @Column({ defaultValue: DataType.NOW, allowNull: false })
    declare startedAt: Date;

    @Column
    declare nextTickAt: Date;

    @Column
    declare endedAt: Date;
}
