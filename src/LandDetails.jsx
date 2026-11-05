import React, { useState } from "react";
import { Check, CheckCircle2 } from "lucide-react";
import {
  positive,
  landNumber,
  landDimensions,
  toCents,
  toSqft,
} from "./LandMeasurements";
import { approvalLabels, plotStatus } from "./PlotUI";
import { hasValue, money } from "./PropertyModel";
export { toCents, landNumber, landArea } from "./LandMeasurements";

function ApprovalBadges({ p }) {
  const labels = approvalLabels(p);
  return (
    labels.length > 0 && (
      <div className="approval-badges" aria-label="Supplied approvals">
        {labels.map((label) => (
          <span key={label}>
            <Check size={15} aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>
    )
  );
}
function landHighlights(p) {
  const supplied = Array.isArray(p.highlights)
    ? p.highlights
    : typeof p.highlights === "string"
      ? p.highlights.split("\n")
      : p.features || [];
  const entries = [...supplied, ...(p.highlightNotes || "").split("\n")]
    .filter((x) => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean);
  return entries.filter(
    (entry, index) =>
      entries.findIndex((x) => x.toLowerCase() === entry.toLowerCase()) ===
      index,
  );
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

function FactCards({ items, className = "" }) {
  const visible = items.filter((item) => item && hasValue(item.value));
  if (!visible.length) return null;
  return (
    <dl className={"land-facts " + className}>
      {visible.map(({ label, value, hint }) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>
            {value}
            {hint ? <small>{hint}</small> : null}
          </dd>
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
  const highlights = landHighlights(p);
  const status = plotStatus(p);
  const roadWidth = hasValue(p.roadWidth)
    ? /^\d+(\.\d+)?$/.test(String(p.roadWidth).trim())
      ? `${p.roadWidth} ft`
      : p.roadWidth
    : null;
  const posted = formatLandDate(p.postedAt || p.createdAt);
  const checked = formatLandDate(p.confirmedAt || p.postedAt || p.createdAt);
  const primaryFacts = [
    {
      label: "Plot area",
      value: positive(p.area) ? `${landNumber(p.area)} sq ft` : "Not specified",
      hint: positive(p.area) ? `${landNumber(toCents(p.area))} cents` : null,
    },
    {
      label: "Land type",
      value: p.landType || p.subtype || null,
    },
    {
      label: "Facing",
      value: p.facing || null,
    },
    {
      label: "Road width",
      value: roadWidth,
    },
    ...(positive(p.length) && positive(p.width)
      ? [
          {
            label: "Dimensions",
            value: landDimensions(p),
            hint: "Length × Width",
          },
        ]
      : []),
  ];
  const secondaryFacts = [
    {
      label: "Possession",
      value: p.possessionStatus || p.available || null,
    },
    {
      label: "Ownership",
      value: p.ownershipType || null,
    },
    {
      label: "Posted",
      value: posted,
    },
    {
      label: "Price per sq ft",
      value:
        positive(p.area) && Number(p.price) > 0
          ? money(Number(p.price) / Number(p.area)) +
            (p.mode === "RENT" ? " / month" : "")
          : null,
    },
  ];
  return (
    <section className="land-summary" aria-label="Property details">
      <div className="land-summary-heading">
        <h2>Property details</h2>
        {showStatus && status ? (
          <span className={"plot-status " + status}>{status}</span>
        ) : null}
      </div>
      {showDescription && p.description?.trim() ? (
        <p className="description land-description">{p.description}</p>
      ) : null}
      <FactCards items={primaryFacts} className="land-facts-primary" />
      <ApprovalBadges p={p} />
      {highlights.length > 0 && (
        <div className="land-highlights">
          <h3>Key highlights</h3>
          <ul>
            {highlights.map((point) => (
              <li key={point}>
                <CheckCircle2 size={15} />
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
          {" · Sample"}
        </span>
        {typeof onReport === "function" ? (
          <button type="button" className="text-button" onClick={onReport}>
            Report listing
          </button>
        ) : null}
      </div>
      <FactCards items={secondaryFacts} className="land-facts-secondary" />
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
export function LandFields({ data, set }) {
  const highlights = Array.isArray(data.highlights)
    ? data.highlights
    : landHighlights(data);
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
