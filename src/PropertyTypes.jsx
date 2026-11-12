import React, { useEffect, useState } from "react";
import {
  Building2,
  House,
  Home,
  Trees,
  BriefcaseBusiness,
  BedDouble,
  LayoutGrid,
} from "lucide-react";
import {
  PROPERTY_TYPE,
  canonicalizePropertyType,
  WATER_SOURCES,
  PREFERRED_TENANTS,
  VILLA_AMENITIES,
} from "./propertyTypeIds";

export {
  PROPERTY_TYPE,
  canonicalizePropertyType,
  WATER_SOURCES,
  PREFERRED_TENANTS,
  VILLA_AMENITIES,
};

// Labels can evolve without changing listing data or searches saved on this device.
const propertyTypeDetails = {
  Apartment: {
    label: "Apartment / Flat",
    mobileLabel: "Apartment",
    Icon: Building2,
  },
  "Independent House": {
    label: "Independent House",
    mobileLabel: "Independent House",
    description: "Standalone plot with a private building",
    Icon: House,
  },
  Villa: {
    label: "Gated Villa",
    mobileLabel: "Gated Villa",
    description: "Inside a gated community / layout",
    Icon: Home,
  },
  Land: { label: "Plot / Land", mobileLabel: "Land", Icon: Trees },
  Commercial: { label: "Commercial", Icon: BriefcaseBusiness },
  PG: { label: "PG", Icon: BedDouble },
};

export const matchesPropertyType = (listingType, filterType) => {
  if (filterType === "All") return true;
  // Legacy agent filter value "House" matched both; keep that for saved URLs only.
  if (filterType === "House") {
    return ["Independent House", "Villa"].includes(
      canonicalizePropertyType(listingType),
    );
  }
  return (
    canonicalizePropertyType(listingType) ===
    canonicalizePropertyType(filterType)
  );
};

/** RENT: Independent House, Gated Villa, Apartment/Flat, Commercial, PG.
 *  Commercial subtypes (Land / Shop / Office Space) live under filters + post. */
export const propertyTypesFor = (mode) =>
  mode === "RENT"
    ? ["Independent House", "Villa", "Apartment", "Commercial", "PG"]
    : ["Land", "Independent House", "Villa", "Apartment", "Commercial"];

const typesFor = propertyTypesFor;

export const typeLabel = (type) => {
  if (type === "All") return "All properties";
  const key = canonicalizePropertyType(type);
  return propertyTypeDetails[key]?.label || type;
};

/** Short label for property-card image overlays. */
export const cardTypeLabel = (type, listing = null) => {
  const key = canonicalizePropertyType(type);
  if (key === PROPERTY_TYPE.villa) return "Gated Villa";
  if (key === PROPERTY_TYPE.independent_house) return "Independent House";
  if (key === PROPERTY_TYPE.apartment) return "Apartment / Flat";
  if (key === PROPERTY_TYPE.commercial && listing) {
    const subtype = String(
      listing.subtype || listing.commercialType || "",
    ).trim();
    if (/office/i.test(subtype)) return "Office Space";
    if (/shop/i.test(subtype)) return "Shop";
    if (/land|plot/i.test(subtype)) return "Commercial Land";
    if (/building/i.test(subtype)) return "Commercial Building";
    if (subtype) return subtype;
  }
  return propertyTypeDetails[key]?.mobileLabel || type || "";
};

export default function PropertyTypes({
  mode,
  value,
  onChange,
  allowAll = false,
  compact = false,
  deselectable = false,
}) {
  // On the browse page, keep type pills collapsed until Buy/Rent is chosen
  // (or a type filter is already active). Compact filter dialogs stay open.
  const [expanded, setExpanded] = useState(
    !allowAll || compact || (value && value !== "All"),
  );

  useEffect(() => {
    if (!allowAll || compact) return;
    if (value && value !== "All") setExpanded(true);
  }, [allowAll, compact, value]);

  useEffect(() => {
    if (!allowAll || compact) return;
    const revealOnIntentClick = (event) => {
      const intent = event.target.closest('[aria-label="Property intent"]');
      const button = intent?.querySelector
        ? event.target.closest('[role="tab"]')
        : null;
      if (!intent || !button) return;
      const selectedIntent = button.textContent.trim();
      if (selectedIntent === "BUY" || selectedIntent === "RENT")
        setExpanded(true);
    };
    document.addEventListener("click", revealOnIntentClick);
    return () => document.removeEventListener("click", revealOnIntentClick);
  }, [allowAll, compact]);

  const collapsed = allowAll && !compact && !expanded;
  const selectedType = canonicalizePropertyType(value);
  return (
    <section
      className={
        "property-types" +
        (compact ? " property-types-compact" : "") +
        (collapsed ? " property-types-collapsed" : "") +
        (allowAll && !compact ? " property-types-reveal" : "")
      }
      aria-label="Property type"
      aria-hidden={collapsed}
      inert={collapsed}
      data-expanded={allowAll && !compact ? String(!collapsed) : undefined}
    >
      <div
        className="property-type-options"
        role="group"
        aria-label={
          mode === "RENT" ? "Rental property types" : "Property types"
        }
      >
        {allowAll && (
          <button
            type="button"
            className={
              "property-type-option" + (value === "All" ? " selected" : "")
            }
            aria-pressed={value === "All"}
            aria-label="All properties"
            onClick={() => onChange("All")}
          >
            <LayoutGrid size={16} />
            <span>All</span>
          </button>
        )}
        {typesFor(mode).map((type) => {
          const { label, mobileLabel, Icon, description } =
            propertyTypeDetails[type];
          const selected = selectedType === type;
          return (
            <button
              type="button"
              className={"property-type-option" + (selected ? " selected" : "")}
              aria-label={description ? `${label}. ${description}` : label}
              aria-pressed={selected}
              title={description || label}
              key={type}
              onClick={() => {
                if (!selected || deselectable) onChange(type);
              }}
            >
              <Icon size={16} />
              <span className="full-type-label">{label}</span>
              <span className="mobile-type-label" aria-hidden="true">
                {mobileLabel || label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
