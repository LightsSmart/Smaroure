import React, { useState } from "react";
import Tabs from "../shared/Tabs.jsx";
import Header from "./Header.jsx";
import styles from "./index.module.css";

export { default as Login } from "./Login.jsx";
export { default as Render } from "./Render.jsx";

/**
 * The home component, including response header, with hero image and text, tabs system.
 * @param {{[key: number]: {title: string, element: JSX.Element}}} tabs
 * @param {string} image
 * @param {{main: string, sub:string}} title
 * @returns {JSX.Element}
 */
function Home({ tabs, image, title }) {
    const [activeKey, setActiveKey] = useState(1);

    return (
        <Tabs activeKey={activeKey} onSelect={key => setActiveKey(key)}>
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

export default Home;
