import { disposeMap } from "../../lib/disposeMap";
import React, { useRef, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { reducedMotion } from "../../lib/agentMotion";
export default function UnlockedMap({ point }) {
  const host = useRef(null);
  useEffect(() => {
    if (!point) return;
    const map = L.map(host.current, {
      scrollWheelZoom: false,
      zoomAnimation: !reducedMotion(),
      fadeAnimation: !reducedMotion(),
      markerZoomAnimation: !reducedMotion(),
    }).setView(point, 15);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    const marker = L.marker(point).addTo(map);
    marker.getElement()?.classList.add("agent-pin-drop");

    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(host.current);
    return () => {
      resize.disconnect();
      disposeMap(map);
    };
  }, [point?.[0], point?.[1]]);
  return (
    <div
      className="agent-location-map"
      ref={host}
      aria-label="Approved property location"
    />
  );
}
