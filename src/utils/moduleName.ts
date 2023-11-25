import path from "path";

export default function moduleName(filename: string) {
    return path.relative(process.cwd(), filename);
}
