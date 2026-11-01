import React, { useState } from "react";
import PropertyTypes, { matchesPropertyType, typeLabel } from "./PropertyTypes";
import { SQFT_PER_CENT } from "./LandMeasurements";

export const facingDirections = [
  "North",
  "North-East",
  "East",
  "South-East",
  "South",
  "South-West",
  "West",
  "North-West",
];
export const supportsFacing = (type) =>
  ["Land", "Independent House", "Villa", "Apartment"].includes(type);
export const filterDefaults = {
  type: "All",
  min: 0,
  max: 0,
  beds: "Any",
  furnishing: "Any",
  minArea: 0,
  unit: "sq ft",
  feature: "Any",
  subtype: "Any",
  occupancy: "Any",
  meals: "Any",
  available: "Any",
  seller: "Any",
  pets: "Any",
  floor: "Any",
  bathroom: "Any",
  ac: "Any",
  facing: "Any",
};
export const readLocal = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
export const writeLocal = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};
export const removeLocal = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};
export function matches(p, f) {
  f = { ...filterDefaults, ...f };
  return (
    matchesPropertyType(p.type, f.type) &&
    (!f.min || p.price >= f.min) &&
    (!f.max || p.price <= f.max) &&
    (f.beds === "Any" || String(f.beds).split(",").includes(String(p.beds))) &&
    (f.furnishing === "Any" || p.furnishing === f.furnishing) &&
    (!f.minArea ||
      p.area >=
        f.minArea *
          (f.unit === "sq yd"
            ? 9
            : f.unit === "acre"
              ? 43560
              : f.unit === "cent"
                ? SQFT_PER_CENT
                : 1)) &&
    (f.feature === "Any" || (p.features || []).includes(f.feature)) &&
    (f.subtype === "Any" || p.subtype === f.subtype) &&
    (f.occupancy === "Any" || p.occupancy === f.occupancy) &&
    (f.meals === "Any" || p.meals === f.meals) &&
    (f.available === "Any" || p.available === f.available) &&
    (f.seller === "Any" || p.seller === f.seller) &&
    ["pets", "floor", "bathroom", "ac", "facing"].every(
      (k) => !f[k] || f[k] === "Any" || p[k] === f[k],
    )
  );
}
export const activeFilters = (f) =>
  Object.entries(f).filter(
    ([k, v]) =>
      Object.hasOwn(filterDefaults, k) &&
      k !== "unit" &&
      v !== filterDefaults[k],
  );
