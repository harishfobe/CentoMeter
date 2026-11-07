import agents from "../data/agents.json";
import listings from "../data/agentListings.json";
import { sortProperties } from "../PropertyModel";
import { landPrice } from "../JourneyUX";
import { matchesPossessionFilter } from "../listingFit";
export { agents, listings };
// Edited/custom listings replace their sample record instead of creating duplicate cards.
export const mergeListings = (base, custom = []) => [
  ...new Map([...base, ...custom].map((p) => [String(p.id), p])).values(),
];

export const recentlyConfirmed = (p, now = Date.now()) =>
  Number.isFinite(Date.parse(p.confirmedAt)) &&
  now - Date.parse(p.confirmedAt) <= 14 * 86400000;
export const responseLabel = (a) =>
  a.responseTimeMins == null
    ? ""
    : a.responseTimeMins < 60
      ? "Usually replies in ~" + a.responseTimeMins + " min"
      : "Usually replies in ~" + Math.round(a.responseTimeMins / 60) + " h";
export const activeListings = (items, id) =>
  items.filter(
    (p) => p.agentId === id && !["sold", "rented"].includes(p.status),
  );
export const defaults = {
  mode: "BUY",
  type: "All",
  min: 0,
  max: 0,
  beds: "",
  furnishing: "",
  possession: "",
  subtype: "",
  available: true,
  recent: false,
  sort: "newest",
  unit: "total",
  locality: "",
};
export function parseAgentRoute(hash) {
  const [path, search = ""] = hash.replace(/^#/, "").split("?");
  const parts = path.split("/");
  let handle;
  try {
    handle = decodeURIComponent(parts[1] || "");
  } catch {
    return { path: "invalid", query: new URLSearchParams() };
  }
  return { path: parts[0], handle, query: new URLSearchParams(search) };
}
export function filtersFromQuery(query) {
  const f = { ...defaults };
  for (const k of Object.keys(f)) {
    if (!query.has(k)) continue;
    const v = query.get(k);
    f[k] =
      typeof f[k] === "boolean"
        ? v === "true"
        : typeof f[k] === "number"
          ? Math.max(0, Number(v) || 0)
          : v;
  }
  f.mode = f.mode === "RENT" ? "RENT" : "BUY";
  if (!["total", "cent", "sqft"].includes(f.unit)) f.unit = "total";
  return f;
}
export function filtersQuery(f) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(defaults))
    if (f[k] !== undefined && f[k] !== v) q.set(k, String(f[k]));
  return q;
}
export function filterListings(items, f, now = Date.now()) {
  const rows = items.filter(
    (p) =>
      p.mode === f.mode &&
      (f.type === "All" ||
        (f.type === "House"
          ? // Legacy combined filter from older agent URLs.
            ["Villa", "Independent House"].includes(p.type)
          : p.type === f.type)) &&
      (!f.available || !["sold", "rented"].includes(p.status)) &&
      (!f.recent || recentlyConfirmed(p, now)) &&
      (!f.locality || p.locality === f.locality) &&
      (!f.beds ||
        (f.beds === "4+" ? p.beds >= 4 : Number(p.beds) === Number(f.beds))) &&
      (!f.furnishing || p.furnishing === f.furnishing) &&
      matchesPossessionFilter(p, f.possession || "Any") &&
      (!f.subtype || p.subtype === f.subtype) &&
      (!f.min || landPrice(p, f.unit).amount >= f.min) &&
      (!f.max || landPrice(p, f.unit).amount <= f.max),
  );
  return sortProperties(rows, f.sort, f.unit).sort(
    (a, b) =>
      Number(["sold", "rented"].includes(a.status)) -
        Number(["sold", "rented"].includes(b.status)) ||
      (f.sort === "recommended"
        ? Number(recentlyConfirmed(b, now)) - Number(recentlyConfirmed(a, now))
        : 0) ||
      (f.sort === "area" ? b.area - a.area : 0),
  );
}
export function findAgents(items, f = {}, allListings = listings) {
  const q = (f.query || "").toLowerCase();
  return items
    .filter(
      (a) =>
        (!f.city || a.city === f.city) &&
        (!q ||
          [a.name, a.handle, ...a.serviceAreas, ...a.languages]
            .join(" ")
            .toLowerCase()
            .includes(q)) &&
        (!f.locality || a.serviceAreas.includes(f.locality)) &&
        (!f.verified || a.verified) &&
        (!f.language ||
          !f.language.length ||
          (Array.isArray(f.language)
            ? f.language.some((x) => a.languages.includes(x))
            : a.languages.includes(f.language))) &&
        (!f.specialty ||
          !f.specialty.length ||
          (Array.isArray(f.specialty)
            ? f.specialty.some((x) => a.specialties.includes(x))
            : a.specialties.includes(f.specialty))) &&
        (!f.response ||
          (a.responseTimeMins != null &&
            a.responseTimeMins <= Number(f.response))) &&
        (!f.experience || a.experienceYears >= Number(f.experience)) &&
        (!f.count ||
          activeListings(allListings, a.id).length >= Number(f.count)) &&
        (!f.budget ||
          activeListings(allListings, a.id).some(
            (p) => p.price <= Number(f.budget),
          )),
    )
    .sort((a, b) =>
      f.sort === "fast"
        ? (a.responseTimeMins ?? Infinity) - (b.responseTimeMins ?? Infinity)
        : f.sort === "experience"
          ? b.experienceYears - a.experienceYears
          : f.sort === "count"
            ? activeListings(allListings, b.id).length -
              activeListings(allListings, a.id).length
            : f.sort === "new"
              ? Date.parse(b.joinedAt) - Date.parse(a.joinedAt)
              : Number(b.verified) - Number(a.verified) ||
                (a.responseTimeMins ?? Infinity) -
                  (b.responseTimeMins ?? Infinity),
    );
}
export const publicListing = (p) => {
  const result = { ...p };
  for (const k of [
    "lat",
    "lng",
    "location",
    "boundary",
    "address",
    "contactPhone",
    "phone",
    "whatsapp",
  ])
    delete result[k];
  return result;
};

export const statusLabel = (value) => {
  const text = String(value || "Not supplied").replaceAll("-", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};
export function filterLabel(key, value) {
  const price = (n) =>
    n >= 10000000
      ? `${n / 10000000} Cr`
      : n >= 100000
        ? `${n / 100000} L`
        : `₹${Number(n).toLocaleString("en-IN")}`;
  if (key === "max") return "Under " + price(value);
  if (key === "min") return price(value) + "+";
  if (key === "beds") return value + " BHK";
  if (key === "available")
    return value ? "Available only" : "Include sold / rented";
  if (key === "recent") return "Recently confirmed";
  if (key === "mode") return value === "RENT" ? "For rent" : "For sale";
  if (key === "unit") return "Per " + (value === "sqft" ? "sq ft" : value);
  if (key === "sort")
    return (
      {
        newest: "Newest",
        low: "Price low to high",
        high: "Price high to low",
        sqft: "Price per sq ft",
        area: "Largest area",
      }[value] || value
    );
  return String(value);
}
