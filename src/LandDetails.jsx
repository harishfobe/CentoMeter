import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  positive,
  landNumber,
  landDimensions,
  toCents,
  toSqft,
} from "./LandMeasurements";
import { approvalLabels, plotStatus } from "./PlotUI";
import { hasValue } from "./PropertyModel";
export { toCents, landNumber, landArea } from "./LandMeasurements";

function featurePool(p) {
  const highlights = Array.isArray(p.highlights)
    ? p.highlights
    : typeof p.highlights === "string"
      ? p.highlights.split("\n")
      : [];
  return [
    ...(Array.isArray(p.features) ? p.features : []),
    ...(Array.isArray(p.amenities) ? p.amenities : []),
    ...highlights,
    ...(p.highlightNotes || "").split("\n"),
    p.tag,
    p.water,
    p.electricity,
  ]
    .filter((x) => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean);
}

function findFeature(pool, ...patterns) {
  return pool.find((value) =>
    patterns.some((pattern) => new RegExp(pattern, "i").test(value)),
  );
}

function formatRoadWidth(value) {
  if (!hasValue(value)) return null;
  const text = String(value).trim();
  return /^\d+(\.\d+)?$/.test(text) ? `${text} ft` : text;
}

function isCornerPlot(pool) {
  return pool.some((value) => /corner\s*plot/i.test(value));
}

function waterValue(p, pool) {
  if (hasValue(p.water)) return String(p.water).trim();
  const hit = findFeature(pool, "borewell", "water\\s*connection", "^water$");
  if (!hit) return null;
  if (/borewell/i.test(hit)) return "Borewell";
  if (/water/i.test(hit)) return "Water connection";
  return hit;
}

function electricityValue(p, pool) {
  if (hasValue(p.electricity)) return String(p.electricity).trim();
  const hit = findFeature(pool, "electricity");
  if (!hit) return null;
  return /available|connection/i.test(hit) ? "Available" : hit;
}

function negotiableValue(p, pool) {
  if (p.negotiable === true) return "Yes";
  if (p.negotiable === false) return "No";
  if (/^yes$/i.test(String(p.negotiable || "").trim())) return "Yes";
  if (/^no$/i.test(String(p.negotiable || "").trim())) return "No";
  if (pool.some((value) => /negotiable/i.test(value))) return "Yes";
  return null;
}

function claimedApprovals(p) {
  return approvalLabels(p).map((label) =>
    label.replace(/\s+Approved$/i, " approval claimed"),
  );
}

function landHighlightPills(p, pool, water, electricity) {
  const pills = [];
  const push = (label) => {
    if (
      label &&
      !pills.some((item) => item.toLowerCase() === label.toLowerCase())
    ) {
      pills.push(label);
    }
  };
  if (isCornerPlot(pool)) push("Corner plot");
  if (water) push(/borewell/i.test(water) ? "Borewell" : water);
  if (electricity) push("Electricity");
  for (const value of pool) {
    if (
      /illustrative|flexible visit|good access to local|clear property|visits by appointment|negotiable|dtcp|rera|road access|corner|borewell|water|electricity|^available$|^yes$|^no$/i.test(
        value,
      )
    ) {
      continue;
    }
    if (value.length > 28) continue;
    push(value);
  }
  return pills;
}

