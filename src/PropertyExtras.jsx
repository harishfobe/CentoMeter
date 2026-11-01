import React, { useState } from "react";
import { money, hasValue, emiPayment } from "./PropertyModel";
const optionalFields = [
  ["reraNumber", "RERA number", "text"],
  ["possessionStatus", "Possession status", "text"],
  ["propertyAge", "Property age (years)", "number"],
  ["totalFloors", "Total floors", "number"],
  ["parking", "Parking", "text"],
  ["ownershipType", "Ownership type", "text"],
  ["postedAt", "Posted date", "date"],
];
export function OptionalListingFields({ data, set }) {
  return (
    <details className="advanced-filters">
      <summary>Additional property details (optional)</summary>
      <div className="form-columns">
        {optionalFields.map(([key, label, type]) => (
          <label key={key}>
            {label}
            <input
              type={type}
              min={
                key === "totalFloors" ? 1 : type === "number" ? 0 : undefined
              }
              value={
                type === "date"
                  ? String(data[key] || "").slice(0, 10)
                  : (data[key] ?? "")
              }
              placeholder="Optional"
              onChange={(e) => set(key, e.target.value)}
            />
          </label>
        ))}
      </div>
    </details>
  );
}
export function OptionalPropertyDetails({ p }) {
  const date = Date.parse(p.postedAt || "");
  const fields = [
    ["RERA number", p.reraNumber],
    ["Possession", p.possessionStatus],
    [
      "Property age",
      hasValue(p.propertyAge)
        ? Number(p.propertyAge) === 0
          ? "New property"
          : p.propertyAge + " years"
        : null,
    ],
    ["Total floors", p.totalFloors],
    ["Parking", p.parking],
    ["Ownership", p.ownershipType],
    [
      "Posted",
      Number.isFinite(date)
        ? new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : null,
    ],
    [
      "Price per sq ft",
      Number(p.area) > 0
        ? money(Number(p.price) / Number(p.area)) +
          (p.mode === "RENT" ? " / month" : "")
        : null,
    ],
  ].filter(([, value]) => hasValue(value));
  return fields.length ? (
    <div className="property-facts">
      {fields.map(([label, value]) => (
        <div key={label}>
          <small>{label}</small>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  ) : null;
}
export function EmiCalculator({ p }) {
  const [loan, setLoan] = useState(() => String(Math.round(p.price * 0.8))),
    [rate, setRate] = useState("9"),
    [tenure, setTenure] = useState("20");
  const valid =
    loan !== "" && rate !== "" && tenure !== "" && Number(loan) <= p.price;
  const monthly = valid ? emiPayment(loan, rate, tenure) : null;
  return (
    <section className="cost-breakdown" aria-label="EMI calculator">
      <h2>EMI calculator</h2>
      <div className="form-columns">
        <label>
          Loan amount (₹)
          <input
            type="number"
            min="0"
            max={p.price}
            value={loan}
            onChange={(e) => setLoan(e.target.value)}
          />
        </label>
        <label>
          Annual interest (%)
          <input
            type="number"
            min="0"
            max="30"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </label>
        <label>
          Tenure (years)
          <input
            type="number"
            min="1"
            max="40"
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
          />
        </label>
      </div>
      {monthly === null ? (
        <p role="alert" className="form-error">
          Enter a loan up to the asking price, a rate of 0–30%, and a tenure of
          1–40 years.
        </p>
      ) : (
        <p aria-live="polite">
          <strong>{money(monthly)}</strong> / month
        </p>
      )}
      <small>
        Illustrative estimate. Excludes fees and insurance; lender terms may
        differ.
      </small>
    </section>
  );
}
