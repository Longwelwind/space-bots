import syncWithGameData from "./syncWithGameData";
import testSetup from "./__tests__/testSetup";

describe("syncWithGameData", () => {
    testSetup();

    test("pass on an empty database without any issues", async () => {
        await syncWithGameData();
    });
});
