import React from "react";

/** @typedef {"button" | "reset" | "submit"} ButtonType Defines the permissible button types. */

/**
 * A hook designed to format a component as an accessible button, adhering to established web standards.
 *
 * @param {object} options - The options for the hook.
 * @param {ButtonType} [options.type] - Specifies the button type.
 * @param {boolean} [options.disabled] - Determines whether the button is disabled.
 * @param {string} [options.href] - Designates the URL for anchor-type buttons.
 * @param {string} [options.rel] - Defines the relationship between the current document and the linked URL for anchor-type buttons.
 * @param {string} [options.target] - Specifies the target frame for the linked URL in anchor-type buttons.
 * @param {React.EventHandler<React.MouseEvent | React.KeyboardEvent>} [options.onClick] - Handler for click and keyboard events.
 * @param {number} [options.tabIndex] - Sets the tabIndex attribute for the button.
 * @param {keyof React.JSX.IntrinsicElements} [options.tagName] - Determines the HTML tag to be used for the button.
 * @param {React.AriaRole | undefined} [options.role] - Assigns an ARIA role to the button.
 * @returns {[*, {tagName: React.ElementType}]}
 */
export function useButton({ tagName, disabled, href, target, rel, role, onClick, tabIndex = 0, type }) {
    tagName = tagName ?? (href != null || target != null || rel != null ? "a" : "button");

    if (tagName === "button") return [{ type: type || "button", disabled }, { tagName }];

    /**
     * Handles click events, including prevention of default behavior for disabled or incorrectly configured anchor elements.
     * @param {React.MouseEvent | React.KeyboardEvent} event
     */
    function handleClick(event) {
        if (disabled || (tagName === "a" && (!href || href.trim() === "#"))) {
            event.preventDefault();
            if (disabled) {
                event.stopPropagation();
                return;
            }
        }
        onClick?.(event);
    }

    /**
     * Handles key down events, specifically for space key presses.
     * @param {React.KeyboardEvent} event
     */
    function handleKeyDown(event) {
        if (event.key === " ") {
            event.preventDefault();
            handleClick(event);
        }
    }

    // Ensure there's a href so Enter can trigger anchor button.
    href = tagName === "a" ? href || "#" : href;
    if (disabled && tagName === "a") href = undefined;

    return [{
        role: role ?? "button",
        disabled: undefined,
        tabIndex: disabled ? undefined : tabIndex,
        href,
        target: tagName === "a" ? target : undefined,
        "aria-disabled": disabled ? true : undefined,
        rel: tagName === "a" ? rel : undefined,
        onClick: handleClick,
        onKeyDown: handleKeyDown
    }, { tagName }];
}

/**
 * Button component capable of being rendered as various HTML elements.
 *
 * @param {object} props - The properties for the button component.
 * @param {keyof React.JSX.IntrinsicElements | undefined} [props.as] - The underlying element to be rendered, e.g., `button`, `a`, etc.
 * @param {boolean | undefined} [props.disabled] - Indicates whether the button is disabled.
 * @param {string | undefined} [props.href] - URL for rendering an anchor element styled as a button.
 * @param {string | undefined} [props.target] - Target frame for anchor elements rendered as buttons.
 * @param {string | undefined} [props.rel] - Relationship between the current document and the linked URL in anchor elements.
 * @param {React.Ref<HTMLElement>} ref - Reference object for DOM node access.
 * @returns {React.JSX.Element}
 */
function Button({ as: tagName, disabled, ...props }, ref) {
    const [buttonProps, { tagName: Component }] = useButton({ tagName, disabled, ...props });

    return <Component ref={ref} {...props} {...buttonProps} />;
}

export default React.forwardRef(Button);
