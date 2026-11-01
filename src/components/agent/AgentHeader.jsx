import React from "react";
import { MapPin, ShieldCheck, MessageCircle, Share2 } from "lucide-react";
import { responseLabel } from "../../lib/agents";
import StatsRow from "./StatsRow";
import { toggleStore, useAgentStore, notifyAgent } from "../../lib/agentStore";
export default function AgentHeader({ agent: a, count, onShare }) {
  const s = useAgentStore();
  return (
    <header className="agent-profile-heading">
      <div className="agent-identity">
        <img src={a.avatar} alt="" width="64" height="64" />
        <div>
          <h1>{a.name}</h1>
          <p>
            @{a.handle}{" "}
            {a.verified && (
              <abbr title="Sample verification flag, not an independent identity or RERA check">
                <ShieldCheck size={13} aria-hidden="true" /> Verified
              </abbr>
            )}
          </p>
          <p>
            <MapPin size={13} aria-hidden="true" />
            {a.city} · {a.languages.join(", ")}
          </p>
        </div>
      </div>
      {responseLabel(a) && (
        <p className="agent-response">
          <span aria-hidden="true" />
          {responseLabel(a)}
        </p>
      )}
      <StatsRow agent={a} count={count} compact />
      <details>
        <summary>About · Read more</summary>
        <p>{a.bio}</p>
        {a.reraAgentNo && (
          <p className="agent-registration">RERA agent no. {a.reraAgentNo}</p>
        )}
      </details>
      <div className="action-row">
        <a
          className="primary"
          onClick={(e) => {
            if (!/^\d{10}$/.test(a.whatsapp)) {
              e.preventDefault();
              notifyAgent(
                "Demo WhatsApp: " + a.whatsapp + " is a fake number.",
              );
            }
          }}
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
          <MessageCircle size={17} aria-hidden="true" /> Message on WhatsApp
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
          <Share2 size={15} aria-hidden="true" /> Share
        </button>
        <button
          className="secondary"
          aria-pressed={s.followed.includes(a.id)}
          onClick={() => toggleStore("followed", a.id)}
        >
          {s.followed.includes(a.id) ? "Following" : "Follow"}
        </button>
      </div>
    </header>
  );
}
