import { BelongsTo, ForeignKey, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import ShipType from "./ShipType";
import Resource from "./Resource";

@Table({ modelName: "ShipTypeBuildResources" })
export default class ShipTypeBuildResources extends Model {
    @PrimaryKey
    @ForeignKey(() => ShipType)
    @Column
    declare shipTypeId: string;

    @BelongsTo(() => ShipType)
    shipType: ShipType;

    @PrimaryKey
    @ForeignKey(() => Resource)
    @Column
    declare resourceId: string;

    @BelongsTo(() => Resource)
    resource: Resource;

    @Column
    declare quantity: number;
}
