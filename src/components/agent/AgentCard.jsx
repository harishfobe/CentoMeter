import { useCardEntrance } from "../../lib/agentMotion";
import { ShieldCheck, MapPin, ArrowUpRight } from "lucide-react";
import React, { memo, useMemo, useCallback } from "react";
import { responseLabel, activeListings } from "../../lib/agents";
import { toggleStore, useAgentSelector } from "../../lib/agentStore";
function AgentCard({ agent: a, items, onNavigate }) {
  const entrance = useCardEntrance();
  const selectFollowed = useCallback((s) => s.followed.includes(a.id), [a.id]);
  const followed = useAgentSelector(selectFollowed);
  const count = useMemo(
    () => activeListings(items, a.id).length,
    [items, a.id],
  );
  const previews = useMemo(
    () =>
      items.filter((p) => p.agentId === a.id && p.photos?.length).slice(0, 3),
    [items, a.id],
  );
  return (
    <article ref={entrance} className="agent-card" data-agent-id={a.id}>
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
        {count} {count === 1 ? "active listing" : "active listings"} ·{" "}
        {a.experienceYears} {a.experienceYears === 1 ? "year" : "years"}
      </p>
      <div className="agent-thumbnails">
        {previews.map((p) => (
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
          aria-pressed={followed}
          onClick={() => toggleStore("followed", a.id)}
        >
          {followed ? "Following" : "Follow"}
        </button>
      </div>
    </article>
  );
}

export default memo(AgentCard);
