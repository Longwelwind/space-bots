/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testRegex: "/.*\\.test\\.(ts|js)$",
    verbose: true,
    testTimeout: 10000,
    detectOpenHandles: true,
};
