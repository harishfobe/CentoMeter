import React from "react";
import { responseLabel } from "../../lib/agents";
import StatsRow from "./StatsRow";
import { toggleStore, useAgentStore } from "../../lib/agentStore";
export default function AgentHeader({ agent: a, count, onShare }) {
  const s = useAgentStore();
  return (
    <header className="agent-profile-heading">
      <img src={a.avatar} alt="" width="80" height="80" />
      <div>
        <h1>{a.name}</h1>
        <p>
          @{a.handle}{" "}
          {a.verified && (
            <abbr title="Sample verification flag, not an independent identity or RERA check">
              Verified ✓
            </abbr>
          )}
        </p>
        <p>
          {a.city} · {a.experienceYears} years · {a.languages.join(", ")}
        </p>
        {responseLabel(a) && <p>{responseLabel(a)}</p>}
        <StatsRow agent={a} count={count} />
        <details>
          <summary>About · Read more</summary>
          <p>{a.bio}</p>
        </details>
        <div className="action-row">
          <a
            className="primary"
            href={
              "https://wa.me/91" +
              a.whatsapp +
              "?text=" +
              encodeURIComponent(
                "Hello " +
                  a.name +
                  ", I am interested in your CentoMeter listings.",
              )
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            Message on WhatsApp
          </a>
          <a
            className="secondary"
            href={a.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
          <button className="secondary" onClick={onShare}>
            Share
          </button>
          <button
            className="secondary"
            aria-pressed={s.followed.includes(a.id)}
            onClick={() => toggleStore("followed", a.id)}
          >
            {s.followed.includes(a.id) ? "Following" : "Follow"}
          </button>
        </div>
      </div>
    </header>
  );
}
