import React, { useEffect, useRef, useState } from "react";
let lastRequest = 0;
let queue = Promise.resolve();
const cache = new Map();
function geocode(term, city, signal) {
  const key = term.toLowerCase() + "|" + city;
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  const job = queue
    .catch(() => {})
    .then(async () => {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      await new Promise((resolve, reject) => {
        const done = () => {
          signal.removeEventListener("abort", cancel);
          resolve();
        };
        const cancel = () => {
          clearTimeout(timer);
          signal.removeEventListener("abort", cancel);
          reject(new DOMException("Aborted", "AbortError"));
        };
        const timer = setTimeout(
          done,
          Math.max(0, 1100 - (Date.now() - lastRequest)),
        );
        signal.addEventListener("abort", cancel, { once: true });
      });
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      lastRequest = Date.now();
      const endpoint =
        import.meta.env.VITE_GEOCODER_URL ||
        "https://nominatim.openstreetmap.org/search";
      const url = new URL(endpoint);
      url.search = new URLSearchParams({
        q: term + ", " + city + ", India",
        format: "jsonv2",
        countrycodes: "in",
        limit: "5",
      }).toString();
      const response = await fetch(url, {
        signal,
        referrerPolicy: "strict-origin-when-cross-origin",
        headers: { Accept: "application/json" },
      });
      if (!response.ok)
        throw new Error(
          "Location search is unavailable. Place the pin on the map instead.",
        );
      const items = await response.json();
      const results = (Array.isArray(items) ? items : [])
        .filter(
          (p) =>
            Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon)),
        )
        .map((p) => ({
          id: p.place_id,
          label: p.display_name,
          point: [Number(p.lat), Number(p.lon)],
        }));
      cache.set(key, results);
      return results;
    });
  queue = job;
  return job;
}
export default function LocationSearch({ value, onChange, city, onPick }) {
  const [results, setResults] = useState([]),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const timer = useRef(),
    request = useRef();
  useEffect(() => {
    setResults([]);
    setStatus("");
    setBusy(false);
    return () => {
      clearTimeout(timer.current);
      request.current?.abort();
    };
  }, [city]);
  const search = () => {
    const term = value.trim();
    if (term.length < 3) {
      setStatus("Enter at least 3 characters.");
      return;
    }
    clearTimeout(timer.current);
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setStatus("Searching…");
    timer.current = setTimeout(async () => {
      try {
        const found = await geocode(term, city, controller.signal);
        if (!controller.signal.aborted) {
          setResults(found);
          setStatus(
            found.length
              ? "Choose a location below."
              : "No places found. Try a nearby locality or place the pin manually.",
          );
        }
      } catch (error) {
        if (!controller.signal.aborted && error.name !== "AbortError")
          setStatus(error.message);
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }, 500);
  };
  return (
    <div role="search" aria-label="Find property locality">
      <label>
        Locality / address
        <input
          value={value}
          placeholder="Search a locality or landmark"
          onChange={(e) => {
            clearTimeout(timer.current);
            request.current?.abort();
            setBusy(false);
            setResults([]);
            setStatus("");
            onChange(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
        />
      </label>
      <button
        type="button"
        className="secondary"
        onClick={search}
        disabled={busy}
      >
        {busy ? "Finding locality…" : "Find locality"}
      </button>
      <small className="fine-print">
        Powered by OpenStreetMap · Search only when you tap Find locality.
      </small>
      {status && <p role="status">{status}</p>}
      {results.map((p) => (
        <button
          type="button"
          className="secondary full"
          key={p.id}
          onClick={() => {
            onPick(p.point, p.label);
            setResults([]);
            setStatus("Location selected");
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
