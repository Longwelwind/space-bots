import { BelongsTo, ForeignKey, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import ModuleTypeShipyardBlueprint from "./ModuleTypeShipyardBlueprint";
import Resource from "./Resource";

@Table({ modelName: "ModuleTypeShipyardBlueprintInputResources" })
export default class ModuleTypeShipyardBlueprintInputResource extends Model {
    @PrimaryKey
    @ForeignKey(() => ModuleTypeShipyardBlueprint)
    @Column
    declare moduleTypeShipyardBlueprintId: string;

    @BelongsTo(() => ModuleTypeShipyardBlueprint)
    moduleTypeShipyardBlueprint: ModuleTypeShipyardBlueprint;

    @PrimaryKey
    @ForeignKey(() => Resource)
    @Column
    declare resourceId: string;

    @Column
    declare quantity: number;
}
