import { BIGINT, UUID } from "sequelize";
import { BelongsTo, ForeignKey, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import Fleet from "./Fleet";
import ShipType from "./static-game-data/ShipType";

@Table({ modelName: "FleetComposition" })
export default class FleetComposition extends Model {
    @PrimaryKey
    @ForeignKey(() => Fleet)
    @Column({ type: UUID })
    declare fleetId: string;

    @BelongsTo(() => Fleet)
    fleet: Fleet;

    @PrimaryKey
    @ForeignKey(() => ShipType)
    @Column
    declare shipTypeId: string;

    @BelongsTo(() => ShipType)
    shipType: ShipType;

    @Column({ type: BIGINT })
    declare quantity: string;
}
