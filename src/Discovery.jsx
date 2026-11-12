import React, { useEffect, useRef, useState } from "react";
import PropertyTypes, { matchesPropertyType, typeLabel } from "./PropertyTypes";
import { SQFT_PER_CENT } from "./LandMeasurements";
import PhotoSwipeDots from "./components/PhotoSwipeDots";
import { landPrice } from "./JourneyUX";
import { nearText } from "./Journeys";
import { landmarkSuggestions } from "./data/cities";
import {
  AVAILABILITY_FILTER_OPTIONS,
  commercialFacilitiesFor,
  commercialSubtypesFor,
  furnishingOptionsFor,
  matchesCommercialFacility,
  matchesFloorFilter,
  matchesPossessionFilter,
} from "./listingFit";

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
  ["Land", "Independent House", "Villa", "Apartment"].includes(type); // house + villa stay distinct
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
  pricePer: "",
  brokerage: "Any",
};
export function retainFilters(current, nextType) {
  const next = {
    ...filterDefaults,
    type: nextType,
    min: current.min || 0,
    max: current.max || 0,
    pricePer: current.pricePer || "",
    seller: current.seller || "Any",
    available: current.available || "Any",
    brokerage: current.brokerage || "Any",
  };
  if (nextType !== "Land" && next.pricePer === "cent") {
    next.min = 0;
    next.max = 0;
    next.pricePer = "";
  }
  const home = !["Land", "Commercial", "PG"].includes(nextType);
  if (home) next.beds = current.beds || "Any";
  if (supportsFacing(nextType)) next.facing = current.facing || "Any";
  if (nextType !== "Land") next.furnishing = current.furnishing || "Any";
  if (current.minArea) {
    next.minArea = current.minArea;
    next.unit = current.unit || "sq ft";
  }
  if (current.type === nextType) {
    next.feature = current.feature;
    next.subtype = current.subtype;
    next.occupancy = current.occupancy;
    next.meals = current.meals;
    next.pets = current.pets;
    next.floor = current.floor;
    next.bathroom = current.bathroom;
    next.ac = current.ac;
  }
  return next;
}
export function matchesSearchTerm(property, term) {
  const query = String(term || "").trim();
  if (!query) return true;
  const landmarks = (landmarkSuggestions[property.city] || [])
    .filter(([, locality]) => locality === property.locality)
    .map(([name]) => name)
    .join(" ");
  return nearText(
    `${property.title} ${property.locality} ${property.city} ${property.type} ${landmarks}`,
    query,
  );
}
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
  const price =
    f.pricePer === "cent" && p.type === "Land"
      ? landPrice(p, "cent").amount
      : p.price;
  const facilityPool = [
    ...(Array.isArray(p.features) ? p.features : []),
    ...(Array.isArray(p.amenities) ? p.amenities : []),
    ...(Array.isArray(p.facilities) ? p.facilities : []),
  ];
  return (
    matchesPropertyType(p.type, f.type) &&
    (!f.min || price >= f.min) &&
    (!f.max || price <= f.max) &&
    (f.brokerage !== "None" || Number(p.brokerage) === 0) &&
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
    (f.feature === "Any" ||
      (p.type === "Commercial"
        ? matchesCommercialFacility(facilityPool, f.feature)
        : facilityPool.some(
            (item) =>
              String(item).toLowerCase() === String(f.feature).toLowerCase(),
          ))) &&
    (f.subtype === "Any" || p.subtype === f.subtype) &&
    (f.occupancy === "Any" || p.occupancy === f.occupancy) &&
    (f.meals === "Any" || p.meals === f.meals) &&
    matchesPossessionFilter(
      p,
      f.available === "Any" ? "Any" : f.available,
    ) &&
    (f.seller === "Any" || p.seller === f.seller) &&
    ["pets", "bathroom", "ac", "facing"].every(
      (k) => !f[k] || f[k] === "Any" || p[k] === f[k],
    ) &&
    matchesFloorFilter(p.floor, f.floor)
  );
}
export const activeFilters = (f) =>
  Object.entries(f).filter(
    ([k, v]) =>
      Object.hasOwn(filterDefaults, k) &&
      k !== "unit" &&
      k !== "pricePer" &&
      v !== filterDefaults[k],
  );
