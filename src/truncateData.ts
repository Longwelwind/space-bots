import { checkProductionDatabase, truncate } from "./models/database";

async function main() {
    checkProductionDatabase();
    await truncate({ cascade: true });
}

main();
