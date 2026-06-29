/**
 * Application bootstrap.
 *
 * Mounts the `App` component into `#root` via `createRoot` (React 18
 * concurrent root). `StrictMode` is on in dev to surface state-mutation
 * and effect-cleanup bugs early; it has no effect in production.
 *
 * Global stylesheet `index.css` is imported here so it sits at the top
 * of the bundle's CSS import graph and other component CSS files
 * inherit the token cascade.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
