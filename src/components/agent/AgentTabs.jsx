import React, { useRef, useLayoutEffect } from "react";
import { animateMotion } from "../../lib/agentMotion";
export default function AgentTabs({ tab, onChange }) {
  const root = useRef(null),
    previous = useRef(tab);
  useLayoutEffect(() => {
    let cleanup = () => {};
    if (previous.current !== tab) {
      const incoming = root.current?.parentElement.querySelector(
        "[data-agent-panel]:not([hidden])",
      );
      const outgoing = root.current?.parentElement.querySelector(
        "#agent-panel-" + previous.current,
      );
      if (outgoing && incoming) {
        const bounds = incoming.getBoundingClientRect(),
          parent = root.current.parentElement.getBoundingClientRect();
        const original = outgoing.getAttribute("style");
        Object.assign(outgoing.style, {
          display: "block",
          position: "absolute",
          top: `${bounds.top - parent.top}px`,
          left: `${bounds.left - parent.left}px`,
          width: `${bounds.width}px`,
          pointerEvents: "none",
          zIndex: "2",
        });
        outgoing.setAttribute("aria-hidden", "true");
        outgoing.inert = true;
        const animation = animateMotion(
          outgoing,
          [
            { opacity: 1, translate: "0 0" },
            { opacity: 0, translate: "0 -8px" },
          ],
          { duration: 200 },
        );
        cleanup = () => {
          if (original === null) outgoing.removeAttribute("style");
          else outgoing.setAttribute("style", original);
          outgoing.removeAttribute("aria-hidden");
          outgoing.inert = false;
        };
        if (animation) animation.onfinish = cleanup;
        else cleanup();
      }
      animateMotion(
        incoming,
        [
          { opacity: 0, translate: "0 8px" },
          { opacity: 1, translate: "0 0" },
        ],
        { duration: 200 },
      );
    }
    previous.current = tab;
    return cleanup;
  }, [tab]);
  return (
    <div
      ref={root}
      className="agent-profile-tabs agent-motion-tabs"
      role="tablist"
      aria-label="Agent sections"
      data-tab={tab}
    >
      <span className="agent-tab-indicator" aria-hidden="true" />
      {["listings", "about"].map((t, i) => (
        <button
          key={t}
          id={"agent-tab-" + t}
          role="tab"
          aria-selected={tab === t}
          aria-controls={"agent-panel-" + t}
          tabIndex={tab === t ? 0 : -1}
          onClick={() => onChange(t)}
          onKeyDown={(e) => {
            if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
              e.preventDefault();
              const next =
                e.key === "Home"
                  ? "listings"
                  : e.key === "End"
                    ? "about"
                    : i === 0
                      ? "about"
                      : "listings";
              onChange(next);
              document
                .getElementById("agent-tab-" + next)
                ?.focus({ preventScroll: true });
            }
          }}
        >
          {t === "listings" ? "Listings" : "About"}
        </button>
      ))}
    </div>
  );
}
