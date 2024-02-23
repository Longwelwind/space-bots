import { sync } from "./models/database";

export default async function dbSync() {
    await sync();
}

dbSync();
