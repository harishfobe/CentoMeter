import React, { useMemo, useState } from "react";
import { ArrowLeft, Check, MapPin, Plus } from "lucide-react";
import properties from "./data/properties.json";
import { RefineSearchPanel, readLocal, writeLocal } from "./Discovery";
import { localityPrice, orderedLocalities } from "./SearchSuggestions";

export default function SearchDiscovery({
  city,
  mode,
  filters,
  items,
  onBack,
  onApply,
  onModeChange,
  onAreaSelect,
  query,
}) {
  const [selected, setSelected] = useState(query || "");
  const [history, setHistory] = useState(() =>
    readLocal("centometer-search-history", []),
  );
  const current = useMemo(
    () => properties.filter((p) => p.city === city && p.mode === mode),
    [city, mode],
  );
  const localities = useMemo(() => {
    const groups = new Map();
    for (const item of current)
      groups.set(item.locality, (groups.get(item.locality) || 0) + 1);
    return orderedLocalities(
      city,
      [...groups].map(([name, count]) => ({ name, count })),
    );
  }, [current, city]);
  const localityDetail = ({ name, count }) => {
    const rate = mode === "BUY" ? localityPrice(current, name) : null;
    return rate
      ? `₹ ${rate.toLocaleString("en-IN")}/sq.ft.`
      : `${count} ${count === 1 ? "property" : "properties"}`;
  };
  const chooseArea = (name) => {
    setSelected((value) => (value === name ? "" : name));
  };
  const rememberArea = (name) => {
    const term = (name || "").trim();
    if (!term) return;
    const next = [
      { city, name: term },
      ...history.filter((x) => x.city !== city || x.name !== term),
    ].slice(0, 8);
    setHistory(next);
    writeLocal("centometer-search-history", next);
  };
  return (
    <section
      className="search-discovery refine-search-page"
      aria-label={`Refine search in ${city}`}
    >
      <div className="search-discovery-top refine-search-top">
        <button
          className="search-discovery-back"
          type="button"
          aria-label="Back to properties"
          onClick={onBack}
        >
          <ArrowLeft size={24} />
        </button>
        <h1>Refine your search</h1>
      </div>
      <div className="search-discovery-scroll">
        <RefineSearchPanel
          filters={filters}
          mode={mode}
          items={items}
          onModeChange={onModeChange}
          showActions={false}
          onApply={(f) => {
            rememberArea(selected);
            onAreaSelect?.(selected);
            onApply(f, selected);
          }}
        >
          {({ count, invalid, reset, apply }) => (
            <>
              <div className="search-discovery-section area-suggestions">
                <h2>Suggested areas</h2>
                <div
                  className="search-stack"
                  role="listbox"
                  aria-label={`Area suggestions in ${city}`}
                >
                  {localities.slice(0, 8).map((item) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected === item.name}
                      key={item.name}
                      className={
                        "search-mini-card area-card " +
                        (selected === item.name ? "selected" : "")
                      }
                      onClick={() => chooseArea(item.name)}
                    >
                      <span className="area-card-main">
                        <MapPin size={15} aria-hidden="true" />
                        <span>
                          <strong>{item.name}</strong>
                          <small>{localityDetail(item)}</small>
                        </span>
                      </span>
                      <span className="add-circle">
                        {selected === item.name ? (
                          <Check size={15} />
                        ) : (
                          <Plus size={15} />
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="search-discovery-footer refine-search-footer">
                <button
                  type="button"
                  className="text-button"
                  onClick={reset}
                >
                  Reset all
                </button>
                <button
                  type="button"
                  className="primary"
                  disabled={invalid}
                  onClick={apply}
                >
                  Show {count} properties
                </button>
              </div>
            </>
          )}
        </RefineSearchPanel>
      </div>
    </section>
  );
}
