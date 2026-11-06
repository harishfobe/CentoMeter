import React from "react";
import { landNumber, positive } from "./LandMeasurements";
import { hasValue } from "./PropertyModel";
import { statusLabel } from "./lib/agents";

export const isHouseOrVilla = (type) =>
  type === "Villa" || type === "Independent House";

export function houseTypeEyebrow(p) {
  const mode = p.mode === "RENT" ? "FOR RENT" : "FOR SALE";
  const kind = p.type === "Villa" ? "VILLA" : "HOUSE";
  return `${mode} · ${kind}`;
}

export function carParkingLabel(p) {
  const counted = Number(p.carParking ?? p.parkingSpaces);
  if (Number.isFinite(counted) && counted >= 0) {
    return counted === 1 ? "1 car" : `${counted} cars`;
  }
  const match = String(p.parking ?? "").match(/(\d+)/);
  if (!match) return hasValue(p.parking) ? p.parking : null;
  const cars = Number(match[1]);
  return cars === 1 ? "1 car" : `${cars} cars`;
}

export function houseDimensionsLabel(p) {
  if (!positive(p.width) || !positive(p.length)) return null;
  return `Width ${landNumber(p.width)} ft · Length ${landNumber(p.length)} ft`;
}

function sqftLabel(value) {
  if (!hasValue(value)) return null;
  const text = String(value).trim();
  if (!/^\d+(\.\d+)?$/.test(text)) return text;
  return `${Number(text).toLocaleString("en-IN")} sqft`;
}

function postedDateLabel(p) {
  const date = Date.parse(p.postedAt || p.createdAt || "");
  if (!Number.isFinite(date)) return null;
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function featurePool(p) {
  return [
    ...(Array.isArray(p.features) ? p.features : []),
    ...(Array.isArray(p.amenities) ? p.amenities : []),
    ...(Array.isArray(p.highlights) ? p.highlights : []),
    p.tag,
    p.water,
  ]
    .filter((x) => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean);
}

function isNegotiable(p, pool = featurePool(p)) {
  if (p.negotiable === true) return "Yes";
  if (p.negotiable === false) return "No";
  if (/^yes$/i.test(String(p.negotiable || "").trim())) return "Yes";
  if (/^no$/i.test(String(p.negotiable || "").trim())) return "No";
  if (pool.some((value) => /negotiable/i.test(value))) return "Yes";
  return null;
}

export function houseBuiltUpLabel(p) {
  return sqftLabel(p.builtUpArea || p.superArea || p.area);
}

export function housePlotAreaLabel(p) {
  if (hasValue(p.plotArea)) return sqftLabel(p.plotArea);
  if (positive(p.width) && positive(p.length)) {
    return sqftLabel(Math.round(Number(p.width) * Number(p.length)));
  }
  return null;
}

export function houseBedroomsLabel(p) {
  if (!hasValue(p.beds)) return null;
  const beds = Number(p.beds);
  if (!Number.isFinite(beds) || beds <= 0) return String(p.beds);
  return `${beds} BHK`;
}

export function houseFloorsLabel(p) {
  if (hasValue(p.floorsLabel)) return String(p.floorsLabel);
  if (hasValue(p.totalFloors) && /^\d+$/.test(String(p.totalFloors).trim())) {
    const total = Number(p.totalFloors);
    if (total === 1) return "G";
    if (total > 1) return `G+${total - 1}`;
  }
  const floor = String(p.floor || "").trim();
  if (!floor) return null;
  if (/^ground$/i.test(floor)) return "G+1";
  if (/^g\+/i.test(floor)) return floor.toUpperCase();
  return floor;
}

export function houseAgeLabel(p) {
  if (!hasValue(p.propertyAge)) return null;
  const age = Number(p.propertyAge);
  if (!Number.isFinite(age)) return String(p.propertyAge);
  if (age === 0) return "New property";
  return `${age}${age === 1 ? " year" : " years"}`;
}

export function houseWaterLabel(p, pool = featurePool(p)) {
  if (hasValue(p.water)) return String(p.water).trim();
  const hit = pool.find((value) =>
    /borewell|corporation|water/i.test(value),
  );
  return hit || null;
}

export function houseBuyPriceMeta(p) {
  const pool = featurePool(p);
  const negotiable = isNegotiable(p, pool) === "Yes";
  const basis = Number(p.builtUpArea || p.area);
  const perSqft =
    basis > 0 && Number(p.price) > 0
      ? "₹" +
        Math.round(Number(p.price) / basis).toLocaleString("en-IN") +
        " / sqft"
      : null;
  return { perSqft, negotiable };
}

/** Shared Property details rows for Villa / Independent House (legacy consumers). */
export function buildHouseVillaFacts(p, { includeStatus = true } = {}) {
  return [
    ["Type", p.type],
    ["Beds", p.beds],
    ["Baths", p.baths],
    ["Total area", sqftLabel(p.area)],
    ["Carpet area", sqftLabel(p.carpetArea)],
    ["Dimensions", houseDimensionsLabel(p)],
    ["Car parking", carParkingLabel(p)],
    ["Floor", p.floor],
    ["Total floors", p.totalFloors],
    ["Property age", houseAgeLabel(p)],
    ["Possession", p.possessionStatus || p.available],
    ["Furnishing", p.furnishing],
    ["Ownership", p.ownershipType],
    ["Facing", p.facing],
    ["Availability", p.available],
    ["Posted date", postedDateLabel(p)],
    [
      includeStatus ? "Status" : null,
      includeStatus ? statusLabel(p.status) : null,
    ],
  ].filter(([label, value]) => label && hasValue(value));
}

function SnapshotCards({ items }) {
  const visible = items.filter((item) => item && hasValue(item.value));
  if (!visible.length) return null;
  return (
    <dl className="land-snapshot house-snapshot" aria-label="Key home facts">
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
  const visible = items.filter((item) => item && hasValue(item.value));
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

export function HouseVillaSummary({
  p,
  onReport = null,
  heading = "Property details",
}) {
  const pool = featurePool(p);
  const builtUp = houseBuiltUpLabel(p);
  const snapshot = [
    { label: "Built-up", value: builtUp },
    { label: "Bedrooms", value: houseBedroomsLabel(p) },
    {
      label: "Bathrooms",
      value: hasValue(p.baths) ? String(p.baths) : null,
    },
    { label: "Facing", value: p.facing || null },
  ];
  const detailRows = [
    { label: "Plot area", value: housePlotAreaLabel(p) },
    { label: "Built-up area", value: builtUp },
    { label: "Carpet area", value: sqftLabel(p.carpetArea) },
    { label: "Bedrooms", value: houseBedroomsLabel(p) },
    {
      label: "Bathrooms",
      value: hasValue(p.baths) ? String(p.baths) : null,
    },
    { label: "Facing", value: p.facing || null },
    { label: "Floors", value: houseFloorsLabel(p) },
    { label: "Property age", value: houseAgeLabel(p) },
    { label: "Condition", value: p.condition || null },
    { label: "Car parking", value: carParkingLabel(p) },
    { label: "Water", value: houseWaterLabel(p, pool) },
    {
      label: "Possession",
      value: p.possessionStatus || p.available || null,
    },
    { label: "Price negotiable", value: isNegotiable(p, pool) },
  ];
  const hasContent =
    snapshot.some((item) => hasValue(item.value)) ||
    detailRows.some((item) => hasValue(item.value));
  if (!hasContent) return null;

  return (
    <section
      className="land-summary house-villa-summary"
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
