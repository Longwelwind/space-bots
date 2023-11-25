export default async function asyncSequentialMap<O, D>(
    list: O[],
    mapFunction: (i: O) => Promise<D>,
): Promise<D[]> {
    const results: D[] = [];
    for (const task of list) {
        results.push(await mapFunction(task));
    }

    return results;
}
