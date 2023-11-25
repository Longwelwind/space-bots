import { Sequelize, Transaction } from "sequelize";

export default async function transaction(
    sequelize: Sequelize,
    callback: (
        transaction: Transaction,
        interrupt: () => Promise<void>,
    ) => Promise<void>,
): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
        let interruptCalled = false;

        await callback(transaction, async () => {
            await transaction.rollback();
            interruptCalled = true;
        });

        if (!interruptCalled) {
            await transaction.commit();
        }
    } catch (e) {
        await transaction.rollback();

        throw e;
    }
}
