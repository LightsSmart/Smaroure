import React from "react";
import { Button } from "../shared/index.js";
import styles from "./Switch.module.css";

/**
 * The switch component for handle regular button.
 *
 * @param {object} props
 * @param {boolean} props.enable
 * @param {React.EventHandler<React.MouseEvent>} props.onToggle
 * @param {React.ReactNode | undefined} [props.children]
 * @return {React.JSX.Element}
 */
function Switch({ enable, onToggle, children }) {
    return (
      <Button
          className={`${styles.switch} ${enable ? styles.on : styles.off}`}
          onClick={onToggle}
      >
        {children}
      </Button>
    )
}

export default Switch;
