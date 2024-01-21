import React, { useEffect, useState } from "react";
import Switch from "./Switch.jsx";
import IO from "./IO.jsx";
import styles from "./Controller.module.css";

/**
 *
 * @param {object} props
 * @param {[any]} props.components
 * @return {React.JSX.Element}
 */
function Controller({ components }) {
    const [selectedItem, setSelectedItem] = useState(null);
    const [orientation, setOrientation] = useState("vertical");

    useEffect(() => {
        function handleResize() {
            setOrientation(window.innerWidth > 600 ? "horizontal" : "vertical");
        }

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    /**
     * @param {*} index
     * @param {*} data
     */
    function handleChange(index, data) {
    }

    /**
     * @param {*} component
     * @param {*} index
     * @return {React.JSX.Element|null}
     */
    function renderComponent(component, index) {
        switch (component.type) {
            case "switch":
                return (
                    <Switch
                        enable={component.checked}
                        onToggle={(e) => handleChange(index, { checked: e.target })}
                    >
                      {component.name}
                    </Switch>
                );
            case "io":
                return (
                    <IO
                        enable={component.value}
                        onToggle={(e) => handleChange(index, { value: e.target })}
                    >
                      {component.name}
                    </IO>
                );
            default:
                return null;
        }
    }


    return (
        <div className={`${styles.container} ${orientation === "vertical" ? "column" : "row"}`}>
          {components.map((component, index) => (
            <div key={index} className={styles.item}>
              {renderComponent(component, index)}
            </div>
          ))}
        </div>
    );
}

export default Controller;
