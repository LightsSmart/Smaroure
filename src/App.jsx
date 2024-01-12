// rust linker: import { invoke } from "@tauri-apps/api/core";
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home, { Login, Render } from "./components/home/index.jsx";
import Dashboard from "./components/dashboard/index.jsx";
import "./App.css";

import home from "./asserts/home.md?raw";
import product from "./asserts/product.md?raw";
import feature from "./asserts/feature.md?raw";
import benefit from "./asserts/benefit.md?raw";
import shop from "./asserts/shop.md?raw";
import contact from "./asserts/contact.md?raw";

import house from "./asserts/images/house.jpg";

function App() {
    const tabs = {
        1: { title: "HomePage", element: <Render content={home} />    },
        2: { title: "Products", element: <Render content={product} /> },
        3: { title: "Features", element: <Render content={feature} /> },
        4: { title: "Benefits", element: <Render content={benefit} /> },
        5: { title: "Shop",     element: <Render content={shop} />    },
        6: { title: "Contact",  element: <Render content={contact} /> },
        7: { title: "MyHouse",  element: <Login />                    }
    };

    // Use string template for better character compatibility
    const title = {
        main: String.raw`SmartLights`,
        sub: String.raw`By VAALEEX Inc.`
    };

    return (
        <Router>
          <Routes>
            <Route path={"/"} element={<Home tabs={tabs} image={house} title={title} />} />
            <Route path={"/dashboard"} element={<Dashboard />} />
          </Routes>
        </Router>
    );
}

export default App;
