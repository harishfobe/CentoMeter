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
          onClick={() => onChange({ ...f, mode, min: 0, max: 0 })}
        >
          {mode === "BUY" ? "Buy" : "Rent"}
        </button>
      ))}
      <select
        aria-label="Property type"
        value={f.type}
        onChange={(e) => onChange({ ...f, type: e.target.value, beds: "" })}
      >
        {["All", "Apartment", "House", "Land", "Commercial", "PG"].map((x) => (
          <option key={x}>{x}</option>
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
