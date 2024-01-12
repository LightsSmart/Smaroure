import { useCallback } from "react";

/**
 * Create and returns a single callback ref composed from other Refs.
 *
 * @example
 * const Button = React.forwardRef((props, ref) => {
 *   const [element, attachRef] = useState(null);
 *   const mergedRef = useMergedRefs(ref, attachRef);
 *
 *   return <button ref={mergedRef} {...props}/>
 * });
 *
 * @param {Parameters<*>} refs A group of Callback or mutable Refs
 */
export function useMergedRefs(...refs) {
    return useCallback(function (/** @type {*} */ value) {
        refs.forEach((/** @type {*} */ ref) => {
            const funRef = !!ref && typeof ref !== "function"
                ? (/** @type {*} */ param) => ref.current = param
                : ref;

            if (funRef) funRef(value)
        });
    }, refs);
}