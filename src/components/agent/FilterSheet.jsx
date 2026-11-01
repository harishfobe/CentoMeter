import React from "react";
import { defaults } from "../../lib/agents";
export default function FilterSheet({ Modal, f, onChange, count, onClose }) {
  const set = (k, v) => onChange({ ...f, [k]: v });
  return (
    <Modal title="Listing filters" onClose={onClose}>
      <div className="form-stack">
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
        {[
          ["unit", "Price unit", ["total", "cent", "sqft"]],
          ...(!["Land", "Commercial", "PG"].includes(f.type)
            ? [["beds", "Bedrooms", ["", "1", "2", "3", "4+"]]]
            : []),
          [
            "furnishing",
            "Furnishing",
            ["", "Unfurnished", "Semi-furnished", "Fully furnished"],
          ],
          ["possession", "Possession", ["", "Ready", "Under construction"]],
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
          Show {count} properties
        </button>
        <p aria-live="polite">{count} properties</p>
      </div>
    </Modal>
  );
}
