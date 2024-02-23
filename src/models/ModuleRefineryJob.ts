import { UUID, UUIDV4 } from "sequelize";
import { BelongsTo, ForeignKey, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import Module from "./Module";
import ModuleTypeRefineryBlueprint from "./static-game-data/ModuleTypeRefineryBlueprint";

@Table({ modelName: "ModuleRefineryJobs" })
export default class ModuleRefineryJob extends Model {
    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    declare id: string;

    @ForeignKey(() => Module)
    @Column({ type: UUID, allowNull: false })
    declare moduleId: string;

    @BelongsTo(() => Module)
    module: Module;

    @ForeignKey(() => ModuleTypeRefineryBlueprint)
    @Column({ allowNull: false })
    declare moduleTypeRefineryBlueprintId: string;

    @BelongsTo(() => ModuleTypeRefineryBlueprint)
    moduleTypeRefineryBlueprint: ModuleTypeRefineryBlueprint;

    @Column({ allowNull: false })
    declare count: number;

    @Column({ allowNull: false })
    declare startTime: Date;

    @Column({ allowNull: false })
    declare finishTime: Date;
}
