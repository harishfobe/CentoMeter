import useExpiryTick from "../lib/useExpiryTick";
import useDebouncedValue from "../lib/useDebouncedValue";
import ListingPresence from "../components/agent/ListingPresence";
import ListingGrid from "../components/agent/ListingGrid";
import AgentTabs from "../components/agent/AgentTabs";
import MotionSkeleton from "../components/agent/MotionSkeleton";
import {
  useMinimumSkeleton,
  useScrollPolish,
  reducedMotion,
} from "../lib/agentMotion";
import { getExactLocation } from "../lib/locationAccess";
import CompareTable from "../components/agent/CompareTable";
import { useAgentNavigation } from "../lib/agentNavigation";
import React, {
  useState,
  useEffect,
  useMemo,
  useDeferredValue,
  useCallback,
  useRef,
} from "react";
import {
  agents,
  listings,
  activeListings,
  defaults,
  parseAgentRoute,
  filtersFromQuery,
  filtersQuery,
  filterListings,
  filterLabel,
} from "../lib/agents";
import { readLocal, writeLocal } from "../Discovery";
import {
  useAgentStore,
  viewerId,
  toggleStore,
  recordEvent,
  updateStore,
  notifyAgent,
} from "../lib/agentStore";
import AgentHeader from "../components/agent/AgentHeader";
import FilterBar from "../components/agent/FilterBar";
import FilterSheet from "../components/agent/FilterSheet";
import ListingCard from "../components/agent/ListingCard";
export async function shareAgentLink(url, title) {
  if (navigator.share) {
    try {
      await navigator.share({ url, title });
      return;
    } catch (e) {
      if (e.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    window.prompt("Copy this link", url);
  }
}
export default function AgentProfile({ route, onNavigate, Modal, Detail }) {
  const {
    query,
    replace,
    open: openListing,
    close: closeListing,
  } = useAgentNavigation(route);
  const { handle } = parseAgentRoute(route),
    a = agents.find((a) => a.handle === handle);
  const host = useRef(null);
  useScrollPolish(host);
  const ready = useMinimumSkeleton(handle, !!a);
  const tabScroll = useRef({ listings: null, about: null });
  const store = useAgentStore();
  const expiryNow = useExpiryTick(
    store.requests.filter((r) => r.viewerId === viewerId),
  );
  const requestMap = useMemo(
    () =>
      new Map(
        store.requests
          .filter((r) => r.viewerId === viewerId)
          .map((r) => [r.propertyId, r]),
      ),
    [store.requests],
  );

  const [reportAgent, setReportAgent] = useState(false),
    [more, setMore] = useState(false),
    [compare, setCompare] = useState([]);
  const initial = () => {
    const own = listings.filter((p) => p.agentId === a?.id);
    const majority =
      own.filter((p) => p.mode === "RENT").length > own.length / 2
        ? "RENT"
        : "BUY";
    return {
      ...defaults,
      mode: majority,
      ...readLocal("agent-filters:" + handle, {}),
    };
  };
  const [f, setF] = useState(() =>
    query.has("mode") ||
    [...query.keys()].some((k) => Object.hasOwn(defaults, k))
      ? filtersFromQuery(query)
      : initial(),
  );
  const compareAck = useRef(compare),
    compareChanged = useRef(false);
  useEffect(() => {
    if (!compareChanged.current) return;
    const timer = setTimeout(() => {
      if (writeLocal("agent-compare:" + handle, compare)) {
        compareAck.current = compare;
      } else {
        compareChanged.current = false;
        setCompare(compareAck.current);
        notifyAgent("Could not save comparison. Your selection was restored.");
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [compare, handle]);
  const changed = useRef(false);
  const navigation = useRef({ query, replace });
  navigation.current = { query, replace };
  useEffect(() => {
    if (!changed.current) return;
    const timer = setTimeout(() => {
      const q = filtersQuery(f);
      q.set("mode", f.mode);
      for (const key of ["src", "tab", "l"]) {
        const value = navigation.current.query.get(key);
        if (value) q.set(key, value);
      }
      if (!writeLocal("agent-filters:" + handle, f))
        notifyAgent("Filters applied. Device storage is unavailable.");
      navigation.current.replace(q);
    }, 200);
    return () => clearTimeout(timer);
  }, [f, handle]);
  useEffect(() => {
    const q = parseAgentRoute(route).query;
    if ([...q.keys()].some((k) => Object.hasOwn(defaults, k))) {
      changed.current = false;
      setF(filtersFromQuery(q));
    }
  }, [route]);
  const items = useMemo(
    () =>
      [...listings, ...(store.customListings || [])]
        .filter((p) => p.agentId === a?.id)
        .map((p) => ({ ...p, ...store.overrides[p.id] })),
    [a, store.overrides, store.customListings],
  );
  const unlocked = useMemo(
    () =>
      new Set(
        items
          .filter((p) => !!getExactLocation(p.id, viewerId))
          .map((p) => p.id),
      ),
    [items, store.requests, expiryNow],
  );
  const settledFilters = useDebouncedValue(JSON.stringify(f));
  const deferredFilters = useDeferredValue(settledFilters);
  const loading = deferredFilters !== JSON.stringify(f);
  const rows = useMemo(
    () => filterListings(items, JSON.parse(deferredFilters)),
    [items, deferredFilters],
  );
  const change = useCallback((next) => {
    changed.current = true;
    setF(next);
    if (next.locality) {
      const q = new URLSearchParams(navigation.current.query);
      q.set("tab", "listings");
      navigation.current.replace(q);
    }
  }, []);
  const onSave = useCallback(
    (id) => {
      toggleStore("saved", id);
      recordEvent("saves", a.id);
    },
    [a?.id],
  );
  const onCompare = useCallback((id) => {
    compareChanged.current = true;
    setCompare((xs) =>
      xs.includes(id)
        ? xs.filter((x) => x !== id)
        : xs.length < 3
          ? [...xs, id]
          : xs,
    );
  }, []);
  const link =
    location.origin +
    location.pathname +
    "#agent/" +
    encodeURIComponent(handle) +
    "?" +
    new URLSearchParams({ ...Object.fromEntries(query), src: "share" });
  useEffect(() => {
    if (a) recordEvent("views", a.id, query.get("src") || "direct");
  }, [a?.id]);
  if (!a)
    return (
      <section className="page empty">
        <h1>Agent not found</h1>
        <p>This profile link may have changed.</p>
        <button className="primary" onClick={() => onNavigate("agents")}>
          Find an agent
        </button>
      </section>
    );
  const tab = query.get("tab") || "listings";
  const changeTab = (next) => {
    tabScroll.current[tab] = window.scrollY;
    const q = new URLSearchParams(query);
    q.set("tab", next);
    replace(q);
    requestAnimationFrame(() => {
      const y = tabScroll.current[next];
      if (y !== null && y !== undefined)
        window.scrollTo({ top: y, behavior: "instant" });
    });
  };
  const card = (p) => (
    <ListingCard
      key={p.id}
      p={p}
      unit={JSON.parse(deferredFilters).unit}
      saved={store.saved.includes(p.id)}
      request={requestMap.get(p.id)}
      unlocked={unlocked.has(p.id)}
      onSave={onSave}
      onOpen={openListing}
      compared={compare.includes(p.id)}
      onCompare={onCompare}
    />
  );
  return (
    <section ref={host} className="page agent-feature agent-public">
      <nav className="agent-slim-bar">
        <button onClick={() => onNavigate("home")}>← CentoMeter</button>
        <button onClick={() => shareAgentLink(link, a.name)}>
          Share profile
        </button>
      </nav>
      <p className="fine-print agent-demo-note">
        Demo: location gating is simulated
      </p>
      <div className="agent-skeleton-shell">
        {" "}
        <AgentHeader
          agent={a}
          count={activeListings(items, a.id).length}
          onShare={() => shareAgentLink(link, a.name)}
        />
        <MotionSkeleton ready={ready} kind="header" />
      </div>
      <AgentTabs tab={tab} onChange={changeTab} />
      <section
        data-agent-panel
        id="agent-panel-about"
        role="tabpanel"
        aria-labelledby="agent-tab-about"
        hidden={tab !== "about"}
      >
        <section>
          <h2>About {a.name}</h2>
          <p>{a.bio}</p>
          <h3>Service areas</h3>
          <div className="chips">
            {a.serviceAreas.map((x) => (
              <button
                className="secondary"
                key={x}
                onClick={() => change({ ...f, locality: x })}
              >
                {x}
              </button>
            ))}
          </div>
          <p>{a.specialties.join(" · ")}</p>
          <p>{a.languages.join(" · ")}</p>
          <p>
            {a.verified
              ? "Sample verification dated " + a.verifiedAt
              : "Not verified"}
          </p>
          <p>Response time is an illustrative median, not a promise.</p>
        </section>
      </section>
      <section
        data-agent-panel
        id="agent-panel-listings"
        role="tabpanel"
        aria-labelledby="agent-tab-listings"
        hidden={tab !== "listings"}
      >
        <>
          <FilterBar f={f} onChange={change} onMore={() => setMore(true)} />
          <p className="agent-result-count" aria-live="polite">
            {rows.length} {rows.length === 1 ? "property" : "properties"}
          </p>
          <div className="chips agent-applied-filters">
            {Object.entries(f)
              .filter(([k, v]) => v !== defaults[k])
              .map(([k, v]) => (
                <button
                  key={k}
                  className="secondary"
                  onClick={() => change({ ...f, [k]: defaults[k] })}
                >
                  {filterLabel(k, v)} ×
                </button>
              ))}
          </div>
          <div
            className="agent-results agent-skeleton-shell"
            aria-busy={loading}
          >
            <div
              className="agent-list-progress"
              data-pending={loading}
              aria-hidden="true"
            />
            <ListingGrid
              rows={rows}
              unit={JSON.parse(deferredFilters).unit}
              saved={store.saved}
              requests={requestMap}
              unlocked={unlocked}
              compared={compare}
              onSave={onSave}
              onOpen={openListing}
              onCompare={onCompare}
            />
            <MotionSkeleton ready={ready} />
          </div>
          {!rows.length && (
            <div className="empty">
              <h2>No match. Clear filters</h2>
              <button
                className="secondary"
                onClick={() => change({ ...defaults })}
              >
                Clear filters
              </button>
              <h3>Other listings from {a.name}</h3>
              {items.slice(0, 2).map(card)}
            </div>
          )}
        </>
      </section>
      <button
        className="agent-back-top secondary"
        aria-label="Back to top"
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: reducedMotion() ? "instant" : "smooth",
          })
        }
      >
        ↑ Back to top
      </button>
      {compare.length > 0 && (
        <CompareTable
          items={items.filter((p) => compare.includes(p.id))}
          onClear={() => {
            compareChanged.current = true;
            setCompare([]);
          }}
        />
      )}
      {more && (
        <FilterSheet
          Modal={Modal}
          f={f}
          onChange={change}
          count={rows.length}
          onClose={() => setMore(false)}
        />
      )}
      <button className="text-button" onClick={() => setReportAgent(true)}>
        Report agent
      </button>
      {reportAgent && (
        <Modal title="Report agent" onClose={() => setReportAgent(false)}>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              updateStore((s) => ({
                ...s,
                reports: [
                  ...s.reports,
                  {
                    agentId: a.id,
                    reason: new FormData(e.currentTarget).get("reason"),
                  },
                ],
              }));
              notifyAgent("Report saved locally.");
              setReportAgent(false);
            }}
          >
            <label>
              Reason
              <select name="reason">
                <option>Incorrect profile</option>
                <option>Misleading information</option>
                <option>Suspicious activity</option>
              </select>
            </label>
            <button className="primary">Save report locally</button>
          </form>
        </Modal>
      )}
      <button className="secondary" onClick={() => onNavigate("agents")}>
        Explore more on CentoMeter
      </button>
      <p className="fine-print">
        Demo: location gating is simulated · Sample agents and listings
      </p>
      {Detail && (
        <ListingPresence item={items.find((p) => p.id === query.get("l"))}>
          {(shown, exiting) => (
            <Detail
              p={shown}
              exiting={exiting}
              agent={a}
              Modal={Modal}
              source={query.get("src") || "direct"}
              onRelated={(p) =>
                p.agentId === a.id
                  ? openListing(p.id)
                  : onNavigate(
                      "agent/" +
                        agents.find((a) => a.id === p.agentId)?.handle +
                        "?l=" +
                        p.id,
                    )
              }
              onClose={closeListing}
            />
          )}
        </ListingPresence>
      )}
    </section>
  );
}
