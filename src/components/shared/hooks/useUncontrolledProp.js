import { useCallback, useRef, useState } from "react";

/**
 * A React hook that can be used in place of the above Higher order Component. It returns a complete set
 * of props which are safe to spread through to a child element.
 *
 * @template T
 * @param {T | undefined} prop
 * @param {T} defaultValue
 * @param {*} [handler]
 * @return {[T, *]}
 */
export function useUncontrolledProp(prop, defaultValue, handler) {
    const [state, setState] = useState(defaultValue);
    const wasPropRef = useRef(!!prop);

    const isProp = prop !== undefined;
    const wasProp = wasPropRef.current;

    wasPropRef.current = isProp;

    if (!isProp && wasProp && state !== defaultValue)
        setState(defaultValue);

    return [
        isProp ? prop : state,
        useCallback(function (/** @type {[*]} */ ...args) {
            const [value, ...rest] = args;

            let returnValue = handler?.(value, ...rest);

            setState(value);

            return returnValue;
        }, [handler])
    ];
}