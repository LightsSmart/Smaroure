import React, { useCallback, useEffect, useRef, useState } from "react";

export const SelectableContext = React.createContext(null);

export const makeEventKey = (eventKey, href = null) => eventKey != null ? String(eventKey) : href || null;

export const ATTRIBUTE_PREFIX = "data-smaroure-";

export const PROPERTY_PREFIX = "Smaroure";

export const dataAttr = property => `${ATTRIBUTE_PREFIX}${property}`;

export const dataProp = property => `${PROPERTY_PREFIX}${property}`;

const InitialTriggerEvents = {
    click: "mousedown",
    mouseup: "mousedown",
    pointerup: "pointerdown"
};

function contains(context, node) {
    // HTML DOM and SVG DOM may have different support levels,
    // so we need to check on context instead of a document root element.
    if (context.contains) return context.contains(node);
    if (context.compareDocumentPosition) return context === node || !!(context.compareDocumentPosition(node) & 16);
}

function dequal(foo, bar) {
    let ctor, i;
    if (foo === bar) return true;
    if (foo && bar && (ctor = foo.constructor) === bar.constructor) {
        if (ctor === Date) return foo.getTime() === bar.getTime();
        if (ctor === RegExp) return foo.toString() === bar.toString();
        if (ctor === Array) {
            if (foo.length !== bar.length) return false;
            for (i = 0; i < foo.length; i++) if (!dequal(foo[i], bar[i])) return false;
            return true
        }
        if (ctor === Object) {
            if (Object.keys(foo).length !== Object.keys(bar).length) return false;
            for (i in foo) if (!(i in bar) || !dequal(foo[i], bar[i])) return false;
            return true;
        }
    }
    return foo !== foo && bar !== bar;
}

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
        useCallback((...args) => {
            const [value, ...rest] = args;
            let returnValue = handler?.(value, ...rest);
            setState(value);
            return returnValue;
        }, [handler])
    ];
}

/**
 * The `useClickOutside` hook registers your callback on the document that fires
 * when a pointer event is registered outside the provided ref or element.
 *
 * @param {React.Ref<HTMLElement> | HTMLElement} ref The element boundary
 * @param {function} onClickOutside
 * @param {object} options
 * @param {boolean} options.disabled
 * @param {string} options.clickTrigger The DOM event name (click, mousedown, etc) to attach listeners on
 */
export function useClickOutside(ref, onClickOutside = () => {}, { disabled, clickTrigger = "click" } = {}) {
    const preventMouseClickOutsideRef = useRef(false);
    const waitingForTrigger = useRef(false);

    const handleMouseCapture = useCallback(e => {
        const currentTarget = ref && ("current" in ref ? ref.current : ref);
        preventMouseClickOutsideRef.current = !currentTarget
            || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey
            || e.button !== 0
            || !!contains(currentTarget, e.target)
            || waitingForTrigger.current;
        waitingForTrigger.current = false;
    }, [ref]);

    const handleInitialMouse = useCallback(e => {
        const currentTarget = ref && ("current" in ref ? ref.current : ref);
        if (currentTarget && contains(currentTarget, e.target)) {
            waitingForTrigger.current = true;
        }
    }, [ref, waitingForTrigger]);

    const handleMouse = useCallback(e => {
        if (!preventMouseClickOutsideRef.current) {
            onClickOutside(e);
        }
    }, [preventMouseClickOutsideRef, onClickOutside]);

    useEffect(() => {
        if (disabled || ref == null) return undefined;

        const refTarget = ref && ("current" in ref ? ref.current : ref);
        const doc = refTarget && refTarget.ownerDocument || document;

        let removeInitialTriggerListener = null;
        if (InitialTriggerEvents[clickTrigger]) {
            doc.addEventListener(InitialTriggerEvents[clickTrigger], handleInitialMouse, true);
            removeInitialTriggerListener = () => doc.removeEventListener(InitialTriggerEvents[clickTrigger], handleInitialMouse, true);
        }

        doc.addEventListener(clickTrigger, handleMouseCapture, true);
        const removeMouseCaptureListener = () => doc.removeEventListener(clickTrigger, handleMouseCapture, true);

        doc.addEventListener(clickTrigger, handleMouse);
        const removeMouseListener = () => doc.removeEventListener(clickTrigger, handleMouse);

        return () => {
            removeInitialTriggerListener?.();
            removeMouseCaptureListener();
            removeMouseListener();
        };
    }, [
        ref,
        disabled,
        clickTrigger,
        handleMouseCapture,
        handleInitialMouse,
        handleMouse,
    ]);
}