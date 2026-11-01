import { useCardEntrance } from "../../lib/agentMotion";
import React, { memo } from "react";
import { responseLabel, activeListings } from "../../lib/agents";
import { toggleStore, useAgentStore } from "../../lib/agentStore";
function AgentCard({ agent: a, items, onNavigate }) {
  const entrance = useCardEntrance();
  const s = useAgentStore();
  return (
    <article ref={entrance} className="agent-card">
      <img width="64" height="64" src={a.avatar} alt="" />
      <h2>
        {a.name}
        {a.verified ? " ✓" : ""}
      </h2>
      <p>
        @{a.handle} · {a.city}
      </p>
      <p>{responseLabel(a)}</p>
      <div className="chips">
        {a.specialties.slice(0, 3).map((x) => (
          <span className="pill" key={x}>
            {x}
          </span>
        ))}
      </div>
      <p>
        {activeListings(items, a.id).length}{" "}
        {activeListings(items, a.id).length === 1
          ? "active listing"
          : "active listings"}{" "}
        · {a.experienceYears} {a.experienceYears === 1 ? "year" : "years"}
      </p>
      <div className="agent-thumbnails">
        {items
          .filter((p) => p.agentId === a.id)
          .slice(0, 3)
          .map((p) => (
            <img
              key={p.id}
              width="80"
              height="60"
              loading="lazy"
              decoding="async"
              src={p.photos[0]}
              alt={p.type}
            />
          ))}
      </div>
      <button
        className="primary"
        onClick={() => onNavigate("agent/" + a.handle)}
      >
        View profile
      </button>
      <button
        className="secondary"
        aria-pressed={s.followed.includes(a.id)}
        onClick={() => toggleStore("followed", a.id)}
      >
        {s.followed.includes(a.id) ? "Following" : "Follow"}
      </button>
    </article>
  );
}

export default memo(AgentCard);
