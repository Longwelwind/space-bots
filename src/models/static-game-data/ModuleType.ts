import { HasMany, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import ModuleTypeLevel from "./ModuleTypeLevel";
import ModuleTypeRefineryBlueprint from "./ModuleTypeRefineryBlueprint";
import ModuleTypeShipyardBlueprint from "./ModuleTypeShipyardBlueprint";

@Table({ modelName: "ModuleTypes" })
export default class ModuleType extends Model {
    @PrimaryKey
    @Column
    declare id: string;

    @Column({ allowNull: false })
    declare name: string;

    @Column({ allowNull: false })
    declare kind: "refinery" | "shipyard";

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

    /**
     * Shipyard type
     */
    @HasMany(() => ModuleTypeShipyardBlueprint)
    shipyardBlueprints: ModuleTypeShipyardBlueprint[];

    getShipyardBlueprintsForLevel(level: number) {
        return this.shipyardBlueprints.filter((b) => b.unlockLevel == level);
    }
}
