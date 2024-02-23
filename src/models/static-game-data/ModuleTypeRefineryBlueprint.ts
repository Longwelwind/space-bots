import { BelongsTo, ForeignKey, HasMany, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import ModuleType from "./ModuleType";
import ModuleTypeRefineryBlueprintOutputResource from "./ModuleTypeRefineryBlueprintOutputResource";
import ModuleTypeRefineryBlueprintInputResource from "./ModuleTypeRefineryBlueprintInputResource";

@Table({ modelName: "ModuleTypeRefineryBlueprints" })
export default class ModuleTypeRefineryBlueprint extends Model {
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

    @Column({ allowNull: false })
    declare time: number;

    @HasMany(() => ModuleTypeRefineryBlueprintInputResource)
    inputResources: ModuleTypeRefineryBlueprintInputResource[];

    @HasMany(() => ModuleTypeRefineryBlueprintOutputResource)
    outputResources: ModuleTypeRefineryBlueprintOutputResource[];
}
