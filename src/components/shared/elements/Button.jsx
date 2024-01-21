import React from "react";

/**
 * A hook designed to format a component as an accessible button, adhering to
 * established web standards.
 *
 * @param {import("./types.js").useButtonOptions} options - The options for the hook.
 * @return {[*, {tagName: React.ElementType}]}
 */
export function useButton({ tagName, disabled, href, target, rel, role, onClick, tabIndex = 0, type }) {
    tagName = tagName ?? (href != null || target != null || rel != null ? "a" : "button");

    if (tagName === "button") return [{ type: type || "button", disabled }, { tagName }];

    /**
     * Handles click events, including prevention of default behavior for
     * disabled or incorrectly configured anchor elements.
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
 * @param {import("./types.js").ButtonProps} props - The properties for the button component.
 * @param {React.Ref<HTMLElement>} ref - Reference object for DOM node access.
 * @return {React.JSX.Element}
 */
function Button({ as: tagName, disabled, ...props }, ref) {
    const [buttonProps, { tagName: Component }] = useButton({ tagName, disabled, ...props });

    return <Component ref={ref} {...props} {...buttonProps} />;
}

export default React.forwardRef(Button);
