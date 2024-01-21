import { deepEqual } from "./equal.js";

class AssertionError extends Error {
    name = /** @type {const} */ ("Assertion");
    code = /** @type {const} */ ("ERR_ASSERTION");

    /**
     * Create an assertion error.
     *
     * @param {string} message - Message explaining error.
     * @param {?} actual - Value.
     * @param {?} expected - Baseline.
     * @param {string} operator - Name of equality operation.
     * @param {boolean} generated - Whether `message` is a custom message or not.
     */
    constructor(message, actual, expected, operator, generated) {
        super(message);

        /** @type {?} */
        this.actual = actual;

        /** @type {?} */
        this.expected = expected;

        /** @type {boolean} */
        this.generated = generated;

        /** @type {string} */
        this.operator = operator;
    }
}

/**
 * Assert deep strict equivalence.
 *
 * @template {?} T - Expected kind.
 * @param {?} actual - Value.
 * @param {T} expected - Baseline.
 * @param {Error | string} [message] - Message for assertion error (default: `'Expected values to be deeply equal'`).
 * @return {asserts actual is T}
 * @throws {AssertionError} - Throws when `actual` is not deep strict equal to `expected`.
 */
export function equal(actual, expected, message) {
    assert(deepEqual(actual, expected), actual, expected, "equal", "Expected values to be deeply equal", message);
}

/**
 * Assert if `value` is truthy.
 *
 * @param {?} value - Value to assert.
 * @param {Error | string} [message] - Message for assertion error (default: `'Expected value to be truthy'`).
 * @return {asserts value}
 * @throws {AssertionError} - Throws when `value` is falsey.
 */
export function ok(value, message) {
    assert(Boolean(value), false, true, "ok", "Expected value to be truthy", message);
}

/**
 * Assert that a code path never happens.
 *
 * @param {Error | string} [message] - Message for assertion error (default: `'Unreachable'`).
 * @return {never}
 * @throws {AssertionError} -Throws when `value` is falsey.
 */
export function unreachable(message) {
    assert(false, false, true, "ok", "Unreachable", message);
}

/**
 * @param {boolean} bool - Whether to skip this operation.
 * @param {?} actual - Actual value.
 * @param {?} expected - Expected value.
 * @param {string} operator - Operator.
 * @param {string} defaultMessage - Default message for operation.
 * @param {Error | string} [userMessage] - User-provided message.
 * @return {asserts bool}
 */
function assert(bool, actual, expected, operator, defaultMessage, userMessage) {
// #if DEV
    if (!bool) {
        throw userMessage instanceof Error
            ? userMessage
            : new AssertionError(userMessage || defaultMessage,
                actual,
                expected,
                operator,
                !userMessage);
    }
// #endif
}
