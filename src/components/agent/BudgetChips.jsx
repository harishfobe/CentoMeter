import React from "react";
export const budgetRanges = (mode) =>
  mode === "RENT"
    ? [
        [0, 15000, "Under ₹15k"],
        [15000, 30000, "₹15k to ₹30k"],
        [30000, 50000, "₹30k to ₹50k"],
        [50000, 0, "₹50k+"],
      ]
    : [
        [0, 5000000, "Under 50 L"],
        [5000000, 10000000, "50 L to 1 Cr"],
        [10000000, 20000000, "1 to 2 Cr"],
        [20000000, 0, "2 Cr+"],
      ];
export default function BudgetChips({ f, onChange, onCustom }) {
  return (
    <div className="chips" aria-label="Budget ranges">
      {budgetRanges(f.mode).map(([min, max, label]) => (
        <button
          key={label}
          className="chip"
          aria-pressed={f.min === min && f.max === max && f.unit === "total"}
          onClick={() => onChange({ ...f, min, max, unit: "total" })}
        >
          {label}
          {f.mode === "RENT" ? " / month" : ""}
        </button>
      ))}
      <button className="chip" onClick={onCustom}>
        Custom budget
      </button>
    </div>
  );
}
