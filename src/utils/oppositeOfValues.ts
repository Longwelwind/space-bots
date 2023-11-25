export default function oppositeOfValues(object: { [key: string]: number }): {
    [key: string]: number;
} {
    return Object.fromEntries(
        Object.entries(object).map(([key, value]) => [key, -value]),
    );
}
