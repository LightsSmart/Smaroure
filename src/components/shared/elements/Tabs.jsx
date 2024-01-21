import React, { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { useUncontrolledProp } from "../hooks/useUncontrolledProp.js";
import { useMergedRefs } from "../hooks/useMergedRefs.js";
import { SelectableContext } from "./index.js";

/**
 * @typedef {import("./types.js").EventKey} EventKey
 * @typedef {import("./types.js").TabContextType} TabContextType
 */

export const TabContext = /** @type {React.Context<TabContextType | null>} */ (React.createContext(null));

/**
 * No-operation transition component for static tab behavior.
 *
 * @param {import("./types.js").TransitionOptions} config - The options for the transition.
 * @return {React.ReactElement | null}
 */
function NoopTransition({ in: inProp, onExited, mountOnEnter, unmountOnExit, children }) {
    const ref = useRef(/** @type {*} */ (null));
    const hasEnteredRef = useRef(inProp);

    useEffect(() => {
        if (!inProp)
            onExited && onExited(ref.current);
        else
            hasEnteredRef.current = true;
    }, [inProp, onExited]);

    const combinedRef = useMergedRefs(ref, /** @type {*} */ (children).ref);

    return inProp || (hasEnteredRef.current && !mountOnEnter) || !unmountOnExit
        ? React.cloneElement(children, { ref: combinedRef }) : null;
}

/**
 * Constructs dynamic tab interfaces as described in the WAI-ARIA Authoring
 * Practices. It uses a {@link Nav} component for navigation.
 *
 * @param {import("./types.js").TabsProps} props - The properties for the tabs component.
 * @return {React.JSX.Element}
 */
function Tabs({ id, onSelect, activeKey, defaultActiveKey, transition, mountOnEnter, unmountOnExit, children }) {
    const [activeKeyState, onSelectCallback] = useUncontrolledProp(activeKey, defaultActiveKey, onSelect);

    const generateChildId = useCallback(function (/** @type {EventKey} */ key, /** @type {string} */ type) {
        return id ? `${id}-${type}-${key}` : null;
    }, [id]);

    const tabContext = useMemo(() => ({
        onSelect: onSelectCallback,
        activeKey: activeKeyState,
        transition,
        mountOnEnter: mountOnEnter || false,
        unmountOnExit: unmountOnExit || false,
        getControlledId: (/** @type {EventKey} */ key) => generateChildId(key, "tabpane"),
        getControllerId: (/** @type {EventKey} */ key) => generateChildId(key, "tab")
    }), [onSelectCallback, activeKeyState, transition, mountOnEnter, unmountOnExit, generateChildId]);

    return (
        <TabContext.Provider value={tabContext}>
          <SelectableContext.Provider value={onSelectCallback || null}>
            {children}
          </SelectableContext.Provider>
        </TabContext.Provider>
    );
}

/**
 * A hook for using a tab panel within the {@link Tabs} component.
 *
 * @param {import("./types.js").UseTabPanelOptions} options - The options for the hook.
 * @return {[*, *]}
 */
export function useTabPanel({ active, eventKey, transition, mountOnEnter, unmountOnExit, role = "tabpanel", ...props }) {
    const { onEnter, onEntering, onEntered, onExit, onExiting, onExited, ...tabPanelProps } = props;
    const context = useContext(TabContext);

    return [{
        ...tabPanelProps,
        role,
        ...(!!context && {
            id: context.getControlledId(/** @type {EventKey} */ (eventKey)),
            "aria-labelledby": context.getControllerId(/** @type {EventKey} */ (eventKey))
        })
    }, {
        eventKey,
        isActive: !!context ? active ?? (eventKey && String(eventKey) === String(context.activeKey)) : active,
        transition: transition ?? context?.transition,
        mountOnEnter: mountOnEnter ?? context?.mountOnEnter,
        unmountOnExit: unmountOnExit ?? context?.unmountOnExit,
        onEnter,
        onEntering,
        onEntered,
        onExit,
        onExiting,
        onExited,
    }];
}

/**
 * Component representing a tab panel within the {@link Tabs} interface.
 *
 * @param {import("./types.js").TabPanelProps} props - The properties for the tab panel component.
 * @param {React.Ref<HTMLElement>} ref - Reference object for DOM node access.
 * @return {React.JSX.Element}
 */
function TabPanel({ as: Component = "div", ...props }, ref) {
    const [tabPanelProps, { isActive, transition: Transition = NoopTransition, ...state }] = useTabPanel(props);

    return (
        <TabContext.Provider value={null}>
          <SelectableContext.Provider value={null}>
            <Transition
                in={isActive}
                onEnter={state.onEnter}
                onEntering={state.onEntering}
                onEntered={state.onEntered}
                onExit={state.onExit}
                onExiting={state.onExiting}
                onExited={state.onExited}
                mountOnEnter={state.mountOnEnter}
                unmountOnExit={state.unmountOnExit}
            >
              <Component
                  {...tabPanelProps}
                  ref={ref}
                  hidden={!isActive}
                  aria-hidden={!isActive}
              />
            </Transition>
          </SelectableContext.Provider>
        </TabContext.Provider>
    );
}

export default Object.assign(Tabs, { Panel: React.forwardRef(TabPanel) });
