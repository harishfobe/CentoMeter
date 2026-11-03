import { disposeMap } from "./lib/disposeMap";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";

import agents from "./data/agents.json";
import {
  isLocationLocked,
  mapPoint,
  publicBoundary,
} from "./lib/locationAccess";
import { centers, money } from "./PropertyModel";
import { landPrice } from "./JourneyUX";
import { pinPrice, plotBoundary, plotStyle } from "./PlotUI";
import { mobileQuery, bindMapInteractions } from "./MapInteractions";
import "leaflet.markercluster";
import { reducedMotion } from "./lib/agentMotion";
const NO_ITEMS = Object.freeze([]),
  NO_HOTSPOTS = Object.freeze([]);
export default function MapView({
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
      zoomAnimation: !reducedMotion(),
      fadeAnimation: !reducedMotion(),
      markerZoomAnimation: !reducedMotion(),
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
        animate: !reducedMotion(),
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
      disposeMap(m);
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
    return () => {
      tiles.off();
      tiles.remove();
    };
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
      if (!staticView) {
        el?.setAttribute("tabindex", "0");
        el?.setAttribute("aria-pressed", String(selected === p.id));
        el?.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            callbacks.current.onSelect?.(p.id);
          }
        });
      }
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
