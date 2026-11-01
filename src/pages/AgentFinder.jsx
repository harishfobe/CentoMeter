import { useScrollPolish, useMinimumSkeleton } from "../lib/agentMotion";
import MotionSkeleton from "../components/agent/MotionSkeleton";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { agents, listings, findAgents } from "../lib/agents";
import { readLocal } from "../Discovery";
import { cityForLocation } from "../PropertyModel";
import AgentCard from "../components/agent/AgentCard";
const empty = { query: "", city: "", sort: "recommended" };
const groups = [
  ["city", "City", ["Bengaluru", "Hyderabad", "Pune"]],
  [
    "locality",
    "Service area",
    [...new Set(agents.flatMap((a) => a.serviceAreas))],
  ],
  [
    "language",
    "Languages",
    ["English", "Hindi", "Kannada", "Marathi", "Telugu"],
  ],
  [
    "specialty",
    "Specialties",
    ["Apartments", "Villas", "Plots", "Rentals", "Commercial", "PG"],
  ],
  [
    "response",
    "Responds within",
    [
      ["60", "1 hour"],
      ["240", "4 hours"],
      ["1440", "1 day"],
    ],
  ],
  [
    "experience",
    "Experience",
    [
      ["3", "3+ years"],
      ["5", "5+ years"],
      ["10", "10+ years"],
    ],
  ],
  [
    "count",
    "Active listings",
    [
      ["1", "1+ listing"],
      ["5", "5+ listings"],
    ],
  ],
];
export default function AgentFinder({ onNavigate, Modal }) {
  const host = useRef(null);
  useScrollPolish(host);
  const ready = useMinimumSkeleton("finder");
  const [filtersOpen, setFiltersOpen] = useState(false),
    [f, setF] = useState({ ...empty }),
    [input, setInput] = useState(""),
    [nearby, setNearby] = useState(""),
    [locating, setLocating] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setF((x) => ({ ...x, query: input })), 250);
    return () => clearTimeout(timer);
  }, [input]);
  const rows = useMemo(() => findAgents(agents, f), [f]);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const toggle = (key, value) => {
    if (["language", "specialty"].includes(key)) {
      const values = f[key] || [];
      set(
        key,
        values.includes(value)
          ? values.filter((v) => v !== value)
          : [...values, value],
      );
    } else set(key, f[key] === value ? "" : value);
  };
  const nearMe = () => {
    const fallback = (reason) => {
      const city = readLocal("centometer-city", null) || f.city || "Bengaluru";
      set("city", city);
      setNearby(reason + " Using " + city + " as the city fallback.");
      setLocating(false);
    };
    setLocating(true);
    setNearby("Finding your city using device geolocation…");
    if (!navigator.geolocation) {
      fallback("Geolocation is unavailable.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const city = cityForLocation([
          position.coords.latitude,
          position.coords.longitude,
        ]);
        if (!city) {
          fallback("No supported city near this location.");
          return;
        }
        set("city", city);
        setNearby("Using geolocation: agents in " + city + ".");
        setLocating(false);
      },
      () => fallback("Location access was denied or unavailable."),
      { timeout: 10000, maximumAge: 300000 },
    );
  };
  const suggestions = [
    [
      "Agents",
      agents
        .filter((a) =>
          [a.name, a.handle]
            .join(" ")
            .toLowerCase()
            .includes(input.toLowerCase()),
        )
        .map((a) => a.name),
    ],
    [
      "Localities",
      [...new Set(agents.flatMap((a) => a.serviceAreas))].filter((x) =>
        x.toLowerCase().includes(input.toLowerCase()),
      ),
    ],
    [
      "Languages",
      [...new Set(agents.flatMap((a) => a.languages))].filter((x) =>
        x.toLowerCase().includes(input.toLowerCase()),
      ),
    ],
  ].filter(([, values]) => values.length);
  return (
    <section ref={host} className="page agent-finder agent-feature">
      <h1>Find your local expert</h1>
      <div className="agent-filter-bar">
        <input
          aria-label="Find agents, locality or language"
          placeholder="Name, locality or language"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <select
          aria-label="Sort agents"
          value={f.sort}
          onChange={(e) => set("sort", e.target.value)}
        >
          {[
            ["recommended", "Recommended"],
            ["fast", "Fastest response"],
            ["count", "Most listings"],
            ["experience", "Most experienced"],
            ["new", "Newest"],
          ].map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
        <button className="secondary" onClick={() => setFiltersOpen(true)}>
          More finder filters
        </button>
      </div>
      <div className="chips" aria-label="Quick city filters">
        {["Bengaluru", "Hyderabad", "Pune"].map((city) => (
          <button
            className="chip"
            aria-pressed={f.city === city}
            key={city}
            onClick={() => toggle("city", city)}
          >
            {city}
          </button>
        ))}
      </div>
      {filtersOpen && (
        <div className="agent-filter-sheet">
          <Modal title="Find an agent" onClose={() => setFiltersOpen(false)}>
            <div className="form-stack">
              {groups.map(([key, label, values]) => (
                <fieldset key={key}>
                  <legend>{label}</legend>
                  <div className="chips">
                    {values.map((option) => {
                      const [value, text] = Array.isArray(option)
                        ? option
                        : [option, option];
                      const selected = Array.isArray(f[key])
                        ? f[key].includes(value)
                        : f[key] === value;
                      return (
                        <button
                          type="button"
                          className="chip"
                          aria-pressed={selected}
                          key={value}
                          onClick={() => toggle(key, value)}
                        >
                          {text}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
              <label>
                <input
                  type="checkbox"
                  checked={!!f.verified}
                  onChange={(e) => set("verified", e.target.checked)}
                />
                Verified only
              </label>
              <label>
                Maximum listing budget (₹)
                <input
                  type="number"
                  min="0"
                  value={f.budget || ""}
                  onChange={(e) => set("budget", e.target.value)}
                />
              </label>
              <button
                className="secondary"
                onClick={() => {
                  setInput("");
                  setF({ ...empty, sort: f.sort });
                }}
              >
                Clear filters
              </button>
              <button className="primary" onClick={() => setFiltersOpen(false)}>
                Show {rows.length} {rows.length === 1 ? "agent" : "agents"}
              </button>
            </div>
          </Modal>
        </div>
      )}
      {input && suggestions.length > 0 && (
        <div className="agent-suggestions" aria-label="Search suggestions">
          {suggestions.map(([label, values]) => (
            <section key={label}>
              <strong>{label}</strong>
              {values.slice(0, 3).map((value) => (
                <button
                  className="secondary"
                  key={value}
                  onClick={() => setInput(value)}
                >
                  {value}
                </button>
              ))}
            </section>
          ))}
        </div>
      )}
      <div className="action-row">
        <button className="secondary" onClick={() => set("sort", "new")}>
          New agents
        </button>
        <button className="secondary" onClick={() => set("sort", "fast")}>
          Fastest to reply
        </button>
        <button className="secondary" disabled={locating} onClick={nearMe}>
          Agents near me · use geolocation
        </button>
      </div>
      <p className="fine-print">
        Uses device geolocation to find your city; falls back to your selected
        city if unavailable.
      </p>
      {nearby && <p role="status">{nearby}</p>}
      <p aria-live="polite">
        {rows.length} {rows.length === 1 ? "agent" : "agents"}
      </p>
      <div
        className="agent-grid agent-skeleton-shell"
        aria-busy={input !== f.query}
      >
        <MotionSkeleton ready={ready} />
        {input !== f.query
          ? Array.from({ length: 3 }, (_, i) => (
              <div
                className="agent-skeleton"
                key={i}
                aria-label="Finding agents"
              />
            ))
          : rows.map((a) => (
              <AgentCard
                key={a.id}
                agent={a}
                items={listings}
                onNavigate={onNavigate}
              />
            ))}
      </div>
      {!rows.length && (
        <div className="empty">
          <h2>No matching agents</h2>
          <button
            className="secondary"
            onClick={() => {
              setInput("");
              setF({ ...empty, sort: f.sort });
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      <button
        className="secondary"
        onClick={() => onNavigate("agent-dashboard")}
      >
        Demo agent dashboard
      </button>
      <p className="fine-print">
        Demo: location gating is simulated · Sample agents and listings
      </p>
    </section>
  );
}
