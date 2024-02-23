import { Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";

@Table({ modelName: "Resources" })
export default class Resource extends Model {
    @PrimaryKey
    @Column
    declare id: string;

    @Column({ allowNull: false })
    declare name: string;

    @Column
    declare price: number;
}
