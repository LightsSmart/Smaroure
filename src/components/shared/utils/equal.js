/**
 * This function supports comparison of all types, including `Function`, `RegExp`, `Date`, `Set`,
 * `Map`, `TypedArrays`, `DataView`, `null`, `undefined`, and `NaN` values.
 *
 * @param {?} a The first value
 * @param {?} b The second value
 * @return {boolean} The compare result
 */
export function deepEqual(a, b) {
    let ctor, i;
    if (a === b) return true;
    if (a && b && (ctor = a.constructor) === b.constructor) {
        if (ctor === Date) return a.getTime() === b.getTime();
        if (ctor === RegExp) return a.toString() === b.toString();
        if (ctor === Array) {
            if (a.length !== b.length) return false;
            for (i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
            return true
        }
        if (ctor === Object) {
            if (Object.keys(a).length !== Object.keys(b).length) return false;
            for (i in a) if (!(i in b) || !deepEqual(a[i], b[i])) return false;
            return true;
        }
    }
    return a !== a && b !== b;
}