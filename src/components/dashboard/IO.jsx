import React from "react";
import { Button } from "../shared/index.js";
import styles from "./IO.module.css";

/**
 * The switch component for handle io state.
 *
 * @param {object} props
 * @param {boolean} props.enable
 * @param {React.EventHandler<React.MouseEvent>} props.onToggle
 * @param {React.ReactNode | undefined} [props.children]
 * @return {React.JSX.Element}
 */
export function IO({ enable, onToggle, children }) {
    return (
        <div className={styles.container}>
          <div className={styles.content}>{children}</div>
          <div className={styles.button}>
            <Button className={`${styles.checkbox} ${enable ? styles.toggled : ""}`} onClick={onToggle} />
            <div className={styles.knobs} />
            <div className={styles.layer} />
          </div>
        </div>
    )
}

export default IO;
