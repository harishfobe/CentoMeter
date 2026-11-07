import { SQFT_PER_CENT } from "./LandMeasurements";
import { centers as cityCenters, cityListLabel } from "./data/cities";
import { canonicalizePropertyType } from "./propertyTypeIds";
export const centers = cityCenters;
export { cityListLabel };
export {
  PROPERTY_TYPE,
  canonicalizePropertyType,
} from "./propertyTypeIds";
export function money(value) {
  if (value == null || (typeof value === "string" && !value.trim())) return "—";
  let n;
  try {
    n = Number(value);
  } catch {
    return "—";
  }
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(Number((n / 100000).toFixed(2))) >= 100)
    return "₹" + Number((n / 10000000).toFixed(2)) + " Cr";
  if (Math.abs(n) >= 100000)
    return "₹" + Number((n / 100000).toFixed(2)) + " L";
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
export function indianMobile(value) {
  let n = String(value ?? "")
    .trim()
    .replace(/[\s()-]/g, "");
  if (n.startsWith("+91")) n = n.slice(3);
  else if (n.length === 12 && n.startsWith("91")) n = n.slice(2);
  if (n.length === 11 && n.startsWith("0")) n = n.slice(1);
  return /^[6-9]\d{9}$/.test(n) ? n : null;
}
const text = (value, fallback = "Not specified") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;
const optionalNumber = (value) =>
  value == null ||
  String(value).trim() === "" ||
  !Number.isFinite(Number(value)) ||
  Number(value) < 0
    ? null
    : Number(value);
const numeric = (value) =>
  Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
export function normalizePostedListing(d, profileName = "Property owner") {
  if (
    !d ||
    d.unavailable ||
    !text(d.title, "") ||
    !(Number(d.price) > 0) ||
    !Number.isFinite(Number(d.price)) ||
    !(Number(d.area) > 0) ||
    !Number.isFinite(Number(d.area)) ||
    !Array.isArray(d.location) ||
    d.location.length !== 2 ||
    d.location.some(
      (v) => v === null || v === "" || !Number.isFinite(Number(v)),
    ) ||
    Math.abs(Number(d.location[0])) > 90 ||
    Math.abs(Number(d.location[1])) > 180
  )
    return null;
  const [lat, lng] = d.location.map(Number);
  const city = cityForLocation([lat, lng]);
  if (!city) return null;
  const canonical = canonicalizePropertyType(d.type);
  const type = [
    "Apartment",
    "Independent House",
    "Villa",
    "Land",
    "Commercial",
    "PG",
  ].includes(canonical)
    ? canonical
    : "Apartment";
  const description =
    typeof d.description === "string" ? d.description.trim() : "";
  const rera = text(d.reraNumber, text(d.reraNo, ""));
  const projectName = text(d.projectName, text(d.communityName, ""));
  const plotArea = optionalNumber(d.plotArea);
  const builtUpArea = optionalNumber(d.builtUpArea);
  const carpetArea = optionalNumber(d.carpetArea);
  const balconies = optionalNumber(d.balconies);
  const carParkingNumeric = optionalNumber(d.carParking);
  const carParkingLabel =
    typeof d.carParking === "string" &&
    d.carParking.trim() &&
    !/^\d+(\.\d+)?$/.test(d.carParking.trim())
      ? d.carParking.trim()
      : null;
  const shopCount = optionalNumber(d.shopCount ?? d.shops);
  const monthlyRent = optionalNumber(d.monthlyRent ?? d.rentalIncome);
  const totalFloors = optionalNumber(d.totalFloors);
  const washrooms = optionalNumber(d.washrooms ?? d.baths);
  const frontage = text(d.frontage, "");
  const parking = text(d.parking, carParkingLabel || "");
  const suitableFor = text(d.suitableFor, text(d.suitableUse, ""));
  const commercialHighlights = Array.isArray(d.commercialHighlights)
    ? d.commercialHighlights.filter((x) => typeof x === "string")
    : undefined;
  const negotiable =
    d.negotiable === true ||
    d.negotiable === false ||
    /^yes$/i.test(String(d.negotiable || "").trim()) ||
    /^no$/i.test(String(d.negotiable || "").trim())
      ? d.negotiable === true || /^yes$/i.test(String(d.negotiable || "").trim())
      : undefined;
  const possessionStatus = text(
    d.possessionStatus,
    text(d.available, type === "Land" ? "Ready now" : "Ready to move"),
  );
  const facilities = Array.isArray(d.facilities)
    ? d.facilities.filter((x) => typeof x === "string")
    : type === "Commercial" && Array.isArray(d.features)
      ? d.features.filter((x) => typeof x === "string")
      : undefined;
  return {
    ...d,
    id: String(d.id),
    title: text(d.title),
    type,
    city,
    lat,
    lng,
    locality: text(d.locality, text(d.address, "Posted property")),
    mode: d.intent === "RENT" ? "RENT" : "BUY",
    price: Number(d.price),
    area: Number(d.area),
    beds: ["Land", "Commercial"].includes(type) ? 0 : numeric(d.beds),
    baths: type === "Land" ? 0 : numeric(d.baths),
    deposit: optionalNumber(d.deposit),
    maintenance: optionalNumber(d.maintenance),
    brokerage: optionalNumber(d.brokerage),
    freshness: "Just now",
    description,
    features: Array.isArray(d.features)
      ? d.features.filter((x) => typeof x === "string")
      : [],
    ...(facilities ? { facilities } : {}),
    photos: Array.isArray(d.photos)
      ? d.photos.filter((x) => typeof x === "string")
      : [],
    floor: text(d.floor),
    floorsLabel: text(d.floorsLabel, ""),
    pets: text(d.pets),
    preferredTenant: text(d.preferredTenant, ""),
    community: text(d.community, type === "Villa" ? "Gated" : ""),
    occupancy: text(d.occupancy),
    meals: text(d.meals),
    bathroom: text(d.bathroom),
    ac: text(d.ac),
    housekeeping: text(d.housekeeping, ""),
    electricity: text(d.electricity, ""),
    noticePeriod: text(d.noticePeriod, ""),
    services: Array.isArray(d.services)
      ? d.services.filter((x) => typeof x === "string")
      : undefined,
    pgHighlights: Array.isArray(d.pgHighlights)
      ? d.pgHighlights.filter((x) => typeof x === "string")
      : undefined,
    subtype: text(d.landType, text(d.subtype)),
    facing: text(d.facing),
    water: text(d.water, ""),
    waterSupply: text(d.waterSupply, text(d.water, "")),
    roadWidth: optionalNumber(d.roadWidth),
    roadAccess: text(d.roadAccess, ""),
    powerBackup: text(d.powerBackup, ""),
    plotArea,
    builtUpArea:
      builtUpArea ??
      (["Independent House", "Villa", "Apartment", "Commercial"].includes(type)
        ? Number(d.area)
        : null),
    carpetArea: carpetArea ?? undefined,
    balconies: balconies ?? undefined,
    carParking: carParkingNumeric ?? carParkingLabel ?? undefined,
    shopCount: shopCount ?? undefined,
    monthlyRent: monthlyRent ?? undefined,
    totalFloors: totalFloors ?? undefined,
    washrooms: washrooms ?? undefined,
    frontage: frontage || undefined,
    parking: parking || undefined,
    suitableFor: suitableFor || undefined,
    ...(commercialHighlights?.length ? { commercialHighlights } : {}),
    condition: text(d.condition, ""),
    ownershipType: text(d.ownershipType, ""),
    possessionStatus,
    negotiable,
    projectName: projectName || undefined,
    communityName: projectName || undefined,
    reraNumber: rera || undefined,
    reraNo: rera || undefined,
    image:
      type === "Land" ? "land" : type === "Apartment" ? "apartment" : "villa",
    seller: text(d.seller, "Owner"),
    contactName: text(d.contactName, profileName),
    tag: "Just posted",
    furnishing: text(d.furnishing, ""),
    available: text(
      d.available,
      readyAvailableFromPossession(possessionStatus),
    ),
  };
}

