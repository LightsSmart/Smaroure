// rust linker: import { invoke } from "@tauri-apps/api/core";
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Scaffold, { Login } from "./components/scaffold/index.jsx";
import Dashboard from "./components/dashboard/index.jsx";
import "./App.css";

import Home from "./pages/Home.mdx";
import Product from "./pages/Product.mdx";
import Feature from "./pages/Feature.mdx";
import Benefit from "./pages/Benefit.mdx";
import Shop from "./pages/Shop.mdx";
import Contact from "./pages/Contact.mdx";

import house from "./asserts/images/house.jpg";

function App() {
    const tabs = {
        1: { title: "HomePage", element: <Home />    },
        2: { title: "Products", element: <Product /> },
        3: { title: "Features", element: <Feature /> },
        4: { title: "Benefits", element: <Benefit /> },
        5: { title: "Shop",     element: <Shop />    },
        6: { title: "Contact",  element: <Contact /> },
        7: { title: "MyHouse",  element: <Login />   }
    };

    // Use string template for better character compatibility
    const title = { main: String.raw`SmartLights`, sub: String.raw`By VAALEEX Inc.` };

    return (
        <Router>
          <Routes>
            <Route path={"/"} element={<Scaffold tabs={tabs} image={house} title={title} />} />
            <Route path={"/dashboard"} element={<Dashboard state={{}} />} />
          </Routes>
        </Router>
    );
}

export default App;
