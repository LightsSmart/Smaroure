import * as React from "react";

/**
 * Represents a unique identifier for events, typically a string or a number.
 */
export type EventKey = string | number;

/**
 * Defines the permissible button types.
 */
export type ButtonType = "button" | "reset" | "submit"

/**
 * Function type for callback during select events.
 */
export type SelectCallback = (eventKey: string | null, e: React.SyntheticEvent<unknown>) => void;

export interface TransitionCallbacks {
    /**
     * Invoked `before` the component begins its `entrance` transition.
     */
    onEnter?(node: HTMLElement, isAppearing: boolean): any;

    /**
     * Invoked as the component `starts` its `entrance` transition.
     */
    onEntering?(node: HTMLElement, isAppearing: boolean): any;

    /**
     * Invoked `after` the component completes its `entrance` transition.
     */
    onEntered?(node: HTMLElement, isAppearing: boolean): any;

    /**
     * Invoked right `before` the component starts its `exit` transition.
     */
    onExit?(node: HTMLElement): any;

    /**
     * Invoked as the component `begins` its `exit` transition.
     */
    onExiting?(node: HTMLElement): any;

    /**
     * Invoked `after` the component completes its `exit` transition.
     */
    onExited?(node: HTMLElement): any;
}

export interface TransitionOptions extends TransitionCallbacks {
    /**
     * Boolean to trigger the enter or exit states of the transition.
     */
    in?: boolean;

    /**
     * If true, the component will transition on initial mount.
     */
    appear?: boolean;

    /**
     * The children elements of the transition component.
     */
    children: React.ReactElement;

    /**
     * Mount the component when the transition enters.
     */
    mountOnEnter?: boolean;

    /**
     * Unmount the component after it exits.
     */
    unmountOnExit?: boolean;
}


export interface NavContextType {
    /**
     * The ARIA role for the Nav context.
     */
    role?: string;

    /**
     * The active key within the Nav context.
     */
    activeKey: EventKey | null;

    /**
     * Function to generate controlled ID.
     */
    getControlledId: (key: EventKey | null) => string;

    /**
     * Function to generate controller ID.
     */
    getControllerId: (key: EventKey | null) => string;
}

export interface TabContextType {
    /**
     * Callback triggered when a tab is selected.
     */
    onSelect: SelectCallback;

    /**
     * Identifier for the currently active tab.
     */
    activeKey?: EventKey;

    /**
     * Component type for implementing transition effects.
     */
    transition?: React.ComponentType<TransitionOptions>;

    /**
     * Flag to mount tab content on enter transition.
     */
    mountOnEnter: boolean;

    /**
     * Flag to unmount tab content on exit transition.
     */
    unmountOnExit: boolean;

    /**
     * Function to generate controlled ID.
     */
    getControlledId: (key: EventKey) => any;

    /**
     * Function to generate controller IDs.
     */
    getControllerId: (key: EventKey) => any;
}


export interface useButtonOptions {
    /**
     * Specifies the button type.
     */
    type?: ButtonType;

    /**
     * Determines whether the button is disabled.
     */
    disabled?: boolean;

    /**
     * Designates the URL for anchor-type buttons.
     */
    href?: string;

    /**
     * Defines the relationship between the current document and the linked URL for anchor-type buttons.
     */
    rel?: string;

    /**
     * Specifies the target frame for the linked URL in anchor-type buttons.
     */
    target?: string;

    /**
     * Handler for click and keyboard events.
     */
    onClick?: React.EventHandler<React.MouseEvent | React.KeyboardEvent>;

    /**
     * Sets the tabIndex attribute for the button.
     */
    tabIndex?: number;

    /**
     * Determines the HTML tag to be used for the button.
     */
    tagName?: keyof React.JSX.IntrinsicElements;

    /**
     * Assigns an ARIA role to the button.
     */
    role?: React.AriaRole | undefined;
}

export interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
    /**
     * The underlying element to be rendered, e.g., `button`, `a`, etc.
     */
    as?: keyof React.JSX.IntrinsicElements | undefined;

    /**
     * Indicates whether the button is disabled.
     */
    disabled?: boolean | undefined;

    /**
     * URL for rendering an anchor element styled as a button.
     */
    href?: string | undefined;

    /**
     * Target frame for anchor elements rendered as buttons.
     */
    target?: string | undefined;

    /**
     * Relationship between the current document and the linked URL in anchor elements.
     */
    rel?: string | undefined;
}

export interface NavProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'> {
    /**
     * The key of the currently active NavItem.
     */
    activeKey?: EventKey;

    /**
     * The element type used for rendering the component.
     */
    as?: React.ElementType;

    /**
     * A callback function invoked when a NavItem is selected.
     */
    onSelect?: SelectCallback;
}

export interface UseNavItemOptions {
    /**
     * The unique key for the navigation item.
     */
    key?: string | null;

    /**
     * Handler for click events.
     */
    onClick?: React.MouseEventHandler;

    /**
     * Specifies whether the item is active.
     */
    active?: boolean;

    /**
     * Indicates whether the item is disabled.
     */
    disabled?: boolean;

    /**
     * The ID for the item.
     */
    id?: string;

    /**
     * ARIA role for the item.
     */
    role?: string;
}

export interface NavItemProps extends React.HTMLAttributes<HTMLElement> {
    /**
     * Indicates whether the NavItem should be highlighted as active.
     */
    active?: boolean;

    /**
     * The element type used for rendering the component.
     */
    as?: React.ElementType;

    /**
     * Disable the NavItem, making it unselectable.
     */
    disabled?: boolean;

    /**
     * The key passed to the onSelect handler, useful for identifying the selected NavItem.
     */
    eventKey?: EventKey;

    /**
     * The HTML href attribute corresponding to a.href.
     */
    href?: string;
}

export interface TabsProps extends React.PropsWithChildren {
    id?: string;

    /**
     * Default animation strategy for child TabPanel components.
     */
    transition?: React.ComponentType<TransitionOptions>;

    /**
     * Delays mounting of the tab content until the enter transition starts.
     */
    mountOnEnter?: boolean;

    /**
     * Unmounts the tab content after it becomes invisible.
     */
    unmountOnExit?: boolean;

    /**
     * A callback function invoked when a tab is selected.
     */
    onSelect?: SelectCallback;

    /**
     * The `eventKey` of the currently active tab.
     */
    activeKey?: EventKey;

    /**
     * The default value for `eventKey`.
     */
    defaultActiveKey?: EventKey;
}

export interface UseTabPanelOptions extends TransitionCallbacks {
    /**
     * The underlying element type to render.
     */
    as?: React.ElementType;

    /**
     * Event key associating the TabPanel with its controlling `NavLink`.
     */
    eventKey?: EventKey;

    /**
     * Controls the active state of the TabPanel, usually managed by `<Tabs>`.
     */
    active?: boolean;

    /**
     * Use animation when showing or hiding `<TabPanel>`s.
     */
    transition?: React.ComponentType<TransitionOptions>;

    /**
     * Delays mounting of the tab content until the enter transition.
     */
    mountOnEnter?: boolean;

    /**
     * Unmounts the tab content after it becomes invisible.
     */
    unmountOnExit?: boolean;

    /**
     * ARIA role for the tab panel.
     */
    role?: string;
}

export interface TabPanelProps extends TransitionCallbacks, React.HTMLAttributes<HTMLElement> {

    /**
     * The underlying element type to render.
     */
    as?: React.ElementType;

    /**
     * Event key associating the TabPanel with its controlling `NavLink`.
     */
    eventKey?: EventKey;

    /**
     * Controls the active state of the TabPanel, usually managed by `<Tabs>`.
     */
    active?: boolean;

    /**
     * Use animation when showing or hiding `<TabPanel>`s.
     */
    transition?: React.ComponentType<TransitionOptions>;

    /**
     * Delays mounting of the tab content until the enter transition.
     */
    mountOnEnter?: boolean;

    /**
     * Unmounts the tab content after it becomes invisible.
     */
    unmountOnExit?: boolean;
}