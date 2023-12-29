import {
    BIGINT,
    DestroyOptions,
    DropOptions,
    STRING,
    UUID,
    UUIDV4,
} from "sequelize";
import {
    BelongsTo,
    DataType,
    ForeignKey,
    HasMany,
    Model,
    Sequelize,
} from "sequelize-typescript";
import { Column, CreatedAt, PrimaryKey, Table } from "sequelize-typescript";
import logger from "./utils/logger";
import moduleName from "./utils/moduleName";
import {
    DATABASE_HOSTNAME,
    DATABASE_USERNAME,
    DATABASE_PASSWORD,
    DATABASE_DATABASE,
    DATABASE_PORT,
    CACERT,
} from "./config";

const LOGGER = logger(moduleName(__filename));

const commonOptions = {
    define: { noPrimaryKey: true },
    logging: (sql: string, _) => {
        LOGGER.debug("SQL query", { sql });
    },
};

export const sequelize = new Sequelize(
    // @ts-expect-error Sequelize being sequelize
    {
        dialect: "postgres",
        host: DATABASE_HOSTNAME,
        username: DATABASE_USERNAME,
        password: DATABASE_PASSWORD,
        database: DATABASE_DATABASE,
        port: DATABASE_PORT,
        define: { noPrimaryKey: true },
        ...(CACERT
            ? {
                  dialectOptions: {
                      ssl: {
                          require: true,
                          rejectUnauthorized: false,
                          ca: CACERT,
                      },
                  },
                  ssl: true,
              }
            : {}),
        ...commonOptions,
    },
);

@Table({ modelName: "Resources" })
export class Resource extends Model {
    @PrimaryKey
    @Column
    declare id: string;

    @Column({ allowNull: false })
    declare name: string;

    @Column
    declare price: number;
}

@Table({ modelName: "Users" })
export class User extends Model {
    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    declare id: string;

    @Column({ allowNull: false, unique: true })
    declare name: string;

    @Column({ allowNull: false, unique: true })
    declare token: string;

    @CreatedAt
    declare createdAt: Date;

    @Column
    declare firebaseUid: string;

    @Column({ defaultValue: false })
    declare registered: boolean;

    @HasMany(() => Fleet, "ownerUserId")
    fleets: Fleet[];

    @Column({ type: BIGINT, defaultValue: 0 })
    declare credits: string;
}

@Table({ modelName: "Systems" })
export class System extends Model {
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

    get systemLinks(): SystemLink[] {
        return this.firstSystemLinks.concat(this.secondSystemLinks);
    }
}

@Table({ modelName: "Inventories" })
export class Inventory extends Model {
    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    declare id: string;

    @HasMany(() => InventoryItem, "inventoryId")
    items: InventoryItem[];
}

@Table({ modelName: "InventoryItems" })
export class InventoryItem extends Model {
    @BelongsTo(() => Inventory, "inventoryId")
    inventory: System;

    @PrimaryKey
    @ForeignKey(() => Inventory)
    @Column({ type: UUID, allowNull: false })
    declare inventoryId: string;

    @BelongsTo(() => Resource, "resourceId")
    resource: System;

    @PrimaryKey
    @ForeignKey(() => Resource)
    @Column({ allowNull: false, type: STRING })
    declare resourceId: string;

    @Column({ type: BIGINT })
    declare quantity: string;
}

@Table({ modelName: "ShipType" })
export class ShipType extends Model {
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

@Table({ modelName: "ShipTypeBuildResources" })
export class ShipTypeBuildResources extends Model {
    @PrimaryKey
    @ForeignKey(() => ShipType)
    @Column
    declare shipTypeId: string;

    @BelongsTo(() => ShipType)
    shipType: ShipType;

    @PrimaryKey
    @ForeignKey(() => Resource)
    @Column
    declare resourceId: string;

    @BelongsTo(() => Resource)
    resource: Resource;

    @Column
    declare quantity: number;
}

@Table({ modelName: "Fleets" })
export class Fleet extends Model {
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
}

@Table({ modelName: "FleetComposition" })
export class FleetComposition extends Model {
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

@Table({ modelName: "Battles" })
export class Battle extends Model {
    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    declare id: string;

    @BelongsTo(() => System, "locationSystemId")
    location: System;

    @ForeignKey(() => System)
    @Column
    declare locationSystemId: string;

    @Column({ defaultValue: DataType.NOW, allowNull: false })
    declare startedAt: Date;

    @Column
    declare nextTickAt: Date;

    @Column
    declare endedAt: Date;
}

@Table({ modelName: "StationInventories" })
export class StationInventory extends Model {
    @BelongsTo(() => System)
    system: System;

    @ForeignKey(() => System)
    @PrimaryKey
    @Column
    declare systemId: string;

    @BelongsTo(() => User)
    user: User;

    @ForeignKey(() => User)
    @PrimaryKey
    @Column({ type: UUID })
    declare userId: string;

    @BelongsTo(() => Inventory)
    inventory: Inventory;

    @ForeignKey(() => Inventory)
    @Column({ type: UUID, allowNull: false })
    declare inventoryId: string;
}

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
export class SystemLink extends Model {
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

sequelize.addModels([
    User,
    System,
    Fleet,
    SystemLink,
    Resource,
    Inventory,
    InventoryItem,
    StationInventory,
    ShipType,
    FleetComposition,
    ShipTypeBuildResources,
]);

export async function sync(options = {}) {
    await sequelize.sync({ alter: true, ...options });
}

export function checkProductionDatabase() {
    if (process.env.UNSAFE_DATABASE_OPERATIONS == "true") {
        return;
    }

    if (
        process.env.DATABASE_HOSTNAME != null &&
        process.env.DATABASE_HOSTNAME.includes("digitalocean")
    ) {
        console.error(
            'Calling sequelize.drop but DATABASE_HOSTNAME contains "digitalocean". Interrupting...',
        );
        throw new Error("");
    }
}

export async function truncate(options: DestroyOptions = {}, force = false) {
    if (!force) {
        checkProductionDatabase();
    }
    await sequelize.truncate(options);
}

export async function drop(options: DropOptions = {}, force = false) {
    if (!force) {
        checkProductionDatabase();
    }
    await sequelize.drop(options);
}
