import { useCallback, useEffect, useRef } from "react";

/**
 * A hook that ensures a stable reference to a function.
 *
 * @param {function(...*): *} fn
 * @return {function(...*): *}
 */
export function useEventCallback(fn) {
    const ref = useRef(fn);

    useEffect(() => { ref.current = fn }, [fn]);

    return useCallback(function (/** @type {*} */ ...args) {
        return ref.current && ref.current(...args);
    }, [ref]);
}