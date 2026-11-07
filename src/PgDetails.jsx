import React from "react";
import { CheckCircle2 } from "lucide-react";
import { hasValue, money } from "./PropertyModel";
import {
  preferredTenantLabel,
  rentAvailableFromLabel,
} from "./HouseVillaDetails";

export const PG_SERVICES = [
  "Wi-Fi",
  "Laundry",
  "CCTV",
  "Security",
  "Power backup",
  "Two-wheeler parking",
];

export const isPg = (type) => type === "PG";

export function usesPgDetailLayout(p) {
  return isPg(p?.type) && p?.mode === "RENT";
}

function featurePool(p) {
  return [
    ...(Array.isArray(p.features) ? p.features : []),
    ...(Array.isArray(p.amenities) ? p.amenities : []),
    ...(Array.isArray(p.services) ? p.services : []),
    ...(Array.isArray(p.highlights) ? p.highlights : []),
    p.tag,
  ]
    .filter((x) => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean);
}

function hasDetailValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

export function pgTypeEyebrow() {
  return "FOR RENT · PG";
}

export function pgOccupancyLabel(p) {
  if (!hasValue(p.occupancy)) return null;
  return String(p.occupancy).trim();
}

export function pgBathroomLabel(p) {
  if (!hasValue(p.bathroom)) return null;
  return String(p.bathroom).trim();
}

export function pgAcLabel(p) {
  if (!hasValue(p.ac)) return null;
  const text = String(p.ac).trim();
  if (/^(yes|true|available)$/i.test(text)) return "Yes";
  if (/^(no|false|not available)$/i.test(text)) return "No";
  return text;
}

export function pgMealsLabel(p) {
  if (!hasValue(p.meals)) return null;
  return String(p.meals).trim();
}

export function pgHousekeepingLabel(p) {
  if (hasValue(p.housekeeping)) return String(p.housekeeping).trim();
  const hit = featurePool(p).find((value) => /housekeep/i.test(value));
  return hit ? (/not\s+included/i.test(hit) ? "Not included" : "Included") : null;
}

export function pgElectricityLabel(p) {
  if (hasValue(p.electricity)) return String(p.electricity).trim();
  return null;
}

export function pgNoticePeriodLabel(p) {
  if (!hasValue(p.noticePeriod)) return null;
  return String(p.noticePeriod).trim();
}

export function pgPostedLabel(p) {
  const date = Date.parse(p.postedAt || p.createdAt || "");
  if (!Number.isFinite(date)) return null;
  return (
    "Posted " +
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  );
}

/** "Meals included" / "Meals not included" under the monthly rent. */
export function pgRentMealsLine(p) {
  const meals = pgMealsLabel(p);
  if (!meals) return null;
  if (/included/i.test(meals) && !/not\s+included/i.test(meals)) {
    return "Meals included";
  }
  if (/not\s+included/i.test(meals)) return "Meals not included";
  return meals;
}

/** "₹10,000 deposit" under the meals line. */
export function pgRentDepositLabel(p) {
  const amount = Number(p.deposit);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return `${money(amount)} deposit`;
}

/** @deprecated Prefer stacked pgRentMealsLine + pgRentDepositLabel. */
export function pgRentPriceMeta(p) {
  return (
    [pgRentMealsLine(p), pgRentDepositLabel(p)].filter(Boolean).join(" · ") ||
    null
  );
}

export function buildPgDetailRows(p) {
  return [
    { label: "Occupancy", value: pgOccupancyLabel(p) },
    { label: "Bathroom", value: pgBathroomLabel(p) },
    { label: "Air conditioning", value: pgAcLabel(p) },
    { label: "Meals", value: pgMealsLabel(p) },
    { label: "Furnishing", value: p.furnishing || null },
    { label: "Housekeeping", value: pgHousekeepingLabel(p) },
    { label: "Electricity", value: pgElectricityLabel(p) },
    { label: "Available from", value: rentAvailableFromLabel(p) },
    { label: "Preferred tenant", value: preferredTenantLabel(p) },
    { label: "Notice period", value: pgNoticePeriodLabel(p) },
  ];
}

