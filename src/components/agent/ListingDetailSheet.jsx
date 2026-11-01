import React, { useState, useEffect } from "react";
import L from "leaflet";
import { useRef } from "react";
import { money, hasValue, emiPayment } from "../../PropertyModel";
import { landArea, landDimensions } from "../../LandMeasurements";
import { approvalLabels } from "../../PlotUI";
import { EmiCalculator } from "../../PropertyExtras";
import { visitDates } from "../../JourneyUX";
import { getExactLocation, accessStatus } from "../../lib/locationAccess";
import {
  useAgentStore,
  viewerId,
  toggleStore,
  updateStore,
  requestVisit,
  notifyAgent,
} from "../../lib/agentStore";
import RequestLocationSheet from "./RequestLocationSheet";
import {
  listings as relatedListings,
  agents as relatedAgents,
  statusLabel,
} from "../../lib/agents";
import { shareAgentLink } from "../../pages/AgentProfile";
export function UnlockedMap({ point }) {
  const host = useRef(null);
  useEffect(() => {
    if (!point) return;
    const map = L.map(host.current, { scrollWheelZoom: false }).setView(
      point,
      15,
    );
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    L.marker(point).addTo(map);
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(host.current);
    return () => {
      resize.disconnect();
      map.remove();
    };
  }, [point?.[0], point?.[1]]);
  return (
    <div
      className="agent-location-map"
      ref={host}
      aria-label="Approved property location"
    />
  );
}
export default function ListingDetailSheet({
  p,
  agent: a,
  Modal,
  onClose,
  source,
  onRelated,
}) {
  const s = useAgentStore();
  const [request, setRequest] = useState(false),
    [report, setReport] = useState(false),
    [visit, setVisit] = useState(false),
    [emi, setEmi] = useState(false);
  const [, tick] = useState(0);
  const [visitError, setVisitError] = useState("");
  const photos = Array.isArray(p.photos) ? p.photos : [];
  const [photo, setPhoto] = useState(0);
  const [zoom, setZoom] = useState(false);
  useEffect(() => setPhoto(0), [p.id]);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);
  const point = getExactLocation(p.id, viewerId);
  const req = s.requests.find(
    (r) => r.propertyId === p.id && r.viewerId === viewerId,
  );
  const state = accessStatus(req);
  const link =
    location.origin +
    location.pathname +
    "#agent/" +
    a.handle +
    "?l=" +
    p.id +
    "&src=share";
  const facts = [
    ["Type", p.type],
    ["Beds", p.beds],
    ["Baths", p.baths],
    ["Area", p.type === "Land" ? landArea(p.area) : p.area + " sq ft"],
    ["Dimensions", p.type === "Land" ? landDimensions(p) : null],
    ...[
      ["carpetArea", "Carpet area", " sq ft"],
      ["superArea", "Super built-up area", " sq ft"],
      ["roadWidth", "Road width", " ft"],
      ["frontage", "Frontage", " ft"],
      ["floor", "Floor", ""],
      ["totalFloors", "Total floors", ""],
      [
        "propertyAge",
        "Property age",
        Number(p.propertyAge) === 1 ? " year" : " years",
      ],
      ["possessionStatus", "Possession", ""],
      ["furnishing", "Furnishing", ""],
      ["parking", "Parking", ""],
      ["ownershipType", "Ownership", ""],
      ["facing", "Facing", ""],
      ["available", "Availability", ""],
    ]
      .filter(([key]) => hasValue(p[key]))
      .map(([key, label, unit]) => [
        label,
        unit && /^\d+(\.\d+)?$/.test(String(p[key])) ? p[key] + unit : p[key],
      ]),
    ["Status", statusLabel(p.status)],
  ].filter(([, v]) => hasValue(v));
  return (
    <Modal title={p.title} onClose={onClose} historyManaged>
      <article className="agent-detail">
        <div
          className="agent-photo-strip"
          onScroll={(e) =>
            setPhoto(
              Math.round(
                e.currentTarget.scrollLeft / e.currentTarget.clientWidth,
              ),
            )
          }
          tabIndex="0"
          onKeyDown={(e) => {
            if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
              e.preventDefault();
              e.currentTarget.scrollBy({
                left:
                  e.currentTarget.clientWidth *
                  (e.key === "ArrowRight" ? 1 : -1),
                behavior: "smooth",
              });
            }
          }}
        >
          {!photos.length && (
            <div
              className="agent-photo-placeholder"
              role="img"
              aria-label="No property photos"
            >
              No photos available
            </div>
          )}
          {photos.map((url, i) => (
            <img
              key={url + i}
              src={url}
              width="800"
              height="500"
              decoding="async"
              alt={p.title + " photo " + (i + 1)}
            />
          ))}
        </div>
        <p>
          {photos.length
            ? `${Math.min(photo + 1, photos.length)}/${photos.length}`
            : "No photos available"}
        </p>
        <button
          className="secondary"
          disabled={!photos.length}
          onClick={() => setZoom(true)}
        >
          View photo full screen
        </button>
        <h2>
          {money(p.price)}
          {p.mode === "RENT" ? "/mo" : ""}
        </h2>
        <p>
          {money(p.price / p.area)} / sq ft · {p.locality}
        </p>
        {p.mode === "BUY" ? (
          <>
            <button className="secondary" onClick={() => setEmi((v) => !v)}>
              From {money(emiPayment(p.price * 0.8, 9, 20))}/mo · EMI
              <small>20% down payment · 9% annual interest · 20 years</small>
            </button>
            {emi && <EmiCalculator p={p} />}
          </>
        ) : (
          <dl>
            {["deposit", "maintenance", "brokerage"]
              .filter((k) => hasValue(p[k]))
              .map((k) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{money(p[k])}</dd>
                </div>
              ))}
          </dl>
        )}
        <h3>Key facts</h3>
        <dl className="agent-facts">
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <h3>Legal & trust</h3>
        {p.reraNo && (
          <p>
            RERA: {p.reraNo}
            <button onClick={() => navigator.clipboard?.writeText(p.reraNo)}>
              Copy
            </button>
          </p>
        )}
        {approvalLabels(p).map((x) => (
          <span className="pill" key={x}>
            {x}
          </span>
        ))}
        <p>
          Confirmed available:{" "}
          {new Date(p.confirmedAt).toLocaleDateString("en-IN")}.{" "}
          {Date.now() - Date.parse(p.confirmedAt) > 14 * 86400000
            ? "Not recently confirmed"
            : ""}
        </p>
        <ul>
          {p.highlights.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <h3>Amenities</h3>
        <div className="chips">
          {p.amenities.map((x) => (
            <span className="pill" key={x}>
              {x}
            </span>
          ))}
        </div>
        <details open>
          <summary>Description</summary>
          <p>{p.description}</p>
        </details>
        {p.floorPlanUrl && (
          <a href={p.floorPlanUrl} target="_blank" rel="noopener noreferrer">
            Floor plan
          </a>
        )}
        {p.videoUrl && (
          <a href={p.videoUrl} target="_blank" rel="noopener noreferrer">
            Watch video
          </a>
        )}
        <section className={"location-gate " + (point ? "is-unlocked" : "")}>
          <h3>{point ? "🔓 Location unlocked" : "🔒 Location on request"}</h3>
          <p role="status">
            {state === "unrequested"
              ? "Request the exact location"
              : statusLabel(state)}
          </p>
          {point ? (
            <>
              <UnlockedMap point={point} />
              <p>
                {p.locality}, {p.city}
              </p>
            </>
          ) : (
            <p>
              {p.locality}, {p.city}. Neighbourhood details are public; the
              exact spot is private.
            </p>
          )}
        </section>
        <section>
          <h3>Similar from this agent</h3>
          {relatedListings
            .filter(
              (x) =>
                x.id !== p.id && x.agentId === p.agentId && x.type === p.type,
            )
            .slice(0, 3)
            .map((x) => (
              <button
                className="secondary"
                key={x.id}
                onClick={() => onRelated?.(x)}
              >
                {x.title}
              </button>
            ))}
          <h3>More in {p.locality}</h3>
          {relatedListings
            .filter(
              (x) =>
                x.id !== p.id && x.locality === p.locality && x.city === p.city,
            )
            .slice(0, 3)
            .map((x) => (
              <button
                className="secondary"
                key={x.id}
                onClick={() => onRelated?.(x)}
              >
                {x.title} ·{" "}
                {relatedAgents.find((a) => a.id === x.agentId)?.name}
              </button>
            ))}
        </section>
        <button className="text-button" onClick={() => setReport(true)}>
          Report this listing
        </button>
        <div className="agent-detail-actions">
          <>
            {point ? (
              <a
                className="primary"
                href={
                  "https://www.google.com/maps/dir/?api=1&destination=" +
                  point.join(",")
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                Get directions
              </a>
            ) : (
              <button
                className="primary"
                disabled={state === "requested"}
                onClick={() => setRequest(true)}
              >
                {state === "requested" ? "Requested" : "Request location"}
              </button>
            )}
          </>
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
                "Hello, I am interested in " + p.title + " on CentoMeter.",
              )
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
          <button className="secondary" onClick={() => setVisit(true)}>
            Site visit
          </button>
          <button
            className="secondary"
            onClick={() => toggleStore("saved", p.id)}
          >
            {s.saved.includes(p.id) ? "Saved" : "Save"}
          </button>
          <button
            className="secondary"
            onClick={() => shareAgentLink(link, p.title)}
          >
            Share
          </button>
        </div>
      </article>
      {zoom && (
        <Modal title="Photo viewer" onClose={() => setZoom(false)}>
          <img className="agent-full-photo" src={photos[photo]} alt={p.title} />
        </Modal>
      )}
      {request && (
        <RequestLocationSheet
          p={p}
          agent={a}
          source={source}
          Modal={Modal}
          onClose={() => setRequest(false)}
        />
      )}{" "}
      {report && (
        <Modal title="Report listing" onClose={() => setReport(false)}>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              updateStore((s) => ({
                ...s,
                reports: [
                  ...s.reports,
                  {
                    listingId: p.id,
                    reason: new FormData(e.currentTarget).get("reason"),
                    at: new Date().toISOString(),
                  },
                ],
              }));
              notifyAgent("Report saved locally.");
              setReport(false);
            }}
          >
            <label>
              Reason
              <select name="reason">
                <option>Incorrect details</option>
                <option>Unavailable</option>
                <option>Suspicious listing</option>
              </select>
            </label>
            <button className="primary">Save report locally</button>
          </form>
        </Modal>
      )}
      {visit && (
        <Modal title="Request site visit" onClose={() => setVisit(false)}>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              try {
                requestVisit(
                  p,
                  { name: form.get("name"), phone: form.get("phone") },
                  form.get("date"),
                );
                setVisit(false);
                setVisitError("");
              } catch (error) {
                setVisitError(error.message);
              }
            }}
          >
            <label>
              Name
              <input name="name" required autoComplete="name" maxLength="80" />
            </label>
            <label>
              Indian mobile
              <input
                name="phone"
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
            {visitError && <p role="alert">{visitError}</p>}
            <label>
              Visit date
              <select name="date">
                {visitDates().map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <p>Preview only. No appointment is booked.</p>
            <button className="primary">Save visit request</button>
          </form>
        </Modal>
      )}
    </Modal>
  );
}
