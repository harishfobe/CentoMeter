import React, { useMemo, useState } from "react";
import {
  LockKeyhole,
  MapPin,
  Plus,
  Copy,
  Instagram,
  Check,
  UsersRound,
} from "lucide-react";
import agents from "./agents.json";
import { indianMobile } from "./PropertyModel";
import {
  accessStatus,
  isLocationLocked,
  requestFor,
} from "./lib/locationAccess";
import { qrMatrix } from "./lib/qr";
export function LocationGate({ p, requests, onRequest }) {
  if (!isLocationLocked(p, requests)) return null;
  const status = accessStatus(requestFor(requests, p.id));
  return (
    <section className="location-gate">
      <LockKeyhole size={22} />
      <h2>Exact location is private</h2>
      <p>
        {p.privacy?.mode === "radius"
          ? "The map shows an approximate area."
          : "This listing has no public map pin."}{" "}
        Request the location from the agent.
      </p>
      <span className={"request-status status-" + status}>
        {status === "unrequested" ? "Location locked" : status}
      </span>
      <button
        className="primary"
        disabled={status === "requested"}
        onClick={() => onRequest(p)}
      >
        {status === "requested"
          ? "Request pending"
          : status === "declined"
            ? "Request again"
            : "Request location"}
      </button>
    </section>
  );
}
export function LocationRequestForm({ p, profile, onSubmit }) {
  const [name, setName] = useState(profile.name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [error, setError] = useState("");
  return (
    <form
      className="form-stack location-request-form"
      onSubmit={(e) => {
        e.preventDefault();
        const mobile = indianMobile(phone);
        if (!name.trim() || !mobile) {
          setError("Enter your name and a valid Indian mobile number.");
          return;
        }
        onSubmit({ name: name.trim(), phone: mobile });
      }}
    >
      <p>{p.title}</p>
      <label>
        Name
        <input
          name="name"
          required
          maxLength="80"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </label>
      <label>
        Phone
        <input
          name="phone"
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 mobile number"
        />
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <p className="fine-print">
        Local demo only. Your request is stored on this device. The agent
        approves access per listing.
      </p>
      <button className="primary">Send location request</button>
    </form>
  );
}
export function LocationRequests({ requests, items, onOpen }) {
  return (
    <div className="location-requests">
      {!requests.length && (
        <p>No location requests yet. Request access from an agent listing.</p>
      )}
      {requests.map((r) => {
        const p = items.find((p) => p.id === r.propertyId);
        return (
          <article className="request-card" key={r.id}>
            <div>
              <strong>{p?.title || "Listing unavailable"}</strong>
              <span className={"request-status status-" + accessStatus(r)}>
                {accessStatus(r)}
              </span>
            </div>
            <p>
              {r.source === "ig" ? "Instagram link" : "CentoMeter"} ·{" "}
              {new Date(r.createdAt).toLocaleDateString("en-IN")}
            </p>
            {r.expiresAt && (
              <small>
                Access ends {new Date(r.expiresAt).toLocaleString("en-IN")}
              </small>
            )}
            {p && (
              <button className="secondary" onClick={() => onOpen(p)}>
                View listing
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}
export function AgentInbox({ agent, requests, items, onDecide }) {
  const [expiry, setExpiry] = useState("24");
  const inbox = requests.filter((r) => r.agentId === agent.id);
  return (
    <section className="agent-inbox">
      <h3>Location inbox</h3>
      <p className="fine-print">
        Demo agent controls · no authenticated account
      </p>
      <label>
        Approval expires
        <select value={expiry} onChange={(e) => setExpiry(e.target.value)}>
          <option value="24">After 24 hours</option>
          <option value="168">After 7 days</option>
          <option value="">No expiry</option>
        </select>
      </label>
      {!inbox.length && <p>No requests for this agent.</p>}
      {inbox.map((r) => (
        <article className="request-card" key={r.id}>
          <strong>
            {items.find((p) => p.id === r.propertyId)?.title ||
              "Listing unavailable"}
          </strong>
          <p>
            {r.name} · {r.phone}
          </p>
          <small>
            Source: {r.source === "ig" ? "Instagram" : "CentoMeter"}
          </small>
          <span className={"request-status status-" + accessStatus(r)}>
            {accessStatus(r)}
          </span>
          <div className="request-actions">
            <button
              className="primary"
              onClick={() =>
                onDecide(
                  r.id,
                  "approved",
                  expiry
                    ? new Date(
                        Date.now() + Number(expiry) * 3600000,
                      ).toISOString()
                    : null,
                )
              }
            >
              <Check size={16} />
              Approve
            </button>
            <button
              className="secondary"
              onClick={() => onDecide(r.id, "declined", null)}
            >
              Decline / revoke
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
function AgentLink({ agent, onNotice }) {
  const link =
    location.origin + location.pathname + "?src=ig#agent/" + agent.handle;
  const qr = useMemo(() => {
    try {
      return qrMatrix(link);
    } catch {
      return null;
    }
  }, [link]);
  return (
    <div className="agent-link">
      <button
        className="secondary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link);
            onNotice("Agent link copied");
          } catch {
            onNotice("Copy this link: " + link);
          }
        }}
      >
        <Copy size={17} />
        Copy my link
      </button>
      {qr ? (
        <svg
          role="img"
          aria-label={"QR code for " + agent.name}
          viewBox="-4 -4 45 45"
          width="132"
          height="132"
          shapeRendering="crispEdges"
        >
          <rect x="-4" y="-4" width="45" height="45" fill="white" />
          {qr.flatMap((row, y) =>
            row.map((dark, x) =>
              dark ? (
                <rect
                  key={x + "," + y}
                  x={x}
                  y={y}
                  width="1"
                  height="1"
                  fill="#18181B"
                />
              ) : null,
            ),
          )}
        </svg>
      ) : (
        <p>Use the copy link button for this URL.</p>
      )}
      <small>Instagram lead link · QR generated on this device</small>
    </div>
  );
}
export function AgentPage({
  handle,
  city,
  items,
  renderCard,
  onNavigate,
  onPost,
  requests,
  onDecide,
  onNotice,
}) {
  const [tab, setTab] = useState("listings");
  const [dashboard, setDashboard] = useState(false);
  const [demoId, setDemoId] = useState("a1");
  const agent = agents.find((a) => a.handle === handle);
  const demo = agents.find((a) => a.id === demoId);
  const own = items.filter((p) => p.agentId === agent?.id);
  return (
    <section className="page agent-page">
      {!handle ? (
        <>
          <div className="page-intro">
            <h1>Agents</h1>
            <p>Meet local experts. Discover their featured listings.</p>
          </div>
          <div className="creator-row" aria-label="Property agents">
            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => onNavigate("agent/" + a.handle)}
              >
                <img src={a.avatar} alt="" />
                <strong>{a.name}</strong>
                <small>{a.city}</small>
              </button>
            ))}
          </div>
          <h2>Featured listings</h2>
          <div className="property-grid">
            {items
              .filter((p) => p.agentId && p.city === city)
              .slice(0, 6)
              .map((p) => renderCard(p))}
          </div>
          <button
            className="secondary agent-dashboard-toggle"
            onClick={() => setDashboard((v) => !v)}
            aria-expanded={dashboard}
          >
            <UsersRound size={17} />
            Demo agent dashboard
          </button>
          {dashboard && (
            <div className="agent-dashboard">
              <h2>Agent dashboard</h2>
              <label>
                Demo agent
                <select
                  value={demoId}
                  onChange={(e) => setDemoId(e.target.value)}
                >
                  {agents.map((a) => (
                    <option value={a.id} key={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="primary" onClick={() => onPost(demo)}>
                <Plus size={18} />
                Add listing
              </button>
              <AgentLink agent={demo} onNotice={onNotice} />
              <AgentInbox
                agent={demo}
                requests={requests}
                items={items}
                onDecide={onDecide}
              />
            </div>
          )}
        </>
      ) : agent ? (
        <>
          <div className="agent-profile-heading">
            <img src={agent.avatar} alt="" />
            <div>
              <h1>{agent.name}</h1>
              <p>
                <MapPin size={14} />
                {agent.city}
              </p>
              <a
                href={agent.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={16} />
                Instagram
              </a>
            </div>
          </div>
          <div
            className="agent-profile-tabs"
            role="tablist"
            aria-label="Agent profile"
          >
            {["listings", "about"].map((t) => (
              <button
                role="tab"
                aria-selected={tab === t}
                key={t}
                onClick={() => setTab(t)}
              >
                {t === "listings" ? "Listings" : "About"}
              </button>
            ))}
          </div>
          {tab === "listings" ? (
            <div className="property-grid">{own.map((p) => renderCard(p))}</div>
          ) : (
            <div className="agent-about">
              <h2>About {agent.name}</h2>
              <p>{agent.bio}</p>
              <p>Precise locations are shared only with agent approval.</p>
            </div>
          )}
        </>
      ) : (
        <>
          <h1>Agent not found</h1>
          <button className="primary" onClick={() => onNavigate("agent")}>
            Browse agents
          </button>
        </>
      )}
    </section>
  );
}
