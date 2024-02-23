import { HasMany, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import ModuleTypeLevel from "./ModuleTypeLevel";
import ModuleTypeRefineryBlueprint from "./ModuleTypeRefineryBlueprint";

@Table({ modelName: "ModuleTypes" })
export default class ModuleType extends Model {
    @PrimaryKey
    @Column
    declare id: string;

    @Column({ allowNull: false })
    declare name: string;

    @Column({ allowNull: false })
    declare kind: "refinery";

    @HasMany(() => ModuleTypeLevel)
    levels: ModuleTypeLevel[];

    /**
     * Refinery type
     */
    @HasMany(() => ModuleTypeRefineryBlueprint)
    blueprints: ModuleTypeRefineryBlueprint[];

    getBlueprintsForLevel(level: number) {
        return this.blueprints.filter((b) => b.unlockLevel == level);
    }
}
