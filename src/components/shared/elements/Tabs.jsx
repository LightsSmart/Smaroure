import React, { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { useUncontrolledProp } from "../hooks/useUncontrolledProp.js";
import { useMergedRefs } from "../hooks/useMergedRefs.js";
import { SelectableContext } from "./index.js";

/**
 * @typedef {import("./index.js").EventKey} EventKey
 * @typedef {import("./index.js").SelectCallback} SelectCallback
 * @typedef {import("./index.js").TransitionCallbacks} TransitionCallbacks
 * @typedef {import("./index.js").TransitionOptions} TransitionOptions
 *
 * @typedef TabContextType
 * @property {SelectCallback} onSelect - Callback triggered when a tab is selected.
 * @property {EventKey} [activeKey] - Identifier for the currently active tab.
 * @property {React.ComponentType<TransitionOptions>} [transition] - Component type for implementing transition effects.
 * @property {boolean} mountOnEnter - Flag to mount tab content on enter transition.
 * @property {boolean} unmountOnExit - Flag to unmount tab content on exit transition.
 * @property {function(EventKey): *} getControlledId - Function to generate controlled DOM IDs.
 * @property {function(EventKey): *} getControllerId - Function to generate controller DOM IDs.
 */

export const TabContext = /** @type {React.Context<TabContextType | null>} */ (React.createContext(null));

/**
 * No-operation transition component for static tab behavior.
 *
 * @param {TransitionOptions} config - The options for the transition.
 * @return {React.ReactElement | null}
 */
function NoopTransition({ in: inProp, onExited, mountOnEnter, unmountOnExit, children }) {
    const ref = useRef(null);
    const hasEnteredRef = useRef(inProp);

    useEffect(() => {
        if (!inProp) onExited && onExited(/** @type {*} */ (ref.current)); else hasEnteredRef.current = true;
    }, [inProp, onExited]);

    const combinedRef = useMergedRefs(ref, /** @type {*} */ (children).ref);

    return inProp || (hasEnteredRef.current && !mountOnEnter) || !unmountOnExit
        ? React.cloneElement(children, { ref: combinedRef }) : null;
}

/**
 * Constructs dynamic tab interfaces as described in the WAI-ARIA Authoring Practices. It uses a {@link Nav}
 * component for navigation.
 *
 * @param {object} props - The properties for the tabs component.
 * @param {string} [props.id] - The component's unique identifier.
 * @param {SelectCallback} [props.onSelect] - Callback function invoked when a tab is selected.
 * @param {string|number} [props.activeKey] - The `eventKey` of the currently active tab.
 * @param {string|number} [props.defaultActiveKey] - The default `eventKey` value.
 * @param {React.ComponentType<TransitionOptions>} [props.transition] - Default animation strategy for child {@link TabPanel} components.
 * @param {boolean} [props.mountOnEnter] - Delays mounting of the tab content until the enter transition starts.
 * @param {boolean} [props.unmountOnExit] - Unmounts the tab content after it becomes invisible.
 * @param {React.ReactNode} props.children - The child components of the Tabs.
 * @returns {JSX.Element}
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
 * @param {object} options The options for the hook.
 * @param {boolean} [options.active] - Indicates if the tab panel is active.
 * @param {EventKey} [options.eventKey] - The eventKey associated with the tab panel.
 * @param {React.ComponentType<TransitionOptions>} [options.transition] - Component type for transition effects.
 * @param {boolean} [options.mountOnEnter] - Mounts the tab content on enter transition.
 * @param {boolean} [options.unmountOnExit] - Unmounts the tab content after exit transition.
 * @param {string} [options.role] - ARIA role for the tab panel.
 * @param {TransitionCallbacks & ?} [options.props] - TransitionCallbacks and tabPanelProps.
 * @return [*, *]
 */
export function useTabPanel({ active, eventKey, transition, mountOnEnter, unmountOnExit, role = "tabpanel", ...props }) {
    const { onEnter, onEntering, onEntered, onExit, onExiting, onExited, ...tabPanelProps } = /** @type {TransitionCallbacks & *} */ (props);
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
 * @param {object} props - The properties for the tab panel component.
 * @param {React.ElementType} [props.as] - The underlying element type to render.
 * @param {EventKey} [props.eventKey] - Event key associating the TabPanel with its controlling `NavLink`.
 * @param {boolean} [props.active] - Controls the active state of the TabPanel, usually managed by {@link Tabs}.
 * @param {React.ComponentType<TransitionOptions>} [props.transition] - Enables animations for showing or hiding TabPanels.
 * @param {boolean} [props.mountOnEnter] - Delays mounting of the tab content until the enter transition.
 * @param {boolean} [props.unmountOnExit] - Unmounts the tab content after it becomes invisible.
 * @param {function(HTMLElement, boolean): *} [props.onEnter]
 * @param {function(HTMLElement, boolean): *} [props.onEntering]
 * @param {function(HTMLElement, boolean): *} [props.onEntered]
 * @param {function(HTMLElement): *} [props.onExit]
 * @param {function(HTMLElement): *} [props.onExiting]
 * @param {function(HTMLElement): *} [props.onExited]
 * @param {React.Ref<HTMLElement>} ref The DOM reference
 * @returns {JSX.Element}
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
