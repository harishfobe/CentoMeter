import React from "react";
import {
  configurationLabel,
  areaWithBasis,
  furnishingLabel,
  availabilityLine,
} from "../listingPresentation";
import { hasValue } from "../PropertyModel";

/** Four-item mobile detail summary: config, area, furnishing/condition, availability. */
export default function DetailSummaryStrip({ p }) {
  if (!p) return null;
  const furnishing = furnishingLabel(p);
  const condition = hasValue(p.condition) ? String(p.condition).trim() : null;
  const items = [
    {
      label: p.type === "PG" ? "Occupancy" : "Configuration",
      value: configurationLabel(p),
    },
    { label: "Area", value: areaWithBasis(p) },
    {
      label: furnishing ? "Furnishing" : condition ? "Condition" : "Furnishing",
      value: furnishing || condition,
    },
    {
      label: p.mode === "RENT" ? "Availability" : "Possession",
      value: availabilityLine(p),
    },
  ].filter((item) => item.value);
  if (!items.length) return null;
  return (
    <dl className="detail-summary-strip" aria-label="Property summary">
      {items.slice(0, 4).map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
