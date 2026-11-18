/**
 * Shared listing presentation helpers for PropertyCard, ListingCard, and detail.
 * Keep price/area basis, brokerage and poster role consistent across surfaces.
 */
import { money, hasValue } from "./PropertyModel";
import { cardTypeLabel } from "./PropertyTypes";
import { landArea } from "./LandDetails";
import { landNumber, positive, toCents } from "./LandMeasurements";
import { approvalLabels } from "./PlotUI";
import { landPrice } from "./JourneyUX";
import { canonicalizePropertyType, PROPERTY_TYPE } from "./propertyTypeIds";

export function transactionLabel(mode) {
  return mode === "RENT" ? "For rent" : "For sale";
}

/** "Apartment · For rent" / "Shop · For sale" */
export function typeTransactionLine(p) {
  const type = cardTypeLabel(p?.type, p) || p?.type || "Property";
  return `${type} · ${transactionLabel(p?.mode)}`;
}

/** Explicit price with basis: "₹28,000 / month", "₹9,500 / bed / month", "₹72 L total". */
export function priceWithBasis(
  p,
  { unit = "total", formatMoney = money } = {},
) {
  if (!p) return "";
  if (p.mode === "RENT") {
    const amount = formatMoney(p.price);
    if (p.type === "PG") {
      return p.occupancy === "Private room"
        ? `${amount} / room / month`
        : `${amount} / bed / month`;
    }
    return `${amount} / month`;
  }
  if (p.type === "Land") {
    const priced = landPrice(p, unit);
    const amount = formatMoney(priced.amount);
    const suffix = (priced.suffix || " total").trim();
    return suffix.startsWith("/")
      ? `${amount} ${suffix}`
      : `${amount} ${suffix}`;
  }
  return `${formatMoney(p.price)} total`;
}

/** Area label with basis — never invent carpet from built-up. */
export function areaWithBasis(p) {
  if (!p) return null;
  const type = canonicalizePropertyType(p.type);
  if (type === PROPERTY_TYPE.land) {
    if (!hasValue(p.area) && !hasValue(p.plotArea)) return null;
    return landArea(p.plotArea || p.area) + " plot area";
  }
  if (type === PROPERTY_TYPE.commercial && p.mode === "RENT") {
    if (/land|plot/i.test(String(p.subtype || ""))) {
      if (!hasValue(p.area) && !hasValue(p.builtUpArea)) return null;
      const n = Number(p.area || p.builtUpArea);
      return `${n.toLocaleString("en-IN")} sq ft plot area`;
    }
    if (hasValue(p.carpetArea)) {
      return `${Number(p.carpetArea).toLocaleString("en-IN")} sq ft carpet area`;
    }
    if (hasValue(p.builtUpArea) || hasValue(p.area)) {
      const n = Number(p.builtUpArea || p.area);
      return `${n.toLocaleString("en-IN")} sq ft built-up`;
    }
    return null;
  }
  if (type === PROPERTY_TYPE.pg) {
    if (!hasValue(p.area)) return null;
    return `${Number(p.area).toLocaleString("en-IN")} sq ft room area`;
  }
  // Homes: prefer built-up; only say carpet when carpetArea is the known field alone.
  if (hasValue(p.builtUpArea) || hasValue(p.area)) {
    const n = Number(p.builtUpArea || p.area);
    return `${n.toLocaleString("en-IN")} sq ft built-up`;
  }
  if (hasValue(p.carpetArea)) {
    return `${Number(p.carpetArea).toLocaleString("en-IN")} sq ft carpet area`;
  }
  return null;
}

/** Configuration line: "2 BHK" — missing beds stay unknown (not Studio). */
export function configurationLabel(p) {
  if (!p) return null;
  const type = canonicalizePropertyType(p.type);
  if (
    [PROPERTY_TYPE.land, PROPERTY_TYPE.commercial, PROPERTY_TYPE.pg].includes(
      type,
    )
  ) {
    if (type === PROPERTY_TYPE.pg) return p.occupancy || null;
    if (type === PROPERTY_TYPE.commercial) return cardTypeLabel(type, p);
    return "Land";
  }
  if (!hasValue(p.beds)) return null;
  const beds = Number(p.beds);
  if (!Number.isFinite(beds)) return null;
  if (beds === 0) return "Studio / 1 RK";
  if (beds > 0) return `${beds} BHK`;
  return null;
}

/** "2 BHK · 1,120 sq ft built-up" */
export function configAreaLine(p) {
  const config = configurationLabel(p);
  const area = areaWithBasis(p);
  return [config, area].filter(Boolean).join(" · ") || null;
}

