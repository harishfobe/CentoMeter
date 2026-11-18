import React, { useState } from "react";
import { ArrowLeft, Link2, MapPin, Plus } from "lucide-react";
import CopyButton from "../components/CopyButton";
import QRCode from "../components/agent/QRCode";
import {
  decideRequest,
  decideVisit,
  updateStore,
  useAgentStore,
} from "../lib/agentStore";
import { accessStatus } from "../lib/locationAccess";
import { agents, listings, mergeListings, responseLabel } from "../lib/agents";
import { money } from "../PropertyModel";

const TABS = ["Requests", "Listings", "Link & insights"];
const REQUEST_STATUSES = [
  "requested",
  "approved",
  "accepted",
  "declined",
  "expired",
  "revoked",
];
const LISTING_STATUSES = ["available", "under-offer", "sold", "rented"];

function titleCase(value) {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function sourceLabel(source) {
  if (source === "ig") return "Instagram";
  if (source === "share") return "Share";
  if (source === "direct") return "Direct";
  return source || "Direct";
}

function agentForProfile(profile) {
  const name = String(profile?.name || "").trim().toLowerCase();
  const local = String(profile?.email || "")
    .split("@")[0]
    .trim()
    .toLowerCase();
  return (
    agents.find((agent) => agent.name.toLowerCase() === name) ||
    agents.find((agent) => agent.handle.toLowerCase() === local) ||
    agents[0]
  );
}

export default function AgentDashboard({ onPost, onNavigate, profile }) {
  const s = useAgentStore();
  const a = agentForProfile(profile);
  const id = a.id;
  const [tab, setTab] = useState("Requests");
  const [filter, setFilter] = useState("requested");
  const [query, setQuery] = useState("");
  const [expiry, setExpiry] = useState(24);
  const [copyStatus, setCopyStatus] = useState(null);
  const own = mergeListings(listings, s.customListings || []).filter(
    (p) => p.agentId === id,
  );
  const requests = s.requests.filter((r) => r.agentId === id);
  const visits = s.visits.filter((v) => v.agentId === id);
  const samples = requests
    .filter((r) => r.repliedAt)
    .map((r) => (Date.parse(r.repliedAt) - Date.parse(r.createdAt)) / 60000)
    .sort((left, right) => left - right);
  const median = samples.length
    ? (samples[Math.floor((samples.length - 1) / 2)] +
        samples[Math.floor(samples.length / 2)]) /
      2
    : null;
  const link =
    location.origin + location.pathname + "#agent/" + a.handle + "?src=ig";
  const waiting =
    requests.filter((r) => accessStatus(r) === "requested").length +
    visits.filter((v) => v.status === "requested").length;
  const live = own.filter(
    (p) => !["sold", "rented"].includes(s.overrides[p.id]?.status || p.status),
  ).length;
  const views = s.events.filter(
    (e) => e.kind === "views" && e.agentId === id,
  ).length;
  const saves = s.events.filter(
    (e) => e.kind === "saves" && e.agentId === id,
  ).length;
  const approvals = requests.filter((r) => r.status === "approved").length;
  const reply = responseLabel(a);
  const needle = query.toLowerCase();
  const shownVisits = visits.filter(
    (v) => v.status === filter && v.buyer.name.toLowerCase().includes(needle),
  );
  const shownRequests = requests.filter(
    (r) =>
      accessStatus(r) === filter &&
      r.buyer.name.toLowerCase().includes(needle),
  );
  const alter = (p, patch) =>
    updateStore((store) => ({
      ...store,
      overrides: {
        ...store.overrides,
        [p.id]: { ...store.overrides[p.id], ...patch },
      },
    }));

  return (
    <section className="page agent-feature agent-desk">
      <header className="desk-hero">
        <button
          type="button"
          className="desk-back"
          onClick={() => onNavigate("profile")}
        >
          <ArrowLeft size={18} aria-hidden="true" /> Back to profile
        </button>
        <div className="desk-id">
          <img src={profile?.photo || a.avatar} alt="" width="52" height="52" />
          <div>
            <p>Agent dashboard</p>
            <h1>{a.name}</h1>
            <span>
              <MapPin size={14} aria-hidden="true" /> {a.city}
              {reply ? " · " + reply.replace("Usually replies in ", "Replies in ") : ""}
            </span>
          </div>
        </div>
      </header>

      <div className="desk-metrics" aria-label="Inbox summary">
        <div>
          <strong>{waiting}</strong>
          <span>Waiting</span>
        </div>
        <div>
          <strong>{live}</strong>
          <span>Live</span>
        </div>
        <div>
          <strong>{views}</strong>
          <span>Views</span>
        </div>
        <div>
          <strong>{approvals}</strong>
          <span>Approved</span>
        </div>
      </div>

      <div className="desk-tabs" role="tablist" aria-label="Agent dashboard">
        {TABS.map((name) => (
          <button
            key={name}
            role="tab"
            aria-selected={name === tab}
            onClick={() => setTab(name)}
          >
            {name}
            {name === "Requests" ? ` (${waiting})` : ""}
          </button>
        ))}
      </div>

      {tab === "Requests" && (
        <div className="desk-panel">
          <div className="desk-filters">
            <input
              aria-label="Search buyer"
              value={query}
              placeholder="Buyer name"
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              aria-label="Request status"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {REQUEST_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {titleCase(status)}
                </option>
              ))}
            </select>
            <select
              aria-label="Approval validity"
              value={expiry}
              onChange={(e) => setExpiry(Number(e.target.value))}
            >
              {[
                [24, "24 hours"],
                [168, "7 days"],
                [720, "30 days"],
                [0, "No expiry"],
              ].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {shownVisits.length === 0 && shownRequests.length === 0 && (
            <p className="desk-empty">
              No {filter} visits or location requests for this search.
            </p>
          )}

          {shownVisits.map((v) => (
            <article className="request-card desk-card" key={v.id}>
              <div className="desk-card-top">
                <h2>
                  Site visit · {own.find((p) => p.id === v.propertyId)?.title}
                </h2>
                <span className={"request-status status-" + v.status}>
                  {titleCase(v.status)}
                </span>
              </div>
              <p>
                {v.buyer.name} · {v.buyer.phone}
              </p>
              <p className="desk-quiet">
                {v.date} · {v.status}
              </p>
              <div className="action-row">
                <button
                  className="primary"
                  onClick={() => decideVisit(v.id, "accepted")}
                >
                  Accept
                </button>
                <button
                  className="secondary"
                  onClick={() => decideVisit(v.id, "declined")}
                >
                  Decline
                </button>
              </div>
            </article>
          ))}

          {shownRequests.map((r) => {
            const status = accessStatus(r);
            return (
              <article className="request-card desk-card" key={r.id}>
                <div className="desk-card-top">
                  <h2>
                    {own.find((p) => p.id === r.propertyId)?.title || "Listing"}
                  </h2>
                  <span className={"request-status status-" + status}>
                    {titleCase(status)}
                  </span>
                </div>
                <p>
                  {r.buyer.name} ·{" "}
                  {status === "approved"
                    ? r.buyer.phone
                    : "••••••" + r.buyer.phone.slice(-4)}
                </p>
                <p className="desk-quiet">
                  Budget: {r.buyer.budget || "Not specified"} · {r.buyer.timeline}
                </p>
                <p className="desk-quiet">Source: {sourceLabel(r.source)}</p>
                <div className="action-row">
                  <button
                    className="primary"
                    onClick={() => decideRequest(r.id, "approved", expiry)}
                  >
                    Approve
                  </button>
                  <button
                    className="secondary"
                    onClick={() => decideRequest(r.id, "declined", 0)}
                  >
                    Decline
                  </button>
                  <button
                    className="secondary"
                    onClick={() => decideRequest(r.id, "revoked", 0)}
                  >
                    Revoke
                  </button>
                  <button
                    className="secondary"
                    onClick={() =>
                      requests
                        .filter(
                          (x) =>
                            x.viewerId === r.viewerId &&
                            accessStatus(x) === "requested",
                        )
                        .forEach((x) => decideRequest(x.id, "approved", expiry))
                    }
                  >
                    Approve all from buyer
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {tab === "Listings" && (
        <div className="desk-panel">
          <button className="primary desk-add" onClick={() => onPost(a)}>
            <Plus size={18} aria-hidden="true" /> Add listing
          </button>
          {own.length === 0 && (
            <p className="desk-empty">No listings for this agent yet.</p>
          )}
          {own.map((p) => {
            const status = s.overrides[p.id]?.status || p.status;
            return (
              <article className="request-card desk-card" key={p.id}>
                <div className="desk-card-top">
                  <h2>{p.title}</h2>
                  <span className="desk-price">{money(p.price)}</span>
                </div>
                <p className="desk-quiet">
                  {p.locality}, {p.city} · {p.mode === "RENT" ? "Rent" : "Buy"} ·{" "}
                  {p.type}
                </p>
                <label>
                  Status
                  <select
                    aria-label={"Status for " + p.title}
                    value={status}
                    onChange={(e) => alter(p, { status: e.target.value })}
                  >
                    {LISTING_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {titleCase(value)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="action-row desk-stack">
                  <button
                    className="secondary"
                    onClick={() =>
                      alter(p, { confirmedAt: new Date().toISOString() })
                    }
                  >
                    Confirm still available
                  </button>
                  <button
                    className="secondary"
                    onClick={() =>
                      onNavigate("agent/" + a.handle + "?l=" + p.id)
                    }
                  >
                    Preview listing
                  </button>
                  <button
                    className="secondary"
                    onClick={() =>
                      onPost(a, {
                        ...p,
                        intent: p.mode === "RENT" ? "RENT" : "SELL",
                        shareDefault: p.privacy,
                        location: null,
                      })
                    }
                  >
                    Edit listing · place pin again
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {tab === "Link & insights" && (
        <div className="desk-panel">
          <article className="request-card desk-card desk-link">
            <div className="desk-card-top">
              <h2>
                <Link2 size={18} aria-hidden="true" /> Your link
              </h2>
            </div>
            <CopyButton
              className="primary"
              value={link}
              onResult={(ok) =>
                setCopyStatus({
                  value: link,
                  text: ok
                    ? "Link copied"
                    : "Copy failed. Select and copy this link: " + link,
                })
              }
            >
              Copy my link
            </CopyButton>
            <p role="status">
              {copyStatus?.value === link ? copyStatus.text : link}
            </p>
            <div className="desk-qr">
              <QRCode value={link} />
            </div>
            <button
              className="secondary"
              onClick={() => onNavigate("agent/" + a.handle)}
            >
              Preview as a buyer
            </button>
          </article>

          <article className="request-card desk-card">
            <h2>Local insights</h2>
            <div className="desk-funnel" aria-label="From view to approval">
              <div>
                <strong>{views}</strong>
                <span>Views</span>
              </div>
              <div>
                <strong>{saves}</strong>
                <span>Saves</span>
              </div>
              <div>
                <strong>{requests.length}</strong>
                <span>Requests</span>
              </div>
              <div>
                <strong>{approvals}</strong>
                <span>Approved</span>
              </div>
            </div>
            <p className="desk-quiet">
              Median reply:{" "}
              {median == null ? "No replies yet" : Math.round(median) + " min"}
              {reply ? " · " + reply : ""}
            </p>
            <p className="desk-quiet">
              Approval rate:{" "}
              {requests.length
                ? Math.round((approvals / requests.length) * 100)
                : 0}
              %
            </p>
            <ul className="desk-sources">
              {["ig", "direct", "share"].map((source) => (
                <li key={source}>
                  <span>{sourceLabel(source)}</span>
                  <strong>
                    {requests.filter((r) => r.source === source).length}
                  </strong>
                </li>
              ))}
            </ul>
          </article>
          <p className="fine-print">Local device counters only</p>
        </div>
      )}
    </section>
  );
}
