import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

const root = ReactDOM.createRoot(/** @type {Element} */ (document.getElementById("root")));
root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
);
