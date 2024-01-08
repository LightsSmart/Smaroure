import React, { useEffect, useState } from "react";
import Switch from "./Switch.jsx";
import IO from "./IO.jsx";
import styles from "./Controller.module.css";

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

    function handleChange(index, data) {
    }

    function renderComponent(component, index) {
        switch (component.type) {
            case "switch":
                return (
                    <Switch
                        name={component.name}
                        checked={component.checked}
                        onChange={(e) => handleChange(index, { checked: e.target.checked })}
                    />
                );
            case "io":
                return (
                    <IO
                        name={component.name}
                        value={component.value}
                        onChange={(e) => handleChange(index, { value: e.target.value })}
                    />
                );
            default:
                return null;
        }
    }


    return (
        <div className={`${styles.container} ${orientation === "vertical" ? "column" : "row"}`}>
            <div>
                {components.map((component, index) => (
                    <button ></button>
                ))}
            </div>
          {components.map((component, index) => (
            <div key={index} className={styles.item}>
              {renderComponent(component, index)}
            </div>
          ))}
            {/*<button onClick={() => setOrientation("horizontal")}>Horizontal</button>*/}
            {/*<button onClick={() => setOrientation("vertical")}>Vertical</button>*/}
            {/*<div className={styles.container} style={{ display: "flex", flexDirection: orientation === "vertical" ? "column" : "row" }}>*/}
            {/*    {components.map((component, index) => (*/}
            {/*        <div key={index} style={{ margin: "10px" }}>*/}
            {/*            {renderComponent(component, index)}*/}
            {/*        </div>*/}
            {/*    ))}*/}
            {/*</div>*/}
        </div>
    );
}

export default Controller;