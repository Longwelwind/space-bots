import _ from "lodash";

export default function mergeByAdding(
    firstObject: { [key: string]: number },
    secondObject: { [key: string]: number },
): { [key: string]: number } {
    return _.mergeWith(
        {},
        firstObject,
        secondObject,
        (srcValue, destValue) => (srcValue || 0) + (destValue || 0),
    );
}
