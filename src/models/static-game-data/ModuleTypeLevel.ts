import { BelongsTo, ForeignKey, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import ModuleType from "./ModuleType";

@Table({ modelName: "ModuleTypeLevels" })
export default class ModuleTypeLevel extends Model {
    @PrimaryKey
    @ForeignKey(() => ModuleType)
    @Column
    declare moduleTypeId: string;

    @BelongsTo(() => ModuleType)
    moduleType: ModuleType;

    @PrimaryKey
    @Column
    declare level: number;

    @Column
    declare creditCost: number;

    /**
     * Refinery type
     */
    @Column
    declare maxJobs: number;
}
