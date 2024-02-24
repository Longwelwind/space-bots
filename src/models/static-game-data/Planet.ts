import {
    BelongsTo,
    Column,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
} from "sequelize-typescript";
import System from "./System";
import PlanetType from "./PlanetType";

@Table({ modelName: "Planets" })
export default class Planet extends Model {
    @BelongsTo(() => System)
    system: System;

    @ForeignKey(() => System)
    @PrimaryKey
    @Column
    declare systemId: string;

    @PrimaryKey
    @Column
    declare id: string;

    @Column
    declare name: string;

    @Column
    declare order: number;

    @BelongsTo(() => PlanetType)
    type: PlanetType;

    @ForeignKey(() => PlanetType)
    @PrimaryKey
    @Column
    declare typeId: string;
}
