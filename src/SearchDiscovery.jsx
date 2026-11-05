import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  LocateFixed,
  MapPin,
  Mic,
  Plus,
  Search,
  TrainFront,
  Trees,
  X,
} from "lucide-react";
import properties from "./properties.json";
import { nearText, priceBasis } from "./Journeys";
import { readLocal, writeLocal } from "./Discovery";
import {
  developerFor,
  localityPrice,
  orderedLocalities,
} from "./SearchSuggestions";

import { money } from "./PropertyModel";

export default function SearchDiscovery({
  city,
  cities,
  onCityChange,
  mode,
  query,
  onQueryChange,
  onBack,
  onSubmit,
  onProject,
  onNearMe,
  onLand,
  onNotice,
  landmarks,
}) {
  const [selected, setSelected] = useState("");
  const [showLandmarks, setShowLandmarks] = useState(false);
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
  }, [current]);
  const projects = useMemo(
    () =>
      [...current]
        .sort(
          (a, b) =>
            Number(
              b.seller === "Builder" &&
                !["Land", "Commercial"].includes(b.type),
            ) -
            Number(
              a.seller === "Builder" &&
                !["Land", "Commercial"].includes(a.type),
            ),
        )
        .slice(0, 8),
    [current],
  );
  const developers = useMemo(() => {
    const groups = new Map();
    for (const property of current) {
      const name = developerFor(property);
      if (name) groups.set(name, (groups.get(name) || 0) + 1);
    }
    return [...groups]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [current]);
  const recent = history.filter((x) => x.city === city).slice(0, 3);
  const localityDetail = ({ name, count }) => {
    const rate = mode === "BUY" ? localityPrice(current, name) : null;
    return rate
      ? `₹ ${rate.toLocaleString("en-IN")}/sq.ft.`
      : `${count} ${count === 1 ? "property" : "properties"}`;
  };
  const matches = useMemo(() => {
    const term = query.trim();
    if (!term) return [];
    const all = [
      ...localities.map((x) => ({
        name: x.name,
        detail: `${x.count} ${x.count === 1 ? "property" : "properties"}`,
        kind: "Locality",
      })),
      ...developers.map((x) => ({
        name: x.name,
        detail: `${x.count} ${x.count === 1 ? "project" : "projects"}`,
        kind: "Developer",
      })),
      ...landmarks.map(([name, locality]) => ({
        name,
        detail: locality,
        kind: "Landmark",
      })),
      ...current.map((p) => ({
        name: p.title,
        detail: p.locality,
        kind: "Property",
      })),
    ];
    return all
      .filter((x) => nearText(`${x.name} ${x.detail}`, term))
      .filter((x, i, a) => a.findIndex((y) => y.name === x.name) === i)
      .slice(0, 8);
  }, [query, localities, developers, landmarks, current]);
  React.useEffect(() => {
    setSelected("");
    setShowLandmarks(false);
  }, [city]);
  const choose = (name) => {
    onQueryChange("");
    setSelected((value) => (value === name ? "" : name));
  };
  const search = (term) => {
    const name = (term ?? (query.trim() || selected)).trim();
    if (name) {
      const next = [
        { city, name },
        ...history.filter((x) => x.city !== city || x.name !== name),
      ].slice(0, 8);
      setHistory(next);
      writeLocal("centometer-search-history", next);
    }
    onSubmit(name);
  };
  const voice = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onNotice("Voice search is unavailable in this browser");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.onresult = (event) => {
      onQueryChange(event.results[0][0].transcript);
      setSelected("");
    };
    recognition.onerror = () => onNotice("Voice search could not start");
    recognition.start();
  };
  const title = mode === "RENT" ? "Rent" : "Buy";
  return (
    <section
      className="search-discovery"
      aria-label={`Search properties in ${city}`}
    >
      <div className="search-discovery-scroll">
        <div className="search-discovery-top">
          <button
            className="search-discovery-back"
            type="button"
            aria-label="Back to properties"
            onClick={onBack}
          >
            <ArrowLeft size={24} />
          </button>
          <h1>
            {title} in{" "}
            <span className="search-city-picker">
              <select
                aria-label="Search city"
                value={city}
                onChange={(e) => onCityChange(e.target.value)}
              >
                {cities.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} aria-hidden="true" />
            </span>
          </h1>
          <form
            className="search-discovery-form"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              search();
            }}
          >
            <Search size={22} aria-hidden="true" />
            <input
              aria-label="Search by project, locality or developer"
              placeholder="Search by project, locality, developer..."
              autoComplete="off"
              enterKeyHint="search"
              value={query}
              onChange={(e) => {
                onQueryChange(e.target.value);
                setSelected("");
              }}
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => onQueryChange("")}
              >
                <X size={20} />
              </button>
            ) : (
              <button type="button" aria-label="Voice search" onClick={voice}>
                <Mic size={21} />
              </button>
            )}
          </form>
        </div>
        {query.trim() ? (
          <div className="search-discovery-section matching-section">
            <h2>Matching places</h2>
            {matches.length ? (
              <div
                className="search-discovery-matches"
                role="listbox"
                aria-label="Search suggestions"
              >
                {matches.map((item) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected === item.name}
                    key={item.kind + item.name}
                    onClick={() => {
                      onQueryChange(item.name);
                      setSelected(item.name);
                    }}
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
                    <Plus size={18} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="search-discovery-empty">
                No matching sample places. Press Show results to search this term.
              </p>
            )}
          </div>
        ) : (
          <>
            <div
              className="search-discovery-shortcuts"
              aria-label="Quick searches"
            >
              <button type="button" onClick={onNearMe}>
                <LocateFixed size={19} />
                Near Me Properties
              </button>
              <button
                type="button"
                aria-expanded={showLandmarks}
                onClick={() => setShowLandmarks((x) => !x)}
              >
                <TrainFront size={19} />
                Near Landmarks
              </button>
              <button type="button" onClick={onLand}>
                <Trees size={19} />
                Land Plots
              </button>
            </div>
            {showLandmarks && (
              <div className="search-discovery-section landmark-section">
                <h2>Near landmarks</h2>
                <div className="search-chip-grid">
                  {landmarks.map(([name, locality]) => (
                    <button
                      type="button"
                      key={name}
                      className={selected === locality ? "selected" : ""}
                      onClick={() => choose(locality)}
                    >
                      <span>
                        {name}
                        <small>{locality}</small>
                      </span>
                      <span className="add-circle">
                        {selected === locality ? (
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
            {recent.length > 0 && (
              <div className="search-discovery-section">
                <h2>Recent searches</h2>
                <div className="search-chip-grid">
                  {recent.map(({ name }) => (
                    <button
                      type="button"
                      key={name}
                      className={selected === name ? "selected" : ""}
                      onClick={() => choose(name)}
                    >
                      <span>{name}</span>
                      <span className="add-circle">
                        {selected === name ? (
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
            <div className="search-discovery-section">
              <h2>Trending searches</h2>
              <div className="search-chip-grid">
                {localities.slice(0, 5).map(({ name }) => (
                  <button
                    type="button"
                    key={name}
                    className={selected === name ? "selected" : ""}
                    onClick={() => choose(name)}
                  >
                    <span>{name}</span>
                    <span className="add-circle">
                      {selected === name ? (
                        <Check size={15} />
                      ) : (
                        <Plus size={15} />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="search-discovery-section">
              <h2>Popular localities</h2>
              <div
                className="search-stack"
                aria-label={`Localities in ${city}`}
              >
                {localities.slice(0, 8).map((item) => (
                  <button
                    type="button"
                    key={item.name}
                    className={
                      "search-mini-card " +
                      (selected === item.name ? "selected" : "")
                    }
                    onClick={() => choose(item.name)}
                  >
                    <span className="mini-heading">
                      <strong>{item.name}</strong>
                      <span className="add-circle">
                        {selected === item.name ? (
                          <Check size={15} />
                        ) : (
                          <Plus size={15} />
                        )}
                      </span>
                    </span>
                    <small>{localityDetail(item)}</small>
                  </button>
                ))}
              </div>
            </div>
            {developers.length > 0 && (
              <div className="search-discovery-section">
                <h2>Top developers</h2>
                <div
                  className="search-stack"
                  aria-label={`Developers in ${city}`}
                >
                  {developers.map(({ name, count }) => (
                    <button
                      type="button"
                      key={name}
                      className="search-mini-card builder-card"
                      onClick={() => search(name)}
                    >
                      <span className="mini-heading">
                        <strong>{name}</strong>
                        <span className="add-circle">
                          <ArrowUpRight size={14} />
                        </span>
                      </span>
                      <small>
                        {count} {count === 1 ? "project" : "projects"}
                      </small>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="search-discovery-section projects-section">
              <div className="section-head">
                <h2>
                  {mode === "RENT" ? "Places for rent" : `Top projects`} in{" "}
                  {city}
                </h2>
                <button type="button" onClick={() => search("")}>
                  View all
                </button>
              </div>
              <div className="search-stack project-strip">
                {projects.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    className="search-project"
                    onClick={() => onProject(p)}
                    aria-label={`View ${p.title}`}
                  >
                    <img
                      src={`/${p.image}.jpg`}
                      width="80"
                      height="60"
                      decoding="async"
                      alt=""
                      loading="lazy"
                    />
                    <span className="project-copy">
                      <strong>{p.title}</strong>
                      <small>{p.locality}</small>
                      <em>{mode === "RENT" ? "Rent" : "Starting from"}</em>
                      <b>
                        {money(p.price)}
                        {priceBasis(p)}
                      </b>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="search-discovery-footer">
        <button type="button" className="primary" onClick={() => search()}>
          Show results <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
