import WhatsAppLink from "../WhatsAppLink";
import { mergeListings } from "../../lib/agents";
import useExpiryTick from "../../lib/useExpiryTick";
import React from "react";
import { agents, listings } from "../../lib/agents";
import { useAgentStore, viewerId, canRequest } from "../../lib/agentStore";
import { accessStatus } from "../../lib/locationAccess";
export function AgentRequests({ onNavigate }) {
  const s = useAgentStore();
  useExpiryTick(s.requests.filter((r) => r.viewerId === viewerId));
  return (
    <>
      {s.visits
        .filter((v) => v.viewerId === viewerId)
        .map((v) => (
          <article className="request-card" key={v.id}>
            <h2>
              Site visit ·{" "}
              {
                mergeListings(listings, s.customListings || []).find(
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
            p = mergeListings(listings, s.customListings || []).find(
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
                className={
                  ["expired", "declined", "revoked"].includes(status) &&
                  !canRequest(s.requests, r.propertyId)
                    ? "primary"
                    : "secondary"
                }
                onClick={() =>
                  onNavigate("agent/" + a.handle + "?l=" + r.propertyId)
                }
              >
                {["expired", "declined", "revoked"].includes(status) &&
                !canRequest(s.requests, r.propertyId)
                  ? "Request again"
                  : "View listing"}
              </button>
            </article>
          );
        })}
    </>
  );
}
export function AgentSaved({ onNavigate }) {
  const s = useAgentStore();
  return (
    <section>
      <h2>Agent shortlist</h2>
      {agents.map((a) => {
        const rows = mergeListings(listings, s.customListings || []).filter(
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
            <WhatsAppLink
              className="secondary"
              number={a.whatsapp}
              message={
                "My CentoMeter shortlist: " +
                rows.map((p) => p.title).join(", ")
              }
            >
              Send shortlist to agent on WhatsApp
            </WhatsAppLink>
          </article>
        ) : null;
      })}
    </section>
  );
}
