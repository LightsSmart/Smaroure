import React, { useState } from "react";
import { Tabs } from "../shared/index.js";
import Header from "./Header.jsx";
import styles from "./index.module.css";

export { default as Login } from "./Login.jsx";

/**
 * The scaffold component, including response header, with hero image and text, tabs system.
 *
 * @param {object} props
 * @param {{[key: number]: {title: string, element: React.JSX.Element}}} props.tabs
 * @param {string} props.image
 * @param {{main: string, sub:string}} props.title
 * @return {React.JSX.Element}
 */
function Scaffold({ tabs, image, title }) {
    const [activeKey, setActiveKey] = useState(1);

    return (
        <Tabs activeKey={activeKey} onSelect={(/** @type {*} */ key) => key && setActiveKey(key)}>
          <div className={styles.background}>
            <img src={image} alt={title.main} />
          </div>
          <Header tabs={tabs} image={image} title={title} />
          <div>
            {Object.entries(tabs).map(([key, { element }]) =>
              element && <Tabs.Panel key={`[home]content-${key}`} eventKey={key}>{element}</Tabs.Panel>
            )}
          </div>
        </Tabs>
    );
}

export default Scaffold;
