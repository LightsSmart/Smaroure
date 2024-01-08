import React, { useEffect, useRef, useState } from "react";
import Toggle from "./Toggle.jsx";
import Nav, { useNavItem } from "../shared/Navs.jsx";
import Button from "../shared/Button.jsx";
import styles from "./Header.module.css";

const Tab = React.forwardRef(function ({ eventKey, ...props }, ref) {
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

function Header({ tabs, title }) {
    const [isNavExpanded, setIsNavExpanded] = useState(false);
    const navbarRef = useRef(null);
    const tabRefs = useRef({});

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
          <Toggle expanded={isNavExpanded} onToggle={state => setIsNavExpanded(state)}/>
          <Nav ref={navbarRef} className={`${styles.navbar} ${isNavExpanded ? styles.expanded : ''}`}>
            {Object.entries(tabs).map(([key, { title }]) =>
              title && <Tab ref={tabRefs.current[key]} key={`[home]nav-${key}`} eventKey={key}>{title}</Tab>
            )}
          </Nav>
        </div>
    );
}

export default Header;
