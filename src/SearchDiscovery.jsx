import React, { useMemo, useState } from "react";
import { ArrowLeft, Check, MapPin, Plus, Search } from "lucide-react";
import properties from "./data/properties.json";
import { landmarkSuggestions } from "./data/cities";
import {
  RefineSearchPanel,
  matches,
  matchesSearchTerm,
  readLocal,
  writeLocal,
} from "./Discovery";
import { nearText } from "./Journeys";
import { money } from "./PropertyModel";
import { priceWithBasis } from "./listingPresentation";
import { typeLabel } from "./PropertyTypes";
import { localityPrice, orderedLocalities } from "./SearchSuggestions";

const photo = (p) => p.photos?.[0] || `/${p.image || "apartment"}.jpg`;

export default function SearchDiscovery({
  city,
  mode,
  filters,
  items,
  onBack,
  onApply,
  onOpen,
  query,
}) {
  const [text, setText] = useState(query || "");
  const [history, setHistory] = useState(() =>
    readLocal("centometer-search-history", []),
  );
  const cityListings = useMemo(
    () => properties.filter((property) => property.city === city),
    [city],
  );
  const rememberArea = (name) => {
    const term = (name || "").trim();
    if (!term) return;
    const next = [
      { city, name: term },
      ...history.filter((entry) => entry.city !== city || entry.name !== term),
    ].slice(0, 8);
    setHistory(next);
    writeLocal("centometer-search-history", next);
  };
  return (
    <section
      className="search-discovery refine-search-page refine-sheet"
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
        <form
          className="search-discovery-form"
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <Search size={20} aria-hidden="true" />
          <input
            role="combobox"
            aria-label="Search by locality, landmark or project"
            aria-autocomplete="list"
            aria-expanded={Boolean(text.trim())}
            aria-controls="refine-search-suggestions"
            placeholder="Locality, landmark or project"
            autoComplete="off"
            enterKeyHint="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </form>
      </div>
      <RefineSearchPanel
        filters={filters}
        mode={mode}
        items={items}
        listings={cityListings}
        area={text.trim()}
        deferMode
        showActions={false}
        onApply={(nextFilters, intent) => {
          const term = text.trim();
          rememberArea(term);
          onApply(nextFilters, term, intent);
        }}
        renderActions={({ count, invalid, reset, apply }) => (
          <div className="search-discovery-footer refine-search-footer">
            <button
              type="button"
              className="text-button"
              aria-label="Reset all filters"
              onClick={() => {
                reset();
                setText("");
              }}
            >
              Reset all
            </button>
            <button
              type="button"
              className="primary"
              disabled={invalid}
              onClick={apply}
            >
              Show {count} {count === 1 ? "property" : "properties"}
            </button>
          </div>
        )}
      >
        {({ f, intent }) => {
          const modeListings = cityListings.filter(
            (property) => property.mode === intent,
          );
          const groups = new Map();
          for (const property of modeListings)
            groups.set(
              property.locality,
              (groups.get(property.locality) || 0) + 1,
            );
          const localities = orderedLocalities(
            city,
            [...groups].map(([name, count]) => ({ name, count })),
          );
          const localityDetail = ({ name, count }) => {
            const rate =
              intent === "BUY" ? localityPrice(modeListings, name) : null;
            return rate
              ? `₹ ${rate.toLocaleString("en-IN")}/sq.ft.`
              : `${count} ${count === 1 ? "property" : "properties"}`;
          };
          const term = text.trim();
          const suggestions = term
            ? [
                ...localities.map((item) => ({
                  name: item.name,
                  detail: localityDetail(item),
                  kind: "Locality",
                })),
                ...(landmarkSuggestions[city] || []).map(
                  ([name, locality]) => ({
                    name,
                    detail: locality,
                    kind: "Landmark",
                  }),
                ),
                ...modeListings.map((property) => ({
                  name: property.title,
                  detail: property.locality,
                  kind: "Project",
                })),
              ]
                .filter((item) => nearText(`${item.name} ${item.detail}`, term))
                .filter(
                  (item, index, all) =>
                    all.findIndex(
                      (other) =>
                        other.kind === item.kind && other.name === item.name,
                    ) === index,
                )
                .slice(0, 8)
            : [];
          const suggested = modeListings
            .filter(
              (property) =>
                matches(property, f) && matchesSearchTerm(property, term),
            )
            .slice(0, 8);
          return (
            <>
              {term ? (
                <div className="search-discovery-section matching-section">
                  <h2>Matching places</h2>
                  {suggestions.length ? (
                    <div
                      id="refine-search-suggestions"
                      className="search-discovery-matches"
                      role="listbox"
                      aria-label="Search suggestions"
                    >
                      {suggestions.map((item) => (
                        <button
                          type="button"
                          role="option"
                          aria-selected={text === item.name}
                          key={item.kind + item.name}
                          onClick={() => setText(item.name)}
                        >
                          <span className="match-icon">
                            <MapPin size={17} />
                          </span>
                          <span>
                            <strong>{item.name}</strong>
                            <small>
                              {item.kind} · {item.detail}
                            </small>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="search-discovery-empty">
                      No matching places. Show results still searches this term.
                    </p>
                  )}
                </div>
              ) : (
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
                        aria-selected={text === item.name}
                        key={item.name}
                        className={
                          "search-mini-card area-card " +
                          (text === item.name ? "selected" : "")
                        }
                        onClick={() =>
                          setText((value) =>
                            value === item.name ? "" : item.name,
                          )
                        }
                      >
                        <span className="area-card-main">
                          <MapPin size={15} aria-hidden="true" />
                          <span>
                            <strong>{item.name}</strong>
                            <small>{localityDetail(item)}</small>
                          </span>
                        </span>
                        <span className="add-circle">
                          {text === item.name ? (
                            <Check size={15} />
                          ) : (
                            <Plus size={15} />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {suggested.length > 0 && (
                <div className="search-discovery-section suggested-properties">
                  <h2>Suggested properties</h2>
                  <div
                    className="suggested-property-carousel"
                    role="list"
                    aria-label={`Suggested properties in ${city}`}
                  >
                    {suggested.map((property) => (
                      <div role="listitem" key={property.id}>
                        <button
                          type="button"
                          className="suggested-property-card"
                          onClick={() => onOpen?.(property)}
                          aria-label={`View ${property.title}`}
                        >
                          <img
                            src={photo(property)}
                            alt=""
                            width="280"
                            height="160"
                            loading="lazy"
                            decoding="async"
                          />
                          <span className="suggested-property-copy">
                            <em>
                              {typeLabel(property.type)}
                              {property.locality ? ` · ${property.locality}` : ""}
                            </em>
                            <strong>{property.title}</strong>
                            <b>
                              {priceWithBasis(property, { formatMoney: money })}
                            </b>
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          );
        }}
      </RefineSearchPanel>
    </section>
  );
}
