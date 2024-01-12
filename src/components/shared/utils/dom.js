/**
 * @param {Node | Window} node
 * @return {string}
 */
export function getNodeName(node) {
    return isNode(node) ? (node.nodeName || '').toLowerCase() : "#document";
}

/**
 * @param {*} node
 * @return {typeof window}
 */
export function getWindow(node) {
    return node?.ownerDocument?.defaultView || window
}

/**
 * @param {Node | Window} node
 * @return {HTMLElement}
 */
export function getDocumentElement(node) {
    return ((isNode(node) ? node.ownerDocument : node.document) || window.document)?.documentElement;
}

/**
 * @param {?} value
 * @return {value is Node}
 */
export function isNode(value) {
    return value instanceof Node || value instanceof getWindow(value).Node;
}

/**
 * @param {?} value
 * @return {value is Element}
 */
export function isElement(value) {
    return value instanceof Element || value instanceof getWindow(value).Element;
}

/**
 * @param {?} value
 * @return {value is HTMLElement}
 */
export function isHTMLElement(value) {
    return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
}

/**
 * @param {?} value
 * @return {value is ShadowRoot}
 */
export function isShadowRoot(value) {
    // Browsers without `ShadowRoot` support.
    if (typeof ShadowRoot === "undefined") return false;

    return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
}