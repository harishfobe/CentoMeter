import Empty from "../components/Empty";
import { useScrollPolish, animateMotion } from "../lib/agentMotion";
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useLayoutEffect,
  memo,
} from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  MapPin,
  Zap,
  ShieldCheck,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { agents, listings, findAgents } from "../lib/agents";
import { readLocal } from "../Discovery";
import { cityForLocation } from "../PropertyModel";
import AgentCard from "../components/agent/AgentCard";
import FinderFilterSheet, {
  cities,
  sorts,
  budgetOptions,
} from "../components/agent/FinderFilterSheet";
const empty = { query: "", city: "", sort: "recommended", mode: "BUY" };
const areas = [...new Set(agents.flatMap((a) => a.serviceAreas))];
const languages = [...new Set(agents.flatMap((a) => a.languages))];
const specialties = [...new Set(agents.flatMap((a) => a.specialties))];
function AgentFinder({ onNavigate, Modal }) {
  const host = useRef(null),
    lifecycle = useRef({ active: false, geo: 0, blur: null });
  useEffect(() => {
    lifecycle.current.active = true;
    return () => {
      lifecycle.current.active = false;
      lifecycle.current.geo++;
      clearTimeout(lifecycle.current.blur);
    };
  }, []);
  useScrollPolish(host);
  const [f, setF] = useState(() => {
    try {
      return {
        ...empty,
        ...JSON.parse(
          new URLSearchParams(location.hash.split("?")[1]).get("filters") ||
            "{}",
        ),
      };
    } catch {
      return { ...empty };
    }
  });
  const [input, setInput] = useState(f.query),
    [sheet, setSheet] = useState(""),
    [toast, setToast] = useState(""),
    [suggest, setSuggest] = useState(false),
    [cursor, setCursor] = useState(-1);
  const set = (key, value) => {
    if (key === "city") lifecycle.current.geo++;
    setF((x) => ({ ...x, [key]: value }));
  };
  useEffect(() => {
    const t = setTimeout(() => setF((x) => ({ ...x, query: input })), 250);
    return () => clearTimeout(t);
  }, [input]);
  useEffect(() => {
    if (sheet) return;
    const t = setTimeout(() => {
      const q = new URLSearchParams();
      if (JSON.stringify(f) !== JSON.stringify(empty))
        q.set("filters", JSON.stringify(f));
      history.replaceState(
        history.state,
        "",
        "#agents" + (q.size ? "?" + q : ""),
      );
    }, 250);
    return () => clearTimeout(t);
  }, [f, sheet]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);
  const rows = useMemo(() => {
    const [min, max] = (f.budget || "0:Infinity").split(":").map(Number);
    const eligible = f.budget
      ? listings.filter(
          (p) => p.mode === f.mode && p.price >= min && p.price <= max,
        )
      : listings;
    const base = { ...f, locality: "", budget: f.budget ? String(max) : "" };
    return findAgents(agents, base, eligible).filter(
      (a) =>
        (!f.locality?.length ||
          f.locality.some((v) => a.serviceAreas.includes(v))) &&
        (!f.budget || eligible.some((p) => p.agentId === a.id)),
    );
  }, [f]);
  const positions = useRef(new Map());
  useLayoutEffect(() => {
    const cards = [
      ...(host.current?.querySelectorAll(".agent-grid > .agent-card") || []),
    ].slice(0, 20);
    // Read all boxes before starting any animation writes; use document coordinates.
    const measurements = cards.map((card) => {
      const rect = card.getBoundingClientRect();
      return {
        card,
        id: card.dataset.agentId,
        left: rect.left + scrollX,
        top: rect.top + scrollY,
      };
    });
    const next = new Map(measurements.map((item) => [item.id, item]));
    for (const item of measurements) {
      const before = positions.current.get(item.id);
      if (!before || before.left !== item.left || before.top !== item.top)
        animateMotion(
          item.card,
          before
            ? [
                {
                  translate: `${before.left - item.left}px ${before.top - item.top}px`,
                },
                { translate: "0 0" },
              ]
            : [{ opacity: 0 }, { opacity: 1 }],
          { duration: 200 },
        );
    }
    positions.current = next;
  }, [rows]);
  const reset = () => {
    lifecycle.current.geo++;
    setInput("");
    setF({ ...empty });
  };
  const near = () => {
    const generation = ++lifecycle.current.geo;
    const current = () =>
      lifecycle.current.active && generation === lifecycle.current.geo;
    const fallback = () => {
      if (!current()) return;
      const city = readLocal("centometer-city", null) || f.city || "Bengaluru";
      set("city", cities.includes(city) ? city : "Bengaluru");
      setToast("Using " + (cities.includes(city) ? city : "Bengaluru"));
    };
    if (!navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (!current()) return;
        const city = cityForLocation([p.coords.latitude, p.coords.longitude]);
        if (city) {
          set("city", city);
          setToast("Using " + city);
        } else fallback();
      },
      fallback,
      { timeout: 10000, maximumAge: 300000 },
    );
  };
  const labels = {
    response: (v) =>
      `Responds in ${{ 60: "1 h", 240: "4 h", 1440: "1 day" }[v]}`,
    experience: (v) => `${v}+ years`,
    count: (v) => `${v}+ listings`,
    verified: () => "Verified",
    budget: (v) => budgetOptions(f.mode).find((x) => x[0] === v)?.[1] || v,
    sort: (v) => sorts.find((x) => x[0] === v)?.[1],
  };
  const active = Object.entries(f)
    .filter(
      ([k, v]) =>
        !["query", "mode"].includes(k) &&
        v &&
        (!Array.isArray(v) || v.length) &&
        (k !== "sort" || v !== "recommended"),
    )
    .flatMap(([k, v]) =>
      (Array.isArray(v) ? v : [v]).map((value) => ({
        key: k,
        value,
        label: labels[k] ? labels[k](value) : String(value),
      })),
    );
  const suggestions = input.trim()
    ? [
        ["Agents", agents.map((a) => a.name)],
        ["Areas", areas],
        ["Languages", languages],
      ]
        .flatMap(([group, values]) =>
          values
            .filter((v) => v.toLowerCase().includes(input.toLowerCase()))
            .map((value) => ({ group, value })),
        )
        .slice(0, 6)
    : [];
  const choose = (value) => {
    setInput(value);
    setSuggest(false);
    setCursor(-1);
  };
  const quick = (label, Icon, pressed, click) => (
    <button className="chip" aria-pressed={pressed} onClick={click}>
      <Icon size={15} />
      {label}
    </button>
  );
  return (
    <section
      ref={host}
      className="page agent-finder agent-feature finder-refined"
    >
      <div className="agent-finder-intro">
        <h1>Find your local expert</h1>
      </div>
      <div className="finder-sticky">
        <div className="finder-search-row">
          <div
            className="finder-search"
            role="search"
            aria-label="Find an agent"
          >
            <Search size={19} />
            <input
              aria-label="Name, area or language"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={suggest && !!suggestions.length}
              aria-controls="finder-suggestions"
              aria-activedescendant={
                cursor >= 0 ? `suggestion-${cursor}` : undefined
              }
              placeholder="Name, area or language"
              value={input}
              onFocus={() => {
                clearTimeout(lifecycle.current.blur);
                setSuggest(true);
              }}
              onBlur={() => {
                lifecycle.current.blur = setTimeout(
                  () => setSuggest(false),
                  150,
                );
              }}
              onChange={(e) => {
                setInput(e.target.value);
                setSuggest(true);
                setCursor(-1);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSuggest(false);
                if (
                  suggestions.length &&
                  (e.key === "ArrowDown" || e.key === "ArrowUp")
                ) {
                  e.preventDefault();
                  setSuggest(true);
                  setCursor(
                    (x) =>
                      (x +
                        (e.key === "ArrowDown" ? 1 : -1) +
                        suggestions.length) %
                      suggestions.length,
                  );
                }
                if (e.key === "Enter" && suggestions[cursor]) {
                  e.preventDefault();
                  choose(suggestions[cursor].value);
                }
              }}
            />
            {input && (
              <button aria-label="Clear search" onClick={() => choose("")}>
                <X size={16} />
              </button>
            )}
            {suggest && suggestions.length > 0 && (
              <div
                id="finder-suggestions"
                role="listbox"
                aria-label="Suggestions"
                className="finder-suggestions"
              >
                {suggestions.map((s, i) => (
                  <div
                    role="option"
                    id={`suggestion-${i}`}
                    key={s.group + s.value}
                    aria-selected={cursor === i}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(s.value)}
                  >
                    <small>
                      {i === 0 || suggestions[i - 1].group !== s.group
                        ? s.group
                        : ""}
                    </small>
                    <span>{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            className="finder-filter-trigger"
            aria-haspopup="dialog"
            aria-label={`Filters, ${active.length} active`}
            onClick={() => setSheet("filters")}
          >
            <SlidersHorizontal size={20} />
            {active.length > 0 && <span>{active.length}</span>}
          </button>
        </div>
        <div className="finder-quick">
          <div>
            {quick("Near me", MapPin, !!f.city, near)}
            {quick("Fastest reply", Zap, f.sort === "fast", () =>
              set("sort", f.sort === "fast" ? "recommended" : "fast"),
            )}
            {quick("Verified", ShieldCheck, !!f.verified, () =>
              set("verified", !f.verified),
            )}
            {quick("New", Sparkles, f.sort === "new", () =>
              set("sort", f.sort === "new" ? "recommended" : "new"),
            )}
            {quick("City: " + (f.city || "Any"), ChevronDown, !!f.city, () =>
              setSheet("city"),
            )}
          </div>
        </div>
      </div>
      {active.length > 0 && (
        <div className="finder-active">
          {active.map((a) => (
            <button
              key={a.key + a.value}
              onClick={() =>
                set(
                  a.key,
                  Array.isArray(f[a.key])
                    ? f[a.key].filter((v) => v !== a.value)
                    : a.key === "sort"
                      ? "recommended"
                      : "",
                )
              }
            >
              {a.label}
              <X size={12} />
            </button>
          ))}
          <button onClick={reset}>Clear all</button>
        </div>
      )}
      <div className="finder-results">
        <span aria-live="polite" aria-atomic="true" key={rows.length}>
          {rows.length} {rows.length === 1 ? "agent" : "agents"}
        </span>
        <button aria-haspopup="dialog" onClick={() => setSheet("sort")}>
          Sort:{" "}
          {f.sort === "recommended"
            ? "Best"
            : sorts.find((x) => x[0] === f.sort)?.[1]}
          <ChevronDown size={14} />
        </button>
      </div>
      {sheet && (
        <FinderFilterSheet
          Modal={Modal}
          kind={sheet}
          f={f}
          set={set}
          reset={reset}
          count={rows.length}
          close={() => setSheet("")}
          areas={areas}
          languages={languages}
          specialties={specialties}
        />
      )}
      {toast && (
        <div className="finder-toast" role="status">
          {toast}
        </div>
      )}
      <div
        className="agent-grid agent-skeleton-shell"
        aria-busy={input !== f.query}
      >
        {rows.map((a) => (
          <AgentCard
            key={a.id}
            agent={a}
            items={listings}
            onNavigate={onNavigate}
          />
        ))}
      </div>
      {!rows.length && (
        <Empty
          heading="h2"
          title="No matching agents"
          description="Try a wider area or fewer filters."
          action="Clear all"
          onAction={reset}
        />
      )}
      <p className="fine-print">
        Demo: location gating is simulated · Sample agents and listings
      </p>
    </section>
  );
}

export default memo(AgentFinder);
