import React from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import App from "./App.jsx";
import ErrorBoundary from "./ErrorBoundary";
import "./styles.css";
import "./mobile.css";
import "./search-discovery.css";
import "./styles/agents.css";
import "./styles/motion.css";
import "./styles/refinement.css";
import "./styles/interactions.css";
import "./styles/home.css";
import "./minimal.css";
import "./styles/craft.css";
import "./styles/land-listing.css";
import "./styles/agent-dashboard.css";
import "./styles/polish.css";
createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </ErrorBoundary>,
);
