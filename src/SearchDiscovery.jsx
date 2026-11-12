import React, { useMemo, useState } from "react";
import { ArrowLeft, Check, MapPin, Plus } from "lucide-react";
import properties from "./data/properties.json";
import { featuredAreas, landmarkSuggestions } from "./data/cities";
import {
  RefineSearchPanel,
  matches,
  matchesSearchTerm,
  readLocal,
  writeLocal,
} from "./Discovery";
import { nearText } from "./Journeys";
import { cityForLocation, distanceKm, money } from "./PropertyModel";
import { priceWithBasis } from "./listingPresentation";
import { typeLabel } from "./PropertyTypes";
import { localityPrice, orderedLocalities } from "./SearchSuggestions";

function nearestListedArea(point) {
  const foundCity = cityForLocation(point);
  const pool = properties.filter(
    (property) =>
      property.locality &&
      Number.isFinite(property.lat) &&
      Number.isFinite(property.lng) &&
      (!foundCity || property.city === foundCity),
  );
  let nearest = null;
  let best = Infinity;
  for (const property of pool) {
    const distance = distanceKm(point, [property.lat, property.lng]);
    if (distance < best) {
      best = distance;
      nearest = property;
    }
  }
  return { city: foundCity, label: nearest?.locality || foundCity || "" };
}

const photo = (p) => p.photos?.[0] || `/${p.image || "apartment"}.jpg`;

export default function SearchDiscovery({
  city,
  mode,
  filters,
  items,
  onBack,
  onApply,
  onOpen,
  onOpenAgents,
  onCityChange,
  query,
}) {
  const [text, setText] = useState(query || "");
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [located, setLocated] = useState(false);
  const [locateError, setLocateError] = useState("");
  const [draftIntent, setDraftIntent] = useState(
    mode === "RENT" ? "RENT" : "BUY",
  );
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
  const useCurrentLocation = () => {
    setLocateError("");
    if (!navigator.geolocation) {
      setLocateError("Location is unavailable in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = [position.coords.latitude, position.coords.longitude];
        const place = nearestListedArea(point);
        setLocating(false);
        if (!place.label) {
          setLocated(false);
          setLocateError("No listed area near this location.");
          return;
        }
        if (place.city && place.city !== city) onCityChange?.(place.city);
        setText(place.label);
        setLocated(true);
        setOpen(false);
      },
      () => {
        setLocating(false);
        setLocated(false);
        setLocateError("Allow location access to use your current location.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };
  const term = text.trim();
  const suggestions = useMemo(() => {
    if (!term) return [];
    const modeListings = cityListings.filter(
      (property) => property.mode === draftIntent,
    );
    const groups = new Map();
    for (const property of modeListings)
      groups.set(property.locality, (groups.get(property.locality) || 0) + 1);
    const localities = orderedLocalities(
      city,
      [...groups].map(([name, count]) => ({ name, count })),
    );
    const detail = (item) => {
      const rate =
        draftIntent === "BUY" ? localityPrice(modeListings, item.name) : null;
      return rate
        ? `₹ ${rate.toLocaleString("en-IN")}/sq.ft.`
        : `${item.count} ${item.count === 1 ? "property" : "properties"}`;
    };
    return [
      ...localities.map((item) => ({
        name: item.name,
        detail: detail(item),
        kind: "Locality",
      })),
      ...(landmarkSuggestions[city] || []).map(([name, locality]) => ({
        name,
        detail: locality,
        kind: "Landmark",
      })),
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
            (other) => other.kind === item.kind && other.name === item.name,
          ) === index,
      )
      .slice(0, 8);
  }, [term, city, cityListings, draftIntent]);
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
        <div className="refine-search-field">
          <form
            className="search-discovery-form"
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <button
              type="button"
              className="search-locate"
              aria-label="Use current location"
              aria-pressed={located}
              aria-busy={locating}
              disabled={locating}
              onClick={useCurrentLocation}
            >
              <img src="/centometer-pin.png" alt="" width="18" height="22" />
            </button>
            <input
              role="combobox"
              aria-label="Search by locality, landmark or project"
              aria-autocomplete="list"
              aria-expanded={open && Boolean(term)}
              aria-controls="refine-search-suggestions"
              placeholder="Locality, landmark or property"
              autoComplete="off"
              enterKeyHint="search"
              value={text}
              onFocus={() => setOpen(true)}
              onChange={(event) => {
                setText(event.target.value);
                setLocated(false);
                setLocateError("");
                setOpen(true);
              }}
            />
          </form>
          {locateError && (
            <p className="search-locate-error" role="alert">
              {locateError}
            </p>
          )}
          {open && term && (
            <div
              id="refine-search-suggestions"
              className="search-suggestions"
              role="listbox"
              aria-label="Search suggestions"
            >
              {suggestions.length ? (
                suggestions.map((item) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={text === item.name}
                    className="suggestion-option"
                    key={item.kind + item.name}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setText(item.name);
                      setOpen(false);
                    }}
                  >
                    <span className="suggestion-icon">
                      <MapPin size={17} />
                    </span>
                    <span>
                      <strong>{item.name}</strong>
                      <small>
                        {item.kind} · {item.detail}
                      </small>
                    </span>
                  </button>
                ))
              ) : (
                <p className="suggestion-empty">No matching places.</p>
              )}
            </div>
          )}
        </div>
      </div>
      <RefineSearchPanel
        filters={filters}
        mode={mode}
        items={items}
        listings={cityListings}
        area={text.trim()}
        deferMode
        onDraftIntent={setDraftIntent}
        beforeTabs={
          (featuredAreas[city] || []).length > 0 && (
            <div
              className="refine-shortcut-row"
              role="group"
              aria-label="Main areas"
            >
              {featuredAreas[city].map((name) => (
                <button
                  type="button"
                  key={name}
                  aria-pressed={text === name}
                  onClick={() => {
                    setText((value) => (value === name ? "" : name));
                    setLocated(false);
                    setOpen(false);
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          )
        }
        afterTabs={({ f, intent }) => (
          <div className="refine-shortcut-row" role="group" aria-label="Nearby">
            <button
              type="button"
              onClick={() => {
                setText("");
                setOpen(false);
                onApply(f, "", intent);
              }}
            >
              Property nearby
            </button>
            <button type="button" onClick={onOpenAgents}>
              Agents nearby
            </button>
            <button
              type="button"
              onClick={() => {
                const area = text.trim();
                rememberArea(area);
                onApply({ ...f, seller: "Builder" }, area, intent);
              }}
            >
              Projects nearby
            </button>
          </div>
        )}
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
                setOpen(false);
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
          const suggested = modeListings
            .filter(
              (property) =>
                matches(property, f) && matchesSearchTerm(property, term),
            )
            .slice(0, 8);
          return (
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
                        aria-selected={text === item.name}
                        key={item.name}
                        className={
                          "search-mini-card area-card " +
                          (text === item.name ? "selected" : "")
                        }
                        onClick={() => {
                          setText((value) =>
                            value === item.name ? "" : item.name,
                          );
                          setOpen(text !== item.name);
                        }}
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
