import { Transaction } from "sequelize";
import hashCode from "./hashCode";
import { sequelize } from "../models/database";

/**
 * For market operations, the lock that is acquired is a more global lock
 * that prevents any operation on the same resource to be done in this system
 * @param systemId
 * @param resourceId
 * @param transaction
 */
export default async function acquireMarketLock(
    systemId: string,
    resourceId: string,
    transaction: Transaction,
) {
    const advisoryLockId = hashCode(systemId + "/" + resourceId);
    await sequelize.query("SELECT pg_advisory_xact_lock(:id)", {
        replacements: { id: advisoryLockId },
        transaction,
    });
}
