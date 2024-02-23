import { UUID, UUIDV4 } from "sequelize";
import { BelongsTo, ForeignKey, HasMany, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import User from "./User";
import ModuleType from "./static-game-data/ModuleType";
import System from "./static-game-data/System";
import ModuleRefineryJob from "./ModuleRefineryJob";

@Table({ modelName: "Module" })
export default class Module extends Model {
    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    declare id: string;

    @ForeignKey(() => User)
    @Column({ type: UUID })
    declare userId: string;

    @BelongsTo(() => User)
    user: User;

    @ForeignKey(() => System)
    @Column
    declare systemId: string;

    @BelongsTo(() => System)
    system: System;

    @ForeignKey(() => ModuleType)
    @Column
    declare moduleTypeId: string;

    @BelongsTo(() => ModuleType)
    moduleType: ModuleType;

    @Column
    declare level: number;

    /**
     * Refineries
     */
    @HasMany(() => ModuleRefineryJob)
    jobs: ModuleRefineryJob[];
}
