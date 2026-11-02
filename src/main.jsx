import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./ErrorBoundary";
import "./styles.css";
import "./mobile.css";
import "./minimal.css";
import "./search-discovery.css";
import "./styles/agents.css";
import "./styles/motion.css";
createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);

import "./styles/refinement.css";

import "./styles/interactions.css";
