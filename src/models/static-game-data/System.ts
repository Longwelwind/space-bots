import { BelongsTo, ForeignKey, HasMany, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import StationInventory from "../StationInventory";
import SystemLink from "./SystemLink";
import Resource from "./Resource";
import Fleet from "../Fleet";
import Planet from "./Planet";
import { ENUM, fn } from "sequelize";
import miningYields from "./miningYields";
import miningSizes from "./miningSizes";

export const ASTEROID_REFRESH_INTERVAL_SECONDS = 60;

@Table({
    modelName: "Systems",
    validate: {
        miningColumnsAllNullOrNotNull() {
            if (
                !(
                    (this.miningResourceId != null &&
                        this.miningYield != null &&
                        this.miningSize != null) ||
                    (this.miningResourceId == null &&
                        this.miningYield == null &&
                        this.miningSize == null)
                )
            ) {
                throw new Error(
                    "miningResourceId, miningSize and miningYield must all simultaneously be null or non-null ",
                );
            }
        },
    },
})
export default class System extends Model {
    @PrimaryKey
    @Column
    declare id: string;

    @Column({ allowNull: false })
    declare name: string;

    @Column({ allowNull: false })
    declare x: number;

    @Column({ allowNull: false })
    declare y: number;

    @Column({ defaultValue: false })
    declare startingSystem: boolean;

    @Column({ defaultValue: false })
    declare hasStation: boolean;

    @BelongsTo(() => Resource, "miningResourceId")
    miningResource: Resource;

    @ForeignKey(() => Resource)
    @Column
    declare miningResourceId: string;

    @Column({
        type: ENUM,
        values: Object.keys(miningYields),
    })
    declare miningYield: keyof typeof miningYields;

    @Column({
        type: ENUM,
        values: Object.keys(miningSizes),
    })
    declare miningSize: keyof typeof miningSizes;

    @Column({ defaultValue: 0 })
    declare quantityMinedForCycle: number;

    @Column({ defaultValue: fn("now") })
    declare firstMiningTimeForCycle: Date;

    @HasMany(() => Fleet, "locationSystemId")
    fleets: Fleet[];

    @HasMany(() => Planet)
    planets: Planet[];

    @HasMany(() => SystemLink, "firstSystemId")
    firstSystemLinks: SystemLink[];

    @HasMany(() => SystemLink, "secondSystemId")
    secondSystemLinks: SystemLink[];

    @HasMany(() => StationInventory)
    stationInventories: StationInventory[];

    get systemLinks(): SystemLink[] {
        return this.firstSystemLinks.concat(this.secondSystemLinks);
    }
}
