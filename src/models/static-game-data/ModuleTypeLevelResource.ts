import { BelongsTo, ForeignKey, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import Resource from "./Resource";

@Table({ modelName: "ModuleTypeLevelResource" })
export default class ModuleTypeLevelResource extends Model {
    @PrimaryKey
    @Column
    declare moduleTypeId: string;

    @PrimaryKey
    @Column
    declare level: number;

    @PrimaryKey
    @ForeignKey(() => Resource)
    @Column
    declare resourceId: string;

    @BelongsTo(() => Resource)
    resource: Resource;

    @Column
    declare quantity: number;
}
