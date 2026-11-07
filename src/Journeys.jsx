import { visitDates } from "./JourneyUX";
import { typeLabel } from "./PropertyTypes";
import React, { useState } from "react";

/** Suffix-only price basis for legacy call sites (" / month"). Prefer listingPresentation.priceWithBasis. */
export const priceBasis = (p) => {
  if (p?.mode !== "RENT") return "";
  if (p.type === "PG") {
    return p.occupancy === "Private room"
      ? " / room / month"
      : " / bed / month";
  }
  return " / month";
};

/** Area basis noun only. Prefer listingPresentation.areaWithBasis for labelled amounts. */
export const areaBasis = (p) => {
  if (p?.type === "Land") return "plot area";
  if (p?.type === "Commercial") {
    if (p.mode === "RENT" && /land|plot/i.test(String(p.subtype || ""))) {
      return "plot area";
    }
    if (p.mode === "RENT" && p.carpetArea) return "carpet area";
    return "built-up area";
  }
  if (p?.type === "PG") return "room area";
  return "built-up area";
};
export function nearText(text, query) {
  const a = text.toLowerCase(),
    b = query.trim().toLowerCase();
  if (!b || a.includes(b)) return true;
  if (b.length < 4 || b.includes(" ")) return false;
  return a.split(/\W+/).some((word) => {
    if (Math.abs(word.length - b.length) > 1) return false;
    const rows = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= word.length; j++) rows[0][j] = j;
    for (let i = 1; i <= b.length; i++)
      for (let j = 1; j <= word.length; j++)
        rows[i][j] = Math.min(
          rows[i - 1][j] + 1,
          rows[i][j - 1] + 1,
          rows[i - 1][j - 1] + (b[i - 1] === word[j - 1] ? 0 : 1),
        );
    return rows[b.length][word.length] <= 1;
  });
}
export { distanceKm } from "./PropertyModel";
export function SearchLibrary({ entries, onChange, onOpen }) {
  return (
    <div className="form-stack">
      {entries.length ? (
        entries.map((entry, i) => (
          <form
            className="library-item"
            key={entry.id || i}
            onSubmit={(e) => {
              e.preventDefault();
              const name = new FormData(e.currentTarget).get("name").trim();
              if (!name) return;
              onChange(entries.map((x, j) => (j === i ? { ...x, name } : x)));
            }}
          >
            <label>
              Search name
              <input
                name="name"
                required
                maxLength="70"
                defaultValue={entry.name || `${entry.city} · ${entry.mode}`}
                key={entry.name}
              />
            </label>
            <p>
              {entry.query || entry.city} · {entry.mode} ·{" "}
              {typeLabel(entry.filters?.type || "All")} ·{" "}
              {entry.bounds ? "Saved map area" : "Entire city"}
            </p>
            <div className="action-row">
              <button className="secondary" type="submit">
                Rename
              </button>
              <button
                className="primary"
                type="button"
                onClick={() => onOpen(entry)}
              >
                Open & edit filters
              </button>
              <button
                className="text-button"
                type="button"
                onClick={() => onChange(entries.filter((_, j) => j !== i))}
              >
                Remove
              </button>
            </div>
          </form>
        ))
      ) : (
        <p>
          Use Save search on the map or results to keep your criteria and search
          area.
        </p>
      )}
      <p className="fine-print">
        Names, filters and map boundaries are saved on this device. No alerts
        are sent.
      </p>
    </div>
  );
}
export function Visits({ items, onChange, onOpen }) {
  const [editing, setEditing] = useState(null);
  return (
    <div className="form-stack">
      {items.length ? (
        items.map((a) => (
          <article className="library-item" key={a.id}>
            <h3>{a.title}</h3>
            {onOpen && (
              <button className="secondary" onClick={() => onOpen(a)}>
                View property
              </button>
            )}
            <p>
              {a.kind} · {a.status}
            </p>
            {a.date && (
              <p>
                {a.date} · {a.slot} IST
              </p>
            )}
            <small>
              {a.person} · Preferred contact: {a.method}
            </small>
            {a.status !== "Cancelled" && a.date && (
              <div className="action-row">
                <button className="secondary" onClick={() => setEditing(a.id)}>
                  Reschedule
                </button>
                <button
                  className="text-button"
                  onClick={() => {
                    setEditing(null);
                    onChange(
                      items.map((x) =>
                        x.id === a.id ? { ...x, status: "Cancelled" } : x,
                      ),
                    );
                  }}
                >
                  Cancel request
                </button>
                {a.status !== "Confirmed" && (
                  <button
                    className="text-button"
                    onClick={() =>
                      onChange(
                        items.map((x) =>
                          x.id === a.id ? { ...x, status: "Confirmed" } : x,
                        ),
                      )
                    }
                  >
                    Simulate confirmation
                  </button>
                )}
              </div>
            )}
            {editing === a.id && (
              <form
                className="form-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  onChange(
                    items.map((x) =>
                      x.id === a.id
                        ? {
                            ...x,
                            date: f.get("date"),
                            slot: f.get("slot"),
                            status: "Rescheduled",
                          }
                        : x,
                    ),
                  );
                  setEditing(null);
                }}
              >
                <label>
                  New date
                  <input
                    name="date"
                    type="date"
                    required
                    min={visitDates()[0].value}
                    defaultValue={a.date}
                  />
                </label>
                <label>
                  New time
                  <select name="slot" defaultValue={a.slot}>
                    {["10:00 AM", "12:00 PM", "4:00 PM"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <button className="primary">Save new time</button>
              </form>
            )}
            <p className="fine-print">
              Simulation only. No appointment booked or message sent.
            </p>
          </article>
        ))
      ) : (
        <p>
          Your visit requests and enquiries will appear here. Try one from a
          property’s details.
        </p>
      )}
    </div>
  );
}
