/** Shared listing input ↔ output ↔ filter fit helpers. */

export const FURNISHING_OPTIONS = [
  "Unfurnished",
  "Semi-furnished",
  "Fully furnished",
];

/** Commercial spaces also allow Bare shell (common for rent shops). */
export const COMMERCIAL_FURNISHING_OPTIONS = [
  ...FURNISHING_OPTIONS,
  "Bare shell",
];

export function furnishingOptionsFor(type) {
  return type === "Commercial"
    ? COMMERCIAL_FURNISHING_OPTIONS
    : FURNISHING_OPTIONS;
}

export const CONDITION_OPTIONS = ["Resale", "New"];

export const POSSESSION_OPTIONS = [
  "Ready to move",
  "Within 30 days",
  "Under construction",
];

/** RENT commercial / home move-in values collected on post and shown on detail. */
export const RENT_AVAILABLE_OPTIONS = [
  "Immediately",
  "Ready now",
  "Within 30 days",
];

/** Owner refine-search availability chips (legacy labels kept for saved filters). */
export const AVAILABILITY_FILTER_OPTIONS = [
  "Ready now",
  "Immediately",
  "Within 30 days",
];

/** BUY commercial space types (income buildings + fit-out spaces). */
export const COMMERCIAL_SUBTYPES_BUY = [
  "Building",
  "Office",
  "Shop",
  "Warehouse",
];

/** RENT commercial space types — Land / Shop / Office Space. */
export const COMMERCIAL_SUBTYPES_RENT = ["Land", "Shop", "Office Space"];

/** @deprecated Prefer commercialSubtypesFor(mode). */
export const COMMERCIAL_SUBTYPES = COMMERCIAL_SUBTYPES_BUY;

export function commercialSubtypesFor(mode) {
  return mode === "RENT" || mode === "rent"
    ? COMMERCIAL_SUBTYPES_RENT
    : COMMERCIAL_SUBTYPES_BUY;
}

export function normalizeCommercialSubtype(subtype, mode = "BUY") {
  const raw = String(subtype || "").trim();
  if (!raw) return mode === "RENT" ? "Office Space" : "Building";
  if (/office\s*space/i.test(raw) || /^office$/i.test(raw)) {
    return mode === "RENT" ? "Office Space" : "Office";
  }
  if (/^shop$/i.test(raw)) return "Shop";
  if (/^land|plot$/i.test(raw)) return mode === "RENT" ? "Land" : raw;
  if (/building/i.test(raw)) return "Building";
  if (/warehouse|godown/i.test(raw)) return "Warehouse";
  const allowed = commercialSubtypesFor(mode);
  if (allowed.includes(raw)) return raw;
  return mode === "RENT" ? "Office Space" : "Building";
}

export const COMMERCIAL_FACILITIES = [
  "Parking",
  "CCTV",
  "Power backup",
  "Water supply",
  "Separate meters",
  "Main road access",
];

/** RENT commercial amenities shown on detail + post + filters. */
export const COMMERCIAL_FACILITIES_RENT = [
  "CCTV",
  "Power backup",
  "Common parking",
  "Water supply",
  "Main road access",
];

export function commercialFacilitiesFor(mode) {
  return mode === "RENT" || mode === "rent"
    ? COMMERCIAL_FACILITIES_RENT
    : COMMERCIAL_FACILITIES;
}

export const ROAD_ACCESS_OPTIONS = ["Main road", "Interior road", "Lane"];

/** Residential land road-access declarations (post form). */
export const LAND_ROAD_ACCESS_OPTIONS = [
  "Public road",
  "Private road",
  "No direct access",
  "Not sure",
];

export const DECLARATION_YES_NO_UNSURE = ["Yes", "No", "Not sure"];
export const DECLARATION_YES_NO_NA_UNSURE = [
  "Yes",
  "No",
  "Not applicable",
  "Not sure",
];

export const COMMERCIAL_PARKING_OPTIONS = [
  "Common",
  "Dedicated",
  "Available",
  "Not available",
];

export function listingPossession(p) {
  return String(p?.possessionStatus || p?.available || "").trim();
}

function readyLike(value) {
  return /ready(\s+to\s+move|\s+now)?|immediately|immediate/i.test(value);
}

function within30Like(value) {
  return /within\s*30/i.test(value);
}

function underConstructionLike(value) {
  return /under\s*construction|upcoming/i.test(value);
}

/** Match owner/agent possession filters to listing possessionStatus or available. */
export function matchesPossessionFilter(p, filterValue) {
  if (!filterValue || filterValue === "Any") return true;
  const listing = listingPossession(p);
  if (!listing) return false;
  if (listing.toLowerCase() === String(filterValue).toLowerCase()) return true;
  if (readyLike(filterValue) && readyLike(listing)) return true;
  // Under construction must NOT match Within 30 days (and vice versa).
  if (within30Like(filterValue) && within30Like(listing)) return true;
  if (underConstructionLike(filterValue) && underConstructionLike(listing))
    return true;
  // Legacy agent option "Ready" → Ready to move / Ready now / Immediately
  if (/^ready$/i.test(String(filterValue).trim()) && readyLike(listing))
    return true;
  return false;
}

/** Soft-match commercial facility chips (Parking ↔ Common parking). */
export function matchesCommercialFacility(pool, feature) {
  if (!feature || feature === "Any") return true;
  const needle = String(feature).toLowerCase();
  const items = (Array.isArray(pool) ? pool : []).map((x) =>
    String(x).toLowerCase(),
  );
  if (items.some((item) => item === needle)) return true;
  if (/park/.test(needle) && items.some((item) => /park/.test(item)))
    return true;
  if (
    /power|backup/.test(needle) &&
    items.some((item) => /power|backup/.test(item))
  )
    return true;
  if (/water/.test(needle) && items.some((item) => /water/.test(item)))
    return true;
  if (
    /main\s*road/.test(needle) &&
    items.some((item) => /main\s*road/.test(item))
  )
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
