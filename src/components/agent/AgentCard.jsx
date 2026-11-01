import { useCardEntrance } from "../../lib/agentMotion";
import { ShieldCheck, MapPin, ArrowUpRight } from "lucide-react";
import React, { memo } from "react";
import { responseLabel, activeListings } from "../../lib/agents";
import { toggleStore, useAgentStore } from "../../lib/agentStore";
function AgentCard({ agent: a, items, onNavigate }) {
  const entrance = useCardEntrance();
  const s = useAgentStore();
  return (
    <article ref={entrance} className="agent-card">
      <div className="agent-card-identity">
        <img width="52" height="52" src={a.avatar} alt="" />
        <div>
          <h2>
            {a.name}
            {a.verified && (
              <ShieldCheck
                size={17}
                className="agent-verified-icon"
                aria-label="Sample verified agent"
              />
            )}
          </h2>
          <p>
            <MapPin size={13} aria-hidden="true" />
            {a.city} · @{a.handle}
          </p>
        </div>
      </div>
      <p className="agent-response">
        <span aria-hidden="true" />
        {responseLabel(a)}
      </p>
      <div className="chips">
        {a.specialties.slice(0, 3).map((x) => (
          <span className="pill" key={x}>
            {x}
          </span>
        ))}
      </div>
      <p className="agent-card-meta">
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
      <div className="agent-card-actions">
        <button
          className="primary"
          onClick={() => onNavigate("agent/" + a.handle)}
        >
          View profile <ArrowUpRight size={16} aria-hidden="true" />
        </button>
        <button
          className="secondary"
          aria-pressed={s.followed.includes(a.id)}
          onClick={() => toggleStore("followed", a.id)}
        >
          {s.followed.includes(a.id) ? "Following" : "Follow"}
        </button>
      </div>
    </article>
  );
}

export default memo(AgentCard);
