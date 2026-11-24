import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { centers } from "../PropertyModel";

export default function PostLocationMap({ city, point, onPick, disabled }) {
  const host = useRef(null),
    map = useRef(null),
    marker = useRef(null);
  const pick = useRef(onPick);
  pick.current = onPick;
  useEffect(() => {
    const instance = L.map(host.current, { scrollWheelZoom: false }).setView(
      point || centers[city] || centers.Coimbatore,
      point ? 15 : 11,
    );
    map.current = instance;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(instance);
    instance.on("click", (e) => pick.current([e.latlng.lat, e.latlng.lng]));
    return () => {
      instance.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);
  useEffect(() => {
    if (!point || !map.current) return;
    if (marker.current) marker.current.setLatLng(point);
    else {
      marker.current = L.marker(point, {
        draggable: true,
        icon: L.divIcon({
          className: "post-location-pin",
          html: '<span aria-hidden="true"></span>',
          iconSize: [28, 36],
          iconAnchor: [14, 36],
        }),
      }).addTo(map.current);
      marker.current.on("dragend", () => {
        const ll = marker.current.getLatLng();
        pick.current([ll.lat, ll.lng]);
      });
    }
  }, [point]);
  return (
    <>
      <div
        ref={host}
        className="post-location-map"
        role="region"
        aria-label="Property location map"
      />
      <button
        type="button"
        className="secondary"
        disabled={disabled}
        onClick={() => {
          const ll = map.current.getCenter();
          pick.current([ll.lat, ll.lng]);
        }}
      >
        Place pin at map centre
      </button>
    </>
  );
}