export function SmartFilters({
  filters,
  mode,
  items,
  onApply,
  onClose,
  Modal,
}) {
  const [f, setF] = useState(
    Object.fromEntries(
      Object.entries(filterDefaults).map(([key, value]) => [
        key,
        filters[key] ?? value,
      ]),
    ),
  );
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const select = (key, label, options) => (
    <label>
      {label}
      <select value={f[key]} onChange={(e) => set(key, e.target.value)}>
        {["Any", ...options].map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
    </label>
  );
  const home = !["Land", "Commercial", "PG"].includes(f.type);
  const invalid = f.max > 0 && Number(f.min) > Number(f.max);
  const count = items.filter((p) => matches(p, f)).length;
  return (
    <Modal title="Refine your search" onClose={onClose}>
      <div className="form-stack">
        <PropertyTypes
          mode={mode}
          value={f.type}
          allowAll
          compact
          onChange={(type) => {
            if (type !== f.type)
              setF({ ...filterDefaults, type, min: f.min, max: f.max });
          }}
        />
        <div className="form-columns">
          <label>
            Minimum {mode === "RENT" ? "rent" : "price"} (₹)
            <input
              type="number"
              min="0"
              value={f.min || ""}
              placeholder="No minimum"
              onChange={(e) => set("min", Math.max(0, Number(e.target.value)))}
            />
          </label>
          <label>
            Maximum (₹)
            <input
              type="number"
              min="0"
              value={f.max || ""}
              placeholder="No maximum"
              onChange={(e) => set("max", Math.max(0, Number(e.target.value)))}
            />
          </label>
        </div>
        {invalid && (
          <p role="alert" className="form-error">
            Maximum must be at least the minimum.
          </p>
        )}
        {home && (
          <fieldset className="bhk-options">
            <legend>Exact bedrooms — choose one or more</legend>
            <div className="chips">
              {["0", "1", "2", "3", "4", "5"].map((n) => (
                <button
                  type="button"
                  key={n}
                  className={
                    "chip " +
                    (String(f.beds).split(",").includes(n) ? "active" : "")
                  }
                  aria-pressed={String(f.beds).split(",").includes(n)}
                  onClick={() => {
                    const values = f.beds === "Any" ? [] : f.beds.split(",");
                    const next = values.includes(n)
                      ? values.filter((x) => x !== n)
                      : [...values, n];
                    set("beds", next.length ? next.join(",") : "Any");
                  }}
                >
                  {n === "0" ? "Studio / 1 RK" : n + " BHK"}
                </button>
              ))}
            </div>
          </fieldset>
        )}
        {(f.type === "All" || supportsFacing(f.type)) &&
          select("facing", "Facing direction", facingDirections)}
        {f.type !== "Land" &&
          select("furnishing", "Furnishing", [
            "Unfurnished",
            "Semi-furnished",
            "Fully furnished",
          ])}
        <div className="form-columns">
          <label>
            Minimum area
            <input
              type="number"
              min="0"
              value={f.minArea || ""}
              placeholder="Any size"
              onChange={(e) =>
                set("minArea", Math.max(0, Number(e.target.value)))
              }
            />
          </label>
          <label>
            Area unit
            <select
              value={f.unit}
              onChange={(e) => set("unit", e.target.value)}
            >
              {(f.type === "Land" || f.type === "All"
                ? ["sq ft", "cent", "sq yd", "acre"]
                : ["sq ft", "sq yd", "acre"]
              ).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        </div>
        {f.type === "Land" ? (
          <>
            {select("subtype", "Land type", [
              "Residential",
              "Commercial",
              "Agricultural",
            ])}
            {select("feature", "Access", ["Road access", "Corner plot"])}
          </>
        ) : f.type === "Commercial" ? (
          <>
            {select("subtype", "Space type", ["Office", "Shop", "Warehouse"])}
            {select("feature", "Facilities", ["Parking", "Lift access"])}
          </>
        ) : f.type === "PG" ? (
          <>
            {select("occupancy", "Room occupancy", [
              "Private room",
              "Twin sharing",
              "Triple sharing",
            ])}
            {select("meals", "Meals", ["Included", "Not included"])}
          </>
        ) : (
          select("feature", "Must have", ["Parking", "Lift access", "Balcony"])
        )}
        <details className="advanced-filters">
          <summary>More preferences</summary>
          <div className="form-stack">
            {home && (
              <>
                {select("pets", "Pets", [
                  "Allowed",
                  "Not allowed",
                  "Not specified",
                ])}
                {select("floor", "Floor", ["Ground", "1–3", "4+"])}
              </>
            )}
            {f.type === "PG" && (
              <>
                {select("bathroom", "Bathroom", ["Attached", "Shared"])}
                {select("ac", "Air conditioning", [
                  "Yes",
                  "No",
                  "Not specified",
                ])}
              </>
            )}
          </div>
        </details>
        {select(
          "available",
          mode === "RENT" ? "Move-in availability" : "Possession",
          ["Ready now", "Within 30 days"],
        )}
        {select("seller", "Listed by", ["Owner", "Agent", "Builder"])}
        <div className="modal-actions">
          <button className="text-button" onClick={() => setF(filterDefaults)}>
            Reset all
          </button>
          <button
            className="primary"
            disabled={invalid}
            onClick={() => onApply(f)}
          >
            Show {count} properties
          </button>
        </div>
      </div>
    </Modal>
  );
}
export function Costs({ p, money }) {
  const known = (value) =>
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value));
  const charges = [
    ["Monthly maintenance", p.maintenance],
    ["Refundable deposit", p.deposit],
    ["One-time brokerage", p.brokerage],
  ].filter(([, value]) => known(value));
  const complete = ["maintenance", "deposit", "brokerage"].every((key) =>
    known(p[key]),
  );
  const monthly = known(p.maintenance)
    ? [["Monthly total", Number(p.price) + Number(p.maintenance)]]
    : [];
  const rows =
    p.mode === "RENT"
      ? [
          ["Monthly rent", p.price],
          ...charges,
          ...monthly,
          ...(complete
            ? [
                [
                  "Move-in total",
                  Number(p.price) +
                    Number(p.maintenance) +
                    Number(p.deposit) +
                    Number(p.brokerage),
                ],
              ]
            : []),
        ]
      : [
          ["Asking price", p.price],
          ["Price per sq ft", Math.round(p.price / p.area)],
        ];
  return (
    <div className="cost-breakdown">
      <h3>{p.mode === "RENT" ? "Cost breakdown" : "Price overview"}</h3>
      {rows.map(([label, n]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{money(n)}</strong>
        </div>
      ))}
      <small>
        Illustrative amounts.{" "}
        {p.mode === "BUY"
          ? "Taxes and registration costs excluded."
          : complete
            ? "Move-in total includes first month, deposit and brokerage."
            : "Unspecified charges are not included in totals."}
      </small>
    </div>
  );
}
export function Gallery({ p }) {
  const [index, setIndex] = useState(0);
  const images = p.photos?.length
    ? p.photos
    : p.type === "Land"
      ? ["/land.jpg"]
      : ["/" + p.image + ".jpg", "/interior.jpg", "/apartment.jpg"];
  return (
    <div className="gallery-wrap">
      <div
        className="swipe-gallery"
        onScroll={(e) =>
          setIndex(
            Math.round(
              e.currentTarget.scrollLeft / e.currentTarget.clientWidth,
            ),
          )
        }
      >
        {images.map((src, i) => (
          <img
            src={src}
            alt={`Illustrative ${typeLabel(p.type)} photo ${i + 1}`}
            key={i}
          />
        ))}
      </div>
      <span className="gallery-count">
        {index + 1} / {images.length} ·{" "}
        {p.photos?.length ? "Listing photos" : "Sample photos"}
      </span>
      {images.length > 1 && (
        <div className="gallery-controls">
          {images.map((_, i) => (
            <button
              key={i}
              aria-label={`Show photo ${i + 1}`}
              aria-pressed={index === i}
              onClick={(e) =>
                e.currentTarget
                  .closest(".gallery-wrap")
                  .querySelector(".swipe-gallery")
                  .scrollTo({
                    left:
                      i * e.currentTarget.closest(".gallery-wrap").clientWidth,
                    behavior: "smooth",
                  })
              }
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
