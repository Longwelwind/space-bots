import { BelongsTo, ForeignKey, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import System from "./System";

@Table({
    modelName: "SystemLinks",
    validate: {
        validateOrderSystems() {
            if (this.firstSystemId >= this.secondSystemId) {
                throw new Error(
                    `firstSystemId (${this.firstSystemId}) must be before secondSystemId (${this.secondSystemId}) in alphabetical order`,
                );
            }
        },
    },
})
export default class SystemLink extends Model {
    @BelongsTo(() => System, "firstSystemId")
    first: System;

    @ForeignKey(() => System)
    @PrimaryKey
    @Column({ allowNull: false })
    declare firstSystemId: string;

    @BelongsTo(() => System, "secondSystemId")
    second: System;

    @PrimaryKey
    @ForeignKey(() => System)
    @Column({ allowNull: false })
    declare secondSystemId: string;

    other(system: System) {
        return this.firstSystemId == system.id
            ? this.secondSystemId
            : this.firstSystemId;
    }
}
