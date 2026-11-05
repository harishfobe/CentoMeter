import React from "react";
import { landNumber, positive } from "./LandMeasurements";
import { hasValue } from "./PropertyModel";
import { statusLabel } from "./lib/agents";

export const isHouseOrVilla = (type) =>
  type === "Villa" || type === "Independent House";

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
  return /^\d+(\.\d+)?$/.test(String(value).trim())
    ? `${value} sq ft`
    : value;
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

/** Shared Property details rows for Villa / Independent House. */
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
    [
      "Property age",
      hasValue(p.propertyAge)
        ? Number(p.propertyAge) === 0
          ? "New property"
          : `${p.propertyAge}${Number(p.propertyAge) === 1 ? " year" : " years"}`
        : null,
    ],
    ["Possession", p.possessionStatus],
    ["Furnishing", p.furnishing],
    ["Ownership", p.ownershipType],
    ["Facing", p.facing],
    ["Availability", p.available],
    ["Posted date", postedDateLabel(p)],
    [includeStatus ? "Status" : null, includeStatus ? statusLabel(p.status) : null],
  ].filter(([label, value]) => label && hasValue(value));
}

export function HouseVillaSummary({
  p,
  onReport = null,
  heading = "Property details",
}) {
  const facts = buildHouseVillaFacts(p);
  if (!facts.length) return null;
  return (
    <section className="land-summary house-villa-summary" aria-label={heading}>
      <div className="land-summary-heading">
        <h2>{heading}</h2>
      </div>
      <dl className="land-facts land-facts-primary">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
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
