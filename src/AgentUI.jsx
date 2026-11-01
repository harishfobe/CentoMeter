import React, { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { indianMobile } from "./PropertyModel";
import {
  accessStatus,
  isLocationLocked,
  requestFor,
} from "./lib/locationAccess";
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