export function RefineSearchPanel({
  filters,
  mode,
  items,
  listings,
  area = "",
  onApply,
  onModeChange,
  showActions = true,
  deferMode = false,
  onDraftIntent,
  renderActions,
  beforeTabs = null,
  afterTabs = null,
  children,
}) {
  const [intent, setIntent] = useState(mode === "RENT" ? "RENT" : "BUY");
  useEffect(() => {
    onDraftIntent?.(intent);
  }, [intent, onDraftIntent]);
  const [f, setF] = useState(
    Object.fromEntries(
      Object.entries(filterDefaults).map(([key, value]) => [
        key,
        filters[key] ?? value,
      ]),
    ),
  );
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const selectIntent = (next) => {
    if (next === intent) return;
    setIntent(next);
    setF((current) => {
      if (next === "RENT" && current.type === "Land") {
        return retainFilters(current, "All");
      }
      return current;
    });
    if (!deferMode) onModeChange?.(next);
  };
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
  const pool = (listings || items).filter(
    (property) => !listings || property.mode === intent,
  );
  const count = pool.filter(
    (property) => matchesSearchTerm(property, area) && matches(property, f),
  ).length;
  const blankFilters = () =>
    Object.fromEntries(
      Object.entries(filterDefaults).map(([key, value]) => [key, value]),
    );
  const reset = () => {
    setIntent(mode === "RENT" ? "RENT" : "BUY");
    setF(blankFilters());
  };
  const apply = () => onApply(f, intent);
  const actions = (
    <div className="modal-actions">
      <button className="text-button" type="button" onClick={reset}>
        Reset all
      </button>
      <button
        className="primary"
        type="button"
        disabled={invalid}
        onClick={apply}
      >
        Show {count} {count === 1 ? "property" : "properties"}
      </button>
    </div>
  );
  const body = (
    <>
      <div className="form-stack">
        <div className="refine-intent-block">
          {typeof beforeTabs === "function" ? beforeTabs({ f, intent }) : beforeTabs}
        <div
          className="segment refine-intent-tabs"
          role="tablist"
          aria-label="Buy or rent"
        >
          {[
            ["BUY", "Buy"],
            ["RENT", "Rent"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={intent === value}
              className={intent === value ? "active" : ""}
              onClick={() => selectIntent(value)}
            >
              {label}
            </button>
          ))}
        </div>
          {typeof afterTabs === "function" ? afterTabs({ f, intent }) : afterTabs}
        </div>
        <div className="form-columns">
          <label>
            Minimum {intent === "RENT" ? "rent" : "price"} (₹)
            <input
              type="number"
              min="0"
              value={f.min || ""}
              placeholder="No minimum"
              onChange={(e) => {
                set("pricePer", "");
                set("min", Math.max(0, Number(e.target.value)));
              }}
            />
          </label>
          <label>
            Maximum {intent === "RENT" ? "rent" : "price"} (₹)
            <input
              type="number"
              min="0"
              value={f.max || ""}
              placeholder="No maximum"
              onChange={(e) => {
                set("pricePer", "");
                set("max", Math.max(0, Number(e.target.value)));
              }}
            />
          </label>
        </div>
        {invalid && (
          <p role="alert" className="form-error">
            Maximum must be at least the minimum.
          </p>
        )}
        <PropertyTypes
          mode={intent}
          value={f.type}
          compact
          deselectable
          onChange={(type) => setF((current) => retainFilters(current, type === current.type ? "All" : type))}
        />
        {f.type === "All" ? (
          <p className="refine-type-hint">
            Choose a property type to see bedrooms and more filters.
          </p>
        ) : (
          <>
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
                        const values =
                          f.beds === "Any" ? [] : f.beds.split(",");
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
            {supportsFacing(f.type) &&
              select("facing", "Facing direction", facingDirections)}
            {f.type !== "Land" &&
              select(
                "furnishing",
                "Furnishing",
                furnishingOptionsFor(
                  f.type === "Commercial"
                    ? "Commercial"
                    : f.type === "PG"
                      ? "Apartment"
                      : f.type,
                ),
              )}
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
                  {(f.type === "Land"
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
                {select(
                  "subtype",
                  "Space type",
                  commercialSubtypesFor(intent),
                )}
                {select(
                  "feature",
                  intent === "RENT" ? "Amenities & facilities" : "Facilities",
                  commercialFacilitiesFor(intent),
                )}
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
              select("feature", "Must have", [
                "Parking",
                "Lift access",
                "Balcony",
              ])
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
                {f.type === "Commercial" &&
                  intent === "RENT" &&
                  select("floor", "Floor", ["Ground", "1–3", "4+"])}
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
              intent === "RENT" ? "Move-in availability" : "Possession",
              intent === "RENT"
                ? AVAILABILITY_FILTER_OPTIONS
                : ["Ready to move", "Within 30 days", "Under construction"],
            )}
            {select("seller", "Listed by", ["Owner", "Agent", "Builder"])}
          </>
        )}
        {showActions && typeof renderActions !== "function" ? actions : null}
      </div>
      {typeof children === "function"
        ? children({ f, intent, invalid, count, reset, apply })
        : children}
    </>
  );
  if (typeof renderActions === "function") {
    return (
      <>
        <div className="search-discovery-scroll">{body}</div>
        {renderActions({ f, intent, invalid, count, reset, apply })}
      </>
    );
  }
  return body;
}
export function SmartFilters({
  filters,
  mode,
  items,
  onApply,
  onClose,
  onModeChange,
  Modal,
}) {
  return (
    <Modal title="Refine your search" onClose={onClose}>
      <RefineSearchPanel
        filters={filters}
        mode={mode}
        items={items}
        onApply={onApply}
        onModeChange={onModeChange}
        showActions
      />
    </Modal>
  );
}
export function Costs({ p, money, title }) {
  const known = (value) =>
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value)) &&
    Number(value) >= 0;
  const brokerageKnown =
    Object.prototype.hasOwnProperty.call(p, "brokerage") &&
    p.brokerage !== null &&
    p.brokerage !== undefined &&
    String(p.brokerage).trim() !== "" &&
    Number.isFinite(Number(p.brokerage)) &&
    Number(p.brokerage) >= 0;
  const moveIn =
    p.mode === "RENT"
      ? Number(p.price) +
        (known(p.maintenance) ? Number(p.maintenance) : 0) +
        (known(p.deposit) ? Number(p.deposit) : 0) +
        (brokerageKnown ? Number(p.brokerage) : 0)
      : null;
  const excluded = [];
  if (p.mode === "RENT" && !known(p.maintenance)) excluded.push("maintenance");
  if (p.mode === "RENT" && !known(p.deposit)) excluded.push("deposit");
  if (p.mode === "RENT" && !brokerageKnown) excluded.push("brokerage");
  const rows =
    p.mode === "RENT"
      ? [
          ["Monthly rent", money(p.price)],
          [
            "Monthly maintenance",
            known(p.maintenance) ? money(p.maintenance) : "Not provided",
          ],
          [
            "Refundable deposit",
            known(p.deposit) ? money(p.deposit) : "Not provided",
          ],
          [
            "One-time brokerage",
            brokerageKnown
              ? Number(p.brokerage) === 0
                ? "No brokerage"
                : money(p.brokerage)
              : "Not provided",
          ],
          ...(moveIn != null
            ? [["Known move-in amount", money(moveIn)]]
            : []),
        ]
      : [
          ["Asking price", money(p.price)],
          [
            "Price per sq ft",
            Number(p.area) > 0
              ? money(Math.round(p.price / p.area))
              : "Not provided",
          ],
        ];
  const heading =
    title === undefined
      ? p.mode === "RENT"
        ? "What you will pay"
        : "Price overview"
      : title;
  return (
    <div className="cost-breakdown">
      {heading ? <h3>{heading}</h3> : null}
      {rows.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
      <small>
        {p.mode === "BUY"
          ? "Taxes and registration costs excluded."
          : excluded.length
            ? `Known move-in amount excludes ${excluded.join(", ")} because ${excluded.length === 1 ? "it was" : "they were"} not provided.`
            : "Known move-in amount includes first month, deposit and brokerage."}{" "}
        Provided by the seller; not independently verified by CentoMeter.
      </small>
    </div>
  );
}
export function Gallery({ p }) {
  const [index, setIndex] = useState(0);
  const strip = useRef(null);
  const images = p.photos?.length
    ? p.photos
    : p.type === "Land"
      ? ["/land.jpg"]
      : ["/" + p.image + ".jpg", "/interior.jpg", "/apartment.jpg"];
  return (
    <div className="gallery-wrap">
      <div
        className="swipe-gallery"
        ref={strip}
        tabIndex={0}
        role="region"
        aria-label={"Photos of " + (p.title || typeLabel(p.type))}
        onKeyDown={(e) => {
          if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
          e.preventDefault();
          const el = strip.current;
          if (!el) return;
          el.scrollBy({
            left: (e.key === "ArrowRight" ? 1 : -1) * el.clientWidth,
            behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)")
              .matches
              ? "instant"
              : "smooth",
          });
        }}
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
            width="800"
            height="500"
            decoding="async"
            src={src}
            alt={`${p.title || typeLabel(p.type)} photo ${i + 1}`}
            key={i}
          />
        ))}
      </div>
      <PhotoSwipeDots count={images.length} index={index} />
    </div>
  );
}