export function pgSnapshotItems(p) {
  const occupancy = pgOccupancyLabel(p);
  const bathroom = pgBathroomLabel(p);
  const meals = pgMealsLabel(p);
  const ac = pgAcLabel(p);
  return [
    occupancy
      ? {
          value: occupancy.replace(/\s+sharing$/i, ""),
          label: /sharing/i.test(occupancy) ? "Sharing" : "Occupancy",
        }
      : null,
    bathroom
      ? {
          value: /attached/i.test(bathroom)
            ? "Attached"
            : /shared/i.test(bathroom)
              ? "Shared"
              : bathroom,
          label: "Bathroom",
        }
      : null,
    meals
      ? {
          value: /not\s+included/i.test(meals)
            ? "Not included"
            : /included/i.test(meals)
              ? "Included"
              : meals,
          label: "Meals",
        }
      : null,
    ac ? { value: ac, label: "AC" } : null,
  ].filter(Boolean);
}

export function pgHighlightPills(p) {
  if (Array.isArray(p.pgHighlights) && p.pgHighlights.length) {
    return p.pgHighlights.filter((x) => typeof x === "string");
  }
  const pills = [];
  const meals = pgMealsLabel(p);
  if (
    meals &&
    /included/i.test(meals) &&
    !/not\s+included/i.test(meals)
  ) {
    pills.push("Meals included");
  }
  const pool = featurePool(p);
  if (pool.some((x) => /wi-?fi/i.test(x))) pills.push("Wi-Fi");
  const housekeeping = pgHousekeepingLabel(p);
  if (housekeeping && /included/i.test(housekeeping)) pills.push("Housekeeping");
  const bathroom = pgBathroomLabel(p);
  if (bathroom && /attached/i.test(bathroom)) pills.push("Attached bathroom");
  if (pills.length) return pills;
  return (Array.isArray(p.highlights) ? p.highlights : [])
    .filter((x) => typeof x === "string")
    .slice(0, 4);
}

export function pgServices(p) {
  if (Array.isArray(p.services) && p.services.length) return p.services;
  if (Array.isArray(p.amenities) && p.amenities.length) {
    const known = p.amenities.filter((item) =>
      PG_SERVICES.some((service) =>
        new RegExp(service.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(
          item,
        ),
      ),
    );
    if (known.length) return known;
  }
  const pool = featurePool(p);
  return PG_SERVICES.filter((service) =>
    pool.some((value) =>
      new RegExp(service.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(
        value,
      ),
    ),
  );
}

function SnapshotCards({ items }) {
  const visible = items.filter((item) => item && hasDetailValue(item.value));
  if (!visible.length) return null;
  return (
    <dl
      className="land-snapshot house-snapshot pg-snapshot"
      aria-label="Key PG facts"
    >
      {visible.map(({ label, value }) => (
        <div key={label}>
          <dd>{value}</dd>
          <dt>{label}</dt>
        </div>
      ))}
    </dl>
  );
}

function DetailsList({ items }) {
  const visible = items.filter((item) => item && hasDetailValue(item.value));
  if (!visible.length) return null;
  return (
    <dl className="land-details-list house-details-list">
      {visible.map(({ label, value }) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PgSummary({
  p,
  onReport = null,
  heading = "Rental details",
}) {
  const snapshot = pgSnapshotItems(p);
  const detailRows = buildPgDetailRows(p);
  const hasContent =
    snapshot.some((item) => hasDetailValue(item.value)) ||
    detailRows.some((item) => hasDetailValue(item.value));
  if (!hasContent) return null;

  return (
    <section
      className="land-summary house-villa-summary pg-summary"
      aria-label={heading}
    >
      <SnapshotCards items={snapshot} />
      <div className="land-summary-heading">
        <h2>{heading}</h2>
      </div>
      <DetailsList items={detailRows} />
      {typeof onReport === "function" ? (
        <div className="land-listing-meta">
          <span>
            Listed by {p.seller || "Owner"}
            {p.freshness ? ` · ${p.freshness}` : ""}
            {" · Sample"}
          </span>
          <button type="button" className="text-button" onClick={onReport}>
            Report listing
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function PgHighlights({ p }) {
  const pills = pgHighlightPills(p);
  if (!pills.length) return null;
  return (
    <section className="commercial-highlights pg-highlights" aria-label="Highlights">
      <h2>Highlights</h2>
      <div className="commercial-highlight-pills">
        {pills.map((pill) => (
          <span className="pill" key={pill}>
            {pill}
          </span>
        ))}
      </div>
    </section>
  );
}

export function PgServices({ p }) {
  const items = pgServices(p);
  if (!items.length) return null;
  return (
    <section className="commercial-facilities pg-services" aria-label="Services">
      <h2>Services</h2>
      <div className="commercial-facilities-grid">
        {items.map((item) => (
          <span key={item}>
            <CheckCircle2 size={16} aria-hidden="true" />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
