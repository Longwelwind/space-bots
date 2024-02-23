import { HasMany, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import ShipTypeBuildResources from "./ShipTypeBuildResources";

@Table({ modelName: "ShipType" })
export default class ShipType extends Model {
    @PrimaryKey
    @Column
    declare id: string;

    @Column({ allowNull: false })
    declare name: string;

    @Column({ allowNull: false, defaultValue: 0 })
    declare miningPower: number;

    @Column({ allowNull: false, defaultValue: 0 })
    declare fightingPower: number;

    @Column({ allowNull: false, defaultValue: 0 })
    declare price: number;

    @HasMany(() => ShipTypeBuildResources)
    costToBuild: ShipTypeBuildResources[];
}
