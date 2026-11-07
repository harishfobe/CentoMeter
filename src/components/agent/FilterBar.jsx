import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { defaults } from "../../lib/agents";
import BudgetChips from "./BudgetChips";
export default function FilterBar({ f, onChange, onMore }) {
  return (
    <div className="agent-filter-bar">
      {["BUY", "RENT"].map((mode) => (
        <button
          key={mode}
          aria-pressed={f.mode === mode}
          onClick={() =>
            onChange({
              ...f,
              mode,
              min: 0,
              max: 0,
              type:
                mode === "RENT" && f.type === "Land" ? "All" : f.type,
              // Drop BUY-only commercial subtypes when switching to rent filters.
              subtype:
                mode !== f.mode && f.type === "Commercial" ? "" : f.subtype,
            })
          }
        >
          {mode === "BUY" ? "Buy" : "Rent"}
        </button>
      ))}
      <select
        aria-label="Property type"
        value={f.type === "Land" && f.mode === "RENT" ? "All" : f.type}
        onChange={(e) => onChange({ ...f, type: e.target.value, beds: "" })}
      >
        {(f.mode === "RENT"
          ? [
              "All",
              "Independent House",
              "Villa",
              "Apartment",
              "Commercial",
              "PG",
            ]
          : [
              "All",
              "Apartment",
              "Independent House",
              "Villa",
              "Land",
              "Commercial",
            ]
        ).map((x) => (
          <option key={x} value={x}>
            {x === "Villa"
              ? "Gated Villa"
              : x === "Apartment"
                ? "Apartment / Flat"
                : x}
          </option>
        ))}
      </select>
      <select
        aria-label="Sort listings"
        value={f.sort}
        onChange={(e) => onChange({ ...f, sort: e.target.value })}
      >
        {[
          ["newest", "Newest"],
          ["low", "Price low-high"],
          ["high", "Price high-low"],
          ["sqft", "Price per sq ft"],
          ["area", "Area"],
        ].map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <BudgetChips f={f} onChange={onChange} onCustom={onMore} />
      <button className="agent-more-button" onClick={onMore}>
        <SlidersHorizontal size={15} aria-hidden="true" />
        More filters{" "}
        <span key={JSON.stringify(f)} className="agent-more-count">
          {Object.entries(f).filter(([k, v]) => v !== defaults[k]).length}
        </span>
      </button>
    </div>
  );
}
