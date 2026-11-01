import React, { useState, useEffect } from "react";
import { reducedMotion } from "../../lib/agentMotion";
export default function MotionSkeleton({ ready, kind = "cards" }) {
  const [removed, setRemoved] = useState(ready);
  useEffect(() => {
    if (!ready) {
      setRemoved(false);
      return;
    }
    const timer = setTimeout(() => setRemoved(true), reducedMotion() ? 0 : 200);
    return () => clearTimeout(timer);
  }, [ready]);
  if (removed) return null;
  return (
    <div
      className={"agent-skeleton-cover skeleton-" + kind}
      data-ready={ready}
      aria-hidden="true"
    >
      {Array.from({ length: kind === "cards" ? 3 : 1 }, (_, i) => (
        <div className="agent-skeleton" key={i} />
      ))}
    </div>
  );
}
