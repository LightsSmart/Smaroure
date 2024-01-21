import React, { useContext, useEffect, useReducer, useRef } from "react";
import { useEventCallback } from "../hooks/useEventCallback.js";
import { useMergedRefs } from "../hooks/useMergedRefs.js";
import { dataAttr, dataProp, makeEventKey, SelectableContext } from "./index.js";
import { TabContext } from "./Tabs.jsx";
import Button from "./Button.jsx";

/**
 * @typedef {import("./types.js").EventKey} EventKey
 * @typedef {import("./types.js").NavContextType} NavContextType
 */

export const NavContext = /** @type {React.Context<NavContextType | null>} */ (React.createContext(null));

/**
 * Create flexible navigation elements like tabs, navbars, and menus.
 *
 * @param {import("./types.js").NavProps} props - The properties for the Nav component.
 * @param {React.Ref<HTMLElement>} ref - Reference object for DOM node access.
 * @return {React.JSX.Element}
 */
function Nav({ as: Component = "div", onSelect, activeKey, role, onKeyDown, ...props }, ref) {
    const [, forceUpdate] = useReducer(state => !state, false);
    const needsRefocusRef = useRef(false);

    const parentOnSelect = useContext(SelectableContext);
    const tabContext = useContext(TabContext);

    role ??= tabContext ? "tablist" : undefined;
    activeKey = tabContext ? tabContext.activeKey : activeKey;

    const listNode = useRef(/** @type {*} */ (null));

    /**
     * Calculates and returns the next active tab based on the current active
     * tab and the provided offset.
     * @param {number} offset
     * @return {HTMLElement | null}
     */
    function getNextActiveTab(offset) {
        const currentListNode = listNode.current;
        if (!currentListNode) return null;

        const items = Array.from(currentListNode.querySelectorAll(`[${dataAttr("event-key")}]:not([aria-disabled=true])`));

        const activeChild = currentListNode.querySelector("[aria-selected=true]");
        if (!activeChild || activeChild !== document.activeElement) return null;

        const index = items.indexOf(activeChild);
        if (index === -1) return null;

        let nextIndex = index + offset;
        if (nextIndex >= items.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = items.length - 1;
        return items[nextIndex];
    }

    /**
     * Handles the selection of a NavItem.
     * @param {string | null} key
     * @param {React.SyntheticEvent<?>} event
     */
    function handleSelect(key, event) {
        if (key == null) return;
        onSelect?.(key, event);
        parentOnSelect?.(key, event);
    }

    /**
     * Handles keydown events for navigation.
     * @param {React.KeyboardEvent<HTMLElement>} event
     */
    function handleKeyDown(event) {
        onKeyDown?.(event);

        if (!tabContext) return;

        let nextActiveChild;
        switch (event.key) {
            case "ArrowLeft":
            case "ArrowUp":
                nextActiveChild = getNextActiveTab(-1);
                break;
            case "ArrowRight":
            case "ArrowDown":
                nextActiveChild = getNextActiveTab(1);
                break;
            default:
                return;
        }
        if (!nextActiveChild) return;

        event.preventDefault();

        handleSelect(nextActiveChild.dataset[dataProp("EventKey")] || null, event);

        needsRefocusRef.current = true;
        forceUpdate();
    }

    useEffect(() => {
        const currentListNode = listNode.current;

        if (currentListNode && needsRefocusRef.current) {
            const activeChild = currentListNode.querySelector(`[${dataAttr("event-key")}][aria-selected=true]`);
            activeChild?.focus();
        }

        needsRefocusRef.current = false;
    });

    const mergedRef = useMergedRefs(ref, listNode);

    return (
        <SelectableContext.Provider value={handleSelect}>
          <NavContext.Provider value={{
              role,
              activeKey: makeEventKey(activeKey),
              getControlledId: /** @type {function(EventKey?): string} */ (tabContext?.getControlledId) || (() => {}),
              getControllerId: /** @type {function(EventKey?): string} */ (tabContext?.getControllerId) || (() => {})
          }}>
            <Component
                {...props}
                onKeyDown={handleKeyDown}
                ref={mergedRef}
                role={role}
            />
          </NavContext.Provider>
        </SelectableContext.Provider>
    );
}

/**
 * A hook designed to create a navigation item within a Nav system.
 *
 * @param {import("./types.js").UseNavItemOptions} options - The options for the hook.
 * @return {[*, {isActive?: boolean}]}
 */
export function useNavItem({ key, onClick, active, id, role, disabled }) {
    const parentOnSelect = useContext(SelectableContext);
    const navContext = useContext(NavContext);
    const tabContext = useContext(TabContext);

    let isActive = active;
    const props = /** @type {*} */ ({ role });

    if (navContext) {
        if (!role && navContext.role === "tablist") props.role = "tab";

        const contextControllerId = navContext.getControllerId(key ?? null);
        const contextControlledId = navContext.getControlledId(key ?? null);

        props[dataAttr("event-key")] = key;
        props.id = contextControllerId || id;
        isActive = active == null && key != null ? navContext.activeKey === key : active;

        if (isActive || (!tabContext?.unmountOnExit && !tabContext?.mountOnEnter))
            props["aria-controls"] = contextControlledId;
    }

    if (props.role === "tab") {
        props["aria-selected"] = isActive;

        if (!isActive) {
            props.tabIndex = -1;
        }

        if (disabled) {
            props.tabIndex = -1;
            props["aria-disabled"] = true;
        }
    }

    props.onClick = useEventCallback(function (event) {
        if (disabled) return;

        onClick?.(event);

        if (key == null) return;

        if (parentOnSelect && !event?.isPropagationStopped())
            parentOnSelect(key, event);
    });

    return [props, { isActive }];
}

/**
 * NavItem Component representing a navigation item within the {@link Nav}.
 *
 * @param {import("./types.js").NavItemProps} props - The properties for the nav item component.
 * @param {React.Ref<HTMLElement>} ref - Reference object for DOM node access.
 * @return {React.JSX.Element}
 */
function NavItem({ as: Component = Button, active, eventKey, ...props }, ref) {
    const [navItemProps, meta] = useNavItem({
        key: makeEventKey(eventKey, props.href),
        active,
        ...props
    });

    navItemProps[dataAttr("active")] = meta.isActive;

    return <Component {...props} {...navItemProps} ref={ref} />;
}

export default Object.assign(React.forwardRef(Nav), { Item: React.forwardRef(NavItem) });
