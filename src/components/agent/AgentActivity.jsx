import React, { useState, useEffect } from "react";
import { agents, listings } from "../../lib/agents";
import {
  useAgentStore,
  viewerId,
  canRequest,
  notifyAgent,
} from "../../lib/agentStore";
import { accessStatus } from "../../lib/locationAccess";
export function AgentRequests({ onNavigate }) {
  const s = useAgentStore();
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 60000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div>
      {s.visits
        .filter((v) => v.viewerId === viewerId)
        .map((v) => (
          <article className="request-card" key={v.id}>
            <h2>
              Site visit ·{" "}
              {
                [...listings, ...(s.customListings || [])].find(
                  (p) => p.id === v.propertyId,
                )?.title
              }
            </h2>
            <p>{v.date}</p>
            <p role="status">{v.status}</p>
          </article>
        ))}
      {s.requests
        .filter((r) => r.viewerId === viewerId)
        .map((r) => {
          const a = agents.find((a) => a.id === r.agentId),
            p = [...listings, ...(s.customListings || [])].find(
              (p) => p.id === r.propertyId,
            );
          const status = accessStatus(r);
          return (
            <article className="request-card" key={r.id}>
              <h2>{p?.title}</h2>
              <p role="status">
                {status}
                {status === "approved" && r.expiresAt
                  ? " · " +
                    Math.max(
                      0,
                      Math.ceil(
                        (Date.parse(r.expiresAt) - Date.now()) / 3600000,
                      ),
                    ) +
                    " h remaining"
                  : ""}
              </p>
              <button
                className="secondary"
                onClick={() =>
                  onNavigate("agent/" + a.handle + "?l=" + r.propertyId)
                }
              >
                View listing
              </button>
              {["expired", "declined", "revoked"].includes(status) &&
                !canRequest(s.requests, r.propertyId) && (
                  <button
                    className="primary"
                    onClick={() =>
                      onNavigate("agent/" + a.handle + "?l=" + r.propertyId)
                    }
                  >
                    Request again
                  </button>
                )}
            </article>
          );
        })}
    </div>
  );
}
export function AgentSaved({ onNavigate }) {
  const s = useAgentStore();
  return (
    <section>
      <h2>Agent shortlist</h2>
      {agents.map((a) => {
        const rows = [...listings, ...(s.customListings || [])].filter(
          (p) => p.agentId === a.id && s.saved.includes(p.id),
        );
        return rows.length ? (
          <article className="request-card" key={a.id}>
            <h3>{a.name}</h3>
            {rows.map((p) => (
              <button
                className="secondary"
                key={p.id}
                onClick={() => onNavigate("agent/" + a.handle + "?l=" + p.id)}
              >
                {p.title}
              </button>
            ))}
            <a
              className="secondary"
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
                  "My CentoMeter shortlist: " +
                    rows.map((p) => p.title).join(", "),
                )
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              Send shortlist to agent on WhatsApp
            </a>
          </article>
        ) : null;
      })}
    </section>
  );
}
