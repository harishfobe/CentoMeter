import React, { useEffect, useState } from "react";
import {
  Building2,
  House,
  Trees,
  BriefcaseBusiness,
  BedDouble,
  LayoutGrid,
} from "lucide-react";

// Labels can evolve without changing listing data or searches saved on this device.
const propertyTypeDetails = {
  Apartment: {
    label: "Apartment / Flat",
    mobileLabel: "Apartment",
    Icon: Building2,
  },
  "Independent House": {
    label: "House / Villa",
    mobileLabel: "House / Villa",
    Icon: House,
  },
  Land: { label: "Plot / Land", mobileLabel: "Land", Icon: Trees },
  Commercial: { label: "Commercial", Icon: BriefcaseBusiness },
  PG: { label: "PG", Icon: BedDouble },
};
// Keep existing Villa listings and saved searches in the combined house category.
const propertyTypeKey = (type) =>
  type === "Villa" ? "Independent House" : type;
export const matchesPropertyType = (listingType, filterType) =>
  filterType === "All" ||
  propertyTypeKey(listingType) === propertyTypeKey(filterType);
const typesFor = (mode) =>
  mode === "RENT"
    ? ["Land", "Independent House", "Apartment", "Commercial", "PG"]
    : ["Land", "Independent House", "Apartment", "Commercial"];
export const typeLabel = (type) =>
  type === "All"
    ? "All properties"
    : propertyTypeDetails[propertyTypeKey(type)]?.label || type;

export default function PropertyTypes({
  mode,
  value,
  onChange,
  allowAll = false,
  compact = false,
}) {
  // On the browse page, reveal the property-type choices after Buy or Rent is
  // selected. Compact filter-dialog controls remain visible as before.
  const [expanded, setExpanded] = useState(!allowAll || compact);

  useEffect(() => {
    if (!allowAll || compact) return;
    const revealOnIntentClick = (event) => {
      const intent = event.target.closest('[aria-label="Property intent"]');
      const button = intent?.querySelector ? event.target.closest('[role="tab"]') : null;
      if (!intent || !button) return;
      const selectedIntent = button.textContent.trim();
      if (selectedIntent === "BUY" || selectedIntent === "RENT")
        setExpanded(true);
    };
    document.addEventListener("click", revealOnIntentClick);
    return () => document.removeEventListener("click", revealOnIntentClick);
  }, [allowAll, compact]);

  const collapsed = allowAll && !compact && !expanded;
  return (
    <section
      className={
        "property-types" +
        (compact ? " property-types-compact" : "") +
        (collapsed ? " property-types-collapsed" : "")
      }
      aria-label="Property type"
      aria-hidden={collapsed}
      inert={collapsed}
      style={
        allowAll && !compact
          ? {
              maxHeight: collapsed ? 0 : 240,
              opacity: collapsed ? 0 : 1,
              overflow: "hidden",
              transition:
                "max-height 240ms var(--ease-spring), opacity 180ms var(--ease-spring)",
            }
          : undefined
      }
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
          const { label, mobileLabel, Icon } = propertyTypeDetails[type];
          const selected = propertyTypeKey(value) === type;
          return (
            <button
              type="button"
              className={"property-type-option" + (selected ? " selected" : "")}
              aria-label={label}
              aria-pressed={selected}
              key={type}
              onClick={() => {
                if (!selected) onChange(type);
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