/**
 * Brokerage display rules:
 * - missing / invalid → "Not provided" (never ₹0)
 * - explicit 0 → "No brokerage"
 * - positive → money amount
 */
export function brokerageLabel(p, { formatMoney = money } = {}) {
  if (!p || !Object.prototype.hasOwnProperty.call(p, "brokerage")) {
    return "Not provided";
  }
  const raw = p.brokerage;
  if (raw === null || raw === undefined || String(raw).trim() === "") {
    return "Not provided";
  }
  if (/^(not\s+provided|na|n\/a|unknown)$/i.test(String(raw).trim())) {
    return "Not provided";
  }
  if (/^(no(\s+brokerage)?|nil|none|zero)$/i.test(String(raw).trim())) {
    return "No brokerage";
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return "Not provided";
  if (n === 0) return "No brokerage";
  return formatMoney(n);
}

export function brokerageIsKnown(p) {
  const label = brokerageLabel(p);
  return label !== "Not provided";
}

export function brokerageAmount(p) {
  if (!brokerageIsKnown(p)) return null;
  if (brokerageLabel(p) === "No brokerage") return 0;
  const n = Number(p.brokerage);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function depositLabel(p, { formatMoney = money, missing = "—" } = {}) {
  const n = Number(p?.deposit);
  if (!Number.isFinite(n) || n < 0) return missing;
  if (n === 0) return formatMoney(0);
  return formatMoney(n);
}

export function maintenanceLabel(
  p,
  { formatMoney = money, missing = "—", prefix = "" } = {},
) {
  const n = Number(p?.maintenance);
  if (!Number.isFinite(n) || n < 0) return missing;
  return prefix + formatMoney(n);
}

/** Poster role for cards/detail: Owner / Agent / Builder. */
export function posterRole(p) {
  if (!p) return "Owner";
  if (
    p.agentId ||
    p.seller === "Agent" ||
    p.contactType === "agent" ||
    /^agent$/i.test(String(p.posterRole || ""))
  ) {
    return "Agent";
  }
  if (
    p.seller === "Builder" ||
    p.contactType === "builder" ||
    /^builder$/i.test(String(p.posterRole || ""))
  ) {
    return "Builder";
  }
  return "Owner";
}

export function postedByLine(p) {
  const role = posterRole(p).toLowerCase();
  return `Posted by ${role}`;
}

export function availabilityLine(p) {
  if (!p) return null;
  if (p.mode === "RENT") {
    const raw = [p.availableFrom, p.available, p.possessionStatus].find(
      (value) => hasValue(value),
    );
    if (!raw) return null;
    const text = String(raw).trim();
    if (/^(ready\s*(now|to\s*move)|immediately|immediate)$/i.test(text)) {
      return "Available immediately";
    }
    return text;
  }
  const possession = p.possessionStatus || p.available;
  return hasValue(possession) ? String(possession).trim() : null;
}

/** Furnishing — never invent Unfurnished. */
export function furnishingLabel(p) {
  if (!hasValue(p?.furnishing)) return null;
  const text = String(p.furnishing).trim();
  if (/^(not\s+specified|unknown|—|-)$/i.test(text)) return null;
  return text;
}

/**
 * Guard confirmedAt: ignore missing, invalid, epoch, and future timestamps.
 * Returns { date, recentlyConfirmed } or null.
 */
export function confirmedAvailability(p, now = Date.now()) {
  const raw = p?.confirmedAt;
  if (raw == null || raw === "") return null;
  const t = Date.parse(raw);
  if (!Number.isFinite(t) || t <= 0) return null;
  // Guard 1 Jan 1970 and other epoch-ish values
  if (t < Date.parse("2000-01-01T00:00:00Z")) return null;
  if (t > now + 60_000) return null; // future → not recently confirmed
  return {
    date: new Date(t),
    recentlyConfirmed: now - t <= 14 * 86400000,
    iso: new Date(t).toISOString(),
  };
}

export function recentlyConfirmedSafe(p, now = Date.now()) {
  return confirmedAvailability(p, now)?.recentlyConfirmed === true;
}

/** Known move-in amount from only known rental cost fields. */
export function knownMoveIn(p) {
  if (!p || p.mode !== "RENT") return null;
  const rent = Number(p.price);
  if (!Number.isFinite(rent) || rent <= 0) return null;
  const parts = [{ key: "rent", label: "Monthly rent", amount: rent }];
  const excluded = [];
  const maintenance = Number(p.maintenance);
  if (Number.isFinite(maintenance) && maintenance >= 0) {
    parts.push({
      key: "maintenance",
      label: "Maintenance",
      amount: maintenance,
    });
  } else {
    excluded.push("maintenance");
  }
  const deposit = Number(p.deposit);
  if (Number.isFinite(deposit) && deposit >= 0) {
    parts.push({ key: "deposit", label: "Deposit", amount: deposit });
  } else {
    excluded.push("deposit");
  }
  const brokerage = brokerageAmount(p);
  if (brokerage != null) {
    parts.push({ key: "brokerage", label: "Brokerage", amount: brokerage });
  } else {
    excluded.push("brokerage");
  }
  const total = parts.reduce((sum, row) => sum + row.amount, 0);
  return { parts, excluded, total };
}

export function moveInExclusionNote(excluded) {
  if (!excluded?.length) return null;
  const labels = {
    brokerage: "brokerage",
    deposit: "deposit",
    maintenance: "maintenance",
  };
  const names = excluded.map((key) => labels[key] || key);
  if (names.length === 1) {
    return `Known move-in amount excludes ${names[0]} because it was not provided.`;
  }
  const last = names.pop();
  return `Known move-in amount excludes ${names.join(", ")} and ${last} because they were not provided.`;
}

/** Affirmative-only badge guard: "Not available" must not become a positive chip. */
export function isAffirmativeAvailability(value) {
  if (!hasValue(value)) return false;
  const text = String(value).trim();
  if (/^(no|not\s+available|unavailable|false|none|nil)$/i.test(text)) {
    return false;
  }
  if (/^not\s+included$/i.test(text)) return false;
  return true;
}

/** Meals label that never turns "Not included" into "Included". */
export function mealsDisplay(value) {
  if (!hasValue(value)) return null;
  const text = String(value).trim();
  if (/not\s+included/i.test(text)) return "Not included";
  if (/^included$/i.test(text) || /^meals\s+included$/i.test(text)) {
    return "Included";
  }
  return text;
}

export function mealsIncludedAffirmative(value) {
  if (!hasValue(value)) return false;
  const text = String(value).trim();
  if (/not\s+included/i.test(text)) return false;
  return /included/i.test(text);
}

function compactInr(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n);
  if (abs >= 10000000) return `₹${trimOneDecimal(n / 10000000)}Cr`;
  if (abs >= 100000) return `₹${trimOneDecimal(n / 100000)}L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function trimOneDecimal(value) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** "Saibaba Colony • Residential plot" */
export function landCardTitle(p) {
  const kind = String(p?.landType || p?.subtype || "").trim();
  const plot = !kind ? "Plot" : /plot$/i.test(kind) ? kind : `${kind} plot`;
  const place = String(p?.locality || p?.city || "").trim();
  return place ? `${place} • ${plot}` : plot;
}

export function landCardPrice(p) {
  return compactInr(p?.price);
}

export function landCardRate(p) {
  const cents = toCents(p?.plotArea || p?.area);
  const price = Number(p?.price);
  if (!positive(cents) || !positive(price)) return null;
  return `${compactInr(price / cents)}/cent`;
}

export function landCardArea(p) {
  const area = Number(p?.plotArea || p?.area);
  if (!positive(area)) return null;
  return `${landNumber(toCents(area))} cents • ${Math.round(area).toLocaleString("en-IN")} sq ft`;
}

function landRoadLabel(value) {
  if (!hasValue(value)) return null;
  const text = String(value).trim();
  if (/road/i.test(text)) return text;
  if (/^\d+(\.\d+)?$/.test(text)) return `${text} ft road`;
  if (/ft/i.test(text)) return `${text} road`;
  return text;
}

/** "40 × 62 ft • South-East • 20 ft road" — width × length, only known facts. */
export function landCardFacts(p) {
  const parts = [];
  if (positive(p?.width) && positive(p?.length)) {
    parts.push(`${landNumber(p.width)} × ${landNumber(p.length)} ft`);
  }
  if (hasValue(p?.facing)) parts.push(String(p.facing).trim());
  const road = landRoadLabel(p?.roadWidth);
  if (road) parts.push(road);
  return parts.join(" • ") || null;
}

export function landCardApproval(p) {
  const labels = approvalLabels(p);
  if (!labels.length) {
    return { claimed: false, label: "Approval evidence pending" };
  }
  const name = labels[0].replace(/\s+Approved$/i, "");
  return { claimed: true, label: `${name} claimed by seller` };
}

export function landCardUpdated(p, now = Date.now()) {
  const t = Date.parse(p?.postedAt || p?.createdAt || "");
  if (!Number.isFinite(t) || t <= 0) return null;
  const days = Math.floor((now - t) / 86400000);
  if (days < 0) return null;
  if (days === 0) return "Updated today";
  if (days === 1) return "Updated 1 day ago";
  return `Updated ${days} days ago`;
}

export function landCardFooter(p, now = Date.now()) {
  const role = hasValue(p?.seller) ? String(p.seller).trim() : null;
  return [role, landCardUpdated(p, now)].filter(Boolean).join(" • ") || null;
}

function isLandListing(p) {
  return canonicalizePropertyType(p?.type) === PROPERTY_TYPE.land;
}

function shortListingKind(p) {
  const type = canonicalizePropertyType(p?.type);
  if (type === PROPERTY_TYPE.apartment) return "Apartment";
  if (type === PROPERTY_TYPE.villa) return "Gated Villa";
  if (type === PROPERTY_TYPE.independent_house) return "Independent House";
  if (type === PROPERTY_TYPE.pg) return "PG";
  if (type === PROPERTY_TYPE.commercial) {
    return cardTypeLabel(type, p) || "Commercial";
  }
  return cardTypeLabel(p?.type, p) || p?.type || "Property";
}

/** "RS Puram • 3 BHK Apartment". Land keeps the plot title. */
export function listingCardTitle(p) {
  if (isLandListing(p)) return landCardTitle(p);
  const place = String(p?.locality || p?.city || "").trim();
  const type = canonicalizePropertyType(p?.type);
  const home = [
    PROPERTY_TYPE.apartment,
    PROPERTY_TYPE.villa,
    PROPERTY_TYPE.independent_house,
  ].includes(type);
  const config = home ? configurationLabel(p) : null;
  const kind = config
    ? `${config} ${shortListingKind(p)}`
    : shortListingKind(p);
  return place ? `${place} • ${kind}` : kind;
}

function rentRupees(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "";
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function listingCardPrice(p) {
  if (!p || !Number.isFinite(Number(p.price))) return "";
  if (p.mode === "RENT") return rentRupees(p.price);
  if (Math.abs(Number(p.price)) >= 10000000) {
    return `₹${trimDecimals(Number(p.price) / 10000000, 2)}Cr`;
  }
  return compactInr(p.price);
}

function trimDecimals(value, places) {
  const factor = 10 ** places;
  const rounded = Math.round(value * factor) / factor;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function cardSqft(p) {
  const type = canonicalizePropertyType(p?.type);
  if (type === PROPERTY_TYPE.land) return null;
  if (type === PROPERTY_TYPE.commercial && p.mode === "RENT") {
    if (/land|plot/i.test(String(p.subtype || ""))) {
      const plot = Number(p.area || p.builtUpArea);
      return positive(plot) ? plot : null;
    }
    if (hasValue(p.carpetArea)) return Number(p.carpetArea);
  }
  if (hasValue(p.builtUpArea) || hasValue(p.area)) {
    const n = Number(p.builtUpArea || p.area);
    return positive(n) ? n : null;
  }
  if (hasValue(p.carpetArea)) return Number(p.carpetArea);
  return null;
}

/** Money rates use a pipe. Rent units ("/month") sit beside the amount. */
export function listingCardRate(p) {
  if (!p) return null;
  if (isLandListing(p) && p.mode !== "RENT") {
    const text = landCardRate(p);
    return text ? { text, unit: false } : null;
  }
  if (p.mode === "RENT") {
    const type = canonicalizePropertyType(p.type);
    const text =
      type === PROPERTY_TYPE.pg
        ? p.occupancy === "Private room"
          ? "/room/month"
          : "/bed/month"
        : "/month";
    return { text, unit: true };
  }
  const sqft = cardSqft(p);
  const price = Number(p.price);
  if (!positive(sqft) || !positive(price)) return null;
  return {
    text: `₹${Math.round(price / sqft).toLocaleString("en-IN")}/sq ft`,
    unit: false,
  };
}

export function listingCardArea(p) {
  if (isLandListing(p)) return landCardArea(p);
  const type = canonicalizePropertyType(p?.type);
  const area = areaWithBasis(p);
  if (type === PROPERTY_TYPE.pg) {
    const meals = mealsLine(p.meals);
    return [p.occupancy, area, meals].filter(Boolean).join(" • ") || null;
  }
  if (type === PROPERTY_TYPE.commercial) return area;
  const baths = bathCount(p);
  return [area, baths].filter(Boolean).join(" • ") || null;
}

function bathCount(p) {
  const baths = Number(p?.baths);
  if (!positive(baths)) return null;
  const label = landNumber(baths);
  return `${label} ${baths === 1 ? "bath" : "baths"}`;
}

function mealsLine(value) {
  const meals = mealsDisplay(value);
  if (!meals) return null;
  if (/not\s+included/i.test(meals)) return "Meals not included";
  if (meals === "Included") return "Meals included";
  return meals;
}

export function listingCardFacts(p) {
  if (isLandListing(p)) return landCardFacts(p);
  return null;
}
