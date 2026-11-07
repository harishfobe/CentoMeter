import React from "react";
import { CheckCircle2 } from "lucide-react";
import { hasValue, money } from "./PropertyModel";

export const isCommercial = (type) => type === "Commercial";

export function usesCommercialDetailLayout(p) {
  return isCommercial(p?.type) && p?.mode === "BUY";
}

function featurePool(p) {
  return [
    ...(Array.isArray(p.features) ? p.features : []),
    ...(Array.isArray(p.amenities) ? p.amenities : []),
    ...(Array.isArray(p.facilities) ? p.facilities : []),
    ...(Array.isArray(p.highlights) ? p.highlights : []),
    p.tag,
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

function sqftLabel(value) {
  if (!hasValue(value)) return null;
  const text = String(value).trim();
  if (!/^\d+(\.\d+)?$/.test(text)) return text;
  return `${Number(text).toLocaleString("en-IN")} sqft`;
}

function availableLabel(value) {
  if (value === true) return "Available";
  if (value === false) return "Not available";
  if (!hasValue(value)) return null;
  const text = String(value).trim();
  if (/^(yes|available|true)$/i.test(text)) return "Available";
  if (/^(no|not available|false)$/i.test(text)) return "Not available";
  return text;
}

export function commercialSubtypeLabel(p) {
  const raw = String(p.subtype || p.commercialType || p.tag || "Building").trim();
  if (/office\s*space/i.test(raw) || /^office$/i.test(raw)) {
    return p.mode === "RENT" ? "Office Space" : "Office";
  }
  if (/building/i.test(raw)) return "Building";
  if (/shop/i.test(raw)) return "Shop";
  if (/^land|plot$/i.test(raw)) return "Land";
  if (/warehouse|godown/i.test(raw)) return "Warehouse";
  return raw || (p.mode === "RENT" ? "Office Space" : "Building");
}

export function commercialTypeEyebrow(p) {
  const mode = p.mode === "RENT" ? "FOR RENT" : "FOR SALE";
  return `${mode} · COMMERCIAL · ${commercialSubtypeLabel(p).toUpperCase()}`;
}

export function commercialFloorsLabel(p) {
  if (hasValue(p.floorsLabel)) return String(p.floorsLabel);
  if (hasValue(p.totalFloors) && /^\d+$/.test(String(p.totalFloors).trim())) {
    const total = Number(p.totalFloors);
    if (total === 1) return "G";
    if (total > 1) return `G+${total - 1}`;
  }
  const floor = String(p.floor || "").trim();
  if (!floor) return null;
  if (/^g\+/i.test(floor)) return floor.toUpperCase();
  return floor;
}

export function commercialBuiltUpLabel(p) {
  return sqftLabel(p.builtUpArea || p.superArea || p.area);
}

export function commercialMonthlyRentLabel(p, { short = false } = {}) {
  const amount = Number(p.monthlyRent ?? p.rentalIncome ?? p.expectedRent);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return short ? money(amount) : `${money(amount)} / month`;
}

export function commercialShopCountLabel(p) {
  if (hasValue(p.shopCount)) return String(p.shopCount);
  if (hasValue(p.shops)) return String(p.shops);
  return null;
}

export function commercialBuyPriceMeta(p) {
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

export function commercialPostedLabel(p) {
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

export function buildCommercialDetailRows(p) {
  const pool = featurePool(p);
  const parking =
    availableLabel(p.carParking ?? p.parkingAvailable ?? p.parking) ||
    (pool.some((x) => /park/i.test(x)) ? "Available" : null);
  const power =
    availableLabel(p.powerBackup) ||
    (pool.some((x) => /power|backup/i.test(x)) ? "Available" : null);
  const water =
    availableLabel(p.waterSupply || p.water) ||
    (pool.some((x) => /water/i.test(x)) ? "Available" : null);
  return [
    {
      label: "Property type",
      value: `Commercial ${commercialSubtypeLabel(p)}`,
    },
    { label: "Built-up area", value: commercialBuiltUpLabel(p) },
    { label: "Number of floors", value: commercialFloorsLabel(p) },
    { label: "Number of shops", value: commercialShopCountLabel(p) },
    {
      label: "Monthly rental income",
      value: commercialMonthlyRentLabel(p),
    },
    { label: "Car parking", value: parking },
    { label: "Road access", value: p.roadAccess || null },
    { label: "Power backup", value: power },
    { label: "Water supply", value: water },
    {
      label: "Possession",
      value: p.possessionStatus || p.available || null,
    },
    { label: "Condition", value: p.condition || null },
    { label: "Ownership", value: p.ownershipType || null },
    { label: "Price negotiable", value: isNegotiable(p, pool) },
  ];
}

export function commercialHighlightPills(p) {
  if (Array.isArray(p.commercialHighlights) && p.commercialHighlights.length) {
    return p.commercialHighlights.filter((x) => typeof x === "string");
  }
  const pills = [];
  const shops = commercialShopCountLabel(p);
  if (shops) pills.push(`${shops} shops`);
  if (commercialMonthlyRentLabel(p)) pills.push("Rental income");
  if (p.roadAccess) pills.push(`${p.roadAccess} access`);
  const pool = featurePool(p);
  if (
    p.parkingAvailable ||
    p.carParking ||
    pool.some((x) => /park/i.test(x))
  ) {
    pills.push("Parking available");
  }
  return pills;
}

export function commercialFacilities(p) {
  if (Array.isArray(p.facilities) && p.facilities.length) return p.facilities;
  if (Array.isArray(p.amenities) && p.amenities.length) return p.amenities;
  const defaults = [];
  const pool = featurePool(p);
  if (p.parkingAvailable || p.carParking || pool.some((x) => /park/i.test(x)))
    defaults.push("Parking");
  if (pool.some((x) => /cctv/i.test(x)) || p.cctv) defaults.push("CCTV");
  if (p.powerBackup || pool.some((x) => /power|backup/i.test(x)))
    defaults.push("Power backup");
  if (p.waterSupply || p.water || pool.some((x) => /water/i.test(x)))
    defaults.push("Water supply");
  if (p.separateMeters || pool.some((x) => /meter/i.test(x)))
    defaults.push("Separate meters");
  if (p.roadAccess) defaults.push(p.roadAccess + " access");
  return defaults;
}

function SnapshotCards({ items }) {
  const visible = items.filter((item) => item && hasValue(item.value));
  if (!visible.length) return null;
  return (
    <dl
      className="land-snapshot house-snapshot commercial-snapshot"
      aria-label="Key commercial facts"
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

export function CommercialSummary({
  p,
  onReport = null,
  heading = "Property details",
}) {
  const builtUp = commercialBuiltUpLabel(p);
  const rentShort = commercialMonthlyRentLabel(p, { short: true });
  const snapshot = [
    { label: "Built-up", value: builtUp },
    { label: "Floors", value: commercialFloorsLabel(p) },
    { label: "Shops", value: commercialShopCountLabel(p) },
    { label: "Monthly rent", value: rentShort },
  ];
  const detailRows = buildCommercialDetailRows(p);
  const hasContent =
    snapshot.some((item) => hasValue(item.value)) ||
    detailRows.some((item) => hasValue(item.value));
  if (!hasContent) return null;

  return (
    <section
      className="land-summary house-villa-summary commercial-summary"
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

export function CommercialIncomeBadge({ p }) {
  const rent = commercialMonthlyRentLabel(p);
  if (!rent) return null;
  return (
    <p className="commercial-income-badge">
      Monthly rental income · <strong>{rent}</strong>
    </p>
  );
}

export function CommercialHighlights({ p }) {
  const pills = commercialHighlightPills(p);
  if (!pills.length) return null;
  return (
    <section className="commercial-highlights" aria-label="Highlights">
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

export function CommercialFacilities({ p }) {
  const items = commercialFacilities(p);
  if (!items.length) return null;
  return (
    <section className="commercial-facilities" aria-label="Facilities">
      <h2>Facilities</h2>
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
