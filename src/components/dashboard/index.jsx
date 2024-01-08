import React from "react";
import Controller from "./Controller.jsx";

function Dashboard() {
    return (
        <>
            {/* For debug propose */}
            <Controller components={[
                { type: "switch"  },
                { type: "charger" }
            ]}/>
        </>
    );
}

export default Dashboard;