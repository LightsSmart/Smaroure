import React from "react";

export function useButton({ tagName, disabled, href, target, rel, role, onClick, tabIndex = 0, type }) {
    tagName = tagName ?? (href != null || target != null || rel != null ? "a" : "button");

    if (tagName === "button") return [{ type: type || "button", disabled }, { tagName }];

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
 * The common button component.
 * @param {object} props
 * @param {keyof JSX.IntrinsicElements} [props.as] The underlying rendered element
 * @param {boolean} [props.disabled] The disabled state of the button
 * @param {string} [props.href] Specify a href to render a `<a>` tag styled as a button
 * @param {string} [props.target] Anchor target, when rendering an anchor as a button
 * @param {string} [props.rel]
 * @param {React.Ref<HTMLElement>} ref The DOM reference
 * @returns {JSX.Element}
 */
function Button({ as: tagName, disabled, ...props }, ref) {
    const [buttonProps, { tagName: Component }] = useButton({ tagName, disabled, ...props });

    return <Component ref={ref} {...props} {...buttonProps} />;
}

export default React.forwardRef(Button);
