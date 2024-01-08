import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SelectableContext, useUncontrolledProp } from "./index.jsx";

export const TabContext = React.createContext(null);

function NoopTransition({ in: inProp, onExited, mountOnEnter, unmountOnExit, children }) {
    const ref = useRef(null);
    const hasEnteredRef = useRef(inProp);

    useEffect(() => {
        if (!inProp) onExited && onExited(ref.current); else hasEnteredRef.current = true;
    }, [inProp, onExited]);

    const combinedRef = useCallback(value => {
        [ref, children.ref].forEach(ref => ref && (typeof ref === "function" ? ref(value) : ref.current = value));
    }, [ref, children.ref]);

    return inProp || (hasEnteredRef.current && !mountOnEnter) || !unmountOnExit
        ? React.cloneElement(children, { ref: combinedRef }) : null;
}

/**
 * Create dynamic tabbed interfaces from a {@link Nav}, as described in the WAI-ARIA Authoring Practices.
 * @param {object} props
 * @param {string} [props.id] The component id
 * @param {(eventKey: string|null) => void} [props.onSelect] A callback fired when a tab is selected
 * @param {string|number} [props.activeKey] The `eventKey` of the currently active tab
 * @param {string|number} [props.defaultActiveKey] Default value for `eventKey`
 * @param {React.ComponentType} [props.transition] Sets a default animation strategy for all children {@link TabPanel}s
 * @param {boolean} [props.mountOnEnter] Wait until the first "enter" transition to mount tabs (add them to the DOM)
 * @param {boolean} [props.unmountOnExit] Unmount tabs (remove it from the DOM) when they are no longer visible
 * @param {React.ReactNode} props.children The children component
 * @returns {JSX.Element}
 */
function Tabs({ id, onSelect, activeKey, defaultActiveKey, transition, mountOnEnter, unmountOnExit, children }) {
    const [activeKeyState, onSelectCallback] = useUncontrolledProp(activeKey, defaultActiveKey, onSelect);

    const generateChildId = useCallback((key, type) => id ? `${id}-${type}-${key}` : null, [id]);

    const tabContext = useMemo(() => ({
        onSelect: onSelectCallback,
        activeKey: activeKeyState,
        transition,
        mountOnEnter: mountOnEnter || false,
        unmountOnExit: unmountOnExit || false,
        getControlledId: key => generateChildId(key, "tabpane"),
        getControllerId: key => generateChildId(key, "tab")
    }), [onSelectCallback, activeKeyState, transition, mountOnEnter, unmountOnExit, generateChildId]);

    return (
        <TabContext.Provider value={tabContext}>
          <SelectableContext.Provider value={onSelectCallback || null}>
            {children}
          </SelectableContext.Provider>
        </TabContext.Provider>
    );
}

export function useTabPanel({ active, eventKey, transition, mountOnEnter, unmountOnExit, role = "tabpanel", ...props }) {
    const { onEnter, onEntering, onEntered, onExit, onExiting, onExited, ...tabPanelProps } = props;
    const context = useContext(TabContext);

    return [{
        ...tabPanelProps,
        role,
        ...(!!context && {
            id: context.getControlledId(eventKey),
            "aria-labelledby": context.getControllerId(eventKey)
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
 * The panel for {@link Tabs}.
 * @param {object} props
 * @param {React.ElementType} [props.as] Element used to render the component
 * @param {string|number} [props.eventKey] A key that associates the {@link TabPanel} with it's controlling `NavLink`
 * @param {boolean} [props.active] Toggles the active state of the TabPanel, this is generally controlled by {@link Tabs}
 * @param {React.ComponentType} [props.transition] Use animation when showing or hiding {@link TabPanel}s
 * @param {boolean} [props.mountOnEnter] Wait until the first "enter" transition to mount the tab (add it to the DOM)
 * @param {boolean} [props.unmountOnExit] Unmount the tab (remove it from the DOM) when it is no longer visible
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
