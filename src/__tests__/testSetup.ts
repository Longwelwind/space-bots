// This is there so that jest print the full error for Sequelize's error
// Don't ask me why it doesn't do that by default i hate JS.
import util from "util";
import { drop, sequelize, sync, truncate } from "../models/database";

export default function testSetup() {
    util.inspect.defaultOptions.depth = null;

    jest.useFakeTimers();
    jest.spyOn(global, "setTimeout");

    beforeAll(async () => {
        await drop({ logging: false, cascade: true });
        await sync({ logging: false });
    });

    beforeEach(async () => {
        await truncate({
            logging: false,
            restartIdentity: true,
            cascade: true,
        });
    });

    afterAll(async () => {
        await sequelize.close();
    });
}
