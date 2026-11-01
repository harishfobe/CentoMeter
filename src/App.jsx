import AgentToasts from "./components/agent/AgentToasts";
import { sameAgentPage } from "./lib/agentNavigation";
import { flushSync } from "react-dom";
import { routeMotion } from "./lib/routeMotion";
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import L from "leaflet";
import "leaflet.markercluster";
import useOverlayBack from "./OverlayHistory";
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
  Check,
  CheckCircle2,
  Maximize2,
  LocateFixed,
  List,
  ImagePlus,
  BedDouble,
  Bath,
  Square,
  Phone,
  LogOut,
  Info,
  Clock3,
  Eye,
  Share2,
} from "lucide-react";
import properties from "./properties.json";
import agents from "./data/agents.json";
import agentListings from "./data/agentListings.json";
import { useAgentStore, viewerId } from "./lib/agentStore";
import { AgentRequests, AgentSaved } from "./components/agent/AgentActivity";
import AgentDashboard from "./pages/AgentDashboard";
import { updateStore } from "./lib/agentStore";
import AgentFinder from "./pages/AgentFinder";
import AgentProfile from "./pages/AgentProfile";
import ListingDetailSheet from "./components/agent/ListingDetailSheet";
import { parseAgentRoute } from "./lib/agents";
import { LocationGate, LocationRequestForm, LocationRequests } from "./AgentUI";
import {
  accessStatus,
  isLocationLocked,
  mapPoint,
  exactLocation,
  publicBoundary,
  registerExactLocation,
  restoreExactLocations,
  safeSearchArea,
  publicShare,
  leadSourceFromSearch,
} from "./lib/locationAccess";
import {
  restorePhotos,
  restoreListings,
  persistListings,
  deletePhotos,
  migrateDraftPhotos,
} from "./PhotoStorage";
import useDraftStorage from "./useDraftStorage";
import LocationSearch from "./LocationSearch";
import {
  OptionalListingFields,
  OptionalPropertyDetails,
  EmiCalculator,
} from "./PropertyExtras";
import {
  centers,
  money,
  normalizePostedListing,
  indianMobile,
  sortProperties,
  hasValue,
  cityForLocation,
} from "./PropertyModel";
import { visitDates, landPrice, compressPhotos } from "./JourneyUX";
import {
  SellerProfile,
  ContactButtons,
  propertyHotspots,
} from "./PropertyContact";
import PropertyTypes, { typeLabel } from "./PropertyTypes";
import { MobilePropertyPrice } from "./MobileUI";
import {
  Wordmark,
  PropertyActionBar,
  SelectedPropertySheet,
  PriceCaption,
} from "./MinimalUI";
import SearchDiscovery from "./SearchDiscovery";
import { developerFor } from "./SearchSuggestions";
import { pinPrice, plotBoundary, plotStyle } from "./PlotUI";
import { mobileQuery, bindMapInteractions } from "./MapInteractions";
import {
  LandSummary,
  LandFields,
  LandAreaFields,
  landArea,
} from "./LandDetails";
import {
  priceBasis,
  areaBasis,
  nearText,
  distanceKm,
  SearchLibrary,
  Visits,
} from "./Journeys";
import {
  facingDirections,
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

const NO_HOTSPOTS = Object.freeze([]);
const NO_ITEMS = Object.freeze([]);
const mapAccessBefore = new Map();
const initialFilters = filterDefaults;
const readSaved = () => {
  const value = readLocal("centometer-saved", []);
  return Array.isArray(value) ? value : [];
};
const landmarkSuggestions = {
  Bengaluru: [
    ["Indiranagar Metro Station", "Indiranagar"],
    ["Phoenix Marketcity", "Whitefield"],
    ["Lalbagh Botanical Garden", "Jayanagar"],
  ],
  Hyderabad: [
    ["DLF Cyber City", "Gachibowli"],
    ["Botanical Garden", "Kondapur"],
    ["Durgam Cheruvu", "Madhapur"],
  ],
  Pune: [
    ["Balewadi High Street", "Balewadi"],
    ["Aundh IT Park", "Aundh"],
    ["Karishma Society", "Kothrud"],
  ],
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
function IconButton({ label, children, ...props }) {
  return (
    <button className="icon-button" aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}
export function Modal({
  title,
  onClose,
  children,
  historyManaged = false,
  motionKind,
  exiting = false,
}) {
  const ref = useRef(null);
  const close = useRef(onClose);
  const dirtyForm = useRef(false);
  close.current = onClose;
  useOverlayBack(!historyManaged, () => close.current());
  useEffect(() => {
    const before = document.activeElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector("button")?.focus({ preventScroll: true });
    const key = (e) => {
      const dialogs = document.querySelectorAll(".modal");
      if (ref.current !== dialogs[dialogs.length - 1]) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        close.current();
      }
      if (e.key === "Tab") {
        const els = ref.current.querySelectorAll(
          "button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]",
        );
        const first = els[0],
          last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", key);
      if (before?.isConnected) before.focus({ preventScroll: true });
    };
  }, []);
  return (
    <div
      className="modal-scrim"
      data-motion-kind={motionKind}
      data-exiting={exiting}
      onChangeCapture={(e) => {
        if (e.target.closest("form")) dirtyForm.current = true;
      }}
      onMouseDown={(e) => {
        if (
          e.target === e.currentTarget &&
          !(dirtyForm.current && ref.current?.querySelector("form"))
        )
          close.current();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        tabIndex={-1}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <IconButton label="Close dialog" onClick={() => close.current()}>
            <X />
          </IconButton>
        </div>
        {children}
      </section>
    </div>
  );
}
function MapView({
  city,
  items = NO_ITEMS,
  selected,
  onSelect,
  onBounds,
  location,
  onLocation,
  onDismiss,
  resetKey = 0,
  focusPoint,
  viewport,
  onViewport,
  scrollPreview = false,
  priceUnit = "total",
  hotspots = NO_HOTSPOTS,
  staticView = false,
  clustered = false,
  requests = NO_ITEMS,
}) {
  const accessBefore = useRef(mapAccessBefore);
  const host = useRef();
  const map = useRef();
  const markers = useRef();
  const clusters = useRef(null);
  const point = useRef();
  const callbacks = useRef({ onSelect, onBounds, onLocation });
  callbacks.current = {
    onSelect,
    onBounds,
    onLocation,
    onDismiss,
    hotspots,
    focusPoint,
    items,
    requests,
  };
  const fitPropertyFrame = (m) => {
    const frame = callbacks.current;
    const points = [
      ...(frame.focusPoint ? [frame.focusPoint] : []),
      ...frame.hotspots.map((p) => [p.lat, p.lng]),
      ...frame.items.flatMap((p) => {
        const point = mapPoint(p, frame.requests);
        return point ? publicBoundary(p, frame.requests) || [point] : [];
      }),
    ];
    if (points.length)
      m.fitBounds(L.latLngBounds(points), {
        padding: [65, 65],
        maxZoom: 14,
        animate: false,
      });
  };
  const [tileError, setTileError] = useState(false);
  const [mapLayer, setMapLayer] = useState("street");
  const tileLayer = useRef(null);
  useEffect(() => {
    const m = L.map(host.current, {
      maxZoom: 19,
      zoomControl: false,
      dragging: !staticView,
      touchZoom: !staticView,
      scrollWheelZoom: !staticView,
      doubleClickZoom: !staticView,
      boxZoom: !staticView,
      keyboard: !staticView,
      tapHold: !staticView,
    }).setView(
      viewport?.center || centers[city],
      viewport?.zoom || (window.innerWidth < 700 ? 11 : 12),
    );
    map.current = m;
    if (!staticView) L.control.zoom({ position: "topright" }).addTo(m);
    markers.current = L.layerGroup().addTo(m);
    if (clustered && !staticView)
      clusters.current = L.markerClusterGroup({
        maxClusterRadius: 45,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
      }).addTo(m);
    const report = () => {
      callbacks.current.onBounds?.(m.getBounds());
      onViewport?.({
        center: [m.getCenter().lat, m.getCenter().lng],
        zoom: m.getZoom(),
      });
    };
    m.on("moveend zoomend", report);
    m.on("click", (e) => {
      if (callbacks.current.onLocation)
        callbacks.current.onLocation([e.latlng.lat, e.latlng.lng]);
      else callbacks.current.onDismiss?.();
    });
    report();
    const observer = new ResizeObserver(() => {
      m.invalidateSize({ pan: false });
      if (staticView) fitPropertyFrame(m);
      report();
    });
    observer.observe(host.current);
    return () => {
      observer.disconnect();
      m.remove();
    };
  }, []);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    tileLayer.current?.remove();
    setTileError(false);
    const satellite = mapLayer === "satellite";
    const tiles = L.tileLayer(
      satellite
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution: satellite
          ? "Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community"
          : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    ).addTo(m);
    tiles.on("tileerror", () => setTileError(true));
    tiles.on("tileload", () => setTileError(false));
    tileLayer.current = tiles;
    return () => tiles.remove();
  }, [mapLayer]);
  useEffect(
    () =>
      bindMapInteractions(
        map.current,
        host.current,
        window.matchMedia(mobileQuery),
        scrollPreview,
        staticView,
      ),
    [scrollPreview, staticView],
  );
  useEffect(() => {
    map.current.setView(
      focusPoint || viewport?.center || centers[city],
      focusPoint ? 14 : viewport?.zoom || (window.innerWidth < 700 ? 11 : 12),
    );
  }, [city, resetKey, focusPoint?.[0], focusPoint?.[1]]);
  useEffect(() => {
    markers.current.clearLayers();
    clusters.current?.clearLayers();
    const animations = [];
    items.forEach((p) => {
      const point = mapPoint(p, requests);
      if (!point) return;
      const locked = isLocationLocked(p, requests);
      const agent = agents.find((a) => a.id === p.agentId);
      const boundary = plotBoundary({
        ...p,
        boundary: publicBoundary(p, requests),
      });
      if (boundary) {
        const polygon = L.polygon(boundary, {
          ...plotStyle(p, p.id === selected),
          bubblingMouseEvents: false,
          interactive: !staticView,
        }).addTo(markers.current);
        polygon.on("click", () => callbacks.current.onSelect?.(p.id));
        const path = polygon.getElement();
        if (path && !staticView) {
          path.setAttribute("role", "button");
          path.setAttribute("tabindex", "0");
          path.setAttribute("aria-label", p.title + " plot boundary");
          path.setAttribute("aria-pressed", String(p.id === selected));
          path.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              callbacks.current.onSelect?.(p.id);
            }
          });
        }
      }
      const label =
        p.type === "Land" && p.mode === "BUY"
          ? money(landPrice(p, priceUnit).amount).replace(/\s/g, "") +
            { total: "", cent: "/c", sqft: "/sqft" }[priceUnit]
          : pinPrice(p, money);
      if (locked) {
        L.circle(point, {
          radius: Math.max(100, Number(p.privacy?.radiusM) || 800),
          color: "#F96B13",
          weight: 1.5,
          fillColor: "#F96B13",
          fillOpacity: 0.1,
          interactive: false,
        }).addTo(markers.current);
      }
      if (
        !locked &&
        accessBefore.current.get(p.id) &&
        p.approx &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        const ring = L.circle(p.approx, {
          radius: p.privacy?.radiusM || 800,
          color: "#F96B13",
          fillOpacity: 0.12,
          interactive: false,
        }).addTo(markers.current);
        let start;
        const frame = (t) => {
          start ??= t;
          const progress = Math.min(1, (t - start) / 500);
          ring.setLatLng([
            p.approx[0] + (point[0] - p.approx[0]) * progress,
            p.approx[1] + (point[1] - p.approx[1]) * progress,
          ]);
          ring.setRadius(
            Math.max(1, (p.privacy?.radiusM || 800) * (1 - progress)),
          );
          if (progress < 1) animations.push(requestAnimationFrame(frame));
          else ring.remove();
        };
        animations.push(requestAnimationFrame(frame));
      }
      accessBefore.current.set(p.id, locked);
      const marker = L.marker(point, {
        icon: L.divIcon({
          className:
            (locked ? "agent-radius-marker " : "price-marker ") +
            (p.type === "Land" ? "type-land " : "type-home ") +
            (p.id === selected ? "selected" : ""),
          html: locked
            ? '<span><img alt="" src="' +
              (agent?.avatar || "/agent-ananya.svg") +
              '"/></span>'
            : "<span>" + label + "</span>",
          iconSize: [94, 38],
          iconAnchor: [47, 40],
        }),
        title: p.title + ", " + label,
        bubblingMouseEvents: false,
        keyboard: !staticView,
        interactive: !staticView,
        zIndexOffset: p.id === selected ? 1000 : 0,
      }).addTo(clusters.current || markers.current);
      marker.on("click", () => callbacks.current.onSelect?.(p.id));
      const el = marker.getElement();
      el?.setAttribute("role", staticView ? "img" : "button");
      el?.setAttribute(
        "aria-label",
        p.title + ", " + label.replace("/c", " per cent"),
      );
      if (!staticView)
        el?.setAttribute("aria-pressed", String(selected === p.id));
      el?.setAttribute("data-property-id", p.id);
    });
    hotspots.forEach((spot) => {
      L.marker([spot.lat, spot.lng], {
        icon: L.divIcon({
          className: "hotspot-marker hotspot-" + spot.id,
          html:
            "<span><i>" +
            spot.glyph +
            "</i>" +
            spot.label +
            "<small>" +
            spot.distance +
            "</small></span>",
          iconSize: [116, 32],
          iconAnchor:
            spot.id === "school"
              ? [128, 54]
              : spot.id === "hospital"
                ? [40, 54]
                : spot.id === "transit"
                  ? [110, -12]
                  : [65, -12],
        }),
        title: spot.label + " · " + spot.distance + " · illustrative location",
        keyboard: !staticView,
        interactive: !staticView,
        zIndexOffset: 100,
      }).addTo(markers.current);
    });
    return () => animations.forEach(cancelAnimationFrame);
  }, [items, selected, priceUnit, hotspots, staticView, requests]);
  useEffect(() => {
    if (staticView) {
      fitPropertyFrame(map.current);
      return;
    }
    if (hotspots.length && focusPoint)
      map.current.fitBounds(
        L.latLngBounds([focusPoint, ...hotspots.map((p) => [p.lat, p.lng])]),
        { padding: [65, 65], maxZoom: 14 },
      );
  }, [hotspots, staticView, focusPoint?.[0], focusPoint?.[1]]);
  useEffect(() => {
    if (point.current) point.current.remove();
    if (location) {
      if (onLocation)
        map.current.setView(location, Math.max(map.current.getZoom(), 14));
      point.current = L.marker(location, {
        icon: L.divIcon({
          className: "location-pin",
          html: "<span></span>",
          iconSize: [26, 26],
        }),
      }).addTo(map.current);
    }
  }, [location]);
  return (
    <>
      {!staticView && (
        <button
          type="button"
          className="map-layer-toggle"
          aria-label="Satellite view"
          aria-pressed={mapLayer === "satellite"}
          onClick={() =>
            setMapLayer((v) => (v === "street" ? "satellite" : "street"))
          }
        >
          {mapLayer === "street" ? "Satellite" : "Street"}
        </button>
      )}
      <div
        className={"map-canvas" + (staticView ? " static-property-map" : "")}
        data-map-layer={mapLayer}
        ref={host}
        role={staticView ? "region" : undefined}
        aria-label={
          staticView
            ? "Property and surrounding hotspots"
            : onLocation
              ? "Choose a property location on the map"
              : "Interactive property map"
        }
      >
        {tileError && (
          <div className="map-warning">
            Map tiles unavailable. Check your connection; sample markers still
            work.
          </div>
        )}
      </div>
      {items.some(
        (p) =>
          !isLocationLocked(p, requests) &&
          plotBoundary({ ...p, boundary: publicBoundary(p, requests) }),
      ) && (
        <div className="plot-map-legend" aria-label="Plot status legend">
          {["available", "reserved", "sold"].map((status) => (
            <span key={status}>
              <i className={status} />
              {status}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
function PropertyCard({
  p,
  saved,
  onSave,
  onOpen,
  compact = false,
  priceUnit = "total",
}) {
  return (
    <article className={"property-card " + (compact ? "compact" : "")}>
      <button
        className="property-image"
        onClick={() => onOpen(p)}
        aria-label={"View " + p.title}
      >
        <img
          src={p.photos?.[0] || "/" + p.image + ".jpg"}
          alt={
            p.type === "Land"
              ? "Illustrative green residential land"
              : `Illustrative ${String(typeLabel(p.type) || "property").toLowerCase()}`
          }
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.opacity = 0;
            e.currentTarget.parentElement.classList.add("photo-unavailable");
          }}
        />
        <span className="badge">{p.tag}</span>
      </button>
      <button
        className={"save-button " + (saved ? "is-saved" : "")}
        aria-label={(saved ? "Unsave " : "Save ") + p.title}
        aria-pressed={saved}
        onClick={() => onSave(p.id)}
      >
        <Heart size={18} fill={saved ? "currentColor" : "none"} />
      </button>
      <button className="property-copy" onClick={() => onOpen(p)}>
        <div className="price">
          {p.type === "Land" && p.mode !== "BUY"
            ? pinPrice(p, money)
            : money(landPrice(p, priceUnit).amount)}
          {p.type === "Land" && p.mode === "BUY" && (
            <small>{landPrice(p, priceUnit).suffix || " total"}</small>
          )}
          {p.mode === "RENT" && p.type !== "Land" && (
            <small>{priceBasis(p)}</small>
          )}
        </div>
        <h3>{p.title}</h3>
        <p className="muted location-line">
          <MapPin size={13} />
          {p.locality}, {p.city}
        </p>
        <div className="property-specs">
          {!["Land", "Commercial", "PG"].includes(p.type) && (
            <span>
              <BedDouble />
              {p.beds === 0 ? "Studio" : p.beds + " BHK"}
            </span>
          )}
          {p.type === "PG" && <span>{p.occupancy}</span>}
          {p.baths > 0 && (
            <span>
              <Bath />
              {p.baths} baths
            </span>
          )}
          <span>
            <Square />
            {p.type === "Land"
              ? landArea(p.area)
              : Number(p.area || 0).toLocaleString("en-IN") +
                " sq ft · " +
                areaBasis(p)}
          </span>
        </div>
      </button>
    </article>
  );
}
function Empty({ title, description, action, onAction }) {
  return (
    <div className="empty">
      <Search size={30} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action && (
        <button className="secondary" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}
function PostFlow({ onExit, onComplete, city, initialDraft, agent }) {
  const [step, setStep] = useState(() =>
    initialDraft ? 1 : readLocal("centometer-draft", null)?.step || 0,
  );
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const emptyData = {
    type: "Apartment",
    intent: "SELL",
    title: "",
    price: "",
    area: "",
    beds: "1",
    address: "",
    description: "",
    photos: [],
    features: [],
    location: null,
    facing: "Not specified",
  };
  const [data, setData] = useState(() => ({
    ...emptyData,
    ...(initialDraft || readLocal("centometer-draft", null)?.data || {}),
  }));
  const [photosReady, setPhotosReady] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const dirty = useRef(new Set());
  useEffect(() => {
    let active = true;
    restorePhotos(
      initialDraft || readLocal("centometer-draft", null)?.data || emptyData,
    ).then((record) => {
      if (active) {
        setData((current) => ({ ...current, photos: record.photos || [] }));
        setPhotosReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  const draftId = useRef(
    initialDraft?.id || readLocal("centometer-draft", null)?.id || Date.now(),
  );
  const {
    status: draftStatus,
    flush: flushDraft,
    stop: stopDraft,
  } = useDraftStorage(
    { id: draftId.current, step, data },
    photosReady && !done,
  );
  const exit = async () => {
    await flushDraft();
    onExit();
  };
  const set = (k, v) => {
    dirty.current.add(k);
    setData((d) => ({ ...d, [k]: v }));
    setError("");
  };
  const chooseType = (type) => {
    setData((d) => ({
      ...d,
      type,
      ...(type === "Land"
        ? {
            landType: d.landType || "Residential",
            highlights: d.highlights || [],
          }
        : {}),
      photos: (type === "Land") !== (d.type === "Land") ? [] : d.photos,
      ...Object.fromEntries(
        ["title", "description", "price"]
          .filter((key) => !dirty.current.has(key))
          .map((key) => [key, ""]),
      ),
    }));
    setError("");
  };
  const chooseIntent = (intent) => {
    setData((d) => ({
      ...d,
      intent,
      type: intent === "SELL" && d.type === "PG" ? "Apartment" : d.type,
      ...Object.fromEntries(
        ["title", "description", "price"]
          .filter((key) => !dirty.current.has(key))
          .map((key) => [key, ""]),
      ),
    }));
    setError("");
  };
  const fillSample = () => {
    setData((d) => ({
      ...d,
      title:
        d.type === "Land"
          ? "A generous plot at Greenfield"
          : d.type === "PG"
            ? "A private room at Parkside PG"
            : "A sunlit home at Parkside",
      price: d.intent === "RENT" ? "12000" : "7200000",
      area: d.type === "PG" ? "180" : "1200",
      address: city + " — sample central location",
      description:
        d.type === "Land"
          ? "Residential plot with road access and open views."
          : "A bright property close to everyday conveniences.",
      photos: d.type === "Land" ? ["/land.jpg"] : ["/apartment.jpg"],
      location: centers[city],
      landType: d.type === "Land" ? "Residential" : d.landType,
      occupancy: "Private room",
      meals: "Not included",
      bathroom: "Attached",
      ac: "No",
      baths: 1,
      features: ["Parking"],
      deposit: d.intent === "RENT" ? "24000" : "",
      maintenance: d.intent === "RENT" ? "1000" : "",
    }));
    for (const key of ["title", "price", "address", "description"])
      dirty.current.add(key);
    setError("");
  };
  const [uploading, setUploading] = useState(false);
  const upload = async (e) => {
    const input = e.target;
    const files = [...input.files].slice(0, 6 - data.photos.length);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const photos = await compressPhotos(files);
      set("photos", [...data.photos, ...photos]);
    } catch (error) {
      setError(
        error.message || "Could not process this photo. Try another image.",
      );
    } finally {
      setUploading(false);
      input.value = "";
    }
  };
  const next = () => {
    if (step === 1 && data.type === "Land") {
      if (!data.landType && !data.subtype) {
        setError("Select a land type.");
        return;
      }
      if (
        (data.length || data.width) &&
        (!(Number(data.length) > 0) || !(Number(data.width) > 0))
      ) {
        setError("Enter a positive length and width.");
        return;
      }
    }
    if (
      step === 1 &&
      (!data.title.trim() ||
        !(Number(data.price) > 0) ||
        !(Number(data.area) > 0) ||
        data.photos.length === 0)
    ) {
      setError(
        "Add a title, a positive price and area, and at least one sample photo.",
      );
      return;
    }
    if (step === 2 && !cityForLocation(data.location)) {
      setError("Choose a pin within 60 km of Bengaluru, Hyderabad or Pune.");
      return;
    }
    if (step === 2 && (!data.address.trim() || !data.location)) {
      setError("Add a locality and choose a point on the map.");
      return;
    }
    setError("");
    setStep(step + 1);
  };
  if (done)
    return (
      <div className="success-page">
        <span className="success-icon">
          <CheckCircle2 size={42} />
        </span>
        <p className="eyebrow">ALL SET</p>
        <h1>Your listing looks great.</h1>
        <p>
          Your sample listing is ready to review on this device.
          <br />
          Nothing has been published.
        </p>
        <button className="primary" onClick={exit}>
          Back to exploring
        </button>
      </div>
    );
  return (
    <section className="page post-page">
      <button className="back-button" onClick={onExit}>
        <ArrowLeft size={18} />
        Back to exploring
      </button>
      <div className="page-intro">
        <span className="eyebrow">MAKE ROOM FOR WHAT’S NEXT</span>
        <h1>Post property</h1>
      </div>
      <div className="draft-tools">
        <span role="status">{draftStatus}</span>
        <button className="secondary" onClick={exit}>
          Save draft & exit
        </button>
        <button className="text-button" onClick={() => setDiscardOpen(true)}>
          Discard draft
        </button>
        <button type="button" className="text-button" onClick={fillSample}>
          Fill with sample data
        </button>
      </div>
      {discardOpen && (
        <Modal
          title="Discard this draft?"
          onClose={() => setDiscardOpen(false)}
        >
          <p>This removes this unfinished draft from your device.</p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setDiscardOpen(false)}>
              Keep editing
            </button>
            <button
              className="primary"
              onClick={async () => {
                await stopDraft();
                removeLocal("centometer-draft");
                writeLocal(
                  "centometer-draft-bank",
                  readLocal("centometer-draft-bank", []).filter(
                    (x) => String(x.id) !== String(draftId.current),
                  ),
                );
                await deletePhotos("draft:" + draftId.current);
                onExit();
              }}
            >
              Discard draft
            </button>
          </div>
        </Modal>
      )}
      <div className="stepper">
        {["Type", "Details", "Location", "Review"].map((s, i) => (
          <div key={s} className={i <= step ? "active" : ""}>
            <span>{i < step ? <Check size={16} /> : i + 1}</span>
            <small>{s}</small>
          </div>
        ))}
      </div>
      <div className="post-panel">
        <div className="form-stack">
          {step === 0 && (
            <>
              <h2>What would you like to list?</h2>
              <div
                className="segment"
                role="group"
                aria-label="Listing purpose"
              >
                {["SELL", "RENT"].map((i) => (
                  <button
                    type="button"
                    key={i}
                    aria-pressed={data.intent === i}
                    onClick={() => chooseIntent(i)}
                    className={data.intent === i ? "active" : ""}
                  >
                    {i === "SELL" ? "For sale" : "For rent"}
                  </button>
                ))}
              </div>
              <PropertyTypes
                mode={data.intent}
                value={data.type}
                onChange={(t) => {
                  if (t !== data.type) chooseType(t);
                }}
              />
            </>
          )}
          {step === 1 && (
            <>
              <h2>
                {data.type === "Land"
                  ? "Land details"
                  : "Tell the story of your property."}
              </h2>
              <label>
                Listing title
                <input
                  maxLength={80}
                  placeholder="Give your listing a clear title"
                  value={data.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </label>
              <div
                className={
                  "form-columns" +
                  (data.type === "Land" ? " land-price-area" : "")
                }
              >
                <label>
                  {data.intent === "RENT" ? "Monthly rent" : "Asking price"} (₹)
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter amount"
                    value={data.price}
                    onChange={(e) => set("price", e.target.value)}
                  />
                </label>
                {data.type === "Land" ? (
                  <LandAreaFields data={data} set={set} />
                ) : (
                  <label>
                    Area (sq ft)
                    <input
                      type="number"
                      min="1"
                      placeholder="Enter area"
                      value={data.area}
                      onChange={(e) => set("area", e.target.value)}
                    />
                  </label>
                )}
              </div>
              {data.type === "Land" && <LandFields data={data} set={set} />}
              {data.intent === "RENT" && (
                <div className="form-columns">
                  <label>
                    Deposit (₹)
                    <input
                      type="number"
                      min="0"
                      value={data.deposit ?? ""}
                      onChange={(e) => set("deposit", e.target.value)}
                    />
                  </label>
                  <label>
                    Monthly maintenance (₹)
                    <input
                      type="number"
                      min="0"
                      value={data.maintenance ?? ""}
                      onChange={(e) => set("maintenance", e.target.value)}
                    />
                  </label>
                </div>
              )}
              {data.type === "PG" && (
                <div className="form-columns">
                  {[
                    [
                      "occupancy",
                      "Occupancy",
                      ["Private room", "Twin sharing", "Triple sharing"],
                    ],
                    ["meals", "Meals", ["Included", "Not included"]],
                    ["bathroom", "Bathroom", ["Attached", "Shared"]],
                    ["ac", "AC", ["Yes", "No"]],
                  ].map(([key, label, options]) => (
                    <label key={key}>
                      {label}
                      <select
                        value={data[key] || ""}
                        onChange={(e) => set(key, e.target.value)}
                      >
                        <option value="">Select</option>
                        {options.map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}
              {data.type !== "Land" && (
                <>
                  <label>
                    Bathrooms
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={data.baths ?? ""}
                      onChange={(e) => set("baths", e.target.value)}
                    />
                  </label>
                  <fieldset className="land-highlight-options">
                    <legend>Amenities</legend>
                    <div className="chips">
                      {[
                        "Parking",
                        "Lift access",
                        "Balcony",
                        "Wi-Fi",
                        "Housekeeping",
                        "Meals included",
                      ].map((feature) => (
                        <button
                          type="button"
                          key={feature}
                          className={
                            "chip " +
                            ((data.features || []).includes(feature)
                              ? "active"
                              : "")
                          }
                          aria-pressed={(data.features || []).includes(feature)}
                          onClick={() =>
                            set(
                              "features",
                              (data.features || []).includes(feature)
                                ? data.features.filter((x) => x !== feature)
                                : [...(data.features || []), feature],
                            )
                          }
                        >
                          {feature}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </>
              )}
              {!["Land", "Commercial"].includes(data.type) && (
                <label>
                  Bedrooms
                  <select
                    value={data.beds}
                    onChange={(e) => set("beds", e.target.value)}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
              )}
              {supportsFacing(data.type) && (
                <label>
                  Facing direction
                  <select
                    value={data.facing || "Not specified"}
                    onChange={(e) => set("facing", e.target.value)}
                  >
                    {["Not specified", ...facingDirections].map((direction) => (
                      <option key={direction}>{direction}</option>
                    ))}
                  </select>
                  {data.type !== "Land" && (
                    <small>
                      Direction the main entrance faces when looking out.
                    </small>
                  )}
                </label>
              )}
              <OptionalListingFields data={data} set={set} />
              {
                <label>
                  Description
                  <textarea
                    rows="3"
                    placeholder={
                      data.type === "Land"
                        ? "Describe access, nearby landmarks, approvals and land highlights"
                        : "Describe the property and its highlights"
                    }
                    value={data.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </label>
              }
              <div>
                <label>
                  Property photos{" "}
                  <small>
                    Up to 6 • JPG, PNG or WebP • Automatically optimized
                  </small>
                </label>
                <div className="upload-zone">
                  <ImagePlus size={27} />
                  <p>Make a beautiful first impression</p>
                  <label className="secondary upload-label">
                    {uploading ? "Optimizing photos…" : "Choose images"}
                    <input
                      aria-label="Upload property images"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={upload}
                      disabled={uploading || data.photos.length >= 6}
                    />
                  </label>
                  <button
                    className="text-button"
                    onClick={() =>
                      set(
                        "photos",
                        data.type === "Land"
                          ? ["/land.jpg"]
                          : ["/villa.jpg", "/apartment.jpg"],
                      )
                    }
                  >
                    Use sample photos
                  </button>
                  <small>
                    Draft details are saved on this device. Large photos may
                    need reselecting.
                  </small>
                </div>
                <div className="upload-previews">
                  {data.photos.map((url, i) => (
                    <div key={i}>
                      <img src={url} alt={"Selected photo " + (i + 1)} />
                      <button
                        className="photo-order"
                        onClick={() =>
                          set("photos", [
                            url,
                            ...data.photos.filter((_, j) => j !== i),
                          ])
                        }
                      >
                        {i === 0 ? "Cover photo" : "Make cover"}
                      </button>
                      {i > 0 && (
                        <button
                          className="photo-move"
                          aria-label={"Move photo " + (i + 1) + " earlier"}
                          onClick={() => {
                            const next = [...data.photos];
                            [next[i - 1], next[i]] = [next[i], next[i - 1]];
                            set("photos", next);
                          }}
                        >
                          ← Move earlier
                        </button>
                      )}
                      <IconButton
                        label={"Remove photo " + (i + 1)}
                        onClick={() =>
                          set(
                            "photos",
                            data.photos.filter((_, j) => j !== i),
                          )
                        }
                      >
                        <X size={14} />
                      </IconButton>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              {agent && (
                <fieldset>
                  <legend>Location sharing</legend>
                  <label>
                    Public map visibility
                    <select
                      value={data.shareDefault?.mode || "hidden"}
                      onChange={(e) =>
                        set("shareDefault", {
                          mode: e.target.value,
                          radiusM: data.shareDefault?.radiusM || 500,
                        })
                      }
                    >
                      <option value="hidden">Hidden</option>
                      <option value="radius">Approximate area</option>
                    </select>
                  </label>
                  {data.shareDefault?.mode === "radius" && (
                    <label>
                      Radius
                      <select
                        value={data.shareDefault.radiusM || 500}
                        onChange={(e) =>
                          set("shareDefault", {
                            ...data.shareDefault,
                            radiusM: Number(e.target.value),
                          })
                        }
                      >
                        {[300, 500, 1000].map((n) => (
                          <option key={n} value={n}>
                            {n} m
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <p>
                    Exact coordinates are stored separately. A buyer needs your
                    approval.
                  </p>
                </fieldset>
              )}
              <h2>Put your property on the map.</h2>
              <LocationSearch
                value={data.address}
                onChange={(value) => set("address", value)}
                city={city}
                onPick={(point, label) => {
                  set("location", point);
                  set("address", label);
                }}
              />
              <p className="muted">Tap the map to place your property pin.</p>
              <div className="location-picker">
                <MapView
                  city={city}
                  location={data.location}
                  onLocation={(coords) => set("location", coords)}
                />
              </div>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  if (!navigator.geolocation) {
                    setError("GPS is unavailable in this browser.");
                    return;
                  }
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      set("location", [
                        position.coords.latitude,
                        position.coords.longitude,
                      ]);
                      setError("");
                    },
                    () =>
                      setError(
                        "Allow location access or place your pin on the map.",
                      ),
                    { enableHighAccuracy: true, timeout: 12000 },
                  );
                }}
              >
                <LocateFixed size={17} />
                Use my current GPS
              </button>
              <button
                className="secondary"
                onClick={() => {
                  set("location", centers[city]);
                  set("address", city + " — sample central location");
                }}
              >
                <LocateFixed size={17} />
                Use sample location
              </button>
              {data.location && (
                <p className="positive">
                  <CheckCircle2 size={16} />
                  Pin placed at{" "}
                  {data.location.map((n) => n.toFixed(4)).join(", ")}
                </p>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <h2>One last look.</h2>
              <div className="form-columns seller-contact-fields">
                <label>
                  Contact name
                  <input
                    value={data.contactName || ""}
                    placeholder="Owner or agent name"
                    onChange={(e) => set("contactName", e.target.value)}
                  />
                </label>
                <label>
                  Phone number
                  <input
                    type="tel"
                    inputMode="tel"
                    value={data.contactPhone || ""}
                    placeholder="+91 mobile number"
                    onChange={(e) => set("contactPhone", e.target.value)}
                  />
                </label>
                <label>
                  WhatsApp (optional)
                  <input
                    type="tel"
                    inputMode="tel"
                    value={data.whatsapp || ""}
                    placeholder="Same as phone if left blank"
                    onChange={(e) => set("whatsapp", e.target.value)}
                  />
                </label>
              </div>
              <OptionalPropertyDetails
                p={{ ...data, mode: data.intent === "RENT" ? "RENT" : "BUY" }}
              />
              <div className="review-image">
                <img src={data.photos[0]} alt="Your sample listing" />
                <span className="badge">
                  {data.intent === "SELL" ? "For sale" : "For rent"}
                </span>
              </div>
              <div className="price">
                {money(Number(data.price))}
                {data.intent === "RENT" ? " / month" : ""}
              </div>
              <h3>{data.title}</h3>
              <p className="muted">
                {typeLabel(data.type)}
                {data.type !== "Land"
                  ? " · " + Number(data.area).toLocaleString("en-IN") + " sq ft"
                  : ""}{" "}
                · {data.address}
              </p>
              {data.type === "Land" ? (
                <LandSummary p={data} />
              ) : (
                <p>{data.description}</p>
              )}
              {data.type !== "Land" && supportsFacing(data.type) && (
                <p>
                  <strong>Facing direction:</strong>{" "}
                  {data.facing || "Not specified"}
                </p>
              )}
              <div className="note">
                <Info size={18} />
                <span>
                  This is a design preview. Finishing saves a sample listing on
                  this device only.
                </span>
              </div>
            </>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            {step > 0 ? (
              <button
                className="secondary"
                onClick={() => {
                  setStep(step - 1);
                  setError("");
                }}
              >
                Back
              </button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <button className="primary" onClick={next}>
                Continue
                <ChevronRight size={17} />
              </button>
            ) : (
              <button
                className="primary"
                disabled={finishing || !photosReady}
                onClick={async () => {
                  if (!indianMobile(data.contactPhone)) {
                    setError(
                      "Enter a valid 10-digit Indian mobile number starting with 6–9.",
                    );
                    return;
                  }
                  if (data.whatsapp && !indianMobile(data.whatsapp)) {
                    setError(
                      "Enter a valid WhatsApp mobile number or leave it blank.",
                    );
                    return;
                  }
                  if (
                    (data.propertyAge !== undefined &&
                      data.propertyAge !== "" &&
                      (!Number.isFinite(Number(data.propertyAge)) ||
                        Number(data.propertyAge) < 0)) ||
                    (data.totalFloors !== undefined &&
                      data.totalFloors !== "" &&
                      (!Number.isInteger(Number(data.totalFloors)) ||
                        Number(data.totalFloors) < 1))
                  ) {
                    setError(
                      "Enter a non-negative property age and a positive whole number of floors.",
                    );
                    return;
                  }
                  setFinishing(true);
                  try {
                    await onComplete({
                      ...data,
                      id: draftId.current,
                      createdAt: data.createdAt || new Date().toISOString(),
                      postedAt: data.postedAt || new Date().toISOString(),
                    });
                    await stopDraft();
                    removeLocal("centometer-draft");
                    writeLocal(
                      "centometer-draft-bank",
                      readLocal("centometer-draft-bank", []).filter(
                        (x) => String(x.id) !== String(draftId.current),
                      ),
                    );
                    await deletePhotos("draft:" + draftId.current);
                    setDone(true);
                  } catch (error) {
                    setError(
                      error.message ||
                        "Could not save this listing. Keep editing and retry.",
                    );
                  } finally {
                    setFinishing(false);
                  }
                }}
              >
                {finishing ? "Saving…" : "Finish preview"}
                <Check size={17} />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
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
  }, [locationRequests]);
  useEffect(() => {
    let active = true;
    restoreExactLocations().then(() => {
      if (active) setLocationRequests((xs) => [...xs]);
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const deadlines = locationRequests
      .filter((r) => r.status === "approved" && r.expiresAt)
      .map((r) => Date.parse(r.expiresAt) || Date.now());
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
  const [listingsReady, setListingsReady] = useState(false);
  const listingQueue = useRef(Promise.resolve());
  const listingTimer = useRef();
  const saveListings = (next) => {
    listingQueue.current = listingQueue.current
      .catch(() => {})
      .then(() => persistListings(next));
    return listingQueue.current;
  };
  useEffect(() => {
    void migrateDraftPhotos();
    let active = true;
    restoreListings(readLocal("centometer-listings", [])).then((items) => {
      if (active) {
        setDrafts(items);
        setListingsReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);
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
  const pendingListScroll = useRef(false);
  const searchReturn = useRef("home");
  const searchRef = useRef(null);
  const [focusSearch, setFocusSearch] = useState(false);
  const [route, setRoute] = useState(location.hash.slice(1) || "home");
  const [city, setCity] = useState(() => {
    const last = readLocal("centometer-city", "Bengaluru");
    return Object.hasOwn(centers, last) ? last : "Bengaluru";
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
  const [priceUnit, setPriceUnit] = useState("total");
  const [visitDate, setVisitDate] = useState(() => visitDates()[0].value);
  const [sort, setSort] = useState("recommended");
  const [resetKey, setResetKey] = useState(0);
  const [drafts, setDrafts] = useState(() =>
    readLocal("centometer-listings", []),
  );
  const [profile, setProfile] = useState({
    name: "Aarav Sharma",
    email: "aarav@example.com",
    phone: "+91 98765 43210",
  });
  const [alerts, setAlerts] = useState(true);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactTarget, setContactTarget] = useState(null);
  useEffect(() => {
    if (!listingsReady) return;
    listingTimer.current = setTimeout(() => {
      void saveListings(drafts);
    }, 500);
    return () => clearTimeout(listingTimer.current);
  }, [drafts, listingsReady]);
  useEffect(() => {
    if (route === "home" && pendingListScroll.current) {
      pendingListScroll.current = false;
      requestAnimationFrame(() => {
        listingRef.current?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
          block: "start",
        });
        listingRef.current?.focus({ preventScroll: true });
      });
    }
  }, [route]);
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
    writeLocal("centometer-saved", saved);
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
  const navigate = (r) => {
    if (route === r) window.scrollTo(0, 0);
    else if (history.state?.centometerOverlay) location.replace("#" + r);
    else location.hash = r;
    setModal(null);
  };
  const openSearch = () => {
    searchReturn.current = route;
    navigate("search");
  };
  const showList = () => {
    setAreaOnly(true);
    if (window.matchMedia(mobileQuery).matches) {
      if (route === "home") {
        listingRef.current?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
          block: "start",
        });
        listingRef.current?.focus({ preventScroll: true });
      } else {
        pendingListScroll.current = true;
        navigate("home");
      }
    } else navigate("results");
  };
  const notify = (s) => setToast(s);
  const save = (id) => {
    setSavedToastId(saved.includes(id) ? null : id);
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    notify(
      saved.includes(id)
        ? "Removed from your saved places"
        : "Added to your saved places",
    );
  };
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
    () => [
      ...properties.filter((p) => !p.agentId),
      ...agentListings.map((p) => ({ ...p, ...agentState.overrides[p.id] })),
      ...drafts
        .map((d) => (d.agentId ? d : normalizePostedListing(d, profile.name)))
        .filter(Boolean),
    ],
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
  const resultItems = route === "results" && !areaOnly ? filtered : visible;
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
  const open = (p) => {
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
  };
  const goBack = () => {
    restoreScroll.current = returnTo.current.scroll;
    navigate(returnTo.current.route);
  };
  const handleBounds = useCallback((b) => setBounds(b), []);
  const renderCard = (p, compact = false) => (
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
    route === "home" || route === "map"
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
        {!detail &&
          !agentRoute &&
          !["post", "search", "profile"].includes(route) && (
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
                  aria-label="Open search suggestions"
                  onClick={openSearch}
                >
                  <MapPin size={19} />
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
              {["BUY", "RENT"].map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  className={mode === m ? "active" : ""}
                  onClick={() => setIntent(m)}
                >
                  {m === "BUY" ? <Home size={18} /> : <KeyRound size={18} />}
                  <span>{m}</span>
                  {mode === m && <span className="tab-indicator" />}
                </button>
              ))}
            </div>
            <div className="explore-toolbar property-type-toolbar">
              {filters.type === "Land" && mode === "BUY" && (
                <div
                  className="price-unit-switch"
                  role="group"
                  aria-label="Land price unit"
                >
                  {[
                    ["total", "Total"],
                    ["cent", "/ Cent"],
                    ["sqft", "/ Sq ft"],
                  ].map(([unit, label]) => (
                    <button
                      key={unit}
                      type="button"
                      aria-pressed={priceUnit === unit}
                      onClick={() => setPriceUnit(unit)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
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
                (route === "map" ? "map-only" : "") +
                (route === "results" ? "results-layout" : "")
              }
            >
              {route !== "results" && (
                <div className="map-column">
                  <div className="map-stage">
                    <MapView
                      clustered
                      city={city}
                      priceUnit={priceUnit}
                      scrollPreview={route === "home"}
                      viewport={mapViewport.current}
                      onViewport={(v) => {
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
                      onClick={() => setAgentPicks((v) => !v)}
                    >
                      Agent picks
                    </button>
                    <div className="map-status">
                      <span className="live-dot" />
                      {visible.length} places in this area
                    </div>
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
                    <button
                      className="map-list-toggle"
                      aria-controls={
                        route === "home" ? "property-results" : undefined
                      }
                      onClick={showList}
                    >
                      <List size={16} />
                      {route === "results" ? "Show map" : "View list"}
                    </button>
                    {route === "home" && (
                      <button
                        className="map-expand"
                        aria-label="Explore full map"
                        onClick={() => navigate("map")}
                      >
                        <Maximize2 size={16} />
                        <span>Full map</span>
                      </button>
                    )}
                    {chosen && !isMobile && (
                      <div className="map-preview">{selectionPreview}</div>
                    )}
                    <button
                      className="map-save-search"
                      onClick={() => {
                        setSearchName(`${city} · ${mode}`);
                        setModal("saveSearch");
                      }}
                    >
                      <Bookmark size={14} />
                      Save search
                    </button>
                    <div className="map-footer-note">
                      Move the map to explore more places
                    </div>
                  </div>
                </div>
              )}
              {route !== "map" && (
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
                    {route === "results" ? (
                      <button
                        className="secondary list-map-button"
                        onClick={() => navigate("map")}
                      >
                        <MapIcon size={18} />
                        Map View
                      </button>
                    ) : (
                      <>
                        <button
                          className="secondary home-list-map-button"
                          onClick={() => navigate("map")}
                        >
                          <MapIcon size={18} />
                          Map
                        </button>
                        <button
                          className="icon-button desktop-expand"
                          aria-label="Expand map"
                          onClick={() => navigate("map")}
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
                      <Bookmark size={14} /> Save search
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
                <div className="detail-labels">
                  <span className="pill">
                    {detail.mode === "RENT" ? "FOR RENT" : "FOR SALE"}
                  </span>
                  <span className="muted">
                    {typeLabel(detail.type)} · Sample listing
                  </span>
                </div>
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
                <MobilePropertyPrice property={detail} money={money} />
                {detail.type !== "Land" && (
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
                    <div>
                      <Square />
                      <strong>
                        {Number(detail.area || 0).toLocaleString("en-IN")}
                      </strong>
                      <span>Sq ft · {areaBasis(detail)}</span>
                    </div>
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
                  <LandSummary p={detail} />
                ) : (
                  <>
                    <h2>A little more about this place</h2>
                    <p className="description">
                      {detail.description ||
                        (detail.type === "Commercial"
                          ? "A flexible commercial space with road access and a practical layout for a growing business. Sample specifications are shown for design review."
                          : detail.type === "PG"
                            ? `${detail.occupancy} with ${String(detail.bathroom || "Not specified").toLowerCase()} bathroom. Meals: ${String(detail.meals || "Not specified").toLowerCase()}. Price shown${priceBasis(detail)}. AC: ${detail.ac}. Sample house rules: quiet hours 10 PM–7 AM; visitor registration required.`
                            : "A light-filled home with thoughtfully planned spaces, an airy living area and room for life to unfold. Enjoy the balance of a peaceful neighbourhood and easy access to the city’s everyday conveniences.")}
                    </p>
                  </>
                )}
                {detail.type !== "Land" && detail.features.length > 0 && (
                  <>
                    <h2>Made for everyday living</h2>
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
                {!["Land", "PG"].includes(detail.type) && (
                  <button
                    className="secondary"
                    onClick={() => setModal("floorPlan")}
                  >
                    Preview sample floor plan
                  </button>
                )}
                {detail.type !== "Land" && (
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
                <OptionalPropertyDetails p={detail} />
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
                <button
                  className="text-button optional-visit"
                  onClick={() => requestVisit(detail)}
                >
                  Request a site visit
                </button>
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
                <ContactButtons
                  p={detail}
                  onVisit={() => requestVisit(detail)}
                />
              </aside>
            </div>
            {similarProperties.length > 0 && (
              <section
                className="similar-properties"
                aria-label="Similar properties"
              >
                <h2>Similar properties</h2>
                <div className="search-horizontal">
                  {similarProperties.map((p) => (
                    <div key={p.id}>{renderCard(p, true)}</div>
                  ))}
                </div>
              </section>
            )}
            <PropertyActionBar
              className="mobile-detail-actions"
              p={detail}
              money={money}
              onVisit={() => requestVisit(detail)}
            />
          </section>
        )}
        {route === "post" && (
          <PostFlow
            initialDraft={editing}
            agent={postingAgent}
            city={city}
            onExit={() => {
              setEditing(null);
              navigate("home");
            }}
            onComplete={async (d) => {
              const pinCity = cityForLocation(d.location);
              if (!pinCity)
                throw new Error(
                  "Choose a pin within 60 km of Bengaluru, Hyderabad or Pune.",
                );
              clearTimeout(listingTimer.current);
              const id = postingAgent
                ? "al-post-" + d.id
                : d.id || editing?.id || Date.now();
              let listing = { ...d, city: pinCity, id };
              if (postingAgent) {
                const approx = await registerExactLocation(
                  id,
                  d.location,
                  d.shareDefault?.radiusM || 500,
                );
                listing = {
                  ...normalizePostedListing(listing, postingAgent.name),
                  agentId: postingAgent.id,
                  privacy: d.shareDefault || { mode: "hidden", radiusM: 500 },
                  shareDefault: d.shareDefault || {
                    mode: "hidden",
                    radiusM: 500,
                  },
                  status: "available",
                  confirmedAt: new Date().toISOString(),
                  amenities: d.features || [],
                  highlights: d.highlights || [],
                  approx,
                  seller: "Agent",
                  contactName: postingAgent.name,
                };
                delete listing.lat;
                delete listing.lng;
                delete listing.location;
                delete listing.boundary;
                delete listing.address;
                delete listing.contactPhone;
                delete listing.whatsapp;
                listing.locality = d.locality || pinCity;
                updateStore((s) => ({
                  ...s,
                  customListings: [
                    ...(s.customListings || []).filter((p) => p.id !== id),
                    listing,
                  ],
                }));
              }
              const next = [
                ...drafts.filter((x) => String(x.id) !== String(d.id)),
                listing,
              ];
              const result = await saveListings(next);
              if (!result.ok)
                throw new Error(
                  "Device storage is full. Remove an old listing or free space and retry.",
                );
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
              <p className="profile-phone">
                <Phone size={15} />
                {profile.phone}
              </p>
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
                      key === "agent" ? navigate("agent") : setModal(key)
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
        {!browse &&
          !detail &&
          !agentRoute &&
          !["post", "saved", "profile", "search"].includes(route) && (
            <Empty
              title="This place isn’t on the map"
              description="Return to the home screen to continue exploring."
              action="Go home"
              onAction={() => navigate("home")}
            />
          )}
      </main>
      {route !== "search" && (
        <nav className="bottom-nav" aria-label="Main navigation">
          {[
            [MapIcon, "Map", "home"],
            [Search, "Search", "results"],
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
                if (r === "results" && window.matchMedia(mobileQuery).matches) {
                  openSearch();
                  return;
                }
                navigate(r);
                if (r === "results") {
                  setAreaOnly(false);
                  setFocusSearch(true);
                }
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
            onOpen={(entry) => {
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