function formatLandDate(value) {
  const date = Date.parse(value || "");
  if (!Number.isFinite(date)) return null;
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SnapshotCards({ items }) {
  const visible = items.filter((item) => item && hasValue(item.value));
  if (!visible.length) return null;
  return (
    <dl className="land-snapshot" aria-label="Key plot facts">
      {visible.map(({ label, value }) => (
        <div key={label}>
          <dd>{value}</dd>
          <dt>{label}</dt>
        </div>
      ))}
    </dl>
  );
}

function ApprovalBanner({ p }) {
  const claims = claimedApprovals(p);
  if (!claims.length) return null;
  return (
    <div className="land-approval-banner" role="note">
      {claims.map((claim) => (
        <div key={claim} className="land-approval-banner-item">
          <CheckCircle2 size={18} aria-hidden="true" />
          <div>
            <strong>{claim}</strong>
            <p>
              Approval information is provided by the seller and has not been
              independently verified by CentoMeter.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailsList({ items }) {
  const visible = items.filter((item) => item && hasValue(item.value));
  if (!visible.length) return null;
  return (
    <dl className="land-details-list">
      {visible.map(({ label, value }) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function LandSummary({
  p,
  onReport = null,
  showDescription = true,
  showStatus = true,
}) {
  const pool = featurePool(p);
  const status = plotStatus(p);
  const roadWidth = formatRoadWidth(p.roadWidth);
  const dimensions =
    positive(p.length) && positive(p.width) ? landDimensions(p) : null;
  const plotArea = positive(p.area) ? `${landNumber(p.area)} sqft` : null;
  const equivalentArea = positive(p.area)
    ? `${landNumber(toCents(p.area))} Cent`
    : null;
  const water = waterValue(p, pool);
  const electricity = electricityValue(p, pool);
  const negotiable = negotiableValue(p, pool);
  const approvals = approvalLabels(p);
  const highlights = landHighlightPills(p, pool, water, electricity);
  const posted = formatLandDate(p.postedAt || p.createdAt);
  const checked = formatLandDate(p.confirmedAt || p.postedAt || p.createdAt);
  const snapshot = [
    { label: "Plot area", value: plotArea },
    { label: "Dimensions", value: dimensions },
    { label: "Facing", value: p.facing || null },
    { label: "Road width", value: roadWidth },
  ];
  const detailRows = [
    { label: "Plot area", value: plotArea },
    { label: "Equivalent area", value: equivalentArea },
    { label: "Dimensions", value: dimensions },
    { label: "Facing", value: p.facing || null },
    { label: "Road width", value: roadWidth },
    { label: "Corner plot", value: isCornerPlot(pool) ? "Yes" : null },
    { label: "Water", value: water },
    { label: "Electricity", value: electricity },
    ...(approvals.length
      ? approvals.map((label) => ({
          label: label.replace(/\s+Approved$/i, " approval"),
          value: "Claimed by seller",
        }))
      : []),
    { label: "Price negotiable", value: negotiable },
  ];

  return (
    <section className="land-summary" aria-label="Property details">
      <SnapshotCards items={snapshot} />
      <ApprovalBanner p={p} />
      <div className="land-summary-heading">
        <h2>Property details</h2>
        {showStatus && status ? (
          <span className={"plot-status " + status}>{status}</span>
        ) : null}
      </div>
      {showDescription && p.description?.trim() ? (
        <p className="description land-description">{p.description}</p>
      ) : null}
      <DetailsList items={detailRows} />
      {highlights.length > 0 && (
        <div className="land-highlights">
          <h3>Highlights</h3>
          <ul>
            {highlights.map((point) => (
              <li key={point}>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="land-listing-meta">
        <span>
          Listed by {p.seller || "Owner"}
          {checked ? ` · Availability checked: ${checked}` : ""}
          {posted && !checked ? ` · Posted: ${posted}` : ""}
          {" · Sample"}
        </span>
        {typeof onReport === "function" ? (
          <button type="button" className="text-button" onClick={onReport}>
            Report listing
          </button>
        ) : null}
      </div>
    </section>
  );
}

const suggestions = [
  "Corner plot",
  "Road access",
  "Gated community",
  "Near main road",
  "Water connection",
  "Electricity connection",
];
export function LandAreaFields({ data, set }) {
  const [centInput, setCentInput] = useState(null);
  const cents = positive(data.area)
    ? String(Number(toCents(data.area).toFixed(4)))
    : "";
  return (
    <div className="form-columns land-area-fields">
      <label>
        Plot area (sq ft)
        <input
          type="number"
          min="0.01"
          step="any"
          inputMode="decimal"
          value={data.area}
          onChange={(e) => set("area", e.target.value)}
        />
      </label>
      <label>
        Plot area (cents)
        <input
          type="number"
          min="0.0001"
          step="any"
          inputMode="decimal"
          value={centInput ?? cents}
          onFocus={() => setCentInput(cents)}
          onBlur={() => setCentInput(null)}
          onChange={(e) => {
            setCentInput(e.target.value);
            set(
              "area",
              e.target.value === "" ? "" : String(toSqft(e.target.value)),
            );
          }}
        />
      </label>
    </div>
  );
}

/** Dual sq.ft / cents editor for Independent House land (stores `plotArea`). */
export function PlotLandAreaFields({ data, set }) {
  const [centInput, setCentInput] = useState(null);
  const cents = positive(data.plotArea)
    ? String(Number(toCents(data.plotArea).toFixed(4)))
    : "";
  return (
    <div className="form-columns land-area-fields">
      <label>
        Land area (sq ft)
        <input
          type="number"
          min="0.01"
          step="any"
          inputMode="decimal"
          required
          value={data.plotArea ?? ""}
          onChange={(e) => set("plotArea", e.target.value)}
        />
      </label>
      <label>
        Land area (cents)
        <input
          type="number"
          min="0.0001"
          step="any"
          inputMode="decimal"
          required
          value={centInput ?? cents}
          onFocus={() => setCentInput(cents)}
          onBlur={() => setCentInput(null)}
          onChange={(e) => {
            setCentInput(e.target.value);
            set(
              "plotArea",
              e.target.value === "" ? "" : String(toSqft(e.target.value)),
            );
          }}
        />
      </label>
    </div>
  );
}
function landFormHighlights(data) {
  const supplied = Array.isArray(data.highlights)
    ? data.highlights
    : typeof data.highlights === "string"
      ? data.highlights.split("\n")
      : data.features || [];
  const entries = [...supplied, ...(data.highlightNotes || "").split("\n")]
    .filter((x) => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean);
  return entries.filter(
    (entry, index) =>
      entries.findIndex((x) => x.toLowerCase() === entry.toLowerCase()) ===
      index,
  );
}

export function LandFields({ data, set }) {
  const highlights = Array.isArray(data.highlights)
    ? data.highlights
    : landFormHighlights(data);
  return (
    <div className="land-fields">
      <label>
        Land type
        <select
          value={data.landType || data.subtype || ""}
          onChange={(e) => set("landType", e.target.value)}
        >
          <option value="">Select type</option>
          {["Residential", "Commercial", "Agricultural"].map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </label>
      <div className="form-columns">
        <label>
          Length (ft)
          <input
            type="number"
            min="0.01"
            step="any"
            inputMode="decimal"
            value={data.length || ""}
            placeholder="Optional"
            onChange={(e) => set("length", e.target.value)}
          />
        </label>
        <label>
          Width (ft)
          <input
            type="number"
            min="0.01"
            step="any"
            inputMode="decimal"
            value={data.width || ""}
            placeholder="Optional"
            onChange={(e) => set("width", e.target.value)}
          />
        </label>
      </div>
      <fieldset className="land-highlight-options">
        <legend>
          Key highlights <small>(optional)</small>
        </legend>
        <div className="chips">
          {suggestions.map((point) => (
            <button
              type="button"
              key={point}
              className={"chip " + (highlights.includes(point) ? "active" : "")}
              aria-pressed={highlights.includes(point)}
              onClick={() =>
                set(
                  "highlights",
                  highlights.includes(point)
                    ? highlights.filter((x) => x !== point)
                    : [...highlights, point],
                )
              }
            >
              {point}
            </button>
          ))}
        </div>
      </fieldset>
      <label>
        Other highlights
        <textarea
          rows="2"
          maxLength={400}
          value={data.highlightNotes || ""}
          placeholder="One point per line"
          onChange={(e) => set("highlightNotes", e.target.value)}
        />
      </label>
    </div>
  );
}
