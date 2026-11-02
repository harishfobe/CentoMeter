import useViewMode from "../useViewMode";
import React from "react";
function CardPlaceholder({ agent }) {
  return (
    <div className="loading-card">
      {agent && (
        <>
          <div className="loading-identity">
            <div className="loading-avatar" />
            <div className="loading-line" />
          </div>
          <div className="loading-line short" />
          <div className="loading-line short" />
        </>
      )}
      <div className="loading-photo" />
      <div className="loading-line" />
      <div className="loading-line short" />
    </div>
  );
}
export default function LoadingSkeleton({ kind = "finder" }) {
  const [view] = useViewMode(
    kind === "finder"
      ? "centometer-view-finder"
      : "centometer-view-agent-listings",
  );
  const agent = kind === "finder";
  return (
    <section
      className={`loading-skeleton loading-${kind}`}
      data-view={view}
      role="status"
      aria-label="Loading content"
      aria-busy="true"
    >
      {kind !== "map" && <div className="loading-heading" />}
      {kind !== "map" && <div className="loading-line" />}
      <div className="loading-content">
        {Array.from(
          { length: ["finder", "profile"].includes(kind) ? 3 : 1 },
          (_, i) => (
            <CardPlaceholder key={i} agent={agent} />
          ),
        )}
      </div>
    </section>
  );
}
