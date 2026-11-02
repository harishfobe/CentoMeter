import React, { useRef, useEffect } from "react";
import { observeOnce, animateMotion } from "../../lib/agentMotion";
function Counter({ value }) {
  const ref = useRef(null);
  useEffect(() => {
    let animation;
    const stop = observeOnce(ref.current, () => {
      animation = animateMotion(
        ref.current,
        [
          { opacity: 0, translate: "0 4px" },
          { opacity: 1, translate: "0 0" },
        ],
        { duration: 280 },
      );
    });
    return () => {
      stop();
      animation?.cancel();
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
