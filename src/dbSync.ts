import { sync } from "./database";

export default async function dbSync() {
    await sync();
}

dbSync();
