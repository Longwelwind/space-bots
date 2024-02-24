import {
    BelongsTo,
    Column,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
} from "sequelize-typescript";

@Table({ modelName: "PlanetTypes" })
export default class PlanetType extends Model {
    @PrimaryKey
    @Column
    declare id: string;
}
