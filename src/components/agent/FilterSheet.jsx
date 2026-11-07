import React from "react";
import { defaults } from "../../lib/agents";
import PropertyTypes from "../../PropertyTypes";
import {
  commercialSubtypesFor,
  furnishingOptionsFor,
  POSSESSION_OPTIONS,
  RENT_AVAILABLE_OPTIONS,
} from "../../listingFit";
export default function FilterSheet({ Modal, f, onChange, count, onClose }) {
  const set = (k, v) => onChange({ ...f, [k]: v });
  const commercial = f.type === "Commercial";
  const home = !["Land", "Commercial", "PG"].includes(f.type);
  return (
    <Modal title="Listing filters" onClose={onClose}>
      <div className="form-stack">
        <PropertyTypes
          mode={f.mode}
          value={f.type}
          allowAll
          compact
          onChange={(type) =>
            onChange({
              ...f,
              type,
              beds: "",
              subtype: type === "Commercial" ? f.subtype || "" : "",
            })
          }
        />
        {[
          ["min", "Minimum ₹"],
          ["max", "Maximum ₹"],
        ].map(([k, label]) => (
          <label key={k}>
            {label}
            <input
              type="number"
              min="0"
              value={f[k] || ""}
              onChange={(e) => set(k, Number(e.target.value))}
            />
          </label>
        ))}
        {commercial ? (
          <label>
            Space type
            <select
              value={f.subtype || ""}
              onChange={(e) => set("subtype", e.target.value)}
            >
              <option value="">Any</option>
              {commercialSubtypesFor(f.mode).map((subtype) => (
                <option key={subtype} value={subtype}>
                  {subtype}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {[
          ["unit", "Price unit", ["total", "cent", "sqft"]],
          ...(home ? [["beds", "Bedrooms", ["", "1", "2", "3", "4+"]]] : []),
          [
            "furnishing",
            "Furnishing",
            [
              "",
              ...furnishingOptionsFor(
                commercial || (f.type === "All" && f.mode === "RENT")
                  ? "Commercial"
                  : f.type === "All"
                    ? "Apartment"
                    : f.type,
              ),
            ],
          ],
          [
            "possession",
            f.mode === "RENT" ? "Available from" : "Possession",
            [
              "",
              ...(f.mode === "RENT"
                ? RENT_AVAILABLE_OPTIONS
                : POSSESSION_OPTIONS),
            ],
          ],
        ].map(([k, l, opts]) => (
          <label key={k}>
            {l}
            <select value={f[k]} onChange={(e) => set(k, e.target.value)}>
              {opts.map((x) => (
                <option key={x} value={x}>
                  {x || "Any"}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label>
          <input
            type="checkbox"
            checked={f.available}
            onChange={(e) => set("available", e.target.checked)}
          />
          Available only
        </label>
        <label>
          <input
            type="checkbox"
            checked={f.recent}
            onChange={(e) => set("recent", e.target.checked)}
          />
          Confirmed within 14 days
        </label>
        <button
          className="secondary"
          onClick={() => onChange({ ...defaults, mode: f.mode })}
        >
          Reset filters
        </button>
        <button className="primary" onClick={onClose}>
          Show {count} {count === 1 ? "property" : "properties"}
        </button>
        <p aria-live="polite">
          {count} {count === 1 ? "property" : "properties"}
        </p>
      </div>
    </Modal>
  );
}
