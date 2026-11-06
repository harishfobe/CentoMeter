import HomeDiscovery from "./components/HomeDiscovery";
import Empty from "./components/Empty";
import { savePostedListing } from "./lib/savePostedListing";
import useListingStorage from "./useListingStorage";
import { loadListingDetails } from "./lib/listingDetailsLoader";
import PropertyCard from "./components/PropertyCard";
import MapView from "./MapView";
import { Modal, IconButton } from "./Modal";
export { Modal } from "./Modal";
import LoadingSkeleton from "./components/LoadingSkeleton";
import AgentToasts from "./components/agent/AgentToasts";
import { sameAgentPage } from "./lib/agentNavigation";
import { flushSync } from "react-dom";
import { routeMotion } from "./lib/routeMotion";
import React, {
  useState,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";

import {
  Home,
  Map as MapIcon,
  Heart,
  Bookmark,
  User,
  UsersRound,
  Plus,
  Search,
  SlidersHorizontal,
  MapPin,
  Bell,
  ChevronDown,
  ArrowLeft,
  ChevronRight,
  X,
  House,
  KeyRound,
  CheckCircle2,
  Maximize2,
  LocateFixed,
  List,
  BedDouble,
  Bath,
  Phone,
  LogOut,
  Info,
  Clock3,
  Eye,
  Share2,
} from "lucide-react";
import properties from "./data/properties.json";
import agents from "./data/agents.json";
import agentListings from "./data/agentListings.json";
import { useAgentStore, viewerId } from "./lib/agentStore";
import { AgentRequests, AgentSaved } from "./components/agent/AgentActivity";
import { parseAgentRoute, mergeListings } from "./lib/agents";
import { LocationGate, LocationRequestForm, LocationRequests } from "./AgentUI";
import {
  accessStatus,
  isLocationLocked,
  mapPoint,
  exactLocation,
  restoreExactLocations,
  safeSearchArea,
  publicShare,
  leadSourceFromSearch,
} from "./lib/locationAccess";
import { OptionalPropertyDetails, EmiCalculator } from "./PropertyExtras";
import {
  centers,
  money,
  normalizePostedListing,
  indianMobile,
  sortProperties,
  hasValue,
} from "./PropertyModel";
import { landmarkSuggestions, DEFAULT_CITY } from "./data/cities";
import { visitDates } from "./JourneyUX";
import {
  SellerProfile,
  ContactButtons,
  propertyHotspots,
} from "./PropertyContact";
import PropertyTypes, { typeLabel } from "./PropertyTypes";
import { MobilePropertyPrice, StickyContactBar } from "./MobileUI";
import {
  Wordmark,
  SelectedPropertySheet,
  PriceCaption,
} from "./MinimalUI";
import SearchDiscovery from "./SearchDiscovery";
import { developerFor } from "./SearchSuggestions";

import { mobileQuery } from "./MapInteractions";
import { LandSummary } from "./LandDetails";
import {
  HouseVillaSummary,
  houseTypeEyebrow,
  usesHomeDetailLayout,
} from "./HouseVillaDetails";
import {
  priceBasis,
  nearText,
  distanceKm,
  SearchLibrary,
  Visits,
} from "./Journeys";
import {
  supportsFacing,
  filterDefaults,
  readLocal,
  writeLocal,
  removeLocal,
  matches,
  activeFilters,
  SmartFilters,
  Costs,
  Gallery,
} from "./Discovery";

// Commit focus after a deferred route has actually rendered, not on its placeholder.
function ReadyView({ Component, ...props }) {
  useEffect(() => {
    const heading = document.querySelector("main h1:not(.sr-only)");
    if (heading && !document.querySelector("[role=dialog]")) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
  }, [Component]);
  return <Component {...props} />;
}
function defer(Component, kind) {
  return function Deferred(props) {
    return (
      <Suspense fallback={<LoadingSkeleton kind={kind} />}>
        <ReadyView Component={Component} {...props} />
      </Suspense>
    );
  };
}
const PostFlow = defer(
  lazy(() => import("./PostFlow")),
  "form",
);
const AgentFinder = defer(
  lazy(() => import("./pages/AgentFinder")),
  "finder",
);
const AgentProfile = defer(
  lazy(() => import("./pages/AgentProfile")),
  "profile",
);
const AgentDashboard = defer(
  lazy(() => import("./pages/AgentDashboard")),
  "form",
);
const Detail = lazy(loadListingDetails);
function ListingDetailSheet(props) {
  return (
    <Suspense
      fallback={
        <Modal title="Property details" onClose={props.onClose} historyManaged>
          <LoadingSkeleton kind="detail" />
        </Modal>
      }
    >
      <Detail {...props} />
    </Suspense>
  );
}

const initialFilters = filterDefaults;
const readSaved = () => {
  const value = readLocal("centometer-saved", []);
  return Array.isArray(value) ? value : [];
};
function PropertySearch({ city, value, onChange, onSearch, inputRef }) {
  const [searchHistory, setSearchHistory] = useState(() =>
    readLocal("centometer-search-history", []),
  );
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState(-1);
  const suggestions = useMemo(() => {
    const landmarks = landmarkSuggestions[city].map(([name, locality]) => ({
      name,
      locality,
      kind: "Landmark",
    }));
    const localities = [
      ...new Set(
        properties.filter((p) => p.city === city).map((p) => p.locality),
      ),
    ].map((name) => ({ name, locality: name, kind: "Locality" }));
    const term = value.trim();
    const history = searchHistory
      .filter((x) => x.city === city)
      .map((x) => ({ name: x.name, locality: x.name, kind: "Recent search" }));
    return [...(term ? [] : history), ...landmarks, ...localities]
      .filter((s) => nearText(`${s.name} ${s.locality}`, term))
      .filter((s, i, a) => a.findIndex((x) => x.name === s.name) === i)
      .slice(0, 6);
  }, [city, value, searchHistory]);
  useEffect(() => {
    setExpanded(false);
    setActive(-1);
  }, [city]);
  const submit = (name) => {
    const term = (name ?? value).trim();
    if (term) {
      const next = [
        { city, name: term },
        ...searchHistory.filter((x) => x.city !== city || x.name !== term),
      ].slice(0, 8);
      setSearchHistory(next);
      writeLocal("centometer-search-history", next);
    }
    if (name !== undefined) onChange(name);
    setExpanded(false);
    setActive(-1);
    inputRef.current?.blur();
    onSearch();
  };
  return (
    <form
      className="search-box autocomplete-search"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setExpanded(false);
      }}
      onSubmit={(e) => {
        e.preventDefault();
        submit(expanded && active >= 0 ? suggestions[active]?.name : undefined);
      }}
    >
      <MapPin size={20} />
      <input
        ref={inputRef}
        role="combobox"
        aria-label="Search location or property"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls="location-suggestions"
        aria-activedescendant={
          expanded && active >= 0 ? `location-option-${active}` : undefined
        }
        autoComplete="off"
        enterKeyHint="search"
        placeholder="Locality, landmark or property"
        value={value}
        onFocus={() => setExpanded(true)}
        onClick={() => setExpanded(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setExpanded(true);
          setActive(-1);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            setExpanded(false);
            setActive(-1);
          } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setExpanded(true);
            if (suggestions.length)
              setActive((i) =>
                e.key === "ArrowDown"
                  ? (i + 1) % suggestions.length
                  : i <= 0
                    ? suggestions.length - 1
                    : i - 1,
              );
          }
        }}
      />
      {value && (
        <IconButton
          label="Clear search"
          type="button"
          onClick={() => {
            onChange("");
            setActive(-1);
            setExpanded(true);
            inputRef.current?.focus();
          }}
        >
          <X size={16} />
        </IconButton>
      )}
      <button className="search-submit" aria-label="Search properties">
        <ChevronRight size={19} />
      </button>
      {expanded && (
        <div className="search-suggestions">
          <div className="suggestion-heading">
            {value.trim() ? "Matching places" : "Suggested places"}
            <small>{city}</small>
          </div>
          <div
            id="location-suggestions"
            role="listbox"
            aria-label="Landmark and locality suggestions"
          >
            {suggestions.map((suggestion, i) => (
              <button
                type="button"
                role="option"
                id={`location-option-${i}`}
                aria-selected={i === active}
                tabIndex={-1}
                className="suggestion-option"
                key={suggestion.kind + suggestion.name}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => submit(suggestion.name)}
              >
                <span className="suggestion-icon">
                  <MapPin size={18} />
                </span>
                <span>
                  <strong>{suggestion.name}</strong>
                  <small>
                    {suggestion.kind} · {suggestion.locality}
                  </small>
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
          {!suggestions.length && (
            <p className="suggestion-empty">
              No matching places. Press Search or Enter to search property
              names.
            </p>
          )}
          <p className="suggestion-note">
            Sample landmarks linked to locality listings
          </p>
        </div>
      )}
    </form>
  );
}
export default function App() {
  const agentState = useAgentStore();
  const intentFilters = useRef({ BUY: initialFilters, RENT: initialFilters });
  const [notes, setNotes] = useState(() => readLocal("centometer-notes", {}));
  const [collection, setCollection] = useState("All saved");
  const [collections, setCollections] = useState(() =>
    readLocal("centometer-collections", {}),
  );
  const [searchName, setSearchName] = useState("");
  const [shareText, setShareText] = useState("");
  const [collectionTarget, setCollectionTarget] = useState(null);
  const [legacyLocationRequests, setLocationRequests] = useState(() =>
    readLocal("centometer-location-requests", []),
  );
  const [agentPicks, setAgentPicks] = useState(false);
  const [locationTarget, setLocationTarget] = useState(null);
  const [postingAgent, setPostingAgent] = useState(null);
  const leadSource = useRef(leadSourceFromSearch(location.search));
  const locationRequests = useMemo(
    () => [
      ...legacyLocationRequests.filter((r) => r.viewerId === viewerId),
      ...agentState.requests.filter((r) => r.viewerId === viewerId),
    ],
    [legacyLocationRequests, agentState.requests],
  );
  useEffect(() => {
    writeLocal("centometer-location-requests", legacyLocationRequests);
  }, [legacyLocationRequests]);
  useEffect(() => {
    let active = true;
    void restoreExactLocations()
      .then(() => {
        if (active) setLocationRequests((xs) => [...xs]);
      })
      .catch(() => {
        if (active)
          setToast(
            "Private locations could not be restored. Location access remains locked; please reload to retry.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const deadlines = locationRequests
      .filter((r) => r.status === "approved" && r.expiresAt)
      .map((r) => Date.parse(r.expiresAt))
      .filter((deadline) => Number.isFinite(deadline) && deadline > Date.now());
    if (!deadlines.length) return;
    const timer = setTimeout(
      () =>
        setLocationRequests((xs) =>
          xs.map((r) =>
            r.status === "approved" && accessStatus(r) === "expired"
              ? { ...r, status: "expired" }
              : r,
          ),
        ),
      Math.min(2147483647, Math.max(0, Math.min(...deadlines) - Date.now())),
    );
    return () => clearTimeout(timer);
  }, [locationRequests]);
  const startLocationRequest = (p) => {
    if (p.agentId) {
      navigate(
        "agent/" +
          agents.find((a) => a.id === p.agentId)?.handle +
          "?l=" +
          p.id,
      );
      return;
    }
    setSelected(null);
    setLocationTarget(p.id);
    setModal("locationRequest");
  };
  const returnTo = useRef({ route: "home", scroll: 0 });
  const restoreScroll = useRef(null);
  const mapViewport = useRef(null);
  const {
    drafts,
    setDrafts,
    ready: listingsReady,
    saveListings,
  } = useListingStorage((message) => setToast(message));
  const [areaOnly, setAreaOnly] = useState(false);
  const [savedSearches, setSavedSearches] = useState(() =>
    readLocal("centometer-searches", []),
  );
  const [recent, setRecent] = useState(() =>
    readLocal("centometer-recent", []),
  );
  const [activity, setActivity] = useState(() =>
    readLocal("centometer-activity", []),
  );
  const [activityTab, setActivityTab] = useState("saved");
  const [editing, setEditing] = useState(null);
  const listingRef = useRef(null);
  const [mapList, setMapList] = useState(false);
  const mapListToggle = useRef(null);
  const wasMapList = useRef(false);
  const searchReturn = useRef("home");
  const searchRef = useRef(null);
  const [focusSearch, setFocusSearch] = useState(false);
  const [route, setRoute] = useState(location.hash.slice(1) || "home");
  const [city, setCity] = useState(() => {
    const last = readLocal("centometer-city", DEFAULT_CITY);
    return Object.hasOwn(centers, last) ? last : DEFAULT_CITY;
  });
  const [mode, setMode] = useState("BUY");
  const [query, setQuery] = useState("");
  const [nearPlace, setNearPlace] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [bounds, setBounds] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectionGroup, setSelectionGroup] = useState([]);
  const [saved, setSaved] = useState(readSaved);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [savedToastId, setSavedToastId] = useState(null);
  const priceUnit = "total";
  const [visitDate, setVisitDate] = useState(() => visitDates()[0].value);
  const [sort, setSort] = useState("recommended");
  const [resetKey, setResetKey] = useState(0);
  const [profile, setProfile] = useState({
    name: "Aarav Sharma",
    email: "aarav@example.com",
    phone: "",
  });
  const [alerts, setAlerts] = useState(true);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactTarget, setContactTarget] = useState(null);
  useEffect(() => {
    if (route !== "map") return;
    if (mapList) listingRef.current?.focus({ preventScroll: true });
    else if (wasMapList.current)
      mapListToggle.current
        ?.querySelector?.("button")
        ?.focus({ preventScroll: true });
    wasMapList.current = mapList;
  }, [route, mapList]);
  useEffect(() => {
    if (focusSearch && route === "results") {
      searchRef.current?.focus();
      setFocusSearch(false);
    }
  }, [focusSearch, route]);
  useEffect(() => {
    let previous = location.hash.slice(1) || "home";
    const fn = () => {
      const next = location.hash.slice(1) || "home";
      if (sameAgentPage(previous, next)) {
        previous = next;
        setRoute(next);
        return;
      }
      previous = next;
      routeMotion(() =>
        flushSync(() => {
          setRoute(location.hash.slice(1) || "home");
          setModal(null);
        }),
      );
      requestAnimationFrame(() => {
        window.scrollTo(0, restoreScroll.current ?? 0);
        restoreScroll.current = null;
      });
    };
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  useEffect(() => {
    if (!writeLocal("centometer-saved", saved))
      setToast(
        "Saved places could not be retained on this device. Keep this page open and retry.",
      );
  }, [saved]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(
        () => setToast(""),
        toast === "Added to your saved places" ? 6500 : 3200,
      );
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    writeLocal("centometer-searches", savedSearches);
  }, [savedSearches]);
  useEffect(() => {
    writeLocal("centometer-recent", recent);
  }, [recent]);
  useEffect(() => {
    writeLocal("centometer-city", city);
  }, [city]);
  useEffect(() => {
    writeLocal("centometer-notes", notes);
  }, [notes]);
  useEffect(() => {
    writeLocal("centometer-collections", collections);
  }, [collections]);
  useEffect(() => {
    writeLocal("centometer-activity", activity);
  }, [activity]);
  const navigate = useCallback(
    (r) => {
      if (route === r) window.scrollTo(0, 0);
      else if (history.state?.centometerOverlay) location.replace("#" + r);
      else location.hash = r;
      setModal(null);
    },
    [route],
  );
  const openSearch = () => {
    searchReturn.current = route;
    navigate("search");
  };
  const showList = () => {
    setAreaOnly(true);
    if (route === "map") setMapList(true);
    else navigate("results");
  };
  const openMap = () => {
    setMapList(false);
    navigate("map");
  };
  // Peek-sheet drag: move the whole sheet root (handle + paper body) together.
  const sheetDrag = useRef(null);
  const suppressPeekClick = useRef(false);
  const sheetHost = (el) => el?.closest?.(".map-sheet-root") || el;
  const sheetPointerDown = (e) => {
    if (
      route !== "map" ||
      (e.pointerType === "mouse" && e.button !== 0) ||
      !window.matchMedia(
        "(max-width: 760px), (max-width: 1024px) and (pointer: coarse)",
      ).matches
    )
      return;
    const host = sheetHost(e.currentTarget);
    sheetDrag.current = {
      y: e.clientY,
      t: performance.now(),
      dy: 0,
      moved: 0,
      host,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    host.classList.add("dragging");
  };
  const sheetPointerMove = (e) => {
    const d = sheetDrag.current;
    if (!d) return;
    d.dy = Math.min(0, e.clientY - d.y);
    d.moved = Math.max(d.moved, Math.abs(e.clientY - d.y));
    d.host.style.transform = `translateY(${d.dy}px)`;
  };
  const finishSheetDrag = (e, cancelled) => {
    const d = sheetDrag.current;
    if (!d) return;
    sheetDrag.current = null;
    const host = d.host;
    host.classList.remove("dragging");
    const dist = -d.dy;
    const speed = dist / Math.max(1, performance.now() - d.t);
    const commit = !cancelled && (dist > 56 || (dist > 16 && speed > 0.5));
    if (d.moved > 6) {
      suppressPeekClick.current = true;
      setTimeout(() => {
        suppressPeekClick.current = false;
      }, 100);
    }
    if (!commit) {
      host.style.transform = "";
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      showList();
      return;
    }
    host.style.transform = `translateY(${-Math.round(window.innerHeight * 0.3)}px)`;
    setTimeout(showList, 160);
  };
  useEffect(() => {
    if (!mapList && mapListToggle.current)
      mapListToggle.current.style.transform = "";
  }, [mapList, route]);
  const notify = (s) => setToast(s);
  const savedRef = useRef(saved);
  savedRef.current = saved;
  const save = useCallback((id) => {
    const had = savedRef.current.includes(id);
    const next = had
      ? savedRef.current.filter((x) => x !== id)
      : [...savedRef.current, id];
    savedRef.current = next;
    setSaved(next);
    setSavedToastId(had ? null : id);
    setToast(
      had ? "Removed from your saved places" : "Added to your saved places",
    );
  }, []);
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(mobileQuery).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(mobileQuery);
    const update = () => setIsMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const allProperties = useMemo(
    () =>
      mergeListings(
        [...properties.filter((p) => !p.agentId), ...agentListings],
        drafts
          .map((d) => (d.agentId ? d : normalizePostedListing(d, profile.name)))
          .filter(Boolean),
      ).map((p) => (p.agentId ? { ...p, ...agentState.overrides[p.id] } : p)),
    [drafts, profile.name, agentState.overrides],
  );
  const candidates = useMemo(
    () =>
      allProperties.filter(
        (p) =>
          p.city === city &&
          p.mode === mode &&
          (!agentPicks || p.agentId) &&
          (!nearPlace ||
            (!isLocationLocked(p, locationRequests) &&
              exactLocation(p, locationRequests) &&
              distanceKm(exactLocation(p, locationRequests), nearPlace.point) <=
                nearPlace.radius)) &&
          (!query ||
            nearText(
              `${p.title} ${p.locality} ${p.city} ${typeLabel(p.type)} ${p.type} ${developerFor(p) || ""} ${(
                landmarkSuggestions[p.city] || []
              )
                .filter(([, l]) => l === p.locality)
                .map(([name]) => name)
                .join(" ")}`,
              query,
            )),
      ),
    [allProperties, city, mode, query, nearPlace, agentPicks, locationRequests],
  );
  const contactedProperties = useMemo(
    () =>
      activity
        .map((entry) => ({
          entry,
          property: allProperties.find((p) =>
            entry.propertyId
              ? String(p.id) === String(entry.propertyId)
              : p.title === entry.title,
          ),
        }))
        .filter(({ property }) => property),
    [activity, allProperties],
  );
  const filtered = useMemo(
    () => candidates.filter((p) => matches(p, filters)),
    [candidates, filters],
  );
  const visible = useMemo(
    () =>
      filtered.filter((p) => {
        const point = mapPoint(p, locationRequests);
        return point && (!bounds || bounds.contains(point));
      }),
    [filtered, bounds, locationRequests],
  );
  const resultItems =
    (route === "results" || (route === "map" && mapList)) && !areaOnly
      ? filtered
      : visible;
  const sorted = useMemo(
    () => sortProperties(resultItems, sort, priceUnit),
    [resultItems, sort, priceUnit],
  );
  const chosen = filtered.find((p) => p.id === selected);
  const detail = allProperties.find((p) => route === "property/" + p.id);
  const browse = ["home", "map", "results"].includes(route);
  const similarProperties = useMemo(
    () =>
      detail
        ? sortProperties(
            allProperties.filter(
              (p) =>
                p.id !== detail.id &&
                p.city === detail.city &&
                p.mode === detail.mode &&
                p.type === detail.type &&
                p.price >= detail.price * 0.7 &&
                p.price <= detail.price * 1.3,
            ),
          ).slice(0, 6)
        : [],
    [allProperties, detail],
  );
  const detailPoint = exactLocation(detail, locationRequests);
  const detailLocked = isLocationLocked(detail, locationRequests);
  const detailHotspots = useMemo(
    () => propertyHotspots(detail, locationRequests),
    [detail, locationRequests],
  );
  const contactProperty =
    allProperties.find((p) => p.id === contactTarget) || detail;
  const requestVisit = (p) => {
    setContactTarget(p.id);
    setSelected(null);
    setContactSent(false);
    setContactError("");
    setVisitDate(visitDates()[0].value);
    setModal("contact");
  };
  const clear = () => {
    mapViewport.current = null;
    setAreaOnly(false);
    setNearPlace(null);
    setFilters(initialFilters);
    setQuery("");
    setResetKey((x) => x + 1);
  };
  const setIntent = (m) => {
    const intent = m === "RENT" ? "RENT" : "BUY";
    intentFilters.current[mode] = filters;
    setMode(intent);
    setFilters(intentFilters.current[intent]);
    setSelected(null);
  };
  const selectCity = (c) => {
    setNearPlace(null);
    mapViewport.current = null;
    setAreaOnly(false);
    setCity(c);
    setSelected(null);
    setBounds(null);
    setQuery("");
  };
  const open = useCallback(
    (p) => {
      if (p.agentId) {
        navigate(
          "agent/" +
            agents.find((a) => a.id === p.agentId)?.handle +
            "?l=" +
            p.id,
        );
        return;
      }
      returnTo.current = { route, scroll: window.scrollY };
      setRecent((r) => [p.id, ...r.filter((id) => id !== p.id)].slice(0, 8));
      navigate("property/" + p.id);
    },
    [navigate, route],
  );
  const goBack = () => {
    restoreScroll.current = returnTo.current.scroll;
    navigate(returnTo.current.route);
  };
  const handleBounds = useCallback(
    (b) => {
      // Hidden Leaflet panes can emit zero-size bounds. Keep the last visible area.
      if (route !== "map" || !mapList) setBounds(b);
    },
    [route, mapList],
  );
  const renderCard = (p, compact = false) =>
    compact ? (
      <PropertyCard
        key={p.id}
        p={p}
        saved={saved.includes(p.id)}
        onSave={save}
        onOpen={open}
        compact
        priceUnit={priceUnit}
      />
    ) : (
      <div key={p.id} className={compact ? "compact-wrapper" : "card-wrapper"}>
        <PropertyCard
          p={p}
          saved={saved.includes(p.id)}
          onSave={save}
          onOpen={open}
          compact={compact}
          priceUnit={priceUnit}
        />
        {!compact && (
          <div className="card-meta">
            <span>
              {p.seller} · {p.available}
            </span>
            <small>{p.freshness} · Sample</small>
            {p.mode === "RENT" &&
              (p.deposit != null || p.maintenance != null) && (
                <small>
                  {[
                    p.deposit != null ? "Deposit " + money(p.deposit) : null,
                    p.maintenance != null
                      ? "Maintenance " + money(p.maintenance) + "/mo"
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              )}
          </div>
        )}
      </div>
    );
  const searchNearMe = () => {
    setAgentPicks(false);
    if (!navigator.geolocation) {
      notify("Location is unavailable in this browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const actual = [position.coords.latitude, position.coords.longitude];
        const nearby = allProperties.filter(
          (p) =>
            p.mode === mode &&
            !isLocationLocked(p, locationRequests) &&
            exactLocation(p, locationRequests) &&
            distanceKm(exactLocation(p, locationRequests), actual) <= 15,
        );
        const targetCity = nearby.length
          ? nearby.sort(
              (a, b) =>
                distanceKm(exactLocation(a, locationRequests), actual) -
                distanceKm(exactLocation(b, locationRequests), actual),
            )[0].city
          : city;
        const point = nearby.length ? actual : centers[city];
        if (!nearby.length)
          notify("Showing sample properties near central " + city);
        setCity(targetCity);
        mapViewport.current = null;
        setBounds(null);
        setFilters(initialFilters);
        setNearPlace({
          name: nearby.length ? "Current location" : "Central " + city,
          point,
          radius: 15,
        });
        setQuery("");
        setAreaOnly(false);
        setSelected(null);
        setResetKey((x) => x + 1);
        navigate("results");
      },
      () => notify("Allow location access to search nearby"),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };
  const agentHandle = route.startsWith("agent/")
    ? parseAgentRoute(route).handle
    : null;
  const agentRoute =
    ["agent", "agents", "agent-dashboard"].includes(route) || !!agentHandle;
  const routeTitle =
    detail?.title ||
    (agentHandle ? agents.find((a) => a.handle === agentHandle)?.name : null) ||
    {
      home: "Home",
      map: "Map",
      results: "Search results",
      search: "Search",
      saved: "Activity",
      post: "Post Property",
      agent: "Agents",
      agents: "Agent Finder",
      "agent-dashboard": "Agent dashboard",
      profile: "Profile",
    }[route] ||
    "Page not found";
  useEffect(() => {
    document.title = routeTitle + " | CentoMeter";
    const frame = requestAnimationFrame(() => {
      const title =
        document.querySelector("main h1:not(.sr-only)") ||
        document.querySelector("main h1");
      if (title && !document.querySelector("[role=dialog]")) {
        title.setAttribute("tabindex", "-1");
        title.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [route, routeTitle]);
  const shareProperty = async (property) => {
    const text = publicShare(
      property,
      location.origin +
        location.pathname +
        "?src=" +
        leadSource.current +
        "#property/" +
        property.id,
    );
    setShareText(text);
    if (navigator.share) {
      try {
        await navigator.share({ title: property.title, text });
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }
    setModal("share");
  };

  const activeNav =
    ["home", "results", "search"].includes(route) ||
    route.startsWith("property/")
      ? "home"
      : agentRoute
        ? "agents"
        : route;
  const pendingReplies = agentState.requests.filter(
    (r) => accessStatus(r) === "requested",
  ).length;
  const displayedFilters = activeFilters(filters).filter(
    ([key]) => key !== "type",
  );
  const selectMapProperty = (id) => {
    const property = filtered.find((p) => p.id === id);
    if (!property) return;
    const point = exactLocation(property, locationRequests);
    const group =
      point && !isLocationLocked(property, locationRequests)
        ? filtered
            .filter(
              (p) =>
                p.id !== id &&
                !isLocationLocked(p, locationRequests) &&
                exactLocation(p, locationRequests) &&
                distanceKm(exactLocation(p, locationRequests), point) <= 2,
            )
            .slice(0, 7)
        : [];
    setSelectionGroup([property, ...group].map((p) => p.id));
    setSelected(id);
  };
  const nearbySelections = selectionGroup
    .map((id) => filtered.find((p) => p.id === id))
    .filter(Boolean);
  const seeSimilar = () => {
    setFilters({
      ...initialFilters,
      type: chosen.type,
      min: Math.round(chosen.price * 0.7),
      max: Math.round(chosen.price * 1.3),
    });
    setQuery("");
    setNearPlace(null);
    setAreaOnly(false);
    setBounds(null);
    setSelected(null);
    navigate("results");
  };
  const selectionPreview = chosen ? (
    <SelectedPropertySheet
      p={chosen}
      money={money}
      priceUnit={priceUnit}
      saved={saved.includes(chosen.id)}
      onSave={save}
      items={nearbySelections}
      onSelect={setSelected}
      onClose={() => setSelected(null)}
      onOpen={() => open(chosen)}
      onSimilar={seeSimilar}
      onVisit={() => requestVisit(chosen)}
      locked={isLocationLocked(chosen, locationRequests)}
      onRequestLocation={() => startLocationRequest(chosen)}
    />
  ) : null;

  return (
    <div
      className={
        "app-shell view-" +
        route.split("/")[0] +
        (browse ? " is-browsing" : "") +
        (detail ? " has-detail" : "") +
        (chosen && browse && route !== "results" ? " has-map-selection" : "")
      }
    >
      {route !== "search" && !agentHandle && (
        <header className="header">
          <button
            className="brand"
            onClick={() => navigate("home")}
            aria-label="CentoMeter home"
          >
            <Wordmark />
          </button>
          <div className="header-end">
            <span className="prototype-tag">DESIGN PREVIEW</span>
            <button
              className="avatar small-avatar"
              onClick={() => navigate("profile")}
              aria-label="Open profile"
            >
              {String(profile.name || "")
                .split(/\s+/)
                .filter(Boolean)
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </button>
            <button
              className="header-post"
              aria-label="Post Property — Free"
              onClick={() => {
                setPostingAgent(null);
                navigate("post");
              }}
            >
              <span className="header-post-icon" aria-hidden="true">
                <Plus size={17} />
              </span>
              <span className="header-post-copy">
                <span>Post Property</span>
                <strong>FREE</strong>
              </span>
            </button>
            <IconButton
              label="Notifications"
              onClick={() => setModal("notifications")}
            >
              <Bell size={21} />
            </IconButton>
          </div>
        </header>
      )}
      <main>
        {!browse &&
          !detail &&
          !agentRoute &&
          !["post", "search", "saved", "profile"].includes(route) && (
            <Empty
              as="section"
              className="page empty"
              heading="h1"
              title="Page not found"
              description="This link may be out of date. Return to explore the sample properties."
              action="Back to exploring"
              onAction={() => navigate("home")}
            />
          )}
        {["home", "map", "results", "saved"].includes(route) && (
          <h1 className="sr-only" tabIndex={-1}>
            {routeTitle}
          </h1>
        )}
        {route === "search" && (
          <SearchDiscovery
            city={city}
            cities={Object.keys(centers)}
            onCityChange={selectCity}
            mode={mode}
            query={query}
            onQueryChange={setQuery}
            onBack={() => navigate(searchReturn.current)}
            onSubmit={(term) => {
              setNearPlace(null);
              setQuery(term);
              setAreaOnly(false);
              setSelected(null);
              navigate("results");
            }}
            onProject={open}
            onNearMe={searchNearMe}
            onLand={() => {
              setFilters({ ...initialFilters, type: "Land" });
              setQuery("");
              setNearPlace(null);
              setAreaOnly(false);
              navigate("results");
            }}
            onNotice={notify}
            landmarks={landmarkSuggestions[city] || []}
          />
        )}
        {browse && (
          <>
            <section className="explore-heading" aria-label="Property search">
              <div className="header-location">
                <MapPin size={17} />
                <select
                  aria-label="Select city"
                  value={city}
                  onChange={(e) => selectCity(e.target.value)}
                >
                  {Object.keys(centers).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown size={15} />
              </div>
              <div className="search-controls">
                <PropertySearch
                  city={city}
                  value={query}
                  onChange={setQuery}
                  inputRef={searchRef}
                  onSearch={() => {
                    setAreaOnly(false);
                    setSelected(null);
                    navigate("results");
                  }}
                />
                <button
                  type="button"
                  className="mobile-search-trigger"
                  aria-label="Open search"
                  onClick={openSearch}
                >
                  <Search size={19} aria-hidden="true" />
                  <span>{query || "Locality, landmark or property"}</span>
                </button>
                <button
                  aria-label="Filters"
                  className={
                    "filter-button " +
                    (filters.type !== "All" ||
                    filters.max ||
                    filters.beds !== "Any"
                      ? "has-filter"
                      : "")
                  }
                  onClick={() => setModal("filters")}
                >
                  <SlidersHorizontal size={20} />
                  <span>Filters</span>
                  {activeFilters(filters).length > 0 && (
                    <b className="filter-count">
                      {activeFilters(filters).length}
                    </b>
                  )}
                </button>
              </div>
            </section>
            <div
              className="intent-tabs browse-tabs"
              role="tablist"
              aria-label="Property intent"
            >
              {(route === "home"
                ? ["BUY", "SELL", "RENT"]
                : ["BUY", "RENT"]
              ).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  className={mode === m ? "active" : ""}
                  onClick={() => {
                    if (m === "SELL") {
                      setPostingAgent(null);
                      navigate("post");
                    } else setIntent(m);
                  }}
                >
                  {m === "BUY" ? (
                    <Home size={18} />
                  ) : m === "SELL" ? (
                    <Plus size={18} />
                  ) : (
                    <KeyRound size={18} />
                  )}
                  <span>{m}</span>
                  {mode === m && <span className="tab-indicator" />}
                </button>
              ))}
            </div>
            <div className="explore-toolbar property-type-toolbar">
              <PropertyTypes
                mode={mode}
                value={filters.type}
                allowAll
                onChange={(t) => {
                  if (t !== filters.type) {
                    setFilters((f) => ({
                      ...filterDefaults,
                      type: t,
                      min: f.min,
                      max: f.max,
                    }));
                    setSelected(null);
                  }
                }}
              />
            </div>
            {(displayedFilters.length > 0 || nearPlace) && (
              <div className="discovery-actions">
                {nearPlace && (
                  <button className="chip" onClick={() => setNearPlace(null)}>
                    {nearPlace.radius} km from {nearPlace.name} <X size={12} />
                  </button>
                )}
                {displayedFilters.map(([key, value]) => (
                  <button
                    className="chip"
                    key={key}
                    onClick={() =>
                      setFilters((f) =>
                        key === "type"
                          ? { ...filterDefaults, min: f.min, max: f.max }
                          : { ...f, [key]: initialFilters[key] },
                      )
                    }
                  >
                    {key === "type"
                      ? typeLabel(value)
                      : key === "facing"
                        ? value + " facing"
                        : key === "min"
                          ? "From " + money(value)
                          : key === "max"
                            ? "Under " + money(value)
                            : key === "minArea"
                              ? value + " " + filters.unit
                              : key === "beds"
                                ? String(value)
                                    .split(",")
                                    .map((x) =>
                                      x === "0" ? "Studio" : x + " BHK",
                                    )
                                    .join(", ")
                                : String(value)}{" "}
                    <X size={12} />
                  </button>
                ))}
                {activeFilters(filters).length > 0 && (
                  <button
                    className="text-button"
                    onClick={() => setFilters(initialFilters)}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
            <section
              className={
                "explore-layout " +
                (route === "map"
                  ? mapList
                    ? "map-list-mode"
                    : "map-only"
                  : "") +
                (route === "results" ? "results-layout" : "") +
                (route === "home" ? " home-discovery-layout" : "")
              }
            >
              {route !== "results" && (
                <div className="map-column" hidden={route === "map" && mapList}>
                  <div className="map-stage">
                    <MapView
                      clustered
                      city={city}
                      priceUnit={priceUnit}
                      scrollPreview={route === "home"}
                      viewport={mapViewport.current}
                      onViewport={(v) => {
                        if (route !== "map" || !mapList)
                          mapViewport.current = v;
                      }}
                      items={filtered}
                      requests={locationRequests}
                      selected={selected}
                      onSelect={selectMapProperty}
                      onDismiss={() => setSelected(null)}
                      onBounds={handleBounds}
                      resetKey={resetKey}
                    />
                    {visible.length === 0 && (
                      <button
                        className="empty-map-reset"
                        onClick={() => {
                          mapViewport.current = null;
                          setNearPlace(null);
                          setQuery("");
                          setFilters(initialFilters);
                          setResetKey((x) => x + 1);
                        }}
                      >
                        No properties in this view · Reset map to {city}
                      </button>
                    )}
                    <button
                      type="button"
                      className="agent-picks-toggle"
                      aria-pressed={agentPicks}
                      title="Toggle agent picks"
                      onClick={() => setAgentPicks((v) => !v)}
                    >
                      <UsersRound size={17} aria-hidden="true" />
                      <span>Agent picks</span>
                    </button>
                    <button
                      className="recenter"
                      aria-label="Reset map to city"
                      title="Reset map to city"
                      onClick={() => {
                        mapViewport.current = null;
                        setResetKey((x) => x + 1);
                      }}
                    >
                      <LocateFixed size={21} />
                    </button>
                    <div
                      className={
                        "map-sheet-root" +
                        (route === "map" ? " map-sheet-peek" : "")
                      }
                      ref={mapListToggle}
                    >
                      <button
                        type="button"
                        className={
                          "map-list-toggle" +
                          (route === "map" ? " map-sheet-peek" : "")
                        }
                        aria-expanded={route === "map" && mapList}
                        aria-controls={
                          route === "map" ? "property-results" : undefined
                        }
                        onClick={() => {
                          if (suppressPeekClick.current) {
                            suppressPeekClick.current = false;
                            return;
                          }
                          showList();
                        }}
                        onPointerDown={sheetPointerDown}
                        onPointerMove={sheetPointerMove}
                        onPointerUp={(e) => finishSheetDrag(e, false)}
                        onPointerCancel={(e) => finishSheetDrag(e, true)}
                      >
                        {route === "map" && (
                          <span className="map-sheet-grab" aria-hidden="true" />
                        )}
                        <span className="map-sheet-row">
                          <List size={16} aria-hidden="true" />
                          {route === "results" ? "Show map" : "View list"}
                          {route === "map" && (
                            <span
                              className="map-sheet-count"
                              aria-hidden="true"
                            >
                              {visible.length}{" "}
                              {visible.length === 1
                                ? "property"
                                : "properties"}{" "}
                              in this area
                            </span>
                          )}
                        </span>
                      </button>
                      {route === "map" && (
                        <div className="map-sheet-body" aria-hidden="true" />
                      )}
                    </div>
                    {chosen && !isMobile && (
                      <div className="map-preview">{selectionPreview}</div>
                    )}
                    {route === "map" && !mapList && (
                      <button
                        className="map-save-search"
                        aria-label="Save search"
                        onClick={() => {
                          setSearchName(`${city} · ${mode}`);
                          setModal("saveSearch");
                        }}
                      >
                        <Bookmark size={14} aria-hidden="true" />
                        Save search
                      </button>
                    )}
                    <div className="map-footer-note">
                      Move the map to explore more places
                    </div>
                  </div>
                  {route === "home" && (
                    <div className="home-map-footer">
                      <div>
                        <strong>Explore on map</strong>
                        <p>
                          {filtered.length} sample{" "}
                          {filtered.length === 1 ? "property" : "properties"}{" "}
                          around {city}
                        </p>
                      </div>
                      <button className="primary" onClick={openMap}>
                        <MapIcon size={15} aria-hidden="true" /> Open map
                      </button>
                    </div>
                  )}
                </div>
              )}
              {route === "home" && (
                <HomeDiscovery
                  items={filtered}
                  city={city}
                  agents={agents}
                  agentItems={allProperties}
                  onNavigate={navigate}
                  saved={saved}
                  recent={recent}
                  onSave={save}
                  onOpen={open}
                  priceUnit={priceUnit}
                  onBrowse={() => {
                    setAreaOnly(false);
                    navigate("results");
                  }}
                />
              )}
              {(route === "results" || (route === "map" && mapList)) && (
                <aside
                  className="listing-panel"
                  id="property-results"
                  aria-label="Property list"
                  tabIndex={-1}
                  ref={listingRef}
                >
                  <button
                    className="results-sheet-handle"
                    onClick={showList}
                    aria-label="View property list"
                  >
                    <span />
                  </button>
                  <div className="results-heading">
                    <h2 aria-live="polite">
                      {sorted.length}{" "}
                      {sorted.length === 1 ? "property" : "properties"}
                    </h2>
                    {route === "map" ? (
                      <button
                        className="secondary list-map-button"
                        onClick={() => setMapList(false)}
                      >
                        <MapIcon size={18} /> Back to map
                      </button>
                    ) : route === "results" ? (
                      <button
                        className="secondary list-map-button"
                        onClick={openMap}
                      >
                        <MapIcon size={18} />
                        Map View
                      </button>
                    ) : (
                      <>
                        <button
                          className="secondary home-list-map-button"
                          onClick={openMap}
                        >
                          <MapIcon size={18} />
                          Map
                        </button>
                        <button
                          className="icon-button desktop-expand"
                          aria-label="Expand map"
                          onClick={openMap}
                        >
                          <Maximize2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                  <div className="search-scope">
                    <button
                      className="text-button"
                      onClick={() => {
                        setSearchName(`${city} · ${mode}`);
                        setModal("saveSearch");
                      }}
                    >
                      <Bookmark size={14} aria-hidden="true" /> Save search
                    </button>
                    <span>
                      {areaOnly || route !== "results"
                        ? "Within map area"
                        : "Across " + city}
                    </span>
                    {areaOnly && (
                      <button
                        className="text-button"
                        onClick={() => setAreaOnly(false)}
                      >
                        Search entire city
                      </button>
                    )}
                  </div>
                  <div className="sort-row">
                    <span>{typeLabel(filters.type)}</span>
                    <label>
                      Sort:{" "}
                      <select
                        aria-label="Sort properties"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                      >
                        <option value="recommended">Recommended</option>
                        <option value="newest">Newest</option>
                        <option value="sqft">Price per sq ft</option>
                        <option value="low">Price: low to high</option>
                        <option value="high">Price: high to low</option>
                      </select>
                    </label>
                  </div>
                  <div className="property-grid">
                    {sorted.map((p) => renderCard(p))}
                  </div>
                  {!sorted.length && (
                    <Empty
                      title="A little further afield?"
                      description={
                        activeFilters(filters).length
                          ? "No matches for these filters. Try removing a filter or increasing your budget."
                          : "Try another locality or widen the map."
                      }
                      action="Reset search & map"
                      onAction={clear}
                    />
                  )}
                  <div className="listing-disclaimer">
                    Sample homes. Real possibilities.
                    <br />
                    All listings and prices are illustrative.
                  </div>
                </aside>
              )}
            </section>
          </>
        )}
        {browse &&
          route !== "results" &&
          !(route === "map" && mapList) &&
          chosen &&
          isMobile &&
          selectionPreview}
        {detail && (
          <section className="page detail-page">
            <div className="detail-top">
              <button className="back-button" onClick={goBack}>
                <ArrowLeft size={18} />
                <span>Back</span>
              </button>
              <button
                className="text-button"
                aria-label="Share property"
                onClick={() => shareProperty(detail)}
              >
                <Share2 size={18} />
                <span>Share</span>
              </button>
              <button
                aria-label={
                  saved.includes(detail.id)
                    ? "Unsave property"
                    : "Save property"
                }
                className={
                  "secondary " +
                  (saved.includes(detail.id) ? "saved-outline" : "")
                }
                onClick={() => save(detail.id)}
              >
                <Heart
                  size={17}
                  fill={saved.includes(detail.id) ? "currentColor" : "none"}
                />
                <span>{saved.includes(detail.id) ? "Saved" : "Save"}</span>
              </button>
            </div>
            <Gallery key={detail.id} p={detail} />
            <div className="detail-columns">
              <div>
                {detail.type === "Land" ? (
                  <p className="detail-eyebrow">
                    {detail.mode === "RENT" ? "FOR RENT" : "FOR SALE"} · LAND
                  </p>
                ) : usesHomeDetailLayout(detail) ? (
                  <p className="detail-eyebrow">{houseTypeEyebrow(detail)}</p>
                ) : (
                  <div className="detail-labels">
                    <span className="pill">
                      {detail.mode === "RENT" ? "FOR RENT" : "FOR SALE"}
                    </span>
                    <span className="muted">
                      {typeLabel(detail.type)} · Sample listing
                    </span>
                  </div>
                )}
                {detail.type === "Land" || usesHomeDetailLayout(detail) ? (
                  <MobilePropertyPrice property={detail} money={money} />
                ) : null}
                <h1>{detail.title}</h1>
                <p className="muted location-line">
                  <MapPin size={17} />
                  {detail.locality}, {detail.city}
                </p>
                {detail.agentId && (
                  <button
                    className="text-button agent-profile-link"
                    onClick={() =>
                      navigate(
                        "agent/" +
                          agents.find((a) => a.id === detail.agentId)?.handle,
                      )
                    }
                  >
                    View agent profile
                  </button>
                )}
                {detail.type !== "Land" && !usesHomeDetailLayout(detail) ? (
                  <MobilePropertyPrice property={detail} money={money} />
                ) : null}
                {detail.type !== "Land" && !usesHomeDetailLayout(detail) && (
                  <div className="detail-specs">
                    {!["Land", "Commercial", "PG"].includes(detail.type) && (
                      <div>
                        <BedDouble />
                        <strong>{detail.beds || "Studio"}</strong>
                        <span>
                          {detail.beds ? "Bedrooms" : "Open-plan home"}
                        </span>
                      </div>
                    )}
                    {detail.type === "PG" && (
                      <div>
                        <BedDouble />
                        <strong>{detail.occupancy}</strong>
                        <span>Occupancy</span>
                      </div>
                    )}
                    {detail.baths > 0 && (
                      <div>
                        <Bath />
                        <strong>{detail.baths}</strong>
                        <span>Bathrooms</span>
                      </div>
                    )}
                    {detail.type !== "Land" && (
                      <div>
                        <KeyRound />
                        <strong>{detail.furnishing}</strong>
                        <span>Furnishing</span>
                      </div>
                    )}
                  </div>
                )}
                {detail.type === "Land" ? (
                  <LandSummary
                    p={detail}
                    showDescription={false}
                    onReport={() => setModal("report")}
                  />
                ) : usesHomeDetailLayout(detail) ? (
                  <HouseVillaSummary
                    p={detail}
                    onReport={() => setModal("report")}
                  />
                ) : null}
                <section
                  className="about-the-property"
                  aria-label="About the property"
                >
                  <h2>About the property</h2>
                  <p className="description">
                    {detail.description?.trim() ||
                      (detail.type === "Land"
                        ? `A well-connected plot in ${detail.locality || detail.city}. Ask about documents, access and visit timing.`
                        : detail.type === "Commercial"
                          ? "A flexible commercial space with road access and a practical layout for a growing business. Sample specifications are shown for design review."
                          : detail.type === "PG"
                            ? `${detail.occupancy} with ${String(detail.bathroom || "Not specified").toLowerCase()} bathroom. Meals: ${String(detail.meals || "Not specified").toLowerCase()}. Price shown${priceBasis(detail)}. AC: ${detail.ac}. Sample house rules: quiet hours 10 PM–7 AM; visitor registration required.`
                            : usesHomeDetailLayout(detail)
                              ? "A thoughtfully planned home with room for everyday living. Ask about visit timing and documents."
                              : "A light-filled home with thoughtfully planned spaces, an airy living area and room for life to unfold. Enjoy the balance of a peaceful neighbourhood and easy access to the city’s everyday conveniences.")}
                  </p>
                </section>
                {detail.type !== "Land" && detail.features.length > 0 && (
                  <>
                    <h2>Highlights</h2>
                    <div className="amenities">
                      {detail.features.map((a) => (
                        <span key={a}>
                          <CheckCircle2 size={16} />
                          {a}
                        </span>
                      ))}
                    </div>
                  </>
                )}
                {detail.type !== "Land" && !usesHomeDetailLayout(detail) && (
                  <div className="listing-trust">
                    <span>
                      Listed by {detail.seller} · {detail.freshness} · Sample
                    </span>
                    <button
                      className="text-button"
                      onClick={() => setModal("report")}
                    >
                      Report listing
                    </button>
                  </div>
                )}
                {!["Land", "PG"].includes(detail.type) && (
                  <button
                    className="secondary detail-floor-plan"
                    onClick={() => setModal("floorPlan")}
                  >
                    Preview sample floor plan
                  </button>
                )}
                {detail.type !== "Land" && !usesHomeDetailLayout(detail) && (
                  <div className="property-facts">
                    {supportsFacing(detail.type) && hasValue(detail.facing) && (
                      <div>
                        <small>Facing direction</small>
                        <strong>{detail.facing || "Not specified"}</strong>
                        <small>Main entrance, looking out</small>
                      </div>
                    )}
                    {(detail.type === "PG"
                      ? [
                          ["Occupancy", detail.occupancy],
                          ["Meals", detail.meals],
                          ["Bathroom", detail.bathroom],
                          ["AC", detail.ac],
                        ]
                      : detail.type === "Commercial"
                        ? [
                            ["Suitable use", detail.subtype],
                            ["Fit-out", detail.furnishing],
                            ["Floor", detail.floor],
                          ]
                        : [
                            ["Pets", detail.pets],
                            ["Floor", detail.floor],
                            ["Carpet area", detail.carpetArea],
                          ]
                    )
                      .filter(([, value]) => hasValue(value))
                      .map(([label, value]) => (
                        <div key={label}>
                          <small>{label}</small>
                          <strong>{value || "Not specified"}</strong>
                        </div>
                      ))}
                  </div>
                )}
                {detail.type !== "Land" && !usesHomeDetailLayout(detail) && (
                  <OptionalPropertyDetails p={detail} />
                )}
                {detail.mode === "BUY" && (
                  <EmiCalculator key={detail.id} p={detail} />
                )}
                <LocationGate
                  p={detail}
                  requests={locationRequests}
                  onRequest={startLocationRequest}
                />
                {!detailLocked && detailPoint && (
                  <>
                    <div className="surroundings-heading">
                      <h2>Around this property</h2>
                      <small>
                        Illustrative locations · straight-line distances
                      </small>
                    </div>
                    <div className="nearby-grid property-hotspots">
                      {detailHotspots.map((spot) => (
                        <div key={spot.id}>
                          <span
                            className="hotspot-grid-icon"
                            aria-hidden="true"
                          >
                            {spot.glyph}
                          </span>
                          <strong>{spot.label}</strong>
                          <small>{spot.distance}</small>
                        </div>
                      ))}
                    </div>
                    <div className="detail-map">
                      <MapView
                        staticView
                        city={detail.city}
                        hotspots={detailHotspots}
                        focusPoint={detailPoint}
                        requests={locationRequests}
                        items={[detail]}
                        selected={detail.id}
                      />
                    </div>
                    <a
                      className="map-directions"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${detailPoint[0]},${detailPoint[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get directions in Google Maps
                    </a>
                    <p className="fine-print">
                      Surrounding places and distances are illustrative, not
                      verified nearby amenities.
                    </p>
                  </>
                )}
              </div>
              <aside className="contact-panel">
                <p className="eyebrow">
                  {detail.mode === "RENT" ? "MONTHLY RENT" : "ASKING PRICE"}
                </p>
                <div className="price">{money(detail.price)}</div>
                <p className="muted">
                  <PriceCaption p={detail} money={money} />
                </p>
                <Costs p={detail} money={money} />
                <hr />
                <SellerProfile p={detail} />
                <ContactButtons p={detail} />
                <button
                  type="button"
                  className="primary contact-visit"
                  onClick={() => requestVisit(detail)}
                >
                  Book site visit
                </button>
              </aside>
            </div>
            {similarProperties.length > 0 && (
              <section
                className="similar-properties"
                aria-label="Similar properties"
              >
                <h2>Similar properties</h2>
                <div className="property-card-stack">
                  {similarProperties.map((p) => (
                    <div key={p.id}>{renderCard(p, true)}</div>
                  ))}
                </div>
              </section>
            )}
            <StickyContactBar
              property={detail}
              agent={
                detail.agentId
                  ? agents.find((a) => a.id === detail.agentId)
                  : null
              }
            />
          </section>
        )}
        {route === "post" && !listingsReady && <LoadingSkeleton kind="form" />}
        {route === "post" && listingsReady && (
          <PostFlow
            initialDraft={editing}
            agent={postingAgent}
            city={city}
            onExit={() => {
              setEditing(null);
              navigate("home");
            }}
            onComplete={async (d) => {
              const { next, result } = await savePostedListing({
                data: d,
                agent: postingAgent,
                editing,
                drafts,
                saveListings,
              });
              setDrafts(next);
              setEditing(null);
              if (!result.photosSaved)
                notify(
                  "Listing details saved. Photos could not be retained on this device.",
                );
            }}
          />
        )}
        {route === "saved" && (
          <section className="page activity-page">
            <div
              className="activity-tabs"
              role="tablist"
              aria-label="Property activity"
            >
              {[
                ["saved", "Saved properties", Heart, saved.length],
                ["seen", "Seen properties", Eye, recent.length],
                [
                  "contacted",
                  "Contacted properties",
                  Phone,
                  contactedProperties.length,
                ],
                [
                  "locations",
                  "Requests & visits",
                  MapPin,
                  locationRequests.length +
                    agentState.visits.filter((v) => v.viewerId === viewerId)
                      .length,
                ],
              ].map(([key, label, Icon, count]) => (
                <button
                  key={key}
                  id={`activity-tab-${key}`}
                  type="button"
                  role="tab"
                  aria-selected={activityTab === key}
                  aria-controls={`activity-panel-${key}`}
                  tabIndex={activityTab === key ? 0 : -1}
                  className={activityTab === key ? "active" : ""}
                  onClick={() => setActivityTab(key)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                      e.preventDefault();
                      const tabs = ["saved", "seen", "contacted", "locations"];
                      const index = tabs.indexOf(key);
                      const next =
                        tabs[
                          (index +
                            (e.key === "ArrowRight" ? 1 : tabs.length - 1)) %
                            tabs.length
                        ];
                      setActivityTab(next);
                      document.getElementById(`activity-tab-${next}`)?.focus();
                    }
                  }}
                >
                  <span className="activity-tab-icon">
                    <Icon size={20} />
                  </span>
                  <span className="activity-tab-label">{label}</span>
                  <span className="activity-tab-count">{count}</span>
                </button>
              ))}
            </div>
            <div
              className="activity-panel"
              id={`activity-panel-${activityTab}`}
              role="tabpanel"
              aria-labelledby={`activity-tab-${activityTab}`}
            >
              {activityTab === "saved" && (
                <>
                  <AgentSaved onNavigate={navigate} />
                  <div
                    className="saved-collection-pills"
                    aria-label="Saved lists"
                  >
                    {[
                      "All saved",
                      ...new Set(Object.values(collections).filter(Boolean)),
                    ].map((name) => (
                      <button
                        type="button"
                        key={name}
                        aria-pressed={collection === name}
                        onClick={() => setCollection(name)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                  <div className="saved-grid">
                    {allProperties
                      .filter(
                        (p) =>
                          saved.includes(p.id) &&
                          (collection === "All saved" ||
                            collections[p.id] === collection),
                      )
                      .map((p) => (
                        <div key={p.id}>
                          {renderCard(p)}
                          {notes[p.id] && (
                            <p className="saved-note">{notes[p.id]}</p>
                          )}
                          <button
                            className="text-button"
                            onClick={() => {
                              setCollectionTarget(p.id);
                              setModal("collection");
                            }}
                          >
                            {collections[p.id] || "Add to a list"} · Notes
                          </button>
                        </div>
                      ))}
                  </div>
                  {collection !== "All saved" &&
                    !allProperties.some(
                      (p) =>
                        saved.includes(p.id) &&
                        collections[p.id] === collection,
                    ) && (
                      <p className="muted">No saved properties in this list.</p>
                    )}
                  {!saved.length && (
                    <Empty
                      title="Make room for your favourites"
                      description="Tap the heart on any property to keep it here."
                      action="Explore properties"
                      onAction={() => navigate("home")}
                    />
                  )}
                </>
              )}
              {activityTab === "seen" && (
                <>
                  {recent.length ? (
                    <div className="saved-grid">
                      {recent
                        .map((id) => allProperties.find((p) => p.id === id))
                        .filter(Boolean)
                        .map((p) => renderCard(p))}
                    </div>
                  ) : (
                    <Empty
                      title="No recently viewed properties"
                      description="Properties you open while exploring will appear here."
                      action="Explore properties"
                      onAction={() => navigate("home")}
                    />
                  )}
                </>
              )}
              {activityTab === "locations" && (
                <>
                  <AgentRequests onNavigate={navigate} />
                  <LocationRequests
                    requests={legacyLocationRequests.filter(
                      (r) => r.viewerId === viewerId,
                    )}
                    items={allProperties}
                    onOpen={open}
                  />
                </>
              )}
              {activityTab === "contacted" && (
                <Visits
                  items={contactedProperties.map(({ entry }) => entry)}
                  onChange={(items) =>
                    setActivity((all) =>
                      all.map(
                        (entry) =>
                          items.find((x) => x.id === entry.id) || entry,
                      ),
                    )
                  }
                  onOpen={(entry) => {
                    const property = contactedProperties.find(
                      (x) => x.entry.id === entry.id,
                    )?.property;
                    if (property) open(property);
                  }}
                />
              )}
            </div>
          </section>
        )}
        {["agent", "agents"].includes(route) && (
          <AgentFinder onNavigate={navigate} Modal={Modal} />
        )}
        {route === "agent-dashboard" && (
          <AgentDashboard
            onNavigate={navigate}
            onPost={(agent, listing) => {
              setPostingAgent(agent);
              setEditing(listing || null);
              navigate("post");
            }}
          />
        )}
        {agentHandle && (
          <AgentProfile
            key={agentHandle}
            route={route}
            onNavigate={navigate}
            Modal={Modal}
            Detail={ListingDetailSheet}
          />
        )}

        {route === "profile" && (
          <section className="page profile-page">
            <button
              className="secondary"
              onClick={() => navigate("agent-dashboard")}
            >
              Demo agent dashboard
            </button>
            <div className="page-intro">
              <p className="eyebrow">YOUR SPACE ON CENTOMETER</p>
              <h1>A home for your next move.</h1>
            </div>
            <div className="profile-card">
              <span className="avatar large-avatar">
                {profile.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <h2>{profile.name}</h2>
              <p>{profile.email}</p>
              {profile.phone ? (
                <p className="profile-phone">
                  <Phone size={15} />
                  {profile.phone}
                </p>
              ) : (
                <p className="profile-phone muted">No phone on demo profile</p>
              )}
              <span className="pill">DEMO PROFILE</span>
              <div className="profile-stats">
                <button onClick={() => navigate("saved")}>
                  <strong>{saved.length}</strong>Saved places
                </button>
                <button onClick={() => setModal("drafts")}>
                  <strong>{drafts.length}</strong>Sample listings
                </button>
              </div>
              <div className="profile-links">
                {[
                  [UsersRound, "Agents", "agents"],
                  [User, "Edit profile", "editProfile"],
                  [KeyRound, "Change password", "changePassword"],
                  [Bell, "Notification preferences", "preferences"],
                  [House, "My sample listings", "drafts"],
                  [Search, "Saved searches", "savedSearches"],
                  [Info, "Help & support", "help"],
                  [Info, "About this prototype", "about"],
                ].map(([Icon, label, key]) => (
                  <button
                    key={key}
                    onClick={() =>
                      key === "agents" ? navigate("agents") : setModal(key)
                    }
                  >
                    <Icon size={20} />
                    <span>{label}</span>
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
              <button
                className="secondary profile-signout"
                onClick={() => {
                  navigate("home");
                  notify("This demo profile is not connected to an account.");
                }}
              >
                <LogOut size={18} />
                Sign out
              </button>
            </div>
          </section>
        )}
      </main>
      {route !== "search" && (
        <nav className="bottom-nav" aria-label="Main navigation">
          {[
            [Home, "Home", "home"],
            [MapIcon, "Map", "map"],
            [UsersRound, "Agents", "agents"],
            [Clock3, "Activity", "saved"],
            [User, "Profile", "profile"],
          ].map(([Icon, label, r]) => (
            <button
              key={r}
              aria-current={activeNav === r ? "page" : undefined}
              className={
                (activeNav === r ? "active " : "") +
                (r === "agents" ? "agent-nav" : "")
              }
              onClick={() => {
                if (r === "map") openMap();
                else navigate(r);
              }}
            >
              <span>
                <Icon size={21} />
                {r === "agents" && pendingReplies > 0 && (
                  <b
                    className="agent-reply-badge"
                    aria-label={pendingReplies + " pending replies"}
                  >
                    {pendingReplies}
                  </b>
                )}
              </span>
              <small>{label}</small>
            </button>
          ))}
        </nav>
      )}
      <AgentToasts />
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={17} />
          {toast}
          {toast === "Added to your saved places" && savedToastId && (
            <button
              onClick={() => {
                setCollectionTarget(savedToastId);
                setModal("collection");
                setToast("");
              }}
            >
              Add note / list
            </button>
          )}
        </div>
      )}
      {modal === "locationRequest" &&
        allProperties.find((p) => p.id === locationTarget) && (
          <Modal title="Request exact location" onClose={() => setModal(null)}>
            <LocationRequestForm
              p={allProperties.find((p) => p.id === locationTarget)}
              profile={profile}
              onSubmit={(contact) => {
                const p = allProperties.find((p) => p.id === locationTarget);
                const entry = {
                  id: crypto.randomUUID(),
                  propertyId: p.id,
                  agentId: p.agentId,
                  viewerId,
                  ...contact,
                  status: "requested",
                  createdAt: new Date().toISOString(),
                  expiresAt: null,
                  source: leadSource.current,
                };
                setLocationRequests((xs) => [
                  entry,
                  ...xs.filter((r) => r.propertyId !== p.id),
                ]);
                setModal(null);
                notify(
                  "Location requested. The agent can reply in the demo inbox.",
                );
              }}
            />
          </Modal>
        )}
      {modal === "filters" && (
        <SmartFilters
          Modal={Modal}
          items={candidates.filter((p) => {
            const point = mapPoint(p, locationRequests);
            return (
              (route === "results" && !areaOnly) ||
              !bounds ||
              (point && bounds.contains(point))
            );
          })}
          filters={filters}
          mode={mode}
          onClose={() => setModal(null)}
          onApply={(f) => {
            setFilters(f);
            setSelected(null);
            setModal(null);
          }}
        />
      )}
      {modal === "notifications" && (
        <Modal title="A little update" onClose={() => setModal(null)}>
          <div className="notification-card">
            <span className="notification-icon">
              <Home size={22} />
            </span>
            <div>
              <h3>Welcome to your next chapter</h3>
              <p>
                Explore sample homes, save your favourites and try posting a
                property.
              </p>
              <small>Design preview · Just now</small>
            </div>
          </div>
          <button
            className="primary full"
            onClick={() => {
              setModal(null);
              navigate("saved");
            }}
          >
            Explore saved places
          </button>
        </Modal>
      )}
      {modal === "contact" && (
        <Modal title="Come see it for yourself" onClose={() => setModal(null)}>
          {contactSent ? (
            <div className="empty">
              <CheckCircle2 size={40} />
              <h3>Visit request recorded</h3>
              <p>
                This is a sample confirmation. No appointment was booked and no
                message was sent.
              </p>
              <button className="primary" onClick={() => setModal(null)}>
                Done
              </button>
            </div>
          ) : (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                if (String(f.get("date") || "") < visitDates()[0].value) {
                  setContactError("Choose a future date for your visit.");
                  return;
                }
                if (!indianMobile(f.get("phone"))) {
                  setContactError(
                    "Enter a valid 10-digit Indian mobile number starting with 6–9.",
                  );
                  return;
                }
                setContactError("");
                setContactSent(true);
                setActivity((a) => [
                  {
                    id: Date.now(),
                    propertyId: contactProperty?.id,
                    name: f.get("name"),
                    email: f.get("email"),
                    phone: f.get("phone"),
                    title: contactProperty?.title,
                    person: contactProperty?.contactName,
                    kind: "Visit request",
                    status: "Requested",
                    date: f.get("date"),
                    slot: f.get("slot"),
                    method: f.get("method"),
                    time: new Date().toLocaleString(),
                  },
                  ...a,
                ]);
              }}
            >
              <p className="muted">
                {contactProperty?.title} · {contactProperty?.locality}
              </p>
              <div className="note">
                <Info size={18} />
                <span>
                  Use placeholder details. This form demonstrates the experience
                  only.
                </span>
              </div>
              <label>
                Preferred contact
                <select name="method" defaultValue="WhatsApp">
                  <option>WhatsApp</option>
                  <option>Phone</option>
                  <option>Email</option>
                </select>
              </label>
              <label>
                Phone / WhatsApp
                <input
                  name="phone"
                  type="tel"
                  required
                  placeholder="+91 mobile number"
                  onChange={() => setContactError("")}
                />
              </label>
              <label>
                Name
                <input
                  name="name"
                  required
                  defaultValue={profile.name}
                  maxLength={80}
                />
              </label>
              <label>
                Email (optional)
                <input
                  name="email"
                  type="email"
                  defaultValue={profile.email}
                  placeholder="Email address"
                />
              </label>
              {
                <div
                  className="quick-date-chips"
                  role="group"
                  aria-label="Quick visit dates"
                >
                  {visitDates().map(({ label, value }) => (
                    <button
                      type="button"
                      key={label}
                      aria-pressed={visitDate === value}
                      onClick={() => setVisitDate(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              }
              {
                <div className="form-columns">
                  <label>
                    Preferred date
                    <input
                      name="date"
                      aria-label="Preferred visit date"
                      type="date"
                      required
                      min={visitDates()[0].value}
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                    />
                  </label>
                  <label>
                    Time (IST)
                    <select name="slot">
                      <option>10:00 AM</option>
                      <option>12:00 PM</option>
                      <option>4:00 PM</option>
                    </select>
                  </label>
                </div>
              }
              <p className="fine-print">
                In the final app, submitting would share your entered details
                with this listing’s contact only. This preview sends nothing.
              </p>
              {contactError && (
                <p role="alert" className="form-error">
                  {contactError}
                </p>
              )}
              <button className="primary" type="submit">
                Preview visit request
              </button>
            </form>
          )}
        </Modal>
      )}
      {modal === "editProfile" && (
        <Modal title="Edit your demo profile" onClose={() => setModal(null)}>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.target);
              setProfile({
                name: f.get("name"),
                email: f.get("email"),
                phone: f.get("phone"),
              });
              setModal(null);
              notify("Demo profile updated for this session");
            }}
          >
            <label>
              Display name
              <input
                name="name"
                required
                defaultValue={profile.name}
                maxLength={60}
              />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                required
                defaultValue={profile.email}
              />
            </label>
            <label>
              Phone number
              <input name="phone" type="tel" defaultValue={profile.phone} />
            </label>
            <p className="fine-print">
              Use sample details. No account is created.
            </p>
            <button className="primary">Save changes</button>
          </form>
        </Modal>
      )}
      {modal === "changePassword" && (
        <Modal title="Change password" onClose={() => setModal(null)}>
          <p className="muted">
            This demo profile isn’t connected to an account, so it doesn’t have
            a password to change. Password management will be available when
            account sign-in is added.
          </p>
          <button className="primary full" onClick={() => setModal(null)}>
            Got it
          </button>
        </Modal>
      )}
      {modal === "preferences" && (
        <Modal title="Notification preferences" onClose={() => setModal(null)}>
          <label className="check-row">
            <span>
              <Bell size={20} />
              <span>
                New places to explore
                <small>Sample preference for this session</small>
              </span>
            </span>
            <input
              type="checkbox"
              checked={alerts}
              onChange={(e) => setAlerts(e.target.checked)}
            />
          </label>
          <button
            className="primary full"
            onClick={() => {
              setModal(null);
              notify("Preference updated. No notifications will be sent.");
            }}
          >
            Save preferences
          </button>
        </Modal>
      )}
      {modal === "drafts" && (
        <Modal title="Your sample listings" onClose={() => setModal(null)}>
          <button
            className="secondary full"
            onClick={() => {
              removeLocal("centometer-draft");
              setEditing(null);
              navigate("post");
            }}
          >
            Start another listing
          </button>
          {readLocal("centometer-draft-bank", [])
            .filter(
              (d, i, all) =>
                all.findIndex((x) => String(x.id) === String(d.id)) === i,
            )
            .map((d) => (
              <div className="draft-card" key={d.id}>
                <div>
                  <h3>{d.data.title}</h3>
                  <small>Draft · step {d.step + 1} of 4</small>
                </div>
                <button
                  className="secondary"
                  onClick={() => {
                    writeLocal("centometer-draft", d);
                    setEditing(null);
                    navigate("post");
                  }}
                >
                  Resume
                </button>
              </div>
            ))}
          {readLocal("centometer-draft", null) &&
            !readLocal("centometer-draft-bank", []).some(
              (d) =>
                String(d.id) ===
                String(readLocal("centometer-draft", null)?.id),
            ) && (
              <button
                className="secondary full"
                onClick={() => {
                  setEditing(null);
                  navigate("post");
                }}
              >
                Resume unfinished draft
              </button>
            )}
          {drafts.length ? (
            drafts.map((d) => (
              <div className="draft-card" key={d.id}>
                <House size={22} />
                <div>
                  <h3>{d.title}</h3>
                  <p>
                    {typeLabel(d.type)} · {money(Number(d.price))}
                  </p>
                  <small>
                    {d.unavailable ? "Marked unavailable" : "Available"} ·
                    Visible on this device
                  </small>
                  <button
                    className="text-button"
                    onClick={() =>
                      setDrafts((ds) =>
                        ds.map((x) =>
                          String(x.id) === String(d.id)
                            ? { ...x, unavailable: !x.unavailable }
                            : x,
                        ),
                      )
                    }
                  >
                    {d.unavailable ? "Mark available" : "Mark unavailable"}
                  </button>
                  <button
                    className="text-button"
                    onClick={() => {
                      setEditing(d);
                      navigate("post");
                    }}
                  >
                    Edit sample listing
                  </button>
                </div>
                <IconButton
                  label={"Remove sample " + d.title}
                  onClick={() =>
                    setDrafts((ds) =>
                      ds.filter((x) => String(x.id) !== String(d.id)),
                    )
                  }
                >
                  <X size={17} />
                </IconButton>
              </div>
            ))
          ) : (
            <Empty
              title="Your next listing starts here"
              description="Try the four-step posting experience with sample details."
              action="Post a property"
              onAction={() => navigate("post")}
            />
          )}
        </Modal>
      )}
      {modal === "saveSearch" && (
        <Modal title="Name this search" onClose={() => setModal(null)}>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (!searchName.trim()) return;
              const entry = {
                id: Date.now(),
                name: searchName.trim(),
                city,
                mode,
                query,
                filters,
                agentPicks,
                ...safeSearchArea(
                  {
                    nearPlace,
                    viewport: mapViewport.current,
                    bounds:
                      (areaOnly || route !== "results") && bounds
                        ? [
                            [bounds.getSouth(), bounds.getWest()],
                            [bounds.getNorth(), bounds.getEast()],
                          ]
                        : null,
                  },
                  filtered.some((p) => p.agentId),
                ),
              };
              setSavedSearches((xs) => [entry, ...xs].slice(0, 20));
              setModal(null);
              notify("Search and area saved");
            }}
          >
            <label>
              Search name
              <input
                required
                maxLength="70"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </label>
            <p>
              {city} · {mode} ·{" "}
              {areaOnly || route !== "results"
                ? "Current map area"
                : "Entire city"}
            </p>
            <button className="primary">Save search</button>
          </form>
        </Modal>
      )}
      {modal === "savedSearches" && (
        <Modal title="Your saved searches" onClose={() => setModal(null)}>
          <SearchLibrary
            entries={savedSearches}
            onChange={setSavedSearches}
            onOpen={async (entry) => {
              const { default: L } = await import("leaflet");
              mapViewport.current = entry.viewport || null;
              setBounds(entry.bounds ? L.latLngBounds(entry.bounds) : null);
              setAreaOnly(!!entry.bounds);
              setCity(entry.city);
              setMode(entry.mode === "RENT" ? "RENT" : "BUY");
              setAgentPicks(!!entry.agentPicks);
              setQuery(entry.query);
              setNearPlace(entry.nearPlace || null);
              setFilters(
                Object.fromEntries(
                  Object.entries(initialFilters).map(([key, value]) => [
                    key,
                    key === "seller" &&
                    !["Any", "Owner", "Agent", "Builder"].includes(
                      entry.filters?.[key],
                    )
                      ? "Any"
                      : (entry.filters?.[key] ?? value),
                  ]),
                ),
              );
              setResetKey((x) => x + 1);
              navigate("results");
            }}
          />
        </Modal>
      )}
      {modal === "collection" && (
        <Modal
          title="Organise this saved property"
          onClose={() => setModal(null)}
        >
          <form
            key={collectionTarget}
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const name = String(f.get("name") || "").trim();
              setCollections((c) => {
                const next = { ...c };
                if (name) next[collectionTarget] = name;
                else delete next[collectionTarget];
                return next;
              });
              setNotes((n) => ({
                ...n,
                [collectionTarget]: String(f.get("note") || "").trim(),
              }));
              setModal(null);
            }}
          >
            <label>
              List name (optional)
              <input
                name="name"
                list="collection-names"
                maxLength="50"
                placeholder="e.g. Visit this weekend"
                defaultValue={collections[collectionTarget] || ""}
              />
              <datalist id="collection-names">
                {[...new Set(Object.values(collections).filter(Boolean))].map(
                  (n) => (
                    <option key={n}>{n}</option>
                  ),
                )}
              </datalist>
            </label>
            <label>
              Private note
              <textarea
                name="note"
                defaultValue={notes[collectionTarget] || ""}
              />
            </label>
            <button className="primary">Save note / list</button>
            {collections[collectionTarget] && (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setCollections((c) => {
                    const next = { ...c };
                    delete next[collectionTarget];
                    return next;
                  });
                  setModal(null);
                }}
              >
                Remove from list
              </button>
            )}
          </form>
        </Modal>
      )}
      {modal === "share" && (
        <Modal title="Property summary" onClose={() => setModal(null)}>
          <label>
            Copy this sample summary
            <textarea
              readOnly
              value={shareText}
              rows="4"
              onFocus={(e) => e.target.select()}
            />
          </label>
          <button
            className="primary"
            onClick={async () => {
              try {
                if (!navigator.clipboard?.writeText)
                  throw new Error("Clipboard unavailable");
                await navigator.clipboard.writeText(shareText);
                notify("Property summary copied");
              } catch {
                notify("Select the summary and use Copy on your device");
              }
            }}
          >
            Copy summary
          </button>
          <p className="fine-print">This preview shares a property summary.</p>
        </Modal>
      )}
      {modal === "help" && (
        <Modal title="Help & support" onClose={() => setModal(null)}>
          <div className="form-stack">
            <h3>How do I find a property?</h3>
            <p>
              Choose a city, select Buy or Rent and search a locality or
              landmark. Use filters to narrow results.
            </p>
            <h3>Where is my draft?</h3>
            <p>
              Open Post to resume. Drafts and saved searches are kept on this
              device.
            </p>
            <h3>Is this a live marketplace?</h3>
            <p>
              No. Listings, costs and enquiries are examples for design review.
            </p>
          </div>
        </Modal>
      )}
      {modal === "report" && (
        <Modal title="Report this listing" onClose={() => setModal(null)}>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              setModal(null);
              notify("Report preview recorded. Nothing was sent.");
            }}
          >
            <label>
              Reason
              <select>
                <option>Incorrect details</option>
                <option>Duplicate listing</option>
                <option>No longer available</option>
                <option>Suspicious listing</option>
              </select>
            </label>
            <label>
              Additional details
              <textarea rows="3" placeholder="Use sample information only" />
            </label>
            <button className="primary">Preview report</button>
          </form>
        </Modal>
      )}
      {modal === "floorPlan" && (
        <Modal title="Illustrative floor plan" onClose={() => setModal(null)}>
          <div className="sample-floorplan">
            <span>Living / workspace</span>
            <span>Room 1</span>
            <span>Kitchen</span>
            <span>Bathroom</span>
            <span>Room 2</span>
            <span>Entrance</span>
          </div>
          <p className="fine-print">
            Generic layout illustration, not this property's actual plan. Not to
            scale.
          </p>
        </Modal>
      )}
      {modal === "clearSaved" && (
        <Modal title="Clear saved properties?" onClose={() => setModal(null)}>
          <p>
            This removes your shortlist. Your listings and searches stay on this
            device.
          </p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setModal(null)}>
              Keep saved properties
            </button>
            <button
              className="primary"
              onClick={() => {
                setSaved([]);
                setModal(null);
                notify("Saved properties cleared");
              }}
            >
              Clear saved properties
            </button>
          </div>
        </Modal>
      )}
      {modal === "about" && (
        <Modal
          title="Designed for your next chapter"
          onClose={() => setModal(null)}
        >
          <p>
            CentoMeter is an interactive UI/UX prototype for an Indian real
            estate marketplace.
          </p>
          <p>
            All properties, prices and advisors are fictional. Photography is
            illustrative. The map uses OpenStreetMap.
          </p>
          <p>
            Saved properties, searches, recently viewed homes and listing drafts
            stay on this device. Visit requests are saved on this device;
            profile edits last for this session. There are no accounts, payments
            or live listings.
          </p>
          <button
            className="secondary full"
            onClick={() => setModal("clearSaved")}
          >
            Clear saved properties
          </button>
        </Modal>
      )}
    </div>
  );
}
