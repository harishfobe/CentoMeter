import React, { useRef, useState } from "react";
import FinderChips from "./FinderChips";
import { cityNames } from "../../data/cities";
export const cities = cityNames;
export const sorts = [
  ["recommended", "Recommended"],
  ["fast", "Fastest reply"],
  ["count", "Most listings"],
  ["experience", "Most experienced"],
  ["new", "Newest"],
];
export const budgetOptions = (mode) =>
  mode === "RENT"
    ? [
        ["0:20000", "Under 20k"],
        ["20000:50000", "20–50k"],
        ["50000:100000", "50k–1 L"],
        ["100000:Infinity", "1 L+"],
      ]
    : [
        ["0:5000000", "Under 50 L"],
        ["5000000:10000000", "50 L–1 Cr"],
        ["10000000:20000000", "1–2 Cr"],
        ["20000000:Infinity", "2 Cr+"],
      ];
export default function FinderFilterSheet({
  Modal,
  kind,
  f,
  set,
  reset,
  count,
  close,
  areas,
  languages,
  specialties,
}) {
  const [search, setSearch] = useState("");
  const start = useRef(null);
  const section = (key, title, options, multiple = false, radio = false) => (
    <fieldset>
      <legend>{title}</legend>
      <FinderChips
        label={title}
        options={options}
        value={f[key] || (multiple ? [] : "")}
        onChange={(value) => set(key, value)}
        multiple={multiple}
        radio={radio}
      />
    </fieldset>
  );
  return (
    <div className="finder-sheet">
      <Modal
        title={
          kind === "city" ? "City" : kind === "sort" ? "Sort agents" : "Filters"
        }
        onClose={close}
      >
        <div
          className="finder-drag-handle"
          aria-hidden="true"
          onPointerDown={(e) => {
            start.current = e.clientY;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerUp={(e) => {
            if (start.current !== null && e.clientY - start.current > 120)
              close();
            start.current = null;
          }}
        >
          <span />
        </div>
        <div className="finder-sheet-reset">
          <button onClick={reset}>Reset</button>
        </div>
        <div className="finder-sheet-body">
          {kind === "sort" ? (
            section("sort", "Sort by", sorts, false, true)
          ) : kind === "city" ? (
            section("city", "City", [["", "Any"], ...cities], false, true)
          ) : (
            <>
              {section("city", "City", [["", "Any"], ...cities])}
              <fieldset>
                <legend>Service area</legend>
                {areas.length > 8 && (
                  <input
                    aria-label="Search service areas"
                    placeholder="Search areas"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                )}
                <FinderChips
                  label="Service area"
                  options={areas.filter((x) =>
                    x.toLowerCase().includes(search.toLowerCase()),
                  )}
                  value={f.locality || []}
                  multiple
                  onChange={(v) => set("locality", v)}
                />
              </fieldset>
              {section("language", "Language", languages, true)}
              {section("specialty", "Specialty", specialties, true)}
              {section(
                "response",
                "Responds within",
                [
                  ["", "Any"],
                  ["60", "1 hour"],
                  ["240", "4 hours"],
                  ["1440", "1 day"],
                ],
                false,
                true,
              )}
              {section(
                "experience",
                "Experience",
                [
                  ["", "Any"],
                  ["3", "3+ yrs"],
                  ["5", "5+ yrs"],
                  ["10", "10+ yrs"],
                ],
                false,
                true,
              )}
              {section(
                "count",
                "Active listings",
                [
                  ["", "Any"],
                  ["1", "1+"],
                  ["5", "5+"],
                ],
                false,
                true,
              )}
              <label className="finder-switch">
                Verified only
                <input
                  type="checkbox"
                  role="switch"
                  checked={!!f.verified}
                  onChange={(e) => set("verified", e.target.checked)}
                />
              </label>
              {section(
                "mode",
                "Budget",
                [
                  ["BUY", "Buy"],
                  ["RENT", "Rent"],
                ],
                false,
                true,
              )}
              {section("budget", "Price range", budgetOptions(f.mode))}
            </>
          )}
        </div>
        <footer>
          <button className="primary" disabled={!count} onClick={close}>
            {count
              ? `Show ${count} ${count === 1 ? "agent" : "agents"}`
              : "No agents match"}
          </button>
          <button onClick={reset}>Reset</button>
        </footer>
      </Modal>
    </div>
  );
}
