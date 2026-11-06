/** Shared BUY listing input ↔ output ↔ filter fit helpers. */

export const FURNISHING_OPTIONS = [
  "Unfurnished",
  "Semi-furnished",
  "Fully furnished",
];

export const CONDITION_OPTIONS = ["Resale", "New"];

export const POSSESSION_OPTIONS = [
  "Ready to move",
  "Within 30 days",
  "Under construction",
];

/** Owner refine-search availability chips (legacy labels kept for saved filters). */
export const AVAILABILITY_FILTER_OPTIONS = ["Ready now", "Within 30 days"];

export const COMMERCIAL_SUBTYPES = [
  "Building",
  "Office",
  "Shop",
  "Warehouse",
];

export const COMMERCIAL_FACILITIES = [
  "Parking",
  "CCTV",
  "Power backup",
  "Water supply",
  "Separate meters",
  "Main road access",
];

export const ROAD_ACCESS_OPTIONS = ["Main road", "Interior road", "Lane"];

export function listingPossession(p) {
  return String(p?.possessionStatus || p?.available || "").trim();
}

function readyLike(value) {
  return /ready(\s+to\s+move|\s+now)?/i.test(value);
}

function upcomingLike(value) {
  return /within\s*30|under\s*construction|upcoming/i.test(value);
}

/** Match owner/agent possession filters to listing possessionStatus or available. */
export function matchesPossessionFilter(p, filterValue) {
  if (!filterValue || filterValue === "Any") return true;
  const listing = listingPossession(p);
  if (!listing) return false;
  if (listing.toLowerCase() === String(filterValue).toLowerCase()) return true;
  if (readyLike(filterValue) && readyLike(listing)) return true;
  if (upcomingLike(filterValue) && upcomingLike(listing)) return true;
  // Legacy agent option "Ready" → Ready to move / Ready now
  if (/^ready$/i.test(String(filterValue).trim()) && readyLike(listing))
    return true;
  return false;
}

/** Match floor filter bands (Ground / 1–3 / 4+) to numeric or labelled floors. */
export function matchesFloorFilter(floor, filterValue) {
  if (!filterValue || filterValue === "Any") return true;
  const raw = String(floor ?? "").trim();
  if (!raw) return false;
  const lower = raw.toLowerCase();
  if (/^ground$/i.test(filterValue) || filterValue === "Ground") {
    return /^(g|ground|0)$/i.test(raw);
  }
  const band = String(filterValue).replace("–", "-");
  const n = Number(raw);
  if (band === "1-3") {
    if (Number.isFinite(n)) return n >= 1 && n <= 3;
    return /^(1|2|3)$/.test(raw);
  }
  if (band === "4+" || filterValue === "4+") {
    if (raw === "4+" || /4\+/.test(raw)) return true;
    return Number.isFinite(n) && n >= 4;
  }
  return lower === String(filterValue).toLowerCase();
}

export function normalizeNegotiable(value) {
  if (value === true || value === false) return value;
  if (/^yes$/i.test(String(value || "").trim())) return true;
  if (/^no$/i.test(String(value || "").trim())) return false;
  return null;
}