function readyAvailableFromPossession(possessionStatus) {
  if (/within\s*30|under\s*construction/i.test(possessionStatus))
    return "Within 30 days";
  if (/ready/i.test(possessionStatus)) return "Ready now";
  return "Ready now";
}

const postedTime = (p) => {
  const t = Date.parse(p.postedAt || p.createdAt || "");
  return Number.isFinite(t) ? t : 0;
};
export function sortProperties(items, sort = "recommended", unit = "total") {
  const value = (p) =>
    p.type === "Land" && p.mode === "BUY" && unit !== "total"
      ? Number(p.price) /
        (unit === "cent" ? Number(p.area) / SQFT_PER_CENT : Number(p.area))
      : Number(p.price);
  const sqft = (p) =>
    Number(p.area) > 0 ? Number(p.price) / Number(p.area) : Infinity;
  return [...items].sort((a, b) => {
    const tie = String(a.id).localeCompare(String(b.id));
    if (sort === "low") return value(a) - value(b) || tie;
    if (sort === "high") return value(b) - value(a) || tie;
    if (sort === "sqft") return sqft(a) - sqft(b) || tie;
    return (
      postedTime(b) - postedTime(a) ||
      (sort === "recommended" ? value(a) - value(b) : 0) ||
      tie
    );
  });
}

export const hasValue = (value) =>
  value !== undefined &&
  value !== null &&
  String(value).trim() !== "" &&
  !["not specified", "—"].includes(String(value).trim().toLowerCase());

export function emiPayment(principal, rate, years) {
  const amount = Number(principal),
    annual = Number(rate),
    tenure = Number(years);
  if (
    !Number.isFinite(amount) ||
    !Number.isFinite(annual) ||
    !Number.isFinite(tenure) ||
    amount < 0 ||
    annual < 0 ||
    annual > 30 ||
    tenure < 1 ||
    tenure > 40
  )
    return null;
  const months = Math.round(tenure * 12);
  const r = annual / 1200;
  return r === 0
    ? amount / months
    : (amount * r) / (1 - Math.pow(1 + r, -months));
}

export function distanceKm(a, b) {
  const rad = (n) => (n * Math.PI) / 180;
  const dlat = rad(b[0] - a[0]),
    dlng = rad(b[1] - a[1]);
  const h = Math.min(
    1,
    Math.sin(dlat / 2) ** 2 +
      Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dlng / 2) ** 2,
  );
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export function cityForLocation(point) {
  if (
    !Array.isArray(point) ||
    point.length !== 2 ||
    point.some((v) => v == null || v === "" || !Number.isFinite(Number(v))) ||
    Math.abs(Number(point[0])) > 90 ||
    Math.abs(Number(point[1])) > 180
  )
    return null;
  const nearest = Object.keys(centers)
    .map((city) => ({
      city,
      distance: distanceKm(point.map(Number), centers[city]),
    }))
    .sort((a, b) => a.distance - b.distance)[0];
  return nearest.distance <= 60 ? nearest.city : null;
}
