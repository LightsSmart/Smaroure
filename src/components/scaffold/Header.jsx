import React, { useEffect, useRef, useState } from "react";
import Toggle from "./Toggle.jsx";
import { Button, Nav, useNavItem } from "../shared/index.js";
import styles from "./Header.module.css";

const Tab = React.forwardRef(function (/** @type {*} */ { eventKey, ...props }, ref) {
    const [navItemProps, { isActive }] = useNavItem({ key: eventKey });

    return (
        <Button
            {...props}
            {...navItemProps}
            ref={ref}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
        />
    );
});

/**
 * The header component.
 *
 * @param {object} props
 * @param {{[key: number]: {title: string, element: React.JSX.Element}}} props.tabs
 * @param {string} [props.image]
 * @param {{main: string, sub:string}} props.title
 * @return {React.JSX.Element}
 */
function Header({ tabs, image, title }) {
    const [isNavExpanded, setIsNavExpanded] = useState(false);
    const navbarRef = useRef(null);
    const tabRefs = useRef(/** @type {*} */ ({}));

    useEffect(() => {
        tabRefs.current = Object.fromEntries(Object.keys(tabs).map(key =>
            [key, tabRefs.current[key] || React.createRef()]
        ));
    }, [tabs]);

    return (
        <div className={styles.header}>
          <div className={styles.topper}>{title.main}</div>
          <div className={styles.content}>
            <h1>{title.main}</h1>
            <h2>{title.sub}</h2>
          </div>
          <Toggle expanded={isNavExpanded} onToggle={state => setIsNavExpanded(state)} />
          <Nav ref={navbarRef} className={`${styles.navbar} ${isNavExpanded ? styles.expanded : ''}`}>
            {Object.entries(tabs).map(([key, { title }]) =>
              title && <Tab ref={tabRefs.current[key]} key={`[home]nav-${key}`} eventKey={key}>{title}</Tab>
            )}
          </Nav>
        </div>
    );
}

export default Header;
