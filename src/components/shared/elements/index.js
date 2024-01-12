import React from "react";

export { default as Button, useButton } from "./Button.jsx";
export { default as Tabs, useTabPanel } from "./Tabs.jsx";
export { default as Nav, useNavItem } from "./Navs.jsx";

/**
 * @typedef {import("./types.js").EventKey} EventKey
 * @typedef {import("./types.js").SelectCallback} SelectCallback
 */

export const SelectableContext = /** @type {React.Context<SelectCallback | null>} */ (React.createContext(null));

const ATTRIBUTE_PREFIX = "data-smaroure-";

const PROPERTY_PREFIX = "Smaroure";

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
