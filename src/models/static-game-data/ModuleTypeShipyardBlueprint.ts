import { BelongsTo, ForeignKey, HasMany, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import ModuleType from "./ModuleType";
import ModuleTypeShipyardBlueprintInputResource from "./ModuleTypeShipyardBlueprintInputResource";
import ShipType from "./ShipType";

@Table({ modelName: "ModuleTypeShipyardBlueprints" })
export default class ModuleTypeShipyardBlueprint extends Model {
    @PrimaryKey
    @Column
    declare id: string;

    @ForeignKey(() => ModuleType)
    @Column({ allowNull: false })
    declare moduleTypeId: string;

    @BelongsTo(() => ModuleType)
    moduleType: ModuleType;

    @Column
    declare creditCost: number;

    @Column({ allowNull: false })
    declare unlockLevel: number;

    @HasMany(() => ModuleTypeShipyardBlueprintInputResource)
    inputResources: ModuleTypeShipyardBlueprintInputResource[];

    @ForeignKey(() => ShipType)
    @Column({ allowNull: false })
    declare shipTypeId: string;

    @BelongsTo(() => ShipType)
    shipType: ShipType;
}
