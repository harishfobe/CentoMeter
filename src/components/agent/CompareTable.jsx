import React from "react";
import { money } from "../../PropertyModel";
import { statusLabel } from "../../lib/agents";
export default function CompareTable({ items, onClear }) {
  return (
    <details className="agent-compare">
      <summary>
        Compare {items.length} / 3{" "}
        {items.length === 1 ? "property" : "properties"}
      </summary>
      <div className="agent-compare-scroll">
        <table>
          <caption>Property comparison</caption>
          <thead>
            <tr>
              <th scope="col">Feature</th>
              {items.map((p) => (
                <th scope="col" key={p.id}>
                  {p.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              [
                "Price",
                (p) => money(p.price) + (p.mode === "RENT" ? " / month" : ""),
              ],
              ["Area", (p) => p.area.toLocaleString("en-IN") + " sq ft"],
              [
                "Price per sq ft",
                (p) => (p.area > 0 ? money(p.price / p.area) : "Not supplied"),
              ],
              [
                "Possession",
                (p) => p.possessionStatus || p.available || "Not supplied",
              ],
              ["Status", (p) => statusLabel(p.status)],
            ].map(([label, value]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                {items.map((p) => (
                  <td key={p.id}>{value(p)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="secondary" onClick={onClear}>
        Clear comparison
      </button>
    </details>
  );
}
