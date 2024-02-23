import { BIGINT, UUID, UUIDV4 } from "sequelize";
import { HasMany, Model } from "sequelize-typescript";
import { Column, CreatedAt, PrimaryKey, Table } from "sequelize-typescript";
import Fleet from "./Fleet";

@Table({ modelName: "Users" })
export default class User extends Model {
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
