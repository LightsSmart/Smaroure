import React, { useState } from "react";
import IO from "./IO.jsx";

/**
 *
 * @param {*} state
 * @return {React.JSX.Element}
 */
function Dashboard({ state }) {
    const [toggled, setToggled] = useState(false);
    const [enable, setEnable] = useState(false);

    return (
        <div style={{ width: 220, border: "1px solid" }}>
          <IO enable={toggled} onToggle={() => setToggled(!toggled)}>
            test
          </IO>
        </div>
    );
}

export default Dashboard;
