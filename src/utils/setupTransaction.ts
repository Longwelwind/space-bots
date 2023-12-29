import { Sequelize, Transaction } from "sequelize";

export default async function setupTransaction(
    sequelize: Sequelize,
    func: (transaction: Transaction) => Promise<void>,
) {
    return await sequelize.transaction(async (transaction) => {
        await sequelize.query("SET LOCAL lock_timeout = '1s';", {
            transaction,
        });

        await func(transaction);
    });
}
