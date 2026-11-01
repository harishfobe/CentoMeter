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
import { hasValue } from "./PropertyModel";
export {
  SQFT_PER_CENT,
  toCents,
  toSqft,
  landNumber,
  landArea,
  landDimensions,
} from "./LandMeasurements";

export function ApprovalBadges({ p }) {
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
export function landHighlights(p) {
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

export function LandSummary({ p }) {
  const highlights = landHighlights(p);
  const status = plotStatus(p);
  return (
    <section className="land-summary" aria-label="Property description">
      <div className="land-summary-heading">
        <h2>Property description</h2>
        {status && <span className={"plot-status " + status}>{status}</span>}
      </div>
      {p.description?.trim() && (
        <p className="description land-description">{p.description}</p>
      )}
      <dl className="land-facts">
        <div>
          <dt>Plot area</dt>
          <dd>
            {positive(p.area) ? `${landNumber(p.area)} sq ft` : "Not specified"}
            {positive(p.area) && (
              <small>{landNumber(toCents(p.area))} cents</small>
            )}
          </dd>
        </div>
        {positive(p.length) && positive(p.width) && (
          <div>
            <dt>Dimensions</dt>
            <dd>
              {landDimensions(p)}
              <small>Length × Width</small>
            </dd>
          </div>
        )}
        {hasValue(p.landType || p.subtype) && (
          <div>
            <dt>Land type</dt>
            <dd>{p.landType || p.subtype}</dd>
          </div>
        )}
        {hasValue(p.facing) && (
          <div>
            <dt>Facing</dt>
            <dd>{p.facing}</dd>
          </div>
        )}
        {hasValue(p.roadWidth) && (
          <div>
            <dt>Road width</dt>
            <dd>{p.roadWidth}</dd>
          </div>
        )}
      </dl>
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
