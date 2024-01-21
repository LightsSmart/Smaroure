/**
 * This function supports comparison of all types, including `Function`, `RegExp`, `Date`, `Set`,
 * `Map`, `TypedArrays`, `DataView`, `null`, `undefined`, and `NaN` values.
 *
 * @param {?} a - The first value
 * @param {?} b - The second value
 * @return {boolean} - The compare result
 */
export function deepEqual(a, b) {
    let ctor, len;
    if (a === b) return true;

    if (a && b && (ctor = a.constructor) === b.constructor) {
        if (ctor === Date) return a.getTime() === b.getTime();
        if (ctor === RegExp) return a.toString() === b.toString();

        if (ctor === Array) {
            if ((len = a.length) === b.length) {
                while (len-- && deepEqual(a[len], b[len])) ;
            }
            return len === -1;
        }

        if (!ctor || typeof a === "object") {
            len = 0;
            for (ctor in a) {
                if (Object.hasOwn(a, ctor) && ++len && !Object.hasOwn(b, ctor)) return false;
                if (!(ctor in b) || !deepEqual(a[ctor], b[ctor])) return false;
            }
            return Object.keys(b).length === len;
        }
    }

    return a !== a && b !== b;
}
