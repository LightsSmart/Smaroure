import React, { useCallback, useContext, useEffect, useReducer, useRef } from "react";
import { dataAttr, dataProp, makeEventKey, SelectableContext } from "./index.jsx";
import { TabContext } from "./Tabs.jsx";
import Button from "./Button.jsx";

export const NavContext = React.createContext(null);

const EVENT_KEY_ATTR = dataAttr("event-key");

/**
 * Create flexible navigation elements like tabs, navbars, and menus.
 * @param {object} props
 * @param {React.ElementType} [props.as] Element used to render the component
 * @param {(eventKey: string|null, React.SyntheticEvent<?>) => void} [props.onSelect] A callback fired when a NavItem has been selected
 * @param {string|number} [props.activeKey] Key for the currently active NavItem
 * @param {string} [props.role] Determine the component role
 * @param {(event: React.KeyboardEvent<HTMLElement>) => void} [props.onKeyDown]
 * @param {React.Ref<HTMLElement>} ref The DOM reference
 * @returns {JSX.Element}
 */
function Nav({ as: Component = "div", onSelect, activeKey, role, onKeyDown, ...props }, ref) {
    const [, forceUpdate] = useReducer(state => !state, false);
    const needsRefocusRef = useRef(false);
    const listNode = useRef(null);
    const parentOnSelect = useContext(SelectableContext);
    const tabContext = useContext(TabContext);

    role ??= tabContext ? "tablist" : undefined;
    activeKey = tabContext ? tabContext.activeKey : activeKey;

    function getNextActiveTab(offset) {
        const currentListNode = listNode.current;
        if (!currentListNode) return null;

        const items = Array.from(currentListNode.querySelectorAll(`[${EVENT_KEY_ATTR}]:not([aria-disabled=true])`));

        const activeChild = currentListNode.querySelector("[aria-selected=true]");
        if (!activeChild || activeChild !== document.activeElement) return null;

        const index = items.indexOf(activeChild);
        if (index === -1) return null;

        let nextIndex = index + offset;
        if (nextIndex >= items.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = items.length - 1;
        return items[nextIndex];
    }

    function handleSelect(key, event) {
        if (key == null) return;
        onSelect?.(key, event);
        parentOnSelect?.(key, event);
    }

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
        if (listNode.current && needsRefocusRef.current) {
            const activeChild = listNode.current.querySelector(`[${EVENT_KEY_ATTR}][aria-selected=true]`);
            activeChild?.focus();
        }
        needsRefocusRef.current = false;
    });

    const mergedRef = useCallback(value => {
        [ref, listNode].forEach(ref => ref && (typeof ref === "function" ? ref(value) : ref.current = value));
    }, [ref, listNode]);

    return (
        <SelectableContext.Provider value={handleSelect}>
          <NavContext.Provider value={{
              role,
              activeKey: makeEventKey(activeKey),
              getControlledId: tabContext?.getControlledId || (() => {}),
              getControllerId: tabContext?.getControllerId || (() => {})
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

export function useNavItem({ key, onClick, active, id, role, disabled }) {
    const parentOnSelect = useContext(SelectableContext);
    const navContext = useContext(NavContext);
    const tabContext = useContext(TabContext);

    let isActive = active;
    const props = { role };

    if (navContext) {
        if (!role && navContext.role === "tablist") props.role = "tab";

        const contextControllerId = navContext.getControllerId(key ?? null);
        const contextControlledId = navContext.getControlledId(key ?? null);

        props[EVENT_KEY_ATTR] = key;
        props.id = contextControllerId || id;
        isActive = active == null && key != null ? navContext.activeKey === key : active;

        if (isActive || !(tabContext?.unmountOnExit) && !(tabContext?.mountOnEnter))
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

    const onClickCallbackRef = useRef(onClick);

    useEffect(() => onClickCallbackRef.current = onClick, [onClick]);

    props.onClick = useCallback(event => {
        if (disabled) return;
        onClickCallbackRef.current?.(event);
        if (key && parentOnSelect && !event.isPropagationStopped()) {
            parentOnSelect(key, event);
        }
    }, [onClickCallbackRef]);

    return [props, { isActive }];
}

/**
 * The nav item for {@link Nav}
 * @param {object} props
 * @param {React.ElementType} [props.as] Element used to render the component
 * @param {boolean} [props.active] Highlight the NavItem as active
 * @param {string|number} props.eventKey Value passed to the `onSelect` handler, useful for identifying the selected NavItem
 * @param {string} [props.disabled] Disable the NavItem, making it unselectable
 * @param {string} [props.href] HTML `href` attribute corresponding to `a.href`
 * @param {React.Ref<HTMLElement>} ref The DOM reference
 * @returns {JSX.Element}
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
