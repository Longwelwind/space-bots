// Taken from https://stackoverflow.com/a/7616484/4507028
export default function hashCode(str: string) {
    let hash = 0,
        i: number,
        chr: number;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
