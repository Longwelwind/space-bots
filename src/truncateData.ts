import { checkProductionDatabase, truncate } from "./database";

async function main() {
    checkProductionDatabase();
    await truncate({ cascade: true });
}

main();
