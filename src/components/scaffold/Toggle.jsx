import React from "react";
import { Button } from "../shared/index.js";
import styles from "./Toggle.module.css";

/**
 * The toggle button component.
 *
 * @param {object} props
 * @param {boolean} props.expanded
 * @param {function(boolean): void} props.onToggle
 * @return {React.JSX.Element}
 */
function Toggle({ expanded, onToggle }) {
    return (
        <Button
            className={`${styles.toggle} ${expanded ? styles.expanded : ''}`}
            onClick={() => onToggle?.(!expanded)}>
          <svg viewBox="0 0 40 26" fill="white">
            {[0, 10, 20].map((y, i) => (
              <rect key={`toggle-y-${i}`} width="40" height="6" y={y} rx="3" ry="3" />
            ))}
          </svg>
        </Button>
    );
}

export default Toggle;
