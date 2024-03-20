import { UUID, UUIDV4 } from "sequelize";
import { BelongsTo, ForeignKey, HasMany, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import User from "./User";
import FleetComposition from "./FleetComposition";
import System from "./static-game-data/System";
import Inventory from "./Inventory";
import Resource from "./static-game-data/Resource";

@Table({ modelName: "Fleets" })
export default class Fleet extends Model {
    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    declare id: string;

    @BelongsTo(() => User)
    owner: User;

    @ForeignKey(() => User)
    @Column({ allowNull: false, type: UUID })
    declare ownerUserId: string;

    @BelongsTo(() => System, "locationSystemId")
    location: System;

    @ForeignKey(() => System)
    @Column
    declare locationSystemId: string;

    @Column({ allowNull: false, defaultValue: "idling" })
    declare currentAction: "idling" | "traveling" | "mining";

    @BelongsTo(() => Inventory, "inventoryId")
    inventory: Inventory;

    @ForeignKey(() => Inventory)
    @Column({ allowNull: false, type: UUID })
    declare inventoryId: string;

    @HasMany(() => FleetComposition)
    fleetCompositions: FleetComposition[];

    /*
     * All fields related to "traveling" action
     */
    @BelongsTo(() => System, "travelingFromSystemId")
    travelingFrom: System;

    @ForeignKey(() => System)
    @Column
    declare travelingFromSystemId: string;

    @BelongsTo(() => System, "travelingToSystemId")
    travelingTo: System;

    @ForeignKey(() => System)
    @Column
    declare travelingToSystemId: string;

    @Column
    declare departureTime: Date;

    @Column
    declare arrivalTime: Date;

    /*
     * All fields related to "mining" action
     */
    @Column
    declare miningFinishTime: Date;

    @BelongsTo(() => Resource, "miningResourceId")
    miningResource: Resource;

    @ForeignKey(() => Resource)
    @Column
    declare miningResourceId: string;

    @Column
    declare miningQuantity: number;
}
