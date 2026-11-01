import React, { useRef, useEffect } from "react";
import { observeOnce, reducedMotion } from "../../lib/agentMotion";
function Counter({ value }) {
  const ref = useRef(null);
  useEffect(() => {
    if (typeof value !== "number" || reducedMotion()) return;
    let frame = 0;
    const stop = observeOnce(ref.current, () => {
      const start = performance.now();
      const tick = (now) => {
        const t = reducedMotion() ? 1 : Math.min(1, (now - start) / 700);
        if (ref.current)
          ref.current.textContent = String(
            Math.round(value * (1 - Math.pow(1 - t, 3))),
          );
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    return () => {
      stop();
      cancelAnimationFrame(frame);
    };
  }, [value]);
  return (
    <dd ref={ref} aria-label={String(value)}>
      {value}
    </dd>
  );
}
export default function StatsRow({ agent: a, count, compact = false }) {
  return (
    <dl className="agent-stats">
      {[
        ["Active listings", count],
        ["Closed deals", a.closedDeals],
        ["Years", a.experienceYears],
        ["RERA agent no.", a.reraAgentNo],
      ]
        .filter(
          ([label, v]) => v != null && (!compact || label !== "RERA agent no."),
        )
        .map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <Counter value={value} />
          </div>
        ))}
    </dl>
  );
}
