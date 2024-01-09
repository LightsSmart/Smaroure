import React from "react";

export { default as Button, useButton } from "./Button.jsx";
export { default as Tabs, useTabPanel } from "./Tabs.jsx";
export { default as Nav, useNavItem } from "./Navs.jsx";

/**
 * @typedef {string | number} EventKey
 * Represents a unique identifier for events, typically a string or a number.
 *
 * @typedef {function(string | null, React.SyntheticEvent<?>): void} SelectCallback
 * Function type for callback during select events.
 *
 * @typedef TransitionCallbacks Collection of callback functions for transition states.
 * @property {function(HTMLElement, boolean): *} [onEnter] - Callback for the `enter` transition state.
 * @property {function(HTMLElement, boolean): *} [onEntering] - Callback for the `entering` transition state.
 * @property {function(HTMLElement, boolean): *} [onEntered] - Callback for the `entered` transition state.
 * @property {function(HTMLElement): *} [onExit] - Callback for the `exit` transition state.
 * @property {function(HTMLElement): *} [onExiting] - Callback for the `exiting` transition state.
 * @property {function(HTMLElement): *} [onExited] - Callback for the `exited` transition state.
 *
 * @typedef TransitionProps
 * @property {boolean} [in] - Boolean to trigger the enter or exit states of the transition.
 * @property {boolean} [appear] - If true, the component will transition on initial mount.
 * @property {React.ReactElement} children - The children elements of the transition component.
 * @property {boolean} [mountOnEnter] - Mount the component when the transition enters.
 * @property {boolean} [unmountOnExit] - Unmount the component after it exits.
 *
 * @typedef {TransitionProps & TransitionCallbacks} TransitionOptions
 * Properties associated with the transition component.
 */

export const SelectableContext = /** @type {React.Context<SelectCallback | null>} */ (React.createContext(null));

export const ATTRIBUTE_PREFIX = "data-smaroure-";
export const PROPERTY_PREFIX = "Smaroure";

/**
 * Generates a formatted event key, either from the provided eventKey or href.
 *
 * @param {EventKey | null} [eventKey] - The event key to format.
 * @param {string | null} href - The href to use if eventKey is not provided.
 * @return {string | null} - The formatted event key.
 */
export const makeEventKey = (eventKey, href = null) => eventKey != null ? String(eventKey) : href || null;

/**
 * Constructs a data attribute string, prefixed appropriately.
 *
 * @param {string} property - The property to format as a data attribute.
 * @return {string} - The formatted data attribute string.
 */
export const dataAttr = property => `${ATTRIBUTE_PREFIX}${property}`;

/**
 * Constructs a data property string, prefixed appropriately.
 *
 * @param {string} property - The property to format as a data attribute.
 * @return {string} - The formatted data property string.
 */
export const dataProp = property => `${PROPERTY_PREFIX}${property}`;
