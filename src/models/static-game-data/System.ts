import { BelongsTo, ForeignKey, HasMany, Model } from "sequelize-typescript";
import { Column, PrimaryKey, Table } from "sequelize-typescript";
import StationInventory from "../StationInventory";
import SystemLink from "./SystemLink";
import Resource from "./Resource";
import Fleet from "../Fleet";

@Table({ modelName: "Systems" })
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

    @HasMany(() => Fleet, "locationSystemId")
    fleets: Fleet[];

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
